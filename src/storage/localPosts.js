console.log("🟢 localPosts-modulen laddades (lazy-loaded)");

const KEY = "blog_posts_v1";

export function loadLocalPosts() {
  try {
    const raw = localStorage.getItem(KEY);
    const posts = raw ? JSON.parse(raw) : [];
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export function saveLocalPosts(posts) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function addLocalPost({ title, content }) {
  const posts = loadLocalPosts();
  const post = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    content,
    createdAt: new Date().toISOString(),
    __local: true,
  };
  const next = [post, ...posts];
  saveLocalPosts(next);
  return post;
}

export function deleteLocalPost(id) {
  const posts = loadLocalPosts();
  const next = posts.filter((p) => String(p.id) !== String(id));
  saveLocalPosts(next);
  return next;
}
