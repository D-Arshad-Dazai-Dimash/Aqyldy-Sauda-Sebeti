from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_auth
from models.schemas import ChatRequest, ChatResponse
from services.chatbot_service import chat

router = APIRouter(prefix="/api/ai/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_auth),
):
    """AI shopping assistant chatbot."""
    # Use verified identity from JWT; fall back to request body user_id
    authenticated_user_id = claims.get("sub") or req.user_id
    return await chat(
        db=db,
        message=req.message,
        conversation_history=req.conversation_history,
        user_id=authenticated_user_id,
    )
