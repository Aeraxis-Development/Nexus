import { inspectVanityInput, formatVanityCheck } from "../../lib/vanity";

async function fetchInvite(code) {
  return fetch(
    `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`,
    { headers: { Accept: "application/json" } }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { vanity, code: codeBody } = req.body || {};
  const parsed = inspectVanityInput(vanity ?? codeBody);

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    let response = null;
    for (const variant of parsed.variants) {
      response = await fetchInvite(variant);
      if (response.ok || response.status !== 404) break;
    }

    if (response.status === 404) {
      return res.status(200).json(formatVanityCheck(null, parsed.code));
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const message =
        response.status === 429
          ? "Discord rate limited this check. Wait a moment and try again."
          : text || `Discord returned ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const data = await response.json();
    return res.status(200).json(formatVanityCheck(data, parsed.code));
  } catch (error) {
    console.error("Vanity check failed:", error);
    return res.status(500).json({ error: "Failed to check vanity URL." });
  }
}
