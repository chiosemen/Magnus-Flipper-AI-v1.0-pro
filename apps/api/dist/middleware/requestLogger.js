"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const core_1 = require("@magnus-flipper-ai/core");
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        core_1.apiLogger.info('Request completed', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map