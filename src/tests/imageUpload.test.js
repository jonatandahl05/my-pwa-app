// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/cloudinary.js', () => ({
    CLOUDINARY_CONFIG: {
        cloudName: 'test-cloud',
        uploadPreset: 'test-preset',
    },
    buildCloudinaryPictureHTML: vi.fn((publicId) => `<picture>${publicId}</picture>`),
}));

import { uploadImage, uploadAndGetPictureHTML } from '../api/imageUpload.js';
import { buildCloudinaryPictureHTML } from '../config/cloudinary.js';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('uploadImage', () => {

    it('ska skicka POST till rätt Cloudinary URL', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    public_id: 'abc123',
                    secure_url: 'https://res.cloudinary.com/test/image/abc123.jpg',
                    width: 800,
                    height: 600,
                }),
            })
        );

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
        await uploadImage(file);

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
            expect.objectContaining({
                method: 'POST',
            })
        );
    });

    it('ska skicka fil och upload_preset i FormData', async () => {
        let capturedBody;
        global.fetch = vi.fn((url, options) => {
            capturedBody = options.body;
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    public_id: 'abc123',
                    secure_url: 'https://example.com/img.jpg',
                    width: 800,
                    height: 600,
                }),
            });
        });

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
        await uploadImage(file);

        expect(capturedBody).toBeInstanceOf(FormData);
        expect(capturedBody.get('file')).toBe(file);
        expect(capturedBody.get('upload_preset')).toBe('test-preset');
    });

    it('ska returnera objekt med publicId, url, width, height', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    public_id: 'my-image-id',
                    secure_url: 'https://res.cloudinary.com/test/image/my-image-id.jpg',
                    width: 1920,
                    height: 1080,
                }),
            })
        );

        const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
        const result = await uploadImage(file);

        expect(result.publicId).toBe('my-image-id');
        expect(result.url).toBe('https://res.cloudinary.com/test/image/my-image-id.jpg');
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
    });

    it('ska kasta fel vid misslyckat svar', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'bad request' }),
            })
        );

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

        await expect(uploadImage(file)).rejects.toThrow('Bilduppladdning misslyckades');
    });

    it('ska kasta fel även om error-json inte kan parsas', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.reject(new Error('parse error')),
            })
        );

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

        await expect(uploadImage(file)).rejects.toThrow('Bilduppladdning misslyckades');
    });

    it('ska kasta fel vid nätverksfel', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

        await expect(uploadImage(file)).rejects.toThrow('Network error');
    });
});

describe('uploadAndGetPictureHTML', () => {

    it('ska returnera picture HTML baserat på publicId', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    public_id: 'uploaded-id',
                    secure_url: 'https://example.com/img.jpg',
                    width: 800,
                    height: 600,
                }),
            })
        );

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
        const html = await uploadAndGetPictureHTML(file);

        expect(buildCloudinaryPictureHTML).toHaveBeenCalledWith('uploaded-id');
        expect(html).toBe('<picture>uploaded-id</picture>');
    });

    it('ska kasta fel om uppladdning misslyckas', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({}),
            })
        );

        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

        await expect(uploadAndGetPictureHTML(file)).rejects.toThrow('Bilduppladdning misslyckades');
    });
});