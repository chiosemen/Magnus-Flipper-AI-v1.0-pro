// Next.js 16 compatible proxy file
// Replaces deprecated middleware.ts

export const config = {
  matcher: []
};

export default function proxy() {
  // No middleware required. Routing is handled by App Router.
}

