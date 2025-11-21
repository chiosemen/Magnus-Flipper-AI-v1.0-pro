"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }




var _chunkFQQQYP42js = require('./chunk-FQQQYP42.js');

// src/helpers.ts
function ping() {
  return "pong from Magnus SDK";
}
function getVersion() {
  return "1.0.0";
}

// src/validators.ts
var _zod = require('zod');
var UserSchema = _zod.z.object({
  id: _zod.z.string(),
  email: _zod.z.string().email()
});

// src/apiClient.ts
var _axios = require('axios'); var _axios2 = _interopRequireDefault(_axios);
var apiClient = _axios2.default.create({
  baseURL: "https://api.magnus-flipper.ai",
  timeout: 1e4
});
async function fetchDeals() {
  const res = await apiClient.get("/deals");
  return res.data;
}










exports.MagnusProvider = _chunkFQQQYP42js.MagnusProvider; exports.MagnusSDK = _chunkFQQQYP42js.MagnusSDK; exports.SDKClient = _chunkFQQQYP42js.SDKClient; exports.UserSchema = UserSchema; exports.apiClient = apiClient; exports.fetchDeals = fetchDeals; exports.getVersion = getVersion; exports.ping = ping; exports.useMagnusSDK = _chunkFQQQYP42js.useMagnusSDK;
//# sourceMappingURL=index.js.map