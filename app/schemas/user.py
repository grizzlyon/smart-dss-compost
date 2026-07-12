from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

class UserProfileUpdate(BaseModel):
    name: str

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str
    confirm_new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str