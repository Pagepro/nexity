import { CTA_FRAGMENT } from "./fragments/cta";
import { IMAGE_FRAGMENT } from "./fragments/image";
import { LINK_FRAGMENT } from "./fragments/link";

export const LINK_QUERY = `
	...,
	internal->{
		_type,
		title,
		metadata,
		slug,
		"preview": {
			"title": coalesce(metadata.title, title),
			"description": coalesce(metadata.description, excerpt),
			"image": coalesce(metadata.image, image){ ${IMAGE_FRAGMENT} }
		}
  },
  file {
    ...,
    asset -> { ... }
  }
`;

const MARKDEFS_QUERY = `
	...select(
		defined(markDefs) && count(markDefs) > 0 => {
			"markDefs": markDefs[]{
				...,
				${LINK_QUERY}
			}
		},
		{}
	)
`;

export const RICHTEXT_QUERY = `
	...,
	_type == 'img' => { ${IMAGE_FRAGMENT} },
	_type == 'pullquote' => {
		...,
		avatar { ${IMAGE_FRAGMENT} }
	},
	_type == 'callout' => {
		...,
		content[]{ ..., ${MARKDEFS_QUERY} },
		cta { ${CTA_FRAGMENT} },
		backgroundImage { ${IMAGE_FRAGMENT} }
	},
	_type == 'videoEmbed' => {
		...,
		poster { ${IMAGE_FRAGMENT} }
	},
	${MARKDEFS_QUERY}
`;

const INTEGRATION_PROJECTION = `
	_id,
	name,
	category,
	logo { ${IMAGE_FRAGMENT} }
`;

// No `shared-section-ref` branch here: shared sections cannot be nested.
const SECTION_BRANCHES_QUERY = `
	_type == 'hero' => {
		layout,
		content[] {
			${RICHTEXT_QUERY}
		},
		image {
			${IMAGE_FRAGMENT},
			// Blur-up thumbnail for the backdrop only (see <Img lqip>). It stays
			// painted under the image, so only for images without transparency.
			"lqip": select(image.asset->metadata.isOpaque == true => image.asset->metadata.lqip)
		},
		productImage {
			${IMAGE_FRAGMENT}
		},
		bottomImage {
			${IMAGE_FRAGMENT}
		},
		logosTitle,
		logos[] {
			_key,
			${IMAGE_FRAGMENT}
		},
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
	  }
	},
  _type == 'content' => {
    content[] {
      ${RICHTEXT_QUERY}
    },
  },
  _type == 'feature-block' => {
    content[] {
      ${RICHTEXT_QUERY}
    },
    images[] {
      _key,
      ${IMAGE_FRAGMENT}
    },
    imageLayout,
    ctas[] {
      variant,
      link { ${LINK_FRAGMENT} }
    }
  },
  _type == 'feature-grid' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    cards[] {
      _key,
      _type == 'card' => {
        _type,
        eyebrow,
        title,
        image {
          ${IMAGE_FRAGMENT}
        },
        link {
          ${LINK_FRAGMENT}
        }
      },
      _type == 'reference' => @->{
        _type,
        _id,
        "title": metadata.title,
        eyebrow,
        category,
        publishedAt,
        "slug": metadata.slug.current,
        image {
          ${IMAGE_FRAGMENT}
        },
        link {
          ${LINK_FRAGMENT}
        }
      }
    }
  },
  _type == 'bento-grid' => {
    cardStyle,
    linkStyle,
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    },
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    cards[] {
      _key,
      size,
      icon,
      statLabel,
      statValue,
      title,
      description,
      link { ${LINK_FRAGMENT} }
    }
  },
  _type == 'integrations-grid' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    allLabel,
    searchPlaceholder,
    emptyMessage,
    source,
    // "all" lists every Integration document A–Z; otherwise (incl. sections saved
    // before the source field existed) the hand-picked references, in their order.
    "integrations": select(
      source == "all" => *[_type == "integration" && defined(name)] | order(lower(name) asc){ ${INTEGRATION_PROJECTION} },
      integrations[]->{ ${INTEGRATION_PROJECTION} }
    ),
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    }
  },
  _type == 'contact-form' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    bullets,
    nameField { label, placeholder },
    emailField { label, placeholder },
    companyField { label, placeholder },
    teamSizeField { label, choices },
    messageField { label, placeholder },
    submitLabel,
    successMessage
  },
  _type == 'impact-calculator' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    inputsTitle,
    teamSizeLabel,
    dealSizeLabel,
    cycleLengthLabel,
    resultsTitle,
    cycleReductionLabel,
    pipelineLabel,
    paybackLabel,
    cta {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    },
    note
  },
  _type == 'trust-badges' => {
    badges[] {
      _key,
      icon,
      label
    }
  },
  _type == 'logos-carousel' => {
    speed,
    logos[] {
      _key,
      ${IMAGE_FRAGMENT}
    }
  },
  _type == 'split-sections' => {
    rows[] {
      _key,
      anchor,
      eyebrow,
      badge,
      content[] {
        ${RICHTEXT_QUERY}
      },
      comparison {
        beforeTitle,
        beforeItems,
        afterTitle,
        afterItems
      },
      bulletsTitle,
      bullets,
      proof,
      insight {
        label,
        text
      },
      ctas[] {
        variant,
        buttonIcon,
        link { ${LINK_FRAGMENT} }
      },
      image {
        ${IMAGE_FRAGMENT}
      }
    }
  },
  _type == 'stats' => {
    layout,
    textAlign,
    content[] {
      ${RICHTEXT_QUERY}
    },
    stats[] {
      _key,
      value,
      label
    }
  },
  _type == 'cta-banner' => {
    content[] {
      ${RICHTEXT_QUERY}
    },
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    },
    backgroundImage {
      ${IMAGE_FRAGMENT}
    },
    image {
      ${IMAGE_FRAGMENT}
    }
  },
  _type == 'testimonials' => {
    layout,
    mark {
      ${IMAGE_FRAGMENT}
    },
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    testimonials[]->{
      _id,
      author,
      role,
      company,
      quote[] {
        ${RICHTEXT_QUERY}
      },
      avatar {
        ${IMAGE_FRAGMENT}
      }
    }
  },
  _type == 'pricing' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    monthlyLabel,
    yearlyLabel,
    footnote,
    plans[] {
      _key,
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      priceSuffix,
      badge,
      featuresTitle,
      features,
      cta {
        variant,
        buttonIcon,
        link { ${LINK_FRAGMENT} }
      }
    }
  },
  _type == 'comparison-table' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    plans[] {
      _key,
      name,
      logo {
        ${IMAGE_FRAGMENT}
      },
      price,
      priceSuffix,
      featured,
      cta {
        variant,
        buttonIcon,
        link { ${LINK_FRAGMENT} }
      }
    },
    featureGroups[] {
      _key,
      title,
      description,
      rows[] {
        _key,
        label,
        hint,
        cells[] {
          _key,
          state,
          value,
          values
        }
      }
    },
    footnote
  },
  _type == 'faq' => {
    pretitle,
    content[] {
      ${RICHTEXT_QUERY}
    },
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    },
    items[] {
      _key,
      question,
      answer
    }
  },
  _type == 'newsletter' => {
    content[] {
      ${RICHTEXT_QUERY}
    },
    layout,
    emailPlaceholder,
    submitLabel,
    successMessage,
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    },
    socialProof[] {
      ${RICHTEXT_QUERY}
    },
    backgroundImage {
      ${IMAGE_FRAGMENT}
    }
  },
  _type == 'text-block' => {
    textAlign,
    content[] {
      ${RICHTEXT_QUERY}
    },
    ctas[] {
      variant,
      buttonIcon,
      link { ${LINK_FRAGMENT} }
    }
  },
  _type == 'blog-listing' => {
    "perPage": coalesce(postsPerPage, 6)
  },
  _type == 'case-studies-listing' => {
    "perPage": coalesce(perPage, 6)
  },
  _type == 'podcast-listing' => {
    "perPage": coalesce(perPage, 8)
  }
`;

export const SECTIONS_QUERY = `
	...,
  _key,
  _type,
  ${SECTION_BRANCHES_QUERY},
  _type == 'shared-section-ref' => {
    sharedSections[]->{
      _id,
      _type,
      title,
      'sections': sections[]{
        ...,
        _key,
        _type,
        ${SECTION_BRANCHES_QUERY}
      }
    }
  },
`;
