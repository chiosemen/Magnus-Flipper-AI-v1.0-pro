"use client";

import IndexPage from "@swoopa/pages/Index";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return <IndexPage />;
}
