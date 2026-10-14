"""Users router."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.conversation import UserBlock
from app.models.user import User
from app.schemas.user import UserMeResponse, UserPublicResponse, UserUpdateRequest
from app.services.storage import get_storage

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}


def _verify_magic_bytes(data: bytes, content_type: str) -> bool:
    for magic, mime in MAGIC_BYTES.items():
        if data.startswith(magic):
            return True
    return False


@router.get("/me", response_model=UserMeResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserMeResponse)
async def update_my_profile(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        name = payload.full_name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Full name cannot be empty")
        current_user.full_name = name
    if payload.department is not None:
        current_user.department = payload.department.strip() or None
    if payload.year_of_study is not None:
        if payload.year_of_study < 1 or payload.year_of_study > 6:
            raise HTTPException(status_code=400, detail="Year of study must be between 1 and 6")
        current_user.year_of_study = payload.year_of_study

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserMeResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    if not _verify_magic_bytes(contents, file.content_type):
        raise HTTPException(status_code=400, detail="File content does not match image format")

    storage = get_storage()
    url, _, _ = await storage.save_image(contents, file.filename or "avatar.jpg", file.content_type)
    current_user.avatar_url = url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{id}", response_model=UserPublicResponse)
async def get_user_public(id: int, db: Session = Depends(get_db)):
    user = db.get(User, id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{id}/block", status_code=status.HTTP_201_CREATED)
async def block_user(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.id == id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    target = db.get(User, id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.get(UserBlock, (current_user.id, id))
    if not existing:
        block = UserBlock(blocker_id=current_user.id, blocked_id=id)
        db.add(block)
        db.commit()

    return {"message": "User blocked successfully"}


@router.delete("/{id}/block")
async def unblock_user(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = db.get(UserBlock, (current_user.id, id))
    if block:
        db.delete(block)
        db.commit()
    return {"message": "User unblocked successfully"}
