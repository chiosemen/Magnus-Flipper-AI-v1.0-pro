import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" disabled={page === 1} onClick={prev}>
        Previous
      </Button>
      <div className="text-sm text-muted-foreground">
        Page {page} / {totalPages || 1}
      </div>
      <Button variant="outline" disabled={page >= totalPages} onClick={next}>
        Next
      </Button>
    </div>
  );
}
