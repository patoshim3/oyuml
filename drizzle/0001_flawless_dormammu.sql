ALTER TABLE "learning_forecasts" ADD COLUMN "predicted_daily_xp" real;--> statement-breakpoint
ALTER TABLE "learning_forecasts" ADD COLUMN "optimistic_days" integer;--> statement-breakpoint
ALTER TABLE "learning_forecasts" ADD COLUMN "pessimistic_days" integer;--> statement-breakpoint
ALTER TABLE "learning_forecasts" ADD COLUMN "confidence" real;--> statement-breakpoint
ALTER TABLE "learning_forecasts" ADD COLUMN "model_name" varchar(100);--> statement-breakpoint
ALTER TABLE "learning_forecasts" ADD COLUMN "model_version" varchar(30);