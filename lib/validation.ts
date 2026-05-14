import { z } from "zod";

// ─── Scan start ───────────────────────────────────────────────

export const StartScanRequest = z.object({
  entry_scenario: z.enum(["morning-face", "eye-bags", "face-oval", "legs", "rings"]),
  consent_pdn:    z.literal(true),
  consent_scan:   z.literal(true),
  utm: z
    .object({
      utm_source:   z.string().max(255).optional().nullable(),
      utm_medium:   z.string().max(255).optional().nullable(),
      utm_campaign: z.string().max(255).optional().nullable(),
      utm_content:  z.string().max(255).optional().nullable(),
      utm_term:     z.string().max(255).optional().nullable(),
    })
    .optional(),
  referer: z.string().max(2048).optional().nullable(),
});

export type StartScanRequestType = z.infer<typeof StartScanRequest>;

// ─── Questionnaire ────────────────────────────────────────────

export const QuestionnaireSchema = z.object({
  swelling_time:       z.enum(["morning", "evening", "constant", "cyclic"]),
  water_intake:        z.enum(["under_1l", "1_to_1_5l", "1_5_to_2l", "over_2l"]),
  salt_processed_food: z.enum(["rarely", "sometimes", "often", "daily"]),
  sleep_quality:       z.enum(["good_7plus", "interrupted", "under_6h", "cant_sleep"]),
  hormonal_phase:      z.enum(["regular", "irregular", "perimenopause", "menopause", "skip"]),
});

export type QuestionnaireType = z.infer<typeof QuestionnaireSchema>;

// ─── AI result (from OpenRouter) ─────────────────────────────

const ZoneAnalysis = z.object({
  visible:   z.boolean(),
  intensity: z.enum(["none", "mild", "moderate", "pronounced"]).nullable(),
  note:      z.string().nullable(),
});

const ProgramRef = z.object({
  key:              z.enum(["base", "advanced"]),
  title:            z.string(),
  price_original:   z.number().int(),
  price_discounted: z.number().int(),
  discount_percent: z.number().int(),
  url:              z.string().url(),
  why_this_program: z.string().optional(),
});

export const AiResultSchema = z.object({
  red_flag:        z.boolean(),
  red_flag_reason: z.string().nullable(),
  user_name:       z.string(),
  entry_scenario:  z.enum(["morning-face", "eye-bags", "face-oval", "legs", "rings"]),
  zone_analysis: z.object({
    forehead:    ZoneAnalysis,
    brows:       ZoneAnalysis,
    periorbital: ZoneAnalysis,
    nasolabial:  ZoneAnalysis,
    face_oval:   ZoneAnalysis,
    lips_purse:  ZoneAnalysis,
    chin:        ZoneAnalysis,
    neck:        ZoneAnalysis,
  }).nullable(),
  primary_cause: z
    .object({
      key:                  z.enum(["lymph_stasis", "parasitic_intoxication", "iron_deficiency", "water_salt_imbalance", "hormonal_imbalance"]),
      title:                z.string(),
      explanation_for_user: z.string(),
      confidence:           z.number().min(0).max(1),
    })
    .nullable(),
  secondary_cause: z
    .object({
      key:                  z.enum(["lymph_stasis", "parasitic_intoxication", "iron_deficiency", "water_salt_imbalance", "hormonal_imbalance"]),
      title:                z.string(),
      explanation_for_user: z.string(),
    })
    .nullable(),
  personal_comment:    z.string().nullable(),
  seven_day_plan:      z.array(z.object({ step: z.number().int(), action: z.string(), why: z.string() })).nullable(),
  avoid:               z.array(z.string()).nullable(),
  recommended_program: ProgramRef.nullable(),
  alternative_program: ProgramRef.nullable(),
  disclaimer:          z.string(),
});

export type AiResultType = z.infer<typeof AiResultSchema>;

// ─── Submit email ─────────────────────────────────────────────

export const SubmitEmailRequest = z.object({
  session_token: z.string().length(32),
  result_token:  z.string().min(24).max(48),
  name:  z.string().regex(/^[a-zA-Zа-яА-ЯёЁ\s\-]{1,60}$/, "Имя содержит недопустимые символы"),
  email: z.string().email().max(254),
});

export type SubmitEmailRequestType = z.infer<typeof SubmitEmailRequest>;

// ─── API error response ───────────────────────────────────────

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export function apiError(code: string, message: string): ApiError {
  return { error: { code, message } };
}
