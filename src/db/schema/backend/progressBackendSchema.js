const {
    pgTable,
    integer,
    text,
    timestamp,
} = require("drizzle-orm/pg-core");

const backendProgress = pgTable("Progress", {
    id: integer("id").primaryKey(),
    userId: integer("userId").notNull(),
    lessonId: integer("lessonId").notNull(),
    status: text("status").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
});

module.exports = {
    backendProgress,
};