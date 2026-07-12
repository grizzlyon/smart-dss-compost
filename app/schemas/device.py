from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeviceCreate(BaseModel):
    name: str
    ip_address: Optional[str] = None
    location: Optional[str] = None

class DeviceResponse(BaseModel):
    id: int
    user_id: int            
    name: str
    device_token: str       
    ip_address: Optional[str]
    location: Optional[str]
    is_online: bool
    last_seen: Optional[datetime]

    class Config:
        from_attributes = True