// Escapar HTML-tecken for att forhindra XSS
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
    );
}

// Tillater en begransad mangd HTML for redaktorinnehall.
// Behovs for responsiva bilder (picture/source/img) och grundlaggande formatering.
function sanitizePostContent(html) {
    const input = String(html ?? "");

    // Snabb vag: ingen markup
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

    // Ga igenom alla element och ta bort det som inte ar tillatet
    const all = root.querySelectorAll("*");
    for (const el of all) {
        const tag = el.tagName;

        if (!allowedTags.has(tag)) {
            // Ersatt otillatet element med dess textinnehall (escapad)
            const text = doc.createTextNode(el.textContent ?? "");
            el.replaceWith(text);
            continue;
        }

        // Ta bort otillatna attribut och alla event handlers
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

            // Forhindra javascript:-lankar
            if (tag === "A" && attr.name === "href") {
                const href = String(attr.value || "");
                if (/^\s*javascript:/i.test(href)) {
                    el.removeAttribute("href");
                }
            }
        }

        // For lankar, anvand sakra standardvarden
        if (tag === "A") {
            el.setAttribute("rel", "noopener noreferrer");
            if (!el.getAttribute("target")) el.setAttribute("target", "_blank");
        }
    }

    return root.innerHTML;
}

// Skapar HTML for en enskild post
function createPostHtml(post, canDelete) {
    return `
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
  `;
}

// Kopplar delete-event listeners till knappar i containern
function attachDeleteListeners(container, onDelete) {
    container.querySelectorAll("[data-delete]").forEach((btn) => {
        // Undvik dubbla listeners vid upprepade anrop
        if (btn.dataset.listenerAttached) return;
        btn.dataset.listenerAttached = "true";

        btn.addEventListener("click", () => {
            onDelete(btn.getAttribute("data-delete"));
        });
    });
}

// Lagger till posts i containern utan att rensa
export function appendPosts(container, posts, onDelete) {
    const isAdminPage =
        location.pathname.endsWith("/admin.html") ||
        location.pathname.endsWith("admin.html");
    const canDelete = Boolean(onDelete) && isAdminPage;

    const html = posts.map((post) => createPostHtml(post, canDelete)).join("");
    container.insertAdjacentHTML("beforeend", html);

    if (canDelete) {
        attachDeleteListeners(container, onDelete);
    }
}

// Rensar containern och renderar alla posts
export function renderPosts(container, posts, onDelete) {
    container.innerHTML = "";
    appendPosts(container, posts, onDelete);
}