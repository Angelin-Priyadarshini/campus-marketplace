# CampusMart — Multi-Vendor Campus Marketplace

> **Course:** UIT2739 – Full Stack Development | SSN College of Engineering, Dept. of IT, 2025–26  
> **Team:** Angelin Priyadarshini Mariappan (3122235002011) · Balakkrishnan Govindhraj (3122235002024)

A **campus-only, peer-to-peer marketplace** where verified students open mini-storefronts to sell second-hand textbooks, electronics and dorm essentials — with built-in chat, wishlists, orders and seller ratings.

---

## 🚀 Quick Start (under 5 minutes)

### Prerequisites
- Python 3.11+ with `pip`
- Node.js 18+ with `npm`
- Git

### 1 — Clone & configure
```bash
git clone <repo-url>
cd campus-marketplace
```

### 2 — Backend setup
```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

pip install -r requirements.txt
alembic upgrade head           # creates campusmart.db with all tables
python -m app.seed             # seeds demo data (idempotent)
uvicorn app.main:app --reload  # http://localhost:8000
```

### 3 — Frontend setup (new terminal)
```bash
cd frontend
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux

npm install
npm run dev                    # http://localhost:5173
```

Open **http://localhost:5173** — you'll see a populated marketplace immediately.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ssn.edu.in | Admin@12345 |
| Student (Buyer) | priya@ssn.edu.in | Student@123 |
| Student (Seller) | karthik@ssn.edu.in | Student@123 |
| Student (Seller) | divya@ssn.edu.in | Student@123 |
| Student (Seller) | arjun@ssn.edu.in | Student@123 |
| Student (Seller) | meera@ssn.edu.in | Student@123 |
| Student | ravi@ssn.edu.in | Student@123 |
| Student | vijay@ssn.edu.in | Student@123 |
| Student | sana@ssn.edu.in | Student@123 |

> **Note:** `AUTO_VERIFY=true` in `.env` so all accounts are pre-verified. Email registration uses the `ssn.edu.in` domain allowlist — set `ALLOW_ANY_EMAIL=true` to disable.

---

## 🗂️ Project Structure

```
campus-marketplace/
├── README.md
├── docker-compose.yml        # Docker: Postgres + backend + frontend
├── render.yaml               # Render deployment config
├── .gitignore
├── docs/
│   ├── PRD.md                # Full product requirements
│   ├── DECISIONS.md          # Architecture decisions log
│   ├── API.md                # REST API reference
│   └── ER_DIAGRAM.md         # Entity-relationship diagram
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/versions/     # Database migrations
│   └── app/
│       ├── main.py           # FastAPI app factory
│       ├── config.py         # Pydantic settings
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic request/response schemas
│       ├── routers/          # API route handlers (13 routers)
│       ├── services/         # Business logic (storage, email, orders, ratings)
│       ├── ws/               # WebSocket chat (ConnectionManager)
│       └── seed.py           # Demo data seeder
│   └── tests/                # Pytest test suite (26 passing)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── api/              # Axios API client modules (12 modules)
        ├── context/          # AuthContext (JWT + refresh cookie)
        ├── components/       # UI kit + domain components
        ├── pages/            # All route pages
        └── tests/            # Vitest tests
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./campusmart.db` | SQLite or `postgresql+psycopg2://...` |
| `JWT_SECRET` | *(required)* | Long random secret for signing JWTs |
| `ALLOWED_EMAIL_DOMAINS` | `ssn.edu.in` | Comma-sep list of allowed email domains |
| `ALLOW_ANY_EMAIL` | `false` | Set `true` to skip domain validation |
| `AUTO_VERIFY` | `true` | Skip email verification step |
| `CLOUDINARY_URL` | *(empty)* | If set, images go to Cloudinary; else local disk |
| `SMTP_HOST` | *(empty)* | If empty, verification/reset links are console-logged |
| `ADMIN_EMAIL` | `admin@ssn.edu.in` | Seeded admin account |
| `ADMIN_PASSWORD` | `Admin@12345` | Seeded admin password |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Backend REST API base URL |
| `VITE_WS_URL` | `ws://localhost:8000` | WebSocket base URL |
| `VITE_APP_NAME` | `CampusMart` | Displayed app name |

---

## 🧪 Running Tests

### Backend (pytest)
```bash
cd backend
pytest tests/ -v
# Expected: 26 passed
```

### Frontend (Vitest)
```bash
cd frontend
npm test
# Expected: all tests pass
```

---

## 🐳 Docker (optional)

```bash
# From repo root
docker compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# vercel.json already configured for SPA rewrites
vercel --prod
```

### Backend → Render
- Import repo on [render.com](https://render.com)
- Use `render.yaml` (auto-detects config)
- Set `ADMIN_PASSWORD` and `JWT_SECRET` as secret env vars in the Render dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6 |
| State | TanStack Query (server state), React Context (auth) |
| HTTP | Axios + JWT interceptor with silent refresh |
| Backend | Python 3.11+, FastAPI 0.111 |
| ORM | SQLAlchemy 2.x + Alembic migrations |
| Validation | Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL 15 (prod) |
| Auth | JWT (access 15 min + refresh 7 days, httpOnly cookie) |
| Realtime | FastAPI WebSocket + in-memory ConnectionManager |
| Images | Cloudinary (if configured) or local disk at `/media/` |
| Email | SMTP or console fallback |
| Testing | pytest + httpx (backend) · Vitest + RTL (frontend) |

---

## 📡 Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/register` | Register with campus email |
| `POST` | `/api/v1/auth/login` | Login → access token + refresh cookie |
| `GET` | `/api/v1/listings` | Search/filter listings |
| `GET` | `/api/v1/listings/{id}` | Listing detail |
| `POST` | `/api/v1/stores` | Create storefront |
| `POST` | `/api/v1/conversations` | Start chat with seller |
| `WS` | `/ws/chat?token=` | Real-time chat |
| `POST` | `/api/v1/orders` | Place purchase request |
| `GET` | `/api/v1/admin/stats` | Platform statistics |

Full API reference: [`docs/API.md`](docs/API.md) · Interactive docs: `http://localhost:8000/docs`

---

## 📋 Features

- ✅ **Student Verification** — campus email allowlist, email verification link
- ✅ **Multi-Vendor Listings** — any student can open a storefront and list items
- ✅ **Smart Search & Filters** — keyword, category, price range, condition, sort
- ✅ **In-App Real-Time Chat** — WebSocket chat anchored to each listing
- ✅ **Ratings & Reviews** — buyer→seller and seller→buyer reviews after completed orders
- ✅ **Order State Machine** — pending → accepted → completed (with cancel/reject)
- ✅ **Wishlist** — save items, price-drop indicator
- ✅ **Admin Moderation** — report queue, hide listings, suspend users, category management
- ✅ **Responsive UI** — mobile-first, 360 px viewport support
- ✅ **Zero paid services** — works fully offline with SQLite + local image storage

---

*Made with ❤️ for UIT2739 – Full Stack Development, SSN College of Engineering 2025–26*
