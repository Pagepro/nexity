"use client";

import Button from "@/ui/components/button";
import { ErrorState } from "@/ui/error-state";

const ErrorPage = ({ retry }: { error: unknown; retry: () => void }) => (
  <ErrorState
    code="500"
    title="Something went wrong"
    description="This page failed to load. Try again in a moment, or start over from the homepage."
    actions={<Button onClick={retry}>Try again</Button>}
  />
);

export default ErrorPage;
