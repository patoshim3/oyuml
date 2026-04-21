const { backendUsers } = require("./userBackendSchema");
const { backendTaskAttempts } = require("./taskAttemptBackendSchema");
const { backendProgress } = require("./progressBackendSchema");

module.exports = {
    backendUsers,
    backendTaskAttempts,
    backendProgress,
};