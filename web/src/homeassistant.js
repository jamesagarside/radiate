// Home Assistant section of the Settings view (#settings/home-assistant): the Lovelace
// dashboard for this house, from GET /api/v1/ha/dashboard, to copy or download, with
// the steps to add it and whether the Radiate integration is reporting.
//
// The server builds the dashboard (radiate.export.dashboard), the same one
// `radiate dashboard` writes, so someone running the Home Assistant App, who has no
// command line, can still get it. Every role may read it; the section shows once the
// server answers.

const $ = (id) => document.getElementById(id);
const FILE = "heating-dashboard.yaml";

const time = (iso, timeZone) => {
  const opts = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false };
  if (timeZone) opts.timeZone = timeZone;
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso));
};

// The line about the integration: reporting, gone quiet, or never heard from.
export function integrationText(integration, timeZone) {
  if (!integration?.reported_at) {
    return ["The Radiate integration hasn't reported to this server yet. Add it from HACS to get room thermostats, the heating mode and hot water in Home Assistant, then generate the dashboard.", "warning"];
  }
  const at = time(integration.reported_at, timeZone);
  if (integration.reporting) return [`The Radiate integration is connected. It last reported at ${at}.`, "success"];
  return [`The Radiate integration last reported at ${at}, so it may have stopped. Check that Home Assistant is running and the integration is loaded.`, "warning"];
}

// The line under the buttons: what the dashboard holds.
export function summaryText(view) {
  const lines = view.yaml.trimEnd().split("\n").length;
  const rooms = `${view.rooms} ${view.rooms === 1 ? "room" : "rooms"}`;
  const people = view.people ? `, ${view.people} ${view.people === 1 ? "person" : "people"}` : "";
  const source = view.radiate ? "with the Radiate integration" : "with Zigbee2MQTT's entities only";
  return `Three views (Overview, Rooms and Analysis) for ${rooms}${people}, ${source}. ${lines} lines.`;
}

export function createHomeAssistant({ transport, isAuthError, onAuth }) {
  let offered = false;
  let view = null;
  let loading = null;

  const query = () => {
    const p = new URLSearchParams({ hours: $("ha-hours").value, radiate: $("ha-radiate").checked ? "true" : "false" });
    return `ha/dashboard?${p}`;
  };

  function render() {
    if (!view) return;
    const [text, variant] = integrationText(view.integration);
    const callout = $("ha-integration");
    callout.hidden = !view.radiate;
    callout.setAttribute("variant", variant);
    $("ha-integration-text").textContent = text;
    $("ha-summary").textContent = summaryText(view);
    $("ha-preview").textContent = view.yaml;
    $("ha-error").hidden = true;
  }

  async function load() {
    const mine = transport.get(query());
    loading = mine;
    try {
      const v = await mine;
      if (loading !== mine) return true; // a newer choice is on its way
      view = v;
      render();
      return true;
    } catch (err) {
      if (isAuthError(err)) { onAuth(); return false; }
      if (loading === mine) $("ha-error").hidden = !offered;
      return false;
    }
  }

  async function copy() {
    if (!view) return;
    const button = $("ha-copy");
    try {
      await navigator.clipboard.writeText(view.yaml);
      $("ha-summary").textContent = "Copied. Paste it into the raw configuration editor in Home Assistant.";
    } catch {
      // Clipboard access can be refused, for example over plain HTTP: select the text
      // so the reader can copy it themselves.
      $("ha-preview-box").open = true;
      const range = document.createRange();
      range.selectNodeContents($("ha-preview"));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      $("ha-preview").focus();
      $("ha-summary").textContent = "Couldn't copy here. The dashboard is selected: copy it with your keyboard.";
    }
    button.focus();
  }

  function download() {
    if (!view) return;
    const url = URL.createObjectURL(new Blob([view.yaml], { type: "text/yaml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  $("ha-hours").addEventListener("change", load);
  $("ha-radiate").addEventListener("change", load);
  $("ha-copy").addEventListener("click", copy);
  $("ha-download").addEventListener("click", download);

  return {
    async available() {
      offered = await load();
      $("s-home-assistant").hidden = !offered;
      return offered;
    },
    get offered() {
      return offered;
    },
    show() {
      if (offered) load();
    },
    hide() {},
  };
}
