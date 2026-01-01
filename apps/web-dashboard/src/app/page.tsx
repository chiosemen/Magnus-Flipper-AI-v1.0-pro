import { apiFetch, getApiBaseUrl } from "../lib/api";

export default async function Home() {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-24 text-slate-900">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h1 className="text-xl font-semibold">System Status</h1>
          <p className="mt-3 text-sm font-medium text-red-600">
            MAGNUS_API_BASE_URL is not set. Configure it to check system status.
          </p>
        </div>
      </main>
    );
  }

  const status = await getApiStatus();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-24 text-slate-900">
      <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-xl font-semibold">System Status</h1>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600">Magnus API</p>
            <p className="text-sm text-slate-500">{status.detail}</p>
          </div>
          <span className={`text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    </main>
  );
}

type ApiStatus = {
  label: string;
  color: string;
  detail: string;
};

async function getApiStatus(): Promise<ApiStatus> {
  try {
    const health = await apiFetch<{ message?: string }>("/api/health");

    return {
      label: "API reachable",
      color: "text-green-600",
      detail: health?.message?.trim() || "Healthy",
    };
  } catch (error) {
    return {
      label: "API unreachable",
      color: "text-red-600",
      detail:
        error instanceof Error
          ? error.message
          : "Unable to reach Magnus API.",
    };
  }
}
