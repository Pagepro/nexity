import { defineQuery } from "groq";

import { missingDocumentError } from "@/lib/errors";
import type { HeaderQueryResult } from "@/types/sanity.types";

import { fetchSanity } from "../fetch";
import { LINK_FRAGMENT } from "../fragments/link";
import { SANITY_TAGS } from "../tags";

const HeaderQuery = defineQuery(`
*[_type == 'header'][0] {
  title,
  menu[] {
    _key,
    _type,
    _type == 'headerLink.list' => {
      title,
      visibleInMainMenu,
      items[] {
        _key,
        _type,
        _type == 'link' => {
          ${LINK_FRAGMENT}
        },
        _type == 'link.list' => {
          _key,
          withTitle,
          title,
          link {
            ${LINK_FRAGMENT}
          },
          links[] {
            _key,
            _type,
            _type == 'link' => {
              ${LINK_FRAGMENT}
            },
            _type == 'link.list' => {
              _key,
              withTitle,
              title,
              link {
                ${LINK_FRAGMENT}
              },
              links[] {
                _key,
                ${LINK_FRAGMENT}
              }
            }
          }
        }
      },
    },
    _type == 'headerLink' => {
      _type,
      visibleInMainMenu,
      ${LINK_FRAGMENT}
    }
  },
  withMobileLink,
  linkMobile { ${LINK_FRAGMENT} },
  searchLink { ${LINK_FRAGMENT} },
  ctas[] {
    _key,
    _type,
    variant,
    link {
      ${LINK_FRAGMENT}
    },
  }
}`);

export const getHeader = async () => {
  const header = await fetchSanity<HeaderQueryResult>({
    query: HeaderQuery,
    tags: [SANITY_TAGS.header],
  });

  if (!header) {
    throw missingDocumentError("Header settings");
  }

  return header;
};
