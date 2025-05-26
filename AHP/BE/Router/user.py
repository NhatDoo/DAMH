from fastapi import APIRouter, HTTPException, Depends, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from jose import JWTError, jwt
import secrets
from models.user import UserCreate, User
from fastapi import Form
from sib_api_v3_sdk.rest import ApiException
from sib_api_v3_sdk.api import TransactionalEmailsApi
from sib_api_v3_sdk.models.send_smtp_email import SendSmtpEmail
from sib_api_v3_sdk.configuration import Configuration
from sib_api_v3_sdk.api_client import ApiClient
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình Brevo
BREVO_API_KEY = "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"
EMAIL_SENDER = "www.nhatvn12@gmail.com"
configuration = Configuration()
configuration.api_key["api-key"] = BREVO_API_KEY
api_client = ApiClient(configuration)
email_api = TransactionalEmailsApi(api_client)

# Tạo lớp tùy chỉnh cho form đăng nhập
class CustomOAuth2PasswordRequestForm(OAuth2PasswordRequestForm):
    def __init__(self, username: str = Form(...), password: str = Form(...), remember: bool = Form(False)):
        super().__init__(username=username, password=password)
        self.remember = remember

# Cấu hình MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["startup_pa_dtb"]
users_collection = db["users"]
tchi_users_collection = db["tchi_user"]

# Cấu hình bảo mật
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT Secret Key và Algorithm
SECRET_KEY = "your-secret-key"  # Thay bằng chuỗi bí mật mạnh hơn
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter()

# Hàm gửi email reset mật khẩu bằng Brevo
def send_reset_email(to_email: str, reset_token: str):
    try:
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <p>
                <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                    Reset Your Password
                </a>
            </p>
            <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>Your App Team</p>
        </body>
        </html>
        """

        email_data = SendSmtpEmail(
            to=[{"email": to_email, "name": "User"}],
            sender={"email": EMAIL_SENDER, "name": "StatupChoose"},
            subject="Password Reset Request - StatupChoose",
            html_content=html_content
        )

        response = email_api.send_transac_email(email_data)
        logger.info(f"Reset email sent successfully to {to_email}, Response: {response}")
        return True
    except ApiException as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        return False

# Mã hóa mật khẩu
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Tạo token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Lấy user từ token
# async def get_current_user(token: str = Depends(oauth2_scheme)):
#     credentials_exception = HTTPException(
#         status_code=401,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email: str = payload.get("sub")
#         if email is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception
#     user = users_collection.find_one({"email": email})
#     if user is None:
#         raise credentials_exception
#     return User(**{**user, "id": str(user["_id"])})
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    logger.debug(f"User found: {email}")
    return User(**{**user, "id": str(user["_id"])})

# Kiểm tra vai trò admin
async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can perform this action",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

# Đăng ký
@router.post("/register/")
async def register(user: UserCreate):
    db_user = users_collection.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = {"email": user.email, "password": hashed_password, "role": user.role}
    result = users_collection.insert_one(new_user)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

# Đăng nhập
@router.post("/token")
async def login(form_data: CustomOAuth2PasswordRequestForm = Depends(), response: Response = None):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)
    
    result = {"access_token": access_token, "token_type": "bearer"}
    if form_data.remember and response:
        response.set_cookie(
            key="remember_me",
            value=access_token,
            max_age=7 * 24 * 60 * 60,
            httponly=True
        )
    return result

# Quên mật khẩu
@router.post("/forgot-password/")
async def forgot_password(email: EmailStr):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(hours=1)
    users_collection.update_one(
        {"email": email},
        {"$set": {"reset_token": reset_token, "reset_expiry": expiry}}
    )
    
    if not send_reset_email(email, reset_token):
        raise HTTPException(status_code=500, detail="Failed to send reset email")
    
    return {"message": "Password reset link has been sent to your email"}

# Reset mật khẩu
@router.post("/reset-password/")
async def reset_password(token: str = Form(...), new_password: str = Form(...)):
    user = users_collection.find_one({"reset_token": token})
    if not user:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    # Kiểm tra thời gian hết hạn
    expiry = user.get("reset_expiry")
    if not expiry or datetime.utcnow() > expiry:
        # Xóa token nếu đã hết hạn
        users_collection.update_one(
            {"reset_token": token},
            {"$unset": {"reset_token": "", "reset_expiry": ""}}
        )
        raise HTTPException(status_code=400, detail="Token has expired")

    # Cập nhật mật khẩu mới và xóa token
    hashed_password = get_password_hash(new_password)
    users_collection.update_one(
        {"reset_token": token},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": "", "reset_expiry": ""}}
    )
    logger.info(f"Password reset successfully for user: {user['email']}")
    return {"message": "Password has been reset successfully"}

# Lấy thông tin người dùng hiện tại
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "role": current_user.role}

# Lấy danh sách người dùng (không cần admin)
@router.get("/users/", response_model=list[User])
async def get_users():
    users = users_collection.find()
    return [User(**{**user, "id": str(user["_id"])}) for user in users]

# Thêm người dùng (chỉ cho admin)
@router.post("/users/", response_model=User)
async def add_user(user: UserCreate):
    db_user = users_collection.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = {"email": user.email, "password": hashed_password, "role": user.role}
    result = users_collection.insert_one(new_user)
    return User(**{"id": str(result.inserted_id), "email": user.email, "password": hashed_password, "role": user.role})

# Cập nhật người dùng (chỉ cho admin)
@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user: UserCreate):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    db_user = users_collection.find_one({"_id": obj_id})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = get_password_hash(user.password) if user.password else db_user["password"]
    updated_user = {
        "email": user.email or db_user["email"],
        "password": hashed_password,
        "role": user.role or db_user["role"]
    }
    users_collection.update_one({"_id": obj_id}, {"$set": updated_user})
    return User(**{**db_user, **updated_user, "id": user_id})
    
# Xóa người dùng (chỉ cho admin)
@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        # Validate and convert user_id to ObjectId
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    db_user = users_collection.find_one({"_id": obj_id})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_collection.delete_one({"_id": obj_id})
    return {"message": "User deleted successfully"}
