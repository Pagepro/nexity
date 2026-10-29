import { defineQuery } from "groq";

export const IMAGE_FRAGMENT = `
  alt,
  role,
  loading,
  image {
    crop {
      top,
      bottom,
      left,
      right
    },
    hotspot {
      x,
      y,
      height,
      width,
    },
    "asset": asset -> {
      url,
      altText,
    }
  },
  responsive[] {
    media,
    image {
      crop {
        top,
        bottom,
        left,
        right
      },
      hotspot {
        x,
        y,
        height,
        width,
      },
      "asset": asset -> {
        url,
        altText,
      }
    }
  }
`;

export const ImageQuery = defineQuery(`*[_type == "internal.typeSource"][0] {
  image {
    ${IMAGE_FRAGMENT}
  }
}.image`);
