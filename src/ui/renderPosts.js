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
            <button class="delete" type="button">Ta bort</button>
          </div>
          <p>${escapeHtml(post.content ?? "")}</p>
          <div class="comments">
            <h4>Comments</h4>
            <ul class="comment-list">
              ${renderComments(post.comments)}
            </ul>
            <form class="comment-form" data-post-id="${post.id}">
              <input name="author" placeholder="Name" />
              <input name="text" placeholder="Write a comment..." required />
              <button type="submit">Add comment</button>
            </form>
          </div>
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

function renderComments(comments) {
  if (!comments?.length) {
    return "<li>No comments yet.</li>";
  }
  return comments
    .map(
      (comment) =>
        `<li><strong>${escapeHtml(comment.author ?? "Anon")}</strong>: ${escapeHtml(comment.text ?? "")}</li>`
    )
    .join("");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]
  ));
}
