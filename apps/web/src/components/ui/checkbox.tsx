import * as React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ onCheckedChange, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        onCheckedChange?.(e.target.checked);
      }}
    />
  );
}
