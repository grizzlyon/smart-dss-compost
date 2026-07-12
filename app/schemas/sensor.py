from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SensorDataCreate(BaseModel):
    device_token: str       # [BARU] ESP32 harus mengirimkan token miliknya ke sini
    temperature: float
    humidity: float
    gas: float

class SensorDataResponse(BaseModel):
    id: int
    device_id: int          # [BARU] Menandakan data ini dari alat yang mana
    temperature: float
    humidity: float
    gas: float
    timestamp: datetime

    class Config:
        from_attributes = True