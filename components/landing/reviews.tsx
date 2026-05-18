import { Card, CardContent } from "@/components/ui/card";

const REVIEWS = [
  {
    name: "Ольга",
    age: 39,
    text: "Думала, что отекаю из-за воды на ночь. Прошла сканирование — оказалось, проблема в лимфотоке в нижней части лица.",
  },
  {
    name: "Наталья",
    age: 44,
    text: "Скептически отнеслась, но загрузила фото. Результат удивил: точно показал зоны, которые я и сама замечала.",
  },
  {
    name: "Марина",
    age: 41,
    text: "За минуту узнала про себя больше, чем за 3 визита к терапевту.",
  },
] as const;

export function Reviews() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {REVIEWS.map(({ name, age, text }) => (
          <Card key={name} className="rounded-2xl shadow-sm">
            <CardContent className="p-5 flex flex-col gap-3">
              <p className="text-sm leading-relaxed text-foreground">
                &laquo;{text}&raquo;
              </p>
              <p className="text-sm font-semibold text-emerald-700">
                {name}, {age}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
