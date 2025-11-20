export class AlertsAPI {
    client;
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
}
