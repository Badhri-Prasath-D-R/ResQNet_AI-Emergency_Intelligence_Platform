from fastapi import APIRouter, HTTPException, Depends
from app.services.simulation_service import simulation_engine
from app.core.security import get_current_user

router = APIRouter()

@router.post("/simulate/start")
async def start_simulation(current_user: dict = Depends(get_current_user)):
    started = simulation_engine.start()
    if not started:
        return {
            "success": False,
            "message": "Simulation is already running",
            "data": {},
            "errors": []
        }
    return {
        "success": True,
        "message": "Simulation engine initialized",
        "data": {"status": "running"},
        "errors": []
    }

@router.post("/simulate/stop")
async def stop_simulation(current_user: dict = Depends(get_current_user)):
    stopped = simulation_engine.stop()
    if not stopped:
        return {
            "success": False,
            "message": "Simulation is not running",
            "data": {},
            "errors": []
        }
    return {
        "success": True,
        "message": "Simulation engine stopped",
        "data": {"status": "stopped"},
        "errors": []
    }

@router.post("/simulate/pause")
async def pause_simulation(current_user: dict = Depends(get_current_user)):
    paused = simulation_engine.pause()
    if not paused:
        return {
            "success": False,
            "message": "Simulation cannot be paused (either not running or already paused)",
            "data": {},
            "errors": []
        }
    return {
        "success": True,
        "message": "Simulation paused",
        "data": {"status": "paused"},
        "errors": []
    }

@router.post("/simulate/resume")
async def resume_simulation(current_user: dict = Depends(get_current_user)):
    resumed = simulation_engine.resume()
    if not resumed:
        return {
            "success": False,
            "message": "Simulation cannot be resumed (either not running or not paused)",
            "data": {},
            "errors": []
        }
    return {
        "success": True,
        "message": "Simulation resumed",
        "data": {"status": "running"},
        "errors": []
    }
