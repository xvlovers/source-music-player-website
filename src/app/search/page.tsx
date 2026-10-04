import { Suspense } from "react";

import { SearchView } from "@/components/search/SearchView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function SearchPage() {
  // useSearchParams needs a Suspense boundary so the page can still build.
  return (
    <Suspense fallback={<LoadingSkeleton variant="row" count={6} />}>
      <SearchView />
    </Suspense>
  );
}
