import { isAdmin } from "../utils/login.js";

export function renderPosts(container, posts, onDelete) {
    container.innerHTML = posts
      .map(
        (post) => `
          <article class="post-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
  
            ${
              onDelete
                ? `<button class="btn btn--danger" data-delete="${post.id}">
                     Ta bort
                   </button>`
                : ""
            }
          </article>
        `
      )
      .join("");
  
    // koppla delete-clicks ENDAST om admin
    if (onDelete) {
      container.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", () => {
          onDelete(btn.dataset.delete);
        });
      });
    }
  }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
  ));
}