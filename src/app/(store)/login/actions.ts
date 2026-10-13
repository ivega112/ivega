"use server";

import { headers } from "next/headers";
import { attemptLogin } from "@/lib/auth/login";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export interface LoginState {
  ok: boolean;
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "بيانات الدخول غير صالحة" };
  }

  // IP-based limit on top of the existing per-account lockout (src/lib/auth/login.ts) —
  // that lockout only kicks in after failures against one specific, existing account; this
  // additionally caps raw request volume against the login endpoint itself (e.g. hammering
  // it with many different/nonexistent emails, which never trips the per-account lockout).
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`login:${ip}`, { windowMs: 15 * 60 * 1000, max: 20 });
  if (!allowed) {
    return { ok: false, error: "محاولات دخول كثيرة جداً، يرجى المحاولة لاحقاً" };
  }

  const h = await headers();
  const result = await attemptLogin(parsed.data.email, parsed.data.password, {
    userAgent: h.get("user-agent") ?? undefined,
    ipAddress: h.get("x-forwarded-for") ?? undefined,
  });

  if (!result.ok) {
    const messages: Record<string, string> = {
      invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      locked: "تم قفل الحساب مؤقتاً بسبب محاولات دخول فاشلة متكررة",
      inactive: "الحساب غير مفعّل",
    };
    return { ok: false, error: messages[result.reason] };
  }

  return { ok: true };
}
