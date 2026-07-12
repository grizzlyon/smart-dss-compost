from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import User
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserRegister

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, email: str, password: str):
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return None
        return user

    def create_user(self, user_in: UserRegister):
        existing_user = self.db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email sudah terdaftar")
        
        # Pendaftar pertama otomatis menjadi admin
        is_first_user = self.db.query(User).count() == 0
        role = "admin" if is_first_user else "user"
        
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            name=user_in.name,
            email=user_in.email, 
            password_hash=hashed_password,
            role=role
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    def change_password(self, user: User, old_password: str, new_password: str):
        # Asumsi verify_password dan get_password_hash ada di file app.core.security
        from app.core.security import verify_password, get_password_hash
        
        # 1. Cek apakah password lama yang dimasukkan benar
        if not verify_password(old_password, user.hashed_password):
            raise ValueError("Password lama salah")
            
        # 2. Update dengan password baru yang sudah di-hash
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        return True