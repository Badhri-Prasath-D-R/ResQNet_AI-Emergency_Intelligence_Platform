import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1.router import router as api_v1_router
from app.services.websocket_manager import manager
from app.services.simulation_service import simulation_engine

logger = logging.getLogger("resqnet")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_to_mongo()
    yield
    # Shutdown actions
    simulation_engine.stop()
    await close_mongo_connection()

app = FastAPI(
    title="ResQNet AI - Emergency Intelligence Platform API",
    description="EOC Tactical Command & Decision Support System backend API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routes
app.include_router(api_v1_router, prefix="/api")

# Root status route
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "ResQNet AI API Operational",
        "data": {
            "status": "healthy",
            "db_configured": settings.MONGO_URI is not None,
            "cloud_ai_active": settings.USE_CLOUD_AI
        },
        "errors": []
    }

# WebSockets Entrypoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep socket open and listen for client frames (if any)
            data = await websocket.receive_text()
            # Echo or process custom ping-pongs
            await websocket.send_json({"type": "PONG", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
