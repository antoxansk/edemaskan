import Link from "next/link";

export function FooterDisclaimer() {
  return (
    <footer className="mt-auto border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
      <p className="max-w-2xl mx-auto mb-2">
        Edemaskan — образовательный сервис УПДН (Университет персонализированной диетологии и нутрициологии).
        Не является медицинским. Не ставит диагнозов. Не заменяет консультацию врача.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/legal/privacy" className="underline hover:text-foreground transition-colors">
          Политика конфиденциальности
        </Link>
        <Link href="/legal/scan-policy" className="underline hover:text-foreground transition-colors">
          Политика сервиса анализа
        </Link>
      </div>
    </footer>
  );
}
