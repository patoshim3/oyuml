const { db } = require("../../db");
const { learningForecasts } = require("../../db/schema/learningForecastsSchema");

class ForecastRepository {
    async save(data) {
        const rows = await db
            .insert(learningForecasts)
            .values({
                userId: data.userId,
                currentLevel: data.currentLevel,
                targetLevel: data.targetLevel,
                currentXp: data.currentXp,
                xpRemaining: data.xpRemaining,
                accuracy: data.accuracy,
                predictedDailyXp: data.predictedDailyXp,
                estimatedDays: data.estimatedDays,
                optimisticDays: data.optimisticDays,
                pessimisticDays: data.pessimisticDays,
                confidence: data.confidence,
                advice: data.advice,
                modelName: data.modelName,
                modelVersion: data.modelVersion,
            })
            .returning();

        return rows[0];
    }
}

module.exports = ForecastRepository;