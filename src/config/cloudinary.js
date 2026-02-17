// Cloudinary konfiguration

export const CLOUDINARY_CONFIG = {
    cloudName: "dxrbhsq0v",
    uploadPreset: "blog_uploads",
};

// Bygger URL for en bild med transformationer
export function getCloudinaryUrl(publicId, options = {}) {
    const { width, format = "auto", quality = "auto" } = options;

    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    transformations.push(`f_${format}`);
    transformations.push(`q_${quality}`);

    const transformString = transformations.join(",");

    return `${baseUrl}/${transformString}/${publicId}`;
}

// Bygger srcset for responsiva bilder
export function getResponsiveSrcset(publicId, widths = [320, 640, 960, 1280]) {
    return widths
        .map((w) => `${getCloudinaryUrl(publicId, { width: w })} ${w}w`)
        .join(", ");
}

// Bygger komplett picture HTML
export function buildCloudinaryPictureHTML(publicId) {
    const widths = [320, 640, 960, 1280];
    const sizes = "(max-width: 768px) 100vw, 800px";

    const webpSrcset = widths
        .map((w) => `${getCloudinaryUrl(publicId, { width: w, format: "webp" })} ${w}w`)
        .join(", ");

    const jpgSrcset = widths
        .map((w) => `${getCloudinaryUrl(publicId, { width: w, format: "jpg" })} ${w}w`)
        .join(", ");

    const fallbackSrc = getCloudinaryUrl(publicId, { width: 640, format: "jpg" });

    return `<picture>
  <source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">
  <img
    src="${fallbackSrc}"
    srcset="${jpgSrcset}"
    sizes="${sizes}"
    alt=""
    loading="lazy"
    decoding="async"
  >
</picture>`;
}