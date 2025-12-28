from typing import Dict


# Мультимовні переклади для всього додатку
# Підтримуються мови: UK, EN, RU, DE, ES
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "uk": {
        # ============================================
        # EMAIL TEMPLATES - FOOTER
        # ============================================
        "email_footer_thanks": "Дякуємо, що обрали OhMyRevit!",
        "email_footer_website": "Веб-сайт",
        "email_footer_support": "Підтримка",
        "email_footer_rights": "Всі права захищено",

        # ============================================
        # EMAIL: Email Verification
        # ============================================
        "email_verify_subject": "Підтвердження email адреси",
        "email_verify_title": "Підтвердіть вашу email адресу",
        "email_verify_body": "Дякуємо за реєстрацію! Будь ласка, натисніть кнопку нижче, щоб підтвердити вашу email адресу та завершити реєстрацію.",
        "email_verify_button": "Підтвердити Email",
        "email_verify_link_text": "Або скопіюйте це посилання у браузер:",
        "email_verify_expire": "Це посилання дійсне протягом 24 годин",

        # ============================================
        # EMAIL: Password Reset
        # ============================================
        "email_reset_subject": "Відновлення пароля",
        "email_reset_title": "Відновлення пароля",
        "email_reset_body": "Ми отримали запит на відновлення пароля для вашого облікового запису. Натисніть кнопку нижче, щоб створити новий пароль.",
        "email_reset_button": "Скинути пароль",
        "email_reset_warning_title": "Не запитували відновлення?",
        "email_reset_warning_body": "Якщо ви не надсилали запит на відновлення пароля, проігноруйте цей лист. Ваш пароль залишиться незмінним.",
        "email_reset_expire": "Це посилання дійсне протягом 1 години",

        # ============================================
        # EMAIL: New Password
        # ============================================
        "email_new_password_subject": "Ваш новий пароль",
        "email_new_password_title": "Пароль успішно змінено",
        "email_new_password_body": "Ми створили для вас новий пароль. Використовуйте його для входу в систему.",
        "email_new_password_label": "Ваш новий пароль",
        "email_new_password_button": "Увійти в акаунт",
        "email_new_password_security_title": "Безпека важлива!",
        "email_new_password_security_body": "Рекомендуємо змінити цей пароль на власний після першого входу в налаштуваннях профілю.",

        # ============================================
        # EMAIL: Registration
        # ============================================
        "email_registration_subject": "Ласкаво просимо до OhMyRevit!",
        "email_registration_title": "Ласкаво просимо!",
        "email_registration_body": "Ваш обліковий запис успішно створено. Використовуйте наступні дані для входу:",
        "email_registration_temp_password": "Тимчасовий пароль",
        "email_registration_button": "Почати роботу",
        "email_registration_tip_title": "Порада",
        "email_registration_tip_body": "Змініть тимчасовий пароль на власний у налаштуваннях профілю для додаткової безпеки.",

        # ============================================
        # EMAIL: Link Email to Telegram
        # ============================================
        "email_link_subject": "Підтвердження прив'язки акаунту",
        "email_link_title": "Прив'яжіть Email до Telegram",
        "email_link_body": "Ми отримали запит на прив'язку цієї email адреси до вашого Telegram акаунту. Підтвердіть, що це ви.",
        "email_link_button": "Підтвердити прив'язку",
        "email_link_warning_title": "Це не ви?",
        "email_link_warning_body": "Якщо ви не намагалися прив'язати email до Telegram, проігноруйте цей лист.",
        "email_link_expire": "Це посилання дійсне протягом 1 години",

        # ============================================
        # EMAIL: Order Confirmation
        # ============================================
        "email_order_subject": "Замовлення #{order_id}",
        "email_order_title": "Дякуємо за покупку!",
        "email_order_number": "Замовлення №{order_id}",
        "email_order_total": "Разом",
        "email_order_access_info": "Ваші файли вже доступні для завантаження в Telegram боті.",
        "email_order_button": "Відкрити бот",
        "email_order_tip_title": "Підказка",
        "email_order_tip_body": "Завантажені файли залишаються доступними назавжди у вашому профілі.",

        # ============================================
        # EMAIL: Subscription
        # ============================================
        "email_subscription_subject": "Premium підписка активована",
        "email_subscription_title": "Premium активовано! 🎉",
        "email_subscription_body": "Ваша Premium підписка активна до {end_date}. Насолоджуйтесь необмеженим доступом!",
        "email_subscription_benefits_title": "Що ви отримуєте:",
        "email_subscription_feature_1": "Доступ до всіх Premium продуктів",
        "email_subscription_feature_2": "Нові релізи щотижня",
        "email_subscription_feature_3": "Пріоритетна підтримка",
        "email_subscription_feature_4": "Ексклюзивні бонуси",
        "email_subscription_feature_5": "Файли залишаються назавжди",
        "email_subscription_button": "Переглянути контент",
        "email_subscription_expiry": "Підписка автоматично продовжиться {end_date}",

        # ============================================
        # EMAIL: Download Links
        # ============================================
        "email_download_subject": "Ваші файли готові",
        "email_download_title": "Завантажте ваші файли",
        "email_download_body": "Дякуємо за покупку! Ваші файли готові до завантаження:",
        "email_download_button": "Завантажити",
        "email_download_warning_title": "Важливо",
        "email_download_warning_body": "Посилання діють 30 днів. Завантажте файли якнайшвидше.",

        # ============================================
        # LEGACY EMAIL KEYS (для зворотної сумісності)
        # ============================================
        "email_order_header_title": "OhMyRevit",
        "email_order_header_subtitle": "Дякуємо за ваше замовлення!",
        "email_order_body_title": "Замовлення #{order_id}",
        "email_order_table_product": "Товар",
        "email_order_table_price": "Ціна",
        "email_order_table_total": "Всього:",
        "email_order_access_text": "Після підтвердження оплати ви отримаєте доступ до товарів у вашому профілі.",
        "email_order_footer_regards": "З найкращими побажаннями,",
        "email_order_footer_team": "Команда OhMyRevit",

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

        "email_download_item_size": "Розмір: {file_size} MB",
        "email_download_item_button": "Завантажити",
        "email_download_header_title": "Ваші товари готові!",
        "email_download_body_text": "Дякуємо за покупку! Ваші товари готові до завантаження:",
        "email_download_warning": "<strong>Важливо:</strong> Посилання для завантаження діють протягом 7 днів. Рекомендуємо зберегти файли на вашому пристрої.",
        "email_download_footer_text": "Якщо у вас виникли питання, зв'яжіться з нашою підтримкою.",
        "email_download_footer_team": "Команда OhMyRevit",

        # ============================================
        # TELEGRAM BOT
        # ============================================
        "bot_start_welcome": "👋 *Ласкаво просимо!*\n\nТисни кнопку нижче, щоб відкрити маркет.",
        "bot_start_referral_welcome": "👋 *Привіт!*\n\nВас запросив користувач *{name}*.\nТисни кнопку нижче, щоб отримати свій бонус! 🎁",
        "bot_button_open_app": "🚀 Відкрити додаток",

        # ============================================
        # AUTH SERVICE
        # ============================================
        "auth_new_referral_msg": "🎉 *Новий реферал!*\n\nКористувач {user_name} зареєструвався за вашим посиланням.\nВам нараховано *+{bonus_amount}* бонусів! 💎",
        "auth_error_invalid_telegram_data": "Невірні дані авторизації Telegram",
        "auth_error_referral_code_gen_failed": "Не вдалося згенерувати унікальний реферальний код",
        "auth_error_database": "Помилка бази даних",
        "auth_error_auth_failed": "Помилка авторизації",
        "auth_error_not_authenticated": "Не авторизовано",
        "auth_error_invalid_token": "Невірний токен авторизації",
        "auth_error_user_not_found": "Користувача не знайдено",
        "auth_error_account_disabled": "Обліковий запис вимкнено",
        "auth_error_not_enough_permissions": "Недостатньо прав",

        # ============================================
        # ORDERS
        # ============================================
        "order_error_one_discount": "Можна застосувати тільки один вид знижки",
        "order_error_promo_invalid": "Невалідний або прострочений промокод",
        "order_error_promo_expired": "Термін дії промокоду закінчився",
        "order_error_promo_limit": "Ліміт використання промокоду вичерпано",
        "order_error_user_not_found": "Користувача не знайдено",
        "order_error_insufficient_bonus": "Недостатньо бонусів на рахунку",
        "order_error_products_not_found": "Товари не знайдено",
        "order_error_zero_value": "Не можна створювати замовлення з нульовою вартістю, якщо в ньому немає безкоштовних товарів.",
        "order_msg_success_title": "✅ *Замовлення #{order_id} успішно оплачено!*",
        "order_msg_products_label": "Товари:",
        "order_msg_total_label": "Сума: ${total}",
        "order_msg_access_granted": "Доступ до файлів відкрито у вашому профілі.",
        "order_item_default_title": "Товар",
        "order_error_create_internal": "Внутрішня помилка сервера при створенні замовлення",
        "order_error_internal": "Внутрішня помилка сервера",
        "order_sub_activated_msg": "👑 *Premium активовано!*\n\nВаша підписка успішно оплачена.\nДіє до: {date_str}\n\nТепер вам доступні всі Premium товари!",

        # ============================================
        # ADMIN
        # ============================================
        "admin_upload_error_type_image": "Недопустимий тип файлу. Дозволено: {allowed}",
        "admin_upload_error_type_archive": "Недопустимий тип архіву. Дозволено: {allowed}",
        "admin_upload_error_save": "Не вдалося зберегти файл: {error}",
        "admin_user_not_found": "Користувача не знайдено",
        "admin_user_error_self_admin": "Не можна змінити власний статус адміністратора",
        "admin_user_error_self_block": "Не можна заблокувати самого себе",
        "admin_bonus_msg_title": "🎁 *Бонус!* Вам нараховано {amount} бонусів",
        "admin_bonus_msg_comment": "\nКоментар: {reason}",
        "admin_bonus_msg_balance": "\n\nПоточний баланс: {balance} 💎",
        "admin_sub_msg_title": "👑 *Premium Підписка!*\n\nВам надано підписку на {days} днів.\nДіє до: {date_str}",
        "admin_sub_success_response": "Підписка на {days} днів видана користувачу {name}",
        "admin_category_error_slug_exists": "Категорія з таким slug вже існує",
        "admin_category_not_found": "Категорію не знайдено",
        "admin_category_deleted": "Категорію видалено",
        "admin_promo_not_found": "Промокод не знайдено",
        "admin_promo_error_code_exists": "Промокод з таким кодом вже існує",
        "admin_promo_deleted": "Промокод видалено",
        "admin_order_not_found": "Замовлення не знайдено",
        "admin_order_item_title_fallback": "Назва не знайдена",
        "admin_order_error_status_invalid": "Невірний статус. Дозволено: {allowed}",
        "admin_upload_error_invalid_type": "Недопустимий тип файлу. Дозволено: {allowed}",
        "admin_upload_error_save_generic": "Не вдалося зберегти файл.",

        # ============================================
        # OTHER SERVICES
        # ============================================
        "bonus_error_user_not_found": "Користувач не знайдений",
        "bonus_claim_error_already_claimed": "Бонус вже отримано сьогодні",
        "bonus_claim_success_msg": "Отримано {amount} бонусів!",
        "bonus_info_available_now": "Доступно зараз",
        "sub_error_active_not_found": "Активну підписку не знайдено",
        "sub_cancel_success_msg": "Автопродовження скасовано",
        "collection_error_limit_reached": "Ви досягли ліміту в 9 колекцій.",
        "collection_error_name_exists": "Колекція з такою назвою вже існує.",
        "collection_error_not_found": "Колекцію не знайдено.",
        "collection_error_product_not_found": "Товар не знайдено.",
        "product_service_error_create": "Помилка створення товару",
        "product_service_not_found": "Товар не знайдено",
        "product_service_default_title": "Без назви",
        "product_service_default_description": "Без опису",
        "product_error_not_found": "Товар не знайдено",
        "product_error_not_implemented": "Функціонал ще не реалізовано",
        "product_success_deleted": "Товар успішно видалено",
        "product_error_translation_update": "Помилка оновлення перекладу",
        "product_success_translation_update": "Переклад на {lang} оновлено",
        "category_error_slug_exists": "Категорія з таким slug вже існує",
        "profile_favorites_coming_soon": "Функціонал у розробці",
        "profile_error_telegram_auth": "Невірні дані авторизації Telegram",
        "profile_error_telegram_id": "Telegram ID не співпадає з поточним користувачем",
        "profile_download_access_denied": "Доступ заборонено",
        "profile_download_db_error": "Файл товару не знайдено в базі даних",
        "profile_download_server_error": "Файл не знайдено на сервері",
        "profile_user_not_found": "Користувача не знайдено",
        "profile_default_referral_name": "Користувач",
        "main_app_title": "OhMyRevit API",
        "main_app_description": "API для Telegram Mini App маркетплейсу Revit плагінів",
        "main_root_message": "OhMyRevit API працює",
        "main_startup_log": "Запуск додатку...",
        "main_shutdown_log": "Зупинка додатку..."
    },
    "en": {
        # ============================================
        # EMAIL TEMPLATES - FOOTER
        # ============================================
        "email_footer_thanks": "Thank you for choosing OhMyRevit!",
        "email_footer_website": "Website",
        "email_footer_support": "Support",
        "email_footer_rights": "All rights reserved",

        # ============================================
        # EMAIL: Email Verification
        # ============================================
        "email_verify_subject": "Verify Your Email Address",
        "email_verify_title": "Verify Your Email",
        "email_verify_body": "Thanks for signing up! Please click the button below to verify your email address and complete your registration.",
        "email_verify_button": "Verify Email",
        "email_verify_link_text": "Or copy this link to your browser:",
        "email_verify_expire": "This link is valid for 24 hours",

        # ============================================
        # EMAIL: Password Reset
        # ============================================
        "email_reset_subject": "Password Reset",
        "email_reset_title": "Reset Your Password",
        "email_reset_body": "We received a request to reset your password. Click the button below to create a new password.",
        "email_reset_button": "Reset Password",
        "email_reset_warning_title": "Didn't request a reset?",
        "email_reset_warning_body": "If you didn't request a password reset, please ignore this email. Your password will remain unchanged.",
        "email_reset_expire": "This link is valid for 1 hour",

        # ============================================
        # EMAIL: New Password
        # ============================================
        "email_new_password_subject": "Your New Password",
        "email_new_password_title": "Password Successfully Changed",
        "email_new_password_body": "We've created a new password for you. Use it to log in to your account.",
        "email_new_password_label": "Your New Password",
        "email_new_password_button": "Log In",
        "email_new_password_security_title": "Security matters!",
        "email_new_password_security_body": "We recommend changing this password to your own after first login in profile settings.",

        # ============================================
        # EMAIL: Registration
        # ============================================
        "email_registration_subject": "Welcome to OhMyRevit!",
        "email_registration_title": "Welcome!",
        "email_registration_body": "Your account has been successfully created. Use these credentials to log in:",
        "email_registration_temp_password": "Temporary Password",
        "email_registration_button": "Get Started",
        "email_registration_tip_title": "Tip",
        "email_registration_tip_body": "Change your temporary password to your own in profile settings for extra security.",

        # ============================================
        # EMAIL: Link Email to Telegram
        # ============================================
        "email_link_subject": "Account Link Confirmation",
        "email_link_title": "Link Email to Telegram",
        "email_link_body": "We received a request to link this email address to your Telegram account. Please confirm it's you.",
        "email_link_button": "Confirm Link",
        "email_link_warning_title": "Not you?",
        "email_link_warning_body": "If you didn't try to link an email to Telegram, please ignore this message.",
        "email_link_expire": "This link is valid for 1 hour",

        # ============================================
        # EMAIL: Order Confirmation
        # ============================================
        "email_order_subject": "Order #{order_id}",
        "email_order_title": "Thank You for Your Purchase!",
        "email_order_number": "Order №{order_id}",
        "email_order_total": "Total",
        "email_order_access_info": "Your files are now available for download in the Telegram bot.",
        "email_order_button": "Open Bot",
        "email_order_tip_title": "Tip",
        "email_order_tip_body": "Downloaded files remain accessible forever in your profile.",

        # ============================================
        # EMAIL: Subscription
        # ============================================
        "email_subscription_subject": "Premium Subscription Activated",
        "email_subscription_title": "Premium Activated! 🎉",
        "email_subscription_body": "Your Premium subscription is active until {end_date}. Enjoy unlimited access!",
        "email_subscription_benefits_title": "What you get:",
        "email_subscription_feature_1": "Access to all Premium products",
        "email_subscription_feature_2": "New releases every week",
        "email_subscription_feature_3": "Priority support",
        "email_subscription_feature_4": "Exclusive bonuses",
        "email_subscription_feature_5": "Files stay forever",
        "email_subscription_button": "Browse Content",
        "email_subscription_expiry": "Subscription auto-renews on {end_date}",

        # ============================================
        # EMAIL: Download Links
        # ============================================
        "email_download_subject": "Your Files Are Ready",
        "email_download_title": "Download Your Files",
        "email_download_body": "Thank you for your purchase! Your files are ready to download:",
        "email_download_button": "Download",
        "email_download_warning_title": "Important",
        "email_download_warning_body": "Links are valid for 30 days. Download files as soon as possible.",

        # ============================================
        # LEGACY (compatibility)
        # ============================================
        "email_order_header_title": "OhMyRevit",
        "email_order_header_subtitle": "Thank you for your order!",
        "email_order_body_title": "Order #{order_id}",
        "email_order_table_product": "Product",
        "email_order_table_price": "Price",
        "email_order_table_total": "Total:",
        "email_order_access_text": "After payment confirmation you'll get access to products in your profile.",
        "email_order_footer_regards": "Best regards,",
        "email_order_footer_team": "OhMyRevit Team",
        "bot_start_welcome": "👋 *Welcome!*\n\nClick the button below to open the marketplace.",
        "bot_start_referral_welcome": "👋 *Hello!*\n\nYou were invited by *{name}*.\nClick below to get your bonus! 🎁",
        "bot_button_open_app": "🚀 Open App"
    },
    "ru": {
        # ============================================
        # EMAIL TEMPLATES - FOOTER
        # ============================================
        "email_footer_thanks": "Спасибо, что выбрали OhMyRevit!",
        "email_footer_website": "Веб-сайт",
        "email_footer_support": "Поддержка",
        "email_footer_rights": "Все права защищены",

        # ============================================
        # EMAIL: Email Verification
        # ============================================
        "email_verify_subject": "Подтверждение email адреса",
        "email_verify_title": "Подтвердите ваш email",
        "email_verify_body": "Спасибо за регистрацию! Пожалуйста, нажмите кнопку ниже, чтобы подтвердить ваш email и завершить регистрацию.",
        "email_verify_button": "Подтвердить Email",
        "email_verify_link_text": "Или скопируйте эту ссылку в браузер:",
        "email_verify_expire": "Эта ссылка действительна в течение 24 часов",

        # ============================================
        # EMAIL: Password Reset
        # ============================================
        "email_reset_subject": "Восстановление пароля",
        "email_reset_title": "Восстановление пароля",
        "email_reset_body": "Мы получили запрос на восстановление пароля для вашей учетной записи. Нажмите кнопку ниже, чтобы создать новый пароль.",
        "email_reset_button": "Сбросить пароль",
        "email_reset_warning_title": "Не запрашивали восстановление?",
        "email_reset_warning_body": "Если вы не отправляли запрос на восстановление пароля, проигнорируйте это письмо. Ваш пароль останется неизменным.",
        "email_reset_expire": "Эта ссылка действительна в течение 1 часа",

        # ============================================
        # EMAIL: New Password
        # ============================================
        "email_new_password_subject": "Ваш новый пароль",
        "email_new_password_title": "Пароль успешно изменен",
        "email_new_password_body": "Мы создали для вас новый пароль. Используйте его для входа в систему.",
        "email_new_password_label": "Ваш новый пароль",
        "email_new_password_button": "Войти в аккаунт",
        "email_new_password_security_title": "Безопасность важна!",
        "email_new_password_security_body": "Рекомендуем изменить этот пароль на собственный после первого входа в настройках профиля.",

        # ============================================
        # EMAIL: Registration
        # ============================================
        "email_registration_subject": "Добро пожаловать в OhMyRevit!",
        "email_registration_title": "Добро пожаловать!",
        "email_registration_body": "Ваша учетная запись успешно создана. Используйте следующие данные для входа:",
        "email_registration_temp_password": "Временный пароль",
        "email_registration_button": "Начать работу",
        "email_registration_tip_title": "Совет",
        "email_registration_tip_body": "Измените временный пароль на собственный в настройках профиля для дополнительной безопасности.",

        # ============================================
        # EMAIL: Link Email to Telegram
        # ============================================
        "email_link_subject": "Подтверждение привязки аккаунта",
        "email_link_title": "Привяжите Email к Telegram",
        "email_link_body": "Мы получили запрос на привязку этого email адреса к вашему Telegram аккаунту. Подтвердите, что это вы.",
        "email_link_button": "Подтвердить привязку",
        "email_link_warning_title": "Это не вы?",
        "email_link_warning_body": "Если вы не пытались привязать email к Telegram, проигнорируйте это письмо.",
        "email_link_expire": "Эта ссылка действительна в течение 1 часа",

        # ============================================
        # EMAIL: Order Confirmation
        # ============================================
        "email_order_subject": "Заказ #{order_id}",
        "email_order_title": "Спасибо за покупку!",
        "email_order_number": "Заказ №{order_id}",
        "email_order_total": "Итого",
        "email_order_access_info": "Ваши файлы уже доступны для скачивания в Telegram боте.",
        "email_order_button": "Открыть бот",
        "email_order_tip_title": "Подсказка",
        "email_order_tip_body": "Скачанные файлы остаются доступными навсегда в вашем профиле.",

        # ============================================
        # EMAIL: Subscription
        # ============================================
        "email_subscription_subject": "Premium подписка активирована",
        "email_subscription_title": "Premium активирован! 🎉",
        "email_subscription_body": "Ваша Premium подписка активна до {end_date}. Наслаждайтесь неограниченным доступом!",
        "email_subscription_benefits_title": "Что вы получаете:",
        "email_subscription_feature_1": "Доступ ко всем Premium продуктам",
        "email_subscription_feature_2": "Новые релизы каждую неделю",
        "email_subscription_feature_3": "Приоритетная поддержка",
        "email_subscription_feature_4": "Эксклюзивные бонусы",
        "email_subscription_feature_5": "Файлы остаются навсегда",
        "email_subscription_button": "Посмотреть контент",
        "email_subscription_expiry": "Подписка автоматически продлится {end_date}",

        # ============================================
        # EMAIL: Download Links
        # ============================================
        "email_download_subject": "Ваши файлы готовы",
        "email_download_title": "Скачайте ваши файлы",
        "email_download_body": "Спасибо за покупку! Ваши файлы готовы к скачиванию:",
        "email_download_button": "Скачать",
        "email_download_warning_title": "Важно",
        "email_download_warning_body": "Ссылки действуют 30 дней. Скачайте файлы как можно скорее.",

        # ============================================
        # LEGACY (compatibility)
        # ============================================
        "bot_start_welcome": "👋 *Добро пожаловать!*\n\nНажми кнопку ниже, чтобы открыть маркет.",
        "bot_start_referral_welcome": "👋 *Привет!*\n\nТебя пригласил пользователь *{name}*.\nНажми кнопку ниже, чтобы получить свой бонус! 🎁",
        "bot_button_open_app": "🚀 Открыть приложение"
    },
    "de": {
        # ============================================
        # EMAIL TEMPLATES - FOOTER
        # ============================================
        "email_footer_thanks": "Vielen Dank, dass Sie OhMyRevit gewählt haben!",
        "email_footer_website": "Webseite",
        "email_footer_support": "Support",
        "email_footer_rights": "Alle Rechte vorbehalten",

        # ============================================
        # EMAIL: Email Verification
        # ============================================
        "email_verify_subject": "E-Mail-Adresse bestätigen",
        "email_verify_title": "Bestätigen Sie Ihre E-Mail",
        "email_verify_body": "Vielen Dank für Ihre Registrierung! Bitte klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen und Ihre Registrierung abzuschließen.",
        "email_verify_button": "E-Mail bestätigen",
        "email_verify_link_text": "Oder kopieren Sie diesen Link in Ihren Browser:",
        "email_verify_expire": "Dieser Link ist 24 Stunden gültig",

        # ============================================
        # EMAIL: Password Reset
        # ============================================
        "email_reset_subject": "Passwort zurücksetzen",
        "email_reset_title": "Setzen Sie Ihr Passwort zurück",
        "email_reset_body": "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen.",
        "email_reset_button": "Passwort zurücksetzen",
        "email_reset_warning_title": "Nicht angefordert?",
        "email_reset_warning_body": "Wenn Sie kein Zurücksetzen des Passworts angefordert haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt unverändert.",
        "email_reset_expire": "Dieser Link ist 1 Stunde gültig",

        # ============================================
        # EMAIL: New Password
        # ============================================
        "email_new_password_subject": "Ihr neues Passwort",
        "email_new_password_title": "Passwort erfolgreich geändert",
        "email_new_password_body": "Wir haben ein neues Passwort für Sie erstellt. Verwenden Sie es, um sich anzumelden.",
        "email_new_password_label": "Ihr neues Passwort",
        "email_new_password_button": "Anmelden",
        "email_new_password_security_title": "Sicherheit ist wichtig!",
        "email_new_password_security_body": "Wir empfehlen, dieses Passwort nach der ersten Anmeldung in den Profileinstellungen zu ändern.",

        # ============================================
        # EMAIL: Registration
        # ============================================
        "email_registration_subject": "Willkommen bei OhMyRevit!",
        "email_registration_title": "Willkommen!",
        "email_registration_body": "Ihr Konto wurde erfolgreich erstellt. Verwenden Sie diese Anmeldedaten:",
        "email_registration_temp_password": "Temporäres Passwort",
        "email_registration_button": "Loslegen",
        "email_registration_tip_title": "Tipp",
        "email_registration_tip_body": "Ändern Sie Ihr temporäres Passwort in den Profileinstellungen für zusätzliche Sicherheit.",

        # ============================================
        # EMAIL: Link Email to Telegram
        # ============================================
        "email_link_subject": "Kontoverbindungsbestätigung",
        "email_link_title": "E-Mail mit Telegram verknüpfen",
        "email_link_body": "Wir haben eine Anfrage erhalten, diese E-Mail-Adresse mit Ihrem Telegram-Konto zu verknüpfen. Bitte bestätigen Sie, dass Sie es sind.",
        "email_link_button": "Verknüpfung bestätigen",
        "email_link_warning_title": "Nicht Sie?",
        "email_link_warning_body": "Wenn Sie nicht versucht haben, eine E-Mail mit Telegram zu verknüpfen, ignorieren Sie diese Nachricht bitte.",
        "email_link_expire": "Dieser Link ist 1 Stunde gültig",

        # ============================================
        # EMAIL: Order Confirmation
        # ============================================
        "email_order_subject": "Bestellung #{order_id}",
        "email_order_title": "Vielen Dank für Ihren Kauf!",
        "email_order_number": "Bestellung №{order_id}",
        "email_order_total": "Gesamt",
        "email_order_access_info": "Ihre Dateien stehen jetzt im Telegram-Bot zum Download bereit.",
        "email_order_button": "Bot öffnen",
        "email_order_tip_title": "Tipp",
        "email_order_tip_body": "Heruntergeladene Dateien bleiben für immer in Ihrem Profil zugänglich.",

        # ============================================
        # EMAIL: Subscription
        # ============================================
        "email_subscription_subject": "Premium-Abonnement aktiviert",
        "email_subscription_title": "Premium aktiviert! 🎉",
        "email_subscription_body": "Ihr Premium-Abonnement ist aktiv bis {end_date}. Genießen Sie unbegrenzten Zugang!",
        "email_subscription_benefits_title": "Was Sie erhalten:",
        "email_subscription_feature_1": "Zugriff auf alle Premium-Produkte",
        "email_subscription_feature_2": "Neue Veröffentlichungen jede Woche",
        "email_subscription_feature_3": "Prioritäts-Support",
        "email_subscription_feature_4": "Exklusive Boni",
        "email_subscription_feature_5": "Dateien bleiben für immer",
        "email_subscription_button": "Inhalte durchsuchen",
        "email_subscription_expiry": "Abonnement verlängert sich automatisch am {end_date}",

        # ============================================
        # EMAIL: Download Links
        # ============================================
        "email_download_subject": "Ihre Dateien sind bereit",
        "email_download_title": "Laden Sie Ihre Dateien herunter",
        "email_download_body": "Vielen Dank für Ihren Kauf! Ihre Dateien stehen zum Download bereit:",
        "email_download_button": "Herunterladen",
        "email_download_warning_title": "Wichtig",
        "email_download_warning_body": "Links sind 30 Tage gültig. Laden Sie die Dateien so schnell wie möglich herunter.",

        # ============================================
        # LEGACY (compatibility)
        # ============================================
        "bot_start_welcome": "👋 *Willkommen!*\n\nKlicken Sie auf die Schaltfläche unten, um den Marktplatz zu öffnen.",
        "bot_start_referral_welcome": "👋 *Hallo!*\n\nSie wurden von *{name}* eingeladen.\nKlicken Sie unten, um Ihren Bonus zu erhalten! 🎁",
        "bot_button_open_app": "🚀 App öffnen"
    },
    "es": {
        # ============================================
        # EMAIL TEMPLATES - FOOTER
        # ============================================
        "email_footer_thanks": "¡Gracias por elegir OhMyRevit!",
        "email_footer_website": "Sitio web",
        "email_footer_support": "Soporte",
        "email_footer_rights": "Todos los derechos reservados",

        # ============================================
        # EMAIL: Email Verification
        # ============================================
        "email_verify_subject": "Verifica tu dirección de correo",
        "email_verify_title": "Verifica tu correo electrónico",
        "email_verify_body": "¡Gracias por registrarte! Haz clic en el botón de abajo para verificar tu dirección de correo y completar tu registro.",
        "email_verify_button": "Verificar correo",
        "email_verify_link_text": "O copia este enlace en tu navegador:",
        "email_verify_expire": "Este enlace es válido durante 24 horas",

        # ============================================
        # EMAIL: Password Reset
        # ============================================
        "email_reset_subject": "Restablecer contraseña",
        "email_reset_title": "Restablece tu contraseña",
        "email_reset_body": "Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.",
        "email_reset_button": "Restablecer contraseña",
        "email_reset_warning_title": "¿No solicitaste esto?",
        "email_reset_warning_body": "Si no solicitaste un restablecimiento de contraseña, ignora este correo. Tu contraseña permanecerá sin cambios.",
        "email_reset_expire": "Este enlace es válido durante 1 hora",

        # ============================================
        # EMAIL: New Password
        # ============================================
        "email_new_password_subject": "Tu nueva contraseña",
        "email_new_password_title": "Contraseña cambiada exitosamente",
        "email_new_password_body": "Hemos creado una nueva contraseña para ti. Úsala para iniciar sesión en tu cuenta.",
        "email_new_password_label": "Tu nueva contraseña",
        "email_new_password_button": "Iniciar sesión",
        "email_new_password_security_title": "¡La seguridad importa!",
        "email_new_password_security_body": "Recomendamos cambiar esta contraseña por la tuya después del primer inicio de sesión en la configuración del perfil.",

        # ============================================
        # EMAIL: Registration
        # ============================================
        "email_registration_subject": "¡Bienvenido a OhMyRevit!",
        "email_registration_title": "¡Bienvenido!",
        "email_registration_body": "Tu cuenta ha sido creada exitosamente. Usa estas credenciales para iniciar sesión:",
        "email_registration_temp_password": "Contraseña temporal",
        "email_registration_button": "Comenzar",
        "email_registration_tip_title": "Consejo",
        "email_registration_tip_body": "Cambia tu contraseña temporal por la tuya en la configuración del perfil para mayor seguridad.",

        # ============================================
        # EMAIL: Link Email to Telegram
        # ============================================
        "email_link_subject": "Confirmación de vinculación de cuenta",
        "email_link_title": "Vincula tu correo a Telegram",
        "email_link_body": "Recibimos una solicitud para vincular esta dirección de correo a tu cuenta de Telegram. Por favor confirma que eres tú.",
        "email_link_button": "Confirmar vinculación",
        "email_link_warning_title": "¿No eres tú?",
        "email_link_warning_body": "Si no intentaste vincular un correo a Telegram, ignora este mensaje.",
        "email_link_expire": "Este enlace es válido durante 1 hora",

        # ============================================
        # EMAIL: Order Confirmation
        # ============================================
        "email_order_subject": "Pedido #{order_id}",
        "email_order_title": "¡Gracias por tu compra!",
        "email_order_number": "Pedido №{order_id}",
        "email_order_total": "Total",
        "email_order_access_info": "Tus archivos ya están disponibles para descargar en el bot de Telegram.",
        "email_order_button": "Abrir bot",
        "email_order_tip_title": "Consejo",
        "email_order_tip_body": "Los archivos descargados permanecen accesibles para siempre en tu perfil.",

        # ============================================
        # EMAIL: Subscription
        # ============================================
        "email_subscription_subject": "Suscripción Premium activada",
        "email_subscription_title": "¡Premium activado! 🎉",
        "email_subscription_body": "Tu suscripción Premium está activa hasta {end_date}. ¡Disfruta del acceso ilimitado!",
        "email_subscription_benefits_title": "Lo que obtienes:",
        "email_subscription_feature_1": "Acceso a todos los productos Premium",
        "email_subscription_feature_2": "Nuevos lanzamientos cada semana",
        "email_subscription_feature_3": "Soporte prioritario",
        "email_subscription_feature_4": "Bonos exclusivos",
        "email_subscription_feature_5": "Los archivos permanecen para siempre",
        "email_subscription_button": "Explorar contenido",
        "email_subscription_expiry": "La suscripción se renueva automáticamente el {end_date}",

        # ============================================
        # EMAIL: Download Links
        # ============================================
        "email_download_subject": "Tus archivos están listos",
        "email_download_title": "Descarga tus archivos",
        "email_download_body": "¡Gracias por tu compra! Tus archivos están listos para descargar:",
        "email_download_button": "Descargar",
        "email_download_warning_title": "Importante",
        "email_download_warning_body": "Los enlaces son válidos durante 30 días. Descarga los archivos lo antes posible.",

        # ============================================
        # LEGACY (compatibility)
        # ============================================
        "bot_start_welcome": "👋 *¡Bienvenido!*\n\nHaz clic en el botón de abajo para abrir el mercado.",
        "bot_start_referral_welcome": "👋 *¡Hola!*\n\nFuiste invitado por *{name}*.\n¡Haz clic abajo para obtener tu bono! 🎁",
        "bot_button_open_app": "🚀 Abrir app"
    }
}


def get_text(key: str, lang: str = "uk", **kwargs) -> str:
    """Отримати переклад за ключем з підтримкою параметрів"""
    # Fallback до української мови якщо мова не знайдена
    lang_data = TRANSLATIONS.get(lang, TRANSLATIONS["uk"])
    text = lang_data.get(key, TRANSLATIONS["uk"].get(key, key))

    if kwargs:
        try:
            return text.format(**kwargs)
        except KeyError:
            return text
    return text
