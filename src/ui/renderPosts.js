

export function renderPosts(container, posts, onDelete) {
  const isAdminPage = location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html");
  const canDelete = Boolean(onDelete) && isAdminPage;

  container.innerHTML = posts
    .map(
      (post) => `
          <article class="post-card">
            <h3>${escapeHtml(post.title ?? "")}</h3>
            <div class="post-content">${sanitizePostContent(post.content ?? "")}</div>

            ${
              canDelete
                ? `<button class="btn btn--danger" type="button" data-delete="${post.id}">
                     Ta bort
                   </button>`
                : ""
            }
          </article>
        `
    )
    .join("");

  // koppla delete-clicks ENDAST om admin
  if (canDelete) {
    container.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        onDelete(btn.getAttribute("data-delete"));
      });
    });
  }
}

// Allow a small, safe subset of HTML for editor content.
// Needed for responsive images (<picture>/<source>/<img>) and basic formatting.
function sanitizePostContent(html) {
  const input = String(html ?? "");

  // Fast path: no markup
  if (!/[<>]/.test(input)) return escapeHtml(input);

  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, "text/html");
  const root = doc.body.firstElementChild;

  const allowedTags = new Set([
    "PICTURE",
    "SOURCE",
    "IMG",
    "P",
    "BR",
    "STRONG",
    "EM",
    "CODE",
    "A",
    "UL",
    "OL",
    "LI",
    "DIV",
    "SPAN",
  ]);

  const allowedAttrs = {
    IMG: new Set(["src", "srcset", "sizes", "alt", "loading", "decoding", "width", "height"]),
    SOURCE: new Set(["type", "srcset", "sizes"]),
    A: new Set(["href", "target", "rel"]),
    DIV: new Set([]),
    SPAN: new Set([]),
    P: new Set([]),
    CODE: new Set([]),
    STRONG: new Set([]),
    EM: new Set([]),
    UL: new Set([]),
    OL: new Set([]),
    LI: new Set([]),
    PICTURE: new Set([]),
    BR: new Set([]),
  };

  // Walk all elements and remove anything not allowed
  const all = root.querySelectorAll("*");
  for (const el of all) {
    const tag = el.tagName;

    if (!allowedTags.has(tag)) {
      // Replace disallowed element with its text content (escaped)
      const text = doc.createTextNode(el.textContent ?? "");
      el.replaceWith(text);
      continue;
    }

    // Strip disallowed attributes + all event handlers
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();

      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }

      const allowed = allowedAttrs[tag] ?? new Set();
      if (!allowed.has(attr.name)) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Prevent javascript: links
      if (tag === "A" && attr.name === "href") {
        const href = String(attr.value || "");
        if (/^\s*javascript:/i.test(href)) {
          el.removeAttribute("href");
        }
      }
    }

    // For links, enforce safe defaults
    if (tag === "A") {
      el.setAttribute("rel", "noopener noreferrer");
      if (!el.getAttribute("target")) el.setAttribute("target", "_blank");
    }
  }

  return root.innerHTML;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
  ));
}