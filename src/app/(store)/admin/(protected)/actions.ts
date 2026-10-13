"use server";

import { revokeCurrentSession } from "@/lib/auth/session";

export async function logoutAction() {
  await revokeCurrentSession();
}
