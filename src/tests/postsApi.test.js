// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiFetch = vi.fn();

vi.mock("../utils/apiFetch.js", () => ({
  apiFetch: (...args) => mockApiFetch(...args),
}));

beforeEach(() => {
  mockApiFetch.mockReset();
  Object.defineProperty(globalThis, "window", {
    value: { location: { hostname: "api.test" } },
    configurable: true,
  });
  globalThis.location = globalThis.window.location;
  vi.resetModules();
});

describe("postsApi", () => {
  it("uses apiFetch for getPosts", async () => {
    mockApiFetch.mockResolvedValue([]);
    const { getPosts } = await import("../api/postsApi.js");

    await getPosts();

    expect(mockApiFetch).toHaveBeenCalledWith("http://api.test:3000/posts");
  });

  it("uses apiFetch for createPost with JSON body", async () => {
    mockApiFetch.mockResolvedValue({ id: "1" });
    const { createPost } = await import("../api/postsApi.js");
    const payload = { title: "Title", content: "Body" };

    await createPost(payload);

    expect(mockApiFetch).toHaveBeenCalledWith("http://api.test:3000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("uses apiFetch for deletePost", async () => {
    mockApiFetch.mockResolvedValue(null);
    const { deletePost } = await import("../api/postsApi.js");

    await deletePost("123");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "http://api.test:3000/posts/123",
      {
        method: "DELETE",
      }
    );
  });
});
