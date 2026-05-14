import { notFound } from "next/navigation";
import Link from "next/link";
import { FooterDisclaimer } from "@/components/shared/footer-disclaimer";
import { ResultView } from "@/components/scan/result-view";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AiResultType } from "@/lib/validation";

type Props = { params: Promise<{ token: string }> };

export default async function ResultByTokenPage({ params }: Props) {
  const { token } = await params;

  if (!/^[A-Za-z0-9\-_]{24,48}$/.test(token)) {
    notFound();
  }

  const { data } = await supabaseAdmin
    .from("scan_sessions")
    .select("ai_result, name, special_price_expires_at, red_flag")
    .eq("result_token", token)
    .not("ai_result", "is", null)
    .single();

  if (!data) notFound();

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border px-4 py-3">
        <Link href="/" className="text-base font-semibold text-primary hover:opacity-80 transition-opacity">
          Edemaskan
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <ResultView
          name={data.name as string | null}
          result={data.ai_result as AiResultType}
          expiresAt={data.special_price_expires_at as string | null}
        />
      </main>

      <FooterDisclaimer />
    </div>
  );
}
