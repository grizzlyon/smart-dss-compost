from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.domain import SensorData, PredictionResult, Device # [BARU] Import model Device
from app.schemas.sensor import SensorDataCreate

class CompostRepository:
    def __init__(self, db: Session):
        self.db = db

    # [BARU] Tambahkan parameter device_id di sini
    def save_sensor_data(self, data: SensorDataCreate, device_id: int) -> SensorData:
        """Menyimpan data mentah dari sensor IoT ke tabel sensor_data"""
        db_sensor = SensorData(
            device_id=device_id, # [BARU] Kaitkan data ini dengan perangkat spesifik
            temperature=data.temperature,
            humidity=data.humidity,
            gas=data.gas
        )
        self.db.add(db_sensor)
        self.db.commit()
        self.db.refresh(db_sensor)
        return db_sensor

    def save_prediction(
        self, sensor_id: int, phase: str, maturity: float, recommendation: str
    ) -> PredictionResult:
        """Menyimpan hasil ML dan DSS ke tabel predictions"""
        db_prediction = PredictionResult(
            sensor_data_id=sensor_id,
            phase=phase,
            maturity_score=maturity,
            recommendation=recommendation
        )
        self.db.add(db_prediction)
        self.db.commit()
        self.db.refresh(db_prediction)
        return db_prediction

    # [BARU] Tambahkan parameter user_id di sini
    def get_latest_sensor_with_prediction(self, user_id: int):
        """Mengambil data sensor dan prediksi paling baru untuk Dashboard berdasarkan User"""
        
        # [BARU] Lakukan query JOIN ke tabel Device untuk memastikan pemiliknya cocok
        latest_sensor = (
            self.db.query(SensorData)
            .join(Device, SensorData.device_id == Device.id)
            .filter(Device.user_id == user_id)
            .order_by(desc(SensorData.timestamp))
            .first()
        )
        
        if not latest_sensor:
            return None
            
        latest_prediction = (
            self.db.query(PredictionResult)
            .filter(PredictionResult.sensor_data_id == latest_sensor.id)
            .first()
        )
        
        return {
            "sensor": latest_sensor,
            "prediction": latest_prediction
        }