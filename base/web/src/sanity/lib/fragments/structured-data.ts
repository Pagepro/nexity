import { IMAGE_FRAGMENT } from "./image";

// Interpolate once per routed query at the document level, next to `metadata {…}`,
// never inside it (the fields aren't there).
export const STRUCTURED_DATA_FRAGMENT = `
  _createdAt,
  _updatedAt,
  schemaPageType,
  schemaArticleType
`;

export const SITE_STRUCTURED_DATA_FRAGMENT = `
  title,
  seo {
    title,
    description
  },
  logo { ${IMAGE_FRAGMENT} },
  structuredData {
    legalName,
    alternateName,
    address {
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry
    },
    telephone,
    email,
    logo { ${IMAGE_FRAGMENT} },
    foundingDate,
    priceRange,
    localBusinessType,
    sameAs,
    schemaDefaults {
      page,
      post,
      caseStudy,
      blogListingPage,
      caseStudiesListingPage,
      podcastListingPage,
      podcastEpisode
    }
  }
`;
