from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.models.domain import SensorData, PredictionResult, Device, User
from app.api.endpoints.auth import get_current_user

router = APIRouter()

# Pastikan path di sini cocok dengan apa yang dipanggil di JS
@router.get("/latest")
def get_latest_sensor(
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SensorData).join(Device).filter(Device.user_id == current_user.id)
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
    
    # .first() bisa mengembalikan None, itu normal jika data kosong
    return query.order_by(desc(SensorData.timestamp)).first()

@router.get("/history")
def get_sensor_history(
    limit: int = 20, 
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SensorData).join(Device).filter(Device.user_id == current_user.id)
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
    return query.order_by(desc(SensorData.timestamp)).limit(limit).all()

@router.delete("/{sensor_id}")
def delete_sensor_history(
    sensor_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sensor = db.query(SensorData).join(Device).filter(
        SensorData.id == sensor_id,
        Device.user_id == current_user.id
    ).first()
    
    if not sensor:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    
    prediction = db.query(PredictionResult).filter(PredictionResult.sensor_data_id == sensor_id).first()
    if prediction:
        db.delete(prediction)
        
    db.delete(sensor)
    db.commit()
    return {"status": "success"}