import "server-only";
import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";

export function isMasterEmail(email: string) {
  const configured = env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(configured && email.trim().toLowerCase() === configured);
}

export async function getMasterUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isMasterEmail(user.email) ? user : null;
}

export async function requireMasterUser(): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser("/admin");
  if (!isMasterEmail(user.email)) throw new Error("MASTER_ACCESS_DENIED");
  return user;
}
