"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "Это медицинская диагностика?",
    a: "Нет. Это образовательный нутрициологический разбор по методологии УПДН. При выраженных или продолжительных отёках рекомендуем очную консультацию врача.",
  },
  {
    q: "Сколько это стоит?",
    a: "Ничего. Сервис полностью бесплатный.",
  },
  {
    q: "Вы сохраняете мои фотографии?",
    a: "Нет. Фотографии обрабатываются AI-моделью и сразу удаляются из памяти сервера. Мы не храним ваши снимки нигде.",
  },
  {
    q: "Нужна ли регистрация?",
    a: "Только email в конце — чтобы получить результат на почту и не потерять его. Никакой регистрации, паролей или личного кабинета.",
  },
] as const;

export function FaqSection() {
  return (
    <section className="py-12 px-4 bg-muted/50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-center">Частые вопросы</h2>
        <Accordion type="single" collapsible className="bg-background rounded-2xl px-4 shadow-sm">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-sm font-medium text-left">{q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
