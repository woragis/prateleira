import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_ESSENCIAL: z.string().min(1).optional(),
  STRIPE_PRICE_PROFISSIONAL: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  UPLOAD_DRIVER: z.enum(["local", "blob"]).default("local"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SEED_FORCE_ACTIVE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return cached;
}

export function hasStripeConfig(): boolean {
  const env = getEnv();
  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_PRICE_ESSENCIAL &&
      env.STRIPE_PRICE_PROFISSIONAL &&
      !env.STRIPE_SECRET_KEY.includes("replace"),
  );
}
