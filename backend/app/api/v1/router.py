from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.resources import router as resources_router
from app.api.v1.shelters import router as shelters_router
from app.api.v1.dispatch import router as dispatch_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.settings import router as settings_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(incidents_router, tags=["Incidents"])
router.include_router(resources_router, tags=["Resources"])
router.include_router(shelters_router, tags=["Shelters"])
router.include_router(dispatch_router, tags=["Dispatch"])
router.include_router(simulation_router, tags=["Simulation"])
router.include_router(settings_router, tags=["Settings"])
