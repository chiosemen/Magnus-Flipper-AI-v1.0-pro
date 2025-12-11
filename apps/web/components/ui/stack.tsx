import * as React from "react";
import { cn } from "../../lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = "column",
      spacing = 4,
      align = "stretch",
      justify = "start",
      wrap = false,
      ...props
    },
    ref
  ) => {
    const spacingMap = {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
      16: "gap-16",
      20: "gap-20",
      24: "gap-24",
    };

    const alignMap = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    };

    const justifyMap = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          direction === "row" ? "flex-row" : "flex-col",
          spacingMap[spacing],
          alignMap[align],
          justifyMap[justify],
          wrap && "flex-wrap",
          className
        )}
        {...props}
      />
    );
  }
);

Stack.displayName = "Stack";

export { Stack };
