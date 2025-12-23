/**
 * Local stub for @magnus-flipper-ai/ui/components
 * Re-exports from marketing-swoopa components
 */

export { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/marketing-swoopa/components/ui/card";
export { Button } from "@/marketing-swoopa/components/ui/button";
export { Badge } from "@/marketing-swoopa/components/ui/badge";
export { Input } from "@/marketing-swoopa/components/ui/input";
export { cn } from "@/lib/utils";

// Stub components for missing exports
export const FadeIn = ({ children }: { children: React.ReactNode }) => <>{children}</>;
