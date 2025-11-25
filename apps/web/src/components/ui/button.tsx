import { Button as BaseButton, type ButtonProps as BaseButtonProps } from "../../../components/ui/Button";

export interface ButtonProps extends Omit<BaseButtonProps, "size" | "variant"> {
  asChild?: boolean;
  size?: BaseButtonProps["size"] | string;
  variant?: BaseButtonProps["variant"] | string;
}

export function Button({ asChild, ...props }: ButtonProps) {
  return <BaseButton {...(props as BaseButtonProps)} />;
}
