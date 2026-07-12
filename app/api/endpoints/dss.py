from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional # [BARU]

from app.database.session import get_db
from app.models.domain import SensorData, PredictionResult, Device, User # [BARU]
from app.api.endpoints.ml import map_phase_to_key
from app.api.endpoints.auth import get_current_user # [BARU]

router = APIRouter()

@router.get("/recommendation")
def get_dss_recommendation(
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PredictionResult).join(SensorData).join(Device).filter(Device.user_id == current_user.id)
    
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
    pred = query.order_by(desc(PredictionResult.created_at)).first()
    if not pred: return {"status": "no_data"}
    
    sensor = db.query(SensorData).filter(SensorData.id == pred.sensor_data_id).first()
    
    actions = pred.recommendation.replace("Rekomendasi DSS: ", "").split(" | ")
    
    dss_status = "optimal"
    if any("segera" in a.lower() or "terlalu tinggi" in a.lower() or "terlalu rendah" in a.lower() for a in actions):
        dss_status = "perlu_perhatian"
    elif any("tambahkan" in a.lower() or "aduk" in a.lower() for a in actions):
        dss_status = "pantau"
        
    return {
        "status": dss_status,
        "phase": map_phase_to_key(pred.phase),
        "maturity": pred.maturity_score,
        "sensor_snapshot": {
            "temperature": sensor.temperature if sensor else None,
            "humidity": sensor.humidity if sensor else None,
            "gas": sensor.gas if sensor else None,
            "timestamp": sensor.timestamp if sensor else None
        },
        "actions": actions
    }