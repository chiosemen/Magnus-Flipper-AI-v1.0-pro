// src/provider/MagnusContext.tsx
import { createContext, useContext, useMemo } from "react";

// src/client.ts
import axios from "axios";
var SDKClient = class {
  constructor(opts = {}) {
    this.axios = axios.create({
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
import { jsx } from "react/jsx-runtime";
var MagnusContext = createContext(null);
function MagnusProvider({
  children,
  options
}) {
  const sdk = useMemo(
    () => new MagnusSDK(options ?? {}),
    [options?.baseURL, options?.apiKey]
  );
  return /* @__PURE__ */ jsx(MagnusContext.Provider, { value: { sdk }, children });
}
function useMagnusSDK() {
  const ctx = useContext(MagnusContext);
  if (!ctx) throw new Error("useMagnusSDK must be used within MagnusProvider");
  return ctx.sdk;
}

export {
  SDKClient,
  MagnusSDK,
  MagnusProvider,
  useMagnusSDK
};
//# sourceMappingURL=chunk-EOFR74GH.mjs.map