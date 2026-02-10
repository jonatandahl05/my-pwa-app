import { defineConfig } from "vite";

const LONG_CACHE = "public, max-age=31536000, immutable";
const SHORT_CACHE = "public, max-age=3600";
const NO_CACHE = "no-cache";

const hasExtension = (pathname) => /\.[a-z0-9]+$/i.test(pathname);
const isHtml = (pathname) => pathname === "/" || pathname.endsWith(".html");
const isAssets = (pathname) => pathname.startsWith("/assets/");
const isViteInternal = (pathname) =>
  pathname.startsWith("/@") || pathname.startsWith("/node_modules/");

const setCacheControl = (res, value) => {
  if (!res.getHeader("Cache-Control")) {
    res.setHeader("Cache-Control", value);
  }
};

const applyCacheHeaders = (req, res) => {
  const url = req.url ? req.url.split("?")[0] : "";
  if (!url) return;

  if (isViteInternal(url)) {
    setCacheControl(res, NO_CACHE);
    return;
  }

  if (isHtml(url)) {
    setCacheControl(res, NO_CACHE);
    return;
  }

  if (isAssets(url)) {
    setCacheControl(res, LONG_CACHE);
    return;
  }

  if (hasExtension(url)) {
    setCacheControl(res, SHORT_CACHE);
  }
};

const cacheHeadersPlugin = () => ({
  name: "cache-headers",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      applyCacheHeaders(req, res);
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      applyCacheHeaders(req, res);
      next();
    });
  },
});

export default defineConfig({
  plugins: [cacheHeadersPlugin()],
});
