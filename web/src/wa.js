// Web Awesome: the theme, the native element styles, the layout utilities and the
// components the UI uses. Imported first by app.js and login.js.
//
// Icons come from Font Awesome Free, copied next to the UI at build time
// (vite.config.js), so <wa-icon> never asks the Font Awesome CDN. The default library
// is pointed at them before any component loads.

import "@awesome.me/webawesome/dist/styles/native.css";
import "@awesome.me/webawesome/dist/styles/utilities.css";
import "@awesome.me/webawesome/dist/styles/color/variants.css";
import "@awesome.me/webawesome/dist/styles/themes/awesome.css";
import "./styles/fonts.css";

import { registerIconLibrary } from "@awesome.me/webawesome/dist/components/icon/library.js";

const ICONS = new URL("static/icons/", document.baseURI).toString();
registerIconLibrary("default", {
  resolver: (name) => `${ICONS}${name}.svg`,
  mutator: (svg) => svg.setAttribute("fill", "currentColor"),
});

// Follow the device's light or dark setting, now and when it changes. The class is
// set before first paint by the script in the page's head; this keeps it current.
const dark = matchMedia("(prefers-color-scheme: dark)");
const applyScheme = () => {
  document.documentElement.classList.toggle("wa-dark", dark.matches);
  document.documentElement.classList.toggle("wa-light", !dark.matches);
};
applyScheme();
dark.addEventListener("change", applyScheme);
