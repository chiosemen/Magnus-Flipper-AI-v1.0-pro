import * as React from "react";

export function Carousel(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function CarouselContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function CarouselItem(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function CarouselPrevious(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      Prev
    </button>
  );
}

export function CarouselNext(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      Next
    </button>
  );
}
