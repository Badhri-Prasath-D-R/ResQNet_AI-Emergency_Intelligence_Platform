import json
import logging
from typing import List, Dict
from fastapi import WebSocket

logger = logging.getLogger("resqnet")

class ConnectionManager:
    def __init__(self):
        # Store active connections grouped by role or simply as a list
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket client connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending direct WebSocket message: {e}")

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        logger.debug(f"Broadcasting message to {len(self.active_connections)} clients")
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Failed to send broadcast to socket: {e}")
                disconnected_clients.append(connection)
        
        # Clean up failed connections
        for client in disconnected_clients:
            self.disconnect(client)

manager = ConnectionManager()
