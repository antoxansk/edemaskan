import { Camera, ClipboardList, Sparkles, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    num:  "01",
    icon: Camera,
    title: "Сделайте 4 фото лица",
    desc: "С телефона, при хорошем освещении. Занимает 1 минуту.",
  },
  {
    num:  "02",
    icon: ClipboardList,
    title: "Ответьте на 5 вопросов",
    desc: "О вашем образе жизни — чтобы AI мог учесть контекст.",
  },
  {
    num:  "03",
    icon: Sparkles,
    title: "Получите разбор",
    desc: "AI-модель УПДН определяет зоны отёчности и вероятную причину.",
  },
  {
    num:  "04",
    icon: Mail,
    title: "Введите email — получите план",
    desc: "Стартовый план на 7 дней придёт на почту. Бесплатно.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="py-12 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-8">Как работает сервис</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map(({ num, icon: Icon, title, desc }) => (
            <Card key={num} className="rounded-2xl shadow-sm">
              <CardContent className="flex gap-4 p-5">
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-0.5">{num}</p>
                  <p className="font-medium text-sm mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
