// frontend/app/head.tsx
export default function Head() {
  return (
    <>
      <title>OhMyRevit - Маркетплейс Revit контенту</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="Преміум контент для Autodesk Revit" />
      <link rel="icon" href="/favicon.ico" />

      {/* Telegram Web App Script - ВАЖЛИВО! */}
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
    </>
  );
}