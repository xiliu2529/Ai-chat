from fastapi import FastAPI
from database import engine, Base
import models
from auth import router as auth_router
from chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有前端
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chat_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "AI Learning Assistant API"}