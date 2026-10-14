import logging
import time
import traceback
import uuid
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, WebSocket, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger("campusmart")
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

from app.config import settings
from app.database import Base, engine, get_db
from app.routers import (
    admin,
    auth,
    categories,
    conversations,
    listings,
    notifications,
    orders,
    reports,
    reviews,
    stores,
    users,
    wishlist,
)
from app.ws.chat_ws import chat_ws_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure uploads directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    # Initialize DB schema for dev / sqlite fallback
    Base.metadata.create_all(bind=engine)
    logger.info("CampusMart application started successfully.")
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Multi-Vendor Campus Marketplace API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


class SecurityAndObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.perf_counter()

        try:
            response: Response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Log request line with status code and duration
            if not request.url.path.startswith("/media"):
                logger.info(
                    f"[{req_id[:8]}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)"
                )

            response.headers["X-Request-ID"] = req_id
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"[{req_id[:8]}] UNHANDLED ERROR on {request.method} {request.url.path} ({duration_ms:.1f}ms):\n"
                f"{traceback.format_exc()}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "An internal server error occurred. Please try again later.",
                    "request_id": req_id,
                },
                headers={"X-Request-ID": req_id},
            )


app.add_middleware(SecurityAndObservabilityMiddleware)

# CORS
origins = [
    settings.frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static media upload directory
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.upload_dir), name="media")

# Include Routers under /api/v1
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(stores.router, prefix="/api/v1/stores", tags=["stores"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(listings.router, prefix="/api/v1/listings", tags=["listings"])
app.include_router(wishlist.router, prefix="/api/v1/wishlist", tags=["wishlist"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(reviews.router, prefix="/api/v1", tags=["reviews"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])


# WebSocket Chat Endpoint
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(...)):
    await chat_ws_endpoint(websocket, token=token)


# Health Check Endpoint
@app.get("/health", tags=["system"])
async def health(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "db": db_status,
        "app": settings.app_name,
        "env": settings.env,
    }
