# CampusMart API Reference

> Base URL (local): `http://localhost:8000/api/v1`  
> Interactive docs: `http://localhost:8000/docs` (Swagger UI)  
> Auth: Bearer token in `Authorization` header; refresh token in httpOnly cookie.

---

## Authentication — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | None | Register with campus email + password |
| `GET` | `/auth/verify-email?token=` | None | Verify email address |
| `POST` | `/auth/resend-verification` | None | Resend verification link (3/hour) |
| `POST` | `/auth/login` | None | Login → `{access_token, user}` + sets refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Get new access token from refresh cookie |
| `POST` | `/auth/logout` | Cookie | Clear refresh cookie |
| `POST` | `/auth/forgot-password` | None | Send password reset link |
| `POST` | `/auth/reset-password` | None | Reset password with token |

### POST /auth/register
```json
{
  "email": "priya@ssn.edu.in",
  "password": "Student@123",
  "full_name": "Priya S",
  "department": "Information Technology",
  "year_of_study": 2
}
```

### POST /auth/login
```json
{ "email": "priya@ssn.edu.in", "password": "Student@123" }
```
**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "full_name": "...", "role": "student", "has_storefront": false }
}
```

---

## Users — `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | ✅ | Own full profile |
| `PATCH` | `/users/me` | ✅ | Update name, department, year |
| `POST` | `/users/me/avatar` | ✅ | Upload avatar image (multipart) |
| `GET` | `/users/{id}` | None | Public profile (no email exposed) |
| `POST` | `/users/{id}/block` | ✅ | Block a user |
| `DELETE` | `/users/{id}/block` | ✅ | Unblock a user |

---

## Stores — `/api/v1/stores`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/stores` | ✅ | Create storefront (one per user) |
| `GET` | `/stores/{id}` | None | Public storefront with active listings |
| `PATCH` | `/stores/me` | ✅ Seller | Update own storefront |
| `GET` | `/stores/{id}/reviews` | None | Paginated buyer→seller reviews |

### POST /stores
```json
{
  "name": "Karthik's Tech Corner",
  "bio": "Selling my final-year stuff before graduation",
  "pickup_location_hint": "CS Block, 2nd floor"
}
```

---

## Categories — `/api/v1/categories`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/categories` | None | List all categories ordered by sort_order |

---

## Listings — `/api/v1/listings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/listings` | None | Search/filter/sort active listings |
| `GET` | `/listings/{id}` | None | Listing detail (increments view_count) |
| `GET` | `/listings/{id}/similar` | None | Same-category listings |
| `POST` | `/listings` | ✅ Seller | Create listing |
| `PATCH` | `/listings/{id}` | ✅ Owner | Update listing |
| `DELETE` | `/listings/{id}` | ✅ Owner | Soft-delete listing |
| `POST` | `/listings/{id}/images` | ✅ Owner | Upload images (max 6, 5MB each) |
| `DELETE` | `/listings/{id}/images/{img_id}` | ✅ Owner | Delete an image |
| `PUT` | `/listings/{id}/images/order` | ✅ Owner | Reorder images |
| `GET` | `/listings/me/listings` | ✅ Seller | Own listings (all statuses) |

### GET /listings query params
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword search (title + description) |
| `category_id` | int | Filter by category |
| `min_price` | float | Minimum price |
| `max_price` | float | Maximum price |
| `condition` | string (multi) | `new`, `like_new`, `good`, `fair`, `poor` |
| `sort` | string | `newest` (default), `price_asc`, `price_desc`, `popular` |
| `page` | int | Page number (default 1) |
| `page_size` | int | Items per page (default 12, max 50) |

---

## Wishlist — `/api/v1/wishlist`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/wishlist` | ✅ | List saved items with price-drop flag |
| `POST` | `/wishlist/{listing_id}` | ✅ | Add to wishlist (idempotent) |
| `DELETE` | `/wishlist/{listing_id}` | ✅ | Remove from wishlist |

---

## Conversations & Chat — `/api/v1/conversations`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/conversations` | ✅ | Create or get conversation for a listing |
| `GET` | `/conversations` | ✅ | Inbox (sorted by last message) |
| `GET` | `/conversations/{id}/messages` | ✅ | Message history (paginated) |
| `POST` | `/conversations/{id}/messages` | ✅ | Send message (REST fallback) |
| `POST` | `/conversations/{id}/read` | ✅ | Mark conversation as read |
| `GET` | `/conversations/unread-count` | ✅ | Total unread messages |

### WebSocket
```
WS /ws/chat?token=<access_token>
```
**Client → Server:**
```json
{ "type": "message", "conversation_id": 1, "body": "Is this still available?" }
{ "type": "read", "conversation_id": 1 }
```
**Server → Client (broadcast):**
```json
{ "type": "message", "message": { "id": 42, "conversation_id": 1, "sender_id": 2, "body": "...", "created_at": "..." } }
{ "type": "read", "conversation_id": 1 }
```

---

## Orders — `/api/v1/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orders` | ✅ | Place purchase request |
| `GET` | `/orders` | ✅ | List orders (`?role=buyer\|seller&status=`) |
| `GET` | `/orders/{id}` | ✅ | Order detail with events |
| `POST` | `/orders/{id}/accept` | ✅ Seller | Accept order (pending→accepted) |
| `POST` | `/orders/{id}/reject` | ✅ Seller | Reject order (pending→rejected) |
| `POST` | `/orders/{id}/complete` | ✅ Seller | Confirm handover (accepted→completed) |
| `POST` | `/orders/{id}/cancel` | ✅ Buyer/Seller | Cancel order |

**State machine:** `pending → accepted → completed`  
Alternate paths: `pending → rejected`, `pending/accepted → cancelled`

---

## Reviews — `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orders/{id}/reviews` | ✅ | Leave review (direction: buyer_to_seller \| seller_to_buyer) |
| `PATCH` | `/reviews/{id}` | ✅ Owner | Edit review (within 7 days) |
| `DELETE` | `/reviews/{id}` | ✅ Owner | Delete review (within 7 days) |
| `POST` | `/reviews/{id}/reply` | ✅ Seller | Add seller reply |

---

## Reports — `/api/v1/reports`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/reports` | ✅ | File a report (listing or user) |

---

## Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/notifications` | ✅ | List notifications (paginated) |
| `POST` | `/notifications/read` | ✅ | Mark as read (`{}` = all, `{ids:[...]}` = specific) |

---

## Admin — `/api/v1/admin` *(role: admin only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/stats` | Platform statistics |
| `GET` | `/admin/reports` | Report queue (`?status=open\|resolved\|dismissed`) |
| `POST` | `/admin/reports/{id}/resolve` | Resolve report (action: `hide_listing`, `restore_listing`, `suspend_user`, `unsuspend_user`, `dismiss`) |
| `GET` | `/admin/users` | User list (`?q=&page=`) |
| `POST` | `/admin/users/{id}/suspend` | Suspend user |
| `POST` | `/admin/users/{id}/unsuspend` | Unsuspend user |
| `GET` | `/admin/listings` | Listing list (`?q=&status=&page=`) |
| `POST` | `/admin/listings/{id}/hide` | Hide listing |
| `POST` | `/admin/listings/{id}/restore` | Restore listing |
| `GET` | `/admin/categories` | List categories |
| `POST` | `/admin/categories` | Create category |
| `PATCH` | `/admin/categories/{id}` | Update category |
| `DELETE` | `/admin/categories/{id}` | Delete category |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | `{"status":"ok","db":"ok","timestamp":"..."}` |

---

## Common Response Formats

### Paginated list
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 12,
  "total_pages": 4
}
```

### Error
```json
{ "detail": "Human-readable error message" }
```

HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`
