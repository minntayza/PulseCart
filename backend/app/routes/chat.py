from fastapi import APIRouter, Depends, HTTPException
from ..auth import current_user, manager_user
from ..models.schemas import (
    AuthUser, ChatConversation, ChatMessage, CreateConversationRequest,
    SendMessageRequest, WantedProduct,
)
from ..repository import MemoryRepository, SupabaseRepository, get_repository
from ..agents.chat_agent import chat_respond

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ChatConversation])
def list_conversations(
    user: AuthUser = Depends(current_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    return repo.list_conversations(user.id)


@router.post("/conversations", response_model=ChatConversation)
def create_conversation(
    payload: CreateConversationRequest,
    user: AuthUser = Depends(current_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    title = (payload.firstMessage or "New chat")[:80]
    return repo.create_conversation(user.id, title)


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessage])
def get_messages(
    conversation_id: str,
    user: AuthUser = Depends(current_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    conv = repo.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.userId != user.id and user.role != "manager":
        raise HTTPException(status_code=404, detail="Conversation not found")
    return repo.get_messages(conversation_id)


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    user: AuthUser = Depends(current_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    conv = repo.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.userId != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    repo.add_message(conversation_id, "user", payload.content.strip(), [])

    # Build conversation history for LLM
    messages = repo.get_messages(conversation_id)
    history = [{"role": m.role, "content": m.content} for m in messages[-10:]]

    # Get products and generate response
    products = repo.list_products()
    chat_response = chat_respond(payload.content, history, products)

    # Save assistant message
    assistant_msg = repo.add_message(
        conversation_id, "assistant",
        chat_response.response, chat_response.productIds,
    )

    # Upsert wanted product if detected
    if chat_response.wantedProduct:
        repo.upsert_wanted_product(
            user.id,
            chat_response.wantedProduct["name"],
            chat_response.wantedProduct.get("description"),
            conversation_id,
        )

    # Fetch full product details for the returned IDs
    product_map = {p.id: p for p in products}
    response_products = [product_map[pid] for pid in chat_response.productIds if pid in product_map]

    return {"message": assistant_msg, "products": response_products}


@router.get("/wanted", response_model=list[WantedProduct])
def list_wanted(
    _: AuthUser = Depends(manager_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    return repo.list_wanted_products()


@router.patch("/wanted/{wanted_id}", response_model=WantedProduct)
def update_wanted(
    wanted_id: str,
    status: str,
    _: AuthUser = Depends(manager_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    if status not in ("pending", "stocked", "dismissed"):
        raise HTTPException(status_code=422, detail="Invalid status")
    return repo.update_wanted_status(wanted_id, status)


@router.delete("/wanted/{wanted_id}", status_code=204)
def delete_wanted(
    wanted_id: str,
    _: AuthUser = Depends(manager_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    repo.delete_wanted_product(wanted_id)
