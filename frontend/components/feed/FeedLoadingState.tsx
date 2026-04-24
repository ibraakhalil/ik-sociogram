import { LoaderCircle } from "lucide-react";

export default function FeedLoadingState() {
  return (
    <div className="bg-surface border-line flex min-h-[50vh] items-center justify-center rounded-lg border p-6 shadow-[var(--shadow-card)]">
      <div className="text-muted flex items-center gap-3 text-sm font-medium">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Loading your feed...
      </div>
    </div>
  );
}
