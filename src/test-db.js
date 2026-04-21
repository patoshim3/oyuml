require("dotenv").config();

const { getUserData } = require("./services/userData/service");
const ForecastModel = require("./modules/forecast/model");

async function main() {
    try {
        const userId = 1;

        const userData = await getUserData(userId);

        console.log("USER DATA:");
        console.dir(userData, { depth: null });

        if (!userData) {
            console.log("User not found");
            return;
        }

        const model = new ForecastModel();

        const prediction = model.predict(userData);

        console.log("PREDICTION:");
        console.dir(prediction, { depth: null });
    } catch (error) {
        console.error("TEST ERROR:", error);
    } finally {
        process.exit(0);
    }
}

main();