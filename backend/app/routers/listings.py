"""Listings router."""
from __future__ import annotations
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional, require_seller
from app.models.category import Category
from app.models.listing import Listing, ListingImage, WishlistItem
from app.models.store import Store
from app.models.user import User
from app.schemas.listing import (
    ImagePositionItem,
    ListingCreateRequest,
    ListingDetailResponse,
    ListingImageResponse,
    ListingResponse,
    ListingUpdateRequest,
    PaginatedListings,
)
from app.services.storage import get_storage

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}


def _verify_magic_bytes(data: bytes) -> bool:
    for magic in MAGIC_BYTES:
        if data.startswith(magic):
            return True
    return False


def _check_prohibited_keywords(text: str) -> None:
    if not settings.prohibited_keywords:
        return
    text_lower = text.lower()
    keywords = [k.strip().lower() for k in settings.prohibited_keywords.split(",") if k.strip()]
    for kw in keywords:
        if kw in text_lower:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Content contains prohibited item keyword: '{kw}'",
            )


@router.get("", response_model=PaginatedListings)
async def list_listings(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    condition: Optional[List[str]] = Query(None),
    store_id: Optional[int] = None,
    status_filter: str = Query("active", alias="status"),
    sort: str = Query("newest"),  # newest, price_asc, price_desc, popular
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = (
        select(Listing)
        .options(selectinload(Listing.images))
        .where(Listing.status == status_filter)
    )

    if q:
        term = f"%{q.strip()}%"
        query = query.where(or_(Listing.title.ilike(term), Listing.description.ilike(term)))

    if category_id:
        query = query.where(Listing.category_id == category_id)

    if min_price is not None:
        query = query.where(Listing.price >= min_price)

    if max_price is not None:
        query = query.where(Listing.price <= max_price)

    if condition:
        query = query.where(Listing.condition.in_(condition))

    if store_id:
        query = query.where(Listing.store_id == store_id)

    # Sort
    if sort == "price_asc":
        query = query.order_by(Listing.price.asc(), Listing.id.desc())
    elif sort == "price_desc":
        query = query.order_by(Listing.price.desc(), Listing.id.desc())
    elif sort == "popular":
        query = query.order_by(Listing.view_count.desc(), Listing.id.desc())
    else:  # newest
        query = query.order_by(Listing.created_at.desc(), Listing.id.desc())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    paginated_query = query.options(
        selectinload(Listing.images),
        selectinload(Listing.store),
        selectinload(Listing.category),
    ).offset((page - 1) * page_size).limit(page_size)
    listings = db.execute(paginated_query).scalars().all()

    # Determine wishlisted IDs for authenticated user
    wishlisted_ids = set()
    if current_user:
        listing_ids = [l.id for l in listings]
        if listing_ids:
            w_rows = db.execute(
                select(WishlistItem.listing_id).where(
                    WishlistItem.user_id == current_user.id,
                    WishlistItem.listing_id.in_(listing_ids),
                )
            ).scalars().all()
            wishlisted_ids = set(w_rows)

    items = []
    for l in listings:
        item = ListingResponse.model_validate(l)
        item.is_wishlisted = l.id in wishlisted_ids
        items.append(item)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedListings(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/me/listings", response_model=List[ListingResponse])
async def get_my_listings(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store:
        return []

    query = (
        select(Listing)
        .options(selectinload(Listing.images))
        .where(Listing.store_id == store.id)
        .order_by(Listing.created_at.desc())
    )
    if status_filter:
        query = query.where(Listing.status == status_filter)
    else:
        query = query.where(Listing.status != "deleted")

    listings = db.execute(query).scalars().all()
    return [ListingResponse.model_validate(l) for l in listings]


@router.get("/{id}", response_model=ListingDetailResponse)
async def get_listing(
    id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    listing = db.execute(
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.store),
            selectinload(Listing.category),
        )
        .where(Listing.id == id)
    ).scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Increment view count
    db.execute(
        update(Listing).where(Listing.id == id).values(view_count=Listing.view_count + 1)
    )
    db.commit()
    db.refresh(listing)

    is_wishlisted = False
    if current_user:
        w = db.get(WishlistItem, (current_user.id, listing.id))
        is_wishlisted = w is not None

    res = ListingDetailResponse.model_validate(listing)
    res.is_wishlisted = is_wishlisted
    return res


@router.get("/{id}/similar", response_model=List[ListingResponse])
async def get_similar_listings(
    id: int,
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing or not listing.category_id:
        return []

    similar = db.execute(
        select(Listing)
        .options(selectinload(Listing.images))
        .where(
            Listing.category_id == listing.category_id,
            Listing.id != id,
            Listing.status == "active",
        )
        .order_by(Listing.created_at.desc())
        .limit(6)
    ).scalars().all()

    return [ListingResponse.model_validate(s) for s in similar]


@router.post("", response_model=ListingDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreateRequest,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=400, detail="Storefront required to create listings")

    _check_prohibited_keywords(f"{payload.title} {payload.description}")

    if payload.category_id is not None:
        cat = db.get(Category, payload.category_id)
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid category ID")

    listing = Listing(
        store_id=store.id,
        category_id=payload.category_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        price=payload.price,
        condition=payload.condition,
        quantity=payload.quantity,
        reserved_quantity=0,
        status="active",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Reload relationships
    listing = db.execute(
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.store),
            selectinload(Listing.category),
        )
        .where(Listing.id == listing.id)
    ).scalar_one()

    return ListingDetailResponse.model_validate(listing)


@router.patch("/{id}", response_model=ListingDetailResponse)
async def update_listing(
    id: int,
    payload: ListingUpdateRequest,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store or listing.store_id != store.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    check_text = ""
    if payload.title is not None:
        check_text += f"{payload.title} "
        listing.title = payload.title.strip()
    if payload.description is not None:
        check_text += f"{payload.description} "
        listing.description = payload.description.strip()
    if check_text:
        _check_prohibited_keywords(check_text)

    if payload.price is not None:
        if payload.price < 0:
            raise HTTPException(status_code=400, detail="Price must be non-negative")
        listing.price = payload.price

    if payload.condition is not None:
        listing.condition = payload.condition

    if payload.quantity is not None:
        if payload.quantity < listing.reserved_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity cannot be less than currently reserved ({listing.reserved_quantity})",
            )
        listing.quantity = payload.quantity

    if payload.category_id is not None:
        cat = db.get(Category, payload.category_id)
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid category ID")
        listing.category_id = payload.category_id

    if payload.status is not None:
        listing.status = payload.status

    db.commit()

    listing = db.execute(
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.store),
            selectinload(Listing.category),
        )
        .where(Listing.id == listing.id)
    ).scalar_one()

    return ListingDetailResponse.model_validate(listing)


@router.delete("/{id}")
async def delete_listing(
    id: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store or listing.store_id != store.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    listing.status = "deleted"
    db.commit()
    return {"message": "Listing deleted successfully"}


@router.post("/{id}/images", response_model=List[ListingImageResponse])
async def upload_listing_images(
    id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store or listing.store_id != store.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    existing_count = db.scalar(
        select(func.count(ListingImage.id)).where(ListingImage.listing_id == id)
    ) or 0

    if existing_count + len(files) > 6:
        raise HTTPException(
            status_code=400,
            detail=f"A listing can have at most 6 images (currently has {existing_count})",
        )

    storage = get_storage()
    created_images = []
    max_pos = db.scalar(
        select(func.max(ListingImage.position)).where(ListingImage.listing_id == id)
    ) or -1

    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image files must each be under 5 MB")

        if not _verify_magic_bytes(contents):
            raise HTTPException(status_code=400, detail="Invalid image file contents")

        url, thumb_url, public_id = await storage.save_image(
            contents, file.filename or f"img_{i}.jpg", file.content_type
        )
        img_record = ListingImage(
            listing_id=id,
            url=url,
            thumb_url=thumb_url,
            public_id=public_id,
            position=max_pos + 1 + i,
        )
        db.add(img_record)
        created_images.append(img_record)

    db.commit()
    for img in created_images:
        db.refresh(img)

    return [ListingImageResponse.model_validate(img) for img in created_images]


@router.delete("/{id}/images/{image_id}")
async def delete_listing_image(
    id: int,
    image_id: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store or listing.store_id != store.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    img = db.get(ListingImage, image_id)
    if not img or img.listing_id != id:
        raise HTTPException(status_code=404, detail="Image not found on this listing")

    storage = get_storage()
    if img.public_id:
        await storage.delete_image(img.public_id)

    db.delete(img)
    db.commit()
    return {"message": "Image deleted successfully"}


@router.put("/{id}/images/order")
async def reorder_listing_images(
    id: int,
    positions: List[ImagePositionItem],
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store or listing.store_id != store.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    for pos in positions:
        img = db.get(ListingImage, pos.id)
        if img and img.listing_id == id:
            img.position = pos.position

    db.commit()
    return {"message": "Images reordered successfully"}
