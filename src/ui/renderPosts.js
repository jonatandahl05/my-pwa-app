// Escapar HTML-tecken for att forhindra XSS
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
    );
}


export function renderPosts(container, posts, onDelete) {
  const isAdminPage = location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html");
  const canDelete = Boolean(onDelete) && isAdminPage;

  container.innerHTML = posts
    .map(
      (post) => `
          <article class="post-card">
            <h3>${escapeHtml(post.title ?? "")}</h3>
            <div class="post-content">${sanitizePostContent(post.content ?? "")}</div>

// Skapar HTML for en enskild post
function createPostHtml(post, canDelete) {
    return `
    <article class="post-card">
      <h3>${escapeHtml(post.title ?? "")}</h3>
      <p>${escapeHtml(post.content ?? "")}</p>
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