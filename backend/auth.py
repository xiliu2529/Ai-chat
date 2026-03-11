from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 配置
SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# token读取
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# 获取数据库
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 创建 token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 获取当前用户
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# 注册
@router.post("/register")
def register(username: str, email: str, password: str, db: Session = Depends(get_db)):

    # 检查用户名
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # 检查邮箱
    email_user = db.query(models.User).filter(models.User.email == email).first()
    if email_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = pwd_context.hash(password)
    new_user = models.User(username=username, email=email, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created"}

# 登录
@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    if not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Wrong password")

    access_token = create_access_token(data={"user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# 获取当前用户信息
@router.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}