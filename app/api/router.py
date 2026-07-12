from fastapi import APIRouter
from app.api.endpoints import sensors, auth, devices, monitoring, ml, dss, reports, system, feedback

api_router = APIRouter()

# Rute Utama
api_router.include_router(auth.router, prefix="/users", tags=["users"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(sensors.router, prefix="/iot", tags=["iot"])

# Rute Analitik & Dashboard (Baru)
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"])
api_router.include_router(dss.router, prefix="/dss", tags=["dss"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(system.router,prefix="/system",tags=["System"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])