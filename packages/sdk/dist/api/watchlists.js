export class WatchlistsAPI {
    client;
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
}
