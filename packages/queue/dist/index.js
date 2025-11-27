"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initQueueSystem = initQueueSystem;
exports.enqueueJob = enqueueJob;
exports.getQueueStatus = getQueueStatus;
function initQueueSystem() {
    console.log("[queue] Redis-free mode: no-op initialized.");
}
function enqueueJob() {
    console.warn("[queue] enqueueJob() called, but queue system is disabled.");
}
function getQueueStatus() {
    return {
        enabled: false,
        backend: "none",
        message: "Redis-free mode",
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=index.js.map