.PHONY: help build up down restart logs shell migrate makemigration test clean

help: ## Показати допомогу
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Docker команди
build: ## Побудувати Docker образи
	docker-compose build

up: ## Запустити всі сервіси
	docker-compose up -d

down: ## Зупинити всі сервіси
	docker-compose down

restart: ## Перезапустити всі сервіси
	docker-compose restart

logs: ## Показати логи всіх сервісів
	docker-compose logs -f

logs-backend: ## Показати логи backend
	docker-compose logs -f backend

logs-db: ## Показати логи бази даних
	docker-compose logs -f db

# Робота з контейнерами
shell-backend: ## Відкрити shell в backend контейнері
	docker-compose exec backend bash

shell-db: ## Відкрити psql в контейнері бази даних
	docker-compose exec db psql -U ohmyrevit ohmyrevit_db

# Міграції бази даних
migrate: ## Застосувати міграції
	docker-compose exec backend alembic upgrade head

makemigration: ## Створити нову міграцію
	docker-compose exec backend alembic revision --autogenerate -m "$(msg)"

downgrade: ## Відкатити останню міграцію
	docker-compose exec backend alembic downgrade -1

migration-history: ## Показати історію міграцій
	docker-compose exec backend alembic history

# Тестування
test: ## Запустити тести
	docker-compose exec backend pytest

test-coverage: ## Запустити тести з покриттям
	docker-compose exec backend pytest --cov=app --cov-report=html

# Утиліти
clean: ## Очистити невикористані Docker ресурси
	docker system prune -f

clean-all: ## Очистити всі Docker ресурси (обережно!)
	docker system prune -a -f --volumes

# Розробка
dev: ## Запустити в режимі розробки
	docker-compose up

install-backend: ## Встановити Python залежності
	docker-compose exec backend pip install -r requirements.txt

install-frontend: ## Встановити Node залежності
	docker-compose exec frontend npm install

format: ## Форматувати код (black)
	docker-compose exec backend black app/

lint: ## Перевірити код (flake8)
	docker-compose exec backend flake8 app/

# База даних
db-backup: ## Створити backup бази даних
	docker-compose exec db pg_dump -U ohmyrevit ohmyrevit_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Відновити базу даних з backup
	docker-compose exec -T db psql -U ohmyrevit ohmyrevit_db < $(file)

# Початкове налаштування
init: ## Початкове налаштування проєкту
	cp .env.example .env
	@echo "✅ Створено .env файл. Будь ласка, заповніть його вашими даними."
	@echo "📝 Редагуйте .env файл та запустіть 'make up' для старту проєкту"