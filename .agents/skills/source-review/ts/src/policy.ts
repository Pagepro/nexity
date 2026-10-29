/**
 * Policy packs.
 *
 * This module is a port of `src/claim_source_reviewer/config/policy.py`.
 *
 * A policy pack is a YAML file. The pack holds every domain rule, subject rule,
 * and claim rule. This code holds no domain list and no topic list. To support a
 * new technology or a new industry, add a pack file. Do not change this code.
 *
 * The loader merges packs in the given order. A later pack overrides an earlier
 * pack for the same key.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

import { ClaimKind, SourceType } from "./models.js";
import { fold } from "./textops.js";

export interface SourceTypeRule {
  weight: number;
  minConfidence: number;
  allowed: boolean;
  fallbackOnly: boolean;
}

export interface DomainRule {
  pattern: string;
  sourceType: SourceType;
  priority: number;
}

export interface PathRule {
  contains: string;
  sourceType: SourceType;
  appliesTo: SourceType[];
}

export interface SubjectRule {
  aliases: string[];
  domains: string[];
  directUrls: string[];
}

export interface ClaimSignal {
  name: string;
  regex: string;
  kind: ClaimKind;
}

const DEFAULT_SOURCE_TYPE_RULE: SourceTypeRule = {
  weight: 0.5,
  minConfidence: 0.75,
  allowed: true,
  fallbackOnly: false,
};

const OFFICIAL_TYPES: ReadonlySet<SourceType> = new Set([
  SourceType.OFFICIAL_DOCS,
  SourceType.OFFICIAL_RELEASE,
  SourceType.OFFICIAL_ADVISORY,
  SourceType.OFFICIAL_BLOG,
  SourceType.STANDARDS_BODY,
]);

/** Return the lower-case host of a URL without a port. */
export function hostOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(url.trim());
  let host = (match?.[1] ?? "").toLowerCase();
  if (host.includes("@")) host = host.slice(host.indexOf("@") + 1);
  if (host.includes(":")) host = host.slice(0, host.indexOf(":"));
  return host;
}

/** Return the path of a URL in lower case. */
function pathOf(url: string): string {
  const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const slash = withoutScheme.indexOf("/");
  if (slash < 0) return "";
  const rest = withoutScheme.slice(slash);
  return rest.split(/[?#]/)[0]!.toLowerCase();
}

/**
 * Translate a shell glob into a regular expression.
 *
 * The Python loader uses `fnmatch`, where `*` matches any run of characters,
 * including a dot, and `?` matches one character.
 */
function globToRegExp(pattern: string): RegExp {
  let source = "";
  for (const char of pattern) {
    if (char === "*") source += ".*";
    else if (char === "?") source += ".";
    else source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

const globCache = new Map<string, RegExp>();
function globMatches(host: string, pattern: string): boolean {
  const key = pattern.toLowerCase();
  let expression = globCache.get(key);
  if (!expression) {
    expression = globToRegExp(key);
    globCache.set(key, expression);
  }
  return expression.test(host);
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Merged policy that the pipeline reads. */
export class Policy {
  packs: string[] = [];
  sourceTypes = new Map<SourceType, SourceTypeRule>();
  domains: DomainRule[] = [];
  pathRules: PathRule[] = [];
  subjects = new Map<string, SubjectRule>();
  trustedRepoOwners: string[] = [];
  claimSignals: ClaimSignal[] = [];
  opinionMarkers: string[] = [];
  unverifiableMarkers: string[] = [];
  proseMarkers: string[] = [];
  /** Headings of the sections that need no external source. */
  noSourceSections: string[] = [];
  livingSourceTypes: SourceType[] = [];
  livingPathMarkers: string[] = [];

  // ---- source classification -------------------------------------------------

  /** Return the source type of a URL. */
  classify(url: string): SourceType {
    const host = hostOf(url);
    const path = pathOf(url);

    let best: { priority: number; length: number; sourceType: SourceType } | null = null;
    for (const rule of this.domains) {
      if (!globMatches(host, rule.pattern)) continue;
      const candidate = {
        priority: rule.priority,
        length: rule.pattern.length,
        sourceType: rule.sourceType,
      };
      if (
        best === null ||
        candidate.priority > best.priority ||
        (candidate.priority === best.priority && candidate.length > best.length)
      ) {
        best = candidate;
      }
    }
    let sourceType: SourceType = best?.sourceType ?? SourceType.GENERAL_WEB;

    for (const rule of this.pathRules) {
      if (!path.includes(rule.contains.toLowerCase())) continue;
      const scope: ReadonlySet<SourceType> =
        rule.appliesTo.length > 0 ? new Set(rule.appliesTo) : OFFICIAL_TYPES;
      if (scope.has(sourceType)) sourceType = rule.sourceType;
      break;
    }
    return sourceType;
  }

  ruleFor(sourceType: SourceType): SourceTypeRule {
    return this.sourceTypes.get(sourceType) ?? DEFAULT_SOURCE_TYPE_RULE;
  }

  weight(sourceType: SourceType): number {
    return this.ruleFor(sourceType).weight;
  }

  minConfidence(sourceType: SourceType): number {
    return this.ruleFor(sourceType).minConfidence;
  }

  isAllowed(sourceType: SourceType): boolean {
    return this.ruleFor(sourceType).allowed;
  }

  isFallbackOnly(sourceType: SourceType): boolean {
    return this.ruleFor(sourceType).fallbackOnly;
  }

  /**
   * Report whether a page states the current state of a product.
   *
   * A living document has no fixed publication date. Documentation, a pricing
   * page, and a changelog all state the state of today, so they can contradict
   * an article of any age. A dated page, such as a blog post, is a snapshot.
   */
  isLivingDocument(url: string, sourceType: SourceType): boolean {
    if (this.livingSourceTypes.includes(sourceType)) return true;
    const path = pathOf(url);
    return this.livingPathMarkers.some((marker) => path.includes(marker));
  }

  // ---- repository rules ------------------------------------------------------

  /**
   * Report whether a code repository URL has a trusted owner.
   *
   * An owner is trusted when the list names it, or when the subject of the claim
   * names the repository. A hand-written allowlist cannot hold every vendor
   * organisation.
   */
  isTrustedRepository(url: string, subject?: string | null): boolean {
    const parts = pathOf(url).split("/").filter(Boolean);
    const owner = parts[0];
    if (!owner) return false;
    if (this.trustedRepoOwners.some((name) => name.toLowerCase() === owner)) return true;
    return this.subjectDomains(subject).some((domain) =>
      domain.toLowerCase().endsWith(`/${owner}`),
    );
  }

  // ---- subject rules ---------------------------------------------------------

  /** Return the subject key that the text names. */
  matchSubject(text: string): string | null {
    const low = text.toLowerCase();
    let best: { length: number; key: string } | null = null;

    for (const [key, rule] of this.subjects) {
      for (const alias of [key, ...rule.aliases]) {
        const expression = new RegExp(
          `(?<![\\w.])${escapeForRegExp(alias.toLowerCase())}(?![\\w])`,
        );
        if (expression.test(low) && (best === null || alias.length > best.length)) {
          best = { length: alias.length, key };
        }
      }
    }
    return best?.key ?? null;
  }

  subjectDomains(subject?: string | null): string[] {
    if (!subject) return [];
    return [...(this.subjects.get(subject)?.domains ?? [])];
  }

  subjectDirectUrls(subject?: string | null): string[] {
    if (!subject) return [];
    return [...(this.subjects.get(subject)?.directUrls ?? [])];
  }

  // ---- claim rules -----------------------------------------------------------

  /** Return every claim signal that the sentence matches. */
  signalsIn(sentence: string): ClaimSignal[] {
    return this.claimSignals.filter((signal) =>
      new RegExp(signal.regex, "i").test(sentence),
    );
  }

  looksLikeOpinion(sentence: string): boolean {
    const low = sentence.toLowerCase();
    return this.opinionMarkers.some((marker) => low.includes(marker.toLowerCase()));
  }

  /**
   * Return the marker that makes a sentence prose, not a fact.
   *
   * A second-person capability sentence, a description of the article's own code
   * example, and an evaluation all need no source.
   */
  isProse(sentence: string): string {
    const low = ` ${fold(sentence)} `;
    return this.proseMarkers.find((marker) => low.includes(` ${fold(marker)} `)) ?? "";
  }

  /**
   * Return the marker that makes a sentence unverifiable.
   *
   * A sentence about the author's own project, own client, own result, or about
   * the article itself has no external source.
   */
  isUnverifiable(sentence: string): string {
    const low = ` ${fold(sentence)} `;
    return this.unverifiableMarkers.find((marker) => low.includes(` ${fold(marker)} `)) ?? "";
  }
}

// ---- loading -----------------------------------------------------------------

interface RawPack {
  name?: string;
  version?: number;
  source_types?: Record<string, Partial<Record<string, unknown>>>;
  domains?: { pattern: string; source_type: SourceType; priority?: number }[];
  path_rules?: { contains: string; source_type: SourceType; applies_to?: SourceType[] }[];
  subjects?: Record<string, { aliases?: string[]; domains?: string[]; direct_urls?: string[] }>;
  trusted_repo_owners?: string[];
  claim_signals?: { name: string; regex: string; kind?: ClaimKind }[];
  opinion_markers?: string[];
  unverifiable_markers?: string[];
  prose_markers?: string[];
  no_source_sections?: string[];
  living_source_types?: SourceType[];
  living_path_markers?: string[];
}

export interface PolicyPack {
  name: string;
  raw: RawPack;
}

/** Read one policy pack file. */
export function loadPack(path: string, fallbackName: string): PolicyPack {
  const raw = (parseYaml(readFileSync(path, "utf-8")) ?? {}) as RawPack;
  return { name: raw.name ?? fallbackName, raw };
}

/** Merge packs into one policy. A later pack wins for the same key. */
export function mergePacks(packs: PolicyPack[]): Policy {
  const policy = new Policy();

  for (const pack of packs) {
    const raw = pack.raw;
    policy.packs.push(pack.name);

    for (const [key, value] of Object.entries(raw.source_types ?? {})) {
      const rule = value as Record<string, unknown>;
      policy.sourceTypes.set(key as SourceType, {
        weight: (rule["weight"] as number) ?? DEFAULT_SOURCE_TYPE_RULE.weight,
        minConfidence:
          (rule["min_confidence"] as number) ?? DEFAULT_SOURCE_TYPE_RULE.minConfidence,
        allowed: (rule["allowed"] as boolean) ?? DEFAULT_SOURCE_TYPE_RULE.allowed,
        fallbackOnly:
          (rule["fallback_only"] as boolean) ?? DEFAULT_SOURCE_TYPE_RULE.fallbackOnly,
      });
    }

    for (const rule of raw.domains ?? []) {
      policy.domains.push({
        pattern: rule.pattern,
        sourceType: rule.source_type,
        priority: rule.priority ?? 0,
      });
    }
    for (const rule of raw.path_rules ?? []) {
      policy.pathRules.push({
        contains: rule.contains,
        sourceType: rule.source_type,
        appliesTo: rule.applies_to ?? [],
      });
    }
    for (const [key, rule] of Object.entries(raw.subjects ?? {})) {
      policy.subjects.set(key, {
        aliases: rule.aliases ?? [],
        domains: rule.domains ?? [],
        directUrls: rule.direct_urls ?? [],
      });
    }
    policy.trustedRepoOwners.push(...(raw.trusted_repo_owners ?? []));
    for (const signal of raw.claim_signals ?? []) {
      policy.claimSignals.push({
        name: signal.name,
        regex: signal.regex,
        kind: signal.kind ?? ClaimKind.OTHER,
      });
    }
    policy.opinionMarkers.push(...(raw.opinion_markers ?? []));
    policy.unverifiableMarkers.push(...(raw.unverifiable_markers ?? []));
    policy.proseMarkers.push(...(raw.prose_markers ?? []));
    policy.noSourceSections.push(...(raw.no_source_sections ?? []));
    policy.livingSourceTypes.push(...(raw.living_source_types ?? []));
    policy.livingPathMarkers.push(...(raw.living_path_markers ?? []));
  }

  policy.trustedRepoOwners = [...new Set(policy.trustedRepoOwners)].sort();
  return policy;
}

const policyCache = new Map<string, Policy>();

/** Load and merge the named policy packs from a directory. */
export function loadPolicy(policyDir: string, names: string[]): Policy {
  const key = `${policyDir}::${names.join(",")}`;
  const cached = policyCache.get(key);
  if (cached) return cached;

  const packs: PolicyPack[] = [];
  const missing: string[] = [];
  for (const name of names) {
    const path = join(policyDir, `${name}.yaml`);
    try {
      packs.push(loadPack(path, name));
    } catch {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Policy pack not found: ${missing.join(", ")} in ${policyDir}`);
  }

  const policy = mergePacks(packs);
  policyCache.set(key, policy);
  return policy;
}
