// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { appendPosts } from "../ui/renderPosts.js";

beforeEach(() => {
  document.body.innerHTML = '<div id="posts"></div>';
});

describe("renderPosts sanitization", () => {
  it("strips unsafe tags while keeping allowed content", () => {
    const container = document.getElementById("posts");
    const posts = [
      {
        id: "1",
        title: "Safe",
        content: "<script>alert(1)</script><p>OK</p>",
      },
    ];

    appendPosts(container, posts);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("p").textContent).toBe("OK");
  });

  it("removes event handler attributes", () => {
    const container = document.getElementById("posts");
    const posts = [
      {
        id: "1",
        title: "Image",
        content: '<img src="x" onerror="alert(1)" alt="x">',
      },
    ];

    appendPosts(container, posts);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("onerror")).toBeNull();
  });

  it("removes javascript: links and enforces safe link defaults", () => {
    const container = document.getElementById("posts");
    const posts = [
      {
        id: "1",
        title: "Link",
        content: '<a href="javascript:alert(1)">bad</a>',
      },
    ];

    appendPosts(container, posts);

    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBeNull();
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});
