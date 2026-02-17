// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockGetPosts = vi.fn();
const mockCreatePost = vi.fn();
const mockDeletePost = vi.fn();
const mockAppendPosts = vi.fn();
const mockSetStatus = vi.fn();

vi.mock("../api/postsApi.js", () => ({
  getPosts: (...args) => mockGetPosts(...args),
  createPost: (...args) => mockCreatePost(...args),
  deletePost: (...args) => mockDeletePost(...args),
}));

vi.mock("../ui/renderPosts.js", () => ({
  appendPosts: (...args) => mockAppendPosts(...args),
}));

vi.mock("../ui/renderStatus.js", () => ({
  setStatus: (...args) => mockSetStatus(...args),
}));

vi.mock("../utils/login.js", () => ({
  initAuth: vi.fn(),
  isAdmin: vi.fn(() => false),
}));

const setupDom = () => {
  document.body.innerHTML = `
    <div id="status"></div>
    <a id="admin-link"></a>
    <form id="create-form">
      <input id="title" />
      <textarea id="content"></textarea>
    </form>
    <div id="posts"></div>
    <div id="load-trigger"></div>
  `;
};

const setupBrowserApis = () => {
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  global.IntersectionObserver = MockIntersectionObserver;

  Object.defineProperty(global.navigator, "serviceWorker", {
    value: {
      register: vi.fn().mockResolvedValue({}),
    },
    configurable: true,
  });
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.resetModules();
  mockGetPosts.mockReset();
  mockCreatePost.mockReset();
  mockDeletePost.mockReset();
  mockAppendPosts.mockReset();
  mockSetStatus.mockReset();
  localStorage.clear();
  setupDom();
  setupBrowserApis();
});

describe("offline fallback", () => {
  it("uses cached posts when API is offline", async () => {
    const cachedPosts = [{ id: "1", title: "Cached", content: "Local" }];
    localStorage.setItem("blog_posts_v1", JSON.stringify(cachedPosts));
    mockGetPosts.mockRejectedValue(new Error("offline"));

    await import("../main.js");
    await flush();

    expect(mockSetStatus).toHaveBeenCalledWith(
      "API: Offline. Visar 1 sparade inlagg."
    );
    expect(mockAppendPosts).toHaveBeenCalled();
    expect(mockAppendPosts.mock.calls[0][1]).toEqual(cachedPosts);
  });

  it("shows an error when offline and no cached posts exist", async () => {
    mockGetPosts.mockRejectedValue(new Error("offline"));

    await import("../main.js");
    await flush();

    expect(mockSetStatus).toHaveBeenCalledWith(
      "API: Offline. Inga lokala inlagg hittades."
    );
    expect(mockAppendPosts).not.toHaveBeenCalled();
    expect(document.getElementById("posts").textContent).toContain(
      "Kunde inte ladda inlagg."
    );
  });
});
