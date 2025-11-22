"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const routes_1 = __importDefault(require("./routes"));
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.apiEnvSchema);
const app = (0, express_1.default)();
const port = Number(env.PORT) || 10000;
// Middleware
app.use(express_1.default.json());
app.use(requestLogger_1.requestLogger);
// Routes
app.use(routes_1.default);
// Error handling (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(port, '0.0.0.0', () => {
    core_1.apiLogger.info(`🚀 API server started`, {
        port,
        nodeEnv: env.NODE_ENV,
        redisHost: env.REDIS_HOST,
    });
});
//# sourceMappingURL=index.js.map