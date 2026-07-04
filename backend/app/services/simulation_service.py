import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from app.core.database import get_database
from app.services.websocket_manager import manager
from app.services.ai_service import ai_service
from app.models.common import GeoJSONPoint

logger = logging.getLogger("resqnet")

INCIDENT_TYPES = ["flood", "cyclone", "earthquake", "building_fire", "power_outage", "chemical_leak", "traffic_accident", "mass_gathering"]
SHELTER_LOCATIONS = [
    [80.2000, 13.0400], [80.2100, 13.0500], [80.2200, 13.0600], [80.2300, 13.0700]
]

TAMIL_NADU_CITIES = [
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2000},
    {"name": "Coimbatore", "lat": 11.0168, "lng": 76.9558},
    {"name": "Madurai", "lat": 9.9252, "lng": 78.1198},
    {"name": "Tiruchirappalli", "lat": 10.7905, "lng": 78.7047},
    {"name": "Salem", "lat": 11.6643, "lng": 78.1460},
    {"name": "Tirunelveli", "lat": 8.7139, "lng": 77.7567},
    {"name": "Vellore", "lat": 12.9165, "lng": 79.1325},
    {"name": "Erode", "lat": 11.3410, "lng": 77.7172},
    {"name": "Thanjavur", "lat": 10.7870, "lng": 79.1378},
    {"name": "Dindigul", "lat": 10.3673, "lng": 77.9803},
    {"name": "Kanchipuram", "lat": 12.8342, "lng": 79.7036},
    {"name": "Tiruppur", "lat": 11.1085, "lng": 77.3411},
    {"name": "Nagercoil", "lat": 8.1833, "lng": 77.4119},
    {"name": "Cuddalore", "lat": 11.7480, "lng": 79.7500},
]

def get_random_coords(radius=0.04):
    city = random.choice(TAMIL_NADU_CITIES)
    lat_offset = random.uniform(-radius, radius)
    lng_offset = random.uniform(-radius, radius)
    if city["name"] in ["Chennai", "Cuddalore"]:
        lng_offset = random.uniform(-0.08, -0.01)
    return [city["lng"] + lng_offset, city["lat"] + lat_offset]


class SimulationEngine:
    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self.loop_task: Optional[asyncio.Task] = None
        self.tick_rate_seconds = 5 # simulation ticks every 5 seconds

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.is_paused = False
            self.loop_task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulation engine started.")
            return True
        return False

    def pause(self):
        if self.is_running and not self.is_paused:
            self.is_paused = True
            logger.info("Simulation engine paused.")
            return True
        return False

    def resume(self):
        if self.is_running and self.is_paused:
            self.is_paused = False
            logger.info("Simulation engine resumed.")
            return True
        return False

    def stop(self):
        if self.is_running:
            self.is_running = False
            self.is_paused = False
            if self.loop_task:
                self.loop_task.cancel()
                self.loop_task = None
            logger.info("Simulation engine stopped.")
            return True
        return False

    async def _simulation_loop(self):
        """Simulation tick loop running in background."""
        while self.is_running:
            if not self.is_paused:
                try:
                    await self._process_tick()
                except Exception as e:
                    logger.error(f"Error during simulation tick: {e}")
            await asyncio.sleep(self.tick_rate_seconds)

    async def _process_tick(self):
        """Performs operations for a single simulation tick."""
        db = get_database()
        if db is None:
            logger.error("Database connection not ready for simulation tick.")
            return

        # 1. 20% chance to generate a new incident
        if random.random() < 0.20:
            await self._generate_simulated_incident(db)

        # 2. Advance Dispatch Statuses (Simulate ETA and resources arriving/completing)
        await self._advance_dispatches(db)

        # 3. Broadcast status update
        await manager.broadcast({
            "type": "SIMULATION_TICK",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "running"
        })

    async def _generate_simulated_incident(self, db):
        incident_type = random.choice(INCIDENT_TYPES)
        lng, lat = get_random_coords()

        descriptions = {
            "flood": "Heavy rains have overflowed local canals. Low-lying streets submerged under 3 feet of water.",
            "cyclone": "Gale winds up to 90km/h blowing down trees and electricity lines near the coastline.",
            "earthquake": "Tremors felt across the residential block. Visible cracks in multiple building structures.",
            "building_fire": "Electrical short circuit on the second floor of a commercial building. Thick smoke rising.",
            "power_outage": "Grid failure after local substation transformer explosion. Multiple blocks without power.",
            "chemical_leak": "Industrial storage tank leak emitting strong irritating gas. Neighborhood complaining of breathing difficulties.",
            "traffic_accident": "Multi-car collision on main arterial highway causing traffic gridlock and potential injuries.",
            "mass_gathering": "Sudden crowd crush at open festival grounds. Medical assistance requested immediately."
        }

        title = f"Simulated {incident_type.replace('_', ' ').title()}"
        description = descriptions[incident_type]
        
        # Analyze with AI
        ai_result = await ai_service.analyze_incident(title, description)
        
        incident_doc = {
            "title": title,
            "description": description,
            "incident_type": incident_type,
            "location": {
                "type": "Point",
                "coordinates": [lng, lat]
            },

            "ai_summary": ai_result["summary"],
            "urgency": ai_result["urgency"],
            "people_affected": ai_result["people_affected"],
            "medical_severity": ai_result["medical_severity"],
            "vulnerability_score": ai_result["vulnerability_score"],
            "ai_confidence": ai_result["confidence"],
            "status": "reported",
            "assigned_resources": [],
            "explanation": ai_result["explanation"],
            "recommended_resources": ai_result["recommended_resources"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db.incidents.insert_one(incident_doc)
        incident_doc["_id"] = str(result.inserted_id)
        # Convert datetime objects to strings
        incident_doc["created_at"] = incident_doc["created_at"].isoformat()
        incident_doc["updated_at"] = incident_doc["updated_at"].isoformat()

        # Broadcast to all clients
        await manager.broadcast({
            "type": "INCIDENT_UPDATE",
            "action": "created",
            "data": incident_doc
        })
        logger.info(f"Simulated incident generated: {title} at [{lng}, {lat}]")

    async def _advance_dispatches(self, db):
        """Advances the status of dispatches: en_route -> arrived -> completed."""
        now = datetime.utcnow()
        
        # Find active dispatches
        cursor = db.dispatch_history.find({"status": {"$in": ["en_route", "arrived"]}})
        dispatches = await cursor.to_list(length=100)

        for dispatch in dispatches:
            d_id = dispatch["_id"]
            current_status = dispatch["status"]
            dispatched_at = dispatch["dispatched_at"]
            eta_mins = dispatch.get("eta_minutes", 10)
            
            # Simple simulation tick advances:
            # en_route -> arrived after 2 ticks (approx 10-15 seconds) or based on simulated elapsed time
            elapsed = (now - dispatched_at).total_seconds()
            
            if current_status == "en_route" and elapsed > 15: # Arrived after 15 seconds
                await db.dispatch_history.update_one(
                    {"_id": d_id},
                    {
                        "$set": {"status": "arrived", "arrived_at": now},
                        "$push": {
                            "audit_trail": {
                                "timestamp": now,
                                "action": "Resource arrived at incident site.",
                                "user": "Simulation Engine"
                            }
                        }
                    }
                )
                # Update resource deployment status if possible
                await db.resources.update_one(
                    {"_id": ObjectId(dispatch["resource_id"])},
                    {"$set": {"deployment_status": "deployed"}}
                )

                # Broadcast resource arrived update
                await manager.broadcast({
                    "type": "ALERT",
                    "title": "Resource Arrived",
                    "message": f"Resource {dispatch['resource_type']} arrived at incident site.",
                    "timestamp": now.isoformat()
                })
                logger.info(f"Dispatch {d_id} advanced to arrived.")

            elif current_status == "arrived" and elapsed > 35: # Completed after another 20 seconds
                await db.dispatch_history.update_one(
                    {"_id": d_id},
                    {
                        "$set": {"status": "completed", "completed_at": now},
                        "$push": {
                            "audit_trail": {
                                "timestamp": now,
                                "action": "Incident resolved. Resource released.",
                                "user": "Simulation Engine"
                            }
                        }
                    }
                )

                # Return resource to available stock
                res_id = ObjectId(dispatch["resource_id"])
                res_qty = dispatch["quantity"]
                await db.resources.update_one(
                    {"_id": res_id},
                    {
                        "$inc": {"availability": res_qty},
                        "$set": {"deployment_status": "idle"}
                    }
                )

                # Update incident status to resolved if all dispatches are completed
                inc_id = ObjectId(dispatch["incident_id"])
                # We can mark it resolved
                await db.incidents.update_one(
                    {"_id": inc_id},
                    {
                        "$set": {"status": "resolved", "updated_at": now}
                    }
                )

                # Broadcast completion update
                await manager.broadcast({
                    "type": "ALERT",
                    "title": "Incident Resolved",
                    "message": f"Incident {dispatch['incident_id']} has been resolved by {dispatch['resource_type']}.",
                    "timestamp": now.isoformat()
                })
                logger.info(f"Dispatch {d_id} advanced to completed. Resource returned.")

simulation_engine = SimulationEngine()
