# 🚀 OhMyRevit - Revit Content Marketplace

Telegram Mini App маркетплейс преміум контенту для Autodesk Revit з підтримкою підписок, внутрішньої валюти (OMR Coins), бонусної системи та автоматичних перекладів.

![Version](https://img.shields.io/badge/version-1.7.3-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![Python](https://img.shields.io/badge/Python-3.11+-blue)

## 📋 Особливості

- ✅ **Telegram Mini App** - Нативна інтеграція з Telegram WebApp
- 💰 **OMR Coins** - Внутрішня валюта (100 coins = $1 USD)
- 🎁 **Бонусна система** - Щоденні бонуси та реферальна програма
- 🔐 **Dual Auth** - Telegram та Email/Password авторизація
- 📧 **Email система** - Resend + Gmail fallback
- 💳 **Gumroad платежі** - Інтеграція через webhook
- 🌍 **Мультимовність** - DeepL автопереклади (UK, EN, RU, DE, ES)
- 🎨 **Адаптивний дизайн** - Light/Dark теми з системною синхронізацією
- 📱 **PWA Ready** - Працює як звичайний веб-сайт і Telegram Mini App

## 🛠️ Технологічний стек

### Backend
- **FastAPI** - Асинхронний Python веб-фреймворк
- **SQLAlchemy 2.0** - ORM з async підтримкою
- **PostgreSQL** - Основна база даних
- **Redis** - Кешування та rate limiting
- **Alembic** - Міграції бази даних
- **Pydantic** - Валідація даних
- **APScheduler** - Фонові задачі (cleanup, webhooks)

### Frontend
- **Next.js 14** - React фреймворк з App Router
- **TypeScript** - Типізація
- **TailwindCSS** - Стилізація
- **Zustand** - State management
- **Framer Motion** - Анімації
- **React Hot Toast** - Нотифікації
- **React i18next** - Інтернаціоналізація

### Інфраструктура
- **Docker Compose** - Оркестрація сервісів
- **Nginx** - Reverse proxy (опціонально)
- **Cloudflare Tunnel** - Безпечний доступ (production)

### Зовнішні сервіси
- **Telegram Bot API** - Авторизація та повідомлення
- **Gumroad** - Платіжна система
- **Resend** - Email доставка
- **DeepL** - Автоматичні переклади
- **Sentry** - Error tracking (production)

## 📁 Структура проєкту

```
ohmyrevit/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── core/              # Інфраструктура (DB, auth, email, cache, scheduler)
│   │   ├── users/             # Користувачі та авторизація
│   │   ├── products/          # Каталог товарів
│   │   ├── orders/            # Замовлення та промокоди
│   │   ├── subscriptions/     # Premium підписки
│   │   ├── wallet/            # OMR Coins + Gumroad інтеграція
│   │   ├── bonuses/           # Щоденні бонуси та реферали
│   │   ├── collections/       # Користувацькі колекції (favorites)
│   │   ├── referrals/         # Реферальна система
│   │   ├── profile/           # Профіль та download доступи
│   │   ├── admin/             # Адмін панель
│   │   └── bot/               # Telegram webhook handler
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Pytest tests
│   └── uploads/               # File storage (images, archives)
├── frontend/                   # Next.js Frontend
│   ├── app/                   # Next.js App Router pages
│   │   ├── marketplace/       # Головна сторінка з товарами
│   │   ├── product/[id]/      # Деталі товару
│   │   ├── cart/              # Кошик
│   │   ├── subscription/      # Premium підписка
│   │   ├── profile/           # Профіль користувача
│   │   │   ├── wallet/        # Гаманець OMR Coins
│   │   │   ├── bonuses/       # Щоденні бонуси
│   │   │   ├── referrals/     # Реферальна програма
│   │   │   ├── downloads/     # Завантаження
│   │   │   ├── settings/      # Налаштування
│   │   │   └── faq/           # FAQ
│   │   └── admin/             # Адмін панель
│   ├── components/            # React компоненти
│   ├── store/                 # Zustand stores
│   ├── lib/                   # Utils та API client
│   ├── types/                 # TypeScript types
│   └── public/                # Статичні файли, локалізація
├── nginx/                     # Nginx конфігурації
├── docker-compose.yml         # Docker Compose setup
├── Makefile                   # Команди для розробки
├── CLAUDE.md                  # Документація для Claude Code
└── README.md                  # Цей файл
```

## 🚀 Швидкий старт

### Вимоги

- Docker та Docker Compose
- Make (опціонально, але рекомендовано)
- Telegram Bot Token (від [@BotFather](https://t.me/BotFather))
- DeepL API Key (опціонально, для автоперекладів)
- Resend API Key (для email розсилок)

### 1. Клонування та налаштування

```bash
# Клонуємо репозиторій
git clone https://github.com/yourusername/ohmyrevit.git
cd ohmyrevit

# Копіюємо .env.example в .env
make init
# АБО вручну:
cp .env.example .env

# Редагуємо .env та заповнюємо ключі
nano .env
```

### 2. Мінімальна конфігурація .env

```bash
# === КРИТИЧНО ВАЖЛИВІ ===
TELEGRAM_BOT_TOKEN=your_bot_token_here          # Від @BotFather
SECRET_KEY=your_secret_key_32_chars_min         # openssl rand -hex 32
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/ohmyrevit
RESEND_API_KEY=re_your_resend_key               # Email сервіс

# === URLs ===
FRONTEND_URL=http://localhost:3000              # Для development
BACKEND_URL=http://localhost:8000               # Для development
ALLOWED_ORIGINS=http://localhost:3000,https://t.me

# === ОПЦІОНАЛЬНО ===
DEEPL_API_KEY=your_deepl_key                    # Для автоперекладів
GUMROAD_WEBHOOK_SECRET=your_gumroad_secret      # Для Gumroad webhooks
SUPPORT_EMAIL=support@yourdomain.com            # Email підтримки
```

### 3. Запуск

```bash
# Збираємо та запускаємо контейнери
make build
make up

# Застосовуємо міграції БД
make migrate

# Дивимось логи
make logs
```

### 4. Доступ до сервісів

- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8000
- 📚 **API Docs (Swagger):** http://localhost:8000/api/docs
- 🗄️ **Adminer (DB GUI):** http://localhost:8080
  - Система: PostgreSQL
  - Сервер: db
  - Користувач: postgres
  - Пароль: postgres
  - База: ohmyrevit

## 🔧 Команди розробки

### Docker операції

```bash
make dev                # Запуск у foreground з логами
make up                 # Запуск у background
make down               # Зупинити всі сервіси
make restart            # Перезапустити сервіси
make logs               # Показати всі логи
make logs-backend       # Тільки backend логи
make logs-frontend      # Тільки frontend логи
make shell-backend      # Bash в backend контейнері
```

### База даних

```bash
make migrate                              # Застосувати міграції
make makemigration msg="опис змін"        # Створити нову міграцію
make downgrade                            # Rollback одну міграцію
make migration-history                    # Історія міграцій
make shell-db                             # PostgreSQL shell
make db-backup                            # Backup БД
make db-restore file=backup.sql           # Відновити з backup
```

### Тестування

```bash
# Всі тести
docker-compose exec backend pytest -v

# Конкретний файл
docker-compose exec backend pytest tests/test_wallet.py -v

# Конкретний тест
docker-compose exec backend pytest tests/test_wallet.py::test_purchase -v

# З покриттям
make test-coverage

# Простий тест (перевірка setup)
make test-simple
```

### Code quality

```bash
make format             # Black code formatting
make lint               # Flake8 linting
make type-check         # TypeScript type checking (frontend)
```

## 🏗️ Архітектура

### Backend - Модульна структура

Кожен функціональний блок - це окремий пакет під `backend/app/` з власними:
- `models.py` - SQLAlchemy моделі
- `schemas.py` - Pydantic схеми (валідація)
- `router.py` - FastAPI ендпоінти
- `service.py` - Бізнес логіка
- `dependencies.py` - FastAPI dependencies (опціонально)

**Ключові модулі:**
- `core/` - Database, auth, email, cache, scheduler, translations
- `users/` - Реєстрація, авторизація (Telegram + Email)
- `wallet/` - OMR Coins, Gumroad webhook
- `subscriptions/` - Premium підписки
- `bonuses/` - Щоденні бонуси, referral rewards
- `admin/` - Адмін панель (CRUD products, users, stats)

### Frontend - Next.js App Router

**State Management:**
- `authStore` - Авторизація (JWT, user data)
- `cartStore` - Кошик покупок
- `languageStore` - Мова інтерфейсу
- `uiStore` - UI стан (modals, theme)

**API Layer:**
- Централізований axios client в `lib/api.ts`
- Автоматична інжекція JWT токену та `Accept-Language`
- Перехоплення 401 помилок (auto logout)

**Теми:**
- Система автоматичної синхронізації з Telegram та OS theme
- Light/Dark mode через `useTheme()` hook
- Колірна палітра в `lib/theme.ts`

### Авторизація

**Telegram Flow:**
1. Frontend отримує `window.Telegram.WebApp.initData`
2. POST `/api/v1/auth/telegram` з initData
3. Backend валідує HMAC-SHA256 підпис
4. Повертає JWT token
5. Frontend зберігає в Zustand + localStorage

**Email Flow:**
1. Реєстрація: POST `/api/v1/auth/register`
2. Email verification: GET `/api/v1/auth/verify-email?token=...`
3. Login: POST `/api/v1/auth/login-email`
4. Повертає JWT token

**Account Merging:**
- Telegram користувач може додати email
- Email користувач може підключити Telegram
- При merge: балланс сумується, streak залишає максимальний

### Платежі

**OMR Coins система:**
- Конверсія: 100 coins = $1 USD
- Coin packs продаються через Gumroad
- Webhook: `POST /api/v1/webhooks/gumroad`
- Валідація signature через `GUMROAD_WEBHOOK_SECRET`
- Автоматичне зарахування на баланс

**Gumroad Integration:**
1. Користувач клікає "Buy Pack"
2. Перехід на Gumroad з `custom_fields[user_id]`
3. Після оплати Gumroad надсилає webhook
4. Backend створює `Transaction`, оновлює баланс
5. Користувач бачить оновлений баланс

**Покупка продуктів:**
- Списання OMR Coins з балансу
- Створення `Order` та `OrderItem`
- Надання доступу через `UserProductAccess`
- Email з download links

### Підписка

- Ціна: 500 OMR coins ($5 USD)
- Тривалість: 30 днів
- Доступ до всіх `product_type='premium'` товарів
- Auto-renewal: керується користувачем
- Expiration warnings через Telegram bot

### Бонусна система

**Щоденні бонуси:**
- День 1: 10 coins
- День 2: 20 coins
- День 3: 30 coins
- День 4: 40 coins
- День 5+: 50 coins
- Streak скидається якщо пропустити день

**Реферальна програма:**
- Кожен користувач має унікальний `referral_code`
- Deep link: `t.me/your_bot?start=ref_CODE`
- 5% від всіх покупок рефералів (депозити, продукти)
- Виплата у OMR Coins

### Email система

**Resend (primary):**
- Основний email сервіс
- Використовує `RESEND_API_KEY`
- Domain verification потрібен для production

**Gmail Fallback:**
- Запасний варіант якщо Resend недоступний
- Налаштовується через `GMAIL_USER` та `GMAIL_APP_PASSWORD`

**Email types:**
- Verification emails (нові користувачі, merge)
- Order confirmations (з download links)
- Subscription notifications
- Password reset

### Фонові задачі (Scheduler)

**Daily cleanup (00:00 UTC):**
- Видалення непідтверджених email акаунтів (>7 днів)
- Не торкається Telegram-only користувачів
- Double-check на `is_email_verified`

**Subscription check (щогодини):**
- Перевірка закінчення підписок
- Telegram нотифікації за 3 дні, 1 день до закінчення

## 🔐 Безпека

### Best Practices

1. **Environment Variables** - Всі секрети в `.env`, не в коді
2. **JWT Authentication** - Підписані токени, експірація 48 годин
3. **Telegram InitData Validation** - HMAC-SHA256 перевірка
4. **CORS** - Налаштовані дозволені origins
5. **Rate Limiting** - Redis-based (100 req/60s на API routes)
6. **SQL Injection Protection** - SQLAlchemy ORM
7. **XSS Protection** - React автоматичний escaping
8. **Password Hashing** - bcrypt з солями
9. **Email Verification** - Обов'язкове для покупок
10. **Webhook Signatures** - Gumroad signature validation

### Security Headers

```python
# CORS
ALLOWED_ORIGINS = ["http://localhost:3000", "https://t.me", "https://web.telegram.org"]

# JWT
SECRET_KEY = "min-32-chars-random-string"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 48
```

## 🌍 Інтернаціоналізація

### Підтримувані мови

- 🇺🇦 Українська (основна)
- 🇬🇧 English
- 🇷🇺 Русский
- 🇩🇪 Deutsch
- 🇪🇸 Español

### Переклади

**Backend:**
- Хардкодені в `backend/app/core/translations.py`
- Використання: `get_text("key", "uk", param1=value)`
- Header: `Accept-Language: uk`

**Frontend:**
- JSON файли в `frontend/public/locales/{lang}.json`
- i18next + react-i18next
- Auto-detection з Telegram та browser language

**Автоматичні переклади:**
- DeepL API для перекладу product content
- Автоматичне заповнення `title_en`, `description_ru`, і т.д.

## 📊 Адмін панель

**Доступ:** `/admin` (потрібен `is_admin=true` в БД)

**Функціонал:**
- 📦 Products CRUD - створення, редагування, видалення
- 👥 Users management - перегляд, редагування балансу, admin права
- 📈 Statistics - графіки продажів, підписок, активних користувачів
- 🎟️ Promo codes - створення, статистика використання
- 📤 File uploads - завантаження зображень та архівів
- 🔍 Search та фільтрація по всіх сутностях

## 🐛 Troubleshooting

### Telegram Webhook не встановлюється

**Проблема:** Backend логи показують помилку встановлення webhook

**Рішення:**
1. Переконайтесь що `BACKEND_URL` публічно доступний
2. Використовуйте ngrok/Cloudflare Tunnel для локальної розробки
3. Webhook URL: `{BACKEND_URL}/api/v1/webhook/{BOT_TOKEN}`

### 401 Unauthorized в API

**Можливі причини:**
- JWT токен закінчився (>48 годин)
- Токен не передано в header `Authorization: Bearer <token>`
- Користувач деактивований (`is_active=false`)

**Рішення:**
- Перелогінитись (frontend auto-logout при 401)
- Перевірити що токен передається в axios interceptor

### CORS помилки

**Рішення:**
```bash
# В .env додайте origin
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Файли не завантажуються

**Перевірте:**
1. `MAX_UPLOAD_SIZE_MB` в `.env` (default: 500MB)
2. Права на `/app/uploads` в backend контейнері
3. Volume mount: `backend_uploads:/app/uploads`

### База даних migration conflicts

```bash
# Rollback
make downgrade

# Видалити конфліктні файли міграцій
rm backend/alembic/versions/conflicting_*.py

# Створити нову
make makemigration msg="fix conflicts"

# Застосувати
make migrate
```

## 🚀 Production Deployment

### Чеклист

- [ ] `ENVIRONMENT=production` в `.env`
- [ ] `DEBUG=False`
- [ ] Сильний `SECRET_KEY` (32+ chars)
- [ ] Валідний `SENTRY_DSN` для error tracking
- [ ] `ALLOWED_ORIGINS` без wildcards
- [ ] HTTPS для `FRONTEND_URL` та `BACKEND_URL`
- [ ] Налаштувати Cloudflare Tunnel або reverse proxy
- [ ] DNS записи (SPF, DKIM, DMARC) для email домену
- [ ] Resend domain verification
- [ ] Database backups (cron + `make db-backup`)
- [ ] Gunicorn замість uvicorn (production ASGI server)
- [ ] Rate limiting налаштовано під реальний трафік
- [ ] Monitoring (Sentry, logs aggregation)

### Docker Production

```bash
# У docker-compose.yml змініть:
command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Запустіть
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
    }
}
```

## 📝 Changelog

### v1.7.3 (Current)
- ✉️ Оновлено email підтримки на support@ohmyrevit.pp.ua
- 🎨 Уніфікація дизайн системи з useTheme()

### v1.7.2
- 🎨 Повна уніфікація frontend теми

### v1.7.1
- ✉️ Додано Resend email сервіс з Gmail fallback

### v1.6.8
- 📜 Додано Privacy Policy сторінку
- 🌍 Українська локалізація privacy policy

### v1.6.7
- 🔐 Виправлено критичний баг з account merge (email verification bypass)
- ✅ Додано перевірку email перед оплатою (EmailRequiredModal)
- 🔄 Покращено безпеку cleanup scheduler

## 🤝 Contributing

1. Fork репозиторій
2. Створіть feature branch: `git checkout -b feature/amazing-feature`
3. Commit зміни: `git commit -m 'Add amazing feature'`
4. Push в branch: `git push origin feature/amazing-feature`
5. Відкрийте Pull Request

**Coding Standards:**
- Backend: Black formatting, Flake8 linting
- Frontend: ESLint + Prettier
- Commit messages українською або англійською
- Version bumps у commit message (e.g., "1.7.4 Add Stripe integration")

## 📄 Ліцензія

Proprietary - Всі права захищені

## 📞 Підтримка

- 📧 Email: support@ohmyrevit.pp.ua
- 💬 Telegram: [@your_support_bot](https://t.me/your_support_bot)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ohmyrevit/issues)

## 🙏 Подяки

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework
- [Telegram](https://core.telegram.org/bots/webapps) - Mini Apps platform
- [Gumroad](https://gumroad.com/) - Payment processing
- [Resend](https://resend.com/) - Email delivery
- [DeepL](https://www.deepl.com/) - Translation API

---

Made with ❤️ for Revit community
