# Architecture Decisions Log

> Decisions made during implementation where the PRD was silent or required a choice.

---

## D-001 — Password Hashing Library

**Decision:** Use `bcrypt` directly (`bcrypt.hashpw` / `bcrypt.checkpw`) instead of the `passlib` CryptContext wrapper.

**Reason:** `passlib 1.7.4` + `bcrypt 4.x` have a known compatibility issue: passlib's bug-detection routine attempts to hash a 73-byte password which triggers bcrypt's 72-byte limit guard. Calling `bcrypt` directly eliminates this incompatibility while maintaining identical security (bcrypt rounds=12).

**Reference:** `app/security.py`

---

## D-002 — SQLite Optimistic Locking (no SELECT FOR UPDATE)

**Decision:** Use a conditional UPDATE with a `version` column check for stock reservation instead of `SELECT FOR UPDATE`.

**Reason:** SQLite does not support `SELECT FOR UPDATE`. The PRD requires portability between SQLite and PostgreSQL. A conditional UPDATE (`UPDATE listings SET reserved_quantity = reserved_quantity + :qty, version = version + 1 WHERE id = :id AND version = :ver AND (quantity - reserved_quantity) >= :qty`) works identically on both databases.

**Reference:** `app/services/orders.py`

---

## D-003 — In-Memory Rate Limiting

**Decision:** Rate limiting for login attempts and email resend uses in-memory Python dicts rather than Redis or `slowapi`.

**Reason:** The PRD mandates zero paid services and zero manual setup. An in-memory dict satisfies the security requirement for single-process development. `slowapi` is installed in requirements.txt for production upgrade path.

**Reference:** `app/routers/auth.py`

---

## D-004 — Image Storage Fallback

**Decision:** When `CLOUDINARY_URL` is not set, images are stored under `backend/uploads/` and served at `/media/<filename>` via FastAPI StaticFiles.

**Reason:** PRD §4 explicitly specifies this fallback. Thumbnails are generated locally with Pillow (max 400 px on longest side, JPEG quality 80).

**Reference:** `app/services/storage.py`, `app/main.py`

---

## D-005 — Email Console Fallback

**Decision:** When `SMTP_HOST` is empty, verification and password-reset links are printed to the server console log instead of sending email.

**Reason:** PRD §4 explicitly specifies this. The message is formatted as `[EMAIL] To: ... Link: ...` for easy copy-paste during development.

**Reference:** `app/services/email.py`

---

## D-006 — Auto-Verify Flag

**Decision:** `AUTO_VERIFY=true` (the default in `.env.example`) marks all registered users as verified immediately without sending any email.

**Reason:** Allows reviewers to test the full application without configuring SMTP. Set `AUTO_VERIFY=false` to enforce the email verification flow.

**Reference:** `app/routers/auth.py`

---

## D-007 — JWT in Memory + Refresh in httpOnly Cookie

**Decision:** Access token is stored in React component state (memory) only. Refresh token is stored in an httpOnly, SameSite=lax cookie.

**Reason:** PRD §4 specifies this pattern. Avoids XSS access to the short-lived access token; the httpOnly cookie is inaccessible to JavaScript. On page reload, `AuthContext` calls `POST /auth/refresh` to silently restore the session.

**Reference:** `frontend/src/context/AuthContext.jsx`, `app/routers/auth.py`

---

## D-008 — Seed Placeholder Images via Pillow

**Decision:** The seed script generates gradient placeholder JPEG images programmatically using Pillow, writing them to `backend/uploads/`.

**Reason:** The PRD requires a populated marketplace with visible images out-of-the-box, without depending on external URLs that may break or require network access.

**Reference:** `app/seed.py`

---

## D-009 — Single-Process WebSocket ConnectionManager

**Decision:** WebSocket connections are tracked in an in-memory dict (`user_id → set[WebSocket]`) in a singleton `ConnectionManager`.

**Reason:** PRD §4 explicitly permits this for v1. Acceptable for single-process deployment. For multi-process production, this would be replaced with Redis Pub/Sub.

**Reference:** `app/ws/connection_manager.py`

---

## D-010 — Monorepo Layout Compliance

**Decision:** All files placed exactly as specified in PRD §4.2. No deviations.

**Reference:** `campus-marketplace/` root.

---

## D-011 — Windows Compatibility

**Decision:** All file paths use `pathlib.Path` or `os.path` APIs instead of forward-slash hardcoded strings. Console output uses ASCII tags (`[INFO]`, `[SUCCESS]`) to avoid `UnicodeEncodeError` on Windows CP1252 terminals.

**Reference:** `app/seed.py`, `app/services/storage.py`

---

## D-012 — Frontend Route Architecture

**Decision:** Used `createBrowserRouter` (Data Router API) from React Router v6.4+ with `React.lazy` + `Suspense` for code-splitting all pages.

**Reason:** Enables route-level code splitting for faster initial load. The `RouterProvider` pattern is the recommended modern React Router approach and enables future use of loaders/actions.

**Reference:** `frontend/src/App.jsx`, `frontend/src/routes.jsx`
