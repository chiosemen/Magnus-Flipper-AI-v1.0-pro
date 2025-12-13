export const dynamic = "force-dynamic";

async function getLatest() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/deploy-guardian/latest`,
    {
      headers: {
        "x-deploy-guardian-read-token":
          process.env.NEXT_PUBLIC_DG_READ_TOKEN!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error("Failed to load DeployGuardian status");
  return res.json();
}

export default async function DeployGuardianPage() {
  const { latest } = await getLatest();

  if (!latest) {
    return <div className="p-6">No DeployGuardian runs yet.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">DeployGuardian</h1>

      <div className="rounded border p-4">
        <p><strong>Status:</strong> {latest.status}</p>
        <p><strong>Contract:</strong> v{latest.contract_version}</p>
        <p><strong>Schema Hash:</strong> {latest.contract_schema_hash.slice(0, 10)}…</p>
        <p><strong>Created:</strong> {new Date(latest.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
