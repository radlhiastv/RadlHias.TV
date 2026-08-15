// Postet einen Blogartikel direkt auf die Facebook-Unternehmensseite, ueber
// die Facebook Graph API (POST /{page-id}/feed). Ausgeloest wird das per
// Button im Admin-Panel (admin-blog.html) -- nie automatisch.
//
// Benoetigt zwei Werte, die einmalig manuell besorgt werden muessen (siehe
// worker/SETUP.md):
//   - FB_PAGE_ID              (wrangler.toml [vars], unkritisch)
//   - FB_PAGE_ACCESS_TOKEN    (wrangler secret, langlebiges Page-Access-Token)

const GRAPH_API_VERSION = "v21.0";

export async function postToFacebookPage(env, { message, link }) {
  const pageId = env.FB_PAGE_ID;
  const token = env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    throw new Error(
      "Facebook-Anbindung ist noch nicht eingerichtet (FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN fehlen). Siehe worker/SETUP.md."
    );
  }

  const params = new URLSearchParams({ message: message || "", link: link || "", access_token: token });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error && data.error.message ? data.error.message : `Facebook-API-Fehler (${res.status}).`;
    throw new Error(msg);
  }

  // data.id hat bei Page-Posts das Format "{page-id}_{post-id}" -- daraus
  // laesst sich eine gueltige Permalink-URL zusammenbauen.
  return { id: data.id, url: data.id ? `https://www.facebook.com/${data.id}` : null };
}
