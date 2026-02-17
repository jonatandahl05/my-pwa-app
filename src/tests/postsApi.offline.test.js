// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocka window innan import
global.window = {
    location: {
        hostname: "localhost"
    }
}

// Mocka apiFetch
vi.mock("../utils/apiFetch.js", () => ({
    apiFetch: vi.fn()
}))

import { apiFetch } from "../utils/apiFetch.js"
import { getPosts, createPost, deletePost } from "../api/postsApi.js"

beforeEach(() => {
    vi.clearAllMocks()
    global.navigator = { onLine: false }   // ⭐ Simulera offline-läge
})

describe("Offline-läge för API", () => {

    it("getPosts() ska kasta fel när offline", async () => {
        apiFetch.mockRejectedValue(new Error("Network error"))

        await expect(getPosts()).rejects.toThrow("Network error")
    })

    it("createPost() ska kasta fel när offline", async () => {
        apiFetch.mockRejectedValue(new Error("Network error"))

        await expect(createPost({ title: "Hej" }))
            .rejects.toThrow("Network error")
    })

    it("deletePost() ska kasta fel när offline", async () => {
        apiFetch.mockRejectedValue(new Error("Network error"))

        await expect(deletePost("123"))
            .rejects.toThrow("Network error")
    })

})
