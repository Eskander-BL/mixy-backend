-- DJ Academy — schéma complet aligné sur drizzle/schema.ts
-- À exécuter sur une base PostgreSQL VIDE uniquement (nouveau projet Neon ou branche vide).
-- Si ta base existe déjà avec l’ancien script, ne réécrée pas tout : utilise apply-neon-upgrade-0001.sql.

CREATE TYPE "public"."subscription_status" AS ENUM ('active', 'expired', 'cancelled');

CREATE TYPE "public"."user_language" AS ENUM ('en', 'fr');

CREATE TYPE "public"."user_equipment" AS ENUM ('none', 'controller', 'turntables', 'other');

CREATE TYPE "public"."user_goal" AS ENUM ('fun', 'party', 'club', 'pro');

CREATE TYPE "public"."user_level" AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TYPE "public"."user_problem" AS ENUM ('transitions', 'bpm', 'structuration', 'unknown');

CREATE TYPE "public"."user_role" AS ENUM ('user', 'admin');

CREATE TYPE "public"."user_status" AS ENUM ('guest', 'registered', 'active', 'inactive');

CREATE TABLE "completed_levels" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "completed_levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "level" integer NOT NULL,
  "completed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "courses" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "level" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "video_url" text NOT NULL,
  "exercise" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "courses_level_unique" UNIQUE ("level")
);

CREATE TABLE "onboarding" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "onboarding_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "level" "user_level" DEFAULT 'beginner' NOT NULL,
  "goal" "user_goal" NOT NULL,
  "equipment" "user_equipment" DEFAULT 'none' NOT NULL,
  "problem" "user_problem" NOT NULL,
  "equipment_model" varchar(255),
  "quiz_score" numeric(5, 2),
  "quiz_result" "user_level",
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "progress" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "current_level" integer DEFAULT 1 NOT NULL,
  "last_completed_level" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "progress_user_id_unique" UNIQUE ("user_id")
);

CREATE TABLE "quiz_questions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quiz_questions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "level" integer NOT NULL,
  "question_number" integer NOT NULL,
  "question" text NOT NULL,
  "options" text NOT NULL,
  "correct_answer_index" integer NOT NULL,
  "explanation" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "quiz_results" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quiz_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "level" integer NOT NULL,
  "score" numeric(5, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "subscriptions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "status" "subscription_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_user_id_unique" UNIQUE ("user_id")
);

CREATE TABLE "temp_quiz_state" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "temp_quiz_state_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "score" numeric(5, 2) NOT NULL,
  "level" integer NOT NULL,
  "onboarding_data" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  CONSTRAINT "temp_quiz_state_user_id_unique" UNIQUE ("user_id")
);

CREATE TABLE "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "guest_id" varchar(64),
  "openId" varchar(64),
  "name" text,
  "email" varchar(320),
  "password_hash" text,
  "loginMethod" varchar(64),
  "status" "user_status" DEFAULT 'guest' NOT NULL,
  "role" "user_role" DEFAULT 'user' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "last_signed_in" timestamp DEFAULT now() NOT NULL,
  "language" "user_language" DEFAULT 'en' NOT NULL,
  "subscription_active" boolean DEFAULT false NOT NULL,
  "subscription_expires_at" timestamp,
  "learning_profile_json" text,
  CONSTRAINT "users_guest_id_unique" UNIQUE ("guest_id"),
  CONSTRAINT "users_openId_unique" UNIQUE ("openId"),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

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
