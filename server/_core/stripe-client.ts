/**
 * Stripe Client Helper
 * 
 * This module provides a unified interface for Stripe operations.
 * It automatically switches between mock and real Stripe based on environment variables.
 * 
 * To use real Stripe:
 * 1. Set STRIPE_SECRET_KEY environment variable
 * 2. Set STRIPE_PRICE_ID environment variable
 * 3. No code changes needed - the module will automatically use real Stripe
 */

interface CheckoutSessionParams {
  userId: number;
  level: number;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Check if real Stripe is configured
 */
function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

/**
 * Create a Stripe Checkout session
 * Automatically uses real Stripe if configured, otherwise uses mock
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSession> {
  if (isStripeConfigured()) {
    return createRealCheckoutSession(params);
  } else {
    return createMockCheckoutSession(params);
  }
}

/**
 * Create a real Stripe Checkout session
 * Requires: STRIPE_SECRET_KEY, STRIPE_PRICE_ID
 */
async function createRealCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSession> {
  // Dynamically import Stripe only when needed
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId.toString(),
      level: params.level.toString(),
    },
  });

  return {
    id: session.id,
    url: session.url || "",
  };
}

/**
 * Sans clés Stripe, on refuse une fausse URL (404 sur checkout.stripe.com) — inutile et trompeur.
 */
function createMockCheckoutSession(
  _params: CheckoutSessionParams
): never {
  throw new Error(
    "Stripe n'est pas configuré côté serveur : définir STRIPE_SECRET_KEY et STRIPE_PRICE_ID. Aucun paiement ne peut être initialisé sans ces variables."
  );
}

function assertStripeSecret(): void {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }
}

/**
 * Annulation « cancel anytime » : le renouvellement est coupé mais l’accès reste jusqu’à la fin
 * de la période déjà payée (comportement Stripe `cancel_at_period_end`).
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string,
): Promise<{ currentPeriodEnd: Date; cancelAtPeriodEnd: boolean }> {
  assertStripeSecret();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sub = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  return {
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

/**
 * Portail client Stripe (carte, factures).
 */
export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  assertStripeSecret();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });
  return { url: session.url || "" };
}

/**
 * État Stripe à jour (statut, fin de période, annulation à la fin de période en cours).
 */
export async function retrieveStripeSubscription(stripeSubscriptionId: string): Promise<{
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}> {
  assertStripeSecret();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return {
    status: sub.status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

/**
 * Verify Stripe webhook signature
 * Requires: STRIPE_WEBHOOK_SECRET
 */
export function verifyWebhookSignature(
  body: Buffer | string,
  signature: string
): any {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  const crypto = require("crypto");
  const bodyStr = typeof body === "string" ? body : body.toString();

  // Parse signature header
  const parts = signature.split(",");
  const timestamp = parts[0].split("=")[1];
  const signatures = parts.slice(1);

  // Create signed content
  const signedContent = `${timestamp}.${bodyStr}`;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(signedContent)
    .digest("hex");

  // Check if any signature matches
  const isValid = signatures.some((s: string) => {
    const sig = s.split("=")[1];
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  });

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  // Parse and return event
  return JSON.parse(bodyStr);
}

/**
 * Get Stripe configuration status
 */
export function getStripeStatus() {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasPriceId = !!process.env.STRIPE_PRICE_ID;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  return {
    configured: hasSecretKey && hasPriceId,
    hasSecretKey,
    hasPriceId,
    hasWebhookSecret,
    mode: hasSecretKey && hasPriceId ? "production" : "mock",
  };
}
