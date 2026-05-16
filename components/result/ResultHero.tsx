import { Droplet } from "lucide-react";

type Props = { name: string };

export function ResultHero({ name }: Props) {
  return (
    <div className="text-center pt-6 pb-2">
      <Droplet size={20} className="text-primary opacity-60 mx-auto mb-3" aria-hidden="true" />
      <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-foreground">
        {name}, ваш разбор готов
      </h1>
      <p className="text-[17px] text-text-muted mt-2 leading-relaxed">
        На основе 4 фото и ваших ответов
      </p>
    </div>
  );
}
