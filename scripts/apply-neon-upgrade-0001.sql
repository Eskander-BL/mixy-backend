-- ============================================================================
-- NEON / PostgreSQL : mise à niveau du schéma (équivalent drizzle/0001_*)
-- À exécuter UNE SEULE FOIS dans Neon SQL Editor SI ta base a été créée avec
-- le script d'init manuel (= migration 0000) SANS la colonne users.language
-- et avec l'ancien enum user_equipment (beginner/advanced/platines).
--
-- Après exécution : redémarre le backend Railway ou attend le prochain déploiement.
-- Erreur Stripe : toujours configurable via STRIPE_SECRET_KEY + STRIPE_PRICE_ID (Railway).
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "public"."user_language" AS ENUM ('en', 'fr');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "course_slides" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_slides_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "course_id" integer NOT NULL,
  "slide_number" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "video_url" text,
  "exercise" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DATA TYPE text;
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DEFAULT 'none'::text;

UPDATE "onboarding"
SET "equipment" = CASE lower(trim("equipment"))
  WHEN 'none' THEN 'none'
  WHEN 'beginner' THEN 'controller'
  WHEN 'advanced' THEN 'turntables'
  WHEN 'platines' THEN 'turntables'
  ELSE 'none'
END;

DROP TYPE "public"."user_equipment";

CREATE TYPE "public"."user_equipment" AS ENUM('none', 'controller', 'turntables', 'other');

ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DEFAULT 'none'::"public"."user_equipment";
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DATA TYPE "public"."user_equipment" USING "equipment"::"public"."user_equipment";

ALTER TABLE "onboarding" ADD COLUMN IF NOT EXISTS "equipment_model" varchar(255);
ALTER TABLE "onboarding" ADD COLUMN IF NOT EXISTS "quiz_score" numeric(5, 2);
ALTER TABLE "onboarding" ADD COLUMN IF NOT EXISTS "quiz_result" "user_level";

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" "user_language" DEFAULT 'en' NOT NULL;
