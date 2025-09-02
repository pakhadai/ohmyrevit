#!/bin/bash

echo "🧹 OhMyRevit - Повне очищення та перезапуск"
echo "========================================="

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Крок 1: Зупинка контейнерів
echo -e "\n${YELLOW}Крок 1: Зупинка всіх контейнерів...${NC}"
docker-compose down -v

# Крок 2: Очищення кешу Next.js
echo -e "\n${YELLOW}Крок 2: Очищення кешу фронтенду...${NC}"
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
rm -rf frontend/out
rm -rf frontend/.turbo

# Крок 3: Очищення Python кешу
echo -e "\n${YELLOW}Крок 3: Очищення кешу бекенду...${NC}"
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find backend -type f -name "*.pyc" -delete 2>/dev/null

# Крок 4: Видалення Docker образів
echo -e "\n${YELLOW}Крок 4: Видалення старих Docker образів...${NC}"
docker rmi ohmyrevit-frontend ohmyrevit-backend 2>/dev/null || true

# Крок 5: Перебудова контейнерів
echo -e "\n${YELLOW}Крок 5: Перебудова контейнерів...${NC}"
docker-compose build --no-cache

# Крок 6: Запуск контейнерів
echo -e "\n${YELLOW}Крок 6: Запуск контейнерів...${NC}"
docker-compose up -d

# Крок 7: Очікування готовності БД
echo -e "\n${YELLOW}Крок 7: Очікування готовності бази даних...${NC}"
sleep 10

# Крок 8: Застосування міграцій
echo -e "\n${YELLOW}Крок 8: Застосування міграцій...${NC}"
docker-compose exec backend alembic upgrade head

# Крок 9: Перевірка статусу
echo -e "\n${YELLOW}Крок 9: Перевірка статусу сервісів...${NC}"
docker-compose ps

# Крок 10: Тестування API
echo -e "\n${YELLOW}Крок 10: Тестування API...${NC}"
sleep 5
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$API_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ API працює${NC}"
else
    echo -e "${RED}✗ API не відповідає (код: $API_STATUS)${NC}"
fi

# Перевірка фронтенду
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Frontend працює${NC}"
else
    echo -e "${RED}✗ Frontend не відповідає (код: $FRONTEND_STATUS)${NC}"
fi

echo -e "\n${GREEN}✅ Перезапуск завершено!${NC}"
echo -e "\nДоступні сервіси:"
echo -e "  - Frontend: ${GREEN}https://dev.ohmyrevit.pp.ua${NC}"
echo -e "  - API Docs: ${GREEN}https://dev.ohmyrevit.pp.ua/api/docs${NC}"
echo -e "  - Adminer:  ${GREEN}http://localhost:8080${NC}"
echo -e "\n${YELLOW}Логи:${NC} docker-compose logs -f"