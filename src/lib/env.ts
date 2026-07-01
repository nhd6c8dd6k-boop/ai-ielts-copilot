const optionalEnv = (key: string) => process.env[key];

export const env = {
  nextPublicSiteUrl:
    optionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  supabaseUrl: optionalEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: optionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  openaiApiKey: optionalEnv("OPENAI_API_KEY"),
  stripeSecretKey: optionalEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optionalEnv("STRIPE_WEBHOOK_SECRET"),
  stripeProMonthlyPriceId: optionalEnv("STRIPE_PRO_MONTHLY_PRICE_ID"),
  stripeProYearlyPriceId: optionalEnv("STRIPE_PRO_YEARLY_PRICE_ID"),
  wechatPayMchId: optionalEnv("WECHAT_PAY_MCH_ID"),
  wechatPayAppId: optionalEnv("WECHAT_PAY_APP_ID"),
  alipayAppId: optionalEnv("ALIPAY_APP_ID"),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function requireEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
