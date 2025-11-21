// src/helpers.ts
function ping() {
  return "pong from Magnus SDK";
}
function getVersion() {
  return "1.0.0";
}

// src/validators.ts
import { z } from "zod";
var UserSchema = z.object({
  id: z.string(),
  email: z.string().email()
});

// src/apiClient.ts
import axios from "axios";
var apiClient = axios.create({
  baseURL: "https://api.magnus-flipper.ai",
  timeout: 1e4
});
async function fetchDeals() {
  const res = await apiClient.get("/deals");
  return res.data;
}
export {
  UserSchema,
  apiClient,
  fetchDeals,
  getVersion,
  ping
};
//# sourceMappingURL=index.mjs.map