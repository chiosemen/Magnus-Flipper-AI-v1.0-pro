export class DealsAPI {
    client;
    constructor(client) {
        this.client = client;
    }
    async list(minScore) {
        const res = await this.client.axios.get("/api/deals", {
            params: minScore != null ? { minScore } : {}
        });
        return res.data;
    }
}
