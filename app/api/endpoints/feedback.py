from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database.session import get_db
from app.models.domain import Feedback, User
from app.api.endpoints.auth import get_current_user # Untuk mengecek siapa yang sedang login

router = APIRouter()

# Skema Data dari Frontend (Pydantic)
class FeedbackCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    category: str
    message: str

# 1. Endpoint POST (Publik - Bisa diakses siapa saja dari Landing Page)
@router.post("/")
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    try:
        new_feedback = Feedback(
            name=data.name,
            email=data.email,
            category=data.category,
            message=data.message
        )
        db.add(new_feedback)
        db.commit()
        return {"status": "success", "message": "Masukan berhasil disimpan!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 2. Endpoint GET (Privat - HANYA UNTUK ADMIN)
@router.get("/")
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Wajib bawa token login
):
    # Cek apakah user yang login adalah admin (Sesuaikan 'role' dengan struktur kolom di tabel User Anda)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan Admin.")
    
    # Ambil semua masukan dari yang paling baru
    feedbacks = db.query(Feedback).order_by(desc(Feedback.created_at)).all()
    return feedbacks

# 3. Endpoint DELETE (Privat - HANYA UNTUK ADMIN)
@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan Admin.")
    
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Masukan tidak ditemukan.")
    
    db.delete(fb)
    db.commit()
    return {"status": "success", "message": "Masukan berhasil dihapus."}