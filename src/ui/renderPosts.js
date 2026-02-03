import { isAdmin } from "../utils/login.js";

export function renderPosts(container, posts, onDelete) {
    if (!posts?.length) {
        container.innerHTML = "<p>Inga inlägg att visa.</p>";
        return;
    }

    container.innerHTML = posts
    .map(
      (post) => `
        <article class="post" data-id="${post.id}">
          <div class="row">
            <h3>${escapeHtml(post.title)}</h3>
            ${isAdmin() ? `<button class="delete">Ta bort</button>` : ""}
          </div>
          <p>${escapeHtml(post.content ?? "")}</p>
        </article>
      `
    )
    .join("");

  // koppla delete events
  container.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const postEl = e.target.closest(".post");
      const id = Number(postEl.dataset.id);
      onDelete(id);
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
  ));
}