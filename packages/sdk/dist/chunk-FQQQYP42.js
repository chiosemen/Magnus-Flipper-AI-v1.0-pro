"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/provider/MagnusContext.tsx
var _react = require('react');

// src/client.ts
var _axios = require('axios'); var _axios2 = _interopRequireDefault(_axios);
var SDKClient = class {
  constructor(opts = {}) {
    this.axios = _axios2.default.create({
      baseURL: opts.baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}
    });
  }
};

// src/api/alerts.ts
var AlertsAPI = class {
  constructor(client) {
    this.client = client;
  }
  async create(payload) {
    const res = await this.client.axios.post("/api/alerts", payload);
    return res.data;
  }
  async list() {
    const res = await this.client.axios.get("/api/alerts");
    return res.data;
  }
};

// src/api/deals.ts
var DealsAPI = class {
  constructor(client) {
    this.client = client;
  }
  async list(minScore) {
    const res = await this.client.axios.get("/api/deals", {
      params: minScore != null ? { minScore } : {}
    });
    return res.data;
  }
};

// src/api/watchlists.ts
var WatchlistsAPI = class {
  constructor(client) {
    this.client = client;
  }
  async list() {
    const res = await this.client.axios.get("/api/watchlists");
    return res.data;
  }
  async create(payload) {
    const res = await this.client.axios.post("/api/watchlists", payload);
    return res.data;
  }
  async delete(id) {
    const res = await this.client.axios.delete(`/api/watchlists/${id}`);
    return res.data;
  }
};

// src/magnus.ts
var MagnusSDK = class {
  constructor(opts = {}) {
    const client = new SDKClient(opts);
    this.deals = new DealsAPI(client);
    this.alerts = new AlertsAPI(client);
    this.watchlists = new WatchlistsAPI(client);
  }
};

// src/provider/MagnusContext.tsx
var _jsxruntime = require('react/jsx-runtime');
var MagnusContext = _react.createContext.call(void 0, null);
function MagnusProvider({
  children,
  options
}) {
  const sdk = _react.useMemo.call(void 0, 
    () => new MagnusSDK(_nullishCoalesce(options, () => ( {}))),
    [_optionalChain([options, 'optionalAccess', _ => _.baseURL]), _optionalChain([options, 'optionalAccess', _2 => _2.apiKey])]
  );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, MagnusContext.Provider, { value: { sdk }, children });
}
function useMagnusSDK() {
  const ctx = _react.useContext.call(void 0, MagnusContext);
  if (!ctx) throw new Error("useMagnusSDK must be used within MagnusProvider");
  return ctx.sdk;
}






exports.SDKClient = SDKClient; exports.MagnusSDK = MagnusSDK; exports.MagnusProvider = MagnusProvider; exports.useMagnusSDK = useMagnusSDK;
//# sourceMappingURL=chunk-FQQQYP42.js.map