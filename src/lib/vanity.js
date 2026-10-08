import { formatInvite, inviteUrl } from "./invites";

/** Discord custom invite links: 2–25 lowercase letters, numbers, or dashes. */
const VANITY_RE = /^[a-z0-9-]{2,25}$/;

/**
 * Terms Discord refuses when saving a custom invite, even if no public invite
 * exists. Saving them shows “invalid characters, too short, or already taken.”
 */
const RESERVED_PARTS = ["discord", "nitro", "clyde", "hypesquad"];

export function vanityUrl(code) {
  return inviteUrl(code);
}

function extractSlug(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = raw.match(
    /(?:discord(?:app)?\.com\/invite\/|discord\.gg\/)([^/?#\s]+)/i
  );
  return match?.[1] || raw;
}

/**
 * Normalize a vanity the way Discord saves it.
 * Returns { code, variants } or { error }.
 * variants lists the lowercase code first, then the typed case when it differs.
 * Invite lookup is case-sensitive for some codes, while custom invites are stored lowercase.
 */
export function inspectVanityInput(value) {
  const slug = extractSlug(value);
  if (!slug) return { error: "Enter a vanity code or discord.gg link." };

  const lowered = slug.toLowerCase();

  if (lowered.length < 2) {
    return { error: "That code is too short. Custom invite links need at least 2 characters." };
  }
  if (lowered.length > 25) {
    return { error: "That code is too long. Custom invite links can be at most 25 characters." };
  }
  if (!VANITY_RE.test(lowered)) {
    return { error: "Custom invite links can only contain letters, numbers, or dashes." };
  }
  if (lowered.startsWith("-") || lowered.endsWith("-")) {
    return { error: "Custom invite links can't start or end with a dash." };
  }

  const variants = [lowered];
  if (slug !== lowered && /^[a-zA-Z0-9-]{2,25}$/.test(slug)) {
    variants.push(slug);
  }
  return { code: lowered, variants };
}

export function parseVanityCode(value) {
  return inspectVanityInput(value).code || null;
}

export function isReservedVanity(code) {
  const normalized = String(code || "").toLowerCase();
  return RESERVED_PARTS.some((part) => normalized.includes(part));
}

/**
 * Interpret a Discord invite response (or 404) as vanity availability.
 * A 404 only means no public invite. Discord can still reject the code on save.
 * @param {object|null} inviteData raw Discord invite JSON, or null if not found
 * @param {string} code normalized vanity code
 */
export function formatVanityCheck(inviteData, code) {
  const normalized = String(code || "").toLowerCase();

  if (!inviteData) {
    if (isReservedVanity(normalized)) {
      return {
        code: normalized,
        url: vanityUrl(normalized),
        available: false,
        status: "reserved",
        isVanity: false,
        invite: null,
      };
    }

    return {
      code: normalized,
      url: vanityUrl(normalized),
      available: false,
      status: "unlisted",
      isVanity: false,
      invite: null,
    };
  }

  const invite = formatInvite(inviteData);
  const guildVanity = invite?.guild?.vanityUrlCode
    ? String(invite.guild.vanityUrlCode).toLowerCase()
    : null;
  const isVanity = guildVanity === normalized;

  return {
    code: (invite.code || normalized).toLowerCase(),
    url: invite.url || vanityUrl(normalized),
    available: false,
    status: "taken",
    isVanity,
    invite,
  };
}
