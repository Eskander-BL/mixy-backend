import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OpenAI } from "openai";

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "OPENAI_API_KEY is not configured on the server.",
    });
  }

  return new OpenAI({ apiKey });
};

export const aiRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        userMessage: z.string(),
        currentLevel: z.number(),
        courseTitle: z.string(),
        currentSlideContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userMessage, currentLevel, courseTitle, currentSlideContent } = input;
      const openai = getOpenAIClient();

      const systemPrompt = `You are Mixy Coach, a DJ teacher inside a learning app.
You know everything about the app and DJing.
You help users from beginner to advanced level.

You must:
- explain clearly and simply
- stay within the context of the app
- give practical tips (DJ setup, transitions, BPM, EQ, etc.)
- adapt explanations to the user level

Keep answers short, useful, and actionable.

Contrainte Thématique :
- L'IA doit impérativement rester dans le contexte de l'apprentissage DJ.
- Si une question de l'utilisateur est jugée hors sujet, l'IA doit poliment rediriger l'utilisateur vers des sujets liés au DJing.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini", // Using gpt-4.1-mini as per available models
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Niveau actuel: ${currentLevel}, Titre du cours: ${courseTitle}, Contenu de la slide: ${currentSlideContent}, Message de l'utilisateur: ${userMessage}` },
        ],
      });

      return { response: response.choices[0].message.content };
    }),
});
