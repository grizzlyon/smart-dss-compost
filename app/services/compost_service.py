from sqlalchemy.orm import Session
from app.repositories.compost_repo import CompostRepository
from app.schemas.sensor import SensorDataCreate
from app.services.dss_service import DSSService
from app.ml.predictor import MLPredictor  
from app.models.domain import Device

class CompostService:
    def __init__(self, db: Session):
        self.db = db 
        self.repo = CompostRepository(db)
        self.ml_predictor = MLPredictor() 

    def process_new_sensor_data(self, data: SensorDataCreate) -> dict:
        # 1. Validasi Token Device
        device = self.db.query(Device).filter(Device.device_token == data.device_token).first()
        if not device:
            raise ValueError("Token perangkat tidak valid atau perangkat belum didaftarkan.")

        # 2. Simpan data sensor ke DB
        sensor_record = self.repo.save_sensor_data(data, device_id=device.id)
        
        # [PERBAIKAN] 3. Prediksi Machine Learning dengan Pendeteksi Kamus (Dictionary)
        ml_result = self.ml_predictor.predict(
            temperature=data.temperature,
            humidity=data.humidity,
            gas=data.gas
        )
        
        if isinstance(ml_result, dict):
            predicted_phase = str(ml_result.get("label", "Fase Awal"))
            predicted_maturity = float(ml_result.get("score", 0.0))
        else:
            predicted_phase = str(ml_result[0])
            predicted_maturity = float(ml_result[1])
        
        # 4. Generate Rekomendasi DSS
        dss_recommendation = DSSService.generate_recommendation(
            temperature=data.temperature,
            humidity=data.humidity,
            gas=data.gas,
            maturity_score=predicted_maturity
        )
        
        # 5. Simpan hasil prediksi
        prediction_record = self.repo.save_prediction(
            sensor_id=sensor_record.id,
            phase=predicted_phase,
            maturity=predicted_maturity,
            recommendation=dss_recommendation
        )
        
        # 6. Update status alat IoT menjadi 'Online'
        device.is_online = True
        self.db.commit()
        
        # 7. Kembalikan Response
        return {
            "status": "success",
            "sensor_data": sensor_record,
            "prediction": prediction_record
        }

    def get_dashboard_summary(self, user_id: int):
        return self.repo.get_latest_sensor_with_prediction(user_id=user_id)