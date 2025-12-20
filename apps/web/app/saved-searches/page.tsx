"use client";

import Link from "next/link";

export default function SavedSearchesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
        <p className="text-gray-600">
          This legacy page was removed during the pooled-only cutover. Use the pooled marketplace pages instead.
        </p>
        <div className="flex gap-3">
          <Link
            href="/marketplaces/facebook"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Facebook Marketplace
          </Link>
          <Link
            href="/marketplaces/cars"
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Car Trade
          </Link>
        </div>
      </div>
    </div>
  );
}
