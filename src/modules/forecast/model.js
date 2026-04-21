const BaseModel = require("../core/baseModel");
const {
    LEVEL_XP_MAP,
    FORECAST_MODEL_NAME,
    FORECAST_MODEL_VERSION,
    DEFAULT_DAILY_XP,
    MIN_DAILY_XP,
    MAX_DAILY_XP,
} = require("./constants");

class ForecastModel extends BaseModel {
    constructor() {
        super(FORECAST_MODEL_NAME, FORECAST_MODEL_VERSION);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    round(value, digits = 2) {
        return Number(value.toFixed(digits));
    }

    getSmoothedAccuracy(correctAnswered, totalAnswered) {
        if (totalAnswered <= 0) return 0.5;

        return (correctAnswered + 5) / (totalAnswered + 10);
    }

    getBaseDailyXp(input) {
        const {
            earnedXpLast7Days = 0,
            totalEarnedXp = 0,
            totalAnswered = 0,
        } = input;

        const shortTermXp = earnedXpLast7Days / 7;

        // proxy long-term signal
        const longTermXp =
            totalAnswered > 0 ? totalEarnedXp / Math.max(totalAnswered / 20, 7) : 0;

        if (shortTermXp <= 0 && longTermXp <= 0) {
            return DEFAULT_DAILY_XP;
        }

        return shortTermXp * 0.7 + longTermXp * 0.3;
    }

    getAccuracyFactor(accuracy) {
        if (accuracy >= 0.9) return 1.2;
        if (accuracy >= 0.8) return 1.1;
        if (accuracy >= 0.7) return 1.0;
        if (accuracy >= 0.6) return 0.9;
        return 0.75;
    }

    getConsistencyFactor(input) {
        const { activeDaysLast7 = 0, streakCount = 0 } = input;

        const activeScore = this.clamp(activeDaysLast7 / 7, 0, 1);
        const streakScore = this.clamp(streakCount / 30, 0, 1);

        const consistencyScore = activeScore * 0.6 + streakScore * 0.4;

        return 0.7 + consistencyScore * 0.6; // 0.7 .. 1.3
    }

    getVolumeFactor(input) {
        const { attemptsLast7Days = 0 } = input;

        if (attemptsLast7Days >= 70) return 1.15;
        if (attemptsLast7Days >= 35) return 1.05;
        if (attemptsLast7Days >= 14) return 1.0;
        if (attemptsLast7Days >= 7) return 0.9;
        return 0.8;
    }

    getFatigueFactor(input) {
        const { attemptsLast7Days = 0, activeDaysLast7 = 0 } = input;

        if (attemptsLast7Days > 140 && activeDaysLast7 <= 2) {
            return 0.9;
        }

        return 1.0;
    }

    getConfidence(input) {
        const {
            totalAnswered = 0,
            activeDaysLast7 = 0,
            streakCount = 0,
            attemptsLast7Days = 0,
        } = input;

        const dataScore = this.clamp(totalAnswered / 200, 0, 1);
        const activityScore = this.clamp(activeDaysLast7 / 7, 0, 1);
        const streakScore = this.clamp(streakCount / 30, 0, 1);
        const volumeScore = this.clamp(attemptsLast7Days / 50, 0, 1);

        const confidence =
            dataScore * 0.4 +
            activityScore * 0.25 +
            streakScore * 0.2 +
            volumeScore * 0.15;

        return this.round(confidence, 2);
    }

    generateAdvice(input, metrics) {
        const advice = [];
        const {
            accuracy,
            predictedDailyXp,
            xpRemaining,
        } = metrics;

        const {
            activeDaysLast7 = 0,
            streakCount = 0,
            attemptsLast7Days = 0,
        } = input;

        if (accuracy < 0.6) {
            advice.push("Снизь количество ошибок: повторяй слабые темы перед новыми заданиями.");
        } else if (accuracy < 0.8) {
            advice.push("Прогресс хороший, но регулярное повторение сложных тем ускорит рост.");
        } else {
            advice.push("Точность высокая — можно смело увеличивать сложность заданий.");
        }

        if (activeDaysLast7 < 4) {
            advice.push("Добавь больше учебных дней в неделю: регулярность ускорит выход на следующий уровень.");
        }

        if (streakCount < 7) {
            advice.push("Попробуй удержать серию хотя бы 7 дней подряд — это заметно улучшит темп.");
        }

        if (attemptsLast7Days < 10) {
            advice.push("Увеличь количество попыток в неделю, чтобы поднять дневной XP.");
        }

        if (predictedDailyXp < 30) {
            advice.push("Текущий темп низкий: лучше поставить цель на ежедневный минимум XP.");
        }

        if (xpRemaining > 3000) {
            advice.push("Разбей цель на промежуточные этапы, чтобы прогресс ощущался быстрее.");
        }

        if (advice.length === 0) {
            advice.push("Темп стабильный — продолжай в том же режиме.");
        }

        return advice;
    }

    predict(input) {
        const {
            currentLevel,
            targetLevel,
            currentXp,
            totalAnswered = 0,
            correctAnswered = 0,
        } = input;

        const targetXp = LEVEL_XP_MAP[targetLevel];
        if (targetXp === undefined) {
            throw new Error(`Unknown target level: ${targetLevel}`);
        }

        const xpRemaining = Math.max(targetXp - currentXp, 0);

        const accuracyRaw = this.getSmoothedAccuracy(correctAnswered, totalAnswered);
        const accuracy = Math.round(accuracyRaw * 100);

        const baseDailyXp = this.getBaseDailyXp(input);
        const accuracyFactor = this.getAccuracyFactor(accuracyRaw);
        const consistencyFactor = this.getConsistencyFactor(input);
        const volumeFactor = this.getVolumeFactor(input);
        const fatigueFactor = this.getFatigueFactor(input);

        let predictedDailyXp =
            baseDailyXp *
            accuracyFactor *
            consistencyFactor *
            volumeFactor *
            fatigueFactor;

        predictedDailyXp = this.clamp(
            this.round(predictedDailyXp, 1),
            MIN_DAILY_XP,
            MAX_DAILY_XP
        );

        const estimatedDays =
            xpRemaining === 0 ? 0 : Math.ceil(xpRemaining / predictedDailyXp);

        const optimisticDays =
            xpRemaining === 0 ? 0 : Math.ceil(xpRemaining / (predictedDailyXp * 1.2));

        const pessimisticDays =
            xpRemaining === 0 ? 0 : Math.ceil(xpRemaining / (predictedDailyXp * 0.8));

        const confidence = this.getConfidence(input);

        const advice = this.generateAdvice(input, {
            accuracy: accuracyRaw,
            predictedDailyXp,
            xpRemaining,
        });

        return {
            currentLevel,
            targetLevel,
            currentXp,
            xpRemaining,
            accuracy,
            predictedDailyXp,
            estimatedDays,
            optimisticDays,
            pessimisticDays,
            confidence,
            advice,
            modelName: this.name,
            modelVersion: this.version,
        };
    }
}

module.exports = ForecastModel;