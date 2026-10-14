"""Admin router."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models.category import Category
from app.models.listing import Listing
from app.models.notification import Notification
from app.models.order import Order
from app.models.report import Report
from app.models.store import Store
from app.models.user import User
from app.schemas.category import CategoryCreateRequest, CategoryResponse, CategoryUpdateRequest
from app.schemas.listing import ListingResponse
from app.schemas.report import ReportResolveRequest, ReportResponse
from app.schemas.user import UserMeResponse

router = APIRouter()


@router.get("/reports")
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Report).order_by(Report.created_at.desc())
    if status_filter:
        query = query.where(Report.status == status_filter)

    reports = db.execute(query).scalars().all()
    results = []
    for r in reports:
        reporter = db.get(User, r.reporter_id)
        target_name = None
        if r.target_type == "listing":
            l = db.get(Listing, r.target_id)
            target_name = l.title if l else f"Listing #{r.target_id}"
        elif r.target_type == "user":
            u = db.get(User, r.target_id)
            target_name = u.full_name if u else f"User #{r.target_id}"

        results.append({
            "id": r.id,
            "reporter_id": r.reporter_id,
            "reporter_name": reporter.full_name if reporter else "Unknown",
            "target_type": r.target_type,
            "target_id": r.target_id,
            "target_name": target_name,
            "reason": r.reason,
            "details": r.details,
            "status": r.status,
            "resolution_note": r.resolution_note,
            "created_at": r.created_at,
            "resolved_at": r.resolved_at,
        })
    return results


@router.post("/reports/{id}/resolve")
async def resolve_report(
    id: int,
    payload: ReportResolveRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.get(Report, id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    action = payload.action
    now = datetime.now(timezone.utc)

    if action == "hide_listing":
        listing = db.get(Listing, report.target_id)
        if listing:
            listing.status = "hidden"
            store = db.get(Store, listing.store_id)
            if store:
                notif = Notification(
                    user_id=store.owner_id,
                    type="listing_hidden",
                    title="Listing Hidden by Moderator",
                    body=f"Your listing '{listing.title}' was hidden following a moderation review.",
                    link="/dashboard",
                )
                db.add(notif)
        report.status = "resolved"

    elif action == "restore_listing":
        listing = db.get(Listing, report.target_id)
        if listing:
            listing.status = "active"
        report.status = "resolved"

    elif action == "suspend_user":
        user = db.get(User, report.target_id)
        if user:
            user.is_active = False
        report.status = "resolved"

    elif action == "unsuspend_user":
        user = db.get(User, report.target_id)
        if user:
            user.is_active = True
        report.status = "resolved"

    elif action == "dismiss":
        report.status = "dismissed"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")

    report.resolved_by = current_admin.id
    report.resolution_note = payload.note
    report.resolved_at = now

    db.commit()
    return {"message": f"Report marked as {report.status} via '{action}'"}


@router.get("/users")
async def list_users(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(User).order_by(User.id.desc())
    if q:
        term = f"%{q.strip()}%"
        query = query.where(or_(User.email.ilike(term), User.full_name.ilike(term)))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    users = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()

    return {
        "items": [UserMeResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }


@router.post("/users/{id}/suspend")
async def suspend_user(
    id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own admin account")

    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} suspended"}


@router.post("/users/{id}/unsuspend")
async def unsuspend_user(
    id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    return {"message": f"User {user.email} unsuspended"}


@router.get("/listings")
async def list_all_listings(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Listing).order_by(Listing.id.desc())
    if q:
        term = f"%{q.strip()}%"
        query = query.where(or_(Listing.title.ilike(term), Listing.description.ilike(term)))
    if status_filter:
        query = query.where(Listing.status == status_filter)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    listings = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()

    return {
        "items": [ListingResponse.model_validate(l) for l in listings],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }


@router.post("/listings/{id}/hide")
async def hide_listing(
    id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = "hidden"
    store = db.get(Store, listing.store_id)
    if store:
        notif = Notification(
            user_id=store.owner_id,
            type="listing_hidden",
            title="Listing Hidden by Moderator",
            body=f"Your listing '{listing.title}' was hidden by an administrator.",
            link="/dashboard",
        )
        db.add(notif)

    db.commit()
    return {"message": "Listing hidden successfully"}


@router.post("/listings/{id}/restore")
async def restore_listing(
    id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = "active"
    db.commit()
    return {"message": "Listing restored to active status"}


@router.get("/categories", response_model=List[CategoryResponse])
async def admin_list_categories(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    payload: CategoryCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    clean_name = payload.name.strip()
    clean_slug = payload.slug.strip().lower()

    existing = db.execute(
        select(Category).where(or_(Category.name == clean_name, Category.slug == clean_slug))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="A category with this name or slug already exists")

    cat = Category(
        name=clean_name,
        slug=clean_slug,
        icon=payload.icon.strip() if payload.icon else None,
        sort_order=payload.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{id}", response_model=CategoryResponse)
async def admin_update_category(
    id: int,
    payload: CategoryUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cat = db.get(Category, id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.slug is not None:
        cat.slug = payload.slug.strip().lower()
    if payload.icon is not None:
        cat.icon = payload.icon.strip() or None
    if payload.sort_order is not None:
        cat.sort_order = payload.sort_order

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{id}")
async def admin_delete_category(
    id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cat = db.get(Category, id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    in_use = db.scalar(select(func.count(Listing.id)).where(Listing.category_id == id)) or 0
    if in_use > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category: {in_use} listing(s) are using it",
        )

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}


@router.get("/stats")
async def admin_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.scalar(select(func.count(User.id))) or 0
    verified_users = db.scalar(select(func.count(User.id)).where(User.is_verified == True)) or 0
    active_listings = db.scalar(select(func.count(Listing.id)).where(Listing.status == "active")) or 0

    orders_by_status = {}
    for st in ["pending", "accepted", "completed", "cancelled", "rejected"]:
        cnt = db.scalar(select(func.count(Order.id)).where(Order.status == st)) or 0
        orders_by_status[st] = cnt

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    completed_30d = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == "completed",
            Order.updated_at >= thirty_days_ago,
        )
    ) or 0

    open_reports = db.scalar(select(func.count(Report.id)).where(Report.status == "open")) or 0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "active_listings": active_listings,
        "orders_by_status": orders_by_status,
        "completed_orders_30d": completed_30d,
        "open_reports": open_reports,
    }
