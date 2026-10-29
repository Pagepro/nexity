import type { ExtractSectionProps } from "@/types/sections";
import { CDN_BASE, imageFromUrl } from "@/ui/styleguide/sections-gallery/mock-image";

const LOGO_URLS = [
  `${CDN_BASE}/d3b9529b9da47d5fc8ddda10541fcb0b9c59b609-91x24.png`,
  `${CDN_BASE}/e229c43ad03d9e6e954825c4197316dc0da40ab7-79x24.png`,
  `${CDN_BASE}/51131df7150124fee664ef295098eef2df1f824e-133x24.png`,
  `${CDN_BASE}/20f1cbcdcba8c75144c325c7773c08cb21cdde04-119x24.png`,
  `${CDN_BASE}/2682900e4fee623e61536a3dbab7d8903dcb1e30-114x26.png`,
  `${CDN_BASE}/278d7ca96ba3e7c76ae14c2f57272c8707958ae4-124x24.png`,
  `${CDN_BASE}/54c550883bee2a77049c344af7f12c84c06dc79b-119x23.png`,
  `${CDN_BASE}/92343d6cf9cd2af1d23e71a7e7eaa9e71c90f07a-83x26.png`,
];

export const logosCarouselFixture = {
  _type: "logos-carousel",
  _key: "gallery-fixture-logos-carousel",
  logos: LOGO_URLS.map((url, index) => ({
    _key: `logo-${index + 1}`,
    ...imageFromUrl(url, `Partner logo ${index + 1}`),
  })),
  speed: 40,
} satisfies ExtractSectionProps<"logos-carousel">;
