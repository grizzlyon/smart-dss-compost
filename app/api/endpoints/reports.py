from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional # [BARU]
import csv
import io

from app.database.session import get_db
from app.models.domain import SensorData, PredictionResult, Device, User # [BARU]
from app.api.endpoints.auth import get_current_user # [BARU]

router = APIRouter()
@router.get("/export")
def export_csv(
    limit: int = 500, 
    device_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    # Gabungkan dengan tabel Device untuk memastikan privasi user
    query = db.query(SensorData, PredictionResult)\
        .join(Device, SensorData.device_id == Device.id)\
        .outerjoin(PredictionResult, SensorData.id == PredictionResult.sensor_data_id)\
        .filter(Device.user_id == current_user.id)
        
    device_name_file = "semua_alat"
    device_name_display = "Semua Perangkat (Tercampur)"
    
    # Filter spesifik jika user memilih alat tertentu
    if device_id:
        query = query.filter(SensorData.device_id == device_id)
        
        # Cari nama alat untuk header dan nama file
        device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
        if device:
            device_name_file = device.name.replace(" ", "_").lower()
            device_name_display = device.name
            
    # Eksekusi Query untuk mengambil data
    data = query.order_by(desc(SensorData.timestamp)).limit(limit).all()
        
    output = io.StringIO()
    # Tambahkan delimiter=';' agar Excel otomatis membaginya ke dalam kolom
    writer = csv.writer(output, delimiter=';')
    
    # =======================================================
    # BAGIAN KOP / INFORMASI LAPORAN (CUSTOM HEADER)
    # =======================================================
    user_display = getattr(current_user, "username", getattr(current_user, "email", getattr(current_user, "full_name", f"User_{current_user.id}")))
    total_data = len(data)
    
    writer.writerow(["LAPORAN HASIL MONITORING SMART COMPOST"])
    writer.writerow(["Nama Pemilik", ":", user_display])
    writer.writerow(["Nama Perangkat", ":", device_name_display])
    writer.writerow(["Jumlah Data", ":", f"{total_data} record terbaru"])
    writer.writerow([]) # Baris kosong sebagai pemisah visual
    # =======================================================
    
    # [PERBAIKAN] Header Tabel Data Utama (Tambahkan "No")
    writer.writerow(["No", "ID_Sensor", "Waktu_Perekaman", "Suhu(C)", "Kelembapan(%)", "Gas_Metana(ppm)", "Fase_Terdeteksi", "Skor_Kematangan", "Tindakan_DSS"])
    
    # [PERBAIKAN] Isi Data Tabel dengan Nomor Urut
    nomor_urut = 1
    for sensor, pred in data:
        writer.writerow([
            nomor_urut, # Angka 1, 2, 3, dst.
            sensor.id,
            sensor.timestamp.strftime("%Y-%m-%d %H:%M:%S") if sensor.timestamp else "-",
            sensor.temperature,
            sensor.humidity,
            sensor.gas,
            pred.phase if pred else "Belum diprediksi",
            f"{pred.maturity_score:.2f}%" if pred else "-",
            pred.recommendation if pred else "-"
        ])
        nomor_urut += 1 # Tambahkan 1 untuk baris selanjutnya
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=laporan_kompos_{device_name_file}.csv"}
    )