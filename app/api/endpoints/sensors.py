from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.sensor import SensorDataCreate
from app.services.compost_service import CompostService

from app.api.endpoints.auth import get_current_user 
from app.models.domain import User

router = APIRouter()

@router.post("/data", status_code=201)
def receive_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):
    """Endpoint untuk menerima data dari ESP32"""
    try:
        service = CompostService(db)
        result = service.process_new_sensor_data(data)
        return result
    except ValueError as ve:
        # [BARU] Tangkap error jika device_token tidak dikenali (Alat bodong)
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # [BARU] Memaksa Endpoint ini agar wajib Login
):
    """Endpoint untuk ditarik oleh Chart.js dan UI Dashboard (Hanya Data Milik Sendiri)"""
    service = CompostService(db)
    
    # [BARU] Kirimkan ID user yang sedang login ke service
    summary = service.get_dashboard_summary(user_id=current_user.id)
    
    if not summary:
        raise HTTPException(status_code=404, detail="Data belum tersedia atau Anda belum mendaftarkan alat IoT.")
    return summary