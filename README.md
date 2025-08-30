# 🚀 OhMyRevit - Telegram Mini App Marketplace

Маркетплейс Revit плагінів як Telegram Mini App з підтримкою підписок, бонусної системи та автоматичних перекладів.

## 📋 Вимоги

- Docker і Docker Compose
- Make (опціонально, для зручності)
- Telegram Bot Token
- DeepL API ключ (для перекладів)
- Cryptomus акаунт (для платежів)

## 🛠️ Швидкий старт

### 1. Клонування репозиторію
```bash
git clone https://github.com/yourusername/ohmyrevit.git
cd ohmyrevit
```

### 2. Налаштування оточення
```bash
# Копіюємо приклад конфігурації
cp .env.example .env

# Редагуємо .env файл та додаємо ваші ключі
nano .env
```

### 3. Запуск проєкту

**З використанням Make:**
```bash
# Початкове налаштування
make init

# Запуск всіх сервісів
make up

# Застосування міграцій
make migrate
```

**Без Make:**
```bash
# Запуск сервісів
docker-compose up -d

# Застосування міграцій
docker-compose exec backend alembic upgrade head
```

### 4. Доступ до сервісів

- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8000
- 📚 **API Docs:** http://localhost:8000/api/docs
- 🗄️ **Adminer (БД):** http://localhost:8080

## 📁 Структура проєкту

```
ohmyrevit/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── core/           # Ядро додатку
│   │   ├── users/          # Модуль користувачів
│   │   ├── products/       # Модуль товарів
│   │   ├── orders/         # Модуль замовлень
│   │   └── subscriptions/  # Модуль підписок
│   ├── alembic/            # Міграції БД
│   └── tests/              # Тести
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── components/     # React компоненти
│   │   ├── pages/         # Сторінки
│   │   ├── services/      # API сервіси
│   │   └── store/         # Zustand store
│   └── public/            # Статичні файли
├── docker/                # Docker конфігурації
├── nginx/                 # Nginx конфігурації
└── docker-compose.yml     # Docker Compose
```

## 🔧 Корисні команди

### Docker
```bash
make up          # Запустити всі сервіси
make down        # Зупинити всі сервіси
make restart     # Перезапустити сервіси
make logs        # Показати логи
make shell-backend  # Shell в backend контейнері
```

### База даних
```bash
make migrate     # Застосувати міграції
make makemigration msg="опис"  # Створити нову міграцію
make db-backup   # Створити backup БД
make shell-db    # Підключитися до PostgreSQL
```

### Розробка
```bash
make dev         # Запуск в режимі розробки
make test        # Запустити тести
make format      # Форматувати код
make lint        # Перевірити код
```

## 🏗️ Архітектура

### Backend (FastAPI)
- **Модульна архітектура:** Кожен функціональний блок - окремий пакет
- **Асинхронність:** SQLAlchemy 2.0 з asyncpg
- **Інтернаціоналізація:** Автоматичні переклади через DeepL API
- **Безпека:** JWT авторизація, валідація Telegram даних

### Frontend (Next.js)
- **State Management:** Zustand
- **Стилізація:** TailwindCSS
- **Анімації:** Framer Motion
- **Telegram Integration:** @telegram-apps/sdk-react

### База даних (PostgreSQL)
- Користувачі та авторизація
- Товари з мультимовністю
- Замовлення та платежі
- Підписки та доступи
- Бонусна система

## 🔐 Безпека

1. Всі sensitive дані зберігаються в `.env`
2. JWT токени для авторизації
3. Валідація Telegram InitData
4. CORS налаштування
5. Rate limiting (в розробці)

## 📝 TODO

- [ ] Додати Redis кешування
- [ ] Реалізувати email сповіщення
- [ ] Додати адмін панель
- [ ] Інтегрувати Sentry моніторинг
- [ ] Написати тести
- [ ] Додати CI/CD

## 🤝 Внесок

1. Fork репозиторій
2. Створіть feature branch (`git checkout -b feature/amazing`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing`)
5. Відкрийте Pull Request

## 📄 Ліцензія

MIT License - див. [LICENSE](LICENSE) файл

## 📞 Підтримка

- Telegram: @yoursupport
- Email: support@ohmyrevit.com