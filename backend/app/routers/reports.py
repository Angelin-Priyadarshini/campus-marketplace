"""Reports router."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.listing import Listing
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreateRequest, ReportResponse

router = APIRouter()

VALID_REASONS = {"spam", "prohibited_item", "scam", "inappropriate", "other"}
VALID_TARGET_TYPES = {"listing", "user"}


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(status_code=400, detail="Invalid target type (must be 'listing' or 'user')")

    if payload.reason not in VALID_REASONS:
        raise HTTPException(status_code=400, detail=f"Invalid reason (must be one of {VALID_REASONS})")

    # Validate target exists
    if payload.target_type == "listing":
        target = db.get(Listing, payload.target_id)
        if not target:
            raise HTTPException(status_code=404, detail="Target listing not found")
    else:
        target = db.get(User, payload.target_id)
        if not target:
            raise HTTPException(status_code=404, detail="Target user not found")
        if target.id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot report yourself")

    # Check for existing open report
    existing = db.execute(
        select(Report).where(
            Report.reporter_id == current_user.id,
            Report.target_type == payload.target_type,
            Report.target_id == payload.target_id,
            Report.status == "open",
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an open report for this item/user",
        )

    report = Report(
        reporter_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
        details=payload.details.strip() if payload.details else None,
        status="open",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
