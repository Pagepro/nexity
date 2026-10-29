import { NextStudio } from "next-sanity/studio";

import config from "$/sanity.config";

import NetworkStatusWrapper from "./NetworkStatusWrapper";

export const dynamic = "force-static";

export const maxDuration = 60;

export { metadata, viewport } from "next-sanity/studio";

const StudioPage = () => (
  <NetworkStatusWrapper>
    <NextStudio config={config} />
  </NetworkStatusWrapper>
);

export default StudioPage;
