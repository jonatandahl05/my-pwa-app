import { isAdmin } from "../utils/login.js";
console.log("🟢 renderPosts-modulen laddades (lazy-loaded)");


export function renderPosts(container, posts, onDelete) {
  const isAdminPage = location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html");
  const canDelete = Boolean(onDelete) && isAdminPage;

  container.innerHTML = posts
    .map(
      (post) => `
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
  ));
}