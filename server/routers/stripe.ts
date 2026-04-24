import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getSubscription } from "../db";
import { createCheckoutSession as createStripeSession } from "../_core/stripe-client";

/**
 * Stripe payment router — validation paiement **uniquement** via webhooks Stripe.
 */
export const stripeRouter = router({
  /**
   * Create a Stripe Checkout session (vrai Stripe si clés présentes, sinon erreur explicite).
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const session = await createStripeSession({
          userId: input.userId,
          level: input.level,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });
        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Stripe a renvoyé une session sans URL de checkout",
          });
        }
        return {
          sessionId: session.id,
          checkoutUrl: session.url,
        };
      } catch (e) {
        if (e instanceof TRPCError) {
          throw e;
        }
        const message = e instanceof Error ? e.message : "Création de session échouée";
        console.error("[Stripe] createCheckoutSession failed:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Get subscription status
   */
  getSubscriptionStatus: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const subscription = await getSubscription(input.userId);

      if (!subscription) {
        return {
          isActive: false,
          expiresAt: null,
        };
      }

      const now = new Date();
      const expiresAt = new Date(subscription.endDate);
      const isActive = expiresAt > now;

      return {
        isActive,
        expiresAt: expiresAt.toISOString(),
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      // In production, you would:
      // 1. Call Stripe API to cancel the subscription
      // 2. Update the database to mark subscription as cancelled
      // 3. Return the result

      // For now, return a mock response
      return {
        success: true,
        message: "Subscription cancelled",
      };
    }),
});
