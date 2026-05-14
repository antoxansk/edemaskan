import "server-only";

function require(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const env = {
  OPENROUTER_API_KEY:      require("OPENROUTER_API_KEY"),
  OPENROUTER_MODEL:        process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4",
  OPENROUTER_REFERER_URL:  process.env.OPENROUTER_REFERER_URL ?? "https://edemaskan.lid.nutritionist4day.ru",
  OPENROUTER_APP_NAME:     process.env.OPENROUTER_APP_NAME ?? "Edemaskan",

  GETCOURSE_SCHOOL_DOMAIN: require("GETCOURSE_SCHOOL_DOMAIN"),
  GETCOURSE_API_KEY:       require("GETCOURSE_API_KEY"),

  NEXT_PUBLIC_SITE_URL:    process.env.NEXT_PUBLIC_SITE_URL ?? "https://edemaskan.lid.nutritionist4day.ru",

  CRON_SECRET:             require("CRON_SECRET"),
} as const;
