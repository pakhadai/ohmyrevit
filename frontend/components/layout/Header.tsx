'use client';

export default function Header() {
  return (
    /* h-20 (80px) — висота.
       bg-background/80 — основний колір фону (змінна з globals.css) з 80% непрозорості.
       Це забезпечить правильний вигляд і в світлій, і в темній темі.
       border-border/40 — адаптивний колір рамки.
    */
    <header className="sticky top-0 left-0 right-0 z-40 h-20 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      <div className="flex items-center justify-center h-full text-foreground/90">
         {/* Тут можна додати логотип або залишити пустим */}
         {/* <span className="font-bold text-lg drop-shadow-md">OhMyRevit</span> */}
      </div>
    </header>
  );
}