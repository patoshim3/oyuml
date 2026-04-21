const ForecastModel = require("./model");
const ForecastRepository = require("./repository");
const { getUserData } = require("../../services/userData/service");

class ForecastService {
    constructor() {
        this.model = new ForecastModel();
        this.repository = new ForecastRepository();
    }

    async execute(userId) {
        const user = await getUserData(userId);

        if (!user) {
            const err = new Error("User not found");
            err.statusCode = 404;
            throw err;
        }

        const forecast = this.model.predict(user);

        const saved = await this.repository.save({
            userId,
            ...forecast,
        });

        return {
            user,
            forecast,
            saved,
        };
    }
}

module.exports = ForecastService;