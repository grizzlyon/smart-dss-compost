from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func # [PERBAIKAN] Import func untuk timestamp ping
import secrets 
import random # Untuk simulasi scan jaringan
import asyncio

from app.database.session import get_db
from app.schemas.device import DeviceCreate, DeviceResponse
from app.models.domain import Device, User
from app.api.endpoints.auth import get_current_user 

router = APIRouter()

@router.post("/register", response_model=DeviceResponse)
def register_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mendaftarkan perangkat baru milik user yang sedang login"""
    new_token = secrets.token_hex(16) 
    
    new_device = Device(
        user_id=current_user.id,
        device_token=new_token,
        name=device_in.name,
        ip_address=device_in.ip_address,
        location=device_in.location
    )
    
    try:
        db.add(new_device)
        db.commit()
        db.refresh(new_device)
        return new_device
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal mendaftarkan perangkat: {str(e)}")


@router.get("/", response_model=list[DeviceResponse])
def get_my_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mengambil daftar perangkat HANYA milik user yang sedang login"""
    devices = db.query(Device).filter(Device.user_id == current_user.id).all()
    return devices


# ═══════════════════════════════════════════════════════════
#  [BARU] ENDPOINT SCAN JARINGAN (SIMULASI/PLACEHOLDER)
# ═══════════════════════════════════════════════════════════
@router.get("/scan")
async def scan_local_network(current_user: User = Depends(get_current_user)):
    """Memindai perangkat IoT di jaringan lokal (Simulasi untuk saat ini)"""
    # Memberikan efek delay seolah sedang memindai jaringan
    await asyncio.sleep(1.5)
    
    # Karena kita belum punya script Network Scanner asli (seperti Nmap),
    # kita kirimkan data kosong atau simulasi agar Frontend tidak error.
    return {
        "scanned": 254,
        "found": [] # Bisa diisi simulasi misal: [{"ip": "192.168.1.100", "port": 80}]
    }


# ═══════════════════════════════════════════════════════════
#  [PERBAIKAN] KEAMANAN PING DAN DELETE (WAJIB MILIK USER)
# ═══════════════════════════════════════════════════════════
@router.put("/{device_id}/ping")
def ping_device(
    device_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # [PENTING] Kunci dengan JWT
):
    """Memperbarui status last_seen perangkat saat di-ping"""
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.user_id == current_user.id # [PENTING] Pastikan ini alat miliknya
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Perangkat tidak ditemukan atau bukan milik Anda")
    
    device.is_online = True
    device.last_seen = func.now()
    db.commit()
    return {"status": "success"}


@router.delete("/{device_id}")
def delete_device(
    device_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # [PENTING] Kunci dengan JWT
):
    """Menghapus perangkat dari database"""
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.user_id == current_user.id # [PENTING] Pastikan ini alat miliknya
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Perangkat tidak ditemukan atau bukan milik Anda")
    
    db.delete(device)
    db.commit()
    
    return {"status": "success", "detail": "Perangkat berhasil dihapus"}