export class ApifyClientLite {
  constructor(private token: string) {}

  async startActorRun(actorId: string, input: any) {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${this.token}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }
    );
    if (!res.ok) {
      throw new Error(`Apify start run failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  async getRun(runId: string) {
    const res = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${this.token}`
    );
    if (!res.ok) {
      throw new Error(`Apify get run failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  async getDatasetItems(datasetId: string, limit = 5000) {
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${this.token}&clean=true&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`Apify dataset fetch failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
}

