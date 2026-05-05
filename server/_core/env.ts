export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Destinataire des messages du formulaire Contact (ton mail pro). */
  contactNotifyEmail: process.env.CONTACT_NOTIFY_EMAIL ?? "",
  /** Clé API Resend (https://resend.com) — envoi des mails contact. */
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  /** Expéditeur visible (domaine vérifié chez Resend en prod). Ex. Mixy <contact@mixyia.com> */
  mailFrom: process.env.MAIL_FROM ?? "Mixy <onboarding@resend.dev>",
};
