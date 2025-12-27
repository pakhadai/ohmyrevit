# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OhMyRevit is a Telegram Mini App marketplace for Revit plugins with subscription management, bonus system, and multi-language support. The application is a full-stack TypeScript/Python project running in Docker.

**Stack:**
- **Backend:** FastAPI (Python 3.x) with SQLAlchemy 2.0 async, PostgreSQL, Redis
- **Frontend:** Next.js 14 (App Router) with TypeScript, TailwindCSS, Zustand
- **Infrastructure:** Docker Compose, Nginx, Cloudflare Tunnel
- **External Services:** Telegram Bot API, DeepL (translations), Gumroad (payments), Resend (emails)

## Development Commands

### Initial Setup
```bash
make init              # Copy .env.example to .env (must edit manually after)
make build             # Build all Docker images
make up                # Start all services
make migrate           # Apply database migrations
```

### Daily Development
```bash
make dev               # Run in foreground with logs
make logs              # Show all logs
make logs-backend      # Backend logs only
make restart           # Restart all services
make down              # Stop all services
```

### Database Operations
```bash
make migrate                              # Apply migrations
make makemigration msg="description"      # Create new migration
make downgrade                            # Rollback one migration
make migration-history                    # Show migration history
make shell-db                             # PostgreSQL shell
make db-backup                            # Backup database
make db-restore file=backup_file.sql      # Restore from backup
```

### Backend Development
```bash
make shell-backend                        # Bash shell in backend container
docker-compose exec backend pytest -v     # Run all tests
make test-simple                          # Run simple test for setup verification
make test-coverage                        # Tests with HTML coverage report
make format                               # Format code with black
make lint                                 # Lint with flake8
```

### Frontend Development
```bash
docker-compose exec frontend npm run dev        # Start dev server (already runs by default)
docker-compose exec frontend npm run build      # Build for production
docker-compose exec frontend npm run type-check # TypeScript type checking
docker-compose exec frontend npm run lint       # ESLint
```

### Running Single Tests
```bash
# Run specific test file
docker-compose exec backend pytest tests/test_specific.py -v

# Run specific test function
docker-compose exec backend pytest tests/test_file.py::test_function_name -v

# Run with output
docker-compose exec backend pytest tests/test_file.py -v -s
```

## Architecture

### Backend Structure (FastAPI)

The backend follows a **modular architecture** where each functional domain is a separate package under `backend/app/`:

- **`core/`** - Shared infrastructure (database, auth, config, translations, scheduler, rate limiting, email, caching, Telegram service)
- **`users/`** - User management and Telegram authentication
- **`products/`** - Product catalog with multilingual support
- **`orders/`** - Order processing and promo codes
- **`subscriptions/`** - Premium subscription management
- **`wallet/`** - OMR Coins wallet system and Gumroad integration
- **`bonuses/`** - Daily bonus and referral system
- **`collections/`** - User product collections (favorites)
- **`referrals/`** - Referral tracking and rewards
- **`profile/`** - User profile and download access
- **`admin/`** - Admin panel endpoints
- **`bot/`** - Telegram webhook handler

**Key patterns:**
- Each module has: `models.py`, `schemas.py`, `router.py`, `service.py`
- Database: Async SQLAlchemy 2.0 with `AsyncSession`
- Dependency injection via FastAPI `Depends()`
- Authentication via JWT tokens in headers (`Authorization: Bearer <token>`)
- All routers mounted in `main.py` under `/api/v1` prefix
- Admin routes under `/api/v1/admin` with `require_admin` dependency

### Telegram Integration

- **Authentication:** Uses Telegram InitData validation (HMAC-SHA256)
- **Bot Webhook:** Set automatically on startup to `{BACKEND_URL}/webhook/{BOT_TOKEN}`
- **Start Command:** Handles referral codes via deep links (`/start ref_<code>`)
- **Auth Flow:** `frontend` → Telegram SDK → `POST /api/v1/auth/telegram` → JWT token

### Multilingual System

- **Storage:** Translations in `backend/app/core/translations.py` (currently hardcoded Ukrainian, future: JSON files)
- **API:** Accepts `Accept-Language` header (`uk`, `en`, `ru`, `de`, `es`)
- **Products:** Store translations per language (title_uk, title_en, etc.)
- **DeepL:** Auto-translate product content when created (configured via `DEEPL_API_KEY`)

### Frontend Structure (Next.js)

```
frontend/
├── app/              # Next.js App Router pages
│   ├── marketplace/  # Main marketplace page
│   ├── product/      # Product details
│   ├── profile/      # User profile
│   ├── cart/         # Shopping cart
│   ├── subscription/ # Subscription management
│   └── admin/        # Admin panel
├── components/       # Reusable React components
├── store/           # Zustand stores (authStore, cartStore, uiStore, etc.)
├── lib/             # Utilities and API client
│   └── api.ts       # Axios instance with interceptors
├── types/           # TypeScript type definitions
└── middleware.ts    # Next.js middleware
```

**State Management:**
- **Zustand** stores in `frontend/store/`
- Stores persist to localStorage automatically
- Key stores: `authStore` (JWT token), `cartStore`, `languageStore`, `uiStore`

**API Client:**
- Centralized in `lib/api.ts`
- Auto-injects JWT token and `Accept-Language` from localStorage
- Intercepts 401 errors to clear auth state

### Database Schema

**Key relationships:**
- `User` → `Order` (one-to-many)
- `User` → `Subscription` (one-to-one active)
- `User` → `UserProductAccess` (many products)
- `Product` → `Category` (many-to-many via `product_categories`)
- `Order` → `OrderItem` → `Product`
- `User` → `Collection` → `CollectionProduct`
- `User` (referrer) → `User` (referee) via `referral_code`

**Migrations:**
- Managed by Alembic in `backend/alembic/`
- Auto-generate: `make makemigration msg="description"`
- Models must inherit from `app.core.database.Base`

### Payment Flow

1. **Gumroad Integration** (external payment processor)
2. Webhook: `POST /api/webhooks/gumroad` validates signature
3. Creates `Transaction` and `Order` records
4. Grants product access via `UserProductAccess`
5. Sends email with download links via Resend
6. Notifies user via Telegram bot

### Subscription System

- **Price:** Defined in OMR Coins (default: 500 coins = $5 USD)
- **Access:** Premium subscription grants access to all `product_type='premium'` products
- **Auto-renewal:** Managed via `Subscription.auto_renew_enabled`
- **Expiration Check:** Background scheduler task in `core/scheduler.py`
- **Telegram Notifications:** Sent on subscription activation and expiration warnings

### OMR Coins System

- **Conversion:** 100 coins = $1 USD (configurable via `COINS_PER_USD`)
- **Wallet:** Each user has a wallet balance in coins
- **Earn:** Daily bonuses, referral bonuses, admin grants
- **Spend:** Purchase products, subscriptions (prices stored in USD, converted to coins)
- **Transactions:** All wallet changes logged in `wallet.Transaction`

### Rate Limiting

- Implemented via `core/rate_limit.py`
- Applied to `/api/v1` routes (not admin or webhooks)
- Default: 100 requests per 60-second window
- Uses Redis for distributed state

### Caching

- Redis-backed cache in `core/cache.py`
- Used for: Telegram auth validation, frequently accessed data
- TTL varies by use case

## Important Configuration

### Environment Variables (`.env`)

**Required:**
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
- `SECRET_KEY` - JWT signing key (min 32 chars, use `openssl rand -hex 32`)
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql+asyncpg://user:pass@host:port/db`)
- `DEEPL_API_KEY` - DeepL API key for translations
- `RESEND_API_KEY` - Resend API key for emails

**URLs:**
- `FRONTEND_URL` - Public URL where frontend is accessible (e.g., `https://app.ohmyrevit.com`)
- `BACKEND_URL` - Public URL for backend API (for webhook setup)
- `ALLOWED_ORIGINS` - CORS origins (comma-separated, e.g., `http://localhost:3000,https://t.me`)

**Optional:**
- `SENTRY_DSN` - Sentry error tracking (required if `ENVIRONMENT=production`)
- `GUMROAD_WEBHOOK_SECRET` - Gumroad webhook signature validation

### Service URLs (Docker)

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs (dev only)
- Adminer (DB GUI): http://localhost:8080

### File Uploads

- **Storage:** `/app/uploads` in backend container (mounted volume `backend_uploads`)
- **Admin endpoints:** `POST /api/v1/admin/upload/image` and `/api/v1/admin/upload/archive`
- **Serving:** Via FastAPI `StaticFiles` at `/uploads/` URL path
- **Frontend access:** Shared volume mounted at `/app/public/uploads`

## Code Patterns

### Adding a New Endpoint

1. Create/update schema in `schemas.py` (request/response models)
2. Add business logic to `service.py`
3. Add route handler in `router.py`
4. Import and mount router in `main.py` if new module
5. Create migration if adding/modifying models: `make makemigration msg="description"`

### Authentication Flow

**Protected routes:**
```python
from app.users.dependencies import get_current_user

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id}
```

**Admin-only routes:**
```python
from app.core.auth import require_admin

@router.get("/admin/data")
async def admin_route(admin: User = Depends(require_admin)):
    return {"admin_id": admin.id}
```

### Database Queries (Async)

```python
from sqlalchemy import select
from app.core.database import get_db

async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.is_active == True))
    products = result.scalars().all()
    return products
```

### Translations

```python
from app.core.translations import get_text

message = get_text("order_msg_success_title", "uk", order_id=123)
# Returns: "✅ *Замовлення #123 успішно оплачено!*"
```

### Frontend API Calls

```typescript
import { productsAPI } from '@/lib/api';

const products = await productsAPI.getProducts({
  category: 'plugins',
  product_type: 'premium',
  limit: 20
});
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyStore {
  value: string;
  setValue: (val: string) => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      value: '',
      setValue: (val) => set({ value: val })
    }),
    { name: 'my-storage' }
  )
);
```

## Testing

- Tests in `backend/tests/`
- Use `pytest` with async support (`pytest-anyio`)
- Mock time with `freezegun`
- Database: Use test database or in-memory SQLite for unit tests
- Run specific tests: `docker-compose exec backend pytest tests/test_file.py::test_name -v`

## Debugging

### Backend Logs
```bash
make logs-backend
# Or with follow and filter:
docker-compose logs -f backend | grep ERROR
```

### Frontend Logs
```bash
docker-compose logs -f frontend
```

### Database Shell
```bash
make shell-db
# Then: SELECT * FROM users LIMIT 10;
```

### Python Shell with App Context
```bash
make shell-backend
python
>>> from app.core.database import AsyncSessionLocal
>>> from app.users.models import User
>>> import asyncio
>>> # Use asyncio.run() for async operations
```

## Common Issues

### Migration Conflicts
If multiple migrations conflict:
```bash
make downgrade  # Rollback
# Edit migration files manually
make migrate    # Re-apply
```

### Telegram Webhook Not Set
Check backend logs on startup. Webhook sets automatically. Verify `BACKEND_URL` in `.env` is publicly accessible.

### 401 Unauthorized Errors
- JWT token expired (default: 48 hours)
- Token not in `Authorization: Bearer <token>` header
- User account disabled (`is_active=false`)

### File Upload Issues
- Check `MAX_UPLOAD_SIZE_MB` in `.env`
- Ensure `/app/uploads` directory has write permissions
- Verify `backend_uploads` volume is mounted correctly

### CORS Errors
- Add origin to `ALLOWED_ORIGINS` in `.env`
- In development, `ALLOWED_ORIGINS=""` allows all origins (not recommended for production)

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Set `DEBUG=False`
3. Configure `SENTRY_DSN` for error monitoring
4. Use strong `SECRET_KEY` (32+ chars)
5. Set specific `ALLOWED_ORIGINS` (no wildcards)
6. Use HTTPS for `FRONTEND_URL` and `BACKEND_URL`
7. Consider using `gunicorn` instead of `uvicorn --reload`
8. Set up regular database backups: `make db-backup`
9. Configure Cloudflare tunnel or reverse proxy (nginx config in `nginx/`)

## Version Control

- Main branch: `main`
- Commit messages in Ukrainian or English
- Include version bumps in commits (e.g., "1.6.6 Fix profile page theme system")
