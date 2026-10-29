export const missingDocumentError = (documentName: string) =>
  new Error(`Missing ${documentName}: publish it in Sanity Studio.`);
