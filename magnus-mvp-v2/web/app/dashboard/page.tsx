"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  thumbnail?: string;
  scrapedAt: string;
};

type ScrapePayload = {
  marketplace: string;
  query: string;
  listings: Listing[];
  createdAt: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<ScrapePayload[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const response = await fetch(`${API_URL}/scrapes/latest`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Unable to load scrapes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    return () => clearInterval(handle);
  }, []);

  return (
    <main>
      <h1>Live Scraper Activity</h1>
      {loading && <p>Loading...</p>}
      {!loading && data.length === 0 && <p>No data yet.</p>}

      {data.map((batch, idx) => (
        <section key={idx} style={{ marginBottom: 24 }}>
          <h2>
            {batch.marketplace.toUpperCase()} – query: “{batch.query}” –{" "}
            <small>{new Date(batch.createdAt).toLocaleString()}</small>
          </h2>
          <ul>
            {batch.listings.slice(0, 5).map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong> – {item.price} {item.currency} –{" "}
                <a href={item.url} target="_blank" rel="noreferrer">
                  view
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
