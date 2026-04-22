import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { subscriptions, completedLevels } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Stripe webhook handler
 * Verifies Stripe signature and processes payment events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const body = req.body;

  // Get webhook secret from environment
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
    return res.status(400).json({ error: "Webhook secret not configured" });
  }

  // Verify Stripe signature
  let event;
  try {
    event = verifyStripeSignature(body, sig, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(
  body: Buffer | string,
  sig: string,
  secret: string
): any {
  const bodyStr = typeof body === "string" ? body : body.toString();

  // Split signature to get timestamp and signatures
  const parts = sig.split(",");
  const timestamp = parts[0].split("=")[1];
  const signatures = parts.slice(1);

  // Create signed content
  const signedContent = `${timestamp}.${bodyStr}`;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");

  // Check if any signature matches
  const isValid = signatures.some((s: string) => {
    const sig = s.split("=")[1];
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    );
  });

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  // Parse and return event
  return JSON.parse(bodyStr);
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: any) {
  console.log("[Stripe Webhook] Processing checkout.session.completed");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Extract metadata
  const userId = session.metadata?.userId;
  const level = parseInt(session.metadata?.level || "0");
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;

  if (!userId || !level) {
    console.error("[Stripe Webhook] Missing userId or level in metadata");
    throw new Error("Invalid session metadata");
  }

  try {
    // Create subscription record
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(subscriptions).values({
      userId: parseInt(userId),
      stripeCustomerId,
      stripeSubscriptionId,
      startDate: now,
      endDate,
      status: "active",
    });

    // Mark level as completed
    await db.insert(completedLevels).values({
      userId: parseInt(userId),
      level,
    });

    console.log(
      `[Stripe Webhook] Subscription activated for user ${userId}, level ${level} unlocked`
    );
  } catch (error) {
    console.error("[Stripe Webhook] Failed to process payment:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: any) {
  console.log("[Stripe Webhook] Processing customer.subscription.updated");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const stripeSubscriptionId = subscription.id;
  const status = subscription.status === "active" ? "active" : "expired";

  try {
    // Update subscription status
    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    console.log(
      `[Stripe Webhook] Subscription ${stripeSubscriptionId} updated to ${status}`
    );
  } catch (error) {
    console.error("[Stripe Webhook] Failed to update subscription:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: any) {
  console.log("[Stripe Webhook] Processing customer.subscription.deleted");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const stripeSubscriptionId = subscription.id;

  try {
    // Mark subscription as cancelled
    await db
      .update(subscriptions)
      .set({ status: "cancelled" })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    console.log(
      `[Stripe Webhook] Subscription ${stripeSubscriptionId} cancelled`
    );
  } catch (error) {
    console.error("[Stripe Webhook] Failed to cancel subscription:", error);
    throw error;
  }
}
