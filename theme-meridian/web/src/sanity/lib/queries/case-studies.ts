import { defineQuery } from "groq";

import { AUTHOR_FRAGMENT } from "@/sanity/lib/fragments/author";
import { IMAGE_FRAGMENT } from "@/sanity/lib/fragments/image";
import { LINK_FRAGMENT } from "@/sanity/lib/fragments/link";
import { METADATA_FRAGMENT } from "@/sanity/lib/fragments/metadata";
import { STRUCTURED_DATA_FRAGMENT } from "@/sanity/lib/fragments/structured-data";
import { RICHTEXT_QUERY, SECTIONS_QUERY } from "@/sanity/lib/queries";

const CASE_STUDY_CARD_PROJECTION = `
  _id,
  "title": metadata.title,
  "slug": metadata.slug.current,
  category,
  eyebrow,
  excerpt,
  publishedAt,
  image {
    ${IMAGE_FRAGMENT}
  },
  metrics[]{ value, label }
`;

export const CaseStudiesListingPageQuery = defineQuery(`
  *[_type == 'case-studies-listing-page' && _id == 'caseStudiesListingPage'][0]{
    ...,
    content[] {
      ${RICHTEXT_QUERY}
    },
    featuredCaseStudy[0]->{ ${CASE_STUDY_CARD_PROJECTION} },
    'sections': sections[]{ ${SECTIONS_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
  }
`);

const CASE_STUDIES_FILTER = `_type == 'case-study'
  && ($category == '' || category == $category)
  && ($q == '' || metadata.title match $q || excerpt match $q)
  && !(_id in $excludeIds)`;

// Typegen-only (constant slice); the runtime query is `buildCaseStudiesPageQuery`.
export const CaseStudiesPageQuery = defineQuery(`{
  "caseStudies": *[${CASE_STUDIES_FILTER}] | order(publishedAt desc) [0...6] { ${CASE_STUDY_CARD_PROJECTION} },
  "total": count(*[${CASE_STUDIES_FILTER}])
}`);

export const CaseStudiesFeaturedIdsQuery = defineQuery(
  `*[_type == 'case-studies-listing-page' && _id == 'caseStudiesListingPage'][0].featuredCaseStudy[]._ref`,
);

// GROQ forbids params in slices, so `start`/`end` are interpolated: pass only
// validated, clamped integers.
export const buildCaseStudiesPageQuery = (start: number, end: number): string => `{
  "caseStudies": *[${CASE_STUDIES_FILTER}] | order(publishedAt desc) [${start}...${end}] { ${CASE_STUDY_CARD_PROJECTION} },
  "total": count(*[${CASE_STUDIES_FILTER}])
}`;

export const CaseStudyDetailQuery = defineQuery(`
  *[_type == 'case-study' && metadata.slug.current == $documentSlug][0]{
    "title": metadata.title,
    eyebrow,
    "slug": metadata.slug.current,
    category,
    publishedAt,
    excerpt,
    "author": authors[0]->{ ${AUTHOR_FRAGMENT} },
    logo { ${IMAGE_FRAGMENT} },
    image { ${IMAGE_FRAGMENT} },
    metrics[]{ value, label },
    body[]{ ${RICHTEXT_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
    quote[0]->{
      author,
      role,
      company,
      avatar { ${IMAGE_FRAGMENT} },
      quote[]{ ${RICHTEXT_QUERY} }
    },
    'moreCaseStudies': *[_type == 'case-study' && metadata.slug.current != $documentSlug]
      | order(coalesce(publishedAt, _createdAt) desc)[0...3]{
        _id,
        "title": metadata.title,
        eyebrow,
        "slug": metadata.slug.current,
        image { ${IMAGE_FRAGMENT} },
        link { ${LINK_FRAGMENT} }
      },
  }
`);

export const CaseStudySlugsQuery = defineQuery(`
  *[_type == 'case-study' && defined(metadata.slug.current)]{
    "slug": metadata.slug.current
  }
`);
