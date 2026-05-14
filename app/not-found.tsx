import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <h1 className="text-3xl font-semibold">Страница не найдена</h1>
      <p className="text-muted-foreground">Результат устарел или ссылка недействительна.</p>
      <Button asChild>
        <Link href="/morning-face">Начать заново</Link>
      </Button>
    </div>
  );
}
