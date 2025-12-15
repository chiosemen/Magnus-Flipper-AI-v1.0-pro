import { Card } from "@magnus-flipper-ai/ui/components";

export const dynamic = "force-dynamic";

async function getLatest() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/deploy-guardian/latest`,
    {
      headers: {
        "x-deploy-guardian-read-token":
          process.env.DEPLOY_GUARDIAN_READ_TOKEN!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch DeployGuardian latest:", res.status, res.statusText);
    return { latest: null };
  }
  return res.json();
}

export default async function DeployGuardianPage() {
  const data = await getLatest();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Deploy Guardian</h2>
      <Card>
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
