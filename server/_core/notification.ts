import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
  /** Répondre directement à l’utilisateur (formulaire contact). */
  replyTo?: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string): string => {
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  const replyToRaw = input.replyTo;
  let replyTo: string | undefined;
  if (replyToRaw !== undefined && replyToRaw !== null) {
    const rt = trimValue(String(replyToRaw));
    if (rt.length > 320) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "replyTo must be at most 320 characters.",
      });
    }
    if (rt.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rt)) {
      replyTo = rt;
    }
  }

  return { title, content, replyTo };
};

const SUBJECT_MAX_RESEND = 990;

async function sendOwnerEmailViaResend(
  subject: string,
  text: string,
  replyTo?: string
): Promise<boolean> {
  const apiKey = ENV.resendApiKey;
  const to = ENV.contactNotifyEmail.trim();
  const from = ENV.mailFrom.trim();
  if (!apiKey || !to) {
    return false;
  }
  if (!from) {
    return false;
  }

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject: subject.slice(0, SUBJECT_MAX_RESEND),
    text,
  };
  if (replyTo) {
    body.reply_to = replyTo;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Resend failed (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Resend error:", error);
    return false;
  }
}

async function sendViaForge(title: string, content: string): Promise<boolean> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    return false;
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Forge notify failed (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Forge notify error:", error);
    return false;
  }
}

/**
 * Notifie le propriétaire du projet :
 * 1. E-mail via **Resend** si `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL` sont définis ;
 * 2. Sinon service Forge (Manus) si `BUILT_IN_FORGE_*` est configuré.
 * Retourne `false` si aucun canal n’est disponible ou si l’envoi échoue.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content, replyTo } = validatePayload(payload);

  const emailed = await sendOwnerEmailViaResend(title, content, replyTo);
  if (emailed) {
    return true;
  }

  const forged = await sendViaForge(title, content);
  if (forged) {
    return true;
  }

  console.warn(
    "[Notification] Aucun envoi : configure RESEND_API_KEY + CONTACT_NOTIFY_EMAIL (recommandé) ou BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY.",
  );
  return false;
}
