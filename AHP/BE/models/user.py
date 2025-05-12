from pydantic import BaseModel, EmailStr
from datetime import datetime

# Mô hình User
class UserBase(BaseModel):
    email: EmailStr
    password: str
    role: str = "User"  # Thêm trường role, mặc định là "User"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str

    class Config:
        arbitrary_types_allowed = True

# Mô hình TchiUser liên kết với User
class TchiUserBase(BaseModel):
    alternative: str
    final_score: float
    criterion_scores: dict
    criteria_list: list
    comparison_matrix: list
    consistency_ratio: float

class TchiUserCreate(TchiUserBase):
    user_id: str

class TchiUser(TchiUserBase):
    id: str
    user_id: str

    class Config:
        arbitrary_types_allowed = True