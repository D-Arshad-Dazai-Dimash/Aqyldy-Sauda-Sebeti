from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import ChatRequest, ChatResponse
from services.chatbot_service import chat

router = APIRouter(prefix="/api/ai/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """AI shopping assistant chatbot."""
    return await chat(
        db=db,
        message=req.message,
        conversation_history=req.conversation_history,
        user_id=req.user_id,
    )
