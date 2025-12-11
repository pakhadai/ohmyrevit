from typing import Dict, Any

# Тимчасове сховище перекладів.
# В майбутньому це буде замінено на завантаження з .json файлів.
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "uk": {
        # Email: Order Confirmation
        "email_order_subject": "Замовлення #{order_id} - OhMyRevit",
        "email_order_header_title": "OhMyRevit",
        "email_order_header_subtitle": "Дякуємо за ваше замовлення!",
        "email_order_body_title": "Замовлення #{order_id}",
        "email_order_table_product": "Товар",
        "email_order_table_price": "Ціна",
        "email_order_table_total": "Всього:",
        "email_order_access_text": "Після підтвердження оплати ви отримаєте доступ до товарів у вашому профілі.",
        "email_order_button": "Перейти в додаток",
        "email_order_footer_regards": "З найкращими побажаннями,",
        "email_order_footer_team": "Команда OhMyRevit",

        # Email: Subscription Confirmation
        "email_sub_subject": "Premium підписка активована - OhMyRevit",
        "email_sub_header_title": "🎉 Premium активовано!",
        "email_sub_body_title": "Вітаємо з Premium підпискою!",
        "email_sub_body_text": "Ваша Premium підписка успішно активована та діє до <strong>{end_date}</strong>.",
        "email_sub_features_title": "Що входить в Premium:",
        "email_sub_feature_1": "✅ Доступ до всіх преміум товарів",
        "email_sub_feature_2": "✅ Нові товари щотижня",
        "email_sub_feature_3": "✅ Товари залишаються назавжди",
        "email_sub_feature_4": "✅ Пріоритетна підтримка",
        "email_sub_feature_5": "✅ Ексклюзивні знижки",
        "email_sub_button": "Перейти до товарів",
        "email_sub_footer_thanks": "Дякуємо за довіру!",
        "email_sub_footer_team": "Команда OhMyRevit",

        # Telegram Bot
        "bot_start_welcome": "👋 *Ласкаво просимо!*\n\nТисни кнопку нижче, щоб відкрити маркет.",
        "bot_start_referral_welcome": "👋 *Привіт!*\n\nВас запросив користувач *{name}*.\nТисни кнопку нижче, щоб отримати свій бонус! 🎁",
        "bot_button_open_app": "🚀 Відкрити додаток",

        # Auth Service
        "auth_new_referral_msg": "🎉 *Новий реферал!*\n\nКористувач {user_name} зареєструвався за вашим посиланням.\nВам нараховано *+{bonus_amount}* бонусів! 💎",

        # Email: Download Links
        "email_download_subject": "Ваші товари готові до завантаження - OhMyRevit",
        "email_download_item_size": "Розмір: {file_size} MB",
        "email_download_item_button": "Завантажити",
        "email_download_header_title": "Ваші товари готові!",
        "email_download_body_text": "Дякуємо за покупку! Ваші товари готові до завантаження:",
        "email_download_warning": "<strong>Важливо:</strong> Посилання для завантаження діють протягом 7 днів. Рекомендуємо зберегти файли на вашому пристрої.",
        "email_download_footer_text": "Якщо у вас виникли питання, зв'яжіться з нашою підтримкою.",
        "email_download_footer_team": "Команда OhMyRevit",

        # Orders Service
        "order_error_one_discount": "Можна застосувати тільки один вид знижки",
        "order_error_promo_invalid": "Невалідний або прострочений промокод",
        "order_error_promo_expired": "Термін дії промокоду закінчився",
        "order_error_promo_limit": "Ліміт використання промокоду вичерпано",
        "order_error_user_not_found": "Користувача не знайдено",
        "order_error_insufficient_bonus": "Недостатньо бонусів на рахунку",
        "order_error_products_not_found": "Товари не знайдено",
        "order_error_zero_value": "Не можна створювати замовлення з нульовою вартістю, якщо в ньому немає безкоштовних товарів.",

        # Order Notification (Telegram)
        "order_msg_success_title": "✅ *Замовлення #{order_id} успішно оплачено!*",
        "order_msg_products_label": "Товари:",
        "order_msg_total_label": "Сума: ${total}",
        "order_msg_access_granted": "Доступ до файлів відкрито у вашому профілі.",
        "order_item_default_title": "Товар",

        # Admin: Uploads
        "admin_upload_error_type_image": "Недопустимий тип файлу. Дозволено: {allowed}",
        "admin_upload_error_type_archive": "Недопустимий тип архіву. Дозволено: {allowed}",
        "admin_upload_error_save": "Не вдалося зберегти файл: {error}",

        # Admin: Users
        "admin_user_not_found": "Користувача не знайдено",
        "admin_user_error_self_admin": "Не можна змінити власний статус адміністратора",
        "admin_user_error_self_block": "Не можна заблокувати самого себе",

        # Admin: User Actions (Bonus)
        "admin_bonus_msg_title": "🎁 *Бонус!* Вам нараховано {amount} бонусів",
        "admin_bonus_msg_comment": "\nКоментар: {reason}",
        "admin_bonus_msg_balance": "\n\nПоточний баланс: {balance} 💎",

        # Admin: User Actions (Subscription)
        "admin_sub_msg_title": "👑 *Premium Підписка!*\n\nВам надано підписку на {days} днів.\nДіє до: {date_str}",
        "admin_sub_success_response": "Підписка на {days} днів видана користувачу {name}",

        # Admin: Categories
        "admin_category_error_slug_exists": "Категорія з таким slug вже існує",
        "admin_category_not_found": "Категорію не знайдено",
        "admin_category_deleted": "Категорію видалено",

        # Admin: Promo Codes
        "admin_promo_not_found": "Промокод не знайдено",
        "admin_promo_error_code_exists": "Промокод з таким кодом вже існує",
        "admin_promo_deleted": "Промокод видалено",

        # Admin: Orders
        "admin_order_not_found": "Замовлення не знайдено",
        "admin_order_item_title_fallback": "Назва не знайдена",
        "admin_order_error_status_invalid": "Невірний статус. Дозволено: {allowed}",

        # Orders Router
        "order_error_create_internal": "Внутрішня помилка сервера при створенні замовлення",
        "order_error_internal": "Внутрішня помилка сервера",
        "order_sub_activated_msg": "👑 *Premium активовано!*\n\nВаша підписка успішно оплачена.\nДіє до: {date_str}\n\nТепер вам доступні всі Premium товари!",

        # Bonus Service
        "bonus_error_user_not_found": "Користувач не знайдений",
        "bonus_claim_error_already_claimed": "Бонус вже отримано сьогодні",
        "bonus_claim_success_msg": "Отримано {amount} бонусів!",
        "bonus_info_available_now": "Доступно зараз",

        # Subscriptions Router
        "sub_error_active_not_found": "Активну підписку не знайдено",
        "sub_cancel_success_msg": "Автопродовження скасовано",

        # Collections Router
        "collection_error_limit_reached": "Ви досягли ліміту в 9 колекцій.",
        "collection_error_name_exists": "Колекція з такою назвою вже існує.",
        "collection_error_not_found": "Колекцію не знайдено.",
        "collection_error_product_not_found": "Товар не знайдено.",

        # Products Service
        "product_service_error_create": "Помилка створення товару",
        "product_service_not_found": "Товар не знайдено",
        "product_service_default_title": "Без назви",
        "product_service_default_description": "Без опису",

        # Admin: Uploads (Generic)
        "admin_upload_error_invalid_type": "Недопустимий тип файлу. Дозволено: {allowed}",
        "admin_upload_error_save_generic": "Не вдалося зберегти файл.",

        # Products Router
        "product_error_not_found": "Товар не знайдено",
        "product_error_not_implemented": "Функціонал ще не реалізовано",
        "product_success_deleted": "Товар успішно видалено",
        "product_error_translation_update": "Помилка оновлення перекладу",
        "product_success_translation_update": "Переклад на {lang} оновлено",
        "category_error_slug_exists": "Категорія з таким slug вже існує",

        # Users Dependencies
        "auth_error_not_authenticated": "Не авторизовано",
        "auth_error_invalid_token": "Невірний токен авторизації",
        "auth_error_user_not_found": "Користувача не знайдено",
        "auth_error_account_disabled": "Обліковий запис вимкнено",
        "auth_error_not_enough_permissions": "Недостатньо прав"
    }
}

def get_text(key: str, lang: str = "uk", **kwargs) -> str:
    """Отримати переклад за ключем"""
    lang_data = TRANSLATIONS.get(lang, TRANSLATIONS["uk"])
    text = lang_data.get(key, key)
    if kwargs:
        try:
            return text.format(**kwargs)
        except KeyError:
            return text
    return text