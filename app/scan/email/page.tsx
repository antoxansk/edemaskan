"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useScan } from "@/components/scan/scan-provider";

const schema = z.object({
  name:  z.string().regex(/^[a-zA-Zа-яА-ЯёЁ\s\-]{1,60}$/, "Имя содержит недопустимые символы"),
  email: z.string().email("Email невалидный").max(254),
});
type FormData = z.infer<typeof schema>;

export default function EmailPage() {
  const router  = useRouter();
  const { aiResult } = useScan();
  const [redFlag, setRedFlag] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("edm_result_token");
    if (!token) { router.replace("/scan"); return; }

    // Read red_flag from stored ai_result or context
    const stored = sessionStorage.getItem("edm_ai_result");
    const result = aiResult ?? (stored ? JSON.parse(stored) : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (result?.red_flag) setRedFlag(true);
  }, [router, aiResult]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    const sessionToken = sessionStorage.getItem("edm_session_token");
    const resultToken  = sessionStorage.getItem("edm_result_token");

    if (!sessionToken || !resultToken) {
      toast.error("Сессия устарела. Начните заново.");
      router.replace("/scan");
      return;
    }

    const res = await fetch("/api/scan/submit-email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ session_token: sessionToken, result_token: resultToken, ...values }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      result_token?: string;
      special_price_expires_at?: string;
      error?: { code: string; message: string };
    };

    if (!res.ok || !data.success) {
      toast.error(data.error?.message ?? "Ошибка. Попробуйте ещё раз.");
      return;
    }

    if (data.special_price_expires_at) {
      sessionStorage.setItem("edm_expires_at", data.special_price_expires_at);
    }

    router.push("/scan/result");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Готово!</h1>
        <p className="text-muted-foreground text-sm">
          Введите имя и email, чтобы открыть разбор
        </p>
      </div>

      {redFlag && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription className="text-sm">
            На фото есть признаки, которые требуют внимания врача. Подробности — после ввода email.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" placeholder="Марина" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="marina@example.ru" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold btn-emerald-cta" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
          Получить разбор
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Мы продублируем разбор на вашу почту. Email не передаём третьим лицам, отписаться можно в один клик.
      </p>
    </div>
  );
}
