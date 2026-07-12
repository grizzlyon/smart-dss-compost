from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import AuthService

# [PERBAIKAN] Tambahkan import UserProfileUpdate dan UserPasswordUpdate
from app.schemas.user import UserLogin, UserRegister, UserResponse, UserProfileUpdate, UserPasswordUpdate 
from app.core.security import create_access_token, get_token_from_cookie
from app.models.domain import User

router = APIRouter()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    email = get_token_from_cookie(request)
    
    # [PERBAIKAN] Tambahkan perlindungan jika token kosong/tidak valid
    if not email:
        raise HTTPException(status_code=401, detail="Sesi tidak valid, silakan login kembali")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun dinonaktifkan")
    return user

@router.post("/login", response_model=UserResponse)
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(user_in.email, user_in.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    access_token = create_access_token(data={"sub": user.email})
    
    # Simpan token ke dalam Cookie agar aman (terbaca oleh browser otomatis)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1440 * 60,
        expires=1440 * 60,
        samesite="lax", # [PERBAIKAN] Praktik keamanan tambahan untuk cookie
    )
    return user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        return auth_service.create_user(user_in)
    except Exception as e:
        # [PERBAIKAN] Menangkap error dari AuthService (misal: "Email sudah terdaftar")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"detail": "Logout berhasil"}

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ═══════════════════════════════════════════════════════════
#  [BARU] ENDPOINTS UNTUK UPDATE PROFIL
# ═══════════════════════════════════════════════════════════
@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update nama pengguna di halaman Profil"""
    current_user.name = profile_data.name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/profile/password")
def update_password(
    pw_data: UserPasswordUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update password pengguna di halaman Profil"""
    auth_service = AuthService(db)
    
    # Pastikan password baru cocok dengan konfirmasi
    if pw_data.new_password != pw_data.confirm_new_password:
        raise HTTPException(status_code=400, detail="Konfirmasi password baru tidak cocok")
        
    try:
        # Minta auth service untuk melakukan update
        auth_service.change_password(current_user, pw_data.old_password, pw_data.new_password)
        return {"status": "success", "detail": "Password berhasil diubah"}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# ═══════════════════════════════════════════════════════════
#  ENDPOINTS ADMIN
# ═══════════════════════════════════════════════════════════
@router.get("/admin/users", tags=["admin"])
def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Menarik semua data pengguna (Hanya Admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return db.query(User).all()

@router.put("/admin/users/{user_id}/toggle-active", tags=["admin"])
def toggle_user_active(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mengaktifkan / Menonaktifkan akun"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = not user.is_active
        db.commit()
    return {"status": "success"}

@router.put("/admin/users/{user_id}/role", tags=["admin"])
def change_user_role(user_id: int, role_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mengubah role (user / admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = role_data.get("role", "user")
        db.commit()
    return {"status": "success"}