import "./styles/main.css";

const postsEl = document.querySelector("#posts");

const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:3000"
    : `http://${location.hostname}:3000`;

async function fetchPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error("Kunde inte hämta inlägg");
  return res.json();
}

function renderAdminPosts(posts) {
  if (!posts.length) {
    postsEl.innerHTML = "<p>Inga inlägg ännu.</p>";
    return;
  }

  postsEl.innerHTML = posts
    .map(
      (post) => `
      <article class="admin-card">
        <h3>${post.title}</h3>
        <p>${post.content}</p>

        <button data-delete="${post.id}" class="btn-secondary">
          Ta bort
        </button>
      </article>
    `
    )
    .join("");

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      await deletePost(id);
      loadPosts();
    });
  });
}
''
async function deletePost(id) {
  await fetch(`${API_BASE}/posts/${id}`, {
    method: "DELETE",
  });
}ß

async function loadPosts() {
  const posts = await fetchPosts();
  renderAdminPosts(posts);
}

loadPosts();