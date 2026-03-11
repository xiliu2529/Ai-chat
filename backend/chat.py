from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

import models
from auth import get_current_user, get_db  # 使用 auth 中统一的 get_db

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"

# 聊天接口
@router.post("/chat")
def chat(
    question: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    
    print("current_user:", current_user)
    print("current_user.id:", current_user.id)
    print("current_user.username:", current_user.username)
    print("current_user.email:", current_user.email)

    # 保存用户消息
    user_msg = models.ChatMessage(user_id=user_id, role="user", content=question)
    db.add(user_msg)
    db.commit()  # 或 db.flush() 也行

    # 获取最近10条聊天记录
    history = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == user_id)
        .order_by(models.ChatMessage.id.desc())
        .limit(10)
        .all()
    )

    messages = [
        {
            "role": "system",
            "content": "You are a helpful AI assistant. Answer clearly and logically. Use step-by-step reasoning."
        }
    ]

    for msg in reversed(history):
        messages.append({"role": msg.role, "content": msg.content})

    # 调用 Ollama AI
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": "qwen2:1.5b", "messages": messages, "stream": False},
            timeout=30  # 防止长时间卡住
        )
        response.raise_for_status()
        data = response.json()
        answer = data.get("message", {}).get("content", "AI 没有返回内容")
    except Exception as e:
        answer = f"⚠ AI 请求失败: {str(e)}"

    # 保存 AI 回复
    ai_msg = models.ChatMessage(user_id=user_id, role="assistant", content=answer)
    db.add(ai_msg)
    db.commit()

    return {"question": question, "answer": answer}

# 获取聊天历史
@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == user_id)
        .order_by(models.ChatMessage.id.asc())
        .all()
    )
    return [{"role": msg.role, "content": msg.content} for msg in messages]

# 删除聊天历史
@router.delete("/history")
def delete_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id).delete()
    db.commit()
    return {"message": "All chat history deleted"}