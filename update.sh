#!/bin/bash

echo "🔄 Оновлення OhMyRevit з GitHub"
echo "================================"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Зберігаємо поточну директорію
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Крок 1: Перевірка git статусу (ігноруємо update.sh)
echo -e "\n${YELLOW}Крок 1: Перевірка локальних змін...${NC}"
CHANGES=$(git status -s | grep -v "update.sh" | grep -v "get-docker.sh")
if [[ -n "$CHANGES" ]]; then
    echo -e "${RED}⚠ У вас є незбережені локальні зміни!${NC}"
    git status -s | grep -v "update.sh" | grep -v "get-docker.sh"
    echo ""
    echo "Збережіть їх або скасуйте перед оновленням."
    exit 1
fi

# Крок 2: Отримуємо оновлення з GitHub
echo -e "\n${YELLOW}Крок 2: Завантаження оновлень з GitHub...${NC}"
git fetch origin

# Перевіряємо чи є нові коміти
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ Код вже актуальний${NC}"
    exit 0
fi

# Крок 3: Стягуємо зміни
echo -e "\n${YELLOW}Крок 3: Застосування оновлень...${NC}"
git pull origin main

# Крок 4: Перезбираємо та перезапускаємо контейнери
echo -e "\n${YELLOW}Крок 4: Перезапуск контейнерів...${NC}"
docker-compose build backend frontend
docker-compose up -d --no-deps backend frontend

# Крок 5: Застосування міграцій (якщо потрібно)
echo -e "\n${YELLOW}Крок 5: Перевірка міграцій...${NC}"
docker-compose exec -T backend alembic upgrade head

# Крок 6: Перевірка статусу
echo -e "\n${YELLOW}Крок 6: Перевірка статусу...${NC}"
docker-compose ps

echo -e "\n${GREEN}✅ Оновлення завершено успішно!${NC}"
echo -e "\nЛоги: docker-compose logs -f backend frontend"