// New fragment type: add the field to the Studio's `__type-source.ts`, a `defineQuery`
// in `sanity/lib/fragments/`, run `pnpm ts:typegen`, then alias the result here.
import { ImageQueryResult, LinkQueryResult, MetadataQueryResult, CTAQueryResult } from "./sanity.types";

export type ImageFragment = NonNullable<ImageQueryResult>;

export type LinkFragment = NonNullable<LinkQueryResult>;

export type CTAFragment = NonNullable<CTAQueryResult>;

export type MetadataFragment = NonNullable<MetadataQueryResult>;
