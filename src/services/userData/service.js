const { eq, sql, gte } = require("drizzle-orm");
const { backendDb } = require("../../db/backendDb");
const {
    backendUsers,
    backendTaskAttempts,
} = require("../../db/schema/backend");

function getNextLevel(level) {
    const levels = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
    const index = levels.indexOf(level);

    if (index === -1) return "A1";
    if (index === levels.length - 1) return level;

    return levels[index + 1];
}

function getDate7DaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
}

async function getUserData(userId) {
    const userRows = await backendDb
        .select()
        .from(backendUsers)
        .where(eq(backendUsers.id, userId))
        .limit(1);

    const user = userRows[0];
    if (!user) return null;

    const statsRows = await backendDb
        .select({
            totalAnswered: sql`count(*)`,
            correctAnswered: sql`count(*) filter (where ${backendTaskAttempts.isCorrect} = true)`,
            totalEarnedXp: sql`coalesce(sum(${backendTaskAttempts.earnedXp}), 0)`,
        })
        .from(backendTaskAttempts)
        .where(eq(backendTaskAttempts.userId, userId));

    const sevenDaysAgo = getDate7DaysAgo();

    const weeklyRows = await backendDb
        .select({
            attemptsLast7Days: sql`count(*)`,
            earnedXpLast7Days: sql`coalesce(sum(${backendTaskAttempts.earnedXp}), 0)`,
            activeDaysLast7: sql`count(distinct date(${backendTaskAttempts.createdAt}))`,
        })
        .from(backendTaskAttempts)
        .where(
            sql`${backendTaskAttempts.userId} = ${userId}
                and ${backendTaskAttempts.createdAt} >= ${sevenDaysAgo}`
        );

    const stats = statsRows[0] || {
        totalAnswered: 0,
        correctAnswered: 0,
        totalEarnedXp: 0,
    };

    const weekly = weeklyRows[0] || {
        attemptsLast7Days: 0,
        earnedXpLast7Days: 0,
        activeDaysLast7: 0,
    };

    return {
        id: user.id,
        username: user.username,
        currentLevel: user.level,
        targetLevel: getNextLevel(user.level),
        currentXp: user.xp,
        streakCount: Number(user.streakCount || 0),
        totalAnswered: Number(stats.totalAnswered || 0),
        correctAnswered: Number(stats.correctAnswered || 0),
        totalEarnedXp: Number(stats.totalEarnedXp || 0),
        attemptsLast7Days: Number(weekly.attemptsLast7Days || 0),
        earnedXpLast7Days: Number(weekly.earnedXpLast7Days || 0),
        activeDaysLast7: Number(weekly.activeDaysLast7 || 0),
    };
}

module.exports = {
    getUserData,
};