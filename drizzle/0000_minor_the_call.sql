CREATE TABLE "learning_forecasts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning_forecasts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"current_level" varchar(10) NOT NULL,
	"target_level" varchar(10) NOT NULL,
	"current_xp" integer NOT NULL,
	"xp_remaining" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"estimated_days" integer,
	"advice" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
