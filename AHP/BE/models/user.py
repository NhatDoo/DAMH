from pydantic import BaseModel, EmailStr
from datetime import datetime

# Mô hình User
class UserBase(BaseModel):
    email: EmailStr
    password: str
    role: str = "User"  

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str

    class Config:
        arbitrary_types_allowed = True

