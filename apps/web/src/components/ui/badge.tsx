import { Badge as BaseBadge, type BadgeProps as BaseBadgeProps } from "../../../components/ui/Badge";

export interface BadgeProps extends Omit<BaseBadgeProps, "variant"> {
  variant?: BaseBadgeProps["variant"] | string;
}

export function Badge(props: BadgeProps) {
  return <BaseBadge {...(props as BaseBadgeProps)} />;
}
