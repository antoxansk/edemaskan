import { CheckCircle2 } from "lucide-react";

const TRUST_ITEMS = [
  "Совместно с Первым МГМУ им. И.М. Сеченова",
  "Более 500 000 учеников на платформе",
  "Методика подтверждена научными исследованиями",
  "Европейская аккредитация",
] as const;

export function TrustBlock() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Сервис создан специалистами УПДН
        </h2>
        <ul className="space-y-3">
          {TRUST_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5 text-success" size={18} />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
