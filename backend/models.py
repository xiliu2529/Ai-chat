from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base





class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String)   # user / assistant
    content = Column(String)