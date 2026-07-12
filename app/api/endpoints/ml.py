from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
import traceback

from app.database.session import get_db
from app.models.domain import SensorData, PredictionResult, Device, User
from app.ml.predictor import MLPredictor
from app.services.dss_service import DSSService
from app.api.endpoints.auth import get_current_user 

router = APIRouter()
predictor = MLPredictor()

PHASES_INFO = {
    "awal": {"label": "Fase Awal (Mesofilik)", "icon": "🌱", "expected_duration_weeks": "Minggu 1-2", "description": "Suhu mulai naik, mikroorganisme mesofilik memecah senyawa organik mudah larut."},
    "aktif": {"label": "Fase Aktif (Termofilik)", "icon": "🔥", "expected_duration_weeks": "Minggu 2-4", "description": "Suhu puncak. Patogen dan gulma mati. Dekomposisi bahan kompleks terjadi cepat."},
    "matang": {"label": "Fase Pematangan", "icon": "✅", "expected_duration_weeks": "Minggu 5+", "description": "Suhu turun kembali stabil. Humus terbentuk. Kompos siap digunakan."}
}

def map_phase_to_key(phase_str):
    p = str(phase_str).lower()
    # Ini akan sangat cocok dengan label "Mentah", "Fase Termofilik", dan "Matang" dari MLPredictor Anda
    if "termofilik" in p or "aktif" in p: return "aktif"
    if "matang" in p: return "matang"
    return "awal"

@router.get("/latest")
def get_latest_prediction(
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PredictionResult).join(SensorData).join(Device).filter(Device.user_id == current_user.id)
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
    pred = query.order_by(desc(PredictionResult.created_at)).first()
    if not pred: return None
    
    phase_key = map_phase_to_key(pred.phase)
    return {
        "id": pred.id,
        "phase": phase_key,
        "phase_label": PHASES_INFO[phase_key]["label"],
        "phase_description": PHASES_INFO[phase_key]["description"],
        "maturity": pred.maturity_score,
        "created_at": pred.created_at
    }

@router.get("/phases")
def get_phases_info():
    return PHASES_INFO

@router.post("/predict")
def run_prediction(
    last_n: int = 20, 
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SensorData).join(Device).filter(Device.user_id == current_user.id)
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
    latest = query.order_by(desc(SensorData.timestamp)).first()
    if not latest: 
        raise HTTPException(status_code=400, detail="Tidak ada data sensor pada perangkat ini")
    
    try:
        # 1. Panggil model ML
        result = predictor.predict(latest.temperature, latest.humidity, latest.gas)
        
        # 2. Ambil nilai menggunakan KUNCI YANG TEPAT dari predictor.py Anda
        phase = result["label"]      # Mengambil "Mentah" / "Fase Termofilik" / "Matang"
        maturity = result["score"]   # Mengambil angka float (misal: 85.5)
        
        # 3. Masukkan ke DSS
        recommendation = DSSService.generate_recommendation(latest.temperature, latest.humidity, latest.gas, float(maturity))
        
        new_pred = PredictionResult(
            sensor_data_id=latest.id, phase=str(phase), maturity_score=float(maturity), recommendation=recommendation
        )
        db.add(new_pred)
        db.commit()
        return {"status": "success"}
        
    except Exception as e:
        db.rollback()
        print(f"DEBUG ML ERROR FULL:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gagal prediksi: {str(e)}")


@router.post("/classify")
def run_detailed_classification(
    last_n: int = 20, 
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SensorData).join(Device).filter(Device.user_id == current_user.id)
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
    latest = query.order_by(desc(SensorData.timestamp)).first()
    if not latest: raise HTTPException(status_code=400, detail="Tidak ada data")
    
    try:
        # 1. Panggil model ML
        result = predictor.predict(latest.temperature, latest.humidity, latest.gas)
        
        # 2. Ambil nilai menggunakan KUNCI YANG TEPAT
        phase = result["label"]
        maturity = result["score"]
            
        phase_key = map_phase_to_key(phase)
        
        all_phases = {k: {"icon": v["icon"], "label": v["label"], "is_current": (k == phase_key)} for k, v in PHASES_INFO.items()}
        maturity_status = "Matang dan siap digunakan." if float(maturity) >= 80 else "Masih dalam proses pengomposan. Lakukan monitoring berkala."
        
        return {
            "all_phases": all_phases,
            "classification": PHASES_INFO[phase_key],
            "maturity_percent": float(maturity),
            "maturity_status": maturity_status
        }
    except Exception as e:
        print(f"DEBUG CLASSIFY ERROR FULL:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan saat klasifikasi.")