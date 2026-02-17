// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest"

// ⭐ Mocka Cloudinary-config och HTML-builder
vi.mock("../config/cloudinary.js", () => ({
    CLOUDINARY_CONFIG: {
        cloudName: "demo-cloud",
        uploadPreset: "demo-preset"
    },
    buildCloudinaryPictureHTML: vi.fn((id) => `<picture>${id}</picture>`)
}))

// ⭐ Mocka fetch innan import av imageUpload.js
global.fetch = vi.fn()

import { uploadImage, uploadAndGetPictureHTML } from "../api/imageUpload.js"
import { CLOUDINARY_CONFIG, buildCloudinaryPictureHTML } from "../config/cloudinary.js"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("uploadImage()", () => {

    it("ska skicka korrekt FormData till Cloudinary", async () => {
        const mockFile = new Blob(["fake image"], { type: "image/png" })

        // Mocka lyckad fetch
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                public_id: "abc123",
                secure_url: "https://cloudinary.com/abc123.png",
                width: 800,
                height: 600
            })
        })

        const result = await uploadImage(mockFile)

        // Kontrollera fetch-anropet
        expect(fetch).toHaveBeenCalled()

        const [url, options] = fetch.mock.calls[0]

        // Rätt URL
        expect(url).toBe(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`
        )

        // Rätt metod
        expect(options.method).toBe("POST")

        // FormData innehåll
        const body = options.body
        expect(body instanceof FormData).toBe(true)
        expect(body.get("upload_preset")).toBe("demo-preset")

        // ⭐ jsdom gör Blob → File, så vi testar innehåll istället för identitet
        const uploadedFile = body.get("file")
        expect(uploadedFile).toBeInstanceOf(File)
        expect(uploadedFile.type).toBe("image/png")
        expect(await uploadedFile.text()).toBe(await mockFile.text())

        // Rätt returdata
        expect(result.publicId).toBe("abc123")
        expect(result.url).toBe("https://cloudinary.com/abc123.png")
        expect(result.width).toBe(800)
        expect(result.height).toBe(600)
    })

    it("ska kasta fel om Cloudinary svarar med error", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: "Upload failed" })
        })

        const mockFile = new Blob(["fake"], { type: "image/png" })

        await expect(uploadImage(mockFile))
            .rejects
            .toThrow("Bilduppladdning misslyckades")
    })

})

describe("uploadAndGetPictureHTML()", () => {

    it("ska ladda upp bild och returnera HTML från buildCloudinaryPictureHTML", async () => {
        const mockFile = new Blob(["fake"], { type: "image/png" })

        // Mocka uploadImage → fetch
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                public_id: "xyz789",
                secure_url: "https://cloudinary.com/xyz789.png",
                width: 500,
                height: 400
            })
        })

        const html = await uploadAndGetPictureHTML(mockFile)

        expect(buildCloudinaryPictureHTML).toHaveBeenCalledWith("xyz789")
        expect(html).toBe("<picture>xyz789</picture>")
    })

})
