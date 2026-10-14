# CampusMart — Backend Architecture & Developer Reference

> **Project Root Directory:** `c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\`  
> **Backend Base Directory:** `c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\backend\`  
> **Database File (SQLite):** `c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\backend\campusmart.db`  
> **Uploads Directory:** `c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\backend\uploads\` (served statically at `/media/`)

---

## 1. Directory Tree & File Inventory

Below is the directory map of every backend source file:

```
backend/
├── .env.example                                      # Environment variable template
├── requirements.txt                                  # Python dependencies (FastAPI, SQLAlchemy, Pillow, etc.)
├── alembic.ini                                       # Alembic database migration config
├── campusmart.db                                     # Live SQLite database file (seeded with 42 items)
├── Dockerfile                                        # Container build file
│
├── alembic/                                          # Database Migration Scripts
│   ├── env.py                                        # Migration runtime configuration
│   ├── script.py.mako                                # Migration template
│   └── versions/
│       └── a731ed96c605_initial_schema.py            # Initial schema creating all 15 tables
│
├── app/                                              # Application Source Code
│   ├── __init__.py
│   ├── main.py                                       # FastAPI App Factory, CORS, Static Mount, Middleware
│   ├── config.py                                     # Pydantic Settings (environment loading)
│   ├── database.py                                   # SQLAlchemy engine, SessionLocal, Base, get_db()
│   ├── security.py                                   # Passwords (bcrypt), JWT access & refresh tokens
│   ├── deps.py                                       # Authentication & Role Dependency Injection
│   ├── seed.py                                       # Idempotent database seeder with real Unsplash images
│   │
│   ├── models/                                       # SQLAlchemy ORM Models (Table Definitions)
│   │   ├── __init__.py
│   │   ├── user.py                                   # User model & AuthToken table
│   │   ├── store.py                                  # Store model (seller storefronts)
│   │   ├── category.py                               # Category model (11 campus categories)
│   │   ├── listing.py                                # Listing, ListingImage, WishlistItem models
│   │   ├── order.py                                  # Order & OrderEvent models
│   │   ├── conversation.py                           # Conversation, Message, UserBlock models
│   │   ├── review.py                                 # Review model (buyer <-> seller)
│   │   ├── report.py                                 # Report model (moderation queue)
│   │   └── notification.py                           # In-app Notification model
│   │
│   ├── schemas/                                      # Pydantic v2 Request/Response Validation Models
│   │   ├── __init__.py
│   │   ├── auth.py                                   # Register, Login, Token, Password Reset schemas
│   │   ├── user.py                                   # UserMe, UserPublic, UserUpdate schemas
│   │   ├── store.py                                  # StoreCreate, StoreUpdate, StoreResponse schemas
│   │   ├── category.py                               # CategoryCreate, CategoryResponse schemas
│   │   ├── listing.py                                # ListingCreate, ListingResponse, Filter schemas
│   │   ├── order.py                                  # OrderCreate, OrderResponse, Event schemas
│   │   ├── conversation.py                           # MessageCreate, ConversationResponse schemas
│   │   ├── review.py                                 # ReviewCreate, ReviewReply, ReviewResponse schemas
│   │   ├── report.py                                 # ReportCreate, ReportResolve schemas
│   │   └── notification.py                           # NotificationResponse, NotificationRead schemas
│   │
│   ├── routers/                                      # HTTP Route Handlers (API Endpoints)
│   │   ├── __init__.py
│   │   ├── auth.py                                   # /api/v1/auth (Register, Login, Refresh, Password Reset)
│   │   ├── users.py                                  # /api/v1/users (Profile, Avatar Upload, Blocks)
│   │   ├── stores.py                                 # /api/v1/stores (Create Storefront, Public Store, Reviews)
│   │   ├── categories.py                             # /api/v1/categories (List all categories)
│   │   ├── listings.py                               # /api/v1/listings (Search, Create, Update, Images, Me)
│   │   ├── wishlist.py                               # /api/v1/wishlist (Save, Remove, Price-drop flag)
│   │   ├── conversations.py                          # /api/v1/conversations (Inbox, Message history, Read receipt)
│   │   ├── orders.py                                 # /api/v1/orders (Place, Accept, Reject, Complete, Cancel)
│   │   ├── reviews.py                                # /api/v1/reviews (Leave review, Edit, Delete, Reply)
│   │   ├── reports.py                                # /api/v1/reports (File listing/user report)
│   │   ├── admin.py                                  # /api/v1/admin (Stats, User suspension, Hide listings)
│   │   └── notifications.py                          # /api/v1/notifications (Inbox, Mark read)
│   │
│   ├── services/                                     # Isolated Business Logic & Helper Services
│   │   ├── __init__.py
│   │   ├── storage.py                                # Image handling (Local disk storage + Pillow thumbnails)
│   │   ├── email.py                                  # Verification links (SMTP or console logger)
│   │   ├── orders.py                                 # Concurrency-safe stock reservation & state transitions
│   │   └── ratings.py                                # Running average & count recalculations
│   │
│   └── ws/                                           # Real-Time WebSocket Infrastructure
│       ├── __init__.py
│       ├── connection_manager.py                     # In-memory user socket map & event broadcaster
│       └── chat_ws.py                                # /ws/chat WebSocket endpoint
│
└── tests/                                            # Pytest Suite (26 Passing Tests)
    ├── __init__.py
    ├── conftest.py                                   # In-memory SQLite fixtures & authenticated clients
    ├── test_auth.py                                  # Auth flow, domain restrictions, tokens, suspension
    ├── test_listings.py                              # Listing CRUD, validation, keyword search, filters
    ├── test_wishlist.py                              # Idempotent save, price drops, own-item rejection
    ├── test_orders.py                                # Order state machine, stock concurrency safety
    ├── test_reviews.py                               # Post-transaction reviews, aggregate rating calculations
    ├── test_conversations.py                         # Chat threads, permissions, unread count tracking
    └── test_admin.py                                 # Moderation queue, listing hiding, user bans
```

---

## 2. Core Foundation Files Deep-Dive

### `app/config.py`
- **What it does:** Reads all configuration from the `.env` file via `pydantic-settings.BaseSettings`.
- **Key Parameters:**
  - `DATABASE_URL`: Defaults to `sqlite:///./campusmart.db`. When pointing to PostgreSQL, SQLAlchemy automatically switches drivers without code changes.
  - `ALLOWED_EMAIL_DOMAINS`: Defaults to `ssn.edu.in`. Rejects any non-campus registration attempts.
  - `ALLOW_ANY_EMAIL`: If `true`, bypasses domain restrictions (used in unit test fixtures).
  - `AUTO_VERIFY`: If `true`, newly registered students are automatically verified so manual SMTP setup is optional.
  - `PROHIBITED_KEYWORDS`: Comma-separated blacklist (`weapon,gun,knife,alcohol,drug,vape,cigarette`) enforced during listing creation.

### `app/database.py`
- **What it does:** Creates the SQLAlchemy `Engine`, `sessionmaker`, and the declarative `Base` class.
- **Key Pattern:**
  - Sets `connect_args={"check_same_thread": False}` when running SQLite so multiple async requests can safely use the database.
  - Exports `get_db()` dependency generator:
    ```python
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    ```

### `app/security.py`
- **What it does:** Handles password hashing and JSON Web Tokens.
- **Design Decision:** Uses direct `bcrypt` (`bcrypt.hashpw` / `bcrypt.checkpw`) with 12 rounds, avoiding `passlib 1.7.4`'s 72-byte string check bug with modern bcrypt 4.x.
- **Tokens Issued:**
  - `create_access_token(data, expires_delta)`: 15-minute token with subject `user.id`.
  - `create_refresh_token(data, expires_delta)`: 7-day token stored in an `httpOnly`, `SameSite=lax` cookie.

### `app/deps.py`
- **What it does:** FastAPI dependencies for route guards.
- **Key Dependencies:**
  - `get_current_user(token, db)`: Decodes the JWT, fetches the user, and verifies that `user.is_active == True` and `user.is_verified == True`. Rejects suspended users with HTTP 403.
  - `require_seller(current_user)`: Verifies `current_user.has_storefront == True`. Returns HTTP 403 if they have not opened a storefront yet.
  - `require_admin(current_user)`: Verifies `current_user.role == "admin"`.

### `app/main.py`
- **What it does:** Initializes FastAPI, registers CORS, mounts `/media` for uploaded images, includes all 12 routers under `/api/v1`, and attaches the `SecurityAndObservabilityMiddleware`.
- **Middleware Features:**
  - Extracts or generates a unique `X-Request-ID` (UUID4).
  - Measures request processing time (`time.perf_counter()`).
  - Logs `[req_id] METHOD /path -> STATUS (duration_ms)`.
  - Catches unhandled exceptions, logs the full Python traceback, and returns a sanitized JSON error payload:
    ```json
    { "detail": "An internal server error occurred. Please try again later.", "request_id": "..." }
    ```

---

## 3. Database Models & Schema Reference (`app/models/`)

All models inherit from `app.database.Base` and use portable column types (`String`, `Integer`, `Numeric(10, 2)`, `DateTime(timezone=True)`).

1. **`User` (`models/user.py`):**
   - Columns: `id`, `email` (unique), `password_hash`, `full_name`, `department`, `year_of_study`, `avatar_url`, `role` (`student` or `admin`), `is_verified`, `is_active`, `has_storefront`, `buyer_rating_avg`, `buyer_rating_cnt`, `created_at`, `updated_at`.
   - Also includes `AuthToken` table for email verification tokens and password reset hashes.

2. **`Store` (`models/store.py`):**
   - Represents the vendor storefront.
   - Columns: `id`, `owner_id` (FK `users.id`, unique 1-to-1), `name` (unique), `bio`, `logo_url`, `pickup_location_hint`, `is_active`, `rating_avg`, `rating_count`, `items_sold`, `created_at`.

3. **`Category` (`models/category.py`):**
   - 11 pre-seeded categories (Textbooks, Notes, Electronics, Laptops, Dorm, Furniture, Lab, Clothing, Sports, Bicycles, Other).
   - Columns: `id`, `name`, `slug` (unique), `icon` (emoji), `sort_order`.

4. **`Listing` & `ListingImage` (`models/listing.py`):**
   - The central marketplace entity.
   - Columns: `id`, `store_id` (FK `stores.id`), `category_id` (FK `categories.id`), `title`, `description`, `price` (`Numeric(10, 2)`), `condition` (`new`, `like_new`, `good`, `fair`, `poor`), `quantity`, `reserved_quantity`, `status` (`active`, `reserved`, `sold`, `hidden`, `deleted`), `view_count`, `version` (integer for optimistic locking), `created_at`, `updated_at`.
   - `ListingImage`: `id`, `listing_id`, `url`, `thumb_url`, `position`.
   - `WishlistItem`: Composite PK (`user_id`, `listing_id`), `price_at_save`.

5. **`Order` & `OrderEvent` (`models/order.py`):**
   - Tracks transaction negotiations.
   - Columns: `id`, `listing_id`, `buyer_id`, `seller_id`, `quantity`, `unit_price`, `status` (`pending`, `accepted`, `completed`, `cancelled`, `rejected`), `note`, `proposed_meetup`, `reject_reason`, `created_at`, `updated_at`.
   - `OrderEvent`: Audit trail of transitions (`from_status`, `to_status`, `actor_id`, `created_at`).

6. **`Conversation` & `Message` (`models/conversation.py`):**
   - Chat threads anchored to a specific listing between a buyer and seller.
   - `Conversation`: `listing_id`, `buyer_id`, `seller_id`, `last_message_at`. Unique constraint across all three.
   - `Message`: `conversation_id`, `sender_id`, `body`, `is_system`, `created_at`, `read_at`.

7. **`Review` (`models/review.py`):**
   - Post-transaction ratings.
   - Columns: `order_id`, `reviewer_id`, `reviewee_id`, `direction` (`buyer_to_seller` or `seller_to_buyer`), `rating` (1–5), `comment`, `seller_reply`, `created_at`.

8. **`Report` (`models/report.py`):**
   - Community moderation tickets.
   - Columns: `reporter_id`, `target_type` (`listing` or `user`), `target_id`, `reason` (`spam`, `prohibited_item`, `scam`, `inappropriate`), `details`, `status` (`open`, `resolved`, `dismissed`), `resolved_by`, `resolution_note`.

---

## 4. Business Services Layer (`app/services/`)

### `services/orders.py` — Concurrency-Safe Order State Machine
Handles stock reservations without race conditions using SQL-level conditional updates:
```python
# Concurrency-safe reservation on order accept
result = db.execute(
    update(Listing)
    .where(
        Listing.id == listing.id,
        Listing.version == listing.version,
        (Listing.quantity - Listing.reserved_quantity) >= order.quantity
    )
    .values(
        reserved_quantity=Listing.reserved_quantity + order.quantity,
        version=Listing.version + 1
    )
)
if result.rowcount == 0:
    raise HTTPException(status_code=409, detail="Stock no longer available or version conflict")
```
- If two students click "Request to Buy" on the last unit of a textbook simultaneously, the first thread commits and increments the version column. The second thread's `version == expected_ver` check fails, safely returning HTTP 409 without overselling.

### `services/ratings.py` — Instant Rating Recalculation
Whenever a review is posted, edited, or deleted, `recompute_store_rating(db, store_id)` and `recompute_buyer_rating(db, user_id)` execute inside the exact same database transaction:
- Calculates `AVG(rating)` and `COUNT(id)` from the `reviews` table.
- Writes the new score directly to `stores.rating_avg` and `stores.rating_count`.
- Guarantees seller star ratings are always synchronized.

### `services/storage.py` — Secure Image Storage & Thumbnailing
- Inspects the first 12 bytes of every uploaded file for magic byte signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46 ... 57 45 42 50` for WebP) to block malicious executables disguised as images.
- Uses Pillow (`PIL.Image`) to generate responsive 300x225 thumbnails saved under `backend/uploads/thumb_*.jpg`.

---

## 5. The Complete Vendor Portal Flow: Frontend to Backend

Here is the exact step-by-step trace of how the Vendor Portal works across both client and server:

```
[ FRONTEND ]                                                    [ BACKEND ]
SellPage.jsx ────────── POST /api/v1/stores ──────────────────► stores.py router
                                                                Creates Store record
                                                                Sets user.has_storefront = true
                                                                Commits transaction
                                                                        │
Dashboard.jsx ◄──────── Redirects to /dashboard ◄───────────────────────┘
  │
  ├─► GET /api/v1/me/listings ────────────────────────────────► listings.py (returns all seller items)
  └─► GET /api/v1/orders?role=seller ─────────────────────────► orders.py (returns incoming requests)
  │
NewListing.jsx ──────── POST /api/v1/listings ────────────────► listings.py
  │                     POST /api/v1/listings/{id}/images ────► storage.py (validates magic bytes & saves)
  │
  │                     [ Buyer places order ]
  │
OrderCard.jsx ───────── POST /api/v1/orders/{id}/accept ──────► orders.py (services/orders.py)
  │                                                             Optimistic lock reserves stock
  │                                                             Order status -> 'accepted'
  │                                                             System message posted to chat
  │
  │                     [ Handover happens on campus ]
  │
OrderCard.jsx ───────── POST /api/v1/orders/{id}/complete ────► orders.py (services/orders.py)
                                                                Stock decremented, reservation cleared
                                                                Items sold count incremented (+1)
                                                                Order status -> 'completed'
                                                                        │
ReviewForm.jsx ◄─────── Both parties can now review ◄───────────────────┘
  │
  └──────────────────── POST /api/v1/orders/{id}/reviews ─────► reviews.py (services/ratings.py)
                                                                Calculates new store average
                                                                Seller rating updated in real-time
```

### Stage 1: Storefront Creation
1. **Frontend:** The student navigates to `/sell` (`frontend/src/pages/SellPage.jsx`). If they are not logged in, `ProtectedRoute` redirects them to `/login`.
2. The user fills in:
   - Store Name (e.g., "Karthik's Tech & Books Hub")
   - Bio (e.g., "Final-year CSE student clearing out coursework books")
   - Pickup Location Hint (e.g., "Hostel 3 Mess Entrance or IT Dept Block")
3. **HTTP Call:** `storesApi.create(data)` sends `POST /api/v1/stores` with `Authorization: Bearer <token>`.
4. **Backend (`routers/stores.py`):**
   - Validates that `current_user.has_storefront == False` (one storefront per student limit).
   - Verifies store name uniqueness (case-insensitive).
   - Inserts `Store` record into SQLite/PostgreSQL.
   - Sets `current_user.has_storefront = True`.
   - Returns HTTP 201 with `StoreResponse`.
5. **Frontend:** `AuthContext.updateUser({ has_storefront: true })` updates memory state, and the router navigates to `/dashboard`.

### Stage 2: Vendor Dashboard
1. **Frontend:** `frontend/src/pages/dashboard/Dashboard.jsx` loads under `SellerRoute`. If `has_storefront` is false, `SellerRoute` bounces them back to `/sell`.
2. **Parallel Queries:**
   - `listingsApi.myListings({ status: 'active' })` calls `GET /api/v1/me/listings`.
   - `ordersApi.list({ role: 'seller' })` calls `GET /api/v1/orders?role=seller`.
3. **Rendering:**
   - **Metrics Cards:** Computes total active listings, total inventory view count, incoming orders count, and total items sold.
   - **My Listings Table:** Displays all items with quick status filter tabs (`active`, `reserved`, `sold`), edit buttons, and delete buttons.
   - **Incoming Orders Feed:** Renders `OrderCard` components for pending customer requests.

### Stage 3: Publishing a New Listing
1. **Frontend:** Vendor clicks "Add New Listing" (`/dashboard/listings/new`).
2. `ListingForm.jsx` accepts title, description, category dropdown, price in ₹, condition, and quantity.
3. `ImageUploader.jsx` previews selected image files.
4. **HTTP Call 1:** `listingsApi.create(formData)` sends `POST /api/v1/listings`.
5. **Backend (`routers/listings.py`):**
   - `require_seller` dependency checks permissions.
   - Checks title & description against `PROHIBITED_KEYWORDS` (e.g. weapons, drugs, cigarettes).
   - Creates `Listing` record with `store_id = current_user.store.id` and `status = "active"`.
6. **HTTP Call 2:** `listingsApi.uploadImages(listing.id, files)` sends `POST /api/v1/listings/{id}/images` (multipart form).
7. **Backend (`services/storage.py`):**
   - Verifies each file's magic bytes.
   - Saves to `backend/uploads/{random_uuid}.jpg`.
   - Pillow generates a 300px thumbnail.
   - Inserts `ListingImage` rows linked to the listing.

### Stage 4: Order Acceptance & Concurrency Safety
1. **Frontend:** A buyer places an order request. On the vendor's dashboard, an incoming order card appears in `pending` status.
2. The vendor clicks **"Accept"**.
3. **HTTP Call:** `ordersApi.accept(order.id)` sends `POST /api/v1/orders/{id}/accept`.
4. **Backend (`routers/orders.py` -> `services/orders.py`):**
   - Checks that `order.status == "pending"`.
   - Runs the optimistic locking conditional update on `Listing`.
   - Increases `Listing.reserved_quantity += order.quantity`.
   - If all available stock is reserved, sets `Listing.status = "reserved"`.
   - Updates `order.status = "accepted"`.
   - Records an `OrderEvent(from_status="pending", to_status="accepted", actor_id=seller.id)`.
   - Automatically injects an automated system message into the in-app chat:
     `"[SYSTEM] Order #{id} was accepted by the seller. Please coordinate meetup details."`
   - Dispatches an in-app notification to the buyer.

### Stage 5: Handover & Order Completion
1. **Physical Meetup:** Buyer and vendor meet at the agreed campus location (e.g., "Central Library Plaza").
2. The vendor clicks **"Confirm Handover"** on their dashboard.
3. **HTTP Call:** `ordersApi.complete(order.id)` sends `POST /api/v1/orders/{id}/complete`.
4. **Backend (`services/orders.py`):**
   - Verifies `order.status == "accepted"`.
   - Releases the reservation and deducts stock:
     `listing.quantity -= order.quantity`
     `listing.reserved_quantity -= order.quantity`
   - If remaining quantity is `0`, sets `listing.status = "sold"`.
   - Increments `store.items_sold += order.quantity`.
   - Sets `order.status = "completed"`.
   - Records an `OrderEvent` audit row.

### Stage 6: Ratings & Seller Reply
1. Once completed, both buyer and vendor can submit a review via `ReviewForm.jsx`.
2. **Buyer Review:** `POST /api/v1/orders/{id}/reviews` with `{ rating: 5, comment: "Super fast handover!" }`.
3. **Backend (`routers/reviews.py`):**
   - Enforces business rule: must be an order participant, order must be completed, only one review per direction per order.
   - Inserts `Review` row with `direction = "buyer_to_seller"`.
   - Calls `recompute_store_rating(db, store_id)` in the same transaction.
   - Computes new running average and review count, updating the store.
4. **Seller Reply:** The vendor can reply once to the review via `POST /api/v1/reviews/{id}/reply` with `{ reply: "Thank you for the quick trade!" }`.

---

## 6. How to Start the App & Verify Logs

### 1. Launch the Backend
Open a PowerShell terminal:
```powershell
cd c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\backend
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Explorer: `http://localhost:8000/docs`
- Healthcheck Endpoint: `http://localhost:8000/health`

### 2. Launch the Frontend
Open a second PowerShell terminal:
```powershell
cd c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\frontend
npm run dev
```
- Open your browser at: `http://localhost:5173`

### 3. Observe the Live Observability Logs
Whenever you browse listings, log in, or accept an order, look at the backend terminal window. You will see:
```text
[2026-10-14 00:32:15] [INFO] [campusmart] [a1b2c3d4] POST /api/v1/auth/login -> 200 (12.4ms)
[2026-10-14 00:32:16] [INFO] [campusmart] [b2c3d4e5] GET /api/v1/me/listings -> 200 (6.1ms)
[2026-10-14 00:32:18] [INFO] [campusmart] [c3d4e5f6] POST /api/v1/orders/1/accept -> 200 (18.7ms)
```
If an unhandled error ever occurs, the middleware catches it, logs the full Python stack trace with the request ID, and prevents the server from crashing.
