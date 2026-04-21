const {
    pgTable,
    integer,
    boolean,
    json,
    timestamp,
} = require("drizzle-orm/pg-core");

const backendTaskAttempts = pgTable("TaskAttempt", {
    id: integer("id").primaryKey(),
    userId: integer("userId").notNull(),
    taskId: integer("taskId").notNull(),
    answerWords: json("answerWords").notNull(),
    isCorrect: boolean("isCorrect").notNull(),
    earnedXp: integer("earnedXp").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

module.exports = {
    backendTaskAttempts,
};