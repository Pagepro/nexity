import { CodeValue } from "./types";

const RichTextCode: React.FC<{ value: CodeValue }> = ({ value }) => {
  const { code, filename } = value;

  if (!code) return null;

  return (
    <figure className="richtext-embed">
      {filename && (
        <figcaption className="mb-2 font-mono text-12 text-muted-foreground">
          {filename}
        </figcaption>
      )}
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-14 leading-6 md:text-16">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </figure>
  );
};

export default RichTextCode;
