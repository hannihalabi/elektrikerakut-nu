import { getChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";

async function adminEmails() {
  const { env } = await import("cloudflare:workers");
  const value = (env as unknown as Record<string, string | undefined>).PARTNER_ADMIN_EMAILS ?? "";
  return new Set(value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export async function isPartnerAdmin(user: ChatGPTUser) {
  return (await adminEmails()).has(user.email.toLowerCase());
}

export async function getPartnerAdmin() {
  const user = await getChatGPTUser();
  return user && await isPartnerAdmin(user) ? user : null;
}
