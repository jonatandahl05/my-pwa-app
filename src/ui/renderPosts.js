//renderPosts.js
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
            ${isAdmin() ? `<button class="delete" type="button">Ta bort</button>` : ""}
          </div>

          <p>${escapeHtml(post.content ?? "")}</p>

          <!-- KOMMENTARER -->
          <section class="comments" data-post="${post.id}">
            <div class="comments-list"></div>

            <form class="comment-form">
              <input name="text" placeholder="Kommentar" required />
              <button type="submit">Skicka</button>
            </form>
          </section>
        </article>
      `
        )
        .join("");

    // delete post
    container.querySelectorAll(".delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const postEl = e.target.closest(".post");
            onDelete(postEl.dataset.id);
        });
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => (
        { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
    ));
}