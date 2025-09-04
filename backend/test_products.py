"""
Скрипт для тестування API товарів
Запускайте після старту сервера: python test_products.py
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = "y9f7c2b8e4a1d6c3f7e9a0d2c5b4e8f1a7c9d3f0b6a2e7c4d8f9b0a3d5e6c1f2"  # Отримайте через логін адміна


async def test_create_category():
    """Тест створення категорії"""
    async with httpx.AsyncClient() as client:
        # Створюємо категорії
        categories = [
            {"name": "Меблі", "slug": "furniture"},
            {"name": "Освітлення", "slug": "lighting"},
            {"name": "Декор", "slug": "decor"},
            {"name": "Сантехніка", "slug": "plumbing"}
        ]

        for cat_data in categories:
            response = await client.post(
                f"{BASE_URL}/api/v1/admin/products/categories",
                json=cat_data,
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
            )

            if response.status_code == 200:
                print(f"✅ Категорія '{cat_data['name']}' створена")
            else:
                print(f"❌ Помилка створення категорії: {response.text}")


async def test_create_product():
    """Тест створення товару"""
    async with httpx.AsyncClient() as client:
        # Дані нового товару
        product_data = {
            "title_uk": "Сучасний офісний стіл IKEA Style",
            "description_uk": """
                Високоякісна 3D модель офісного столу в скандинавському стилі.

                Характеристики:
                - Детальна геометрія з усіма елементами
                - Реалістичні матеріали та текстури
                - Параметричні розміри для легкого налаштування
                - Оптимізована для великих проектів

                В комплекті:
                - Основна модель столу
                - 5 варіантів кольорів
                - Додаткові аксесуари (лампа, органайзер)

                Ідеально підходить для офісних проектів!
            """,
            "price": 49.99,
            "product_type": "premium",
            "main_image_url": "https://example.com/images/desk-main.jpg",
            "gallery_image_urls": [
                "https://example.com/images/desk-1.jpg",
                "https://example.com/images/desk-2.jpg",
                "https://example.com/images/desk-3.jpg"
            ],
            "zip_file_path": "/files/modern_office_desk.zip",
            "file_size_mb": 125.5,
            "compatibility": "Revit 2021-2024",
            "is_on_sale": True,
            "sale_price": 34.99,
            "category_ids": [1]  # ID категорії "Меблі"
        }

        response = await client.post(
            f"{BASE_URL}/api/v1/admin/products",
            json=product_data,
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )

        if response.status_code == 200:
            product = response.json()
            print(f"✅ Товар створено з ID: {product['id']}")
            print(f"   Назва: {product['title']}")
            print(f"   Ціна: ${product['actual_price']}")
            return product['id']
        else:
            print(f"❌ Помилка створення товару: {response.text}")
            return None


async def test_get_products():
    """Тест отримання списку товарів"""
    async with httpx.AsyncClient() as client:
        # Тестуємо різні мови
        languages = ["uk", "en", "ru"]

        for lang in languages:
            print(f"\n📋 Отримання товарів мовою: {lang}")

            response = await client.get(
                f"{BASE_URL}/api/v1/products",
                headers={"Accept-Language": lang},
                params={
                    "limit": 10,
                    "sort_by": "newest"
                }
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Знайдено товарів: {data['total']}")

                if data['products']:
                    product = data['products'][0]
                    print(f"   Перший товар: {product['title']}")
                    print(f"   Опис: {product['description'][:100]}...")
            else:
                print(f"❌ Помилка: {response.text}")


async def test_get_product_detail():
    """Тест отримання детальної інформації про товар"""
    async with httpx.AsyncClient() as client:
        # Спочатку отримуємо список товарів
        response = await client.get(f"{BASE_URL}/api/v1/products")

        if response.status_code == 200:
            data = response.json()

            if data['products']:
                product_id = data['products'][0]['id']

                # Отримуємо детальну інформацію
                print(f"\n📦 Отримання товару ID: {product_id}")

                for lang in ["uk", "en", "ru"]:
                    response = await client.get(
                        f"{BASE_URL}/api/v1/products/{product_id}",
                        headers={"Accept-Language": lang}
                    )

                    if response.status_code == 200:
                        product = response.json()
                        print(f"✅ [{lang}] {product['title']}")
                    else:
                        print(f"❌ [{lang}] Помилка: {response.text}")


async def test_filters():
    """Тест фільтрації товарів"""
    async with httpx.AsyncClient() as client:
        print("\n🔍 Тестування фільтрів")

        # Тест фільтру по типу
        response = await client.get(
            f"{BASE_URL}/api/v1/products",
            params={"product_type": "premium"}
        )
        print(f"Premium товари: {response.json()['total']}")

        # Тест фільтру по знижці
        response = await client.get(
            f"{BASE_URL}/api/v1/products",
            params={"is_on_sale": True}
        )
        print(f"Товари зі знижкою: {response.json()['total']}")

        # Тест фільтру по ціні
        response = await client.get(
            f"{BASE_URL}/api/v1/products",
            params={
                "min_price": 10,
                "max_price": 50
            }
        )
        print(f"Товари $10-50: {response.json()['total']}")


async def main():
    """Головна функція тестування"""
    print("🚀 Початок тестування API товарів\n")
    print("=" * 50)

    # Запускаємо тести послідовно
    print("\n1️⃣ Створення категорій")
    await test_create_category()

    print("\n2️⃣ Створення товару")
    product_id = await test_create_product()

    # Чекаємо поки відбудеться переклад
    if product_id:
        print("\n⏳ Чекаємо 5 секунд для завершення перекладу...")
        await asyncio.sleep(5)

    print("\n3️⃣ Отримання списку товарів")
    await test_get_products()

    print("\n4️⃣ Отримання детальної інформації")
    await test_get_product_detail()

    print("\n5️⃣ Тестування фільтрів")
    await test_filters()

    print("\n" + "=" * 50)
    print("✅ Тестування завершено!")


if __name__ == "__main__":
    # Запускаємо асинхронні тести
    asyncio.run(main())