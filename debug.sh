#!/bin/bash

# debug.sh - Скрипт для діагностики проблем OhMyRevit

echo "🔍 OhMyRevit Debug Script"
echo "========================="

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Перевірка Docker
echo -e "\n📦 Перевірка Docker..."
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker працює${NC}"
else
    echo -e "${RED}✗ Docker не запущений${NC}"
    exit 1
fi

# Перевірка контейнерів
echo -e "\n🐳 Статус контейнерів:"
docker-compose ps

# Перевірка бази даних
echo -e "\n🗄️ Перевірка бази даних..."
docker-compose exec -T db psql -U ohmyrevit -d ohmyrevit_db -c "SELECT COUNT(*) as users_count FROM users;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ База даних доступна${NC}"
else
    echo -e "${RED}✗ Проблема з базою даних${NC}"
fi

# Перевірка міграцій
echo -e "\n📋 Статус міграцій:"
docker-compose exec -T backend alembic current 2>/dev/null

# Перевірка логів backend
echo -e "\n📜 Останні логи Backend (помилки):"
docker-compose logs --tail=20 backend | grep -E "ERROR|CRITICAL|Exception" || echo "Помилок не знайдено"

# Перевірка API
echo -e "\n🌐 Перевірка API..."
# OLD: API_HEALTH=$(curl -s http://localhost:8000/health)
API_HEALTH=$(curl -s http://localhost/api/v1/health)
if echo "$API_HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ API доступний${NC}"
    echo "Response: $API_HEALTH"
else
    echo -e "${RED}✗ API недоступний${NC}"
fi

# Перевірка Frontend
echo -e "\n🎨 Перевірка Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Frontend доступний${NC}"
else
    echo -e "${YELLOW}⚠ Frontend статус: $FRONTEND_STATUS${NC}"
fi

# Тест створення користувача
echo -e "\n🧪 Тест авторизації..."
TEST_DATA='{
  "id": 999999,
  "first_name": "Test",
  "last_name": "User",
  "username": "testuser",
  "photo_url": "",
  "auth_date": '$(date +%s)',
  "hash": "test_hash_for_development"
}'

RESPONSE=$(curl -s -X POST http://localhost/api/v1/auth/telegram \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

if echo "$RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Авторизація працює${NC}"
else
    echo -e "${RED}✗ Проблема з авторизацією${NC}"
    echo "Response: $RESPONSE"
fi

# Рекомендації
echo -e "\n💡 Рекомендації:"
echo "1. Якщо БД недоступна: docker-compose restart db"
echo "2. Якщо міграції не застосовані: docker-compose exec backend alembic upgrade head"
echo "3. Для перегляду всіх логів: docker-compose logs -f"
echo "4. Для очистки та перезапуску: docker-compose down && docker-compose up --build"

echo -e "\n✅ Діагностика завершена!"