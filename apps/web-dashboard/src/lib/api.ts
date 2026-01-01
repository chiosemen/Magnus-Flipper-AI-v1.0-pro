import "server-only";

const BASE_URL = process.env.MAGNUS_API_BASE_URL?.trim() || null;

export function getApiBaseUrl() {
  return BASE_URL;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error("MAGNUS_API_BASE_URL is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      const message = bodyText?.trim()
        ? bodyText.trim()
        : `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 5 seconds.");
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error occurred while contacting Magnus API.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

