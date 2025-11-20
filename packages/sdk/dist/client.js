import axios from "axios";
export class SDKClient {
    axios;
    constructor(opts = {}) {
        this.axios = axios.create({
            baseURL: opts.baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
            headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}
        });
    }
}
