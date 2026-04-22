import { Express, raw } from "express";
import { handleStripeWebhook } from "../webhooks/stripe";

/**
 * Register webhook routes
 * Note: Webhook endpoints must use raw body parser, not JSON
 */
export function registerWebhooks(app: Express) {
  // Stripe webhook endpoint
  // Must use raw body parser to verify signature
  app.post(
    "/api/webhooks/stripe",
    raw({ type: "application/json" }),
    handleStripeWebhook
  );

  console.log("[Webhooks] Registered Stripe webhook at /api/webhooks/stripe");
}
