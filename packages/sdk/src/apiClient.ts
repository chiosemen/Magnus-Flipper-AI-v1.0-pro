import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://api.magnus-flipper.ai",
  timeout: 10000,
});

export async function fetchDeals() {
  const res = await apiClient.get("/deals");
  return res.data;
}
