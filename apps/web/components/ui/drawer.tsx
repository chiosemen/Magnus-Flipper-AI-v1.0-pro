import * as React from "react";
import { cn } from "../../lib/utils";

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "left" | "right" | "top" | "bottom";
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      className,
      open = false,
      onOpenChange,
      direction = "right",
      children,
      ...props
    },
    ref
  ) => {
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    const directionClasses = {
      left: "left-0 top-0 h-full",
      right: "right-0 top-0 h-full",
      top: "top-0 left-0 w-full",
      bottom: "bottom-0 left-0 w-full",
    };

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange?.(false)}
          aria-hidden="true"
        />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 bg-background border-border shadow-lg transition-transform",
            directionClasses[direction],
            direction === "left" || direction === "right" ? "w-[90vw] sm:w-[400px]" : "h-auto",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

Drawer.displayName = "Drawer";

const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
DrawerHeader.displayName = "DrawerHeader";

const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto p-6", className)}
    {...props}
  />
));
DrawerContent.displayName = "DrawerContent";

const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end gap-2 p-6", className)}
    {...props}
  />
));
DrawerFooter.displayName = "DrawerFooter";

export {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerContent,
  DrawerFooter,
};
