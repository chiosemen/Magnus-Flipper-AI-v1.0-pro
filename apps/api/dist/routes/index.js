"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const savedSearches_1 = __importDefault(require("./savedSearches"));
const listings_1 = __importDefault(require("./listings"));
const alerts_1 = __importDefault(require("./alerts"));
const router = (0, express_1.Router)();
router.use(health_1.default);
router.use('/api/saved-searches', savedSearches_1.default);
router.use('/api/listings', listings_1.default);
router.use('/api/alerts', alerts_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map