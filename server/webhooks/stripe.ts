import { Request, Response } from "express";
import type Stripe from "stripe";
import { createSubscription, getDb } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Stripe webhook handler
 * Verifies Stripe signature and processes payment events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const body = req.body;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
    return res.status(400).json({ error: "Webhook secret not configured" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("[Stripe Webhook] Missing STRIPE_SECRET_KEY (requis pour constructEvent)");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  let event: Stripe.Event;
  try {
    const StripeSdk = (await import("stripe")).default;
    const stripe = new StripeSdk(stripeSecretKey);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing checkout.session.completed");

  const userIdRaw = session.metadata?.userId;
  const level = session.metadata?.level;

  if (!userIdRaw) {
    console.error("[Stripe Webhook] Missing userId in session metadata");
    throw new Error("Invalid session metadata");
  }

  const userId = parseInt(String(userIdRaw), 10);
  if (!Number.isFinite(userId)) {
    throw new Error("Invalid userId in metadata");
  }

  const customer =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription && typeof session.subscription === "object"
        ? session.subscription.id
        : null;

  await createSubscription(userId, customer, subscriptionId);

  console.log(
    `[Stripe Webhook] Subscription row upserted for user ${userId}` +
      (level != null ? ` (checkout metadata level ${level})` : ""),
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.updated");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const stripeSubscriptionId = subscription.id;
  const isLiveAccess =
    subscription.status === "active" || subscription.status === "trialing";
  const status = isLiveAccess ? "active" : "expired";

  const periodEndSec = subscription.current_period_end;
  const endDate =
    typeof periodEndSec === "number" && Number.isFinite(periodEndSec)
      ? new Date(periodEndSec * 1000)
      : undefined;

  const existing = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  const userId = existing[0]?.userId;

  await db
    .update(subscriptions)
    .set({
      status,
      ...(endDate ? { endDate, updatedAt: new Date() } : { updatedAt: new Date() }),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  if (userId != null && endDate) {
    await db
      .update(users)
      .set({
        subscriptionActive: isLiveAccess,
        subscriptionExpiresAt: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  console.log(`[Stripe Webhook] Subscription ${stripeSubscriptionId} updated to ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.deleted");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const stripeSubscriptionId = subscription.id;

  const existing = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  const userId = existing[0]?.userId;

  try {
    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        endDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    if (userId != null) {
      await db
        .update(users)
        .set({
          subscriptionActive: false,
          subscriptionExpiresAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    console.log(`[Stripe Webhook] Subscription ${stripeSubscriptionId} cancelled`);
  } catch (error) {
    console.error("[Stripe Webhook] Failed to cancel subscription:", error);
    throw error;
  }
}
