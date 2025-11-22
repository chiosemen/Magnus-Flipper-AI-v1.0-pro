"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const core_1 = require("@magnus-flipper-ai/core");
function errorHandler(err, req, res, next) {
    core_1.apiLogger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
}
//# sourceMappingURL=errorHandler.js.map