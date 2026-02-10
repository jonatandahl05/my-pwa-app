//renderComments.js
import { isAdmin } from "../utils/login.js";

export function renderComments(container, comments, onDelete, onFlag) {
    if (!comments.length) {
        container.innerHTML = "<p class='muted'>Inga kommentarer.</p>";
        return;
    }

    container.innerHTML = comments
        .map(
            (c) => `
        <div class="comment ${c.flagged ? "flagged" : ""}" data-id="${c.id}">
          <p><strong>${c.author}</strong>: ${escapeHtml(c.text)}</p>
          ${
                isAdmin()
                    ? `
                <button class="flag">${c.flagged ? "Avmarkera" : "Markera olämplig"}</button>
                <button class="delete">Ta bort</button>
              `
                    : ""
            }
        </div>
      `
        )
        .join("");

    container.querySelectorAll(".delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".comment").dataset.id;
            onDelete(id);
        });
    });

    container.querySelectorAll(".flag").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const el = e.target.closest(".comment");
            onFlag(el.dataset.id, !el.classList.contains("flagged"));
        });
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => (
        { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
    ));
}