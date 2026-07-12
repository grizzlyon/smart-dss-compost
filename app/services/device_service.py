from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import Device
from app.schemas.device import DeviceCreate

class DeviceService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_devices(self):
        return self.db.query(Device).all()

    def register_device(self, device_in: DeviceCreate):
        existing_device = self.db.query(Device).filter(Device.device_name == device_in.device_name).first()
        if existing_device:
            raise HTTPException(status_code=400, detail="Perangkat dengan nama ini sudah ada")
        
        db_device = Device(device_name=device_in.device_name, device_status=True)
        self.db.add(db_device)
        self.db.commit()
        self.db.refresh(db_device)
        return db_device

    def update_status(self, device_id: int, status: bool):
        device = self.db.query(Device).filter(Device.id == device_id).first()
        if not device:
            raise HTTPException(status_code=404, detail="Perangkat tidak ditemukan")
        
        device.device_status = status
        self.db.commit()
        self.db.refresh(device)
        return device