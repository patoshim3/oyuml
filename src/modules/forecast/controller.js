const ForecastService = require("./service");

const forecastService = new ForecastService();

async function getForecast(req, res, next) {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId",
            });
        }

        const data = await forecastService.execute(userId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getForecast,
};