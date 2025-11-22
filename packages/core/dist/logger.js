"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.botLogger = exports.alertsLogger = exports.analyzerLogger = exports.crawlerLogger = exports.schedulerLogger = exports.apiLogger = exports.createLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
const createLogger = (service) => {
    return winston_1.default.createLogger({
        level: logLevel,
        defaultMeta: { service },
        format: logFormat,
        transports: [
            new winston_1.default.transports.Console({
                format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
            })
        ]
    });
};
exports.createLogger = createLogger;
// Default logger instances for different services
exports.apiLogger = (0, exports.createLogger)('api');
exports.schedulerLogger = (0, exports.createLogger)('scheduler');
exports.crawlerLogger = (0, exports.createLogger)('worker-crawler');
exports.analyzerLogger = (0, exports.createLogger)('worker-analyzer');
exports.alertsLogger = (0, exports.createLogger)('worker-alerts');
exports.botLogger = (0, exports.createLogger)('bot-telegram');
//# sourceMappingURL=logger.js.map