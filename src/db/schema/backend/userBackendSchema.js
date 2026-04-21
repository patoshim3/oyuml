const {
    pgTable,
    integer,
    text,
    timestamp,
    boolean,
} = require("drizzle-orm/pg-core");

const backendUsers = pgTable("User", {
    id: integer("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    xp: integer("xp").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    role: text("role").notNull(),
    level: text("level").notNull(),
    updatedAt: timestamp("updatedAt"),
    streakCount: integer("streakCount").notNull(),
    streakLastDay: text("streakLastDay"),
    emailConfirmationToken: text("emailConfirmationToken"),
    emailConfirmed: boolean("emailConfirmed").notNull(),
    resetPasswordExpiry: timestamp("resetPasswordExpiry"),
    resetPasswordToken: text("resetPasswordToken"),
    nickname: text("nickname"),
});

module.exports = {
    backendUsers,
};