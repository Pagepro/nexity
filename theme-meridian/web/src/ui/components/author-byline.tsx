interface AuthorBylineProps {
  author: {
    firstName: string;
    lastName: string;
    linkedinUrl?: string | null;
  } | null;
  label?: string;
}

export const AuthorByline = ({ author, label = "By" }: AuthorBylineProps) => {
  if (!author) return null;

  const name = `${author.firstName} ${author.lastName}`;

  return (
    <span>
      {label}{" "}
      {author.linkedinUrl ? (
        <a
          href={author.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {name}
        </a>
      ) : (
        name
      )}
    </span>
  );
};
