import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queryOne, execute } from "@/lib/db";
import { buildCtaClickPayload, sendToGetcourse } from "@/lib/getcourse";

const CtaClickRequest = z.object({
  result_token: z.string().min(24).max(48),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({}, { status: 400 });
  }

  const parsed = CtaClickRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({}, { status: 400 });
  }

  const { result_token } = parsed.data;

  // Always return 200 — this is fire-and-forget from the client
  try {
    type SessionRow = {
      id: string;
      email: string | null;
      name: string | null;
      cta_clicked_at: string | null;
    };

    const session = await queryOne<SessionRow>(
      `SELECT id, email, name, cta_clicked_at
       FROM scan_sessions
       WHERE result_token = $1 AND email_submitted_at IS NOT NULL`,
      [result_token],
    );

    if (!session || !session.email || !session.name) {
      return NextResponse.json({});
    }

    // Idempotent — skip if already recorded
    if (session.cta_clicked_at) {
      return NextResponse.json({});
    }

    await execute(
      `UPDATE scan_sessions SET cta_clicked_at = NOW() WHERE id = $1`,
      [session.id],
    );

    // Fire-and-forget to GetCourse — don't await or block response
    const payload = buildCtaClickPayload(session.email, session.name);
    sendToGetcourse(payload).catch((err: unknown) => {
      console.error("[cta-click] GetCourse update failed:", err);
    });
  } catch (err) {
    console.error("[cta-click] DB error:", err);
  }

  return NextResponse.json({});
}
