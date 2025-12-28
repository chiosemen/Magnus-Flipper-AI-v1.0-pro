import { redirect } from "next/navigation";
import { adminAutoHeal } from "@/lib/adminAutoHeal";

type SearchParams = {
  next?: string;
};

export default async function AdminHealPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const next = params.next || "/admin";

  await adminAutoHeal();

  redirect(next);
}
