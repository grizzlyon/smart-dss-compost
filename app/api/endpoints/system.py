from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.domain import (
    User,
    Device,
    PredictionResult
)

router = APIRouter()


@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):

    total_users = db.query(User).count()

    total_devices = db.query(Device).count()

    total_predictions = db.query(PredictionResult).count()

    return {
        "users": total_users,
        "devices": total_devices,
        "features": 6,
        "predictions": total_predictions
    }