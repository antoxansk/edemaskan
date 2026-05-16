import { ShieldCheck } from "lucide-react";

type Props = { text: string };

export function ResultDisclaimer({ text }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 pt-4 pb-8 border-t border-border">
      <p className="text-xs text-text-soft leading-relaxed text-center max-w-sm">
        {text}
      </p>
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck size={16} aria-hidden="true" />
        <span className="text-sm font-medium text-primary">
          Мы не сохраняем ваши фотографии
        </span>
      </div>
    </div>
  );
}
