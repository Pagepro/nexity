import { serializeGraph } from "@/lib/schema-org/build-graph";
import type { SchemaGraph } from "@/lib/schema-org/types";

interface StructuredDataProps {
  graph: SchemaGraph | null;
}

// Rendered in the tree because the Metadata API has no JSON-LD field.
export const StructuredData = ({ graph }: StructuredDataProps) => {
  if (!graph) return null;

  return (
    <script
      type="application/ld+json"
      // Safe: `serializeGraph` escapes `<`, `>` and `&`, so no CMS string can close the element.
      dangerouslySetInnerHTML={{ __html: serializeGraph(graph) }}
    />
  );
};
