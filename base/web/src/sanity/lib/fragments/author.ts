import { IMAGE_FRAGMENT } from "./image";

/** Use as `"author": authors[0]->{ ${AUTHOR_FRAGMENT} }`: the schema stores an array of references capped at 1. */
export const AUTHOR_FRAGMENT = `
  _id,
  firstName,
  lastName,
  company,
  position,
  linkedinUrl,
  avatar { ${IMAGE_FRAGMENT} }
`;
