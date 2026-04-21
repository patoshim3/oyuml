const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const backendPool = new Pool({
    connectionString: process.env.BACKEND_DATABASE_URL,
});

const backendDb = drizzle(backendPool);

module.exports = {
    backendDb,
    backendPool,
};