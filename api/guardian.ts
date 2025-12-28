export default async function handler(req: any, res: any) {
  const url = req.url || "";

  if (url.includes("/health")) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: "ok",
        message: "Guardian API healthy",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (url.includes("/test")) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: "ok",
        message: "Guardian API live",
        marketplaces: ["facebook", "vinted"],
        concurrency: 10,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.statusCode = 200;
  res.end("Guardian API running");
}
