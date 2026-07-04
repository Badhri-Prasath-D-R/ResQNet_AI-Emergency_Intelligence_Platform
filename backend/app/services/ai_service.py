import json
import logging
import httpx
from typing import Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
from app.core.database import get_database

logger = logging.getLogger("resqnet")

class AICircuitBreakerError(Exception):
    """Raised when Cloud AI fails and fallback is required."""
    pass

class AIService:
    def __init__(self):
        # Tracking consecutive failures for Cloud AI to implement a runtime circuit breaker
        self.consecutive_failures = 0
        self.max_failures_before_trip = 3

    async def _call_llm_raw(self, system_prompt: str, user_prompt: str, response_format_json: bool = True) -> str:
        """Helper to invoke LLM with current configuration and fallback logic."""
        db = get_database()
        db_config = None
        if db is not None:
            try:
                db_config = await db.settings.find_one({"_id": "ai_config"})
            except Exception as dberr:
                logger.error(f"Error querying DB for dynamic AI config settings: {dberr}")

        if db_config:
            use_cloud = db_config.get("use_cloud_ai", settings.USE_CLOUD_AI)
            # Check if circuit is tripped
            if self.consecutive_failures >= self.max_failures_before_trip:
                logger.warning("Cloud AI circuit breaker tripped! Forcing fallback to local LM Studio.")
                use_cloud = False

            if use_cloud:
                base_url = db_config.get("cloud_ai_base_url", settings.CLOUD_AI_BASE_URL)
                api_key = db_config.get("cloud_ai_api_key", settings.CLOUD_AI_API_KEY)
                model = db_config.get("cloud_ai_model_name", settings.CLOUD_AI_MODEL_NAME)
            else:
                base_url = settings.LM_STUDIO_BASE_URL
                api_key = "not-needed-for-local"
                model = settings.AI_MODEL_NAME
        else:
            use_cloud = settings.USE_CLOUD_AI
            # Check if circuit is tripped
            if self.consecutive_failures >= self.max_failures_before_trip:
                logger.warning("Cloud AI circuit breaker tripped! Forcing fallback to local LM Studio.")
                use_cloud = False

            if use_cloud:
                base_url = settings.CLOUD_AI_BASE_URL
                api_key = settings.CLOUD_AI_API_KEY
                model = settings.CLOUD_AI_MODEL_NAME
            else:
                base_url = settings.LM_STUDIO_BASE_URL
                api_key = "not-needed-for-local"
                model = settings.AI_MODEL_NAME


        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }
        if response_format_json and use_cloud:
            payload["response_format"] = {"type": "json_object"}

        url = f"{base_url.rstrip('/')}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code != 200:
                    raise AICircuitBreakerError(f"HTTP Error {response.status_code}: {response.text}")
                
                # Reset failures on success
                if use_cloud:
                    self.consecutive_failures = 0
                
                result_json = response.json()
                return result_json["choices"][0]["message"]["content"]

        except Exception as e:
            if use_cloud:
                self.consecutive_failures += 1
                logger.error(f"Cloud AI call failed ({self.consecutive_failures}/{self.max_failures_before_trip}): {e}. Attempting local fallback.")
                # Attempt local fallback immediately for this request
                return await self._call_local_fallback(system_prompt, user_prompt, response_format_json)
            else:
                logger.error(f"Local LM Studio call failed: {e}")
                # Return a basic structured mockup response to keep EOC operational
                return self._get_mock_fallback_response(user_prompt)

    async def _call_local_fallback(self, system_prompt: str, user_prompt: str, response_format_json: bool = True) -> str:
        """Explicitly route request to local LM Studio."""
        logger.info("Routing request to local LM Studio fallback...")
        url = f"{settings.LM_STUDIO_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.AI_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }


        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                raise Exception(f"Local fallback returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Local fallback failed: {e}")
            return self._get_mock_fallback_response(user_prompt)

    def _get_mock_fallback_response(self, user_prompt: str) -> str:
        """Returns structured JSON fallback when all LLMs are unreachable."""
        # Simple heuristic classification
        prompt_lower = user_prompt.lower()
        incident_type = "building_fire"
        if "flood" in prompt_lower or "water" in prompt_lower:
            incident_type = "flood"
        elif "earthquake" in prompt_lower or "quake" in prompt_lower:
            incident_type = "earthquake"
        elif "cyclone" in prompt_lower or "wind" in prompt_lower:
            incident_type = "cyclone"
        elif "chemical" in prompt_lower or "leak" in prompt_lower:
            incident_type = "chemical_leak"
        elif "power" in prompt_lower or "outage" in prompt_lower:
            incident_type = "power_outage"

        mock_data = {
            "summary": f"Incident auto-processed due to AI service disruption: {user_prompt[:60]}...",
            "incident_type": incident_type,
            "urgency": "high" if "critical" in prompt_lower or "injured" in prompt_lower or "fire" in prompt_lower else "medium",
            "people_affected": 5,
            "medical_severity": 6 if "injured" in prompt_lower else 3,
            "vulnerability_score": 5,
            "confidence": 0.5,
            "recommended_resources": [
                {"type": "ambulance" if "injured" in prompt_lower else "fire_truck", "quantity": 1}
            ],
            "explanation": "Automatic processing fallback triggered due to API connection failure."
        }
        return json.dumps(mock_data)

    async def analyze_incident(self, title: str, description: str) -> Dict[str, Any]:
        """
        Orchestrates Graph-based Multi-Agent AI Workflow.
        Executes Agents sequentially and performs resource availability check for cyclical updates.
        """
        logger.info(f"Analyzing incident report: {title}")
        
        # --- AGENT 1: Classification & Core Analysis ---
        system_prompt = (
            "You are the ResQNet AI Incident Classifier. Analyze the incident title and description. "
            "Respond ONLY with a JSON object matching this schema exactly:\n"
            "{\n"
            "  \"summary\": \"concise incident summary\",\n"
            "  \"incident_type\": \"flood|cyclone|earthquake|building_fire|power_outage|chemical_leak|traffic_accident|mass_gathering\",\n"
            "  \"urgency\": \"low|medium|high|critical\",\n"
            "  \"people_affected\": integer,\n"
            "  \"medical_severity\": integer (1-10),\n"
            "  \"vulnerability_score\": integer (1-10),\n"
            "  \"confidence\": float (0.0-1.0),\n"
            "  \"recommended_resources\": [{\"type\": \"ambulance|fire_truck|rescue_boat|helicopter|generator|food|water|volunteer\", \"quantity\": integer}],\n"
            "  \"explanation\": \"reasons for decision\"\n"
            "}"
        )
        user_prompt = f"Title: {title}\nDescription: {description}"
        
        raw_response = await self._call_llm_raw(system_prompt, user_prompt)
        try:
            analysis = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Error parsing LLM JSON: {e}. Raw response: {raw_response}")
            analysis = json.loads(self._get_mock_fallback_response(user_prompt))

        # Ensure types are correct
        analysis["people_affected"] = int(analysis.get("people_affected", 0))
        analysis["medical_severity"] = int(analysis.get("medical_severity", 0))
        analysis["vulnerability_score"] = int(analysis.get("vulnerability_score", 0))
        analysis["confidence"] = float(analysis.get("confidence", 0.5))
        if not isinstance(analysis.get("recommended_resources"), list):
            analysis["recommended_resources"] = []

        # --- AGENT 2 & 3: Resource Availability & Priority Cyclical Recalibration ---
        # Check resources locally in MongoDB to see if we have available assets
        db = get_database()
        out_of_stock = False
        recalibrated = False

        if db is not None:
            for rec in analysis["recommended_resources"]:
                r_type = rec.get("type")
                r_qty = rec.get("quantity", 1)
                
                # Query available count
                resource_record = await db.resources.find_one({"resource_type": r_type})
                if not resource_record or resource_record.get("availability", 0) < r_qty:
                    out_of_stock = True
                    break

        # Cyclical Logic: If resources are out of stock, trigger Urgency Upgrade & Recalibration Agent
        if out_of_stock:
            logger.warning(f"Resources recommended by AI are out of stock! Tripping cyclical urgency re-evaluation.")
            recalibrated = True
            
            recal_prompt = (
                f"The recommended resources ({analysis['recommended_resources']}) are currently out of stock locally.\n"
                f"Current Incident Analysis:\n{json.dumps(analysis)}\n"
                "Re-evaluate the incident. Increase the urgency level, elevate vulnerability/medical severity scores, "
                "and explain that assets must be requested from regional partners. "
                "Respond ONLY with a JSON object updating: urgency (must be high or critical), "
                "medical_severity (increase by 1-2 points), vulnerability_score, and explanation."
            )
            recal_sys = "You are the Priority Scoring & Urgency Escalation Agent."
            recal_raw = await self._call_llm_raw(recal_sys, recal_prompt)
            try:
                recal_data = json.loads(recal_raw)
                analysis["urgency"] = recal_data.get("urgency", "critical")
                analysis["medical_severity"] = min(10, recal_data.get("medical_severity", analysis["medical_severity"] + 1))
                analysis["explanation"] = recal_data.get("explanation", analysis["explanation"]) + " (Recalibrated: local assets exhausted; regional aid required.)"
            except Exception as e:
                logger.error(f"Failed to parse recalibrated agent response: {e}")
                analysis["urgency"] = "critical"
                analysis["explanation"] += " (Auto-Recalibrated: assets exhausted.)"

        # --- AGENT 4: Emergency Broadcast Generator ---
        # Generate official EOC alert message
        broadcast_sys = "You are the ResQNet Emergency Broadcast Generator."
        broadcast_prompt = (
            f"Generate an emergency alert message for this incident.\n"
            f"Type: {analysis['incident_type']}\nUrgency: {analysis['urgency']}\nDescription: {description}\n"
            f"Resource Status: {'LOCAL ASSETS EXHAUSTED - ALERT REGIONAL PARTNERS' if recalibrated else 'Dispatching local assets'}\n"
            "Return a JSON object: {\"broadcast_message\": \"text of the message to broadcast to public and responders\"}"
        )
        broadcast_raw = await self._call_llm_raw(broadcast_sys, broadcast_prompt)
        try:
            broadcast_data = json.loads(broadcast_raw)
            analysis["broadcast_message"] = broadcast_data.get("broadcast_message", f"ALERT: {title} - Urgency {analysis['urgency'].upper()}")
        except Exception:
            analysis["broadcast_message"] = f"ALERT: {title} - {analysis['urgency'].upper()} urgency. Please stay alert."

        return analysis

ai_service = AIService()
