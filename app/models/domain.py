from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship # Pastikan baris ini ditambahkan
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' atau 'user'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi: 1 User bisa memiliki banyak Device
    devices = relationship("Device", back_populates="owner", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Mengikat Device ke User tertentu
    name = Column(String, unique=True, index=True, nullable=False)
    device_token = Column(String, unique=True, index=True, nullable=False) # Kunci rahasia untuk ESP32
    ip_address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relasi balik ke User dan maju ke SensorData
    owner = relationship("User", back_populates="devices")
    sensor_data = relationship("SensorData", back_populates="device", cascade="all, delete-orphan")

class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False) # Mengikat Data ke Device tertentu
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    gas = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relasi balik ke Device dan maju ke PredictionResult
    device = relationship("Device", back_populates="sensor_data")
    prediction = relationship("PredictionResult", back_populates="sensor_data", uselist=False, cascade="all, delete-orphan")
    
class PredictionResult(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"))
    phase = Column(String, nullable=False)
    maturity_score = Column(Float, nullable=False)
    recommendation = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi balik ke SensorData
    sensor_data = relationship("SensorData", back_populates="prediction")
    
    
class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    category = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    