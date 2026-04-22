import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  createSubscription,
  getSubscription,
  markLevelCompleted,
} from "../db";

/**
 * Stripe payment router
 */
export const stripeRouter = router({
  /**
   * Create a Stripe Checkout session
   * This endpoint creates a session with metadata (userId, level)
   * The metadata will be used by the webhook to update the database
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
      // In production, you would call the real Stripe API:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   mode: 'subscription',
      //   line_items: [{
      //     price: process.env.STRIPE_PRICE_ID!,
      //     quantity: 1,
      //   }],
      //   success_url: input.successUrl,
      //   cancel_url: input.cancelUrl,
      //   metadata: {
      //     userId: input.userId.toString(),
      //     level: input.level.toString(),
      //   },
      // });

      // For MVP testing, return a mock session with metadata
      // The metadata structure matches what Stripe would return
      const sessionId = `cs_test_${Math.random().toString(36).substring(7)}`;

      return {
        sessionId,
        checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`,
        // Include metadata for reference (not used in mock)
        metadata: {
          userId: input.userId.toString(),
          level: input.level.toString(),
        },
      };
    }),

  /**
   * Confirm payment and activate subscription
   * This would be called by the webhook handler
   */
  confirmPayment: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.number(),
        stripeCustomerId: z.string(),
        stripeSubscriptionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create subscription in database
        await createSubscription(
          input.userId,
          input.stripeCustomerId,
          input.stripeSubscriptionId
        );



        return {
          success: true,
          message: "Subscription activated, granting access to unlocked levels",
        };
      } catch (error) {
        console.error("[Stripe] Failed to confirm payment:", error);
        throw error;
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
