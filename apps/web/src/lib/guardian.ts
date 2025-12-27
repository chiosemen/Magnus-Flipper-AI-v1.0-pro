// Guardian defaults to production site URL until a dedicated Guardian service is re-enabled.
export const GUARDIAN_BASE_URL =
  process.env.GUARDIAN_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL!;
