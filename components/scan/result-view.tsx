import type { AiResultType } from "@/lib/validation";
import { ResultPageLayout } from "@/components/result/ResultPageLayout";

type ResultViewProps = {
  name: string | null;
  result: AiResultType;
  expiresAt?: string | null;      // kept for API compatibility — OfferTimer uses localStorage instead
  frontalPhotoUrl?: string | null;
};

export function ResultView({ name, result, frontalPhotoUrl }: ResultViewProps) {
  return <ResultPageLayout result={result} name={name} frontalPhotoUrl={frontalPhotoUrl} />;
}
