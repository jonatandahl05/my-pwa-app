import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "../utils/apiFetch.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("returns parsed JSON on success", async () => {
    const payload = { ok: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await apiFetch("http://example.test/posts");
    expect(result).toEqual(payload);
  });

  it("returns null for 204 responses", async () => {
    const jsonSpy = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
      json: jsonSpy,
    });

    const result = await apiFetch("http://example.test/posts/1", {
      method: "DELETE",
    });
    expect(result).toBeNull();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("throws a detailed error on non-ok responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: vi.fn().mockResolvedValue("Boom"),
    });

    await expect(apiFetch("http://example.test/posts")).rejects.toThrow(
      "Fetch failed: 500 Server Error Boom"
    );
  });

  it("propagates network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network down"));

    await expect(apiFetch("http://example.test/posts")).rejects.toThrow(
      "Network down"
    );
  });
});
