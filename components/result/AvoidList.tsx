import { X } from "lucide-react";

type Props = { items: string[] };

export function AvoidList({ items }: Props) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-4 text-foreground">
        Чего избегать на этой неделе
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[17px] leading-relaxed">
            <X size={18} className="text-error shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-foreground/90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
