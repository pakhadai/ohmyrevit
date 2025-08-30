FROM python:3.12-slim

# Встановлення системних залежностей
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Встановлення робочої директорії
WORKDIR /app

# Копіювання файлу залежностей
COPY requirements.txt .

# Встановлення Python залежностей
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Копіювання коду додатку
COPY . .

# Створення директорії для завантажень
RUN mkdir -p /app/uploads

# Відкриття порту
EXPOSE 8000

# Команда запуску для production (перевизначається в docker-compose для dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]