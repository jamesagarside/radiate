// Builds the web UI into src/radiate/web, which the server serves and the wheel ships.
// The output is committed, so `pip install` and `radiate serve` need no Node.
//
// The server serves index.html at "/" and everything in src/radiate/web under
// "static/". Every URL stays relative, so the UI also works under Home Assistant
// ingress and from a sub-path on GitHub Pages.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const ICONS = join(here, "node_modules/@fortawesome/fontawesome-free/svgs/solid");

// Every Font Awesome icon the UI names, found in the sources. Icon names are always
// written out in full (`name="house"`, `icon: "house"`, or a house.js
// `tile("house", ...)`) so this finds them all.
function iconNames() {
  const files = [join(here, "index.html"), join(here, "login.html")];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name));
      else if (e.name.endsWith(".js")) files.push(join(dir, e.name));
    }
  };
  walk(join(here, "src"));
  const names = new Set();
  const pattern = /<wa-icon\b[^>]*?\sname="([a-z0-9-]+)"|\bicon: "([a-z0-9-]+)"|\btile\("([a-z0-9-]+)"/g;
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(pattern)) names.add(m[1] ?? m[2] ?? m[3]);
  }
  return [...names].sort();
}

// Ship the icons the UI uses with it, at static/icons/<name>.svg, so <wa-icon> never
// asks the Font Awesome CDN. Font Awesome Free icons are CC BY 4.0; each SVG keeps
// its licence comment.
function selfHostedIcons() {
  const svg = (name) => {
    const path = join(ICONS, `${name}.svg`);
    if (!existsSync(path)) throw new Error(`Font Awesome Free has no solid icon "${name}"`);
    return readFileSync(path);
  };
  return {
    name: "radiate-icons",
    configureServer(server) {
      server.middlewares.use("/static/icons/", (req, res, next) => {
        const name = req.url.replace(/^\//, "").replace(/\.svg.*$/, "");
        if (!/^[a-z0-9-]+$/.test(name)) return next();
        res.setHeader("Content-Type", "image/svg+xml");
        res.end(svg(name));
      });
    },
    generateBundle() {
      for (const name of iconNames()) {
        this.emitFile({ type: "asset", fileName: `icons/${name}.svg`, source: svg(name) });
      }
    },
  };
}

// Web Awesome's "awesome" theme imports its fonts from a font CDN. Radiate runs on a
// LAN and loads nothing from the internet, so drop the import and serve Quicksand
// from @fontsource instead (src/styles/fonts.css).
function noRemoteImports() {
  return {
    name: "radiate-no-remote-imports",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css") || !id.includes("@awesome.me/webawesome")) return null;
      return code.replace(/@import url\(['"]?https?:[^)]*\)\s*;?/g, "");
    },
  };
}

export default defineConfig({
  root: here,
  base: "./",
  publicDir: "public",
  plugins: [noRemoteImports(), selfHostedIcons()],
  build: {
    outDir: resolve(here, "../src/radiate/web"),
    emptyOutDir: true,
    target: "es2022",
    assetsDir: "assets",
    // Fonts stay files, never inlined data URLs, so the CSS stays readable.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { index: resolve(here, "index.html"), login: resolve(here, "login.html") },
      output: {
        // No content hashes: the built files are committed, and stable names keep
        // each rebuild's diff to what changed.
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  experimental: {
    // index.html is served at "/", its assets under "static/".
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === "html") return `static/${filename}`;
      return { relative: true };
    },
  },
  server: {
    // `npm run dev` against a Radiate server on port 8099, or RADIATE_API.
    proxy: { "/api": { target: process.env.RADIATE_API ?? "http://127.0.0.1:8099", ws: true } },
  },
});
