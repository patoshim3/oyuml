const {
    pgTable,
    integer,
    varchar,
    timestamp,
    jsonb,
    real,
} = require("drizzle-orm/pg-core");

const learningForecasts = pgTable("learning_forecasts", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull(),
    currentLevel: varchar("current_level", { length: 10 }).notNull(),
    targetLevel: varchar("target_level", { length: 10 }).notNull(),
    currentXp: integer("current_xp").notNull(),
    xpRemaining: integer("xp_remaining").notNull(),
    accuracy: integer("accuracy").notNull(),
    predictedDailyXp: real("predicted_daily_xp"),
    estimatedDays: integer("estimated_days"),
    optimisticDays: integer("optimistic_days"),
    pessimisticDays: integer("pessimistic_days"),
    confidence: real("confidence"),
    advice: jsonb("advice"),
    modelName: varchar("model_name", { length: 100 }),
    modelVersion: varchar("model_version", { length: 30 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { learningForecasts };