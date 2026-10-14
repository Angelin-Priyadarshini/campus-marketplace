# Product Requirements Document — Multi-Vendor Campus Marketplace

**Course:** UIT2739 – Full Stack Development, SSN College of Engineering (Dept. of IT), 2025–26  
**Team:** Angelin Priyadarshini Mariappan (3122235002011), Balakkrishnan Govindhraj (3122235002024)  
**Document status:** v1.0 — implementation-ready  
**Primary audience:** AI coding agents and human reviewers.

---

## 1. Product Overview

**Product name:** CampusMart (configurable via `APP_NAME` / `VITE_APP_NAME`)

**One-liner:** A campus-only, peer-to-peer marketplace where verified students open mini-storefronts to sell second-hand textbooks, electronics and dorm essentials, and where other students discover, wishlist, chat with and rate those sellers.

### 1.1 Problem
Students currently trade used goods through scattered WhatsApp/Telegram groups and notice boards. Listings are lost in chat history, can't be searched, there is no way to verify who you're dealing with, and no record of seller reliability.

### 1.2 Solution Pillars
1. **Student Verification** — Sign-up with a campus email (`@ssn.edu.in`) so every buyer and seller is a verified student.
2. **Multi-Vendor Listings** — Any student can open a mini-storefront and list items.
3. **Smart Search & Filters** — Browse by keyword, category, price and condition.
4. **In-App Chat** — Buyers message sellers to negotiate and arrange campus meetups.
5. **Ratings & Reviews** — Post-transaction ratings build trust and reward reliable vendors.
6. **Secure Transactions** — Authenticated accounts + moderated listings keep trades safe.

### 1.3 Core Roles
- **Visitor:** Browse/search listings, view product & seller pages (read-only).
- **Student (Buyer):** Wishlist, message sellers, place purchase requests, track orders, leave reviews.
- **Student (Seller):** Any student with `has_storefront = true` (one-click "Open my storefront").
- **Admin / Moderator:** Review reports, hide/remove listings, suspend/unsuspend users, manage categories.

---

## 2. Architecture & Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS 3, React Router v6, TanStack Query, Axios, Lucide React.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2.
- **Database:** SQLite (default development) / PostgreSQL 15 (production).
- **Auth:** JWT (15-min access in memory + 7-day refresh in httpOnly cookie).
- **Chat:** In-process FastAPI WebSocket (`/ws/chat`) + REST fallback.
- **Storage:** Local disk under `backend/uploads/` (served at `/media/`) with Cloudinary fallback.
- **Deployment:** Docker Compose, Render (`render.yaml`), Vercel (`vercel.json`).
