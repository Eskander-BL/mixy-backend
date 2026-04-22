CREATE TYPE "public"."user_language" AS ENUM('en', 'fr');--> statement-breakpoint
CREATE TABLE "course_slides" (
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
--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DEFAULT 'none'::text;--> statement-breakpoint
DROP TYPE "public"."user_equipment";--> statement-breakpoint
CREATE TYPE "public"."user_equipment" AS ENUM('none', 'controller', 'turntables', 'other');--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DEFAULT 'none'::"public"."user_equipment";--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "equipment" SET DATA TYPE "public"."user_equipment" USING "equipment"::"public"."user_equipment";--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "equipment_model" varchar(255);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "quiz_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "quiz_result" "user_level";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" "user_language" DEFAULT 'en' NOT NULL;