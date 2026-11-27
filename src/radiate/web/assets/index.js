import{i as Ve,e as Tr,a as Rr,A as ke,t as Lr,E as Mr,_ as y,b as Ee,n as H,c as Ye,W as st,H as Dn,l as Or,o as kt,d as G,w as wt,L as Et,f as $t,s as qn,g as Ya,h as In,r as Zt,j as $n,v as Ga,M as Ki,D as Mt}from"./app.js";const Ji="modulepreload",Yi=function(e,t){return new URL(e,t).href},hs={},Gi=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let r=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const i=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),l=c?.nonce||c?.getAttribute("nonce");a=r(n.map(d=>{if(d=Yi(d,o),d in hs)return;hs[d]=!0;const u=d.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(!!o)for(let x=i.length-1;x>=0;x--){const h=i[x];if(h.href===d&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${g}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":Ji,u||(f.as="script"),f.crossOrigin="",f.href=d,l&&f.setAttribute("nonce",l),document.head.appendChild(f),u)return new Promise((x,h)=>{f.addEventListener("load",x),f.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return a.then(r=>{for(const i of r||[])i.status==="rejected"&&s(i.reason);return t().catch(s)})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xi=(e="768px")=>`
  @media screen and (width < ${e}) {
    [part~='navigation'] {
      display: none;
    }

    :host(:not([disable-navigation-toggle])) slot[name~='navigation-toggle'] {
      display: contents;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qi=Ve`
  :host {
    display: block;
    background-color: var(--wa-color-surface-default);
    box-sizing: border-box;
    min-height: 100%;
    --menu-width: auto;
    --main-width: 1fr;
    --aside-width: auto;
    --banner-height: 0px;
    --header-height: 0px;
    --subheader-height: 0px;
    --scroll-margin-top: calc(var(--header-height, 0px) + var(--subheader-height, 0px) + 0.5em);

    --banner-top: var(--banner-height);
    --header-top: var(--header-height);
    --subheader-top: var(--subheader-height);
  }

  slot[name]:not([name='skip-to-content'], [name='navigation-toggle'])::slotted(*) {
    display: flex;
  }

  ::slotted([slot='banner']) {
    align-items: center;
    justify-content: center;
    gap: var(--wa-space-m);
    padding: var(--wa-space-xs) var(--wa-space-m);
  }

  ::slotted([slot='header']) {
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--wa-space-m);
    padding: var(--wa-space-m);
    flex: auto;
  }

  ::slotted([slot='subheader']) {
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--wa-space-m);
    padding: var(--wa-space-xs) var(--wa-space-m);
  }

  ::slotted([slot*='navigation']),
  ::slotted([slot='menu']),
  ::slotted([slot='aside']) {
    flex-direction: column;
    gap: var(--wa-space-m);
    padding: var(--wa-space-m);
  }

  ::slotted([slot='main-header']) {
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--wa-space-m);
    padding: var(--wa-space-m) var(--wa-space-3xl);
  }

  slot:not([name]) {
    /* See #331 */
    &::slotted(main),
    &::slotted(section) {
      padding: var(--wa-space-3xl);
    }
  }

  ::slotted([slot='main-footer']),
  ::slotted([slot='footer']) {
    align-items: start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--wa-space-m);
    padding: var(--wa-space-3xl);
  }

  :host([disable-sticky~='banner']) {
    --banner-top: 0px;
  }
  :host([disable-sticky~='header']) {
    --header-top: 0px;
  }
  :host([disable-sticky~='subheader']) {
    --subheader-top: 0px;
  }

  /* Nothing else depends on subheader-height. */
  :host([disable-sticky~='subheader']) {
  }
  :host([disable-sticky~='aside']) [part~='aside'],
  :host([disable-sticky~='menu']) [part~='menu'] {
    height: unset;
    max-height: unset;
  }

  :host([disable-sticky~='banner']) [part~='banner'],
  :host([disable-sticky~='header']) [part~='header'],
  :host([disable-sticky~='subheader']) [part~='subheader'],
  :host([disable-sticky~='aside']) [part~='aside'],
  :host([disable-sticky~='menu']) [part~='menu'] {
    position: static;
    overflow: unset;
    z-index: unset;
  }

  :host([disable-sticky~='aside']) [part~='aside'],
  :host([disable-sticky~='menu']) [part~='menu'] {
    height: auto;
    max-height: auto;
  }

  [part~='base'] {
    min-height: 100dvh;
    display: grid;
    grid-template-rows: repeat(3, minmax(0, auto)) minmax(0, 1fr) minmax(0, auto);
    grid-template-columns: 100%;
    width: 100%;
    grid-template-areas:
      'banner'
      'header'
      'subheader'
      'body'
      'footer';
  }

  /* Grid areas */
  [part~='banner'] {
    grid-area: banner;
  }
  [part~='header'] {
    grid-area: header;
  }
  [part~='subheader'] {
    grid-area: subheader;
  }
  [part~='menu'] {
    grid-area: menu;
  }
  [part~='body'] {
    grid-area: body;
  }
  [part~='main'] {
    grid-area: main;
  }
  [part~='aside'] {
    grid-area: aside;
  }
  [part~='footer'] {
    grid-area: footer;
  }

  /* Sticky regions paint their own surface so content scrolls under them. Slotted content stays
     transparent so ::part() backgrounds set by consumers show through. */
  [part~='banner'],
  [part~='header'],
  [part~='subheader'] {
    position: sticky;
    z-index: 5;
    background-color: var(--wa-color-surface-default);
  }
  [part~='banner'] {
    top: 0px;
  }
  [part~='header'] {
    top: var(--banner-top);

    /** Make the header flex so that you don't unexpectedly have the default toggle button appearing above a slotted div because block elements are fun. */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  [part~='subheader'] {
    top: calc(var(--header-top) + var(--banner-top));
  }
  [part~='body'] {
    display: grid;
    min-height: 100%;
    align-items: start;
    grid-template-columns: minmax(0, var(--menu-width)) minmax(0, var(--main-width)) minmax(0, var(--aside-width));
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'menu main aside';
  }
  [part~='main'] {
    display: grid;
    min-height: 100%;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
    grid-template-areas:
      'main-header'
      'main-content'
      'main-footer';
  }
  [part~='main-header'] {
    grid-area: main-header;
  }
  [part~='main-content'] {
    grid-area: main-content;
  }
  [part~='main-footer'] {
    grid-area: main-footer;
  }

  .skip-to-content {
    position: absolute;
    top: var(--wa-space-m);
    left: var(--wa-space-m);
    z-index: 6;
    border-radius: var(--wa-corners-1x);
    background-color: var(--wa-color-surface-default);
    color: var(--wa-color-text-link);
    text-decoration: none;
    padding: var(--wa-space-s) var(--wa-space-m);
    box-shadow: var(--wa-shadow-l);
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  [part~='menu'],
  [part~='aside'] {
    position: sticky;
    top: calc(var(--banner-top) + var(--header-top) + var(--subheader-top));
    z-index: 4;
    min-height: 0;
    /** Allows the menu / aside to always be 100% of the height of the main content area */
    align-self: stretch;
    max-height: calc(100dvh - var(--header-top) - var(--banner-top) - var(--subheader-top));
    overflow: auto;
  }

  [part~='navigation'] {
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
  }

  [part~='drawer']::part(dialog) {
    background-color: var(--wa-color-surface-default);
  }

  /* Set these on the slot because we don't always control the navigation-toggle since that may be slotted. */
  slot[name~='navigation-toggle'],
  :host([disable-navigation-toggle]) slot[name~='navigation-toggle'] {
    display: none;
  }

  /* Sometimes the media query in the viewport is stubborn in iframes. This is an extra check to make it behave properly. */
  :host(:not([disable-navigation-toggle])[view='mobile']) slot[name~='navigation-toggle'] {
    display: contents;
  }

  [part~='navigation-toggle'] {
    /* Use only a margin-inline-start because the slotted header is expected to have default padding
        so it looks really awkward if this sets a margin-inline-end and the slotted header has a padding-inline-start. */
    margin-inline-start: var(--wa-space-m);
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Zi=Ve`
  .wa-visually-hidden:not(:focus-within),
  .wa-visually-hidden-force,
  .wa-visually-hidden-hint::part(hint),
  .wa-visually-hidden-label::part(label),
  .wa-visually-hidden-label::part(form-control-label) {
    top: 0px !important;
    left: 0px !important;
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    clip: rect(0 0 0 0) !important;
    clip-path: inset(50%) !important;
    border: none !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }
`;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function el(e){return(t,n)=>{const o=typeof t=="function"?t:t[n];Object.assign(o,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Sa=class extends Rr{constructor(t){if(super(t),this.it=ke,t.type!==Lr.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===ke||t==null)return this._t=void 0,this.it=t;if(t===Mr)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}};Sa.directiveName="unsafeHTML",Sa.resultType=1;const tl=Tr(Sa);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function _n(e,t,n){return e?t(e):n?.(e)}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function nl(e,t=document.documentElement){if(!Number.isNaN(Number(e)))return Number(e);if(!window.CSS||!CSS.registerProperty)return typeof e=="string"&&e.endsWith("px")?parseFloat(e):Number(e)||0;const n="--wa-length-resolver";if(!CSS.registerProperty.toString().includes(n))try{CSS.registerProperty({name:n,syntax:"<length>",inherits:!1,initialValue:"0px"})}catch{}const o=t.style.getPropertyValue(n);t.style.setProperty(n,e);const a=getComputedStyle(t)?.getPropertyValue(n);return t.style.setProperty(n,o),a?.endsWith("px")?parseFloat(a):Number(a)||0}function ol(e){return Number.isNaN(Number(e))?e:`${e}px`}var je=class extends st{constructor(){super(),this.hasSlotController=new Dn(this,"navigation-footer","mobile-navigation-footer"),this.headerResizeObserver=this.slotResizeObserver("header"),this.subheaderResizeObserver=this.slotResizeObserver("subheader"),this.bannerResizeObserver=this.slotResizeObserver("banner"),this.footerResizeObserver=this.slotResizeObserver("footer"),this.hasExplicitNavigationToggleSetting=!1,this.handleNavigationToggle=e=>{if(this.view==="desktop"){this.hideNavigation();return}const t=e.composedPath(),n=this.navigationToggleSlot;t.find(o=>o.hasAttribute?.("data-toggle-nav")||o.assignedSlot===n||o===n)&&(e.preventDefault(),this.toggleNavigation())},this.view="desktop",this.navOpen=!1,this.mobileBreakpoint="768px",this.navigationPlacement="start",this.disableNavigationToggle=!1,this.pageResizeObserver=typeof ResizeObserver<"u"?new ResizeObserver(e=>{requestAnimationFrame(()=>{for(const t of e)if(t.contentBoxSize){const o=t.borderBoxSize[0].inlineSize,a=this.view;o>=nl(this.mobileBreakpoint)?this.view="desktop":this.view="mobile",this.requestUpdate("view",a)}})}):null,this.updateNavigationToggleState=e=>{if(e){const o=e.target.name;if(!["navigation","navigation-header","navigation-footer"].includes(o))return}if(this.hasExplicitNavigationToggleSetting)return;const t=!!this.querySelector(":not([slot='navigation-toggle']) [data-toggle-nav]"),n=!!this.querySelector('[slot="navigation"]')||!!this.querySelector('[slot="navigation-header"]')||!!this.querySelector('[slot="navigation-footer"]');this.disableNavigationToggle=t||!n},this.addEventListener("click",this.handleNavigationToggle)}slotResizeObserver(e){return new ResizeObserver(t=>{requestAnimationFrame(()=>{for(const n of t)if(n.contentBoxSize){const o=n.borderBoxSize[0];this.style.setProperty(`--${e}-height`,`${Math.round(o.blockSize)}px`)}})})}updated(e){e.has("view")&&this.hideNavigation(),super.updated(e)}connectedCallback(){super.connectedCallback(),setTimeout(()=>{requestAnimationFrame(()=>{this.pageResizeObserver?.observe(this),this.headerResizeObserver?.observe(this.header),this.subheaderResizeObserver?.observe(this.subheader),this.bannerResizeObserver?.observe(this.banner),this.footerResizeObserver?.observe(this.footer)})})}visiblePixelsInViewport(e){if(!e)return null;const t=e.clientHeight,n=window.innerHeight,o=e.getBoundingClientRect?.();if(!o)return null;const{top:a,bottom:s}=o;return Math.max(0,a>0?Math.min(t,n-a):Math.min(s,n))}firstUpdated(e){if(!document.getElementById("main-content")){const t=document.createElement("div");t.id="main-content",t.slot="skip-to-content-target",this.prepend(t)}this.hasExplicitNavigationToggleSetting=this.disableNavigationToggle,this.shadowRoot.addEventListener("slotchange",this.updateNavigationToggleState),this.updateNavigationToggleState(),super.firstUpdated(e)}disconnectedCallback(){super.disconnectedCallback(),this.pageResizeObserver?.unobserve(this),this.headerResizeObserver?.unobserve(this.header),this.subheaderResizeObserver?.unobserve(this.subheader),this.footerResizeObserver?.unobserve(this.footer),this.bannerResizeObserver?.unobserve(this.banner)}showNavigation(){this.navOpen=!0}hideNavigation(){this.navOpen=!1}toggleNavigation(){this.navOpen=!this.navOpen}render(){const e=this.view==="mobile"&&(this.hasSlotController.test("navigation-footer")||this.hasSlotController.test("mobile-navigation-footer"));let t=this.nonce||globalThis.litNonce||null;return G`
      <a href="#main-content" part="skip-to-content" class="wa-visually-hidden">
        <slot name="skip-to-content">Skip to content</slot>
      </a>

      <!-- unsafeHTML needed for SSR until this is solved: https://github.com/lit/lit/issues/4696 -->
      ${tl(`
        <style
          ${t?`nonce="${t}"`:""}
          id="mobile-styles"
        >
          ${Xi(ol(this.mobileBreakpoint))}
        </style>
      `)}

      <div class="base" part="base page">
        <div class="banner" part="banner">
          <slot name="banner"></slot>
        </div>
        <div class="header" part="header">
          <slot name="navigation-toggle">
            <wa-button part="navigation-toggle" size="s" appearance="plain" variant="neutral">
              <slot name="navigation-toggle-icon">
                <wa-icon
                  library="system"
                  name="bars"
                  part="navigation-toggle-icon"
                  label="Toggle navigation drawer"
                ></wa-icon>
              </slot>
            </wa-button>
          </slot>
          <slot name="header"></slot>
        </div>
        <div class="subheader" part="subheader">
          <slot name="subheader"></slot>
        </div>
        <div class="body" part="body">
          <div class="menu" part="menu">
            <slot name="menu">
              <nav name="navigation" class="navigation" part="navigation navigation-desktop">
                <!-- Add fallback divs so that CSS grid works properly. -->
                <slot name="desktop-navigation-header">
                  ${_n(this.view==="desktop",()=>G`<slot name="navigation-header"><div></div></slot>`,()=>G`<div></div>`)}
                </slot>
                <slot name="desktop-navigation">
                  ${_n(this.view==="desktop",()=>G`<slot name="navigation"><div></div></slot>`,()=>G`<div></div>`)}
                </slot>
                <slot name="desktop-navigation-footer">
                  ${_n(this.view==="desktop",()=>G`<slot name="navigation-footer"><div></div></slot>`,()=>G`<div></div>`)}
                </slot>
              </nav>
            </slot>
          </div>
          <div class="main" part="main">
            <div class="main-header" part="main-header">
              <slot name="main-header"></slot>
            </div>
            <div class="main-content" part="main-content">
              <slot name="skip-to-content-target"></slot>
              <slot></slot>
            </div>
            <div class="main-footer" part="main-footer">
              <slot name="main-footer"></slot>
            </div>
          </div>
          <div class="aside" part="aside">
            <slot name="aside"></slot>
          </div>
        </div>
        <div class="footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </div>
      <wa-drawer
        part="drawer"
        placement=${this.navigationPlacement}
        light-dismiss
        ?open=${Or(this.navOpen)}
        @wa-after-show=${()=>this.navOpen=this.navigationDrawer.open}
        @wa-after-hide=${()=>this.navOpen=this.navigationDrawer.open}
        exportparts="
          dialog:drawer__dialog,
          overlay:drawer__overlay,
          panel:drawer__panel,
          header:drawer__header,
          header-actions:drawer__header-actions,
          title:drawer__title,
          close-button:drawer__close-button,
          close-button__base:drawer__close-button__base,
          body:drawer__body,
          footer:drawer__footer
        "
        class="navigation-drawer"
      >
        <slot slot="label" part="navigation-header" name="mobile-navigation-header">
          ${_n(this.view==="mobile",()=>G`<slot name="navigation-header"><div></div></slot>`,()=>G`<div></div>`)}
        </slot>
        <slot name="mobile-navigation">
          ${_n(this.view==="mobile",()=>G`<slot name="navigation"><div></div></slot>`,()=>G`<div></div>`)}
        </slot>

        <slot
          slot=${kt(e?"footer":void 0)}
          name="mobile-navigation-footer"
          ?hidden=${!e}
        >
          ${_n(this.view==="mobile",()=>G`<slot part="navigation-footer" name="navigation-footer"><div></div></slot>`,()=>G`<div></div>`)}
        </slot>
      </wa-drawer>
    `}};je.css=[Zi,Qi];y([Ee("[part~='header']")],je.prototype,"header",2);y([Ee("[part~='menu']")],je.prototype,"menu",2);y([Ee("[part~='main']")],je.prototype,"main",2);y([Ee("[part~='aside']")],je.prototype,"aside",2);y([Ee("[part~='subheader']")],je.prototype,"subheader",2);y([Ee("[part~='footer']")],je.prototype,"footer",2);y([Ee("[part~='banner']")],je.prototype,"banner",2);y([Ee("[part~='drawer']")],je.prototype,"navigationDrawer",2);y([Ee("slot[name~='navigation-toggle']")],je.prototype,"navigationToggleSlot",2);y([H({attribute:"view",reflect:!0})],je.prototype,"view",2);y([H({reflect:!0})],je.prototype,"nonce",2);y([H({attribute:"nav-open",reflect:!0,type:Boolean})],je.prototype,"navOpen",2);y([H({attribute:"mobile-breakpoint",type:String})],je.prototype,"mobileBreakpoint",2);y([H({attribute:"navigation-placement",reflect:!0})],je.prototype,"navigationPlacement",2);y([H({attribute:"disable-navigation-toggle",reflect:!0,type:Boolean})],je.prototype,"disableNavigationToggle",2);je=y([Ye("wa-page")],je);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var al=Ve`
  :host {
    --size: 25rem;
    --spacing: var(--wa-space-l);
    --backdrop-filter: none;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: none;
  }

  :host([open]) {
    display: block;
  }

  .drawer {
    display: flex;
    flex-direction: column;
    top: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    color: inherit;
    background-color: var(--wa-color-surface-raised);
    border: none;
    box-shadow: var(--wa-shadow-l);
    overflow: auto;
    padding: 0;
    margin: 0;
    animation-duration: var(--show-duration);
    animation-timing-function: ease;

    &.show::backdrop {
      animation: show-backdrop var(--show-duration, 200ms) ease;
    }

    &.hide::backdrop {
      animation: show-backdrop var(--hide-duration, 200ms) ease reverse;
    }

    &.show.top {
      animation: show-drawer-from-top var(--show-duration) ease;
    }

    &.hide.top {
      animation: show-drawer-from-top var(--hide-duration) ease reverse;
    }

    &.show.end {
      animation: show-drawer-from-end var(--show-duration) ease;

      &:dir(rtl) {
        animation-name: show-drawer-from-start;
      }
    }

    &.hide.end {
      animation: show-drawer-from-end var(--hide-duration) ease reverse;

      &:dir(rtl) {
        animation-name: show-drawer-from-start;
      }
    }

    &.show.bottom {
      animation: show-drawer-from-bottom var(--show-duration) ease;
    }

    &.hide.bottom {
      animation: show-drawer-from-bottom var(--hide-duration) ease reverse;
    }

    &.show.start {
      animation: show-drawer-from-start var(--show-duration) ease;

      &:dir(rtl) {
        animation-name: show-drawer-from-end;
      }
    }

    &.hide.start {
      animation: show-drawer-from-start var(--hide-duration) ease reverse;

      &:dir(rtl) {
        animation-name: show-drawer-from-end;
      }
    }

    &.pulse {
      animation: pulse 250ms ease;
    }
  }

  .drawer:focus {
    outline: none;
  }

  .top {
    top: 0;
    inset-inline-end: auto;
    bottom: auto;
    inset-inline-start: 0;
    width: 100%;
    height: var(--size);
  }

  .end {
    top: 0;
    inset-inline-end: 0;
    bottom: auto;
    inset-inline-start: auto;
    width: var(--size);
    height: 100%;
  }

  .bottom {
    top: auto;
    inset-inline-end: auto;
    bottom: 0;
    inset-inline-start: 0;
    width: 100%;
    height: var(--size);
  }

  .start {
    top: 0;
    inset-inline-end: auto;
    bottom: auto;
    inset-inline-start: 0;
    width: var(--size);
    height: 100%;
  }

  .header {
    display: flex;
    flex-wrap: nowrap;
    padding-inline-start: var(--spacing);
    padding-block-end: 0;

    /* Subtract the close button's padding so that the X is visually aligned with the edges of the dialog content */
    padding-inline-end: calc(var(--spacing) - var(--wa-form-control-padding-block));
    padding-block-start: calc(var(--spacing) - var(--wa-form-control-padding-block));
  }

  .title {
    align-self: center;
    flex: 1 1 auto;
    font: inherit;
    font-size: var(--wa-font-size-l);
    font-weight: var(--wa-font-weight-heading);
    line-height: var(--wa-line-height-condensed);
    margin: 0;
  }

  .header-actions {
    align-self: start;
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: end;
    gap: var(--wa-space-2xs);
    padding-inline-start: var(--spacing);
  }

  .header-actions wa-button,
  .header-actions ::slotted(wa-button) {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .body {
    flex: 1 1 auto;
    display: block;
    padding: var(--spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--wa-space-xs);
    justify-content: end;
    padding: var(--spacing);
    padding-block-start: 0;
  }

  .footer ::slotted(wa-button:not(:last-of-type)) {
    margin-inline-end: var(--wa-spacing-xs);
  }

  .drawer::backdrop {
    /*
        NOTE: the ::backdrop element doesn't inherit properly in Safari yet, but it will in 17.4! At that time, we can
        remove the fallback values here.
      */
    background-color: var(--wa-color-overlay-modal, rgb(0 0 0 / 0.25));
    backdrop-filter: var(--backdrop-filter);
  }

  @keyframes pulse {
    0% {
      scale: 1;
    }
    50% {
      scale: 1.01;
    }
    100% {
      scale: 1;
    }
  }

  @keyframes show-drawer {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes show-drawer-from-top {
    from {
      opacity: 0;
      translate: 0 -100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-end {
    from {
      opacity: 0;
      translate: 100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-bottom {
    from {
      opacity: 0;
      translate: 0 100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-start {
    from {
      opacity: 0;
      translate: -100% 0;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-backdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .drawer {
      border: solid 1px white;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var sl=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??(this.observer=new ResizeObserver(()=>this.check())),this.observer.observe(this.element);for(const t of e)this.observer.observe(t);this.initialCheckHandle??(this.initialCheckHandle=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()}))}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function rl(e,t){const n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var _a=new Set;function il(){const e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function ll(){const e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function aa(e){if(_a.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){const t=il()+ll();let n=getComputedStyle(document.documentElement).scrollbarGutter;(!n||n==="auto")&&(n="stable"),t<2&&(n=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",n),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function sa(e){_a.delete(e),_a.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function cl(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Po=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Do=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qo=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Io=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var pn=[];function Nr(e){bo(e),pn.push(e)}function bo(e){for(let t=pn.length-1;t>=0;t--)if(pn[t]===e){pn.splice(t,1);break}}function Ca(e){return pn.length>0&&pn[pn.length-1]===e}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */async function Ea(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function vt(e,t){return new Promise(n=>{const o=new AbortController,{signal:a}=o;if(e.classList.contains(t))return;e.classList.add(t);let s=!1,r=()=>{s||(s=!0,e.classList.remove(t),n(),o.abort())};e.addEventListener("animationend",r,{once:!0,signal:a}),e.addEventListener("animationcancel",r,{once:!0,signal:a}),requestAnimationFrame(()=>{!s&&e.getAnimations().length===0&&r()})})}function ps(e){return e=e.toString().toLowerCase(),e.indexOf("ms")>-1?parseFloat(e)||0:e.indexOf("s")>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}function dl(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ut=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.hasSlotController=new Dn(this,"footer","header-actions","label"),this.renderedWatcher=new sl(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.withLabel=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&Ca(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.drawer.showModal(),aa(this),this.renderedWatcher.start(this.drawer))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),sa(this),this.removeOpenListeners()}async requestClose(e){const t=new Do({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,vt(this.drawer,"pulse");return}this.removeOpenListeners(),await vt(this.drawer,"hide"),this.open=!1,this.drawer.close(),sa(this),this.renderedWatcher.stop();const n=this.originalTrigger;typeof n?.focus=="function"&&setTimeout(()=>n.focus()),this.dispatchEvent(new qo)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),Nr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),bo(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&Ca(this)&&this.requestClose(this.drawer)}handleDialogClick(e){const n=e.target.closest('[data-drawer="close"]');n&&(e.stopPropagation(),this.requestClose(n))}async handleDialogPointerDown(e){e.target===this.drawer&&!rl(e,this.drawer)&&(this.lightDismiss?this.requestClose(this.drawer):await vt(this.drawer,"pulse"))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.drawer.open?(this.removeOpenListeners(),this.drawer.close(),sa(this)):e&&!this.drawer.open&&(this.addOpenListeners(),this.drawer.showModal(),aa(this))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open?(this.open=!0,this.requestClose(this.drawer)):this.open||this.renderedWatcher.stop()}async show(){const e=new Po;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),aa(this),this.renderedWatcher.start(this.drawer),requestAnimationFrame(()=>{const t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await vt(this.drawer,"show"),this.dispatchEvent(new Io)}render(){const e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter"),n=this.label.length>0||this.hasSlotController.test("label","withLabel");return G`
      <dialog
        part="dialog"
        aria-labelledby=${kt(e&&n?"title":void 0)}
        aria-label=${kt(!e&&this.label?this.label:void 0)}
        class=${$t({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?G`
              <div part="header" class="header">
                <h2 part="title" class="title" id="title">
                  <!-- If there's no label, use an invisible character to prevent the header from collapsing -->
                  <slot name="label"> ${this.label.length>0?this.label:"​"} </slot>
                </h2>
                <div part="header-actions" class="header-actions">
                  <slot name="header-actions"></slot>
                  <wa-button
                    part="close-button"
                    exportparts="base:close-button__base"
                    class="close"
                    appearance="plain"
                    @click="${o=>this.requestClose(o.target)}"
                  >
                    <wa-icon
                      name="xmark"
                      label=${this.localize.term("close")}
                      library="system"
                      variant="solid"
                    ></wa-icon>
                  </wa-button>
                </div>
              </div>
            `:""}

        <div part="body" class="body"><slot></slot></div>

        <div part="footer" class="footer" ?hidden=${!t}>
          <slot name="footer"></slot>
        </div>
      </dialog>
    `}};ut.css=al;y([Ee(".drawer")],ut.prototype,"drawer",2);y([H({type:Boolean,reflect:!0})],ut.prototype,"open",2);y([H({reflect:!0})],ut.prototype,"label",2);y([H({reflect:!0})],ut.prototype,"placement",2);y([H({attribute:"without-header",type:Boolean,reflect:!0})],ut.prototype,"withoutHeader",2);y([H({attribute:"light-dismiss",type:Boolean})],ut.prototype,"lightDismiss",2);y([H({attribute:"with-footer",type:Boolean})],ut.prototype,"withFooter",2);y([H({attribute:"with-label",type:Boolean})],ut.prototype,"withLabel",2);y([wt("open",{waitUntilFirstUpdate:!0})],ut.prototype,"handleOpenChange",1);ut=y([Ye("wa-drawer")],ut);document.addEventListener("click",e=>{const t=e.target.closest("[data-drawer]");if(t instanceof Element){const[n,o]=cl(t.getAttribute("data-drawer")||"");if(n==="open"&&o?.length){const s=t.getRootNode().getElementById(o);s?.localName==="wa-drawer"?s.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ul=Ve`
  .form-control {
    position: relative;
    border: none;
    padding: 0;
    margin: 0;
  }

  .label {
    padding: 0;
  }

  .radio-group-required .label::after {
    content: var(--wa-form-control-required-content);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }

  [part~='form-control-input'] {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 0; /* Radios handle their own spacing */
  }

  /* Horizontal */
  :host([orientation='horizontal']) [part~='form-control-input'] {
    flex-direction: row;
  }

  /* Help text */
  [part~='hint'] {
    margin-block-start: 0.5em;
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var hl=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<"u"&&"createElement"in document&&(t=Object.assign(document.createElement("input"),{required:!0})),n||(n="value");const o={observedAttributes:["required"],message:t?.validationMessage,checkValidity(a){const s={message:"",isValid:!0,invalidKeys:[]};return(a.required??a.hasAttribute("required"))&&!a[n]&&(s.message=typeof o.message=="function"?o.message(a):o.message||"",s.isValid=!1,s.invalidKeys.push("valueMissing")),s}};return o};let pl="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",fl=(e=21)=>{let t="",n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=pl[n[e]&63];return t};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function fs(e,t,n){const o=a=>Object.is(a,-0)?0:a;return e<t?o(t):e>n?o(n):o(e)}function Xa(e=""){return`${e}${fl()}`}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var We=class extends In{constructor(){super(),this.hasSlotController=new Dn(this,"hint","label"),this.label="",this.hint="",this.name=null,this.disabled=!1,this.orientation="vertical",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{const t=e.target.closest("wa-radio");if(!t||t.disabled||t.forceDisabled||this.disabled)return;const n=this.value;this.value=t.value,t.checked=!0;const o=this.getAllRadios();for(const a of o)t!==a&&(a.checked=!1,a.setAttribute("tabindex","-1"));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})},this.addEventListener("keydown",this.handleKeyDown),this.addEventListener("click",this.handleRadioClick)}static get validators(){const e=[hl({validationElement:Object.assign(document.createElement("input"),{required:!0,type:"radio",name:Xa("__wa-radio")})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e=="number"&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){$n(this.localName,this.size)}get validationTarget(){const e=this.querySelector(":is(wa-radio):not([disabled])");if(e)return e}updated(e){(e.has("disabled")||e.has("size")||e.has("value")||e.has("defaultValue"))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll("wa-radio")]}handleLabelClick(){this.focus()}async syncRadioElements(){const e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute("size",this.size),t.toggleAttribute("data-wa-radio-horizontal",this.orientation!=="vertical"),t.toggleAttribute("data-wa-radio-vertical",this.orientation==="vertical"),t.toggleAttribute("data-wa-radio-first",n===0),t.toggleAttribute("data-wa-radio-inner",n!==0&&n!==e.length-1),t.toggleAttribute("data-wa-radio-last",n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async t=>{await t.updateComplete,!t.disabled&&t.value===this.value?t.checked=!0:t.checked=!1})),this.disabled)e.forEach(t=>{t.tabIndex=-1});else{const t=e.filter(o=>!o.disabled),n=t.find(o=>o.checked);t.length>0&&(n?t.forEach(o=>{o.tabIndex=o.checked?0:-1}):t.forEach((o,a)=>{o.tabIndex=a===0?0:-1})),e.filter(o=>o.disabled).forEach(o=>{o.tabIndex=-1})}}handleKeyDown(e){if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)||this.disabled)return;const t=this.getAllRadios().filter(i=>!i.disabled);if(t.length<=0)return;e.preventDefault();const n=this.value,o=t.find(i=>i.checked)??t[0],a=e.key===" "?0:["ArrowUp","ArrowLeft"].includes(e.key)?-1:1;let s=t.indexOf(o)+a;s||(s=0),s<0&&(s=t.length-1),s>t.length-1&&(s=0);const r=t.some(i=>i.tagName.toLowerCase()==="wa-radio-button");this.getAllRadios().forEach(i=>{i.checked=!1,r||i.setAttribute("tabindex","-1")}),this.value=t[s].value,t[s].checked=!0,r?t[s].shadowRoot.querySelector("button").focus():(t[s].setAttribute("tabindex","0"),t[s].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;const t=this.getAllRadios(),n=t.find(s=>s.checked),o=t.find(s=>!s.disabled),a=n||o;a&&a.focus(e)}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return G`
      <fieldset
        part="form-control"
        class=${$t({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":n})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${$t({label:!0,"has-label":n})}
          aria-hidden=${n?"false":"true"}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <slot part="form-control-input" @slotchange=${this.syncRadioElements}></slot>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${$t({"has-slotted":o})}
          aria-hidden=${o?"false":"true"}
          >${this.hint}</slot
        >
      </fieldset>
    `}};We.css=[qn,Ya,ul];We.shadowRootOptions={...In.shadowRootOptions,delegatesFocus:!0};y([Ee("slot:not([name])")],We.prototype,"defaultSlot",2);y([H()],We.prototype,"label",2);y([H({attribute:"hint"})],We.prototype,"hint",2);y([H({reflect:!0})],We.prototype,"name",2);y([H({type:Boolean,reflect:!0})],We.prototype,"disabled",2);y([H({reflect:!0})],We.prototype,"orientation",2);y([Zt()],We.prototype,"value",1);y([H({attribute:"value",reflect:!0})],We.prototype,"defaultValue",2);y([H({reflect:!0})],We.prototype,"size",2);y([wt("size")],We.prototype,"handleSizeChange",1);y([H({type:Boolean,reflect:!0})],We.prototype,"required",2);y([H({type:Boolean,attribute:"with-label"})],We.prototype,"withLabel",2);y([H({type:Boolean,attribute:"with-hint"})],We.prototype,"withHint",2);We=y([Ye("wa-radio-group")],We);We.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ml=Ve`
  :host {
    --checked-icon-color: var(--wa-form-control-activated-color);
    --checked-icon-scale: 0.7;

    color: var(--wa-form-control-value-color);
    display: inline-flex;
    flex-direction: row;
    align-items: top;
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:focus) {
    outline: none;
  }

  /* When the control isn't checked, hide the circle for Windows High Contrast mode a11y */
  :host(:not(:state(checked))) svg circle {
    opacity: 0;
  }

  [part~='label'] {
    display: inline;
  }

  [part~='hint'] {
    margin-block-start: 0.5em;
  }

  /* Default spacing for default appearance radios */
  :host([appearance='default']) {
    margin-block: 0.375em; /* Half of the original 0.75em gap on each side */
  }

  :host([appearance='default'][data-wa-radio-horizontal]) {
    margin-block: 0;
    margin-inline: 0.5em; /* Half of the original 1em gap on each side */
  }

  /* Remove margin from first/last items to prevent extra space */
  :host([appearance='default'][data-wa-radio-first]) {
    margin-block-start: 0;
    margin-inline-start: 0;
  }

  :host([appearance='default'][data-wa-radio-last]) {
    margin-block-end: 0;
    margin-inline-end: 0;
  }

  /* Button appearance have no spacing, they get handled by the overlap margins below */
  :host([appearance='button']) {
    margin: 0;
    align-items: center;
    min-height: var(--wa-form-control-height);
    background-color: var(--wa-color-surface-default);
    border: var(--wa-form-control-border-width) var(--wa-form-control-border-style) var(--wa-form-control-border-color);
    border-radius: var(--wa-border-radius-m);
    padding: 0 var(--wa-form-control-padding-inline);
    transition:
      background-color var(--wa-transition-fast),
      border-color var(--wa-transition-fast);
  }

  /* Default appearance */
  :host([appearance='default']) {
    .control {
      flex: 0 0 auto;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--wa-form-control-toggle-size);
      height: var(--wa-form-control-toggle-size);
      border-color: var(--wa-form-control-border-color);
      border-radius: 50%;
      border-style: var(--wa-form-control-border-style);
      border-width: var(--wa-form-control-border-width);
      background-color: var(--wa-form-control-background-color);
      color: transparent;
      transition:
        background var(--wa-transition-normal),
        border-color var(--wa-transition-fast),
        box-shadow var(--wa-transition-fast),
        color var(--wa-transition-fast);
      transition-timing-function: var(--wa-transition-easing);

      margin-inline-end: 0.5em;
    }

    .checked-icon {
      display: flex;
      fill: currentColor;
      width: var(--wa-form-control-toggle-size);
      height: var(--wa-form-control-toggle-size);
      scale: var(--checked-icon-scale);
    }
  }

  /* Button appearance */
  :host([appearance='button']) {
    .control {
      display: none;
    }
  }

  /* Checked */
  :host(:state(checked)) .control {
    color: var(--checked-icon-color);
    border-color: var(--wa-form-control-activated-color);
    background-color: var(--wa-form-control-background-color);
  }

  /* Focus */
  :host(:focus-visible) .control {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Disabled */
  :host(:state(disabled)) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Horizontal grouping - remove inner border radius */
  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-inner]) {
    border-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-first]) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-last]) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  /* Vertical grouping - remove inner border radius */
  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-inner]) {
    border-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-first]) {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-last]) {
    border-start-start-radius: 0;
    border-start-end-radius: 0;
  }

  @media (hover: hover) {
    :host([appearance='button']:hover:not(:state(disabled), :state(checked))) {
      background-color: color-mix(in srgb, var(--wa-color-surface-default) 95%, var(--wa-color-mix-hover));
    }
  }

  :host([appearance='button']:focus-visible) {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  :host([appearance='button']:state(checked)) {
    border-color: var(--wa-form-control-activated-color);
    background-color: var(--wa-color-brand-fill-quiet);
  }

  :host([appearance='button']:state(checked):focus-visible) {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Button overlap margins */
  :host([appearance='button'][data-wa-radio-horizontal]:not([data-wa-radio-first])) {
    margin-inline-start: calc(-1 * var(--wa-form-control-border-width));
  }

  :host([appearance='button'][data-wa-radio-vertical]:not([data-wa-radio-first])) {
    margin-block-start: calc(-1 * var(--wa-form-control-border-width));
  }

  /* Ensure interactive states are visible above adjacent buttons */
  :host([appearance='button']:hover),
  :host([appearance='button']:state(checked)) {
    position: relative;
    z-index: 1;
  }

  :host([appearance='button']:focus-visible) {
    z-index: 2;
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gt=class extends In{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance="default",this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener("click",this.handleClick)}handleSizeChange(){$n(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute("role","radio"),this.tabIndex=0,this.setAttribute("aria-disabled",this.disabled||this.forceDisabled?"true":"false")}updated(e){if(super.updated(e),e.has("checked")&&(this.customStates.set("checked",this.checked),this.setAttribute("aria-checked",this.checked?"true":"false"),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has("disabled")||e.has("forceDisabled")){const t=this.disabled||this.forceDisabled;this.customStates.set("disabled",t),this.setAttribute("aria-disabled",t?"true":"false"),t?this.tabIndex=-1:this.tabIndex=this.checked?0:-1}}setValue(){}render(){return G`
      <span part="control" class="control">
        ${this.checked?G`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:""}
      </span>

      <slot part="label" class="label"></slot>
    `}};gt.css=[Ya,qn,ml];y([Zt()],gt.prototype,"checked",2);y([Zt()],gt.prototype,"forceDisabled",2);y([H({reflect:!0})],gt.prototype,"value",2);y([H({reflect:!0})],gt.prototype,"appearance",2);y([H({reflect:!0})],gt.prototype,"size",2);y([wt("size")],gt.prototype,"handleSizeChange",1);y([H({type:Boolean})],gt.prototype,"disabled",2);gt=y([Ye("wa-radio")],gt);gt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gl=Ve`
  :host {
    --pulse-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));

    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375em 0.625em;
    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    font-size: max(var(--wa-font-size-3xs), 0.75em);
    font-weight: var(--wa-font-weight-semibold);
    line-height: 1;
    vertical-align: middle;
    white-space: nowrap;
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;
    border-radius: var(--wa-border-radius-s);
    border-style: var(--wa-border-style);
    border-width: var(--wa-border-width-s);
    user-select: none;
    -webkit-user-select: none;
    cursor: inherit;

    min-width: 1.25em; /* <-- this is what Safari respects for intrinsic */
    min-height: 1em;
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) {
    --pulse-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));

    color: var(--wa-color-on-quiet, var(--wa-color-brand-on-quiet));
    background-color: transparent;
    border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
  }

  :host([appearance='filled']) {
    --pulse-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));

    color: var(--wa-color-on-normal, var(--wa-color-brand-on-normal));
    background-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) {
    --pulse-color: var(--wa-color-border-normal, var(--wa-color-brand-border-normal));

    color: var(--wa-color-on-normal, var(--wa-color-brand-on-normal));
    background-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));
    border-color: var(--wa-color-border-normal, var(--wa-color-brand-border-normal));
  }

  :host([appearance='accent']) {
    --pulse-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));

    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;
  }

  /* Pill modifier */
  :host([pill]) {
    border-radius: var(--wa-border-radius-pill);
  }

  /* Pulse attention */
  :host([attention='pulse']) {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--pulse-color);
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  /* Bounce attention */
  :host([attention='bounce']) {
    animation: bounce 1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-2px);
    }
  }

  /* Prevents vertical space when icons with vertical-align are slotted in - https://github.com/shoelace-style/webawesome/issues/2280 */
  [part='start'],
  [part='end'] {
    line-height: 0;
  }

  slot[name='start']::slotted(*) {
    margin-inline-end: 0.375em;
  }

  slot[name='end']::slotted(*) {
    margin-inline-start: 0.375em;
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var mn=class extends st{constructor(){super(...arguments),this.variant="brand",this.appearance="accent",this.pill=!1,this.attention="none"}render(){return G`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};mn.css=[Ga,gl];y([H({reflect:!0})],mn.prototype,"variant",2);y([H({reflect:!0})],mn.prototype,"appearance",2);y([H({type:Boolean,reflect:!0})],mn.prototype,"pill",2);y([H({reflect:!0})],mn.prototype,"attention",2);mn=y([Ye("wa-badge")],mn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var bl=class extends Event{constructor(){super("wa-remove",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wl=Ve`
  @layer wa-component {
    :host {
      display: inline-flex;
      gap: 0.5em;
      border-radius: var(--wa-border-radius-m);
      align-items: center;
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
      border-style: var(--wa-border-style);
      border-width: var(--wa-border-width-s);
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      font-size: inherit;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      height: calc(var(--wa-form-control-height) * 0.8);
      line-height: calc(var(--wa-form-control-height) - var(--wa-form-control-border-width) * 2);
      padding: 0 0.75em;
    }

    /* Appearance modifiers */
    :host([appearance='outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
    }

    :host([appearance='filled']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: transparent;
    }

    :host([appearance='filled-outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
    }

    :host([appearance='accent']) {
      color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
      background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
      border-color: transparent;
    }
  }

  .content {
    font-size: var(--wa-font-size-smaller);
  }

  [part='remove-button'] {
    line-height: 1;
  }

  [part='remove-button']::part(base) {
    padding: 0;
    height: 1em;
    width: 1em;
    color: currentColor;
  }

  @media (hover: hover) {
    :host(:hover) > [part='remove-button']::part(base) {
      background-color: transparent;
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
    }
  }

  :host(:active) > [part='remove-button']::part(base) {
    background-color: transparent;
    color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
  }

  /*
   * Pill modifier
   */
  :host([pill]) {
    border-radius: var(--wa-border-radius-pill);
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var zt=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.variant="neutral",this.appearance="filled-outlined",this.size="m",this.pill=!1,this.withRemove=!1}handleSizeChange(){$n(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new bl)}render(){return G`
      <slot part="content" class="content"></slot>

      ${this.withRemove?G`
            <wa-button
              part="remove-button"
              exportparts="base:remove-button__base"
              class="remove"
              appearance="plain"
              size=${this.size}
              @click=${this.handleRemoveClick}
              tabindex="-1"
            >
              <wa-icon name="xmark" library="system" variant="solid" label=${this.localize.term("remove")}></wa-icon>
            </wa-button>
          `:""}
    `}};zt.css=[wl,Ga,qn];y([H({reflect:!0})],zt.prototype,"variant",2);y([H({reflect:!0})],zt.prototype,"appearance",2);y([H({reflect:!0})],zt.prototype,"size",2);y([wt("size")],zt.prototype,"handleSizeChange",1);y([H({type:Boolean,reflect:!0})],zt.prototype,"pill",2);y([H({attribute:"with-remove",type:Boolean})],zt.prototype,"withRemove",2);zt=y([Ye("wa-tag")],zt);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var yl=Ve`
  :host {
    --gap: var(--wa-space-s);
    --width: 28rem;
    --reorder-duration: var(--wa-transition-normal);

    display: flex;
    flex-direction: column;
    position: fixed;
    width: var(--width);
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: var(--wa-space-m);
    overflow-y: auto;
    gap: var(--gap);
    border: none;
    background: transparent;
    pointer-events: none;
    scrollbar-width: thin;

    /* Reset inset properties so placement changes work correctly */
    inset-block-start: auto;
    inset-block-end: auto;
    inset-inline-start: auto;
    inset-inline-end: auto;
    translate: none;
    align-content: normal;
    justify-content: normal;
  }

  :host(:not(:popover-open)) {
    display: none;
  }

  /* Placement positioning using logical properties for RTL support */
  :host([placement='top-start']) {
    inset-block-start: 0;
    inset-inline-start: 0;
  }

  :host([placement='top-center']) {
    inset-block-start: 0;
    inset-inline-start: 50%;
    translate: -50% 0;
  }

  :host([placement='top-end']) {
    inset-block-start: 0;
    inset-inline-start: auto;
    inset-inline-end: 0;
  }

  :host([placement='bottom-start']) {
    inset-block-end: 0;
    inset-inline-start: 0;
    align-content: end;
  }

  :host([placement='bottom-center']) {
    inset-block-end: 0;
    inset-inline-start: 50%;
    translate: -50% 0;
    align-content: end;
  }

  :host([placement='bottom-end']) {
    inset-block-end: 0;
    inset-inline-start: auto;
    inset-inline-end: 0;
    align-content: end;
  }

  /* Bottom placements: justify content to end */
  :host([placement^='bottom']) {
    justify-content: end;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    width: 100%;
    pointer-events: auto;
  }

  /* Bottom placements: reverse stack order so newest appears at bottom */
  :host([placement^='bottom']) .stack {
    flex-direction: column-reverse;
  }

  /* Mobile: full width */
  @media (max-width: 480px) {
    :host {
      width: 100%;
      padding: var(--wa-space-s);
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xn=null,uo=0;function vl(){if(uo+=1,Xn||typeof document>"u")return;const e=document.createElement("div");e.id=Xa("wa-toast-live-region-"),e.setAttribute("data-wa-toast-live-region",""),e.style.cssText=`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    pointer-events: none;
    top: 0;
    left: 0;
  `,document.body.append(e),Xn=e}function kl(){uo=Math.max(0,uo-1),!(uo>0)&&(Xn?.remove(),Xn=null)}function $l(e,t){if(typeof document>"u")return;const n=Xn;if(!n)return;const o=e.trim();if(!o)return;const a=document.createElement("div");a.setAttribute("role",t==="danger"?"alert":"status"),a.setAttribute("aria-live",t==="danger"?"assertive":"polite"),a.setAttribute("aria-atomic","true"),n.append(a),requestAnimationFrame(()=>{requestAnimationFrame(()=>{a.textContent=o})}),setTimeout(()=>a.remove(),1e3)}var Qn=class extends st{constructor(){super(...arguments),this.activatedToastItems=new WeakSet,this.positionCache=new Map,this.placement="top-end",this.handleDocumentKeyDown=async e=>{if(await new Promise(t=>setTimeout(t)),e.key==="Escape"&&!e.defaultPrevented){const t=this.getToastItems();t.length>0&&(e.preventDefault(),t[t.length-1]?.hide())}},this.handleAfterHide=async e=>{const t=e.target;t.parentElement===this&&(this.capturePositions(),t.remove(),await this.animatePositions()),this.getToastItems().length===0&&this.hideStack()}}connectedCallback(){super.connectedCallback(),this.popover="manual",vl(),document.addEventListener("keydown",this.handleDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener?.("keydown",this.handleDocumentKeyDown),kl()}handleSlotChange(){const e=this.getToastItems(),t=[];e.forEach(n=>{this.activatedToastItems.has(n)||t.push(n)}),t.length>0&&(this.capturePositions(),t.forEach(n=>{this.activatedToastItems.add(n),this.showStack(),n.startTimer(),this.announceToastItem(n)}),requestAnimationFrame(()=>this.animatePositions()))}announceToastItem(e){$l(e.textContent??"",e.variant)}getToastItems(){return[...this.querySelectorAll(":scope > wa-toast-item")]}capturePositions(){this.positionCache.clear();for(const e of this.getToastItems())this.positionCache.set(e,e.getBoundingClientRect())}async animatePositions(){if(dl()){this.positionCache.clear();return}const e=[];for(const t of this.getToastItems()){const n=this.positionCache.get(t);if(!n)continue;const o=t.getBoundingClientRect(),a=n.top-o.top;if(Math.abs(a)>1){const s=Ea(t,[{transform:`translateY(${a}px)`},{transform:"translateY(0)"}],{duration:200,easing:"cubic-bezier(0.2, 0, 0, 1)"});e.push(s)}}this.positionCache.clear(),await Promise.all(e)}showStack(){this.matches(":popover-open")||(this.showPopover(),this.customStates.set("visible",!0))}hideStack(){this.matches(":popover-open")&&(this.hidePopover(),this.customStates.set("visible",!1))}async create(e,t){const n={allowHtml:!1,duration:5e3,variant:"neutral",size:"m",...t},o=document.createElement("wa-toast-item");if(o.variant=n.variant,o.size=n.size,o.duration=n.duration,n.allowHtml?o.innerHTML=e:o.textContent=e,n.icon){const a=document.createElement("wa-icon");a.setAttribute("slot","icon"),typeof n.icon=="string"?a.setAttribute("name",n.icon):(a.setAttribute("name",n.icon.name),n.icon.library&&a.setAttribute("library",n.icon.library),n.icon.family&&a.setAttribute("family",n.icon.family),n.icon.variant&&a.setAttribute("variant",n.icon.variant)),o.prepend(a)}return this.activatedToastItems.add(o),this.capturePositions(),this.showStack(),this.prepend(o),await o.updateComplete,this.animatePositions(),o.startTimer(),this.announceToastItem(o),o}render(){return G`
      <div part="stack" class="stack" @wa-after-hide=${this.handleAfterHide}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Qn.css=yl;y([Ee(".stack")],Qn.prototype,"stack",2);y([H({reflect:!0})],Qn.prototype,"placement",2);Qn=y([Ye("wa-toast")],Qn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var xl=Ve`
  :host {
    --accent-width: 4px;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);
    --accent-color: var(--wa-color-fill-loud);

    display: block;
    pointer-events: auto;
  }

  /* Sizes */
  :host([size='xs']) {
    --padding: var(--wa-space-xs);
  }
  :host([size='s']),
  :host([size='small']) {
    --padding: var(--wa-space-s);
  }
  :host([size='m']),
  :host([size='medium']) {
    --padding: var(--wa-space-m);
  }
  :host([size='l']),
  :host([size='large']) {
    --padding: var(--wa-space-l);
  }
  :host([size='xl']) {
    --padding: var(--wa-space-xl);
  }

  .toast-item {
    display: flex;
    align-items: stretch;
    background: var(--wa-color-surface-raised);
    border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    box-shadow: var(--wa-shadow-l);
    overflow: hidden;
  }

  /* Animations */
  .toast-item.show {
    animation: toast-show var(--show-duration) var(--wa-transition-easing) forwards;
  }

  .toast-item.hide {
    animation: toast-hide var(--hide-duration) var(--wa-transition-easing) forwards;
  }

  @keyframes toast-show {
    from {
      opacity: 0;
      translate: 0 -0.5rem;
    }
    to {
      opacity: 1;
      translate: 0;
    }
  }

  @keyframes toast-hide {
    from {
      opacity: 1;
      translate: 0;
    }
    to {
      opacity: 0;
      translate: 0 -0.5rem;
    }
  }

  /* Accent line */
  .accent {
    flex: 0 0 auto;
    width: var(--accent-width);
    background: var(--accent-color);
  }

  /* Icon - only show if slot has content */
  .icon {
    display: flex;
    align-items: center;
    padding: var(--padding);
    padding-inline-end: 0;
    color: var(--accent-color);
    font-size: 1.25em;
  }

  .toast-item:not(.toast-item--has-icon) .icon {
    display: none;
  }

  /* Content */
  .content {
    flex: 1 1 auto;
    align-self: center;
    min-width: 0;
    padding: var(--padding);
    color: var(--wa-color-text-normal);
  }

  /* Close button */
  .close-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    padding-inline: var(--padding);
    background: transparent;
    border: none;
    border-start-end-radius: var(--border-radius);
    border-end-end-radius: var(--border-radius);
    color: var(--wa-color-neutral-on-quiet);
    font-size: inherit;
    cursor: pointer;
    transition: background-color var(--wa-transition-fast);

    @media (hover: hover) {
      &:hover {
        color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
      }
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-focus-ring-width) * -1);
    }
  }

  /* Progress ring styling */
  wa-progress-ring {
    --size: var(--wa-form-control-height);
    --track-width: 0.125rem;
    --indicator-width: 0.125rem;
    --track-color: var(--wa-color-neutral-fill-quiet);
    --indicator-color: var(--accent-color);
    --indicator-transition-duration: 50ms;
  }

  /* Hide progress ring indicator when no duration */
  .toast-item:not(.toast-item--has-duration) wa-progress-ring {
    --track-color: transparent;
    --indicator-color: transparent;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toast-item.show,
    .toast-item.hide {
      animation: none;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var St=class extends st{constructor(){super(...arguments),this.hasSlotController=new Dn(this,"icon"),this.localize=new Et(this),this.animationFrame=null,this.startTime=null,this.isHovering=!1,this.isFocused=!1,this.timeLeft=100,this.variant="neutral",this.size="m",this.duration=5e3,this.withIcon=!1,this.tick=()=>{if(!this.startTime)return;const e=performance.now()-this.startTime,t=Math.min(e/this.duration,1);this.timeLeft=100*(1-t),t<1?this.animationFrame=requestAnimationFrame(this.tick):this.hide()},this.handlePointerEnter=e=>{(e.pointerType==="mouse"||e.pointerType==="pen")&&(this.isHovering=!0,this.pauseTimer())},this.handlePointerLeave=()=>{this.isHovering&&(this.isHovering=!1,this.resumeTimer())},this.handleFocusIn=()=>{this.isFocused=!0,this.pauseTimer()},this.handleFocusOut=()=>{this.isFocused=!1,this.resumeTimer()}}handleSizeChange(){$n(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener("pointerenter",this.handlePointerEnter),this.addEventListener("pointerleave",this.handlePointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),this.removeEventListener("pointerenter",this.handlePointerEnter),this.removeEventListener("pointerleave",this.handlePointerLeave)}async startTimer(){const e=new Po;this.dispatchEvent(e),!e.defaultPrevented&&(await this.updateComplete,await vt(this.toastItemElement,"show"),this.dispatchEvent(new Io),this.duration>0&&Number.isFinite(this.duration)&&(this.startTime=performance.now(),this.timeLeft=100,this.tick()))}stopTimer(){this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null)}async hide(){this.stopTimer();const e=new Do;this.dispatchEvent(e),!e.defaultPrevented&&(await vt(this.toastItemElement,"hide"),this.dispatchEvent(new qo),this.remove())}handleCloseClick(){this.hide()}pauseTimer(){this.stopTimer(),this.timeLeft=100}resumeTimer(){!this.isHovering&&!this.isFocused&&this.duration>0&&(this.startTime=performance.now(),this.tick())}render(){const e=this.hasUpdated?this.hasSlotController.test("icon"):this.withIcon,t=this.duration>0;return G`
      <div
        part="toast-item"
        class=${$t({"toast-item":!0,"toast-item--has-icon":e,"toast-item--has-duration":t})}
      >
        <div part="accent" class="accent"></div>

        <div part="icon" class="icon">
          <slot name="icon"></slot>
        </div>

        <div part="content" class="content">
          <slot></slot>
        </div>

        <button
          part="close-button"
          class="close-button"
          type="button"
          aria-label=${this.localize.term("close")}
          @click=${this.handleCloseClick}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
        >
          <wa-progress-ring
            part="progress-ring"
            exportparts="
              base:progress-ring__base,
              label:progress-ring__label,
              track:progress-ring__track,
              indicator:progress-ring__indicator
            "
            value=${this.timeLeft}
            aria-hidden="true"
          >
            <wa-icon
              part="close-icon"
              exportparts="svg:close-icon__svg"
              name="xmark"
              library="system"
              variant="solid"
            ></wa-icon>
          </wa-progress-ring>
        </button>
      </div>
    `}};St.css=[xl,Ga,qn];y([Ee(".toast-item")],St.prototype,"toastItemElement",2);y([Zt()],St.prototype,"timeLeft",2);y([H({reflect:!0})],St.prototype,"variant",2);y([H({reflect:!0})],St.prototype,"size",2);y([wt("size")],St.prototype,"handleSizeChange",1);y([H({type:Number})],St.prototype,"duration",2);y([H({attribute:"with-icon",type:Boolean})],St.prototype,"withIcon",2);St=y([Ye("wa-toast-item")],St);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Sl=Ve`
  :host {
    --size: 8rem;
    --track-width: 0.25em; /* avoid using rems here */
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-width: var(--track-width);
    --indicator-color: var(--wa-color-brand-fill-loud);
    --indicator-transition-duration: 0.35s;

    display: inline-flex;
  }

  .progress-ring {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .image {
    width: var(--size);
    height: var(--size);
    rotate: -90deg;
    transform-origin: 50% 50%;
  }

  .track,
  .indicator {
    --radius: calc(var(--size) / 2 - max(var(--track-width), var(--indicator-width)) * 0.5);
    --circumference: calc(var(--radius) * 2 * 3.141592654);

    fill: none;
    r: var(--radius);
    cx: calc(var(--size) / 2);
    cy: calc(var(--size) / 2);
  }

  .track {
    stroke: var(--track-color);
    stroke-width: var(--track-width);
  }

  .indicator {
    stroke: var(--indicator-color);
    stroke-width: var(--indicator-width);
    stroke-linecap: round;
    transition-property: stroke-dashoffset;
    transition-duration: var(--indicator-transition-duration);
    stroke-dasharray: var(--circumference) var(--circumference);
    stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
  }

  .label {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
  }
`;/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const zr="important",_l=" !"+zr,ms=Tr(class extends Rr{constructor(e){if(super(e),e.type!==Lr.ATTRIBUTE||e.name!=="style"||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{const o=e[n];return o==null?t:t+`${n=n.includes("-")?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${o};`},"")}update(e,[t]){const{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const o of this.ft)t[o]==null&&(this.ft.delete(o),o.includes("-")?n.removeProperty(o):n[o]=null);for(const o in t){const a=t[o];if(a!=null){this.ft.add(o);const s=typeof a=="string"&&a.endsWith(_l);o.includes("-")||s?n.setProperty(o,s?a.slice(0,-11):a,s?zr:""):n[o]=a}}return Mr}});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Kt=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.value=0,this.label=""}updated(e){if(super.updated(e),e.has("value")){const t=parseFloat(getComputedStyle(this.indicator).getPropertyValue("r")),n=2*Math.PI*t,o=n-this.value/100*n;this.indicatorOffset=`${o}px`}}render(){return G`
      <div
        part="base progress-ring"
        class="progress-ring"
        role="progressbar"
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-describedby="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style=${ms({"--percentage":this.value/100})}
      >
        <svg class="image">
          <circle part="track" class="track"></circle>
          <circle
            part="indicator"
            class="indicator"
            style=${ms({"stroke-dashoffset":this.indicatorOffset})}
          ></circle>
        </svg>

        <slot id="label" part="label" class="label"></slot>
      </div>
    `}};Kt.css=Sl;y([Ee(".indicator")],Kt.prototype,"indicator",2);y([Zt()],Kt.prototype,"indicatorOffset",2);y([H({type:Number,reflect:!0})],Kt.prototype,"value",2);y([H()],Kt.prototype,"label",2);Kt=y([Ye("wa-progress-ring")],Kt);Kt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Cl=Ve`
  :host {
    --height: var(--wa-form-control-toggle-size);
    --width: calc(var(--height) * 1.75);
    --thumb-size: 0.75em;

    display: inline-flex;
    line-height: var(--wa-form-control-value-line-height);
  }

  label {
    position: relative;
    display: flex;
    align-items: center;
    font: inherit;
    color: var(--wa-form-control-value-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .switch {
    flex: 0 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--height);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    transition-property: translate, background, border-color, box-shadow;
    transition-duration: var(--wa-transition-normal);
    transition-timing-function: var(--wa-transition-easing);
  }

  :host([did-ssr]:not(:defined)) .switch {
    transition-property: unset;
    transition-duration: unset;
    transition-timing-function: unset;
  }

  .switch .thumb {
    aspect-ratio: 1 / 1;
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--wa-form-control-border-color);
    border-radius: 50%;
    translate: calc((var(--width) - var(--height)) / -2);
    transition: inherit;
  }
  .switch .thumb:dir(rtl) {
    translate: calc((var(--width) - var(--height)) / 2);
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Focus */
  label:not(.disabled) .input:focus-visible ~ [part~='control'] {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Checked */
  .checked .switch {
    background-color: var(--wa-form-control-activated-color);
    border-color: var(--wa-form-control-activated-color);
  }

  .checked .switch .thumb {
    background-color: var(--wa-color-surface-default);
    translate: calc((var(--width) - var(--height)) / 2);
  }
  .checked .switch .thumb:dir(rtl) {
    translate: calc((var(--width) - var(--height)) / -2);
  }

  /* Disabled */
  label:has(> :disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part~='label'] {
    display: inline-block;
    line-height: var(--height);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) [part~='label']::after {
    content: var(--wa-form-control-required-content);
    color: var(--wa-form-control-required-content-color);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }

  @media (forced-colors: active) {
    :checked:enabled + .switch:hover .thumb,
    :checked + .switch .thumb {
      background-color: ButtonText;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Be=class extends In{constructor(){super(...arguments),this.hasSlotController=new Dn(this,"hint"),this.localize=new Et(this),this.title="",this.name=null,this._value=this.getAttribute("value")??null,this.size="m",this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute("checked"),this.required=!1,this.hint="",this.withHint=!1}static get validators(){return[...super.validators,Ki()]}get value(){return this._value??"on"}set value(e){this._value=e}handleSizeChange(){$n(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})}handleKeyDown(e){const t=this.localize.dir()==="rtl";e.key==="ArrowLeft"&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))})),e.key==="ArrowRight"&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has("value")||e.has("checked")||e.has("defaultChecked")||e.has("disabled"))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set("checked",this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??"on",t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){const e=this.hasSlotController.test("hint","withHint"),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:Or(this.checked);return G`
      <label
        part="base switch"
        class=${$t({checked:this.checked,disabled:this.disabled})}
      >
        <input
          class="input"
          type="checkbox"
          title=${this.title}
          name=${kt(this.name)}
          value=${kt(this.value)}
          .checked=${kt(o)}
          ?checked=${n}
          ?disabled=${this.disabled}
          ?required=${this.required}
          role="switch"
          aria-checked=${this.checked?"true":"false"}
          aria-describedby="hint"
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        />

        <span part="control" class="switch">
          <span part="thumb" class="thumb"></span>
        </span>

        <slot part="label" class="label"></slot>
      </label>

      <slot
        id="hint"
        name="hint"
        part="hint"
        class=${$t({"has-slotted":t})}
        aria-hidden=${t?"false":"true"}
        >${this.hint}</slot
      >
    `}};Be.shadowRootOptions={...In.shadowRootOptions,delegatesFocus:!0};Be.css=[Ya,qn,Cl];y([Ee('input[type="checkbox"]')],Be.prototype,"input",2);y([H()],Be.prototype,"title",2);y([H({reflect:!0})],Be.prototype,"name",2);y([H({reflect:!0})],Be.prototype,"value",1);y([H({reflect:!0})],Be.prototype,"size",2);y([wt("size")],Be.prototype,"handleSizeChange",1);y([H({type:Boolean})],Be.prototype,"disabled",2);y([H({type:Boolean,attribute:!1})],Be.prototype,"checked",1);y([H({type:Boolean,attribute:"checked",reflect:!0})],Be.prototype,"defaultChecked",2);y([H({type:Boolean,reflect:!0})],Be.prototype,"required",2);y([H({attribute:"hint"})],Be.prototype,"hint",2);y([H({attribute:"with-hint",type:Boolean})],Be.prototype,"withHint",2);y([wt(["checked","defaultChecked"])],Be.prototype,"handleStateChange",1);y([wt("disabled",{waitUntilFirstUpdate:!0})],Be.prototype,"handleDisabledChange",1);Be=y([Ye("wa-switch")],Be);Be.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var El=Ve`
  :host {
    --spacing: var(--wa-space-m);
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: block;
  }

  details {
    display: block;
    overflow-anchor: none;
    border: var(--wa-panel-border-width) var(--wa-color-surface-border) var(--wa-panel-border-style);
    background-color: var(--wa-color-surface-default);
    border-radius: var(--wa-panel-border-radius);
    color: var(--wa-color-text-normal);

    /* Print styles */
    @media print {
      background: none;
      border: solid var(--wa-border-width-s) var(--wa-color-surface-border);

      summary {
        list-style: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) details {
    background-color: transparent;
    border-color: transparent;
    border-radius: 0;
  }

  :host([appearance='outlined']) details {
    background-color: var(--wa-color-surface-default);
    border-color: var(--wa-color-surface-border);
  }

  :host([appearance='filled']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-border-quiet);
  }

  :host([disabled]) details {
    opacity: 0.5;
    cursor: not-allowed;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing);
    padding: var(--spacing); /* Add padding here */
    border-radius: calc(var(--wa-panel-border-radius) - var(--wa-panel-border-width));
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;

    &::marker,
    &::-webkit-details-marker {
      display: none;
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-panel-border-width) + var(--wa-focus-ring-offset));
    }
  }

  :host([open]) summary {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  /* 'Start' icon placement */
  :host([icon-placement='start']) summary {
    flex-direction: row-reverse;
    justify-content: start;
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-text-quiet);
    transition: rotate var(--wa-transition-normal) var(--wa-transition-easing);
  }

  :host([open]) [part~='icon'] {
    rotate: 90deg;
  }

  :host([open]:dir(rtl)) [part~='icon'] {
    rotate: -90deg;
  }

  :host([open]) slot[name='expand-icon'],
  :host(:not([open])) slot[name='collapse-icon'] {
    display: none;
  }

  .body.animating {
    overflow: hidden;
  }

  .content {
    display: block;
    box-sizing: border-box; /* Ensure contents don't overflow */
    padding-block-start: var(--spacing);
    padding-inline: var(--spacing); /* Add horizontal padding */
    padding-block-end: var(--spacing); /* Add bottom padding */
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function gs(e,t){return new Promise(n=>{function o(a){a.target===e&&(e.removeEventListener(t,o),n())}e.addEventListener(t,o)})}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qe=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance="outlined",this.iconPlacement="end"}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?"auto":"0",this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(t=>{for(const n of t)n.type==="attributes"&&n.attributeName==="open"&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has("isAnimating")&&this.customStates.set("animating",this.isAnimating)}handleSummaryClick(e){e.composedPath().some(o=>{if(!(o instanceof HTMLElement))return!1;const a=o.tagName?.toLowerCase();return["a","button","input","textarea","select"].includes(a)?!0:o instanceof In?!("disabled"in o)||!o.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&(e.preventDefault(),this.hide()),(e.key==="ArrowDown"||e.key==="ArrowRight")&&(e.preventDefault(),this.show())}closeOthersWithSameName(){if(!this.name)return;this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(n=>{n!==this&&n.open&&(n.open=!1)})}async handleOpenChange(){this.animationGeneration++;const e=this.animationGeneration;if(this.open){this.details.open=!0;const t=new Po;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;const n=ps(getComputedStyle(this.body).getPropertyValue("--show-duration"));if(await Ea(this.body,[{height:"0",opacity:"0"},{height:`${this.body.scrollHeight}px`,opacity:"1"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="auto",this.isAnimating=!1,this.dispatchEvent(new Io)}else{const t=new Do;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;const n=ps(getComputedStyle(this.body).getPropertyValue("--hide-duration"));if(await Ea(this.body,[{height:`${this.body.scrollHeight}px`,opacity:"1"},{height:"0",opacity:"0"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="0",this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new qo)}}async show(){if(!(this.open||this.disabled))return this.open=!0,gs(this,"wa-after-show")}async hide(){if(!(!this.open||this.disabled))return this.open=!1,gs(this,"wa-after-hide")}render(){const e=this.hasUpdated?this.localize.dir()==="rtl":this.dir==="rtl";return G`
      <details part="base details">
        <summary
          part="header"
          role="button"
          aria-expanded=${this.open?"true":"false"}
          aria-controls="content"
          aria-disabled=${this.disabled?"true":"false"}
          tabindex=${this.disabled?"-1":"0"}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <slot name="summary" part="summary">${this.summary}</slot>

          <span part="icon">
            <slot name="expand-icon">
              <wa-icon library="system" variant="solid" name=${e?"chevron-left":"chevron-right"}></wa-icon>
            </slot>
            <slot name="collapse-icon">
              <wa-icon library="system" variant="solid" name=${e?"chevron-left":"chevron-right"}></wa-icon>
            </slot>
          </span>
        </summary>

        <div
          class=${$t({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};Qe.css=El;y([Ee("details")],Qe.prototype,"details",2);y([Ee("summary")],Qe.prototype,"header",2);y([Ee(".body")],Qe.prototype,"body",2);y([Ee(".expand-icon-slot")],Qe.prototype,"expandIconSlot",2);y([Zt()],Qe.prototype,"isAnimating",2);y([H({type:Boolean,reflect:!0})],Qe.prototype,"open",2);y([H()],Qe.prototype,"summary",2);y([H({reflect:!0})],Qe.prototype,"name",2);y([H({type:Boolean,reflect:!0})],Qe.prototype,"disabled",2);y([H({reflect:!0})],Qe.prototype,"appearance",2);y([H({attribute:"icon-placement",reflect:!0})],Qe.prototype,"iconPlacement",2);y([wt("open",{waitUntilFirstUpdate:!0})],Qe.prototype,"handleOpenChange",1);Qe=y([Ye("wa-details")],Qe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Al=class extends Event{constructor(e){super("wa-select",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function*Pr(e=document.activeElement){e!=null&&(yield e,"shadowRoot"in e&&e.shadowRoot&&e.shadowRoot.mode!=="closed"&&(yield*Pr(e.shadowRoot.activeElement)))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Tl=Ve`
  :host {
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);
    display: contents;
  }

  #menu {
    display: flex;
    flex-direction: column;
    width: max-content;
    margin: 0;
    padding: 0.25em;
    border: var(--wa-border-style) var(--wa-border-width-s) var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-surface-raised);
    box-shadow: var(--wa-shadow-m);
    color: var(--wa-color-text-normal);
    text-align: start;
    user-select: none;
    overflow: auto;
    max-width: var(--auto-size-available-width) !important;
    max-height: var(--auto-size-available-height) !important;

    &.show {
      animation: show var(--show-duration) ease;
    }

    &.hide {
      animation: show var(--hide-duration) ease reverse;
    }

    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
      display: block !important;
      margin: 0.25em 0 !important;
      padding: 0.25em 0.75em !important;
      color: var(--wa-color-text-quiet);
      font-family: var(--wa-font-family-body) !important;
      font-weight: var(--wa-font-weight-semibold) !important;
      font-size: var(--wa-font-size-smaller) !important;
    }

    ::slotted(wa-divider) {
      --spacing: 0.25em; /* Component-specific, left as-is */
    }
  }

  wa-popup[data-current-placement^='top'] #menu {
    transform-origin: bottom;
  }

  wa-popup[data-current-placement^='bottom'] #menu {
    transform-origin: top;
  }

  wa-popup[data-current-placement^='left'] #menu {
    transform-origin: right;
  }

  wa-popup[data-current-placement^='right'] #menu {
    transform-origin: left;
  }

  wa-popup[data-current-placement='left-start'] #menu {
    transform-origin: right top;
  }

  wa-popup[data-current-placement='left-end'] #menu {
    transform-origin: right bottom;
  }

  wa-popup[data-current-placement='right-start'] #menu {
    transform-origin: left top;
  }

  wa-popup[data-current-placement='right-end'] #menu {
    transform-origin: left bottom;
  }

  @keyframes show {
    from {
      scale: 0.9;
      opacity: 0;
    }
    to {
      scale: 1;
      opacity: 1;
    }
  }
`;const Jt=Math.min,Ot=Math.max,wo=Math.round,ao=Math.floor,Nt=e=>({x:e,y:e}),Rl={left:"right",right:"left",bottom:"top",top:"bottom"};function Dr(e,t,n){return Ot(e,Jt(t,n))}function Bn(e,t){return typeof e=="function"?e(t):e}function gn(e){return e.split("-")[0]}function Hn(e){return e.split("-")[1]}function qr(e){return e==="x"?"y":"x"}function Qa(e){return e==="y"?"height":"width"}function Rt(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function Za(e){return qr(Rt(e))}function Ll(e,t,n){n===void 0&&(n=!1);const o=Hn(e),a=Za(e),s=Qa(a);let r=a==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(r=yo(r)),[r,yo(r)]}function Ml(e){const t=yo(e);return[Aa(e),t,Aa(t)]}function Aa(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const bs=["left","right"],ws=["right","left"],Ol=["top","bottom"],Nl=["bottom","top"];function zl(e,t,n){switch(e){case"top":case"bottom":return n?t?ws:bs:t?bs:ws;case"left":case"right":return t?Ol:Nl;default:return[]}}function Pl(e,t,n,o){const a=Hn(e);let s=zl(gn(e),n==="start",o);return a&&(s=s.map(r=>r+"-"+a),t&&(s=s.concat(s.map(Aa)))),s}function yo(e){const t=gn(e);return Rl[t]+e.slice(t.length)}function Dl(e){var t,n,o,a;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(a=e.left)!=null?a:0}}function Ir(e){return typeof e!="number"?Dl(e):{top:e,right:e,bottom:e,left:e}}function vo(e){const{x:t,y:n,width:o,height:a}=e;return{width:o,height:a,top:n,left:t,right:t+o,bottom:n+a,x:t,y:n}}function ys(e,t,n){let{reference:o,floating:a}=e;const s=Rt(t),r=Za(t),i=Qa(r),c=gn(t),l=s==="y",d=o.x+o.width/2-a.width/2,u=o.y+o.height/2-a.height/2,g=o[i]/2-a[i]/2;let p;switch(c){case"top":p={x:d,y:o.y-a.height};break;case"bottom":p={x:d,y:o.y+o.height};break;case"right":p={x:o.x+o.width,y:u};break;case"left":p={x:o.x-a.width,y:u};break;default:p={x:o.x,y:o.y}}const f=Hn(t);return f&&(p[r]+=g*(f==="end"?1:-1)*(n&&l?-1:1)),p}async function ql(e,t){var n;t===void 0&&(t={});const{x:o,y:a,platform:s,rects:r,elements:i,strategy:c}=e,{boundary:l="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:g=!1,padding:p=0}=Bn(t,e),f=Ir(p),h=i[g?u==="floating"?"reference":"floating":u],w=vo(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(h)))==null||n?h:h.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(i.floating)),boundary:l,rootBoundary:d,strategy:c})),b=u==="floating"?{x:o,y:a,width:r.floating.width,height:r.floating.height}:r.reference,k=await(s.getOffsetParent==null?void 0:s.getOffsetParent(i.floating)),R=await(s.isElement==null?void 0:s.isElement(k))&&await(s.getScale==null?void 0:s.getScale(k))||{x:1,y:1},E=vo(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:i,rect:b,offsetParent:k,strategy:c}):b);return{top:(w.top-E.top+f.top)/R.y,bottom:(E.bottom-w.bottom+f.bottom)/R.y,left:(w.left-E.left+f.left)/R.x,right:(E.right-w.right+f.right)/R.x}}const Il=50,Bl=async(e,t,n)=>{const{placement:o="bottom",strategy:a="absolute",middleware:s=[],platform:r}=n,i=r.detectOverflow?r:{...r,detectOverflow:ql},c=await(r.isRTL==null?void 0:r.isRTL(t));let l=await r.getElementRects({reference:e,floating:t,strategy:a}),{x:d,y:u}=ys(l,o,c),g=o,p=0;const f={};for(let x=0;x<s.length;x++){const h=s[x];if(!h)continue;const{name:w,fn:b}=h,{x:k,y:R,data:E,reset:P}=await b({x:d,y:u,initialPlacement:o,placement:g,strategy:a,middlewareData:f,rects:l,platform:i,elements:{reference:e,floating:t}});d=k??d,u=R??u,f[w]={...f[w],...E},P&&p<Il&&(p++,typeof P=="object"&&(P.placement&&(g=P.placement),P.rects&&(l=P.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:a}):P.rects),{x:d,y:u}=ys(l,g,c)),x=-1)}return{x:d,y:u,placement:g,strategy:a,middlewareData:f}},Hl=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:a,rects:s,platform:r,elements:i,middlewareData:c}=t,{element:l,padding:d=0}=Bn(e,t)||{};if(l==null)return{};const u=Ir(d),g={x:n,y:o},p=Za(a),f=Qa(p),x=await r.getDimensions(l),h=p==="y",w=h?"top":"left",b=h?"bottom":"right",k=h?"clientHeight":"clientWidth",R=s.reference[f]+s.reference[p]-g[p]-s.floating[f],E=g[p]-s.reference[p],P=await(r.getOffsetParent==null?void 0:r.getOffsetParent(l));let Z=P?P[k]:0;(!Z||!await(r.isElement==null?void 0:r.isElement(P)))&&(Z=i.floating[k]||s.floating[f]);const Q=R/2-E/2,te=Z/2-x[f]/2-1,T=Jt(u[w],te),V=Jt(u[b],te),q=Z-x[f]-V,m=Z/2-x[f]/2+Q,D=Dr(T,m,q),F=!c.arrow&&Hn(a)!=null&&m!==D&&s.reference[f]/2-(m<T?T:V)-x[f]/2<0,N=F?m<T?m-T:m-q:0;return{[p]:g[p]+N,data:{[p]:D,centerOffset:m-D-N,...F&&{alignmentOffset:N}},reset:F}}}),Fl=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:a,middlewareData:s,rects:r,initialPlacement:i,platform:c,elements:l}=t,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:g,fallbackStrategy:p="bestFit",fallbackAxisSideDirection:f="none",flipAlignment:x=!0,...h}=Bn(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const w=gn(a),b=Rt(i),k=gn(i)===i,R=await(c.isRTL==null?void 0:c.isRTL(l.floating)),E=g||(k||!x?[yo(i)]:Ml(i)),P=f!=="none";!g&&P&&E.push(...Pl(i,x,f,R));const Z=[i,...E],Q=await c.detectOverflow(t,h),te=[];let T=((o=s.flip)==null?void 0:o.overflows)||[];if(d&&te.push(Q[w]),u){const D=Ll(a,r,R);te.push(Q[D[0]],Q[D[1]])}if(T=[...T,{placement:a,overflows:te}],!te.every(D=>D<=0)){var V,q;const D=(((V=s.flip)==null?void 0:V.index)||0)+1,F=Z[D];if(F&&(!(u==="alignment"?b!==Rt(F):!1)||T.every(U=>Rt(U.placement)===b?U.overflows[0]>0:!0)))return{data:{index:D,overflows:T},reset:{placement:F}};let N=(q=T.filter(W=>W.overflows[0]<=0).sort((W,U)=>W.overflows[1]-U.overflows[1])[0])==null?void 0:q.placement;if(!N)switch(p){case"bestFit":{var m;const W=(m=T.filter(U=>{if(P){const ee=Rt(U.placement);return ee===b||ee==="y"}return!0}).map(U=>[U.placement,U.overflows.filter(ee=>ee>0).reduce((ee,se)=>ee+se,0)]).sort((U,ee)=>U[1]-ee[1])[0])==null?void 0:m[0];W&&(N=W);break}case"initialPlacement":N=i;break}if(a!==N)return{reset:{placement:N}}}return{}}}},jl=new Set(["left","top"]);async function Wl(e,t){const{placement:n,platform:o,elements:a}=e,s=await(o.isRTL==null?void 0:o.isRTL(a.floating)),r=gn(n),i=Hn(n),c=Rt(n)==="y",l=jl.has(r)?-1:1,d=s&&c?-1:1,u=Bn(t,e);let{mainAxis:g,crossAxis:p,alignmentAxis:f}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return i&&typeof f=="number"&&(p=i==="end"?f*-1:f),c?{x:p*d,y:g*l}:{x:g*l,y:p*d}}const Ul=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:a,y:s,placement:r,middlewareData:i}=t,c=await Wl(t,e);return r===((n=i.offset)==null?void 0:n.placement)&&(o=i.arrow)!=null&&o.alignmentOffset?{}:{x:a+c.x,y:s+c.y,data:{...c,placement:r}}}}},Vl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:a,platform:s}=t,{mainAxis:r=!0,crossAxis:i=!1,limiter:c={fn:b=>{let{x:k,y:R}=b;return{x:k,y:R}}},...l}=Bn(e,t),d={x:n,y:o},u=await s.detectOverflow(t,l),g=Rt(a),p=qr(g);let f=d[p],x=d[g];const h=(b,k)=>Dr(k+u[b==="y"?"top":"left"],k,k-u[b==="y"?"bottom":"right"]);r&&(f=h(p,f)),i&&(x=h(g,x));const w=c.fn({...t,[p]:f,[g]:x});return{...w,data:{x:w.x-n,y:w.y-o,enabled:{[p]:r,[g]:i}}}}}},Kl=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:a,elements:s}=t,{apply:r=()=>{},...i}=Bn(e,t),c=await a.detectOverflow(t,i),l=gn(n),d=Hn(n),u=Rt(n)==="y",{width:g,height:p}=o.floating;let f,x;l==="top"||l==="bottom"?(f=l,x=d===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(x=l,f=d==="end"?"top":"bottom");const h=p-c.top-c.bottom,w=g-c.left-c.right,b=Jt(p-c[f],h),k=Jt(g-c[x],w),R=t.middlewareData.shift,E=!R;let P=b,Z=k;R!=null&&R.enabled.x&&(Z=w),R!=null&&R.enabled.y&&(P=h),E&&!d&&(u?Z=g-2*Ot(c.left,c.right):P=p-2*Ot(c.top,c.bottom)),await r({...t,availableWidth:Z,availableHeight:P});const Q=await a.getDimensions(s.floating);return g!==Q.width||p!==Q.height?{reset:{rects:!0}}:{}}}};function Bo(){return typeof window<"u"}function Fn(e){return Br(e)?(e.nodeName||"").toLowerCase():"#document"}function nt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Dt(e){var t;return(t=(Br(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Br(e){return Bo()?e instanceof Node||e instanceof nt(e).Node:!1}function _t(e){return Bo()?e instanceof Element||e instanceof nt(e).Element:!1}function en(e){return Bo()?e instanceof HTMLElement||e instanceof nt(e).HTMLElement:!1}function vs(e){return!Bo()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof nt(e).ShadowRoot}function Ho(e){const{overflow:t,overflowX:n,overflowY:o,display:a}=Ct(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&a!=="inline"&&a!=="contents"}function Jl(e){return/^(table|td|th)$/.test(Fn(e))}function Fo(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Yl=/transform|translate|scale|rotate|perspective|filter/,Gl=/paint|layout|strict|content/,sn=e=>!!e&&e!=="none";let ra;function jo(e){const t=_t(e)?Ct(e):e;return sn(t.transform)||sn(t.translate)||sn(t.scale)||sn(t.rotate)||sn(t.perspective)||!es()&&(sn(t.backdropFilter)||sn(t.filter))||Yl.test(t.willChange||"")||Gl.test(t.contain||"")}function Xl(e){let t=bn(e);for(;en(t)&&!Zn(t);){if(jo(t))return t;if(Fo(t))return null;t=bn(t)}return null}function es(){return ra==null&&(ra=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),ra}function Zn(e){return/^(html|body|#document)$/.test(Fn(e))}function Ct(e){return nt(e).getComputedStyle(e)}function Wo(e){return _t(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function bn(e){if(Fn(e)==="html")return e;const t=e.assignedSlot||e.parentNode||vs(e)&&e.host||Dt(e);return vs(t)?t.host:t}function Hr(e){const t=bn(e);return Zn(t)?(e.ownerDocument||e).body:en(t)&&Ho(t)?t:Hr(t)}function Rn(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const a=Hr(e),s=a===((o=e.ownerDocument)==null?void 0:o.body),r=nt(a);if(s){const i=Ta(r);return t.concat(r,r.visualViewport||[],Ho(a)?a:[],i&&n?Rn(i):[])}else return t.concat(a,Rn(a,[],n))}function Ta(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Fr(e){const t=Ct(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const a=en(e),s=a?e.offsetWidth:n,r=a?e.offsetHeight:o,i=wo(n)!==s||wo(o)!==r;return i&&(n=s,o=r),{width:n,height:o,$:i}}function ts(e){return _t(e)?e:e.contextElement}function Tn(e){const t=ts(e);if(!en(t))return Nt(1);const n=t.getBoundingClientRect(),{width:o,height:a,$:s}=Fr(t);let r=(s?wo(n.width):n.width)/o,i=(s?wo(n.height):n.height)/a;return(!r||!Number.isFinite(r))&&(r=1),(!i||!Number.isFinite(i))&&(i=1),{x:r,y:i}}const Ql=Nt(0);function jr(e){const t=nt(e);return!es()||!t.visualViewport?Ql:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Zl(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===nt(e)}function wn(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const a=e.getBoundingClientRect(),s=ts(e);let r=Nt(1);t&&(o?_t(o)&&(r=Tn(o)):r=Tn(e));const i=Zl(s,n,o)?jr(s):Nt(0);let c=(a.left+i.x)/r.x,l=(a.top+i.y)/r.y,d=a.width/r.x,u=a.height/r.y;if(s&&o){const g=nt(s),p=_t(o)?nt(o):o;let f=g,x=Ta(f);for(;x&&p!==f;){const h=Tn(x),w=x.getBoundingClientRect(),b=Ct(x),k=w.left+(x.clientLeft+parseFloat(b.paddingLeft))*h.x,R=w.top+(x.clientTop+parseFloat(b.paddingTop))*h.y;c*=h.x,l*=h.y,d*=h.x,u*=h.y,c+=k,l+=R,f=nt(x),x=Ta(f)}}return vo({width:d,height:u,x:c,y:l})}function Uo(e,t){const n=Wo(e).scrollLeft;return t?t.left+n:wn(Dt(e)).left+n}function Wr(e,t){const n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-Uo(e,n),a=n.top+t.scrollTop;return{x:o,y:a}}function ec(e){let{elements:t,rect:n,offsetParent:o,strategy:a}=e;const s=a==="fixed",r=Dt(o),i=t?Fo(t.floating):!1;if(o===r||i&&s)return n;let c={scrollLeft:0,scrollTop:0},l=Nt(1);const d=Nt(0),u=en(o);if((u||!s)&&((Fn(o)!=="body"||Ho(r))&&(c=Wo(o)),u)){const p=wn(o);l=Tn(o),d.x=p.x+o.clientLeft,d.y=p.y+o.clientTop}const g=r&&!u&&!s?Wr(r,c):Nt(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+d.x+g.x,y:n.y*l.y-c.scrollTop*l.y+d.y+g.y}}function tc(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function nc(e){const t=Wo(e),n=e.ownerDocument.body,o=Ot(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),a=Ot(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+Uo(e);const r=-t.scrollTop;return Ct(n).direction==="rtl"&&(s+=Ot(e.clientWidth,n.clientWidth)-o),{width:o,height:a,x:s,y:r}}const oc=25;function ac(e,t,n){n===void 0&&(n="viewport");const o=n==="layoutViewport",a=nt(e),s=Dt(e),r=a.visualViewport;let i=s.clientWidth,c=s.clientHeight,l=0,d=0;if(r){const g=!es()||t==="fixed";o?g||(l=-r.offsetLeft,d=-r.offsetTop):(i=r.width,c=r.height,g&&(l=r.offsetLeft,d=r.offsetTop))}if(Uo(s)<=0){const g=s.ownerDocument,p=g.body,f=getComputedStyle(p),x=g.compatMode==="CSS1Compat"&&parseFloat(f.marginLeft)+parseFloat(f.marginRight)||0,h=Math.abs(s.clientWidth-p.clientWidth-x),w=getComputedStyle(s).scrollbarGutter==="stable both-edges"?h/2:h;w<=oc&&(i-=w)}return{width:i,height:c,x:l,y:d}}function sc(e,t){const n=wn(e,!0,t==="fixed"),o=n.top+e.clientTop,a=n.left+e.clientLeft,s=Tn(e),r=e.clientWidth*s.x,i=e.clientHeight*s.y,c=a*s.x,l=o*s.y;return{width:r,height:i,x:c,y:l}}function ks(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=ac(e,n,t);else if(t==="document")o=nc(Dt(e));else if(_t(t))o=sc(t,n);else{const a=jr(e);o={x:t.x-a.x,y:t.y-a.y,width:t.width,height:t.height}}return vo(o)}function rc(e,t){const n=t.get(e);if(n)return n;let o=Rn(e,[],!1).filter(i=>_t(i)&&Fn(i)!=="body"),a=null;const s=Ct(e).position==="fixed";let r=s?bn(e):e;for(;_t(r)&&!Zn(r);){const i=Ct(r),c=jo(r),l=a?a.position:s?"fixed":"";!c&&(l==="fixed"||l==="absolute"&&i.position==="static")?o=o.filter(u=>u!==r):a=i,r=bn(r)}return t.set(e,o),o}function ic(e){let{element:t,boundary:n,rootBoundary:o,strategy:a}=e;const r=[...n==="clippingAncestors"?Fo(t)?[]:rc(t,this._c):[].concat(n),o],i=ks(t,r[0],a);let c=i.top,l=i.right,d=i.bottom,u=i.left;for(let g=1;g<r.length;g++){const p=ks(t,r[g],a);c=Ot(p.top,c),l=Jt(p.right,l),d=Jt(p.bottom,d),u=Ot(p.left,u)}return{width:l-u,height:d-c,x:u,y:c}}function lc(e){const{width:t,height:n}=Fr(e);return{width:t,height:n}}function cc(e,t,n){const o=en(t),a=Dt(t),s=n==="fixed",r=wn(e,!0,s,t);let i={scrollLeft:0,scrollTop:0};const c=Nt(0);if((o||!s)&&((Fn(t)!=="body"||Ho(a))&&(i=Wo(t)),o)){const g=wn(t,!0,s,t);c.x=g.x+t.clientLeft,c.y=g.y+t.clientTop}!o&&a&&(c.x=Uo(a));const l=a&&!o&&!s?Wr(a,i):Nt(0),d=r.left+i.scrollLeft-c.x-l.x,u=r.top+i.scrollTop-c.y-l.y;return{x:d,y:u,width:r.width,height:r.height}}function ia(e){return Ct(e).position==="static"}function $s(e,t){if(!en(e)||Ct(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return Dt(e)===n&&(n=n.ownerDocument.body),n}function Ur(e,t){const n=nt(e);if(Fo(e))return n;if(!en(e)){let a=bn(e);for(;a&&!Zn(a);){if(_t(a)&&!ia(a))return a;a=bn(a)}return n}let o=$s(e,t);for(;o&&Jl(o)&&ia(o);)o=$s(o,t);return o&&Zn(o)&&ia(o)&&!jo(o)?n:o||Xl(e)||n}const dc=async function(e){const t=this.getOffsetParent||Ur,n=this.getDimensions,o=await n(e.floating);return{reference:cc(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function uc(e){return Ct(e).direction==="rtl"}const ho={convertOffsetParentRelativeRectToViewportRelativeRect:ec,getDocumentElement:Dt,getClippingRect:ic,getOffsetParent:Ur,getElementRects:dc,getClientRects:tc,getDimensions:lc,getScale:Tn,isElement:_t,isRTL:uc};function Vr(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function hc(e,t,n){let o=null,a;const s=Dt(e);function r(){var d;clearTimeout(a),(d=o)==null||d.disconnect(),o=null}function i(d,u){d===void 0&&(d=!1),u===void 0&&(u=1),r();const g=e.getBoundingClientRect(),{left:p,top:f,width:x,height:h}=g;if(d||t(),!x||!h)return;const w=ao(f),b=ao(s.clientWidth-(p+x)),k=ao(s.clientHeight-(f+h)),R=ao(p),P={rootMargin:-w+"px "+-b+"px "+-k+"px "+-R+"px",threshold:Ot(0,Jt(1,u))||1};let Z=!0;function Q(te){const T=te[0].intersectionRatio;if(!Vr(g,e.getBoundingClientRect()))return i();if(T!==u){if(!Z)return i();T?i(!1,T):a=setTimeout(()=>{i(!1,1e-7)},1e3)}Z=!1}try{o=new IntersectionObserver(Q,{...P,root:s.ownerDocument})}catch{o=new IntersectionObserver(Q,P)}o.observe(e)}const c=nt(e),l=()=>i(n);return c.addEventListener("resize",l),i(!0),()=>{c.removeEventListener("resize",l),r()}}function Kr(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:a=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:i=typeof IntersectionObserver=="function",animationFrame:c=!1}=o,l=ts(e),d=a||s?[...l?Rn(l):[],...t?Rn(t):[]]:[];d.forEach(w=>{a&&w.addEventListener("scroll",n),s&&w.addEventListener("resize",n)});const u=l&&i?hc(l,n,s):null;let g=-1,p=null;r&&(p=new ResizeObserver(w=>{let[b]=w;b&&b.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var k;(k=p)==null||k.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let f,x=c?wn(e):null;c&&h();function h(){const w=wn(e);x&&!Vr(x,w)&&n(),x=w,f=requestAnimationFrame(h)}return n(),()=>{var w;d.forEach(b=>{a&&b.removeEventListener("scroll",n),s&&b.removeEventListener("resize",n)}),u?.(),(w=p)==null||w.disconnect(),p=null,c&&cancelAnimationFrame(f)}}const Jr=Ul,Yr=Vl,Gr=Fl,xs=Kl,pc=Hl,Xr=(e,t,n)=>{const o=new Map,a=n??{},s={...ho,...a.platform,_c:o};return Bl(e,t,{...a,platform:s})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var la=new Set,Xe=class extends st{constructor(){super(...arguments),this.submenuCleanups=new Map,this.localize=new Et(this),this.userTypedQuery="",this.openSubmenuStack=[],this.open=!1,this.size="m",this.placement="bottom-start",this.distance=0,this.skidding=0,this.handleDocumentKeyDown=async e=>{const t=this.localize.dir()==="rtl";if(e.key==="Escape"&&this.open&&Ca(this)){const d=this.getTrigger();e.preventDefault(),e.stopPropagation(),this.open=!1,d?.focus({preventScroll:!0});return}const n=[...Pr()].find(d=>d.localName==="wa-dropdown-item"),o=n?.localName==="wa-dropdown-item",a=this.getCurrentSubmenuItem(),s=!!a;let r,i,c;s?(r=this.getSubmenuItems(a),i=r.find(d=>d.active||d===n),c=i?r.indexOf(i):-1):(r=this.getItems(),i=r.find(d=>d.active||d===n),c=i?r.indexOf(i):-1);let l;if(e.key==="ArrowUp"&&(e.preventDefault(),e.stopPropagation(),c>0?l=r[c-1]:l=r[r.length-1]),e.key==="ArrowDown"&&(e.preventDefault(),e.stopPropagation(),c!==-1&&c<r.length-1?l=r[c+1]:l=r[0]),e.key===(t?"ArrowLeft":"ArrowRight")&&o&&i&&i.hasSubmenu){e.preventDefault(),e.stopPropagation(),i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0);return}if(e.key===(t?"ArrowRight":"ArrowLeft")&&s){e.preventDefault(),e.stopPropagation();const d=this.removeFromSubmenuStack();d&&(d.submenuOpen=!1,setTimeout(()=>{d.focus({preventScroll:!0}),d.active=!0,(d.slot==="submenu"?this.getSubmenuItems(d.parentElement):this.getItems()).forEach(g=>{g!==d&&(g.active=!1)})},0));return}if((e.key==="Home"||e.key==="End")&&(e.preventDefault(),e.stopPropagation(),l=e.key==="Home"?r[0]:r[r.length-1]),e.key==="Tab"&&await this.hideMenu(),e.key.length===1&&!(e.metaKey||e.ctrlKey||e.altKey)&&!(e.key===" "&&this.userTypedQuery==="")&&(clearTimeout(this.userTypedTimeout),this.userTypedTimeout=setTimeout(()=>{this.userTypedQuery=""},1e3),this.userTypedQuery+=e.key,r.some(d=>{const u=(d.textContent||"").trim().toLowerCase(),g=this.userTypedQuery.trim().toLowerCase();return u.startsWith(g)?(l=d,!0):!1})),l){e.preventDefault(),e.stopPropagation(),r.forEach(d=>d.active=d===l),l.focus({preventScroll:!0}),l.scrollIntoView({block:"nearest"});return}(e.key==="Enter"||e.key===" "&&this.userTypedQuery==="")&&o&&i&&(e.preventDefault(),e.stopPropagation(),i.hasSubmenu?(i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0)):this.makeSelection(i,e))},this.handleDocumentPointerDown=e=>{e.composedPath().some(o=>o instanceof HTMLElement?o===this||o.closest('wa-dropdown, [part="submenu"]'):!1)||(this.open=!1)},this.handleGlobalMouseMove=e=>{const t=this.getCurrentSubmenuItem();if(!t?.submenuOpen||!t.submenuElement)return;const n=t.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl",a=o?n.right:n.left,s=o?Math.max(e.clientX,a):Math.min(e.clientX,a),r=Math.max(n.top,Math.min(e.clientY,n.bottom));t.submenuElement.style.setProperty("--safe-triangle-cursor-x",`${s}px`),t.submenuElement.style.setProperty("--safe-triangle-cursor-y",`${r}px`);const i=e.composedPath(),c=t.matches(":hover"),l=!!t.submenuElement?.matches(":hover"),d=c||!!i.find(g=>g===t),u=l||!!i.find(g=>g instanceof HTMLElement&&g.closest('[part="submenu"]')===t.submenuElement);!d&&!u&&setTimeout(()=>{!c&&!l&&(t.submenuOpen=!1)},100)}}handleSizeChange(){$n(this.localName,this.size)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.userTypedTimeout),this.closeAllSubmenus(),this.submenuCleanups.forEach(e=>e()),this.submenuCleanups.clear(),document.removeEventListener("mousemove",this.handleGlobalMouseMove),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),bo(this)}firstUpdated(e){super.firstUpdated(e),this.syncAriaAttributes()}async updated(e){if(e.has("open")){const t=e.get("open");if(t===this.open||t===void 0&&this.open===!1)return;this.customStates.set("open",this.open),this.open?await this.showMenu():(this.closeAllSubmenus(),await this.hideMenu())}e.has("size")&&this.syncItemSizes()}getItems(e=!1){const t=(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(n=>n.localName==="wa-dropdown-item");return e?t:t.filter(n=>!n.disabled)}getSubmenuItems(e,t=!1){const n=e.shadowRoot?.querySelector('slot[name="submenu"]')||e.querySelector('slot[name="submenu"]');if(!n)return[];const o=n.assignedElements({flatten:!0}).filter(a=>a.localName==="wa-dropdown-item");return t?o:o.filter(a=>!a.disabled)}syncItemSizes(){(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(t=>t.localName==="wa-dropdown-item").forEach(t=>t.size=this.size)}addToSubmenuStack(e){const t=this.openSubmenuStack.indexOf(e);t!==-1?this.openSubmenuStack=this.openSubmenuStack.slice(0,t+1):this.openSubmenuStack.push(e)}removeFromSubmenuStack(){return this.openSubmenuStack.pop()}getCurrentSubmenuItem(){return this.openSubmenuStack.length>0?this.openSubmenuStack[this.openSubmenuStack.length-1]:void 0}closeAllSubmenus(){this.getItems(!0).forEach(t=>{t.submenuOpen=!1}),this.openSubmenuStack=[]}closeSiblingSubmenus(e){const t=e.closest('wa-dropdown-item:not([slot="submenu"])');let n;t?n=this.getSubmenuItems(t,!0):n=this.getItems(!0),n.forEach(o=>{o!==e&&o.submenuOpen&&(o.submenuOpen=!1)}),this.openSubmenuStack.includes(e)||this.openSubmenuStack.push(e)}getTrigger(){return this.querySelector('[slot="trigger"]')}async showMenu(){if(!this.getTrigger()||!this.popup||!this.menu)return;const t=new Po;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1;return}if(this.popup.active)return;la.forEach(o=>o.open=!1),this.popup.active=!0,this.open=!0,la.add(this),Nr(this),this.syncAriaAttributes(),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("pointerdown",this.handleDocumentPointerDown),document.addEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("hide"),await vt(this.menu,"show");const n=this.getItems();n.length>0&&(n.forEach((o,a)=>o.active=a===0),n[0].focus({preventScroll:!0})),this.dispatchEvent(new Io)}async hideMenu(){if(!this.popup||!this.menu)return;const e=new Do({source:this});if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}this.open=!1,la.delete(this),bo(this),this.syncAriaAttributes(),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),document.removeEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("show"),await vt(this.menu,"hide"),this.popup.active=this.open,this.dispatchEvent(new qo)}handleMenuClick(e){const t=e.target.closest("wa-dropdown-item");if(!(!t||t.disabled)){if(t.hasSubmenu){t.submenuOpen||(this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),t.submenuOpen=!0),e.stopPropagation();return}this.makeSelection(t,e)}}async handleMenuSlotChange(){const e=this.getItems(!0);await Promise.all(e.map(o=>o.updateComplete)),this.syncItemSizes();const t=e.some(o=>o.type==="checkbox"),n=e.some(o=>o.hasSubmenu);e.forEach((o,a)=>{o.setAttribute("aria-posinset",String(a+1)),o.setAttribute("aria-setsize",String(e.length)),o.active=a===0,o.checkboxAdjacent=t,o.submenuAdjacent=n})}handleTriggerClick(){this.open=!this.open}handleSubmenuOpening(e){const t=e.detail.item;this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),this.setupSubmenuPosition(t),this.processSubmenuItems(t)}setupSubmenuPosition(e){if(!e.submenuElement)return;this.cleanupSubmenuPosition(e);const t=Kr(e,e.submenuElement,()=>{this.positionSubmenu(e),this.updateSafeTriangleCoordinates(e)});this.submenuCleanups.set(e,t);const n=e.submenuElement.querySelector('slot[name="submenu"]');n&&(n.removeEventListener("slotchange",Xe.handleSubmenuSlotChange),n.addEventListener("slotchange",Xe.handleSubmenuSlotChange),Xe.handleSubmenuSlotChange({target:n}))}static handleSubmenuSlotChange(e){const t=e.target;if(!t)return;const n=t.assignedElements().filter(s=>s.localName==="wa-dropdown-item");if(n.length===0)return;const o=n.some(s=>s.hasSubmenu),a=n.some(s=>s.type==="checkbox");n.forEach(s=>{s.submenuAdjacent=o,s.checkboxAdjacent=a})}processSubmenuItems(e){if(!e.submenuElement)return;const t=this.getSubmenuItems(e,!0),n=t.some(o=>o.hasSubmenu);t.forEach(o=>{o.submenuAdjacent=n})}cleanupSubmenuPosition(e){const t=this.submenuCleanups.get(e);t&&(t(),this.submenuCleanups.delete(e))}positionSubmenu(e){if(!e.submenuElement)return;const n=this.localize.dir()==="rtl"?"left-start":"right-start";Xr(e,e.submenuElement,{placement:n,middleware:[Jr({mainAxis:0,crossAxis:-5}),Gr({fallbackStrategy:"bestFit"}),Yr({padding:8,crossAxis:!0})]}).then(({x:o,y:a,placement:s})=>{e.submenuElement.setAttribute("data-placement",s),Object.assign(e.submenuElement.style,{left:`${o}px`,top:`${a}px`})})}updateSafeTriangleCoordinates(e){if(!e.submenuElement||!e.submenuOpen)return;if(document.activeElement?.matches(":focus-visible")){e.submenuElement.style.setProperty("--safe-triangle-visible","none");return}e.submenuElement.style.setProperty("--safe-triangle-visible","block");const n=e.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl";e.submenuElement.style.setProperty("--safe-triangle-submenu-start-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-start-y",`${n.top}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-y",`${n.bottom}px`)}makeSelection(e,t){const n=this.getTrigger();if(e.disabled)return;e.type==="checkbox"&&(e.checked=!e.checked);const o=new Al({item:e});this.dispatchEvent(o),o.defaultPrevented||(e.navigate(t),this.open=!1,n?.focus({preventScroll:!0}))}async syncAriaAttributes(){const e=this.getTrigger();let t;e&&(e.localName==="wa-button"?(await customElements.whenDefined("wa-button"),await e.updateComplete,t=e.shadowRoot.querySelector('[part~="base"]')):t=e,t.hasAttribute("id")||t.setAttribute("id",Xa("wa-dropdown-trigger-")),t.setAttribute("aria-haspopup","menu"),t.setAttribute("aria-expanded",this.open?"true":"false"),this.menu?.setAttribute("aria-expanded","false"))}render(){let e=this.didSSR&&!this.hasUpdated?this.open:this.popup?.active;return G`
      <wa-popup
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        ?active=${e}
        flip
        flip-fallback-strategy="best-fit"
        shift
        shift-padding="10"
        auto-size="vertical"
        auto-size-padding="10"
      >
        <slot
          name="trigger"
          slot="anchor"
          @click=${this.handleTriggerClick}
          @slotchange=${this.syncAriaAttributes}
        ></slot>
        <div
          id="menu"
          part="menu"
          role="menu"
          tabindex="-1"
          aria-orientation="vertical"
          @click=${this.handleMenuClick}
          @submenu-opening=${this.handleSubmenuOpening}
        >
          <slot @slotchange=${this.handleMenuSlotChange}></slot>
        </div>
      </wa-popup>
    `}};Xe.css=[qn,Tl];y([Ee("slot:not([name])")],Xe.prototype,"defaultSlot",2);y([Ee("#menu")],Xe.prototype,"menu",2);y([Ee("wa-popup")],Xe.prototype,"popup",2);y([H({type:Boolean,reflect:!0})],Xe.prototype,"open",2);y([H({reflect:!0})],Xe.prototype,"size",2);y([wt("size")],Xe.prototype,"handleSizeChange",1);y([H({reflect:!0})],Xe.prototype,"placement",2);y([H({type:Number})],Xe.prototype,"distance",2);y([H({type:Number})],Xe.prototype,"skidding",2);Xe=y([Ye("wa-dropdown")],Xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var fc=Ve`
  :host {
    display: flex;
    position: relative;
    align-items: center;
    padding: 0.5em 1em;
    border-radius: var(--wa-border-radius-s);
    isolation: isolate;
    color: var(--wa-color-text-normal);
    line-height: var(--wa-line-height-condensed);
    cursor: pointer;
    transition:
      var(--wa-transition-fast) background-color var(--wa-transition-easing),
      var(--wa-transition-fast) color var(--wa-transition-easing);
  }

  @media (hover: hover) {
    :host(:hover:not(:state(disabled))) {
      background-color: var(--wa-color-neutral-fill-normal);
    }
  }

  :host(:state(submenu-open)) {
    background-color: var(--wa-color-neutral-fill-normal);
  }

  :host(:focus-visible) {
    z-index: 1;
    outline: var(--wa-focus-ring);
    background-color: var(--wa-color-neutral-fill-normal);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Danger variant */
  :host([variant='danger']),
  :host([variant='danger']) #details {
    color: var(--wa-color-danger-on-quiet);
  }

  @media (hover: hover) {
    :host([variant='danger']:hover) {
      background-color: var(--wa-color-danger-fill-normal);
      color: var(--wa-color-danger-on-normal);
    }
  }

  :host([variant='danger']:state(submenu-open)),
  :host([variant='danger']:focus-visible) {
    background-color: var(--wa-color-danger-fill-normal);
    color: var(--wa-color-danger-on-normal);
  }

  :host([checkbox-adjacent]) {
    padding-inline-start: 2em;
  }

  /* Only add padding when item actually has a submenu */
  :host([submenu-adjacent]:not(:state(has-submenu))) #details {
    padding-inline-end: 0;
  }

  :host(:state(has-submenu)[submenu-adjacent]) #details {
    padding-inline-end: 1.75em;
  }

  /* The link only exists to be clicked programmatically. */
  #link {
    display: none;
  }

  #check {
    visibility: hidden;
    margin-inline-start: -1.5em;
    margin-inline-end: 0.5em;
    font-size: var(--wa-font-size-smaller);
  }

  :host(:state(checked)) #check {
    visibility: visible;
  }

  #icon ::slotted(*) {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    margin-inline-end: 0.75em !important;
    font-size: var(--wa-font-size-smaller);
  }

  #label {
    flex: 1 1 auto;
    min-width: 0;
  }

  #details {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: end;
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-smaller) !important;
  }

  #details ::slotted(*) {
    margin-inline-start: 2em !important;
  }

  /* Submenu indicator icon */
  #submenu-indicator {
    position: absolute;
    inset-inline-end: 1em;
    color: var(--wa-color-neutral-on-quiet);
    font-size: var(--wa-font-size-smaller);
  }

  /* Flip chevron icon when RTL */
  :host(:dir(rtl)) #submenu-indicator {
    transform: scaleX(-1);
  }

  /* Submenu styles */
  #submenu {
    display: flex;
    z-index: 10;
    position: absolute;
    top: 0;
    left: 0;
    flex-direction: column;
    width: max-content;
    margin: 0;
    padding: 0.25em;
    border: var(--wa-border-style) var(--wa-border-width-s) var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    background-color: var(--wa-color-surface-raised);
    box-shadow: var(--wa-shadow-m);
    color: var(--wa-color-text-normal);
    text-align: start;
    user-select: none;

    /* Override default popover styles */
    &[popover] {
      margin: 0;
      inset: auto;
      padding: 0.25em;
      overflow: visible;
      border-radius: var(--wa-border-radius-m);
    }

    &.show {
      animation: submenu-show var(--show-duration, var(--wa-transition-fast)) ease;
    }

    &.hide {
      animation: submenu-show var(--show-duration, var(--wa-transition-fast)) ease reverse;
    }

    /* Submenu placement transform origins */
    &[data-placement^='top'] {
      transform-origin: bottom;
    }

    &[data-placement^='bottom'] {
      transform-origin: top;
    }

    &[data-placement^='left'] {
      transform-origin: right;
    }

    &[data-placement^='right'] {
      transform-origin: left;
    }

    &[data-placement='left-start'] {
      transform-origin: right top;
    }

    &[data-placement='left-end'] {
      transform-origin: right bottom;
    }

    &[data-placement='right-start'] {
      transform-origin: left top;
    }

    &[data-placement='right-end'] {
      transform-origin: left bottom;
    }

    /* Safe triangle styling */
    &::before {
      display: none;
      z-index: 9;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-color: transparent;
      content: '';
      clip-path: polygon(
        var(--safe-triangle-cursor-x, 0) var(--safe-triangle-cursor-y, 0),
        var(--safe-triangle-submenu-start-x, 0) var(--safe-triangle-submenu-start-y, 0),
        var(--safe-triangle-submenu-end-x, 0) var(--safe-triangle-submenu-end-y, 0)
      );
      pointer-events: auto; /* Enable mouse events on the triangle */
    }

    &[data-visible]::before {
      display: block;
    }
  }

  ::slotted(wa-dropdown-item) {
    font-size: inherit;
  }

  ::slotted(wa-divider) {
    --spacing: 0.25em;
  }

  @keyframes submenu-show {
    from {
      scale: 0.9;
      opacity: 0;
    }
    to {
      scale: 1;
      opacity: 1;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pe=class extends st{constructor(){super(...arguments),this.hasSlotController=new Dn(this,"[default]","start","end"),this.active=!1,this.variant="default",this.size="m",this.checkboxAdjacent=!1,this.submenuAdjacent=!1,this.type="normal",this.checked=!1,this.disabled=!1,this.submenuOpen=!1,this.hasSubmenu=!1,this.handleSlotChange=()=>{this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState(),this.hasSubmenu?(this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",this.submenuOpen?"true":"false")):(this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"))},this.handleHostClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handleClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handlePointerEnter=e=>{e.pointerType==="mouse"&&this.hasSubmenu&&!this.disabled&&(this.notifyParentOfOpening(),this.submenuOpen=!0)}}handleSizeChange(){$n(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener?.("click",this.handleHostClick),this.addEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.addEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}disconnectedCallback(){super.disconnectedCallback(),this.closeSubmenu(),this.removeEventListener?.("click",this.handleHostClick),this.removeEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.removeEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}firstUpdated(e){super.firstUpdated(e),this.setAttribute("tabindex","-1"),this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState()}updated(e){e.has("active")&&(this.setAttribute("tabindex",this.active?"0":"-1"),this.customStates.set("active",this.active)),e.has("checked")&&(this.type==="checkbox"?this.setAttribute("aria-checked",this.checked?"true":"false"):this.removeAttribute("aria-checked"),this.customStates.set("checked",this.checked)),e.has("disabled")&&(this.setAttribute("aria-disabled",this.disabled?"true":"false"),this.customStates.set("disabled",this.disabled)),e.has("type")&&(this.type==="checkbox"?(this.setAttribute("role","menuitemcheckbox"),this.setAttribute("aria-checked",this.checked?"true":"false")):(this.setAttribute("role","menuitem"),this.removeAttribute("aria-checked"))),(e.has("href")||e.has("hasSubmenu"))&&this.customStates.set("link",this.isLink()),e.has("submenuOpen")&&(this.customStates.set("submenu-open",this.submenuOpen),this.submenuOpen?this.openSubmenu():this.closeSubmenu())}updateHasSubmenuState(){this.customStates.set("has-submenu",this.hasSubmenu)}async openSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||!this.isConnected||(this.notifyParentOfOpening(),e.showPopover?.(),e.hidden=!1,e.setAttribute("data-visible",""),this.submenuOpen=!0,this.setAttribute("aria-expanded","true"),await vt(e,"show"),setTimeout(()=>{const t=this.getSubmenuItems();t.length>0&&(t.forEach((n,o)=>n.active=o===0),t[0].focus({preventScroll:!0}))},0))}notifyParentOfOpening(){const e=new CustomEvent("submenu-opening",{bubbles:!0,composed:!0,detail:{item:this}});this.dispatchEvent(e);const t=this.parentElement;t&&[...t.children].filter(o=>o!==this&&o.localName==="wa-dropdown-item"&&o.getAttribute("slot")===this.getAttribute("slot")&&o.submenuOpen).forEach(o=>{o.submenuOpen=!1})}async closeSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||(this.submenuOpen=!1,this.setAttribute("aria-expanded","false"),e.hidden||(await vt(e,"hide"),e?.isConnected&&(e.hidden=!0,e.removeAttribute("data-visible"),e.hidePopover?.())))}isLink(){return!!this.href&&!this.hasSubmenu}navigate(e){const t=this.linkElement;!this.isLink()||this.disabled||!t||t.dispatchEvent(new MouseEvent("click",{bubbles:!1,cancelable:!0,composed:!1,altKey:e?.altKey??!1,ctrlKey:e?.ctrlKey??!1,metaKey:e?.metaKey??!1,shiftKey:e?.shiftKey??!1}))}getSubmenuItems(){return[...this.children].filter(e=>e.localName==="wa-dropdown-item"&&e.getAttribute("slot")==="submenu"&&!e.hasAttribute("disabled"))}render(){return G`
      ${this.href?G`
            <a
              id="link"
              href=${this.href}
              target=${kt(this.target)}
              rel=${kt(this.rel)}
              download=${kt(this.download)}
              tabindex="-1"
              aria-hidden="true"
            ></a>
          `:""}
      ${this.type==="checkbox"?G`
            <wa-icon
              id="check"
              part="checkmark"
              exportparts="svg:checkmark__svg"
              library="system"
              name="check"
            ></wa-icon>
          `:""}

      <span id="icon" part="icon">
        <slot name="icon"></slot>
      </span>

      <span id="label" part="label">
        <slot></slot>
      </span>

      <span id="details" part="details">
        <slot name="details"></slot>
      </span>

      ${this.hasSubmenu?G`
            <wa-icon
              id="submenu-indicator"
              part="submenu-icon"
              exportparts="svg:submenu-icon__svg"
              library="system"
              name="chevron-right"
            ></wa-icon>
          `:""}
      ${this.hasSubmenu?G`
            <div
              id="submenu"
              part="submenu"
              popover="manual"
              role="menu"
              tabindex="-1"
              aria-orientation="vertical"
              hidden
            >
              <slot name="submenu"></slot>
            </div>
          `:""}
    `}};Pe.css=fc;y([Ee("#submenu")],Pe.prototype,"submenuElement",2);y([Ee("#link")],Pe.prototype,"linkElement",2);y([H({type:Boolean})],Pe.prototype,"active",2);y([H({reflect:!0})],Pe.prototype,"variant",2);y([H({reflect:!0})],Pe.prototype,"size",2);y([wt("size")],Pe.prototype,"handleSizeChange",1);y([H({attribute:"checkbox-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"checkboxAdjacent",2);y([H({attribute:"submenu-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"submenuAdjacent",2);y([H()],Pe.prototype,"value",2);y([H({reflect:!0})],Pe.prototype,"type",2);y([H({type:Boolean})],Pe.prototype,"checked",2);y([H({type:Boolean,reflect:!0})],Pe.prototype,"disabled",2);y([H({type:Boolean,reflect:!0})],Pe.prototype,"submenuOpen",2);y([H({reflect:!0})],Pe.prototype,"href",2);y([H()],Pe.prototype,"target",2);y([H()],Pe.prototype,"rel",2);y([H()],Pe.prototype,"download",2);y([Zt()],Pe.prototype,"hasSubmenu",2);Pe=y([Ye("wa-dropdown-item")],Pe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var mc=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gc=Ve`
  :host {
    --arrow-color: black;
    --arrow-size: var(--wa-tooltip-arrow-size);
    --popup-border-width: 0px;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45) to calculate the length of the arrow after rotation.
     *
     * The diamond will be translated inward by --arrow-base-offset, the border thickness, to centralise it on
     * the inner edge of the popup border. This also means we need to increase the size of the arrow by the
     * same amount to compensate.
     *
     * A diamond shaped clipping mask is used to avoid overlap of popup content. This extends slightly inward so
     * the popup border is covered with no sub-pixel rounding artifacts. The diamond corners are mitred at 22.5º
     * to properly merge any arrow border with the popup border. The constant 1.4142 is derived from 1 + tan(22.5).
     *
     */
    --arrow-base-offset: var(--popup-border-width);
    --arrow-size-diagonal: calc((var(--arrow-size) + var(--arrow-base-offset)) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));
    --arrow-size-div: calc(var(--arrow-size-diagonal) * 2);
    --arrow-clipping-corner: calc(var(--arrow-base-offset) * 1.4142);

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);

    /* Clear UA styles for [popover] */
    :where(&) {
      inset: unset;
      padding: unset;
      margin: unset;
      width: unset;
      height: unset;
      color: unset;
      background: unset;
      border: unset;
      overflow: unset;
    }
  }

  .popup-fixed {
    position: fixed;
  }

  .popup:not(.popup-active) {
    display: none;
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size-div);
    height: var(--arrow-size-div);
    background: var(--arrow-color);
    z-index: 3;
    clip-path: polygon(
      var(--arrow-clipping-corner) 100%,
      var(--arrow-base-offset) calc(100% - var(--arrow-base-offset)),
      calc(var(--arrow-base-offset) - 2px) calc(100% - var(--arrow-base-offset)),
      calc(100% - var(--arrow-base-offset)) calc(var(--arrow-base-offset) - 2px),
      calc(100% - var(--arrow-base-offset)) var(--arrow-base-offset),
      100% var(--arrow-clipping-corner),
      100% 100%
    );
    rotate: 45deg;
  }

  :host([data-current-placement|='left']) .arrow {
    rotate: -45deg;
  }

  :host([data-current-placement|='right']) .arrow {
    rotate: 135deg;
  }

  :host([data-current-placement|='bottom']) .arrow {
    rotate: 225deg;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge-visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: 899;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }

  /* Built-in animations */
  .show {
    animation: show var(--show-duration) ease;
  }

  .hide {
    animation: show var(--hide-duration) ease reverse;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .show-with-scale {
    animation: show-with-scale var(--show-duration) ease;
  }

  .hide-with-scale {
    animation: show-with-scale var(--hide-duration) ease reverse;
  }

  @keyframes show-with-scale {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
`;function bc(e){return wc(e)}function ca(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function wc(e){for(let t=e;t;t=ca(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=ca(e);t;t=ca(t)){if(!(t instanceof Element))continue;const n=getComputedStyle(t);if(n.display!=="contents"&&(n.position!=="static"||jo(n)||t.tagName==="BODY"))return t}return null}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Ss(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var yc=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),xe=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){const e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let o=0,a=0,s=0,r=0,i=0,c=0,l=0,d=0;n?e.top<t.top?(o=e.left,a=e.bottom,s=e.right,r=e.bottom,i=t.left,c=t.top,l=t.right,d=t.top):(o=t.left,a=t.bottom,s=t.right,r=t.bottom,i=e.left,c=e.top,l=e.right,d=e.top):e.left<t.left?(o=e.right,a=e.top,s=t.left,r=t.top,i=e.right,c=e.bottom,l=t.left,d=t.bottom):(o=t.right,a=t.top,s=e.left,r=e.top,i=t.right,c=t.bottom,l=e.left,d=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${a}px`),this.style.setProperty("--hover-bridge-top-right-x",`${s}px`),this.style.setProperty("--hover-bridge-top-right-y",`${r}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${i}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${d}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=yc,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||Ss(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Kr(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;const e=[Jr({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(xs({apply:({rects:o})=>{const a=this.sync==="width"||this.sync==="both",s=this.sync==="height"||this.sync==="both";this.popup.style.width=a?`${o.reference.width}px`:"",this.popup.style.height=s?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!Ss(this.anchor)&&this.boundary==="scroll"&&(t=Rn(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(Gr({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Yr({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(xs({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:a})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${a}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(pc({element:this.arrowEl,padding:this.arrowPadding}));const n=this.SUPPORTS_POPOVER?o=>ho.getOffsetParent(o,bc):ho.getOffsetParent;Xr(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...ho,getOffsetParent:n}}).then(({x:o,y:a,middlewareData:s,placement:r})=>{const i=this.localize.dir()==="rtl",c={top:"bottom",right:"left",bottom:"top",left:"right"}[r.split("-")[0]];if(this.setAttribute("data-current-placement",r),Object.assign(this.popup.style,{left:`${o}px`,top:`${a}px`}),this.arrow){const l=s.arrow.x,d=s.arrow.y;let u="",g="",p="",f="";if(this.arrowPlacement==="start"){const x=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",g=i?x:"",f=i?"":x}else if(this.arrowPlacement==="end"){const x=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";g=i?"":x,f=i?x:"",p=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(f=typeof l=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof d=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(f=typeof l=="number"?`${l}px`:"",u=typeof d=="number"?`${d}px`:"");Object.assign(this.arrowEl.style,{top:u,right:g,bottom:p,left:f,[c]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new mc)}render(){return G`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${$t({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${$t({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?G`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};xe.css=gc;y([Ee(".popup")],xe.prototype,"popup",2);y([Ee(".arrow")],xe.prototype,"arrowEl",2);y([H({attribute:!1,type:Boolean})],xe.prototype,"SUPPORTS_POPOVER",2);y([H()],xe.prototype,"anchor",2);y([H({type:Boolean,reflect:!0})],xe.prototype,"active",2);y([H({reflect:!0})],xe.prototype,"placement",2);y([H()],xe.prototype,"boundary",2);y([H({type:Number})],xe.prototype,"distance",2);y([H({type:Number})],xe.prototype,"skidding",2);y([H({type:Boolean})],xe.prototype,"arrow",2);y([H({attribute:"arrow-placement"})],xe.prototype,"arrowPlacement",2);y([H({attribute:"arrow-padding",type:Number})],xe.prototype,"arrowPadding",2);y([H({type:Boolean})],xe.prototype,"flip",2);y([H({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],xe.prototype,"flipFallbackPlacements",2);y([H({attribute:"flip-fallback-strategy"})],xe.prototype,"flipFallbackStrategy",2);y([H({type:Object})],xe.prototype,"flipBoundary",2);y([H({attribute:"flip-padding",type:Number})],xe.prototype,"flipPadding",2);y([H({type:Boolean})],xe.prototype,"shift",2);y([H({type:Object})],xe.prototype,"shiftBoundary",2);y([H({attribute:"shift-padding",type:Number})],xe.prototype,"shiftPadding",2);y([H({attribute:"auto-size"})],xe.prototype,"autoSize",2);y([H()],xe.prototype,"sync",2);y([H({type:Object})],xe.prototype,"autoSizeBoundary",2);y([H({attribute:"auto-size-padding",type:Number})],xe.prototype,"autoSizePadding",2);y([H({attribute:"hover-bridge",type:Boolean})],xe.prototype,"hoverBridge",2);xe=y([Ye("wa-popup")],xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var vc=Ve`
  :host {
    --track-height: 1rem;
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-color: var(--wa-color-brand-fill-loud);

    display: flex;
  }

  .progress-bar {
    flex: 1 1 auto;
    display: flex;
    position: relative;
    overflow: hidden;
    height: var(--track-height);
    border-radius: var(--wa-border-radius-pill);
    background-color: var(--track-color);
    color: var(--wa-color-brand-on-loud);
    font-size: var(--wa-font-size-s);
  }

  .indicator {
    width: var(--percentage);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--indicator-color);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    line-height: 1;
    font-weight: var(--wa-font-weight-semibold);
    transition: all var(--wa-transition-slow, 200ms) var(--wa-transition-easing, ease);
    user-select: none;
    -webkit-user-select: none;
  }

  /* Indeterminate */
  :host([indeterminate]) .indicator {
    position: absolute;
    inset-block: 0;
    inline-size: 50%;
    animation: wa-progress-indeterminate 2.5s infinite cubic-bezier(0.37, 0, 0.63, 1);
  }

  @media (forced-colors: active) {
    .progress-bar {
      outline: solid 1px SelectedItem;
      background-color: var(--wa-color-surface-default);
    }

    .indicator {
      outline: solid 1px SelectedItem;
      background-color: SelectedItem;
    }
  }

  @keyframes wa-progress-indeterminate {
    0% {
      inset-inline-start: -50%;
    }

    75%,
    100% {
      inset-inline-start: 100%;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ln=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${fs(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${fs(this.value,0,100)}%`)}),super.updated(e)}render(){return G`
      <div
        part="base progress-bar"
        class="progress-bar"
        role="progressbar"
        title=${kt(this.title)}
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate?"0":this.value}
      >
        <div part="indicator" class="indicator">
          ${this.indeterminate?"":G` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};Ln.css=vc;y([H({type:Number,reflect:!0})],Ln.prototype,"value",2);y([H({type:Boolean,reflect:!0})],Ln.prototype,"indeterminate",2);y([H()],Ln.prototype,"label",2);Ln=y([Ye("wa-progress-bar")],Ln);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var kc=Ve`
  :host {
    --shadow-color: var(--wa-color-surface-default);
    --shadow-size: 2rem;

    /* private (defined dynamically) */
    --start-shadow-opacity: 0;
    --end-shadow-opacity: 0;

    display: block;
    position: relative;
    max-width: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  :host([orientation='vertical']) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #content {
    z-index: 1; /* below shadows */
    border-radius: inherit;
    scroll-behavior: smooth;
    scrollbar-width: thin;

    /* Prevent text in mobile Safari from being larger when the container width larger than the viewport */
    -webkit-text-size-adjust: 100%;

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  :host([without-scrollbar]) #content {
    scrollbar-width: none;
  }

  :host([orientation='horizontal']) #content {
    overflow-x: auto;
    overflow-y: hidden;
  }

  :host([orientation='vertical']) #content {
    flex: 1 1 auto;
    min-height: 0; /* This is crucial for flex children to respect overflow */
    overflow-x: hidden;
    overflow-y: auto;
  }

  #start-shadow,
  #end-shadow {
    z-index: 2;
  }

  #start-shadow {
    opacity: var(--start-shadow-opacity);
  }

  #end-shadow {
    opacity: var(--end-shadow-opacity);
  }

  /* Horizontal shadows */
  :host([orientation='horizontal']) {
    #start-shadow,
    #end-shadow {
      position: absolute;
      top: 0;
      bottom: 0;
      width: var(--shadow-size);
      pointer-events: none;
    }

    #start-shadow {
      &:dir(ltr) {
        left: 0;
        background: linear-gradient(to right, var(--shadow-color), transparent 100%);
      }

      &:dir(rtl) {
        right: 0;
        background: linear-gradient(to left, var(--shadow-color), transparent 100%);
      }
    }

    #end-shadow {
      &:dir(ltr) {
        right: 0;
        background: linear-gradient(to left, var(--shadow-color), transparent 100%);
      }

      &:dir(rtl) {
        left: 0;
        background: linear-gradient(to right, var(--shadow-color), transparent 100%);
      }
    }
  }

  /* Vertical shadows */
  :host([orientation='vertical']) {
    #start-shadow,
    #end-shadow {
      position: absolute;
      right: 0;
      left: 0;
      height: var(--shadow-size);
      pointer-events: none;
    }

    #start-shadow {
      top: 0;
      background: linear-gradient(to bottom, var(--shadow-color), transparent 100%);
    }

    #end-shadow {
      bottom: 0;
      background: linear-gradient(to top, var(--shadow-color), transparent 100%);
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pt=class extends st{constructor(){super(...arguments),this.localize=new Et(this),this.resizeObserver=null,this.canScroll=!1,this.orientation="horizontal",this.withoutScrollbar=!1,this.withoutShadow=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.updateScroll()),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}handleKeyDown(e){e.key==="Home"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?0:void 0,top:this.orientation==="vertical"?0:void 0})),e.key==="End"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?this.content.scrollWidth:void 0,top:this.orientation==="vertical"?this.content.scrollHeight:void 0}))}handleSlotChange(){this.updateScroll()}updateScroll(){if(this.orientation==="horizontal"){const e=Math.ceil(this.content.clientWidth),t=Math.abs(Math.ceil(this.content.scrollLeft)),o=Math.ceil(this.content.scrollWidth)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}else{const e=Math.ceil(this.content.clientHeight),t=Math.abs(Math.ceil(this.content.scrollTop)),o=Math.ceil(this.content.scrollHeight)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}}render(){return G`
      ${this.withoutShadow?"":G`
            <div id="start-shadow" part="start-shadow" aria-hidden="true"></div>
            <div id="end-shadow" part="end-shadow" aria-hidden="true"></div>
          `}

      <div
        id="content"
        part="content"
        role="region"
        aria-label=${this.localize.term("scrollableRegion")}
        tabindex=${this.canScroll?"0":"-1"}
        @keydown=${this.handleKeyDown}
        @scroll=${this.updateScroll}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Pt.css=[kc];y([Ee("#content")],Pt.prototype,"content",2);y([Zt()],Pt.prototype,"canScroll",2);y([H({reflect:!0})],Pt.prototype,"orientation",2);y([H({attribute:"without-scrollbar",type:Boolean,reflect:!0})],Pt.prototype,"withoutScrollbar",2);y([H({attribute:"without-shadow",type:Boolean,reflect:!0})],Pt.prototype,"withoutShadow",2);y([el({passive:!0})],Pt.prototype,"updateScroll",1);Pt=y([Ye("wa-scroller")],Pt);const so=["People","Routines","Rooms","Temperatures","Result"],ko=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],$c=Object.fromEntries(ko.map(e=>[e.slice(0,3),e])),xc=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"]],Qr=[["shared","Shared","Warm while its people are up and at home, and first thing in the morning even if they then go out."],["bedroom","Bedroom","Warm when its people get up and in the run-up to bed."],["office","Office","Warm while its people work from home."],["while_home","While anyone is home","Warm whenever its people are up and at home, working or not."],["all_day","All day","Warm from the first of its people getting up to the last going to bed, home or not."]],Zr={weekdays:{up:"07:00",bed:"22:30",periods:[{type:"out",from:"08:30",to:"17:30"}]},weekend:{up:"08:30",bed:"23:00",periods:[]}},ns=e=>JSON.parse(JSON.stringify(e));function dn(e,{end:t=!1}={}){const n=String(e??"").trim().replace(".",":");let o,a,s=n.match(/^(\d{1,2}):(\d{2})$/);if(s)[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})(\d{2})$/))[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})$/))[o,a]=[Number(s[1]),0];else return null;return a>59||o>24||o===24&&(a>0||!t)?null:`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function Sc(e,t){const n=String(e??"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,32)||"person",o=new Set(t);if(n!=="person"&&!o.has(n))return n;for(let a=1;;a++){const s=`${n}_${a}`;if(!o.has(s))return s}}function ei(e,t=""){const n=t||`Person ${e.people.length+1}`,o=Sc(n,e.people.map(a=>a.id));return e.people.push({id:o,name:n,...ns(Zr),weekendSame:!1,getting_up_min:null,bedtime_min:null,weekend_days:null,ha_person:null}),o}const Ra=e=>e?.ha_persons?.persons??null;function ti(e,t,n=[]){const o=String(e??"").trim().toLocaleLowerCase();if(!o||!t)return null;const a=t.filter(s=>String(s.name??"").trim().toLocaleLowerCase()===o&&!n.includes(s.entity_id));return a.length===1?a[0].entity_id:null}function _c(e,t){if(!(!t||e.people.some(n=>n.ha_person)))for(const n of e.people){const o=e.people.map(a=>a.ha_person).filter(Boolean);n.ha_person=ti(n.name,t,o)}}function Cc(e,t){const n=e.map(a=>a.name),o=[["","Not linked"]];for(const a of e){const s=n.indexOf(a.name)!==n.lastIndexOf(a.name);o.push([a.entity_id,s?`${a.name} (${a.entity_id})`:a.name])}return t&&!e.some(a=>a.entity_id===t)&&o.push([t,`${t}, not in Home Assistant now`]),o}const _s=e=>e?`Linked people count as away once Home Assistant has said they're out for ${Vn(e)}.`:"Linked people count as away as soon as Home Assistant says they're out.";function Ec(e,t){e.people=e.people.filter(n=>n.id!==t);for(const n of e.rooms)n.people&&(n.people=n.people.filter(o=>o!==t),n.people.length||(n.people=null,n.kind==="office"&&(n.kind="shared")))}const Ac=(e,t)=>e.rooms.find(n=>!n.own&&n.kind==="office"&&n.people?.includes(t))?.id??null;function Tc(e,t,n){for(const s of e.rooms)s.kind!=="office"||!s.people?.includes(t)||s.id===n||(s.people=s.people.filter(r=>r!==t),s.people.length||(s.people=null,s.kind="shared"));if(n==null)return;const o=e.rooms.find(s=>s.id===n);if(!o)return;o.own=!1;const a=o.kind==="office"?o.people??[]:[];o.kind="office",o.use==="unused"&&(o.use="in_use"),o.people=[...new Set([...a,t])]}const Rc=e=>[e.weekdays,...e.weekendSame?[]:[e.weekend]].some(t=>t.periods.some(n=>n.type==="work"));function Cs(e){const t=o=>o==null?[]:Array.isArray(o)?o:[o],n=[];for(const o of["out","work"])for(const a of t(e?.[o])){const[s,r]=String(a).split("-");n.push({type:o,from:s??"",to:r??""})}return n.sort((o,a)=>o.from.localeCompare(a.from)),{up:e?.up??"07:00",bed:e?.bed??"22:30",periods:n}}const Es=e=>(e??[]).map(t=>$c[String(t).toLowerCase().slice(0,3)]??t);function As(e){const t=e.household,n=e.defaults,o={people:[],rooms:[],temperatures:{...n.temperatures,...t?.temperatures??{}},timing:{...n.timing,...t?.timing??{}},away:{...n.away,...t?.away??{}},weekend_days:Es(t?.weekend_days??n.weekend_days)};if(t)for(const[a,s]of Object.entries(t.people??{}))o.people.push({id:a,name:s.name??a.replace(/_/g," ").replace(/^./,r=>r.toUpperCase()),weekdays:Cs(s.weekdays),weekend:Cs(s.weekend??s.weekdays),weekendSame:s.weekend==null,getting_up_min:s.getting_up_min??null,bedtime_min:s.bedtime_min??null,weekend_days:s.weekend_days?Es(s.weekend_days):null,ha_person:s.ha_person??null});else ei(o);_c(o,Ra(e));for(const a of e.rooms){const s=t?.rooms?.[a.id],r={id:a.id,name:a.name,schedule:a.schedule,own:!1,use:"in_use",weekendUse:"in_use",weekendDifferent:!1,kind:"shared",people:null,temperature:null,night_temperature:null,unused_temperature:null,preheat_min:null,adjust:[]};if(s){const i=s.use;r.use=typeof i=="object"?i.weekdays:i,r.weekendUse=typeof i=="object"?i.weekend:i,r.weekendDifferent=typeof i=="object"&&i.weekdays!==i.weekend,r.kind=s.kind??"shared",r.people=s.people??null;for(const c of["temperature","night_temperature","unused_temperature","preheat_min"])r[c]=s[c]??null;r.adjust=ns(s.adjust??[])}else t&&a.schedule?r.own=!0:!t&&/bed/i.test(a.name)&&(r.kind="bedroom");o.rooms.push(r)}return o}const $o=(e,t=!1)=>dn(e,{end:t})??String(e??""),Lc=e=>`${$o(e.from)}-${$o(e.to,!0)}`;function Ts(e){const t={up:$o(e.up)};for(const n of["out","work"]){const o=e.periods.filter(a=>a.type===n).map(Lc);o.length&&(t[n]=o)}return t.bed=$o(e.bed,!0),t}function Rs(e){const t=e.people.map(a=>a.id),n={};for(const a of e.people){const s={name:a.name,weekdays:Ts(a.weekdays)};a.weekendSame||(s.weekend=Ts(a.weekend)),a.getting_up_min!=null&&(s.getting_up_min=a.getting_up_min),a.bedtime_min!=null&&(s.bedtime_min=a.bedtime_min),a.weekend_days!=null&&(s.weekend_days=[...a.weekend_days]);const r=String(a.ha_person??"").trim();r&&(s.ha_person=r),n[a.id]=s}const o={};for(const a of e.rooms){if(a.own)continue;const s={use:a.weekendDifferent&&a.weekendUse!==a.use?{weekdays:a.use,weekend:a.weekendUse}:a.use};a.kind!=="shared"&&(s.kind=a.kind),a.people!=null?s.people=[...a.people]:(a.kind==="bedroom"||a.kind==="office")&&(s.people=[...t]);for(const r of["temperature","night_temperature","unused_temperature","preheat_min"])a[r]!=null&&(s[r]=a[r]);a.adjust?.length&&(s.adjust=ns(a.adjust)),o[a.id]=s}return{weekend_days:[...e.weekend_days],timing:{...e.timing},away:{...e.away},temperatures:{...e.temperatures},people:n,rooms:o}}function po(e,t){const n={out:0,work:0};return t.map(o=>`${e}.${o.type}[${n[o.type]++}]`)}function Mc(e,t){let n=null;for(const o of e)t!==o&&!t.startsWith(`${o}.`)&&!t.startsWith(`${o}[`)||(!n||o.length>n.length)&&(n=o);return n}function Ls(e,t){const n=t.split(".");if(n[0]!=="household")return{step:4,person:0};const o=(n[1]??"").replace(/\[.*$/,"");if(o==="people"){const a=Math.max(0,e.people.findIndex(s=>s.id===n[2]));return n.length<=3||n[3]==="name"||n[3]==="ha_person"?{step:0,person:a}:{step:1,person:a}}return o==="away"?{step:0,person:0}:o==="rooms"?{step:2,person:0}:o==="temperatures"||o==="timing"||o==="weekend_days"?{step:3,person:0}:{step:4,person:0}}function Oc(e){const t=[];for(const n of e.people)for(const o of n.weekendSame?["weekdays"]:["weekdays","weekend"]){const a=n[o],s=`household.people.${n.id}.${o}`;dn(a.up)||t.push({path:`${s}.up`,message:"Enter a time such as 07:30"}),dn(a.bed,{end:!0})||t.push({path:`${s}.bed`,message:"Enter a time such as 22:30"}),po(s,a.periods).forEach((r,i)=>{const{from:c,to:l}=a.periods[i];(!dn(c)||!dn(l,{end:!0}))&&t.push({path:r,message:"Enter both times, such as 08:30 and 17:30"})})}return t}const Nc=e=>Qr.find(t=>t[0]===e)?.[2]??"",zc=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ro=(e,t)=>typeof e=="number"&&e<t?`Below ${t}° walls and window frames can get damp, especially in older houses.`:"";function Vn(e,t=null){if(t!=null&&e===t)return"off";if(e<60)return`${e} min`;const n=e%60;return n?`${Math.floor(e/60)} h ${n} min`:`${e/60} h`}const Pc=e=>e.length?zc(ko.filter(t=>e.includes(t)).map(t=>t[0].toUpperCase()+t.slice(1))):"no days";function Dc(e){const t=e.reduce((o,a)=>o+(a.notes?.length??0),0);return t?`${t===1?"1 warm period is":`${t} warm periods are`} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`:""}const Yt=1440,Mn=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],qc=34,un=15,La=Mn.map(e=>e.slice(0,3).toLowerCase()),Ic=["00:00","06:00","12:00","18:00","24:00"],os=e=>`${Number.isInteger(e)?e:e.toFixed(1)}°`,at=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,dt=e=>`${e/Yt*100}%`,as=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`;function Bc(e,t=null){const n=[];for(const o of e)for(const a of o.days)for(const s of a.transitions)n.push(s.setpoint);return t&&n.push(...Object.values(t).filter(o=>typeof o=="number")),n.length?{low:Math.min(...n),high:Math.max(...n)}:{low:0,high:0}}function Hc(e){let t=1/0;for(const n of e.days)for(const o of n.transitions)t=Math.min(t,o.setpoint);return Number.isFinite(t)?t:0}function Fc(e,t,n=t.low){const o=[...e].filter(r=>r.minute>=0&&r.minute<Yt).sort((r,i)=>r.minute-i.minute);if(!o.length)return[];o[0].minute>0&&o.unshift({minute:0,setpoint:o.at(-1).setpoint});const a=[];o.forEach((r,i)=>{const c=i+1<o.length?o[i+1].minute:Yt;if(c<=r.minute)return;const l=a.at(-1);l&&l.setpoint===r.setpoint?l.end=c:a.push({start:r.minute,end:c,setpoint:r.setpoint})});const s=t.high-t.low;return a.map(r=>({...r,warm:r.setpoint>n,level:s>0?Math.min(1,Math.max(0,(r.setpoint-t.low)/s)):1}))}function jc(e,t){const n=[];let o=0;for(const a of e){if(!a.warm)continue;const s=Math.min(Math.max(a.start,o),Yt-t);s<o||s>=a.end||(n.push({minute:s,text:os(a.setpoint)}),o=s+t)}return n}const Wc=(e,t)=>t<e.minute?(e.weekday+1)%7:e.weekday;function Uc(e){if(!e)return[];const t=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"],["night","Night"]],n=new Map;for(const[o,a]of t){const s=e[o];typeof s=="number"&&n.set(s,[...n.get(s)??[],a])}return[...n.entries()].sort((o,a)=>a[0]-o[0]).map(([o,a])=>({label:as(a.map((s,r)=>r?s.toLowerCase():s)),setpoint:o}))}const Vc=e=>`Usually ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`,Kc=(e,t=un)=>Math.round(e/t)*t,io=e=>Number(e.slice(0,2))*60+Number(e.slice(3,5)),Ms=(e,t)=>Math.min(t.max,Math.max(t.min,Kc(e)));function Jc(e,t,n){const o=e[t];return n==="start"?{min:t>0?e[t-1].end:0,max:o.end-un}:{min:o.start+un,max:t+1<e.length?e[t+1].start:Yt}}function Yc(e,t){const n=a=>JSON.stringify([a.transitions,a.periods??[]]),o=n(e.days[t]);return e.days.flatMap((a,s)=>n(a)===o?[s]:[])}function Gc(e){if(e.length===7)return"Every day";const t=a=>Mn[a].slice(0,3),n=[];for(const a of[...e].sort((s,r)=>s-r)){const s=n.at(-1);s&&a===s[1]+1?s[1]=a:n.push([a,a])}const o=[];for(const[a,s]of n)if(s-a>=2)o.push(`${t(a)} to ${t(s)}`);else for(let r=a;r<=s;r++)o.push(t(r));return as(o)}function Xc(e,t=["saturday","sunday"]){const n=[...new Set(e)].sort((s,r)=>s-r),o=Mn.flatMap((s,r)=>t.includes(s.toLowerCase())?[r]:[]),a=s=>s.length===n.length&&s.every((r,i)=>r===n[i]);return n.length===7?"daily":a(o)?"weekend":a([0,1,2,3,4,5,6].filter(s=>!o.includes(s)))?"weekdays":n.length===1?La[n[0]]:n.map(s=>La[s])}function Qc(e,t,n){if(n===t)return null;const o=n>t;return e==="end"?o?{keep:"warm",from:t,to:n}:{keep:"cold",from:n,to:t}:o?{keep:"cold",from:t,to:n}:{keep:"warm",from:n,to:t}}function Os(e,t){const n=i=>JSON.stringify([i.days].flat());let o=io(t.from),a=io(t.to);const s=[];let r=!1;for(const i of e??[]){if(n(i)!==n(t)){s.push(i);continue}const c=io(i.from),l=io(i.to);if(i.keep===t.keep){if(c<=a&&l>=o){o=Math.min(o,c),a=Math.max(a,l);continue}s.push(i)}else c<a&&l>o?(c===o&&l===a&&(r=!0),c<o&&s.push({...i,to:at(o)}),l>a&&s.push({...i,from:at(a)})):s.push(i)}return r?s:[...s,{...t,from:at(o),to:at(a)}]}function da(e,t,n){const o=JSON.parse(JSON.stringify(e)),a=o?.rooms?.[t];if(!a)throw new Error(`${t} is not in the household`);const s=n(a.adjust??[]);return s.length?a.adjust=s:delete a.adjust,o}const Zc=(e,t,n,o)=>`${e}, ${t}, warm ${n==="end"?"until":"from"} ${at(o)}`,ed=(e,t,n,o)=>`${e}: warm ${t==="end"?"until":"from"} ${at(o)}, not ${at(n)}.`,td=e=>`Without adjustments: ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`;function Ns(e){return e?.saved_at?e.source==="house_file"?`Saving copies the household, with this change, to ${e.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`:"":"In the demo, changes last until you close the page."}const nd=[["daily","Every day"],["weekdays","Weekdays"],["weekend","Weekend"],...Mn.map((e,t)=>[La[t],e])];function od(e,t=""){const n=` ${t} `;if(e==="button")return document.createElement("button");if(n.includes(" card "))return document.createElement("wa-card");if(n.includes(" badge ")){const o=document.createElement("wa-badge");return o.setAttribute("variant","neutral"),o.setAttribute("appearance","outlined"),o}return document.createElement(e)}const ad=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s",ce=(e,t,n)=>{const o=od(e,t);return t&&(o.className=e==="button"&&/\b(btn|link)\b/.test(t)?`${t} ${ad(t)}`:t),n!=null&&(o.textContent=n),o};function sd(e,t,n,o){const a=ce("li","week-day");a.append(ce("span","week-dname",Mn[t].slice(0,3)));const s=ce("div","week-lane"),r=ce("div","week-labels");r.setAttribute("aria-hidden","true");const i=ce("div","week-track");i.setAttribute("role","img"),a.day={name:Mn[t],text:e.text};for(const c of n){if(!c.warm)continue;const l=ce("i","week-block");l.style.left=dt(c.start),l.style.width=dt(c.end-c.start),l.style.setProperty("--level",c.level.toFixed(3)),l.title=`${os(c.setpoint)} ${at(c.start)} to ${at(c.end)}`,l.dataset.start=String(c.start),l.dataset.end=String(c.end),i.append(l)}for(const c of e.adjusted??[]){const l=ce("i","week-adj");l.dataset.keep=c.keep,l.style.left=dt(c.start),l.style.width=dt(c.end-c.start),i.append(l)}return s.append(r,i),a.append(s),a.segments=n,ni(a,o),a}function ni(e,t){t?e.setAttribute("aria-current","date"):e.removeAttribute("aria-current");const n=`${e.day.name}${t?", today":""}: ${e.day.text}`;e.querySelector(".week-track").setAttribute("aria-label",n)}function zs(e){const n=e.querySelector(".week-track")?.getBoundingClientRect().width??0;if(!n)return;const o=Math.ceil(qc/n*Yt);if(e.dataset.labelMin!==String(o)){e.dataset.labelMin=String(o);for(const a of e.querySelectorAll(".week-day")){const s=a.querySelector(".week-labels");s.textContent="";for(const r of jc(a.segments,o)){const i=ce("span",null,r.text);i.style.left=dt(r.minute),s.append(i)}}}}function rd(e,t,n){const o=ce("article","card week");o.dataset.away=String(!!e.away);const a=ce("header");a.append(ce("h3","name",e.name)),a.append(ce("span","badge",e.source==="household"?"Household":"Hand-written")),o.append(a),e.away&&(o.append(ce("p","week-away",e.away.text)),o.append(ce("p","week-usual",Vc(e.away.usual))));const s=Hc(e),r=ce("ol","week-days");r.setAttribute("aria-label",`${e.name}, Monday to Sunday`),e.days.forEach((d,u)=>r.append(sd(d,u,Fc(d.transitions,t,s),u===n))),o.append(r);const i=ce("div","week-ticks");i.setAttribute("aria-hidden","true");for(const d of Ic)i.append(ce("span",null,d));o.append(i);const c=ce("dl","week-summary");for(const d of e.summary){const u=ce("div");u.append(ce("dt",null,d.days),ce("dd",null,d.text)),c.append(u)}o.append(c);for(const d of e.notes)o.append(ce("p","flag",d));e.people.length&&o.append(ce("p","week-meta",`Depends on ${as(e.people.map(d=>d.name))}.`));const l=ce("i","week-now");return l.setAttribute("aria-hidden","true"),o.append(l),o}const rn=(e,t,n="button")=>{const o=ce("button",e,t);return o.type=n,o},ua=e=>{const t=String(e??"").trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function id(e,t,n){const{editor:o}=n,a=[...e.querySelectorAll(".week-day")],s=[];let r=null,i=null,c=!1,l=0,d=null;const u=ce("div","week-edit"),g=ce("div","week-pending");g.hidden=!0;const p=ce("p","week-pending-what");p.setAttribute("aria-live","polite");const f=ce("p","week-pending-then");f.setAttribute("aria-live","polite");const x=ce("p","week-source"),h=ce("p","week-error");h.setAttribute("role","alert"),h.hidden=!0;const w=rn("btn btn-primary","Save"),b=rn("btn","Cancel"),k=ce("div","week-buttons");k.append(w,b),g.append(p,f,x,h,k),u.append(g);function R(z,oe){if(z.value=oe,z.style.left=dt(oe),z.getAttribute("role")!=="slider")return;const{label:ne,edge:ue}=z.edit;z.setAttribute("aria-valuenow",String(oe)),z.setAttribute("aria-valuetext",at(oe)),z.setAttribute("aria-label",Zc(t.name,ne,ue,oe))}t.days.forEach((z,oe)=>{const ne=z.periods??[];if(!ne.length||t.away)return;const ue=Yc(t,oe),ye=Gc(ue),Ie=a[oe].querySelector(".week-track");ne.forEach((Se,De)=>{for(const qe of["start","end"]){const Me=ce("span","week-edge");Me.dataset.edge=qe,Me.dataset.key=`${ue[0]}:${De}:${qe}`,Me.edit={row:oe,group:ue,label:ye,periods:ne,index:De,edge:qe,was:Se[qe],bounds:Jc(ne,De,qe)},ue[0]===oe?(Me.tabIndex=0,Me.setAttribute("role","slider"),Me.setAttribute("aria-valuemin",String(Me.edit.bounds.min)),Me.setAttribute("aria-valuemax",String(Me.edit.bounds.max))):Me.setAttribute("aria-hidden","true"),R(Me,Se[qe]),Q(Me),Ie.append(Me),s.push(Me)}})});const E=z=>s.find(oe=>oe.dataset.key===z&&oe.tabIndex===0);function P(z,oe){const{group:ne,periods:ue,index:ye,edge:Ie,row:Se}=z.edit,De=ue[ye],[qe,Me]=Ie==="start"?[oe,De.end]:[De.start,oe];for(const At of s)At.dataset.key===z.dataset.key&&R(At,oe);for(const At of ne){const xn=a[At].querySelector(`.week-block[data-start="${De.start}"][data-end="${De.end}"]`);xn&&(xn.style.left=dt(qe),xn.style.width=dt(Me-qe)),a[At].dataset.editing="true"}let ge=e.querySelector(".week-drag-label");ge||(ge=ce("span","week-drag-label"),ge.setAttribute("aria-hidden","true"));const it=a[Se].querySelector(".week-labels");ge.parentElement!==it&&it.append(ge),ge.textContent=at(oe);const on=Number(e.dataset.labelMin||120)*1.4;ge.style.left=dt(Math.min(Yt-on,Math.max(0,oe-on/2)))}function Z(){for(const z of s)R(z,z.edit.was);for(const z of e.querySelectorAll(".week-block"))z.style.left=dt(Number(z.dataset.start)),z.style.width=dt(Number(z.dataset.end)-Number(z.dataset.start));for(const z of a)delete z.dataset.editing;e.querySelector(".week-drag-label")?.remove()}function Q(z){z.addEventListener("pointerdown",ne=>{i||c||ne.pointerType==="mouse"&&ne.button!==0||(r&&r.h.dataset.key!==z.dataset.key&&D(),ne.preventDefault(),z.setPointerCapture?.(ne.pointerId),i={id:ne.pointerId,h:z,rect:z.parentElement.getBoundingClientRect()},e.dataset.dragging="true")}),z.addEventListener("pointermove",ne=>{if(!i||ne.pointerId!==i.id||!i.rect.width)return;const ue=Ms((ne.clientX-i.rect.left)/i.rect.width*Yt,z.edit.bounds);ue!==z.value&&P(z,ue)});const oe=(ne,ue)=>{!i||ne.pointerId!==i.id||(i=null,delete e.dataset.dragging,ue?te(z,z.value,!1):r?P(r.h,r.now):D())};z.addEventListener("pointerup",ne=>oe(ne,!0)),z.addEventListener("pointercancel",ne=>oe(ne,!1)),z.addEventListener("keydown",ne=>{const ue={ArrowLeft:-un,ArrowDown:-un,ArrowRight:un,ArrowUp:un,PageDown:-60,PageUp:60};let ye;if(ne.key in ue)ye=Ms(z.value+ue[ne.key],z.edit.bounds);else if(ne.key==="Home")ye=z.edit.bounds.min;else if(ne.key==="End")ye=z.edit.bounds.max;else if(ne.key==="Enter"){ne.preventDefault(),r&&m();return}else if(ne.key==="Escape"){r&&(ne.preventDefault(),D());return}else return;ne.preventDefault(),r&&r.h.dataset.key!==z.dataset.key&&D(),P(z,ye),te(z,ye,!0)})}function te(z,oe,ne){if(oe===z.edit.was){D();return}const{label:ue,edge:ye,was:Ie}=z.edit,Se=r?.h.dataset.key===z.dataset.key;r={h:z,now:oe,keyboard:ne,info:Se?r.info:null},g.hidden=!1,p.textContent=ed(ue,ye,Ie,oe),f.textContent="Checking…",h.hidden=!0,w.disabled=!0,clearTimeout(d),d=setTimeout(q,ne?400:0)}async function T(z){z.info??=await o.household();const{edge:oe,was:ne,group:ue}=z.h.edit,ye=Qc(oe,ne,z.now),Ie={days:Xc(ue,n.weekend),keep:ye.keep,from:at(ye.from),to:at(ye.to)};return da(z.info.household,t.id,Se=>Os(Se,Ie))}function V(z){f.textContent="",h.textContent=z,h.hidden=!1,w.disabled=!0}async function q(){const z=++l,oe=r;if(!oe)return;let ne;try{ne=await o.preview(await T(oe))}catch{z===l&&V("Couldn't check the change. Check the connection and try again.");return}if(z!==l||oe!==r)return;if(x.textContent=Ns(oe.info),x.hidden=!x.textContent,ne.errors?.length){V(ua(ne.errors[0].message));return}const ue=ne.rooms.find(Se=>Se.id===t.id),ye=ue?ue.summary.map(Se=>`${Se.days}: ${Se.text}`).join("; "):"",Ie=(ue?.notes??[]).filter(Se=>!t.notes.includes(Se));f.textContent=[ye&&`${ye}.`,...Ie].filter(Boolean).join(" "),w.disabled=!1}async function m(){const z=r;if(!z)return;clearTimeout(d);const oe=++l;w.disabled=!0,f.textContent="Saving…",h.hidden=!0;let ne=null;try{ne=await o.save(await T(z))}catch{}if(oe!==l||z!==r)return;if(ne?.status===200){r=null,n.saved(`Saved. ${t.name} follows its new week.${F(z.info)}`,z.keyboard?z.h.dataset.key:null);return}const ue=ne?.status===400?ne.body?.errors?.[0]?.message:null;V(ue?`Not saved. ${ua(ue)}`:"Not saved. Check the connection and try again."),w.disabled=!1}function D(){clearTimeout(d),l++;const z=r?.h.dataset.key;return r=null,Z(),g.hidden=!0,z}w.addEventListener("click",m),b.addEventListener("click",()=>E(D())?.focus()),g.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),E(D())?.focus())});const F=z=>z?.source==="house_file"&&z.saved_at?` The household is now kept in ${z.saved_at}; the house file isn't changed.`:"",N=ce("p","week-error");N.setAttribute("role","alert"),N.hidden=!0;async function W(z,oe){N.hidden=!0;let ne=null,ue=null;try{ne=await o.household(),ue=await o.save(da(ne.household,t.id,z))}catch{}if(ue?.status===200){n.saved(`${oe}${F(ne)}`,null);return}N.textContent="Not saved. Check the connection and try again.",N.hidden=!1}const U=ce("div","week-adjust");if(t.adjust?.length){U.append(ce("h4",null,"Adjustments"));const z=ce("ul");t.adjust.forEach((oe,ne)=>{const ue=ce("li"),ye=rn("link","Remove");ye.setAttribute("aria-label",`Remove: ${oe.text}`),ye.addEventListener("click",()=>W(Ie=>Ie.filter((Se,De)=>De!==ne),`Removed. ${t.name} follows its new week.`)),ue.append(ce("span",null,oe.text),ye),z.append(ue)}),U.append(z),t.routine&&U.append(ce("p","week-usual",td(t.routine)))}const ee=ce("div","week-actions"),se=rn("link","Adjust");if(se.setAttribute("aria-expanded","false"),se.setAttribute("aria-label",`Adjust ${t.name}`),ee.append(se),t.adjust?.length){const z=rn("link","Reset to routine");z.setAttribute("aria-label",`Reset ${t.name} to its routine`),z.addEventListener("click",()=>W(()=>[],`${t.name} is back to its routine.`)),ee.append(z)}U.append(ee,N);const de=ce("form","week-form");de.hidden=!0,de.noValidate=!0,de.id=`week-form-${t.id}`,se.setAttribute("aria-controls",de.id);const fe=(z,oe,ne)=>{ne.name=z,ne.id=`${de.id}-${z}`;const ue=ce("div","week-field"),ye=ce("label",null,oe);return ye.htmlFor=ne.id,ue.append(ye,ne),ue},O=z=>{const oe=ce("select");for(const[ne,ue]of z){const ye=ce("option",null,ue);ye.value=ne,oe.append(ye)}return oe},v=z=>{const oe=ce("input","time");return Object.assign(oe,{type:"text",inputMode:"numeric",autocomplete:"off",spellcheck:!1,maxLength:5,placeholder:z}),oe.addEventListener("blur",()=>{const ne=o.time?.(oe.value,{end:oe.name==="to"});ne&&(oe.value=ne)}),oe},_=O(nd),L=O([["warm","Warm"],["cold","Cold"]]),j=v("22:30"),X=v("23:00"),M=ce("div","week-fields");M.append(fe("days","Days",_),fe("keep","Keep it",L),fe("from","From",j),fe("to","To",X));const I=ce("p","week-source");I.hidden=!0;const K=ce("p","week-error");K.setAttribute("role","alert"),K.hidden=!0;const ae=ce("div","week-buttons"),ve=rn("btn btn-primary","Save","submit"),Le=rn("btn","Cancel");ae.append(ve,Le),de.append(M,I,K,ae);const Ke={days:_,keep:L,from:j,to:X};function Ae(z,oe){for(const ne of Object.values(Ke))ne.removeAttribute("aria-invalid");K.hidden=!oe,K.textContent=oe??"",z&&Ke[z]&&(Ke[z].setAttribute("aria-invalid","true"),Ke[z].setAttribute("aria-describedby",K.id||=`${de.id}-error`))}function nn(){de.hidden=!0,c=!1,se.setAttribute("aria-expanded","false"),Ae(null,null),se.focus()}return se.addEventListener("click",async()=>{if(c){nn();return}r&&D(),c=!0,de.hidden=!1,se.setAttribute("aria-expanded","true"),_.focus();try{I.textContent=Ns(await o.household())}catch{I.textContent=""}I.hidden=!I.textContent}),Le.addEventListener("click",nn),de.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),nn())}),de.addEventListener("submit",async z=>{z.preventDefault();const oe=(ge,it)=>o.time?o.time(ge,it):ge.trim()||null,ne=oe(j.value),ue=oe(X.value,{end:!0});if(!ne){Ae("from","Enter a time such as 22:30."),j.focus();return}if(!ue){Ae("to","Enter a time such as 23:00."),X.focus();return}Ae(null,null),ve.disabled=!0;const ye={days:_.value,keep:L.value,from:ne,to:ue};let Ie=null,Se=null,De=0;try{Ie=await o.household();const ge=da(Ie.household,t.id,it=>{const on=Os(it,ye);return De=on.length-1,on});Se=await o.save(ge)}catch{}if(ve.disabled=!1,Se?.status===200){c=!1,n.saved(`Saved. ${t.name} follows its new week.${F(Ie)}`,null);return}const qe=Se?.status===400?Se.body?.errors?.[0]:null;if(!qe){Ae(null,"Not saved. Check the connection and try again.");return}const Me=qe.path.match(new RegExp(`\\.adjust\\[${De}\\]\\.(\\w+)$`));Ae(Me?.[1]??null,`Not saved. ${ua(qe.message)}`),Ke[Me?.[1]]?.focus()}),U.append(de),u.append(U),e.insertBefore(u,e.querySelector(".week-meta")??e.querySelector(".week-now")),{busy:()=>!!(r||i||c),focus(z){(z&&E(z)||se).focus()}}}function oi({list:e,legendEl:t,frostEl:n,hintEl:o=null}){const a=new Map;let s=null,r={low:0,high:0},i=null,c=["saturday","sunday"],l=null;const d=typeof ResizeObserver=="function"?new ResizeObserver(p=>{for(const f of p)zs(f.target)}):null;function u(p){if(!s)return;const f=Wc(s,p);for(const{card:x}of a.values()){const h=x.querySelector(".week-now"),w=x.querySelectorAll(".week-day");w.forEach((k,R)=>{k.hasAttribute("aria-current")!==(R===f)&&ni(k,R===f)});const b=w[f]?.querySelector(".week-track");b&&(h.parentElement!==b&&b.append(h),h.style.left=dt(p))}}function g(p){t.textContent="";const f=Uc(p.levels);for(const h of f){const w=ce("span","week-key"),b=ce("i","week-swatch");b.setAttribute("aria-hidden","true"),b.dataset.base=String(h.setpoint<=r.low),b.style.setProperty("--level",(r.high>r.low?(h.setpoint-r.low)/(r.high-r.low):1).toFixed(3)),w.append(b,`${h.label} ${os(h.setpoint)}`),t.append(w)}const x=p.rooms.some(h=>h.days.some(w=>w.adjusted?.length));if(x){const h=ce("span","week-key"),w=ce("i","week-adj-swatch");w.setAttribute("aria-hidden","true"),h.append(w,"Adjusted"),t.append(h)}t.hidden=!f.length&&!x}return{update(p){s=p.now,c=p.weekend_days??c,r=Bc(p.rooms,p.levels),n.hidden=!p.frost,g(p);const f=new Set;let x=!1;p.rooms.forEach((h,w)=>{f.add(h.id);const b=!!i&&h.source==="household";x||=b&&!h.away&&h.days.some(Z=>Z.periods?.length);const k=JSON.stringify([h,r,b]),R=a.get(h.id);if(R?.key===k&&l?.room!==h.id||R?.edit?.busy())return;const E=rd(h,r,s.weekday);R?(d?.unobserve(R.card),R.card.replaceWith(E)):e.insertBefore(E,e.children[w]??null);const P={card:E,key:k,edit:null};b&&(P.edit=id(E,h,{editor:i,weekend:c,saved(Z,Q){l={room:h.id,key:Q},i.saved(Z)}})),a.set(h.id,P),d?.observe(E),zs(E),l?.room===h.id&&(P.edit?.focus(l.key),l=null)});for(const[h,{card:w}]of a)f.has(h)||(d?.unobserve(w),w.remove(),a.delete(h));o&&(o.hidden=!x),u(s.minute)},tick(p){u(p)},setEditor(p){i=p}}}const Ma="radiate.householdDraft",He=e=>document.getElementById(e);function ld(e,t="",n=!1){const o=` ${t} `;if(e==="button"&&!n&&/\s(btn|link)\s/.test(o)){const a=document.createElement("wa-button");return o.includes(" btn-primary ")?a.setAttribute("variant","brand"):o.includes(" link ")?(a.setAttribute("appearance","plain"),a.setAttribute("size","s")):a.setAttribute("appearance","outlined"),o.includes(" link ")||a.setAttribute("size","s"),a}if(o.includes(" card "))return document.createElement("wa-card");if(o.includes(" badge ")){const a=document.createElement("wa-badge");return a.setAttribute("variant","neutral"),a.setAttribute("appearance","outlined"),a}return document.createElement(e)}const cd=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s";function J(e,t={},...n){const o=Object.keys(t).some(s=>s.startsWith("aria-")),a=ld(e,t.class,o);a.localName==="button"&&/\b(btn|link)\b/.test(t.class??"")&&(t={...t,class:`${t.class} ${cd(t.class)}`});for(const[s,r]of Object.entries(t))r==null||r===!1||(s==="text"?a.textContent=r:s==="class"?a.className=r:s.startsWith("on")?a.addEventListener(s.slice(2),r):s in a&&typeof r!="string"?a[s]=r:a.setAttribute(s,r===!0?"":r));for(const s of n.flat())s!=null&&s!==!1&&a.append(s);return a}const $e=e=>`f-${e.replace(/[^a-z0-9]+/gi,"-")}`,Ps=e=>{const t=String(e).trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function dd(){try{return JSON.parse(localStorage.getItem(Ma)||"null")}catch{return null}}function Ds(e){try{e?localStorage.setItem(Ma,JSON.stringify(e)):localStorage.removeItem(Ma)}catch{}}function ud({transport:e,onSaved:t,onOpen:n,onClose:o}){const a=He("setup"),s=He("setup-body"),r=He("setup-summary"),i=He("setup-back"),c=He("setup-next"),l=He("setup-progress"),d=He("setup-steps"),u=He("setup-source"),g=He("setup-resume");let p=null,f=null,x="",h=0,w=0,b=0,k=[],R=[],E=!1,P=!1;const Z=new Set,Q=new Set;let te=null,T=null;const V=()=>{clearTimeout(T),T=setTimeout(()=>Ds({v:1,base:x,step:h,person:w,reached:b,draft:f}),300)},q=()=>{clearTimeout(T),Ds(null)};function m($,C,A,B="",Y=null){const re=A.matches("input, select")?A:A.querySelector("input, select");re.id||=$e($);const ie=B?`${re.id}-help`:null;return ie&&re.setAttribute("aria-describedby",ie),J("div",{class:"field","data-path":$},J("label",{for:re.id,text:C}),A,B?J("p",{class:"field-help",id:ie,text:B}):null,Y)}function D($,C,{end:A=!1,onChange:B}){const Y=J("input",{id:$e($),type:"text",inputmode:"numeric",autocomplete:"off",spellcheck:"false",maxlength:"5",placeholder:A?"22:30":"07:30",class:"time",value:C});return Y.addEventListener("input",()=>{B(Y.value),V()}),Y.addEventListener("blur",()=>{const re=dn(Y.value,{end:A});re&&re!==Y.value&&(Y.value=re,B(re),V())}),Y}function F($,C,{limit:A,step:B=1,placeholder:Y="",onChange:re}){const ie=J("input",{id:$e($),type:"number",inputmode:B<1?"decimal":"numeric",min:String(A.off===0?0:A.min),max:String(A.max),step:String(B),placeholder:Y===""?"":String(Y),class:"num",value:C==null?"":String(C)});return ie.addEventListener("input",()=>{const me=ie.value.trim();re(me===""?null:Number.isFinite(Number(me))?Number(me):me),V()}),ie}const N=($,C)=>J("span",{class:"unit"},$,J("span",{"aria-hidden":"true",text:C}));function W($,C,A,B){const Y=J("select",{id:$e($)},A.map(([re,ie])=>J("option",{value:re,text:ie})));return Y.value=C,Y.addEventListener("change",()=>{B(Y.value),V()}),Y}function U($,C,A,B,Y=""){const re=J("input",{type:"checkbox",id:$,checked:A});return re.addEventListener("change",()=>{B(re.checked),V()}),J("div",{class:"check"},re,J("label",{for:$,text:C}),Y?J("p",{class:"field-help",text:Y}):null)}function ee($,C,A){const B=new Set(C);return J("fieldset",{class:"days","data-path":$},J("legend",{class:"sr-only",text:"Days"}),ko.map(Y=>{const re=`${$e($)}-${Y}`,ie=J("input",{type:"checkbox",id:re,checked:B.has(Y)});return ie.addEventListener("change",()=>{ie.checked?B.add(Y):B.delete(Y),A(ko.filter(me=>B.has(me))),V()}),J("span",{class:"day"},ie,J("label",{for:re,text:Y[0].toUpperCase()+Y.slice(1,3)}))}))}function se($,C,...A){const B=J("details",{class:"setup-adv",open:Z.has($)},J("summary",{text:C}),J("div",{class:"setup-adv-body"},...A));return B.addEventListener("toggle",()=>{B.open?Z.add($):Z.delete($)}),B}const de=$=>p.limits[$],fe=($,C)=>p.defaults[$][C],O=($,C=null)=>`Default ${Vn($,C)}.`;function v($,C){return[J("h3",{class:"setup-title",id:"setup-step-h",tabindex:"-1",text:$}),C?J("p",{class:"setup-intro",text:C}):null]}function _($,C,A){const B=Ra(p);let Y;return B?Y=W(`${C}.ha_person`,$.ha_person??"",Cc(B,$.ha_person),re=>{$.ha_person=re||null,Q.add($.id)}):(Y=J("input",{id:$e(`${C}.ha_person`),type:"text",class:"entity",value:$.ha_person??"",placeholder:"person.sam",autocomplete:"off",autocapitalize:"none",spellcheck:"false",maxlength:"107"}),Y.addEventListener("input",()=>{$.ha_person=Y.value.trim()||null,V()})),Y.setAttribute("aria-describedby",A),J("div",{class:"field","data-path":`${C}.ha_person`},J("label",{for:Y.id,text:"Home Assistant person"}),Y)}function L(){const $=J("div",{class:"setup-people"}),C=Ra(p),A=`${$e("household.people")}-ha-help`,B=()=>C?`${_s(f.away.presence_delay_min)} A link set in the integration's options takes priority.`:`Optional. Type the entity ID, such as person.sam. ${_s(f.away.presence_delay_min)}`,Y=J("p",{class:"field-help",id:A,text:B()});f.people.forEach((he,be)=>{const _e=`household.people.${he.id}`,Oe=J("input",{id:$e(`${_e}.name`),type:"text",value:he.name,autocomplete:"off",maxlength:"40",required:!0});Oe.addEventListener("input",()=>{he.name=Oe.value,V()}),Oe.addEventListener("change",()=>{if(!C||he.ha_person||Q.has(he.id))return;const yt=f.people.map(an=>an.ha_person).filter(Boolean),Sn=ti(he.name,C,yt);if(!Sn)return;he.ha_person=Sn;const oo=document.getElementById($e(`${_e}.ha_person`));oo&&(oo.value=Sn),V()});const Ze=J("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${he.name||`person ${be+1}`}`,disabled:f.people.length<2,onclick:()=>{Ec(f,he.id),w=Math.min(w,f.people.length-1),oe(`${$e("household.people")}-add`),V()}});$.append(J("div",{class:"setup-person",role:"group","aria-label":`Person ${be+1}`,"data-path":_e},m(`${_e}.name`,`Person ${be+1}`,Oe),_(he,_e,A),Ze))});const re=J("button",{type:"button",class:"btn",id:`${$e("household.people")}-add`,text:"Add a person",onclick:()=>{const he=ei(f);oe($e(`household.people.${he}.name`),!0),V()}}),ie=f.away,me=de("away.presence_stale_after_min").off;return[...v("Who lives here?","Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),J("div",{class:"field-group","data-path":"household.people"},$,Y,re),se("away","Advanced: away and presence",m("household.away.presence_delay_min","Counts as away after",N(F("household.away.presence_delay_min",ie.presence_delay_min,{limit:de("away.presence_delay_min"),onChange:he=>{ie.presence_delay_min=he,typeof he=="number"&&(Y.textContent=B())}}),"min"),`How long Home Assistant must say someone is out before Radiate counts them as away. ${O(fe("away","presence_delay_min"))}`),m("household.away.presence_stale_after_min","Presence goes stale after",N(F("household.away.presence_stale_after_min",ie.presence_stale_after_min,{limit:de("away.presence_stale_after_min"),onChange:he=>ie.presence_stale_after_min=he}),"min"),`If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${O(fe("away","presence_stale_after_min"),me)}`),m("household.away.return_warmup_min","Warm up for a return up to",N(F("household.away.return_warmup_min",ie.return_warmup_min,{limit:de("away.return_warmup_min"),onChange:he=>ie.return_warmup_min=he}),"min"),`How early Radiate may start warming rooms for someone due back. ${O(fe("away","return_warmup_min"))}`),m("household.away.presence_evidence_max_age_min","Trust not home for",N(F("household.away.presence_evidence_max_age_min",ie.presence_evidence_max_age_min,{limit:de("away.presence_evidence_max_age_min"),onChange:he=>ie.presence_evidence_max_age_min=he}),"min"),`If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${O(fe("away","presence_evidence_max_age_min"))}`),m("household.away.presence_weak_source_delay_min","Wifi or Bluetooth trackers count as away after",N(F("household.away.presence_weak_source_delay_min",ie.presence_weak_source_delay_min,{limit:de("away.presence_weak_source_delay_min"),onChange:he=>ie.presence_weak_source_delay_min=he}),"min"),`A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${O(fe("away","presence_weak_source_delay_min"))}`),m("household.away.everyone_away","When everyone has set an away until",W("household.away.everyone_away",ie.everyone_away,[["frost","Hold every room at frost protection"],["unused","Keep rooms at their unused temperature"]],he=>ie.everyone_away=he),"Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."))]}function j($,C,A){const B=$[C],Y=`household.people.${$.id}.${C}`,re=$.name||"this person",ie=J("div",{class:"periods"}),me=po(Y,B.periods);B.periods.forEach((be,_e)=>{const Oe=me[_e],Ze=W(`${Oe}.type`,be.type,[["out","Out of the house"],["work","Working from home"]],an=>{be.type=an,oe($e(`${po(Y,B.periods)[_e]}.type`))}),yt=D(`${Oe}.from`,be.from,{onChange:an=>be.from=an}),Sn=D(`${Oe}.to`,be.to,{end:!0,onChange:an=>be.to=an}),oo=J("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${be.type==="work"?"working":"out"} ${be.from} to ${be.to}`,onclick:()=>{B.periods.splice(_e,1),oe(`${$e(Y)}-add-out`),V()}});ie.append(J("div",{class:"period",role:"group","aria-label":`${A}, time ${_e+1}`,"data-path":Oe},J("div",{class:"field"},J("label",{for:Ze.id,text:"What"}),Ze),J("div",{class:"field"},J("label",{for:yt.id,text:be.type==="work"?"Starts":"Leaves"}),yt),J("div",{class:"field"},J("label",{for:Sn.id,text:be.type==="work"?"Finishes":"Back"}),Sn),oo))}),B.periods.length||ie.append(J("p",{class:"field-help",text:`${re} is at home all day.`}));const he=(be,_e,Oe)=>()=>{B.periods.push({type:be,from:_e,to:Oe});const Ze=po(Y,B.periods).at(-1);oe($e(`${Ze}.from`)),V()};return J("fieldset",{class:"routine","data-path":Y},J("legend",{text:A}),m(`${Y}.up`,`When does ${re} get up?`,D(`${Y}.up`,B.up,{onChange:be=>B.up=be})),J("div",{class:"field-group"},J("p",{class:"field-label",text:`Is ${re} out or working from home during the day?`}),ie,J("div",{class:"row"},J("button",{type:"button",class:"btn",id:`${$e(Y)}-add-out`,text:"Add time out",onclick:he("out","08:30","17:30")}),J("button",{type:"button",class:"btn",id:`${$e(Y)}-add-work`,text:"Add time working from home",onclick:he("work","09:00","17:00")}))),m(`${Y}.bed`,`When does ${re} go to bed?`,D(`${Y}.bed`,B.bed,{end:!0,onChange:be=>B.bed=be})))}function X(){const $=f.people[w],C=$.name||`Person ${w+1}`,A=`household.people.${$.id}`,B=[...v(`${C}'s routine`,f.people.length>1?`Person ${w+1} of ${f.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.`:"Usual days are enough: Radiate handles one-off changes with away and overrides."),j($,"weekdays",$.weekendSame?"Every day":"Weekdays"),U(`${$e(A)}-weekend`,"Weekends are different",!$.weekendSame,ie=>{$.weekendSame=!ie,ie&&JSON.stringify($.weekend)===JSON.stringify($.weekdays)&&($.weekend=JSON.parse(JSON.stringify(Zr.weekend))),oe(`${$e(A)}-weekend`)})];if($.weekendSame||B.push(j($,"weekend","Weekends")),Rc($)){const ie=f.rooms.map(me=>[me.id,me.name]);B.push(m(`${A}.office`,`Where does ${C} work?`,W(`${A}.office`,Ac(f,$.id)??"",[["","No particular room"],...ie],me=>Tc(f,$.id,me||null)),"That room is warm while they work. Shared rooms aren't heated while someone works."))}const Y=f.timing,re=$.weekend_days==null;return B.push(se(`person-${$.id}`,`Advanced: timing for ${C}`,m(`${A}.getting_up_min`,"Getting ready",N(F(`${A}.getting_up_min`,$.getting_up_min,{limit:de("timing.getting_up_min"),placeholder:Y.getting_up_min,onChange:ie=>$.getting_up_min=ie}),"min"),`How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${Vn(Y.getting_up_min)}.`),m(`${A}.bedtime_min`,"Winding down",N(F(`${A}.bedtime_min`,$.bedtime_min,{limit:de("timing.bedtime_min"),placeholder:Y.bedtime_min,onChange:ie=>$.bedtime_min=ie}),"min"),`How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${Vn(Y.bedtime_min)}.`),J("div",{class:"field","data-path":`${A}.weekend_days`},U(`${$e(A)}-own-weekend`,`Same weekend days as the house (${Pc(f.weekend_days)})`,re,ie=>{$.weekend_days=ie?null:[...f.weekend_days],oe(`${$e(A)}-own-weekend`)},"Untick for someone who works weekends."),re?null:ee(`${A}.weekend_days`,$.weekend_days,ie=>$.weekend_days=ie)))),B}function M($){const C=f.temperatures;return{in_use:`Kept at ${C.in_use}° while it's used.`,occasional:`Kept at ${C.occasional}° while it's used, for a bathroom or guest room.`,unused:`Kept at ${C.unused}° by day and ${C.night}° at night.`,own:"Follows its schedule from the house file. Radiate doesn't change it."}[$]}function I(){const $=J("div",{class:"setup-rooms"}),C=xc;for(const A of f.rooms){const B=`household.rooms.${A.id}`,Y=A.schedule?[...C,["own","Its own schedule"]]:C,re=W(`${B}.use`,A.own?"own":A.use,Y,he=>{A.own=he==="own",A.own||(A.use=he),oe($e(`${B}.use`))}),ie=`${$e(B)}-h`,me=J("div",{class:"card setup-room",role:"group","aria-labelledby":ie,"data-path":B},J("h4",{id:ie,text:A.name}));if(me.append(m(`${B}.use`,"How is it used?",re,M(A.own?"own":A.use))),!A.own){if(me.append(U(`${$e(B)}-weekend`,"Different at weekends",A.weekendDifferent,be=>{A.weekendDifferent=be,be||(A.weekendUse=A.use),oe(`${$e(B)}-weekend`)})),A.weekendDifferent&&me.append(m(`${B}.use.weekend`,"At weekends",W(`${B}.use.weekend`,A.weekendUse,C,be=>{A.weekendUse=be}))),!(A.use==="unused"&&(!A.weekendDifferent||A.weekendUse==="unused"))){const be=W(`${B}.kind`,A.kind,Qr.map(([_e,Oe])=>[_e,Oe]),_e=>{A.kind=_e,oe($e(`${B}.kind`))});me.append(m(`${B}.kind`,"What kind of room?",be,Nc(A.kind))),f.people.length>1&&me.append(K(A,B))}me.append(ae(A,B))}$.append(me)}return[...v("How is each room used?","Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),$]}function K($,C){const A=$.people==null,B=J("fieldset",{class:"who","data-path":`${C}.people`},J("legend",{class:"field-label",text:"Who uses it?"}));if(B.append(U(`${$e(C)}-everyone`,"Everyone",A,Y=>{$.people=Y?null:f.people.map(re=>re.id),oe(`${$e(C)}-everyone`)})),!A)for(const Y of f.people)B.append(U(`${$e(C)}-${Y.id}`,Y.name||Y.id,$.people.includes(Y.id),re=>{const ie=new Set($.people);re?ie.add(Y.id):ie.delete(Y.id),$.people=f.people.map(me=>me.id).filter(me=>ie.has(me))}));return B}function ae($,C){const A=f.temperatures,B=de("temperatures"),Y=(me,he)=>J("p",{class:"field-note","aria-live":"polite",text:ro($[me]??he,p.damp_below_c)}),re=(me,he,be,_e)=>{const Oe=me==="temperature"?null:Y(me,be),Ze=F(`${C}.${me}`,$[me],{limit:B,step:.5,placeholder:be,onChange:yt=>{$[me]=yt,Oe&&(Oe.textContent=ro(yt??be,p.damp_below_c))}});return m(`${C}.${me}`,he,N(Ze,"°C"),_e,Oe)},ie=$.use==="unused"?$.weekendUse:$.use;return se(`room-${$.id}`,`Advanced: ${$.name}`,re("temperature","Its own warm temperature",A[ie]??A.in_use,"Replaces the use level's temperature in this room only. Leave empty to use the level's."),re("night_temperature","Its own night temperature",A.night,`For a warmer nursery, say. Leave empty for the house's, ${A.night}°.`),re("unused_temperature","Its own unused temperature",A.unused,`Leave empty for the house's, ${A.unused}°.`),m(`${C}.preheat_min`,"Valve starts early by",N(F(`${C}.preheat_min`,$.preheat_min,{limit:de("timing.preheat_min"),placeholder:f.timing.preheat_min,onChange:me=>$.preheat_min=me}),"min"),`For a slow room with a small radiator. Leave empty for the house setting, ${Vn(f.timing.preheat_min)}.`))}function ve(){const $=f.temperatures,C=de("temperatures"),A=(re,ie,me)=>{const he=`household.temperatures.${re}`,_e=re==="unused"||re==="night"?J("p",{class:"field-note","aria-live":"polite",text:ro($[re],p.damp_below_c)}):null,Oe=F(he,$[re],{limit:C,step:.5,onChange:Ze=>{$[re]=Ze,_e&&(_e.textContent=ro(Ze,p.damp_below_c))}});return m(he,ie,N(Oe,"°C"),`${me} Default ${fe("temperatures",re)}°.`,_e)},B=f.timing,Y=(re,ie,me)=>{const he=`household.timing.${re}`;return m(he,ie,N(F(he,B[re],{limit:de(`timing.${re}`),onChange:be=>B[re]=be}),"min"),`${me} ${O(fe("timing",re))}`)};return[...v("How warm should rooms be?","One temperature for each way a room is used. Rooms change between them through the day."),J("div",{class:"setup-grid"},A("in_use","In use","Rooms while they're being used."),A("occasional","Occasional","Rooms used now and then, such as a bathroom, while they're used."),A("unused","Unused","Every room by day when it isn't being used."),A("night","Night","Every room overnight, from the last person in bed to the first one up.")),se("timing","Advanced: timing",J("div",{class:"field","data-path":"household.weekend_days"},J("p",{class:"field-label",text:"Weekend days"}),ee("household.weekend_days",f.weekend_days,re=>f.weekend_days=re),J("p",{class:"field-help",text:"The days that use weekend routines and weekend room use. Default Saturday and Sunday."})),Y("getting_up_min","Getting ready","How long bedrooms and shared rooms stay warm after someone gets up."),Y("bedtime_min","Winding down","How long a bedroom is warm before someone goes to bed."),Y("preheat_min","Valves start early by","How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),m("household.timing.live_preheat","How Radiate starts early",W("household.timing.live_preheat",B.live_preheat,[["optimum_start","Learn how early each room needs"],["fixed","A fixed time early, as the valves do"]],re=>B.live_preheat=re),"Learning starts each room as late as it can and still be warm in time. Default learn."),Y("merge_gap_min","Join warm periods closer than","Two warm periods this close together become one, so a room doesn't cool for a short gap."))]}function Le(){const $=J("div",{class:"setup-result"}),C=J("p",{class:"week-legend",hidden:!0}),A=J("p",{class:"away-note",hidden:!0,text:"Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back."}),B=J("div",{class:"weeks"}),Y=J("p",{class:"setup-status",id:"setup-result-status","aria-live":"polite",tabindex:"-1",text:"Building your week…"});return $.append(Y,J("div",{class:"setup-notes",id:"setup-notes"}),J("div",{class:"week-head"},C),A,B),te=oi({list:B,legendEl:C,frostEl:A}),[...v("Your heating week","Every room's week, built from your answers. Blocks are warm periods, darker when warmer."),$]}const Ke=[L,()=>X(),I,ve,Le];function Ae(){d.textContent="",so.forEach(($,C)=>{const A=C===h,B=J("li",{"aria-current":A?"step":null,"data-done":String(C<h)}),Y=`${C+1}. ${$}`;C<=b&&!A?B.append(J("button",{type:"button",class:"link",text:Y,onclick:re=>ne(C,0,re.detail===0)})):B.append(J("span",{text:Y})),d.append(B)})}function nn(){u.textContent="";const $=p.saved_problems??[];if($.length){u.hidden=!1,u.append(J("p",{text:`Your saved setup couldn't be used, so the house file's setup applies: ${$.map(C=>Ps(C.message)).join(" ")} Saving here replaces it.`}));return}if(p.source==="saved"){u.hidden=!1;const C=p.house_file?"the household section of the house file":"the schedules in the house file";u.append(J("p",{text:p.saved_at?`This setup is saved by Radiate in ${p.saved_at}. It replaces ${C}, which is left as it is.`:"This setup replaces the schedules the house started with, until you go back to them."}));const A=J("div",{class:"row",hidden:!0},J("p",{text:`This deletes the saved setup. Rooms go back to ${C}.`}),J("button",{type:"button",class:"btn",text:"Delete and use the house file",onclick:on}),J("button",{type:"button",class:"link",text:"Keep this setup",onclick:()=>{A.hidden=!0,B.hidden=!1,B.focus()}})),B=J("button",{type:"button",class:"link",text:"Use the house file's setup instead",onclick:()=>{A.hidden=!1,B.hidden=!0,A.querySelector(".btn").focus()}});u.append(B,A);return}if(p.source==="house_file"){u.hidden=!1,u.append(J("p",{text:"These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed."}));return}u.hidden=!0}function z($=null){a.dataset.instant=String(P||$!=null);const C=J("div",{class:"setup-step"},...Ke[h]());s.replaceChildren(C),Ae(),i.hidden=h===0&&w===0,c.disabled=!1,c.textContent=h===4?"Save":h===3?"See the result":"Next";const A=h===1?`${so[1]}, ${f.people[w]?.name||`person ${w+1}`}`:so[h];l.textContent=`Step ${h+1} of 5: ${A}`,ue(!1),$&&document.getElementById($)?document.getElementById($).focus():He("setup-step-h")?.focus(),h===4&&ge()}function oe($,C=!0){const A=k;z($),C&&(k=A,ue(!1)),V()}function ne($,C=0,A=!1){P=A,h=$,w=Math.min(C,f.people.length-1),b=Math.max(b,h),k=[],R=[],z(),V()}function ue($){for(const B of s.querySelectorAll(".field-error"))B.remove();for(const B of s.querySelectorAll("[aria-invalid]"))B.removeAttribute("aria-invalid"),B.dataset.describedby?B.setAttribute("aria-describedby",B.dataset.describedby):B.removeAttribute("aria-describedby"),delete B.dataset.describedby;if(r.textContent="",r.hidden=!k.length,!k.length)return;const C=[...s.querySelectorAll("[data-path]")].map(B=>B.dataset.path);r.append(J("h3",{text:k.length===1?"Check this answer":`Check these ${k.length} answers`}));const A=J("ul");k.forEach((B,Y)=>{const re=Mc(C,B.path),ie=re?s.querySelector(`[data-path="${CSS.escape(re)}"]`):null,me=Ps(B.message),he=ie?.matches("input, select")?ie:ie?.querySelector("input, select, button");if(ie){const _e=`setup-err-${Y}`,Oe=J("p",{class:"field-error",id:_e,text:me}),Ze=ie.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");if(Ze?Ze.after(Oe):ie.prepend(Oe),he){he.setAttribute("aria-invalid","true");const yt=he.getAttribute("aria-describedby")??"";he.dataset.describedby=yt,he.setAttribute("aria-describedby",`${_e} ${yt}`.trim())}}const be=ye(B.path);A.append(J("li",{},he?J("a",{href:`#${he.id}`,text:`${be}${me}`,onclick:_e=>{_e.preventDefault(),he.focus()}}):Ie(B.path,`${be}${me}`)))}),r.append(A),$&&r.focus()}function ye($){const C=$.split(".");if(C[1]==="people"&&C[2]){const A=f.people.find(Y=>Y.id===C[2]),B=C[3]?.startsWith("weekend")&&C[3]!=="weekend_days"?", weekends":C[3]?.startsWith("weekdays")?", weekdays":"";return`${A?.name||C[2]}${B}: `}return C[1]==="rooms"&&C[2]?`${f.rooms.find(A=>A.id===C[2])?.name??C[2]}: `:""}function Ie($,C){if(!$)return J("span",{text:C});const{step:A,person:B}=Ls(f,$);return A===h&&(A!==1||B===w)?J("span",{text:C}):J("button",{type:"button",class:"link",text:`${C} Change it in ${so[A]}.`,onclick:Y=>ne(A,B,Y.detail===0)})}const Se=$=>$.filter(C=>{const A=Ls(f,C.path);return A.step===h&&(h!==1||A.person===w)});async function De(){const $=Oc(f);if(Se($).length)return{errors:Se($),notes:[]};const C=await e.call("POST","household/preview",{household:Rs(f)});if(C.status!==200)throw new Error(typeof C.body=="string"?C.body:`HTTP ${C.status}`);return C.body}async function qe($){if(E)return;if(h===4){await it();return}E=!0,c.disabled=!0;let C;try{C=await De()}catch{E=!1,c.disabled=!1,k=[{path:"",message:"Couldn't check your answers. Check the connection and try again."}],ue(!0);return}if(E=!1,c.disabled=!1,k=Se(C.errors),k.length){ue(!0);return}h===1&&w<f.people.length-1?ne(1,w+1,$):ne(h+1,0,$)}function Me($){h===1&&w>0?ne(1,w-1,$):h===2?ne(1,f.people.length-1,$):h>0&&ne(h-1,0,$)}async function ge(){const $=He("setup-result-status"),C=He("setup-notes");let A;try{A=await De()}catch{$.textContent="Couldn't build the week. Check the connection, then go back and forward to try again.",c.disabled=!0;return}if(h!==4)return;if(k=A.errors,R=A.notes??[],c.disabled=k.length>0,k.length){$.textContent="Some answers need changing before Radiate can build the week.",ue(!0);return}$.textContent="Save to start using it. Radiate then rebuilds every room's schedule from your answers.",C.textContent="";const B=Dc(A.rooms);for(const Y of R)Y.path.startsWith("household.temperatures")||Y.path.includes("_temperature")||C.append(J("p",{class:"flag",text:`${ye(Y.path)||""}${Y.message[0].toUpperCase()}${Y.message.slice(1)}`}));B&&C.append(J("p",{class:"field-help",text:B})),te.update(A)}async function it(){E=!0,c.disabled=!0;const $=He("setup-result-status");$.textContent="Saving…";let C;try{C=await e.call("PUT","household",{household:Rs(f)})}catch{C={status:0,body:null}}if(E=!1,c.disabled=!1,C.status===200){q(),At(!1),t("Household setup saved. Every room's schedule is rebuilt from it.");return}if(C.status===400&&C.body?.errors){k=C.body.errors,$.textContent="Not saved: some answers need changing.",ue(!0);return}$.textContent=C.body?.message?`Not saved. ${C.body.message}.`:"Not saved. Check the connection and try again.",$.focus?.()}async function on(){let $;try{$=await e.call("DELETE","household")}catch{$={status:0}}if($.status!==200){k=[{path:"",message:"Couldn't go back to the house file's setup. Try again."}],ue(!0);return}q(),At(!1),t("Using the house file's setup again. The saved setup is deleted.")}function At($=!0){$&&f&&V(),a.hidden=!0,o()}let xn=!1;return c.addEventListener("click",$=>{xn=$.detail===0}),He("setup-form").addEventListener("submit",$=>{$.preventDefault(),qe(xn)}),i.addEventListener("click",$=>Me($.detail===0)),He("setup-close").addEventListener("click",()=>At(!0)),He("setup-restart").addEventListener("click",()=>{q(),f=As(p),Q.clear(),g.hidden=!0,b=0,ne(0)}),{async open(){const $=await e.call("GET","household");if($.status!==200)throw new Error(`household: HTTP ${$.status}`);p=$.body,x=JSON.stringify(p.household);const C=dd(),A=C?.v===1&&C.base===x&&C.draft?.people?.length;f=A?C.draft:As(p),h=A?Math.min(C.step,4):0,w=A?Math.min(C.person??0,f.people.length-1):0,b=A?Math.max(C.reached??0,h):0,g.hidden=!A,He("setup-h").textContent=p.household?"Change household setup":"Set up your household",k=[],P=!1,Q.clear(),nn(),a.hidden=!1,n(),z(),He("setup-h").focus()},async available(){try{return(await e.call("GET","household")).status===200}catch{return null}}}}const Fe=e=>document.getElementById(e),hd={ok:"success",attention:"warning",offline:"warning"};function pd(e,t){const n=hd[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const fd=1e4,md=2e3;function xo(e){return e==null?"–":e<60?"just now":e<3600?`${Math.floor(e/60)} min ago`:e<172800?`${Math.floor(e/3600)} h ago`:`${Math.floor(e/86400)} days ago`}function qs(e){const t=Math.max(1,Math.ceil(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} h ${t%60} min`}const gd={strong:"Strong",fair:"Fair",weak:"Weak"},bd={weak:1,fair:2,strong:3},wd={auto:"auto",heat:"heat",off:"off"};function Is(e,t){return t==="device.offline"?`Not reachable. Last heard ${xo(e.last_seen_s)}.`:t==="device.low_battery"?`Battery low at ${e.battery_pct}%. Replace the batteries soon.`:t==="device.weak_signal"?`Weak signal (LQI ${e.linkquality}). A router nearer to it would help.`:t==="device.stale"?`No temperature for ${xo(e.reading_age_s).replace(" ago","")}.`:"Needs attention."}function yd(e){return e.status==="offline"?["Offline","offline"]:e.status==="attention"?["Needs attention","attention"]:e.available==null?["No data yet",""]:["Online","ok"]}function vd(e){const t=[],n=e.temperature_c!=null?`${e.temperature_c.toFixed(1)}°`:null;if(e.kind==="trv"){const a=e.valve??{};n&&t.push(`${n} at the valve`),a.opening_pct!=null&&t.push(`opening limit ${Math.round(a.opening_pct)}%`),a.running_state&&t.push(a.running_state==="heat"?"heating":"idle"),a.mode&&t.push(`${wd[a.mode]??a.mode} mode`)}else if(e.kind==="relay"){const a=e.relay??{};a.heating!=null&&t.push(`heating ${a.heating?"on":"off"}`),a.store!=null&&t.push(`hot water ${a.store?"on":"off"}`),a.power_w!=null&&t.push(`${Math.round(a.power_w)} W`)}else e.kind==="window"?e.contact!=null&&t.push(e.contact?"window closed":"window open"):e.kind!=="router"&&(n&&t.push(n),e.humidity_pct!=null&&t.push(`${Math.round(e.humidity_pct)}% humidity`));if(!t.length)return e.kind==="router"?"Relays messages for nearby devices.":"–";const o=t.join(", ");return o[0].toUpperCase()+o.slice(1)}function kd(e,t){return e.kind==="relay"?"Wi-Fi":e.route?`Via ${e.route.via_kind==="coordinator"?"the coordinator":e.route.via}${e.route.lqi!=null?` (LQI ${Math.round(e.route.lqi)})`:""}`:t?"Not in the last scan":null}function $d({transport:e,isAuthError:t,onAuth:n,scanLock:o=()=>""}){const a=new Map;let s=null,r=null,i=!1,c=!1,l="";function d(b,k){let R=a.get(b.id);return R||(R=Fe("device-tpl").content.firstElementChild.cloneNode(!0),R.id=`device-${b.id.replace(/[^\w-]/g,"_")}`,R.dataset.kind=b.kind,a.set(b.id,R)),R.parentElement!==k&&k.appendChild(R),R}function u(b,k,R){const E=d(b,k);E.querySelector(".name").textContent=b.label,E.dataset.status=b.status;const[P,Z]=yd(b),Q=E.querySelector(".badge");Q.textContent=P,pd(Q,Z);const te=E.querySelector(".device-flags"),T=b.problems.map(v=>Is(b,v.code)),V=JSON.stringify(T);if(te.dataset.key!==V){te.dataset.key=V,te.textContent="";for(const v of T){const _=document.createElement("li");_.className="flag",_.textContent=v,te.appendChild(_)}}te.hidden=!T.length;const q=E.querySelector(".ds-battery"),m=q.querySelector(".ds-val"),D=q.querySelector(".meter");b.battery_pct!=null?(m.textContent=`${b.battery_pct}%`,D.hidden=!1,D.dataset.low=String(b.battery_low),D.value=Math.max(0,Math.min(100,b.battery_pct))):(m.textContent=b.power==="mains"?"Mains":"–",D.hidden=!0),q.dataset.low=String(b.battery_low);const F=E.querySelector(".ds-signal"),N=F.querySelector(".ds-val"),W=F.querySelector(".ds-sub"),U=F.querySelector(".sig");W.textContent="",b.kind==="relay"?(N.textContent="Wi-Fi",U.hidden=!0):b.linkquality!=null&&b.available!==!1?(N.textContent=gd[b.signal],W.textContent=`LQI ${b.linkquality}`,U.hidden=!1,U.dataset.level=b.signal,U.dataset.bars=String(bd[b.signal])):(N.textContent="–",U.hidden=!0),F.dataset.weak=String(b.signal==="weak"&&b.available!==!1),E.querySelector(".ds-seen .ds-val").textContent=xo(b.last_seen_s),E.querySelector(".device-reading").textContent=vd(b);const ee=E.querySelector(".meta"),se=[];b.kind!=="relay"&&se.push(["code",b.id]);const de=[b.vendor,b.model].filter(Boolean).join(" ");de&&se.push(["",de]),b.firmware&&se.push(["",`Firmware ${b.firmware}`]);const fe=kd(b,R);fe&&se.push(["route",fe]);const O=JSON.stringify(se);if(ee.dataset.key!==O){ee.dataset.key=O,ee.textContent="";for(const[v,_]of se){const L=document.createElement(v==="code"?"code":"span");v==="route"&&(L.className="route"),L.textContent=_,ee.appendChild(L)}}}function g(b){const k=b.summary,R=[];k.offline&&R.push(`${k.offline} offline`),k.low_battery&&R.push(`${k.low_battery} low battery`),k.weak_signal&&R.push(`${k.weak_signal} weak signal`);const E=`${k.total} ${k.total===1?"device":"devices"}`;Fe("devices-summary").textContent=k.attention?`${E}. ${k.attention} ${k.attention===1?"needs":"need"} attention${R.length?`: ${R.join(", ")}`:""}.`:`${E}, all healthy.`;const P=b.network??{},Z=[];P.mqtt!=null&&Z.push(P.mqtt?"MQTT connected":"MQTT not connected"),P.zigbee2mqtt!=null&&Z.push(P.zigbee2mqtt?"Zigbee2MQTT online":"Zigbee2MQTT offline"),Fe("devices-network").textContent=Z.length?`${Z.join(". ")}.`:"";const Q=Fe("devices-attention"),te=Fe("devices-attention-list"),T=b.devices.filter(q=>q.status!=="ok");Q.hidden=!T.length;const V=JSON.stringify(T.map(q=>q.id));if(te.dataset.key!==V){te.dataset.key=V,te.textContent="";for(const q of T){const m=document.createElement("li");m.dataset.id=q.id;const D=document.createElement("a");D.href="#devices",D.className="attention-link",D.textContent=q.label,D.addEventListener("click",N=>{N.preventDefault();const W=a.get(q.id);W&&(W.scrollIntoView({block:"center"}),W.focus({preventScroll:!0}))});const F=document.createElement("span");m.append(D,F),te.appendChild(m)}}for(const q of T){const m=te.querySelector(`li[data-id="${CSS.escape(q.id)}"] span`);m&&(m.textContent=`: ${q.problems.map(D=>Is(q,D.code)).join(" ")}`)}}function p(b){const k=Fe("mesh-tree"),R=b.devices.filter(T=>T.route);k.hidden=!R.length;const E=JSON.stringify(R.map(T=>[T.id,T.route.via,T.route.lqi]));if(k.dataset.key===E)return;k.dataset.key=E,k.textContent="";const P=new Map;for(const T of R){const V=T.route.via_kind==="coordinator"?"Coordinator":T.route.via;P.has(V)||P.set(V,[]),P.get(V).push(T)}const Z=new Map(b.devices.map(T=>[T.id,T.label])),Q=new Set,te=(T,V)=>{const q=document.createElement("li"),m=document.createElement("span");m.className="tree-node",m.textContent=V,q.appendChild(m);const D=(P.get(T)??[]).slice().sort((N,W)=>(N.kind==="router")-(W.kind==="router")||N.label.localeCompare(W.label));if(!D.length||Q.has(T))return q;Q.add(T);const F=document.createElement("ul");for(const N of D){const W=document.createElement("span");W.className="tree-lqi",W.textContent=N.route.lqi!=null?`LQI ${Math.round(N.route.lqi)}`:"",W.dataset.weak=String(N.route.lqi!=null&&N.route.lqi<b.limits.weak_signal_lqi);let U;if(N.kind==="router")U=te(N.id,N.label),U.firstElementChild.after(W);else{U=document.createElement("li");const ee=document.createElement("span");ee.className="tree-node",ee.textContent=N.label,U.append(ee,W)}F.appendChild(U)}return q.appendChild(F),q};k.appendChild(te("Coordinator","Coordinator"));for(const T of P.keys())!Q.has(T)&&T!=="Coordinator"&&k.appendChild(te(T,Z.get(T)??T))}function f(b){const k=b.scan,R=Fe("mesh-scan"),E=Fe("mesh-status");Fe("devices-mesh-section").hidden=!k.available&&!b.devices.some(te=>te.kind==="router"),R.hidden=!k.available;const P=k.state==="scanning",Z=o();R.disabled=!!Z||P||k.retry_in_s>0,Z?R.dataset.locked="":delete R.dataset.locked,Fe("mesh-lock").hidden=!Z||!k.available,Fe("mesh-lock").textContent=Z,R.setAttribute("aria-busy",String(P)),R.loading=P,R.lastChild.textContent=P?"Scanning…":"Scan network",E.dataset.error=String(k.state==="failed"||!!l);let Q;l?Q=l:P?Q="Scanning. This can take up to 2 minutes.":k.state==="failed"?Q=`The scan didn't finish: ${k.error}. Radiate will let you try again in ${qs(k.retry_in_s||60)}.`:k.scanned_s_ago!=null?Q=`Scanned ${xo(k.scanned_s_ago)}.`:Q="Not scanned yet.",!P&&k.retry_in_s>0&&k.state!=="failed"&&!l&&(Q+=` You can scan again in ${qs(k.retry_in_s)}.`),E.textContent=Q}function x(b){s=b,g(b);const k=b.scan.scanned_s_ago!=null,R=Fe("devices-rooms"),E=Fe("devices-routers"),P=Fe("devices-boiler"),Z=new Set;for(const Q of b.devices){Z.add(Q.id);const te=Q.kind==="router"?E:Q.kind==="relay"?P:R;u(Q,te,k)}for(const[Q,te]of a)Z.has(Q)||(te.remove(),a.delete(Q));Fe("devices-boiler-section").hidden=!P.children.length,f(b),p(b)}async function h(){if(!c){c=!0;try{x(await e.get("devices"))}catch(b){t(b)?n():s||(Fe("devices-summary").textContent="Couldn't load the devices. Retrying…")}c=!1,w()}}function w(){clearTimeout(r),i&&(r=setTimeout(h,s?.scan.state==="scanning"?md:fd))}return Fe("mesh-scan").addEventListener("click",async()=>{const b=Fe("mesh-scan");b.disabled=!0,l="";try{const k=await e.call("POST","devices/scan",{});k.status!==200&&(l=`Not started: ${typeof k.body=="object"?k.body.message:k.body}.`)}catch(k){if(t(k)){n();return}l="Not started. Check the connection and try again."}await h(),b.disabled||b.focus()}),{async available(){try{return x(await e.get("devices")),!0}catch(b){return t(b)?null:/HTTP 404|not found|reports no devices/.test(String(b?.message))?!1:null}},show(){i=!0,h()},hide(){i=!1,clearTimeout(r)}}}const ht=e=>document.getElementById(e),xd={act:"warning",ok:"success"};function Bs(e,t){const n=xd[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const Sd=3e4,_d=3e5,Cd={act:["Act on this","act"],consider:["Worth considering","consider"],info:["For information","info"]},Ed={ready:["Ready","ok"],learning:["Learning",""],not_judged:["Not judged",""]},Ad={low:"Low confidence",medium:"Medium confidence",high:"High confidence"},ai=(e,t,n)=>`${e} ${e===1?t:n}`;function Td(e){const t=e.summary;if(t.total){const n=[];return t.act&&n.push(`${t.act} to act on`),t.consider&&n.push(`${t.consider} to consider`),t.info&&n.push(`${t.info} for information`),`${ai(t.total,"suggestion","suggestions")}: ${n.join(", ")}.`}return t.rooms_learning&&!t.rooms_ready?"Nothing to suggest yet. Radiate is still learning.":"Nothing to suggest."}function Rd(e){const t=e.summary,n=Math.round(e.settings.min_learning_h);return t.rooms_learning&&!t.rooms_ready?`Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${n} h of learning; you can see how far each room has got below.`:t.rooms_learning?`The rooms Radiate can judge so far heat up and hold their warmth as expected. ${ai(t.rooms_learning,"room is","rooms are")} still learning.`:t.rooms_ready?"Every room Radiate can judge heats up and holds its warmth as expected.":"None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them."}function Ld(e){return`${Ad[e.confidence]??"Confidence unknown"}. ${e.basis}`}function Md(e){const t=e.summary;return t.rooms_compared>=t.min_rooms?"":`Rooms are compared with each other once ${t.min_rooms} have enough learning. ${t.rooms_compared?`${t.rooms_compared} so far.`:"None yet."}`}function Od({transport:e,isAuthError:t,onAuth:n,onCount:o}){const a=new Map,s=new Map;let r=null,i=null,c=!1,l=!1;function d(h){let w=a.get(h.id);w||(w=ht("suggestion-tpl").content.firstElementChild.cloneNode(!0),a.set(h.id,w));const[b,k]=Cd[h.severity]??["",""];w.dataset.severity=h.severity,w.querySelector(".name").textContent=h.title;const R=w.querySelector(".badge");return R.textContent=b,Bs(R,k),w.querySelector(".sg-evidence").textContent=h.evidence,w.querySelector(".sg-action").textContent=h.action,w.querySelector(".sg-basis").textContent=Ld(h),w}function u(h,w){let b=s.get(h.room_id);b||(b=ht("learning-tpl").content.firstElementChild.cloneNode(!0),s.set(h.room_id,b)),b.querySelector(".lr-name").textContent=h.room_name;const[k,R]=Ed[h.status]??[h.status,""],E=b.querySelector(".badge");E.textContent=k,Bs(E,R),b.querySelector(".lr-note").textContent=h.note;const P=b.querySelector(".lr-meter");return P.hidden=h.status!=="learning",P.value=Math.round(100*Math.max(0,Math.min(1,h.hours/Math.max(1,w)))),P.label=`${h.room_name}: ${Math.round(h.hours)} of ${Math.round(w)} h of learning`,b}function g(h,w){let b=h.firstElementChild;for(const k of w)k===b?b=b.nextElementSibling:h.insertBefore(k,b);for(;b;){const k=b.nextElementSibling;b.remove(),b=k}}function p(h){r=h,o?.(h.summary.act),ht("suggestions-summary").textContent=Td(h);const w=ht("suggestions-list"),b=new Set(h.suggestions.map(Q=>Q.id));for(const Q of a.keys())b.has(Q)||a.delete(Q);g(w,h.suggestions.map(d));const k=ht("suggestions-empty"),R=h.summary.rooms_learning>0&&!h.summary.rooms_ready;k.hidden=h.suggestions.length>0&&!R,k.dataset.state=R?"learning":"clear",k.classList.toggle("radiate-cool",R),R?k.removeAttribute("variant"):k.setAttribute("variant","success"),ht("suggestions-empty-h").textContent=R?"Still learning":"Nothing to suggest",ht("suggestions-empty-text").textContent=Rd(h);const E=ht("learning-list"),P=new Set(h.learning.map(Q=>Q.room_id));for(const Q of s.keys())P.has(Q)||s.delete(Q);g(E,h.learning.map(Q=>u(Q,h.settings.min_learning_h))),ht("learning-section").hidden=!h.learning.length;const Z=ht("learning-compare");Z.textContent=Md(h),Z.hidden=!Z.textContent}async function f(){if(!l){l=!0;try{p(await e.get("suggestions"))}catch(h){t(h)?n():!r&&c&&(ht("suggestions-summary").textContent="Couldn't load the suggestions. Retrying…")}l=!1,x()}}function x(){clearTimeout(i),i=setTimeout(f,c?Sd:_d)}return{async available(){try{return p(await e.get("suggestions")),x(),!0}catch(h){return t(h)?null:/HTTP 404|not found/.test(String(h?.message))?!1:null}},show(){c=!0,f()},hide(){c&&(c=!1,x())}}}const Te=e=>document.getElementById(e),Nd=6e4,zd=6e5,Pd="−",On="–",si=["January","February","March","April","May","June","July","August","September","October","November","December"],Dd=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Vo=e=>{const[t,n,o]=String(e).split("-").map(Number);return new Date(Date.UTC(t,n-1,o))},qd=e=>{const t=Vo(e);return`${t.getUTCDate()} ${si[t.getUTCMonth()]}`},fn=e=>{const t=Vo(e);return`${t.getUTCDate()} ${si[t.getUTCMonth()].slice(0,3)}`},ss=e=>{const t=Vo(e);return`${Dd[t.getUTCDay()]} ${fn(e)}`};function pt(e){const t=Math.abs(e);return t<9.95?t.toFixed(1):String(Math.round(t))}const Hs=e=>`${pt(e)} ${pt(e)==="1.0"?"litre":"litres"}`;function ri(e,t=1){if(e==null)return On;const n=Number(e.toFixed(t));return n<0?`${Pd}${Math.abs(n).toFixed(t)}`:n.toFixed(t)}const ha=(e,t=1)=>e==null?On:e.toFixed(t),Nn=e=>e==null?On:`${Math.round(e*100)}%`;function Id(e){return e==null?"with no room in use to keep warm":`with rooms in use warm ${Nn(e)} of the time`}function ii(e){if(e.status==="ready"&&e.totals){const t=e.totals,n=qd(t.since),o=Id(t.warm_share);return Math.abs(t.litres_saved)<.05?`About the same oil as the baseline since ${n}, ${o}.`:t.litres_saved<0?`About ${Hs(t.litres_saved)} more than the baseline since ${n}, ${o}.`:`About ${Hs(t.litres_saved)} of oil saved since ${n}, ${o}.`}return e.status==="learning"?Bd(e):Fd(e)}function Bd(e){return`Still learning how much oil this house uses: ${e.why??`${e.progress.eligible_days} of ${e.progress.needed_days} days`}.`}function Hd(e){const t=e.progress,n=Math.max(0,t.needed_days-t.eligible_days);return`${n?`Figures start once ${t.needed_days} full days have counted, so at least ${n} more ${n===1?"day":"days"}`:`${t.eligible_days} days have counted`}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`}const li={"no household":["Savings need a household","The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare."],"no outdoor sensor":["Savings need an outdoor sensor","Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add a Zigbee outdoor sensor as house.outdoor_sensor in the house file, or set house.outdoor_source to home_assistant and pick an outdoor entity in the Radiate integration's options."],"no outdoor readings yet":["Savings need outdoor readings","Radiate takes the outdoor temperature from Home Assistant, and no fresh reading has arrived yet. Check the outdoor entity in the Radiate integration's options, and that it reports at least every few hours."],"no nozzle rating":["Savings need the nozzle rating","Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record."]};function Fd(e){return(li[e.why]??["Savings aren't measured yet"])[0]}function jd(e){return(li[e.why]??["",`Radiate can't measure savings yet: ${e.why??"no reason given"}.`])[1]}function Wd(e){return[e.litres_upper_bound?"Litres are an upper bound until the burner itself is measured.":e.basis_text??"",e.outdoor?.text??""].filter(Boolean).join(" ")}const Ud=e=>{const t=Vo(e);return t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7),t.toISOString().slice(0,10)};function Fs(e,t="days"){const n=e.days??[];if(t!=="weeks")return n.map(a=>({key:a.date,label:ss(a.date),tick:fn(a.date),counted:a.eligible?1:0,total:1,eligible:a.eligible,why:a.why,litres:a.eligible?a.litres:null,baseline:a.eligible?a.litres_baseline:null,saved:a.eligible?a.litres_saved:null,warm:a.warm_share,deficit:a.comfort_deficit_kh,outdoor:a.outdoor_mean_c}));const o=new Map;for(const a of n){const s=Ud(a.date);o.has(s)||o.set(s,[]),o.get(s).push(a)}return[...o].map(([a,s])=>{const r=s.filter(l=>l.eligible),i=l=>r.length&&r.every(d=>d[l]!=null)?r.reduce((d,u)=>d+u[l],0):null,c=s.filter(l=>l.comfort_deficit_kh!=null);return{key:a,week:!0,label:`Week of ${fn(a)}`,tick:fn(a),counted:r.length,total:s.length,eligible:r.length>0,why:r.length?null:[...new Set(s.map(l=>l.why).filter(Boolean))].join("; ")||"no day counted",litres:i("litres"),baseline:i("litres_baseline"),saved:i("litres_saved"),warm:null,deficit:c.length?c.reduce((l,d)=>l+d.comfort_deficit_kh,0):null,outdoor:null}})}function ci(e){if(!e.eligible)return`${e.label}: not counted, ${e.why}.`;const t=[];e.week&&t.push(`${e.counted} of ${e.total} ${e.total===1?"day":"days"} counted`),e.litres!=null&&t.push(`${e.litres.toFixed(1)} L used`),e.saved!=null&&(t.push(`baseline about ${e.baseline.toFixed(1)} L`),Math.abs(e.saved)<.05?t.push("about the same as the baseline"):e.saved<0?t.push(`about ${pt(e.saved)} L more than the baseline`):t.push(`about ${pt(e.saved)} L saved`));const n=[];e.warm!=null&&n.push(`rooms in use warm ${Nn(e.warm)} of the time`),e.deficit!=null&&n.push(`${e.deficit.toFixed(1)} degree-hours short`),e.outdoor!=null&&n.push(`${e.outdoor.toFixed(1)}° outside on average`);const o=`${e.label}: ${t.join(", ")}.`;return n.length?`${o} ${n.join(", ").replace(/^./,a=>a.toUpperCase())}.`:o}function Vd(e,t,n="days"){const o=n==="weeks"?"week":"day";if(!t.length)return`Oil used each ${o}: no full ${o} yet.`;const a=`${t.length} ${t.length===1?o:`${o}s`} from ${t[0].tick} to ${t.at(-1).tick}`,s=t.filter(d=>d.eligible),r=t.length-s.length,i=r?` ${r} not counted.`:"";if(e.status!=="ready")return`Bar chart of oil used each ${o}, ${a}. ${s.length} counted so far.${i}`;const c=s.filter(d=>d.saved!=null&&d.saved>=.05).length,l=s.filter(d=>d.saved!=null&&d.saved<=-.05).length;return`Bar chart of oil used each ${o} against the baseline, ${a}. Less than the baseline on ${c}, more on ${l}.${i}`}function Kd(e){return(e.days??[]).map(t=>[ss(t.date),t.eligible?"Yes":`No, ${t.why}`,ha(t.litres),ha(t.litres_baseline),ri(t.litres_saved),t.outdoor_mean_c==null?On:`${t.outdoor_mean_c.toFixed(1)}°`,Nn(t.warm_share),ha(t.comfort_deficit_kh)])}function Jd(e){if(e.status==="ready"&&e.totals){const a=e.totals,s=a.percent_saved,r=s==null?"":s<0?`${Math.abs(s).toFixed(1)}% more than the baseline`:`${s.toFixed(1)}% less than the baseline`;return[[a.litres_saved<0?"Oil over the baseline":"Oil saved",`About ${pt(a.litres_saved)} L`,r],["Oil used",`${pt(a.litres_used)} L`,`Baseline about ${pt(a.litres_baseline)} L`],["Rooms in use warm",Nn(a.warm_share),`${a.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],["Days counted",String(a.days),`Since ${fn(a.since)}`]]}const t=(e.days??[]).filter(a=>a.eligible&&a.litres!=null),n=t.reduce((a,s)=>a+s.litres,0),o=(e.days??[]).filter(a=>!a.partial&&a.warm_share!=null).at(-1);return[["Days counted",`${e.progress.eligible_days} of ${e.progress.needed_days}`,""],["Oil used on those days",t.length?`${pt(n)} L`:On,t.length?`${pt(n/t.length)} L a day on average${e.litres_upper_bound?", an upper bound":""}`:""],["Rooms in use warm",o?Nn(o.warm_share):On,o?`On ${fn(o.date)}`:""]]}function Yd(e){return e.status==="ready"?ii(e):""}const js=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Je=e=>Math.round(e*10)/10;function Gd(e){if(!(e>0))return 1;const t=e/4,n=10**Math.floor(Math.log10(t));return[1,2,2.5,5,10].map(o=>o*n).find(o=>o>=t)}function Xd(e,{width:t,height:n,ready:o,active:a=e.length-1,labelEvery:s}){const d=Math.max(10,t-40-4),u=Math.max(10,n-10-22),g=Math.max(0,...e.flatMap(E=>[E.litres??0,o?E.baseline??0:0])),p=Gd(g),f=Math.max(p,Math.ceil(g/p)*p),x=E=>Je(10+u-E/f*u),h=d/Math.max(1,e.length),w=Math.max(3,Math.min(h*.78,40)),b=Math.max(2,w*(o?.56:1)),k=s??Math.max(1,Math.ceil(e.length/Math.max(1,Math.floor(d/56)))),R=[];R.push(`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="false">`),R.push('<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>');for(let E=0;E<=f+1e-9;E+=p){const P=x(E);R.push(`<line class="${E===0?"sv-zero":"sv-grid"}" x1="40" x2="${t-4}" y1="${P}" y2="${P}"/>`);const Z=E+p>f+1e-9?" L":"";R.push(`<text class="sv-ytick" x="34" y="${P+4}" text-anchor="end">${Number(E.toFixed(2))}${Z}</text>`)}return e.forEach((E,P)=>{const Z=40+h*(P+.5),Q=P===a?0:-1;R.push(`<g class="sv-slot" data-i="${P}" tabindex="${Q}" role="img" aria-label="${js(ci(E))}" data-counted="${E.eligible}">`),R.push(`<rect class="sv-hit" x="${Je(40+h*P)}" y="10" width="${Je(h)}" height="${u}"/>`),!E.eligible||E.litres==null?R.push(`<rect class="sv-empty" x="${Je(Z-w/2)}" y="10" width="${Je(w)}" height="${u}"/>`):(R.push(`<rect class="sv-act" x="${Je(Z-b/2)}" y="${x(E.litres)}" width="${Je(b)}" height="${Je(x(0)-x(E.litres))}"/>`),o&&E.baseline!=null&&R.push(`<rect class="sv-base" x="${Je(Z-w/2)}" y="${x(E.baseline)}" width="${Je(w)}" height="${Je(x(0)-x(E.baseline))}"/>`)),R.push(`<rect class="sv-ring" x="${Je(Z-w/2-3)}" y="7" width="${Je(w+6)}" height="${u+6}"/>`),R.push("</g>"),P%k===0&&R.push(`<text class="sv-xtick" x="${Je(Z)}" y="${n-6}" text-anchor="middle">${js(E.tick)}</text>`)}),R.push("</svg>"),R.join("")}function Qd(e){if(e.status!=="ready"||!e.totals)return[];const t=(e.days??[]).filter(a=>a.eligible&&a.litres_saved!=null);let n=e.totals.litres_saved-t.reduce((a,s)=>a+s.litres_saved,0);const o=[];for(const a of t)n+=a.litres_saved,o.push([a.date,n]);return o}function Zd(e,{width:t,height:n}){const i=e.map(f=>f[1]),c=Math.min(0,...i),d=Math.max(0,...i)-c||1,u=f=>Je(34+(e.length<2?0:f/(e.length-1)*(t-34-8))),g=f=>Je(8+(1-(f-c)/d)*(n-8-8)),p=e.map((f,x)=>`${x?"L":"M"}${u(x)} ${g(f[1])}`).join(" ");return[`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="true">`,`<line class="sv-zero" x1="34" x2="${t-8}" y1="${g(0)}" y2="${g(0)}"/>`,`<text class="sv-ytick" x="28" y="${g(0)+4}" text-anchor="end">0</text>`,`<path class="sv-line" d="${p}"/>`,e.length?`<rect class="sv-dot" x="${u(e.length-1)-3}" y="${g(i.at(-1))-3}" width="6" height="6"/>`:"","</svg>"].join("")}function eu(e,t){if(!t.length)return"";const n=t.at(-1)[1],o=fn(e.totals.since);return Math.abs(n)<.05?`About the same oil as the baseline in all since ${o}.`:n<0?`Running total: about ${pt(n)} L more than the baseline since ${o}.`:`Running total: about ${pt(n)} L saved since ${o}.`}function tu({transport:e,isAuthError:t,onAuth:n,onView:o}){let a=null,s=null,r=null,i=!1,c=!1,l="days",d=null,u=[],g=0;const p=()=>Te("savings-chart");function f(T,V){const q=Te(T);q.textContent!==V&&(q.textContent=V),q.hidden=!V}function x(T){Te("savings-stats").replaceChildren(...Jd(T).map(([q,m,D])=>{const F=document.createElement("div"),N=document.createElement("dt");N.textContent=q;const W=document.createElement("dd"),U=document.createElement("span");if(U.textContent=m,W.append(U),D){const ee=document.createElement("span");ee.className="sub",ee.textContent=D,W.append(ee)}return F.append(N,W),F}))}function h(T){const V=u[T];Te("savings-readout").textContent=V?ci(V):""}function w(){const T=p(),V=Math.floor(T.clientWidth);if(!V)return;g=V;const q=T.contains(document.activeElement)?document.activeElement.dataset.i:null;let m=u.findIndex(F=>F.key===d);m<0&&(m=u.length-1);const D=V<520;T.innerHTML=Xd(u,{width:V,height:D?180:220,ready:a.status==="ready",active:m}),T.setAttribute("aria-label",Vd(a,u,l)),h(m),q!=null&&T.querySelector(`.sv-slot[data-i="${m}"]`)?.focus()}function b(T){const V=p().querySelectorAll(".sv-slot");if(!V.length)return;const q=Math.max(0,Math.min(V.length-1,T));for(const m of V)m.setAttribute("tabindex","-1");V[q].setAttribute("tabindex","0"),V[q].focus(),d=u[q]?.key??null,h(q)}function k(){const T=p();T.addEventListener("keydown",V=>{const q=Number(document.activeElement?.dataset?.i);if(Number.isNaN(q))return;const m={ArrowRight:q+1,ArrowLeft:q-1,Home:0,End:u.length-1}[V.key];m!=null&&(V.preventDefault(),b(m))}),T.addEventListener("focusin",V=>{const q=Number(V.target?.dataset?.i);Number.isNaN(q)||(d=u[q]?.key??null,h(q))}),T.addEventListener("click",V=>{const q=V.target.closest?.(".sv-slot");q&&b(Number(q.dataset.i))}),T.addEventListener("pointerover",V=>{const q=V.target.closest?.(".sv-slot");q&&V.pointerType==="mouse"&&h(Number(q.dataset.i))}),T.addEventListener("pointerleave",()=>{const V=u.findIndex(q=>q.key===d);h(V<0?u.length-1:V)}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&i&&Math.floor(T.clientWidth)!==g&&w()}).observe(T)}function R(T){const V=T.rooms??[];if(Te("savings-rooms-section").hidden=!V.length,!V.length)return;const q=Math.max(...V.map(F=>Math.abs(F.litres_saved)),.01),m=V.some(F=>F.litres_saved<0),D=Te("savings-rooms");D.dataset.negative=String(m),D.replaceChildren(...V.map(F=>{const N=document.createElement("li");N.className="sv-room";const W=document.createElement("span");W.className="sv-room-name",W.textContent=F.name;const U=document.createElement("span");U.className="sv-room-track",U.setAttribute("aria-hidden","true");const ee=document.createElement("span");ee.className="sv-room-fill",ee.dataset.sign=F.litres_saved<0?"minus":"plus",ee.style.transform=`scaleX(${Math.abs(F.litres_saved)/q})`,U.append(ee);const se=document.createElement("span");se.className="sv-room-value",se.textContent=`${ri(F.litres_saved)} L`;const de=document.createElement("span");return de.className="sv-room-sub",de.textContent=F.warm_share==null?"Not in use in this time.":`Warm ${Nn(F.warm_share)} of the time in use, ${F.comfort_deficit_kh.toFixed(1)} degree-hours short.`,N.append(W,U,se,de),N}))}function E(T){Te("savings-table-body").replaceChildren(...Kd(T).map(q=>{const m=document.createElement("tr");return q.forEach((D,F)=>{const N=document.createElement(F===0?"th":"td");F===0&&(N.scope="row"),N.textContent=D,m.append(N)}),m})),Te("savings-table-empty").hidden=(T.days??[]).length>0}function P(T){a=T,o?.(T);const V=JSON.stringify(T);if(V===s)return;s=V;const q=T.status;if(Te("savings").dataset.state=q,f("savings-headline",ii(T)),Te("savings-missing").hidden=q!=="unavailable",f("savings-missing-text",q==="unavailable"?jd(T):""),Te("savings-body").hidden=q==="unavailable",q==="unavailable")return;f("savings-baseline",T.baseline?.text??""),f("savings-basis",Wd(T));const m=q==="learning";if(Te("savings-progress").hidden=!m,m){const W=T.progress;Te("savings-meter").value=Math.round(100*Math.max(0,Math.min(1,W.eligible_days/Math.max(1,W.needed_days)))),f("savings-learning",Hd(T))}x(T),Te("savings-chart-h").textContent=m?"Oil used each day so far":"Oil used against the baseline",Te("savings-legend-base").hidden=m,Te("savings-modes").hidden=(T.days??[]).length<8,u=Fs(T,l),Te("savings-chart-empty").hidden=u.length>0,Te("savings-chart-wrap").hidden=!u.length,i?w():g=0;const D=(T.days??[]).filter(W=>!W.eligible);Te("savings-skipped").replaceChildren(...D.map(W=>{const U=document.createElement("li");return U.textContent=`${ss(W.date)}: ${W.why}.`,U})),Te("savings-skipped-section").hidden=!D.length;const N=Qd(T);if(Te("savings-running").hidden=N.length<2,N.length>=2){const W=Te("savings-line-chart");W.innerHTML=Zd(N,{width:Math.max(200,Math.floor(W.clientWidth)||320),height:90}),f("savings-running-text",eu(T,N))}R(T),E(T)}async function Z(){if(!c){c=!0;try{P(await e.get("savings"))}catch(T){t(T)?n():!a&&i&&(Te("savings-headline").textContent="Couldn't load the savings. Retrying…")}c=!1,Q()}}function Q(){clearTimeout(r),r=setTimeout(Z,i?Nd:zd)}Te("savings-modes").addEventListener("change",T=>{const V=T.target.value;!V||V===l||(l=V,d=null,a&&(u=Fs(a,l),w()))});const te=Te("savings-table-toggle");return te.addEventListener("change",()=>{Te("savings-table-wrap").hidden=!te.checked}),k(),{async available(){try{return P(await e.get("savings")),Q(),!0}catch(T){return t(T)?null:/HTTP 404|not found/.test(String(T?.message))?!1:null}},show(){i=!0,a&&(s=null,P(a)),Z()},hide(){i&&(i=!1,Q())},refresh:Z}}const pe=e=>document.getElementById(e),nu={ok:"success",attention:"warning",warn:"warning",waiting:"cool",cool:"cool"};function Ws(e,t){const n=nu[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n)}const Oa="–",ou="−",au=6e4,su=500,Us={"6h":6*3600,"24h":86400,"7d":7*86400,"30d":30*86400},Vs={"6h":"the last 6 hours","24h":"the last 24 hours","7d":"the last 7 days","30d":"the last 30 days"},ru=e=>e&&e[0].toLowerCase()+e.slice(1),Cn=(e,t)=>{const n=Math.abs(e).toFixed(t);return e<0&&Number(n)!==0?`${ou}${n}`:n},ot=(e,t,n)=>`${e.toLocaleString("en-GB")} ${e===1?t:n}`;function yn(e){return e.room?`${e.room_name??e.room} ${ru(e.label)}`:e.label}function So(e){return e>=86400?e===86400?"1 day":`${e/86400} days`:e>=3600?`${e/3600} h`:`${e/60} min`}function tt(e,t,n=60){if(e==null||Number.isNaN(e))return Oa;const o=t?.kind??"gauge";if(o==="state")return n<=60||e===0||e===1?e>=.5?"On":"Off":`on ${Math.round(e*100)}% of the time`;if(o==="level")return(t.levels??[])[Math.round(e)]??String(e);switch(t?.unit){case"°C":return`${Cn(e,1)}°`;case"%":return`${Cn(e,0)}%`;case"W":return`${Cn(e,0)} W`;default:return Number.isInteger(e)?Cn(e,0):Cn(e,1)}}const iu=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],lu=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ks=new Map;function Ko(e,t){let n=Ks.get(t);n||(n=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),Ks.set(t,n));const o=Object.fromEntries(n.formatToParts(new Date(e*1e3)).map(i=>[i.type,i.value])),a=Number(o.year),s=Number(o.month),r=Number(o.day);return{y:a,m:s,d:r,H:o.hour,M:o.minute,wd:new Date(Date.UTC(a,s-1,r)).getUTCDay()}}const _o=(e,t)=>{const n=Ko(e,t);return`${n.H}:${n.M}`},Co=(e,t)=>{const n=Ko(e,t);return`${iu[n.wd]} ${n.d} ${lu[n.m-1]}`},zn=(e,t)=>`${Co(e,t)} ${_o(e,t)}`;function pa(e,t){const n=Ko(e,t);return`${n.y}-${String(n.m).padStart(2,"0")}-${String(n.d).padStart(2,"0")}T${n.H}:${n.M}`}function Js(e){return e<90?"just now":e<3600?`${Math.round(e/60)} min ago`:e<172800?`${Math.round(e/3600)} h ago`:`${Math.round(e/86400)} days ago`}function Ys(e){return e<60?`in ${Math.max(1,Math.round(e))} s`:e<5400?`in ${Math.round(e/60)} min`:`in ${Math.round(e/3600)} h`}function cu(e){if(!e?.available)return e?.why??"No raw data here.";const t=e.series?.length??0;if(!t)return"Nothing recorded yet. The first readings appear within a minute.";const n=e.retention_days?` Kept for ${ot(Math.round(e.retention_days),"day","days")}.`:"";return`${ot(t,"series","series")} from ${zn(e.first,e.timezone)} to now.${n}`}function du(e,t,n=8){const o=String(t??"").toLowerCase().split(/\s+/).filter(Boolean);if(!o.length||!e?.series)return[];const a=[];for(const s of e.series){const r=`${yn(s)} ${s.metric} ${s.room??""} ${s.room?"":"house"}`.toLowerCase();if(o.every(i=>r.includes(i))&&a.push(s),a.length>=n)break}return a}function uu(e,t,n){const o=e?.series??[];return o.length===1?yn(o[0]):t?.scope==="room"&&!n?`${t.label}, every room`:t?.label??"Raw data"}function hu(e,t){if(!e)return"";const n=e.series.length,o=e.series.reduce((r,i)=>r+i.points.length,0),a=t&&Vs[t]?Vs[t]:`${zn(e.from,e.timezone)} to ${zn(e.to,e.timezone)}`,s=e.step_raised?" (a finer step would be too many points)":"";return`Every ${So(e.step)}${s}, ${a}. ${ot(n,"series","series")}, ${ot(o,"point","points")}.`}function di(e,t,n){const o=e?.points??[];if(!o.length)return[];let a=1/0,s=-1/0,r=0;for(const[,l,d,u]of o)a=Math.min(a,d),s=Math.max(s,u),r+=l;const i=o.at(-1),c=r/o.length;return t?.kind==="state"?[["Latest",tt(i[1],t,n)],["On",`${Math.round(c*100)}%`,"of the time shown"]]:t?.kind==="level"?[["Latest",tt(i[1],t,n)]]:[["Latest",tt(i[1],t)],["Lowest",tt(a,t)],["Highest",tt(s,t)],["Average",tt(c,t)]]}function pu(e,t,n,o,a){const s=e?.points?.[o];if(!s)return"";const[r,i,c,l]=s,d=e.room?e.room_name??e.room:e.label;let u=`${zn(r,a)}: ${d} ${tt(i,t,n)}`;return n>60&&t?.kind==="gauge"&&c!==l&&(u+=`, between ${tt(c,t)} and ${tt(l,t)} in these ${So(n)}`),n>60&&t?.kind==="level"&&c!==l&&(u=`${zn(r,a)}: ${d} ${tt(c,t)} to ${tt(l,t)} in these ${So(n)}`),`${u}.`}function fu(e,t,n=su){const o=[];for(const s of e?.series??[]){const r=t[s.metric];for(const[i,c,l,d]of s.points)o.push([i,yn(s),c,l,d,r])}o.sort((s,r)=>r[0]-s[0]||s[1].localeCompare(r[1]));const a=e?.step??60;return{total:o.length,rows:o.slice(0,n).map(([s,r,i,c,l,d])=>[zn(s,e.timezone),r,tt(i,d,a),a>60&&d?.kind!=="state"?tt(c,d,60):Oa,a>60&&d?.kind!=="state"?tt(l,d,60):Oa])}}function mu(e,t,n){if(!e)return{kind:"none",badge:"Not set up",line:"Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",details:[]};const o=e.queued??{},a=[["Sends to",`${e.endpoint}, ${e.protocol==="http/json"?"JSON":"protobuf"} over HTTP`]],s=o.metrics??0,r=o.logs??0;if(a.push(["Waiting to send",s||r?`${ot(s,"minute","minutes")} of readings, ${ot(r,"log record","log records")}`:"Nothing"]),a.push(["Sent",`${ot(e.sent?.metrics??0,"data point","data points")}, ${ot(e.sent?.logs??0,"log record","log records")}`]),e.dropped&&a.push(["Dropped",`${ot(e.dropped,"item","items")}: the queue was full, so the oldest went first`,"warn"]),e.rejected&&a.push(["Rejected by the collector",ot(e.rejected,"item","items"),"warn"]),e.status==="off")return{kind:"off",badge:"Off",line:"Turned off in the house file (export.otlp.enabled).",details:a};if(e.status==="failing"){const i=e.next_attempt?` Trying again ${Ys(Math.max(0,e.next_attempt-t))}, and keeping the data until then.`:" Retrying, and keeping the data until then.",c=e.last_success?` Last sent at ${_o(e.last_success,n)}, ${Js(t-e.last_success)}.`:"";return{kind:"attention",badge:"Failing",line:`Can't send: ${e.last_error??"no answer"}.${i}${c}`,details:a}}return e.status==="waiting"?{kind:"waiting",badge:"Waiting",line:`Nothing sent yet.${e.next_attempt?` The next send is due ${Ys(Math.max(0,e.next_attempt-t))}.`:" The first send is due within a minute."}`,details:a}:{kind:"ok",badge:"Sending",line:`Last sent at ${_o(e.last_success,n)}, ${Js(t-e.last_success)}.`,details:a}}const Gs=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function gu(e,t=4){const n=e/t,o=10**Math.floor(Math.log10(n||1));for(const a of[1,2,2.5,5,10])if(a*o>=n)return a*o;return 10*o}function bu(e,t){const n=e.step;if(t?.kind==="state")return{lo:0,hi:1,ticks:n>60?[[0,"0%"],[.5,"50%"],[1,"100%"]]:[[0,"Off"],[1,"On"]]};if(t?.kind==="level"){const i=t.levels??[];return{lo:0,hi:Math.max(1,i.length-1),ticks:i.map((c,l)=>[l,c])}}let o=1/0,a=-1/0;for(const i of e.series)for(const[,,c,l]of i.points)o=Math.min(o,c),a=Math.max(a,l);Number.isFinite(o)||(o=0,a=1),a-o<1e-9&&(o-=1,a+=1);const s=gu(a-o);o=Math.floor(o/s)*s,a=Math.ceil(a/s)*s;const r=[];for(let i=o;i<=a+s/2;i+=s){const c=Math.round(i*1e3)/1e3,l=s<1?s<.1?2:1:0,d=t?.unit==="°C"?"°":t?.unit==="%"?"%":"";r.push([c,`${Cn(c,l)}${d}`])}return{lo:o,hi:a,ticks:r}}function wu(e,t,n,o){const a=t-e,s=Math.max(2,Math.floor(o/80)),i=[3600,3*3600,6*3600,12*3600,86400,2*86400,5*86400,7*86400].find(g=>a/g<=s)??14*86400,c=[],l=Ko(e,n),d=Date.UTC(l.y,l.m-1,l.d,Number(l.H),Number(l.M))/1e3-Math.floor(e/60)*60;let u=Math.ceil((e+d)/i)*i-d;for(;u<=t;u+=i)c.push([u,i>=86400?Co(u,n):_o(u,n)]);return c}const jt={left:46,right:14,top:12,bottom:26};function Na(e,t,n,o){const a=t?.kind==="level"?58:jt.left,s=Math.max(10,n-a-jt.right),r=Math.max(10,o-jt.top-jt.bottom),i=bu(e,t),c=Math.max(1,e.to-e.from);return{left:a,w:s,h:r,y:i,x:l=>a+(l-e.from)/c*s,yv:l=>jt.top+r-(l-i.lo)/Math.max(1e-9,i.hi-i.lo)*r}}function Xs(e,t,n,o){let a="",s=null;const r=n*2.5;for(const[i,c]of e.points){const l=t.x(i).toFixed(1),d=t.yv(c).toFixed(1);s===null||i-s[0]>r?a+=`M${l} ${d}`:o?a+=`H${l}V${d}`:a+=`L${l} ${d}`,s=[i,c]}return a}function yu(e,t,n){const o=[];let a=[];for(const s of e.points)a.length&&s[0]-a.at(-1)[0]>n*2.5&&(o.push(a),a=[]),a.push(s);return a.length&&o.push(a),o.filter(s=>s.length>1).map(s=>{const r=s.map(([c,,,l])=>`${t.x(c).toFixed(1)} ${t.yv(l).toFixed(1)}`),i=s.slice().reverse().map(([c,,l])=>`${t.x(c).toFixed(1)} ${t.yv(l).toFixed(1)}`);return`M${r.join("L")}L${i.join("L")}Z`}).join("")}function vu(e,t,{width:n,height:o,focus:a}){const s=Na(e,t,n,o),r=e.timezone,i=t?.kind!=="gauge",c=[`<svg width="${n}" height="${o}" viewBox="0 0 ${n} ${o}" aria-hidden="true" focusable="false">`];for(const[u,g]of s.y.ticks){const p=s.yv(u).toFixed(1);c.push(`<line class="rd-grid" x1="${s.left}" x2="${s.left+s.w}" y1="${p}" y2="${p}"/>`),c.push(`<text class="rd-ytick" x="${s.left-6}" y="${p}" dy="0.32em" text-anchor="end">${Gs(g)}</text>`)}const l=jt.top+s.h;c.push(`<line class="rd-axis" x1="${s.left}" x2="${s.left+s.w}" y1="${l}" y2="${l}"/>`);for(const[u,g]of wu(e.from,e.to,r,s.w)){const p=s.x(u).toFixed(1);c.push(`<line class="rd-xmark" x1="${p}" x2="${p}" y1="${l}" y2="${l+4}"/>`),c.push(`<text class="rd-xtick" x="${p}" y="${l+17}" text-anchor="middle">${Gs(g)}</text>`)}const d=e.series.find(u=>u.key===a)??e.series[0];if(d&&e.step>60&&t?.kind==="gauge"){const u=yu(d,s,e.step);u&&c.push(`<path class="rd-band" d="${u}"/>`)}for(const u of e.series)u!==d&&c.push(`<path class="rd-line rd-other" d="${Xs(u,s,e.step,i)}"/>`);return d&&c.push(`<path class="rd-line rd-ink" d="${Xs(d,s,e.step,i)}"/>`),c.push(`<line class="rd-cursor" x1="0" x2="0" y1="${jt.top}" y2="${l}" visibility="hidden"/>`),c.push('<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>'),c.push(`<rect class="rd-hit" x="${s.left}" y="${jt.top}" width="${s.w}" height="${s.h}"/>`),c.push("</svg>"),c.join("")}function ku(e,t,n){const o=e.series.find(c=>c.key===n)??e.series[0];if(!o)return"Chart with no data.";const a=o.points,s=e.series.length>1?` ${ot(e.series.length-1,"other series","other series")} shown thinner for comparison.`:"";if(!a.length)return`Line chart of ${yn(o)} with no data.${s}`;const i=di(o,t,e.step).map(([c,l])=>`${c.toLowerCase()} ${l}`).join(", ");return`Line chart of ${yn(o)}, ${Co(e.from,e.timezone)} to ${Co(e.to,e.timezone)}, every ${So(e.step)}: ${i}.${s} Use the arrow keys to read each point.`}function $u({transport:e,isAuthError:t,onAuth:n}){let o=null,a=null,s={},r=!1,i=null,c=!1,l=0,d=null,u=null,g=0;const p={metric:"room.temperature",room:"",range:"24h",from:"",to:"",step:"auto"},f=()=>pe("data-chart"),x=()=>s[p.metric];function h(O,v){const _=pe(O);_.textContent!==v&&(_.textContent=v)}function w(O,v=""){const _=pe("data-note");_.hidden=!O,Ws(_,v),h("data-note",O)}function b(){const O=new Set((o?.series??[]).map(L=>L.metric)),v=pe("data-metric"),_=[["room","Rooms"],["house","House"]].map(([L,j])=>{const X=document.createElement("optgroup");X.label=j;for(const M of o.metrics.filter(I=>I.scope===L&&O.has(I.metric))){const I=document.createElement("option");I.value=M.metric,I.textContent=M.label,X.append(I)}return X}).filter(L=>L.children.length);v.replaceChildren(..._),O.has(p.metric)||(p.metric=v.querySelector("option")?.value??""),v.value=p.metric}function k(){const O=x(),v=pe("data-room"),_=O?.scope!=="room",L=_?[]:(o?.rooms??[]).filter(X=>o.series.some(M=>M.metric===p.metric&&M.room===X.id)),j=document.createElement("option");j.value="",j.textContent=_?"Whole house":"Every room",v.replaceChildren(j,...L.map(X=>{const M=document.createElement("option");return M.value=X.id,M.textContent=X.name,M})),(_||!L.some(X=>X.id===p.room))&&(p.room=""),v.value=p.room,v.disabled=_}function R(){const O=pe("data-range"),v=p.range==="custom"?"":p.range;O.value!==v&&(O.value=v)}function E(){if(!o?.now||p.range==="custom")return;const O=Us[p.range];pe("data-from").value=pa(o.now-O,o.timezone),pe("data-to").value=pa(o.now,o.timezone)}function P(){const O=new URLSearchParams;return p.metric&&O.set("metric",p.metric),p.room&&O.set("room",p.room),p.range==="custom"?(p.from&&O.set("from",p.from),p.to&&O.set("to",p.to)):(O.set("from",String(Math.floor(o.now-Us[p.range]))),O.set("to",String(Math.ceil(o.now)))),O.set("step",p.step),O}function Z(){const O=a.series.find(j=>j.key===u),v=pe("data-stats"),_=O?di(O,x(),a.step):[];v.hidden=!_.length;const L=a.series.length>1&&O;pe("data-stats-for").hidden=!L,h("data-stats-for",L?`Figures for ${yn(O)}, the line in ink.`:""),v.replaceChildren(..._.map(([j,X,M])=>{const I=document.createElement("div"),K=document.createElement("dt");K.textContent=j;const ae=document.createElement("dd"),ve=document.createElement("span");if(ve.textContent=X,ae.append(ve),M){const Le=document.createElement("span");Le.className="sub",Le.textContent=M,ae.append(Le)}return I.append(K,ae),I}))}function Q(){const O=pe("data-legend");O.hidden=a.series.length<2,O.replaceChildren(...a.series.map(v=>{const _=document.createElement("li"),L=document.createElement("button");L.type="button",L.className="rd-key",L.dataset.key=v.key,L.setAttribute("aria-pressed",String(v.key===u));const j=document.createElement("span");return j.className="rd-swatch",j.setAttribute("aria-hidden","true"),L.append(j,document.createTextNode(v.room?v.room_name??v.room:v.label)),_.append(L),_}))}function te(){const{total:O,rows:v}=fu(a,s);pe("data-table-body").replaceChildren(...v.map(L=>{const j=document.createElement("tr");return L.forEach((X,M)=>{const I=document.createElement(M===0?"th":"td");M===0&&(I.scope="row"),I.textContent=X,j.append(I)}),j}));const _=a.step>60;for(const L of document.querySelectorAll(".rd-table .rd-range-col"))L.hidden=!_;for(const L of pe("data-table-body").children)L.children[3].hidden=!_,L.children[4].hidden=!_;h("data-table-note",O>v.length?`The newest ${ot(v.length,"row","rows")} of ${O.toLocaleString("en-GB")}. Download the CSV for all of them.`:`${ot(O,"row","rows")}, newest first.`)}function T(O){const v=a?.series.find(Le=>Le.key===u),_=v?.points??[];if(!_.length){h("data-readout","");return}const L=O==null?_.length-1:Math.max(0,Math.min(_.length-1,O));h("data-readout",pu(v,x(),a.step,L,a.timezone));const j=f().querySelector("svg");if(!j)return;const X=Na(a,x(),l,Number(j.getAttribute("height"))),[M,I]=_[L],K=j.querySelector(".rd-cursor"),ae=j.querySelector(".rd-dot"),ve=O==null?"hidden":"visible";K.setAttribute("x1",X.x(M)),K.setAttribute("x2",X.x(M)),ae.setAttribute("cx",X.x(M)),ae.setAttribute("cy",X.yv(I)),K.setAttribute("visibility",ve),ae.setAttribute("visibility",ve)}function V(){const O=f(),v=Math.floor(O.clientWidth);if(!v||!a)return;l=v;const _=v<520?200:260;O.innerHTML=vu(a,x(),{width:v,height:_,focus:u}),O.setAttribute("aria-label",ku(a,x(),u)),T(d)}function q(){const O=x(),v=a.series.some(_=>_.points.length);if(a.series.some(_=>_.key===u)||(u=(a.series.find(_=>_.points.length)??a.series[0])?.key??null,d=null),h("data-chart-h",uu(a,O,p.room?pe("data-room").selectedOptions[0]?.textContent:"")),h("data-meta",hu(a,p.range==="custom"?null:p.range)),pe("data-empty").hidden=v,pe("data-chart-wrap").hidden=!v,pe("data-downloads").hidden=!v,pe("data-table-toggle").hidden=!v,a.partial?w("Still indexing older readings, so part of this time may be missing for a few minutes.","cool"):w(""),!v){pe("data-stats").hidden=!0,pe("data-legend").hidden=!0;return}Z(),Q(),te(),r?V():l=0}function m(){const O=mu(o?.export??null,Date.now()/1e3,o?.timezone??"UTC"),v=pe("data-export-badge");Ws(v,O.kind),v.setAttribute("appearance",["ok","attention","waiting"].includes(O.kind)?"filled-outlined":"outlined"),h("data-export-badge",O.badge),h("data-export-line",O.line),pe("data-export").dataset.kind=O.kind;const _=pe("data-export-list");_.hidden=!O.details.length,_.replaceChildren(...O.details.map(([L,j,X])=>{const M=document.createElement("div");X&&(M.dataset.kind=X);const I=document.createElement("dt");I.textContent=L;const K=document.createElement("dd");return K.textContent=j,M.append(I,K),M}))}function D(){h("data-summary",cu(o)),m();const O=!!o?.available;pe("data-body").hidden=!O,O&&(s=Object.fromEntries(o.metrics.map(v=>[v.metric,v])),b(),k(),R(),E(),ee())}async function F(){if(!o?.available||!p.metric)return;const O=++g;try{const v=await e.get(`data?${P()}`);if(O!==g)return;a=v,q()}catch(v){if(O!==g)return;if(t(v)){n();return}w(/HTTP 400/.test(String(v?.message))?`Not shown: ${String(v.message).replace(/^.*HTTP 400 /,"")}`:"Couldn't load the readings. Retrying…","warn")}}async function N(){if(!c){c=!0;try{o=await e.get("data/series"),D(),r&&await F()}catch(O){t(O)?n():r&&w("Couldn't load the readings. Retrying…","warn")}c=!1,W()}}function W(){clearTimeout(i),r&&(i=setTimeout(N,au))}function U(){d=null,p.range!=="custom"?N():F()}function ee(){const O=du(o,pe("data-search").value),v=pe("data-results"),_=pe("data-search").value.trim()!=="";if(v.hidden=!_,!!_){if(!O.length){const L=document.createElement("li");L.className="rd-none",L.textContent="No series match. Try a room name, or a word such as temperature, valve or burner.",v.replaceChildren(L);return}v.replaceChildren(...O.map(L=>{const j=document.createElement("li"),X=document.createElement("button");return X.type="button",X.className="rd-result",X.dataset.metric=L.metric,X.dataset.room=L.room??"",X.textContent=yn(L),j.append(X),j}))}}function se(){pe("data-search").addEventListener("input",ee),pe("data-search").addEventListener("keydown",_=>{_.key==="Escape"&&(pe("data-search").value="",ee()),_.key==="Enter"&&(_.preventDefault(),pe("data-results").querySelector(".rd-result")?.click())}),pe("data-results").addEventListener("click",_=>{const L=_.target.closest?.(".rd-result");L&&(p.metric=L.dataset.metric,k(),p.room=L.dataset.room,pe("data-metric").value=p.metric,k(),u=null,pe("data-search").value="",ee(),pe("data-search").focus(),U())}),pe("data-metric").addEventListener("change",_=>{p.metric=_.target.value,k(),u=null,U()}),pe("data-room").addEventListener("change",_=>{p.room=_.target.value,u=null,U()}),pe("data-step").addEventListener("change",_=>{p.step=_.target.value,U()}),pe("data-range").addEventListener("change",_=>{const L=_.target.value;!L||p.range===L||(p.range=L,R(),E(),U())});for(const _ of["data-from","data-to"])pe(_).addEventListener("change",()=>{p.range="custom",p.from=pe("data-from").value,p.to=pe("data-to").value,R(),U()});pe("data-legend").addEventListener("click",_=>{const L=_.target.closest?.(".rd-key");if(!(!L||L.dataset.key===u)){u=L.dataset.key,d=null;for(const j of pe("data-legend").querySelectorAll(".rd-key"))j.setAttribute("aria-pressed",String(j===L));Z(),V()}});const O=f();O.addEventListener("keydown",_=>{const j=a?.series.find(I=>I.key===u)?.points.length??0;if(!j)return;const X=d??j-1,M={ArrowRight:X+1,ArrowLeft:X-1,Home:0,End:j-1,PageUp:X-10,PageDown:X+10}[_.key];M!=null&&(_.preventDefault(),d=Math.max(0,Math.min(j-1,M)),T(d))}),O.addEventListener("pointermove",_=>{const L=a?.series.find(ae=>ae.key===u),j=O.querySelector("svg");if(!L?.points.length||!j)return;const X=Na(a,x(),l,Number(j.getAttribute("height"))),M=_.clientX-j.getBoundingClientRect().left,I=a.from+(M-X.left)/X.w*(a.to-a.from);let K=0;for(let ae=1;ae<L.points.length;ae++)Math.abs(L.points[ae][0]-I)<Math.abs(L.points[K][0]-I)&&(K=ae);d=K,T(d)}),O.addEventListener("pointerleave",_=>{_.pointerType==="mouse"&&(d=null,T(null))}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&r&&Math.floor(O.clientWidth)!==l&&V()}).observe(O);const v=pe("data-table-toggle");v.addEventListener("change",()=>{pe("data-table-wrap").hidden=!v.checked}),pe("data-csv").addEventListener("click",()=>fe("csv")),pe("data-json").addEventListener("click",()=>fe("json"))}function de(O){const v=a?pa(a.to,a.timezone).slice(0,10):"data";return`radiate-${p.metric}${p.room?`-${p.room}`:""}-${v}.${O}`}async function fe(O){const v=pe("data-dl-status");v.textContent="";try{let _;if(O==="json")_=new Blob([JSON.stringify(a,null,2)],{type:"application/json"});else{const j=P();j.set("format","csv"),_=new Blob([await e.text(`data?${j}`)],{type:"text/csv"})}const L=document.createElement("a");L.href=URL.createObjectURL(_),L.download=de(O),document.body.append(L),L.click(),L.remove(),setTimeout(()=>URL.revokeObjectURL(L.href),1e3),v.textContent=`Downloaded ${L.download}.`}catch(_){if(t(_)){n();return}v.textContent="Not downloaded. Check the connection and try again."}}return se(),{async available(){try{return o=await e.get("data/series"),D(),!!o.available}catch(O){return t(O)?null:/HTTP 404|not found/.test(String(O?.message))?!1:null}},show(){r=!0,N()},hide(){r&&(r=!1,clearTimeout(i))}}}const Re=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Ft=e=>e==null?"–":(Math.round(e*10)/10).toFixed(1),Qs=e=>`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,fa=(e,t,n)=>`${e} ${e===1?t:n}`,Zs=new Set(["passive","unheated"]),et=.5,It=14,Bt=10,er=/bed|bath|landing|en.?suite|nursery|study|loft|attic/i,za=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),tr=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16));function En(e){const t=[12,15,17,19,22].map(o=>[o,tr(za(`--t${o}`)||"#888888")]);if(e==null)return tr(za("--hm-none")||"#cccccc");const n=Math.max(12,Math.min(22,e));for(let o=0;o<t.length-1;o++){const[a,s]=t[o],[r,i]=t[o+1];if(n<=r)return s.map((c,l)=>Math.round(c+(i[l]-c)*((n-a)/(r-a))))}return t.at(-1)[1]}const Wt=(e,t=1)=>`rgb(${e.map(n=>Math.round(n*t)).join(",")})`,nr=e=>Wt(En(e)),ma=e=>{const t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},or=e=>.2126*ma(e[0])+.7152*ma(e[1])+.0722*ma(e[2]),xu=[20,28,24];function ui(e){const t=or(e),n=(t+.05)/(or(xu)+.05),o=1.05/(t+.05);return n>=o?"#141c18":"#ffffff"}function ar(e){const t=e.filter(r=>er.test(r.name)),n=e.filter(r=>!er.test(r.name)),o=t.length&&n.length?["Ground floor","First floor"]:["Ground floor"],a={},s=(r,i)=>r.forEach((c,l)=>{a[c.id]={floor:i,x:l%3*3,y:Math.floor(l/3)*3,w:3,d:3}});return o.length===2?(s(n,0),s(t,1)):s(e,0),{floors:o,rooms:a}}const ga=34,Su=Math.cos(Math.PI/6),hi=Math.sin(Math.PI/6),sr=.34,_u=e=>Math.max(3.2,e*hi*.8),Ne=(e,t,n)=>[(e-t)*Su*ga,(e+t)*hi*ga-n*ga],lo=e=>e.map(t=>t.map(n=>n.toFixed(1)).join(",")).join(" "),Cu=(e,t)=>e.length<=t?e:`${e.slice(0,Math.max(1,t-1)).trimEnd()}…`;function rr(e,t,{selected:n,interactive:o}){let a="",s="";const r=za("--hm-line");let i=0;for(const[l,d]of Object.entries(e.rooms))t.has(l)&&(i=Math.max(i,d.x+d.w+d.y+d.d));const c=_u(i);return e.floors.forEach((l,d)=>{const u=d*c,g=Object.entries(e.rooms).filter(([h,w])=>w.floor===d&&t.has(h)),p=Math.max(3,...g.map(([,h])=>h.x+h.w)),f=Math.max(3,...g.map(([,h])=>h.y+h.d));if(s+=`<polygon points="${lo([Ne(-.2,-.2,u),Ne(p+.2,-.2,u),Ne(p+.2,f+.2,u),Ne(-.2,f+.2,u)])}" fill="none" stroke="${r}" stroke-width="1.5"/>`,d>0)for(const[h,w]of[[-.2,-.2],[p+.2,-.2],[-.2,f+.2]]){const b=Ne(h,w,u),k=Ne(h,w,u-c+sr);s+=`<line x1="${b[0]}" y1="${b[1]}" x2="${k[0]}" y2="${k[1]}" stroke="${r}" stroke-dasharray="2 4"/>`}const x=Ne(-.2,f+.2,u);s+=`<text class="hm-ftag" x="${x[0]-8}" y="${x[1]+4}" text-anchor="end">${Re(l)}</text>`,g.sort((h,w)=>h[1].x+h[1].y-(w[1].x+w[1].y)).forEach(([h,w])=>{const b=t.get(h),k=En(b.temperature),R=.05,E=w.x+R,P=w.y+R,Z=w.w-2*R,Q=w.d-2*R,te=u+sr,T=[Ne(E,P,te),Ne(E+Z,P,te),Ne(E+Z,P+Q,te),Ne(E,P+Q,te)],V=[Ne(E+Z,P,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,te),Ne(E+Z,P,te)],q=[Ne(E,P+Q,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,te),Ne(E,P+Q,te)],m=Ne(E+Z/2,P+Q/2,te),D=ui(k);let F="";if(b.calling||b.topup||b.role==="passive"){const U=Ne(E+.25,P+Q-.15,te),ee=Ne(E+Math.min(Z-.25,1.4),P+Q-.15,te);F=`<line class="hm-rad" x1="${U[0]}" y1="${U[1]}" x2="${ee[0]}" y2="${ee[1]}" stroke="${D}" stroke-width="3"/>`}const N=`${b.name}, ${b.temperature==null?"no reading":`${Ft(b.temperature)} degrees`}${b.calling?", heating":""}`,W=o?`tabindex="0" role="button" aria-pressed="${h===n}"`:"";a+=`<g class="hm-room" data-id="${Re(h)}" ${W} aria-label="${Re(N)}">
        <polygon points="${lo(V)}" fill="${Wt(k,.62)}"/><polygon points="${lo(q)}" fill="${Wt(k,.8)}"/>
        <polygon class="hm-top" points="${lo(T)}" fill="${Wt(k)}"/>${F}
        <text class="hm-t" x="${m[0]}" y="${m[1]}" text-anchor="middle" fill="${D}">${Ft(b.temperature)}</text>
        ${Z>=1.4?`<text class="hm-n" x="${m[0]}" y="${m[1]+13}" text-anchor="middle" fill="${D}">${Re(Cu(b.name,Math.floor(Z*5.5)))}</text>`:""}</g>`})}),s+a}function ir(e){requestAnimationFrame(()=>{try{const t=e.getBBox();t.width&&e.setAttribute("viewBox",`${t.x-10} ${t.y-10} ${t.width+20} ${t.height+20}`)}catch{}})}function Eu({modelEl:e,statusEl:t,planEl:n,transport:o,onSelect:a,onWeek:s,arrangeLock:r=()=>""}){let i=null,c=new Map,l=null,d=!1,u=!1,g=!1,p=0,f=null,x=null,h=0,w=null,b=null,k="";async function R(){try{const v=await o.call("GET","layout");v.status===200&&v.body?.layout?(l=v.body.layout,d=!0):v.status===404&&(u=!0)}catch{}te()}function E(){clearTimeout(b),k="Saving…",P(),b=setTimeout(async()=>{if(u){k="This server can't keep a layout. Update Radiate to save it.",P();return}try{const v=await o.call("PUT","layout",l);d=v.status===200,k=d?"Saved.":`Not saved: ${typeof v.body=="string"?v.body:"the server refused it"}.`}catch{k="Not saved. Check the connection and move a room to try again."}P()},500)}function P(){const v=e.querySelector(".hm-save");v&&(v.textContent=k)}const Z=()=>Object.keys(l.rooms).filter(v=>c.has(v)),Q=()=>[...c.keys()].filter(v=>!l.rooms[v]);function te(){if(!l||!c.size)return;if(g){m();return}if(!e.querySelector(".hm-iso")){e.innerHTML=`
        <div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m" id="hm-model-h">Your house</h2>
          <div class="wa-cluster wa-gap-s wa-align-items-center">
            <span class="hm-scale" aria-hidden="true"><span class="hm-lab">12°</span><span class="hm-ramp"></span><span class="hm-lab">22°</span></span>
            <wa-button size="s" appearance="outlined" data-act="arrange" aria-describedby="hm-arrange-lock"><wa-icon slot="start" name="pen-ruler"></wa-icon>Arrange rooms</wa-button>
            <wa-tag size="s" class="lock-tag" id="hm-arrange-lock" hidden></wa-tag>
          </div>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each block is a room in its temperature colour. A blinking bar is a radiator taking heat. Select a room to see it and change its temperature. <span class="hm-guess" hidden>Rooms are placed by a guess from their names. Arrange them to match your house.</span> <a href="#guide/model">How to read the model</a></p>
          <svg class="hm-iso" role="group" aria-labelledby="hm-model-h"></svg>
        </div>`,e.querySelector("[data-act=arrange]").addEventListener("click",()=>{g=!0,p=0,te(),ee(),e.querySelector("#hm-model-h")?.focus()});const M=e.querySelector(".hm-iso");M.addEventListener("click",I=>{const K=I.target.closest(".hm-room");K&&T(K.dataset.id,K)}),M.addEventListener("keydown",I=>{const K=I.target.closest(".hm-room");K&&(I.key==="Enter"||I.key===" ")&&(I.preventDefault(),T(K.dataset.id,K))})}e.querySelector(".hm-ramp").style.background=`linear-gradient(90deg, ${[12,15,17,19,22].map(M=>Wt(En(M))).join(", ")})`,e.querySelector(".hm-guess").hidden=d;const v=r(),_=e.querySelector("[data-act=arrange]");_.disabled=!!v,v?_.dataset.locked="":delete _.dataset.locked;const L=e.querySelector("#hm-arrange-lock");L.hidden=!v,L.textContent=v;const j=e.querySelector(".hm-iso"),X=j.contains(document.activeElement)?document.activeElement.closest(".hm-room")?.dataset.id:null;j.innerHTML=rr(l,c,{selected:f,interactive:!0}),X&&j.querySelector(`.hm-room[data-id="${CSS.escape(X)}"]`)?.focus(),ir(j)}function T(v,_){a?.(v,_)}function V(){for(const v of e.querySelectorAll(".hm-room"))v.setAttribute("aria-pressed",String(v.dataset.id===f))}const q=40;function m(){const v=Z().filter(M=>l.rooms[M].floor===p);let _="";for(let M=0;M<=It/et;M++)_+=`<line x1="${M*q*et}" y1="0" x2="${M*q*et}" y2="${Bt*q}" class="${M%2?"hm-g2":"hm-g1"}"/>`;for(let M=0;M<=Bt/et;M++)_+=`<line x1="0" y1="${M*q*et}" x2="${It*q}" y2="${M*q*et}" class="${M%2?"hm-g2":"hm-g1"}"/>`;const L=v.map(M=>{const I=l.rooms[M],K=c.get(M),ae=En(K.temperature),ve=ui(ae);return`<g class="hm-r2${M===f?" sel":""}" data-id="${Re(M)}" transform="translate(${I.x*q},${I.y*q})" tabindex="0" role="button"
          aria-label="${Re(K.name)}, ${I.w} by ${I.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${I.w*q}" height="${I.d*q}" fill="${Wt(ae)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ve}">${Re(K.name)}</text>
        <text class="hm-r2s" x="7" y="${I.d*q-7}" fill="${ve}">${I.w} × ${I.d} m</text>
        <rect class="hm-handle" x="${I.w*q-14}" y="${I.d*q-14}" width="14" height="14"/></g>`}).join(""),j=Q(),X=f&&l.rooms[f]?.floor===p?c.get(f):null;e.innerHTML=`
      <div slot="header" class="wa-split wa-gap-s">
        <h2 class="wa-heading-m" id="hm-model-h" tabindex="-1">Arrange rooms</h2>
        <div class="wa-cluster wa-gap-xs">
          <wa-button size="s" appearance="outlined" data-act="reset">Start again</wa-button>
          <wa-button size="s" variant="brand" data-act="done">Done</wa-button>
        </div>
      </div>
      <div class="wa-stack wa-gap-s">
        <div class="wa-cluster wa-gap-2xs hm-floors" role="group" aria-label="Floor">
          ${l.floors.map((M,I)=>`<button type="button" class="wa-size-s ${I===p?"wa-brand":"wa-outlined"}" data-floor="${I}" aria-pressed="${I===p}">${Re(M)}</button>`).join("")}
          ${l.floors.length<6?'<button type="button" class="wa-size-s wa-plain" data-act="add-floor">Add floor</button>':""}
        </div>
        <div class="wa-cluster wa-gap-s wa-align-items-end">
          <wa-input size="s" label="Floor name" maxlength="40" value="${Re(l.floors[p])}" data-act="rename"></wa-input>
          ${l.floors.length>1&&!v.length?'<wa-button size="s" appearance="plain" data-act="remove-floor">Remove this floor</wa-button>':""}
        </div>
        <svg class="hm-plan2d" viewBox="0 0 ${It*q} ${Bt*q}" aria-label="Plan of ${Re(l.floors[p])}">${_}${L}</svg>
        <div class="wa-cluster wa-gap-xs wa-align-items-center hm-tray">
          <span class="wa-caption-m wa-color-text-quiet">${j.length?"Not placed yet:":"Every room is placed."}</span>
          ${j.map(M=>`<button type="button" class="wa-size-s wa-outlined hm-chip" data-add="${Re(M)}">Place ${Re(c.get(M).name)}</button>`).join("")}
          ${X?`<button type="button" class="wa-size-s wa-plain" data-act="unplace">Take ${Re(X.name)} off the plan</button>`:""}
        </div>
        <p class="help-line">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
        <p class="hm-save wa-caption-m wa-color-text-quiet" role="status">${Re(k)}</p>
      </div>`,D()}function D(){const v=e;v.querySelector("[data-act=done]").addEventListener("click",()=>{g=!1,e.innerHTML="",te(),ee(),e.querySelector("[data-act=arrange]")?.focus()}),v.querySelector("[data-act=reset]").addEventListener("click",()=>{l=ar([...c.values()]),p=0,E(),m(),ee()});for(const M of v.querySelectorAll("[data-floor]"))M.addEventListener("click",()=>{p=Number(M.dataset.floor),m()});v.querySelector("[data-act=add-floor]")?.addEventListener("click",()=>{l.floors.push(l.floors.length===1?"First floor":l.floors.length===2?"Second floor":`Floor ${l.floors.length+1}`),p=l.floors.length-1,E(),m(),ee()}),v.querySelector("[data-act=remove-floor]")?.addEventListener("click",()=>{l.floors.splice(p,1);for(const M of Object.values(l.rooms))M.floor>p&&(M.floor-=1);p=Math.max(0,p-1),E(),m(),ee()}),v.querySelector("[data-act=rename]").addEventListener("change",M=>{const I=String(M.target.value??"").trim();I&&(l.floors[p]=I,E(),m(),ee())});for(const M of v.querySelectorAll("[data-add]"))M.addEventListener("click",()=>{const I=M.dataset.add;l.rooms[I]={floor:p,...N(p)},f=I,E(),m(),ee(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus()});v.querySelector("[data-act=unplace]")?.addEventListener("click",()=>{delete l.rooms[f],E(),m(),ee()});const _=v.querySelector(".hm-plan2d"),L=M=>{const I=_.createSVGPoint();return I.x=M.clientX,I.y=M.clientY,I.matrixTransform(_.getScreenCTM().inverse())},j=M=>Math.round(M/et)*et;_.addEventListener("pointerdown",M=>{const I=M.target.closest(".hm-r2");if(!I||w)return;const K=I.dataset.id,ae=l.rooms[K],ve=L(M);f=K,w={id:K,pointer:M.pointerId,resize:M.target.classList.contains("hm-handle"),ox:ve.x/q-ae.x,oy:ve.y/q-ae.y,moved:!1},_.setPointerCapture(M.pointerId);for(const Le of _.querySelectorAll(".hm-r2"))Le.classList.toggle("sel",Le.dataset.id===K)}),_.addEventListener("pointermove",M=>{if(!w||M.pointerId!==w.pointer)return;const I=l.rooms[w.id],K=L(M);w.resize?(I.w=Math.min(It-I.x,Math.max(1,j(K.x/q-I.x))),I.d=Math.min(Bt-I.y,Math.max(1,j(K.y/q-I.y)))):(I.x=Math.max(0,Math.min(It-I.w,j(K.x/q-w.ox))),I.y=Math.max(0,Math.min(Bt-I.d,j(K.y/q-w.oy)))),w.moved=!0,F(_,w.id),W()});const X=M=>{if(!w||M.pointerId!==w.pointer)return;const{id:I,moved:K}=w;w=null,K&&E(),m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus({preventScroll:!0})};_.addEventListener("pointerup",X),_.addEventListener("pointercancel",X),_.addEventListener("keydown",M=>{const I=M.target.closest(".hm-r2");if(!I)return;const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[M.key];if(M.key==="Enter"||M.key===" "){M.preventDefault(),f=I.dataset.id,m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(f)}"]`)?.focus();return}if(!K)return;M.preventDefault();const ae=l.rooms[I.dataset.id];M.shiftKey?(ae.w=Math.min(It-ae.x,Math.max(1,ae.w+K[0]*et)),ae.d=Math.min(Bt-ae.y,Math.max(1,ae.d+K[1]*et))):(ae.x=Math.max(0,Math.min(It-ae.w,ae.x+K[0]*et)),ae.y=Math.max(0,Math.min(Bt-ae.d,ae.y+K[1]*et))),f=I.dataset.id,F(_,I.dataset.id),I.setAttribute("aria-label",`${c.get(I.dataset.id).name}, ${ae.w} by ${ae.d} metres, at ${ae.x}, ${ae.y}.`),W(),E()})}function F(v,_){const L=l.rooms[_],j=v.querySelector(`.hm-r2[data-id="${CSS.escape(_)}"]`);if(!j)return;j.setAttribute("transform",`translate(${L.x*q},${L.y*q})`);const X=j.querySelector(".hm-body");X.setAttribute("width",L.w*q),X.setAttribute("height",L.d*q);const M=j.querySelector(".hm-handle");M.setAttribute("x",L.w*q-14),M.setAttribute("y",L.d*q-14);const I=j.querySelector(".hm-r2s");I.setAttribute("y",L.d*q-7),I.textContent=`${L.w} × ${L.d} m`}function N(v){const _=Z().map(L=>l.rooms[L]).filter(L=>L.floor===v);for(let L=0;L<=Bt-2;L+=et)for(let j=0;j<=It-2;j+=et)if(!_.some(X=>j<X.x+X.w&&j+2>X.x&&L<X.y+X.d&&L+2>X.y))return{x:j,y:L,w:2,d:2};return{x:0,y:0,w:2,d:2}}function W(){const v=t.querySelector(".hm-preview");v&&(v.innerHTML=rr(l,c,{selected:f,interactive:!1}),ir(v))}function U(){let v=t.querySelector(".hm-live");return v||(t.innerHTML=`<h2 slot="header" class="wa-heading-m hm-status-h">The house now</h2>
        <div class="wa-stack wa-gap-m">
          <div class="hm-live wa-stack wa-gap-m"></div>
          <p class="help-line hm-help">The big number is rooms that want heat, out of the rooms Radiate controls. <a href="#guide/now">What the house now shows</a></p>
        </div>`,v=t.querySelector(".hm-live")),t.querySelector(".hm-help").hidden=g,t.querySelector(".hm-status-h").textContent=g?"Live model":"The house now",v}function ee(){if(!i)return;const v=U();if(g){v.innerHTML=`
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="help-line">${fa(l.floors.length,"floor","floors")}, ${Z().length} of ${fa(c.size,"room","rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`,W();return}const _=[...c.values()],L=_.filter(ge=>!Zs.has(ge.role)),j=L.filter(ge=>ge.calling),X=_.filter(ge=>ge.temperature!=null),M=i.telemetry??{},I=M.simulated||M.boiler_linked!==!1,K=i.boiler;let ae;i.mode==="off"?ae="Heating is off.":i.mode==="frost"?ae="Frost protection only.":j.length?I?K.state==="firing"?ae=`${j.length===1?"room is":"rooms are"} heating. Burner on.`:ae=`${j.length===1?"room wants":"rooms want"} heat.`:ae=`${j.length===1?"room wants":"rooms want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:ae="No room needs heat right now.";const ve=L.map(ge=>ge.target).filter(ge=>ge!=null),Le=ve.length?Au(ve):null,Ke=ge=>(Math.max(12,Math.min(22,ge))-12)/10*100,Ae=[...X].sort((ge,it)=>ge.temperature-it.temperature),nn=X.map(ge=>`<rect x="${Ke(ge.temperature)}%" y="14" width="4" height="26" rx="2" fill="${Wt(En(ge.temperature))}" transform="translate(-2,0)"><title>${Re(ge.name)} ${Ft(ge.temperature)}°</title></rect>`).join(""),z=[12,14,16,18,20,22].map(ge=>`<text class="hm-axis" x="${Ke(ge)}%" y="58" text-anchor="middle">${ge}</text>`).join(""),oe=Le!=null?`<rect x="${Ke(Le)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>`:"",ne=Ae.length?`Coldest ${Ae[0].name} ${Ft(Ae[0].temperature)}°, warmest ${Ae.at(-1).name} ${Ft(Ae.at(-1).temperature)}°.${Le!=null?` Most heated rooms aim for ${Ft(Le)}°.`:""}`:"No readings yet.",ue=!M.simulated&&(i.alert_details??[]).some(ge=>ge.code==="driver.shelly"),ye=I?ue?se("fire","Boiler","Not reachable","Radiate can't see or switch the boiler right now.","warning","text"):se("fire","Boiler",{idle:"Idle",lead:"Opening valves",firing:"Firing",rest:"Resting"}[K.state]??"–",K.state==="firing"?`${Math.round(K.burn_elapsed_s/60)} min so far`:`${fa(K.starts_last_hour,"start","starts")} in the last hour`,K.state==="firing"?"brand":"neutral","text"):se("fire","Boiler","Not linked","Radiate can't switch it until the relay is set up.","neutral","text"),Ie=M.dry_run?se("eye","Dry run",String(M.intended_writes??0),"valve and boiler changes held back","warning"):se("sliders","Mode",{auto:"Auto",frost:"Frost",off:"Off"}[i.mode]??i.mode,i.settings?.demand_mode?`${Tu(i.settings.demand_mode)} demand`:"","neutral","text"),Se=se("microchip","Devices",String(h),h?h===1?"needs attention":"need attention":"all reporting well",h>0?"warning":"neutral"),De=L.map(ge=>ge.model?.confidence).filter(ge=>ge!=null),qe=De.length?Math.round(De.reduce((ge,it)=>ge+it,0)/De.length*100):null,Me=se("graduation-cap","Learning",qe==null?"–":`${qe}%`,qe==null?"waiting for the first burns":qe<50?"how sure Radiate is of each room, on average":"average confidence in each room","neutral");v.innerHTML=`
      <div class="hm-hero">
        <div class="hm-big readout">${j.length}<small>/${L.length}</small></div>
        <p class="wa-heading-s">${Re(ae)}</p>
      </div>
      <div class="hm-spread wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">Where every room sits</span>
        <svg role="img" aria-label="${Re(ne)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${oe}${nn}${z}</svg>
        <span class="wa-caption-m wa-color-text-quiet">${Re(ne)}</span>
      </div>
      <div class="hm-cells">${ye}${Ie}${Se}${Me}</div>
      ${de()}`}function se(v,_,L,j,X,M="readout"){const I=M==="readout"?`<span class="hm-value readout">${Re(L)}</span>`:`<span class="hm-value hm-word">${Re(L)}</span>`;return`<div class="hm-cell" data-variant="${X}">
      <span class="wa-cluster wa-gap-xs wa-caption-m wa-color-text-quiet"><wa-icon name="${v}" class="hm-cell-icon"></wa-icon>${Re(_)}</span>
      ${I}<span class="wa-caption-s wa-color-text-quiet">${Re(j)}</span></div>`}function de(){const v=new Map;for(const j of c.values()){if(Zs.has(j.role)||j.next_setpoint==null||j.next_in_min==null)continue;const X=j.next_in_min;v.has(X)||v.set(X,[]),v.get(X).push(j)}const _=[...v.entries()].sort((j,X)=>j[0]-X[0]).slice(0,3);return _.length?`<div class="hm-next wa-stack wa-gap-2xs"><span class="wa-caption-m wa-color-text-quiet">Coming up</span><ul>${_.map(([j,X])=>{const M=new Map;for(const K of X)M.has(K.next_setpoint)||M.set(K.next_setpoint,[]),M.get(K.next_setpoint).push(K.name);const I=[...M.entries()].map(([K,ae])=>{const ve=ae.length<2?ae[0]:`${ae.slice(0,-1).join(", ")} and ${ae.at(-1)}`,Le=X.find(Ae=>Ae.next_setpoint===K)?.target,Ke=Le!=null&&K<Le?"cools to":ae.length>1?"warm to":"warms to";return`${ve} ${ae.length>1&&Ke==="cools to"?"cool to":Ke} ${Ft(K)}°`}).join(". ");return`<li><time class="readout">${Qs((i.minute_of_day+j)%1440)}</time><span>${Re(I)}.</span></li>`}).join("")}</ul></div>`:""}function fe(){if(!x?.rooms?.length||!i){n.hidden=!0;return}n.hidden=!1;const v=x.now?.weekday??0,_=i.minute_of_day??x.now?.minute??0,L=x.rooms.map(j=>{const X=[...j.days[v]?.transitions??[]].sort((K,ae)=>K.minute-ae.minute);if(!X.length)return"";X[0].minute>0&&X.unshift({minute:0,setpoint:X.at(-1).setpoint});const M=X.map((K,ae)=>{const ve=ae+1<X.length?X[ae+1].minute:1440;return ve<=K.minute?"":`<span style="width:${(ve-K.minute)/1440*100}%;background:${Wt(En(K.setpoint))}" title="${Ft(K.setpoint)}° from ${Qs(K.minute)}"></span>`}).join(""),I=j.days[v]?.text??"";return`<span class="hm-pname">${Re(j.name)}</span><div class="hm-strip" role="img" aria-label="${Re(`${j.name} today: ${I}`)}">${M}<i class="hm-now" style="left:${_/1440*100}%"></i></div>`}).join("");n.querySelector(".hm-tl")||(n.innerHTML=`<div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m">Today's plan</h2>
          <wa-button size="s" appearance="plain" data-act="week"><wa-icon slot="end" name="arrow-down"></wa-icon>Week schedules</wa-button>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each strip is a room's day, coloured by the temperature it aims for. The upright line is now. <a href="#guide/schedules">Change the weekly times</a></p>
          <div class="hm-tl"></div>
        </div>`,n.querySelector("[data-act=week]").addEventListener("click",()=>s?.())),n.querySelector(".hm-tl").innerHTML=`${L}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`}function O(v){i=v;const _=new Map;for(const j of v.rooms)_.set(j.id,j);const L=!c.size;c=_,l||(l=ar(v.rooms)),L&&R(),g?W():te(),ee(),fe()}return{update:O,week(v){x=v,fe()},devices(v){h=v,ee()},select(v){f=v,g||V()},redraw(){!g&&e.querySelector(".hm-iso")&&te(),ee(),fe()},get editing(){return g}}}function Au(e){const t=new Map;for(const n of e)t.set(n,(t.get(n)??0)+1);return[...t.entries()].sort((n,o)=>o[1]-n[1]||o[0]-n[0])[0][0]}const Tu=e=>e.charAt(0).toUpperCase()+e.slice(1),lr="radiate.guideNote";function Ru({root:e}){const t=n=>n?e.querySelector(`#g-${CSS.escape(n)} > h3`):null;return{show(){},hide(){},reveal(n){const o=t(n);return o?(o.focus({preventScroll:!0}),o.scrollIntoView({block:"start"}),!0):!1}}}function Lu({note:e,tab:t}){let n=!1;try{n=localStorage.getItem(lr)==="dismissed"}catch{}e.hidden=n;const o=()=>{e.hidden=!0;try{localStorage.setItem(lr,"dismissed")}catch{}};e.querySelector("[data-act=open]").addEventListener("click",o),e.querySelector("[data-act=dismiss]").addEventListener("click",()=>{o(),t&&!t.hidden&&t.focus()})}const lt=e=>document.getElementById(e),cr=15e3,Mu={zigbee:"Zigbee sensor",home_assistant:"Home Assistant",both:"Both, sensor first",eco:"Eco",comfort:"Comfort",normal:"Normal",internal_sensor_only:"Valve's own sensor",passive:"Bypass",unheated:"No radiator",episodic:"Open fire",continuous:"Range cooker",in_use:"In use",occasional:"Occasional",unused:"Unused"},Ou={app:"Set here",house_file:"House file",default:"Default"},hn=e=>Mu[e]??String(e),Pa=(e,t,n)=>`${e} ${e===1?t:n}`,pi=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ln=e=>`st-${e.replace(/[^a-z0-9_]/gi,"-")}`;function Da(e,t){const n=Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));return t?t==="°C"?`${n}°`:t==="%"?`${n}%`:`${n} ${t}`:n}function Ut(e,t){if(t==null||t==="")return"–";switch(e.kind){case"number":case"integer":return Da(Number(t),e.unit);case"bool":return t?"On":"Off";case"list":return Array.isArray(t)&&t.length?t.join(", "):"–";case"use":return typeof t=="string"?hn(t):`Weekdays ${hn(t.weekdays).toLowerCase()}, weekend ${hn(t.weekend).toLowerCase()}`;case"choice":return hn(t);default:return String(t)}}function Nu(e){const t=[e.help];return(e.kind==="number"||e.kind==="integer")&&e.min!=null&&e.max!=null&&t.push(`${Da(e.min,null)} to ${Da(e.max,e.unit)}.`),!e.secret&&e.default!=null&&e.default!==""&&t.push(`Default ${Ut(e,e.default)}.`),e.restart&&t.push("Used after a restart."),t.join(" ")}function zu(e){return e.secret?e.is_set?e.source==="house_file"&&e.env.length?`Set from ${e.env.join(", ")}`:e.source==="app"?"Set here":"Set in the house file":"Not set":e.source==="house_file"&&e.env.length?`House file, from ${e.env.join(", ")}`:Ou[e.source]??e.source}function Pu(e){return e.secret?e.house_file_set?"Use the house file's":"Clear it":e.house_file_set?`Use the house file's, ${Ut(e,e.house_file_value)}`:e.default!=null?`Use the default, ${Ut(e,e.default)}`:"Use the default"}function Du(e,t){const n=e.pending_restart.length;if(!n)return"";const o=e.pending_restart.map(t);return`Restart Radiate to use ${Pa(n,"changed setting","changed settings")}: ${pi(o)}.`}function qu(e,t){return e.length&&t.length?"Saved. Some changes are in use now; restart Radiate for the rest.":t.length?"Saved. Restart Radiate to use it.":e.length?"Saved. In use now.":"Saved."}function dr(e,t){switch(e.kind){case"number":case"integer":{const n=String(t).trim();if(!n)return null;const o=Number(n.replace(",","."));return Number.isFinite(o)?o:n}case"list":{const n=String(t).split(/[,\s]+/).map(o=>o.trim()).filter(Boolean);return n.length?n:null}case"secret":return t===""?void 0:t;case"text":case"choice":return String(t).trim()===""?null:String(t).trim();default:return t}}const Iu=(e,t)=>JSON.stringify(e??null)===JSON.stringify(t??null);function fi(e){if(!e.secret)return e.source==="default"?null:e.value}const Bu={set:"cool",restart:"warning"};function Hu(e,t=""){const n=` ${t} `;if(e==="button"&&/\s(btn|link)\s/.test(n)){const o=document.createElement("wa-button");return n.includes(" btn-primary ")?o.setAttribute("variant","brand"):n.includes(" link ")?(o.setAttribute("appearance","plain"),o.setAttribute("size","s")):o.setAttribute("appearance","outlined"),o}return n.includes(" card ")&&e!=="details"?document.createElement("wa-card"):n.includes(" badge ")?document.createElement("wa-badge"):document.createElement(e)}function le(e,t={},...n){const o=Hu(e,t.class);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="class"?o.className=s:a==="text"?o.textContent=s:a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n)a&&o.append(a);if(o.localName==="wa-badge"){const a=Bu[t["data-kind"]]??"neutral";a==="cool"?o.classList.add("radiate-cool"):o.setAttribute("variant",a),o.setAttribute("appearance","filled-outlined")}return o}function Fu(e,t,n,o){const a=document.createElement("wa-radio-group");a.setAttribute("label",e),a.setAttribute("orientation","horizontal"),a.setAttribute("size","s"),a.classList.add("label-hidden");let s=n;t.forEach(([,i],c)=>{const l=document.createElement("wa-radio");l.setAttribute("appearance","button"),l.value=String(c),l.textContent=i,a.append(l)});const r=t.findIndex(([i])=>JSON.stringify(i)===JSON.stringify(s));return a.value=r<0?"":String(r),a.addEventListener("change",()=>{const i=Number(a.value);!Number.isInteger(i)||!t[i]||(s=t[i][0],o())}),{node:a,get:()=>s,focus:()=>a.focus()}}function ur(e,t,n,o,a){const s=le("select",{id:e,"aria-describedby":a});for(const[r,i]of t)s.append(le("option",{value:r,text:i}));return n!=null&&!t.some(([r])=>r===n)&&s.append(le("option",{value:n,text:hn(n)})),s.value=n??"",s.addEventListener("change",o),s}function ju(e,t,n,o){const a=fi(e);if(e.kind==="bool"){const i=[[!0,"On"],[!1,"Off"]];e.optional&&i.unshift([null,"Not set"]);const c=Fu(e.label,i,e.optional?a:a??e.default,o);return c.node.setAttribute("aria-describedby",n),c.node.id=t,{node:c.node,get:()=>c.get(),focus:c.focus}}if(e.kind==="choice"){const i=e.choices.map(l=>[l,hn(l)]);(e.optional||a==null)&&i.unshift(["",e.optional?"Not set":`Default, ${Ut(e,e.default)}`]);const c=ur(t,i,a,o,n);return{node:c,get:()=>dr(e,c.value),focus:()=>c.focus()}}if(e.kind==="use"){const i=[["","Not set"],...e.choices.map(g=>[g,hn(g)])],c=typeof a=="string"?[a,a]:a?[a.weekdays,a.weekend]:["",""],l=le("div",{class:"st-use",role:"group",id:t,"aria-describedby":n}),d=["Weekdays","Weekend"].map((g,p)=>{const f=`${t}-${p}`,x=ur(f,i,c[p]||"",o);return l.append(le("span",{class:"st-use-part"},le("label",{for:f,text:g}),x)),x});return{node:l,get:()=>{const[g,p]=d.map(f=>f.value);return!g&&!p?null:g===p?g:{weekdays:g||null,weekend:p||null}},focus:()=>d[0].focus()}}const s=le("input",{id:t,"aria-describedby":n,autocomplete:"off",spellcheck:"false"});return e.kind==="number"||e.kind==="integer"?(s.type="text",s.inputMode=e.kind==="integer"||(e.min??0)>=0?e.kind==="integer"?"numeric":"decimal":"text",s.className="num",s.value=a==null?"":String(a),a==null&&e.default!=null&&(s.placeholder=String(e.default))):e.kind==="secret"?(s.type="password",s.autocomplete="new-password",s.placeholder=e.is_set?"Set. Type to replace it":"Not set"):e.kind==="list"?(s.type="text",s.value=Array.isArray(a)?a.join(", "):"",!s.value&&Array.isArray(e.default)&&(s.placeholder=e.default.join(", "))):(s.type="text",s.value=a==null?"":String(a),!s.value&&e.default!=null&&(s.placeholder=String(e.default))),s.addEventListener("input",o),{node:e.unit&&(e.kind==="number"||e.kind==="integer")?le("span",{class:"unit"},s,le("span",{text:e.unit})):s,get:()=>dr(e,s.value),focus:()=>s.focus(),input:s}}function Wu({transport:e,isAuthError:t,onAuth:n,onOpenSetup:o,onShowSchedules:a,moreSections:s=()=>[]}){let r=null,i=!1,c=!1;const l=new Map,d=new Set;let u=null,g=!1;const p=new Map,f=async(m,D,F)=>{try{return await e.call(m,D,F)}catch(N){throw t(N)&&n(),N}};async function x(){if(!c){c=!0;try{const m=await f("GET","settings/config");m.status===200&&(r=m.body,w())}catch{lt("settings-summary").textContent="Couldn't load the settings. Try again in a moment."}finally{c=!1}}}function h(m){return p.get(m)??m}function w(){p.clear();for(const U of r.sections){for(const ee of U.fields??[])p.set(ee.path,ee.label);for(const ee of U.rooms??[])for(const se of ee.fields)p.set(se.path,`${ee.name} ${se.label.toLowerCase()}`)}const m=r.saved.length;lt("settings-summary").textContent=m?`${Pa(m,"setting is","settings are")} set here, over the house file.`:"Every setting comes from the house file or its default.",lt("settings-where").textContent=r.saved_at?`Changes are saved to ${r.saved_at}. The house file isn't changed.`:"In the demo, changes are not saved to a file and end when the demo does.";const D=lt("settings-restart");D.hidden=!r.pending_restart.length,lt("settings-restart-text").textContent=Du(r,h);const F=lt("settings-problems");if(F.hidden=!r.problems.length,lt("settings-problems-text").textContent=r.problems.length?`The settings saved here weren't used at the last start, so the house file's apply. ${r.problems.map(U=>`${U.path?`${h(U.path)}: `:""}${U.message}`).join(" ")} Change or reset them below.`:"",b(m),lt("settings-toc").replaceChildren(...[...r.sections,...s()].map(U=>le("li",{},le("a",{href:`#settings/${U.id}`,text:U.title})))),lt("settings-sections").replaceChildren(...r.sections.map(k)),u){const U=document.getElementById(u);u=null,U?.focus()}}function b(m){const D=lt("settings-all");if(D.hidden=!m,D.replaceChildren(),!m)return;if(!g){const W=le("button",{type:"button",class:"btn",id:"settings-all-btn",text:"Use the house file for every setting"});W.addEventListener("click",()=>{g=!0,u="settings-all-go",w()}),D.append(W);return}const F=le("button",{type:"button",class:"btn btn-primary",id:"settings-all-go",text:"Use the house file"}),N=le("button",{type:"button",class:"link",text:"Keep them"});F.addEventListener("click",()=>V(null,"all",F)),N.addEventListener("click",()=>{g=!1,u="settings-all-btn",w()}),D.append(le("p",{text:`The ${Pa(m,"setting","settings")} set here go back to the house file's values.`}),le("div",{class:"st-actions"},F,N))}function k(m){const D=le("section",{class:"st-sec",id:`s-${m.id}`,"aria-labelledby":`s-${m.id}-h`}),F=le("h3",{class:"section-h",id:`s-${m.id}-h`,tabindex:"-1",text:m.title});D.append(F);const N=le("p",{class:"help-line st-help",text:`${m.help} `});if(m.guide&&N.append(le("a",{class:"help-link",href:`#guide/${m.guide}`,text:`About ${m.title.toLowerCase()}`})),D.append(N),m.link)D.append(R(m));else if(m.per_room)for(const W of m.rooms)D.append(E(`rooms.${W.id}`,W.name,W.fields,!0));else D.append(E(m.id,m.title,m.fields,!1));return D}function R(m){const D=le("div",{class:"card st-plate st-linked"});if(m.link==="household"){const F=le("button",{type:"button",class:"btn btn-primary",text:"Open the household setup"});F.addEventListener("click",N=>o(N)),D.append(F)}else if(m.link==="schedules"){const F=le("button",{type:"button",class:"btn",text:"Show the schedules"});F.addEventListener("click",()=>a()),D.append(F)}return D}function E(m,D,F,N){const W=ln(m),U=F.filter(K=>K.source==="app").length,ee=N?le("details",{class:"card st-plate st-room",id:W}):le("div",{class:"card st-plate",id:W});if(N){const K=le("summary",{},le("span",{class:"st-room-name",text:D}));U&&K.append(le("span",{class:"badge","data-kind":"set",text:`${U} set here`})),F.some(ae=>ae.pending_restart)&&K.append(le("span",{class:"badge","data-kind":"restart",text:"Restart to use"})),ee.append(K),ee.open=d.has(m)||l.has(m),ee.addEventListener("toggle",()=>{ee.open?d.add(m):d.delete(m)})}const se=le("form",{class:"st-form",novalidate:!0,"aria-label":N?D:`${D} settings`}),de=new Map,fe=le("div",{class:"st-foot"}),O=le("button",{type:"submit",class:"btn btn-primary",id:`${W}-save`,text:"Save changes",hidden:!0}),v=le("button",{type:"button",class:"link",text:"Cancel changes",hidden:!0}),_=le("p",{class:"st-status",id:`${W}-status`,role:"status",tabindex:"-1"}),L=le("div",{class:"st-confirm",hidden:!0}),j=()=>F.filter(K=>{const ae=de.get(K.path);if(!ae)return!1;const ve=ae.get();return K.secret?ve!==void 0:!Iu(ve,fi(K))}),X=()=>{const K=j().length;O.hidden=!K,O.disabled=!1,v.hidden=!K,O.textContent=K>1?`Save ${K} changes`:"Save changes",L.hidden=!0};for(const K of F)se.append(P(K,de,X));v.addEventListener("click",()=>{l.delete(m),u=`${W}-status`,w()}),se.addEventListener("submit",async K=>{K.preventDefault();const ae=j();if(!ae.length)return;const ve=Object.fromEntries(ae.map(Ae=>[Ae.path,de.get(Ae.path).get()])),Le=ae.filter(Ae=>Ae.hardware&&!Ae.secret),Ke=Le.map(Ae=>`${h(Ae.path)}, ${Ut(Ae,ve[Ae.path])}`);Le.length?Q(L,Ke,()=>T(m,ve,!0,O,se),O,!0):T(m,ve,!1,O,se)});const M=le("button",{type:"button",class:"link",text:N?`Use the house file for ${D}`:"Use the house file for this section",hidden:!U});M.addEventListener("click",()=>V(m,m,M,L));const I=l.get(m);return I&&I.until>Date.now()&&(_.textContent=I.text,_.dataset.kind=I.kind??""),fe.append(le("div",{class:"st-actions"},O,v,M),L,_),se.append(fe),ee.append(se),ee}function P(m,D,F){const N=ln(m.path),W=le("div",{class:"st-field","data-source":m.source}),U=le("div",{class:"st-head"}),ee=m.kind==="bool"||m.kind==="use"?le("span",{class:"st-label",id:`${N}-label`,text:m.label}):le("label",{class:"st-label",for:N,text:m.label});U.append(ee,le("span",{class:"st-src","data-source":m.source,text:zu(m)})),m.pending_restart&&U.append(le("span",{class:"tag",text:"Restart to use"})),W.append(U);const se=`${N}-help`,de=`${N}-err`;W.append(le("p",{class:"field-help",id:se,text:Nu(m)}));const fe=le("div",{class:"st-control"});if(m.locked)fe.append(le("p",{class:"st-fixed",text:`${Ut(m,m.value)}. ${m.locked}`}));else if(!m.editable)fe.append(le("p",{class:"st-fixed"},le("code",{text:Ut(m,m.value)}),document.createTextNode(" Only the house file sets this.")));else{const O=ju(m,N,`${se} ${de}`,F);(m.kind==="bool"||m.kind==="use")&&O.node.setAttribute("aria-labelledby",`${N}-label`),D.set(m.path,O),fe.append(O.node)}if(W.append(fe),m.source==="app"&&!m.locked){const O=m.secret?null:m.house_file_set?`House file: ${Ut(m,m.house_file_value)}.`:null,v=le("button",{type:"button",class:"link",id:`${N}-revert`,text:Pu(m)});v.addEventListener("click",()=>V(m.path,Z(m.path),v)),W.append(le("p",{class:"st-file"},O?document.createTextNode(`${O} `):null,v))}return W.append(le("p",{class:"field-error",id:de,hidden:!0})),W}const Z=m=>{const D=m.split(".");if(D[0]==="rooms"&&D.length===3)return`rooms.${D[1]}`;const F=r.sections.find(N=>(N.fields??[]).some(W=>W.path===m));return F?F.id:m};function Q(m,D,F,N,W=!1){const U=W?D:D.map(h);m.replaceChildren(),m.hidden=!1;const ee=le("button",{type:"button",class:"btn btn-primary",text:"Save and allow it"}),se=le("button",{type:"button",class:"link",text:"Cancel"});ee.addEventListener("click",()=>{m.hidden=!0,F()}),se.addEventListener("click",()=>{m.hidden=!0,N?.focus()}),m.append(le("p",{class:"st-confirm-text",text:`This lets Radiate write to the boiler or the valves: ${pi(U)}. Check the wiring and the valves before you go on.`}),le("div",{class:"st-actions"},ee,se)),ee.focus()}function te(m,D,F,N){for(const fe of m.querySelectorAll(".field-error"))fe.hidden=!0,fe.textContent="";for(const fe of m.querySelectorAll("[aria-invalid]"))fe.removeAttribute("aria-invalid");const W=[],U=[];for(const fe of F??[]){const O=m.querySelector(`#${CSS.escape(ln(fe.path))}-err`);O?(O.textContent=fe.message,O.hidden=!1,m.querySelector(`#${CSS.escape(ln(fe.path))}`)?.setAttribute("aria-invalid","true"),W.push(fe)):U.push(fe)}const ee=m.querySelector(".st-status"),se=U.map(fe=>`${fe.path?`${h(fe.path)}: `:""}${fe.message}`).join(" ");ee.textContent=`${N??"Not saved."}${se?` ${se}`:""}`,ee.dataset.kind="error";const de=W[0]?m.querySelector(`#${CSS.escape(ln(W[0].path))}`):null;de&&de.tagName!=="DIV"?de.focus():ee.focus()}async function T(m,D,F,N,W){N.disabled=!0;try{const U=await f("PUT","settings/config",F?{values:D,confirm:!0}:{values:D});if(U.status===409){const ee=W.querySelector(".st-confirm");Q(ee,U.body.confirm??[],()=>T(m,D,!0,N,W),N),N.disabled=!1;return}if(U.status!==200){const ee=typeof U.body=="object"&&U.body?U.body:{message:String(U.body)};te(W,m,ee.errors,ee.message),N.disabled=!1;return}q(m,U.body,qu(U.body.applied??[],U.body.restart??[]))}catch{const U=W.querySelector(".st-status");U.textContent="Not saved. Check the connection and try again.",U.dataset.kind="error",N.disabled=!1}}async function V(m,D,F,N){const W=m==null?"settings/config":`settings/config/${encodeURIComponent(m)}`,U=async ee=>{F.disabled=!0;try{const se=await f("DELETE",W,ee?{confirm:!0}:void 0);if(se.status===409){const de=N??F.closest("form")?.querySelector(".st-confirm")??lt("settings-all");F.disabled=!1,Q(de,se.body.confirm??[],()=>U(!0),F);return}if(se.status!==200){const de=typeof se.body=="object"&&se.body?se.body:{message:String(se.body)},fe=F.closest("form");if(F.disabled=!1,fe)te(fe,D,de.errors,de.message??"Not changed.");else{const O=(de.errors??[]).map(v=>`${h(v.path)}: ${v.message}`).join(" ");lt("settings-all").append(le("p",{class:"st-status","data-kind":"error",role:"alert",text:`${de.message??"Not changed."} ${O}`}))}return}g=!1,q(D,se.body,"Back to the house file.")}catch{F.disabled=!1}};U(!1)}function q(m,D,F){r=D,l.set(m,{text:F,until:Date.now()+cr}),setTimeout(()=>{const N=l.get(m);if(N&&N.until<=Date.now()){l.delete(m);const W=document.getElementById(`${ln(m)}-status`);W&&(W.textContent="")}},cr+50),u=m==="all"?"settings-h":`${ln(m)}-status`,w()}return{async available(){try{const m=await f("GET","settings/config");return m.status!==200?!1:(r=m.body,!0)}catch{return!1}},show(){i=!0,r&&w(),x()},hide(){i=!1},reveal(m){const D=m?document.getElementById(`s-${m}-h`):null;return D?(D.focus({preventScroll:!0}),D.scrollIntoView({block:"start"}),!0):!1},get open(){return i}}}const mi=5e3;function Jo({holdMs:e=mi,now:t=()=>Date.now()}={}){let n,o=!1,a=0,s=0,r=0,i="";const c=()=>{o=!1,n=void 0};return{press(l){return n=l,o=!0,i="",s+=1,a=s,s},done(l){l===s&&(a=0,r=t())},failed(l,d){l===s&&(a=0,c(),i=d)},shown(l){return o&&!a&&(l===n||t()-r>e)&&c(),o?n:l},get busy(){return a!==0},get error(){return i},clearError(){i=""}}}async function Uu(e,t,{send:n,paint:o,refresh:a,later:s=setTimeout}){const r=e.press(t);o();try{await n()}catch(i){return e.failed(r,no(i)),o(),!1}return e.done(r),o(),s(o,mi+50),await a(),!0}function no(e){const t=String(e?.message??"");return/HTTP 403/.test(t)&&/csrf/.test(t)?"Not saved: your sign-in has expired. Reload the page.":/HTTP 403/.test(t)?"Not saved: ask an admin.":"Not saved. Try again."}const gi=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Vu=10,bi=.4,Ku=.75,Ju=180,Yu=["dry_burner","dry_relay"],co=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,Tt=e=>`${e.toFixed(1)}°`,hr=e=>e.toLocaleString("en-GB");function pr(e){if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`}function Ht(e){return e>=.095?e.toFixed(1):e.toFixed(2)}function Gu(e,t=new Date().getFullYear()){const[n,o,a]=e.split("-").map(Number);return`${a} ${gi[o-1]}${n===t?"":` ${n}`}`}const Xu=e=>e===1?"once":e===2?"twice":`${e} times`;function fr(e){return e<bi?"still learning":e<Ku?"fairly sure of":"sure of"}function Qu(e){const t=fr(e.confidence),n=fr(e.loss_confidence??e.confidence);return t===n?`Radiate is ${t} how fast this room warms and cools.`:`Radiate is ${t} how fast this room warms, and ${n} how fast it cools.`}const Zu=e=>e.samples===0||e.confidence<bi;function eh(e,t={}){const n=e.model,o=[],a=(h,w,b)=>o.push({key:h,label:w,text:b}),s=e.temperature,r=t.outdoor,i=n.heating_kph;if(i){let h=`With the boiler on and the valve open, about ${Ht(i.with_house)}° an hour while most of the house is heating, or ${Ht(i.alone)}° an hour when it's the only room taking heat.`;if(s!=null&&r!=null){const w=i.with_house-n.b*(s-r)+n.d;h+=w>.05?` Now, with ${Tt(r)} outside, it would gain about ${Ht(w)}° an hour after the heat it loses.`:` Now, with ${Tt(r)} outside, it loses heat about as fast as the radiator adds it while the house heats.`}a("warms","Warms up",h)}else a("warms","Warms up",`The radiator can warm it by up to about ${Ht(n.a)}° an hour with the boiler on and the valve fully open.`);let c=`With the heating off, it cools by about ${Ht(n.b*Vu)}° an hour when it's 10° colder outside than in.`;s!=null&&r!=null&&s-r>=1&&(c+=` Now, at ${Tt(s)} inside and ${Tt(r)} outside, that's about ${Ht(n.b*(s-r))}° an hour.`),a("cools","Cools down",c),e.heat_source==="continuous"?a("steady","Other heat",`The range cooker adds about ${Ht(Math.max(0,n.d))}° an hour on its own, all day, so the radiator is needed less.`):n.d>=.15&&a("steady","Other heat",`Something other than the radiator adds about ${Ht(n.d)}° an hour, such as a warm room next door.`);const l=Math.round(n.arrival_lag_min);a("lag","Heat arrives",n.lag_measured?`About ${l} min after the boiler fires, timed over ${n.lag_measured===1?"its last warm-up":`its last ${n.lag_measured} warm-ups`}.`:`Not timed yet, so Radiate allows ${l} min for the hot water to reach the radiator.`);let d;if(n.samples===0)d="Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";else{d=Qu(n);const h=n.learned?.since?` since ${Gu(n.learned.since,t.year)}`:"",w=n.samples>=120?`, about ${hr(Math.round(n.samples/60))} hours of learning`:"";d+=` From ${hr(n.samples)} ${n.samples===1?"reading":"readings"}${h}${w}.`}e.role==="internal_sensor_only"&&(d+=" This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.");const u=n.learned?.updates??{},g=Object.values(u).reduce((h,w)=>h+w,0),p=Yu.reduce((h,w)=>h+(u[w]??0),0);g&&p===g&&(d+=" All of it was learned in dry run, while Radiate watched the heating without running it."),a("sure","How sure",d);let f="Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";const x=n.warm_up;if(x&&t.minute_of_day!=null){const h=x.min==null||x.min<60?x.min:Math.round(x.min/5)*5,w=co((t.minute_of_day+x.in_min)%1440),b=x.quiet_until_min??null,k=b==null?null:(b-t.minute_of_day+1440)%1440,R=b==null?"as early as it can":`as soon as quiet hours end at ${co(b)}`;if(x.min==null)f+=` It can't tell yet how long this room takes to reach ${Tt(x.to_c)} by ${w}, so it starts ${R}.`;else if(x.min>Ju)f+=` To get from ${Tt(x.from_c)} to ${Tt(x.to_c)} by ${w}, it reckons this room needs about ${pr(h)}, longer than it looks ahead, so it starts ${R}.`;else{const E=x.in_min-h,P=E<=0?"now":`at about ${co((t.minute_of_day+E)%1440)}`;if(f+=` To get from ${Tt(x.from_c)} to ${Tt(x.to_c)} by ${w}, it allows about ${pr(h)}, so it `,b!=null&&E<k){const Z=k+h>x.in_min?`, and may get there after ${w}`:"";f+=`would start ${P}. Quiet hours hold it until ${co(b)}, so it starts then${Z}.`}else f+=`starts warming ${P}.`}}n.lockshield!=null&&(f+=n.lockshield_learned===!1?` Between burns, the valve's opening limit rests at ${n.lockshield}% until Radiate has seen enough burns to set it.`:` Between burns, the valve's opening limit rests at ${n.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`),a("uses","Used for",f),n.relearns>0&&a("relearned","Relearned",`Radiate relearned this room ${Xu(n.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);for(const h of t.notes??[]){const w=new Date(h.at*1e3),b=`${w.getDate()} ${gi[w.getMonth()]}`,k=h.code==="learning.reset"||h.code==="learning.invalidated"?"Started again":"Carried over";a(`note-${h.at}`,k,`${b}. ${h.message}`)}return o}function th(e){return`In the model's own terms: heating gain ${e.a.toFixed(2)} K/h, loss rate ${e.b.toFixed(3)} per hour per degree, other heat ${e.d.toFixed(2)} K/h, arrival lag ${Math.round(e.arrival_lag_min)} min, confidence ${Math.round(e.confidence*100)}%.`}const ct=e=>document.getElementById(e),wi="–",ba=50,nh={"radiate.security.login":"Signed in","radiate.security.login.failed":"Sign-in refused","radiate.security.logout":"Signed out","radiate.security.session.ended":"Session ended","radiate.security.request.refused":"Request refused","radiate.security.access.denied":"Not allowed","radiate.security.lockout.started":"Sign-in locked","radiate.security.lockout.ended":"Sign-in unlocked","radiate.security.user.changed":"User changed","radiate.security.config.changed":"Changed","radiate.security.control.used":"Control used","radiate.security.login.config":"Started"},oh={password:"password",oidc:"single sign-on",saml:"SAML",token:"API token",ingress:"Home Assistant",cli:"command line",session:"signed in",open:"open server"},ah=e=>nh[e.event]??e.event;function sh(e){const t=e.attributes??{};return e.user?e.user:oh[t["radiate.auth.method"]]??wi}function rh(e,t){const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e*1e3))}function ih(e,t){const n=e.events.length,o=t.outcome==="failure"?"refusals":t.outcome==="success"?"allowed events":"events",a=t.user?` for ${t.user}`:"",s=`Kept for ${e.retention_days} days.`;return n?`The latest ${n===1?"event":`${n} ${o}`}${a}, newest first. ${s}`:`No ${o}${a} yet. ${s}`}function lh({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=!1,s=[],r=null,i=!1;const c={outcome:"",user:""},l=f=>{const x=new URLSearchParams({limit:String(ba)});return c.outcome&&x.set("outcome",c.outcome),c.user&&x.set("user",c.user),f&&x.set("before",String(f)),`audit?${x}`};function d(f){const x=document.createElement("tr");f.outcome==="failure"&&(x.dataset.kind="warn");const h=(k,R,E)=>{const P=document.createElement(k);return P.textContent=R,E&&(P.className=E),P},w=h("th",rh(f.at));w.scope="row";const b=h("td",ah(f));if(f.outcome==="failure"){const k=document.createElement("wa-badge");k.textContent="Refused",k.setAttribute("variant","warning"),k.setAttribute("appearance","filled-outlined"),b.append(" ",k)}return x.append(w,b,h("td",sh(f)),h("td",f.source??wi),h("td",f.message,"sl-detail")),x}function u(f){const x=ct("security-user"),h=["",...f],w=[...x.options].map(b=>b.value);h.join(`
`)!==w.join(`
`)&&(x.replaceChildren(...h.map(b=>{const k=document.createElement("option");return k.value=b,k.textContent=b||"Everyone",k})),x.value=h.includes(c.user)?c.user:"")}function g(){r&&(u(r.users??[]),ct("security-summary").textContent=ih({...r,events:s},c),ct("security-body").replaceChildren(...s.map(d)),ct("security-table").hidden=!s.length,ct("security-more").hidden=!i)}async function p(f=!1){const x=f&&s.length?s.at(-1).id:null;try{const h=await e.get(l(x));r=h,s=f?[...s,...h.events]:h.events,i=h.events.length===ba,ct("security-error").hidden=!0,g()}catch(h){if(t(h)){n();return}ct("security-error").hidden=!1}}return ct("security-outcome").addEventListener("change",f=>{const x=f.target.value==="all"?"":f.target.value;x!==c.outcome&&(c.outcome=x,p())}),ct("security-user").addEventListener("change",f=>{c.user=f.target.value,p()}),ct("security-more").addEventListener("click",()=>p(!0)),ct("security-refresh").addEventListener("click",()=>p()),{async available(){try{r=await e.get(l()),s=r.events,i=s.length===ba,a=!0}catch{a=!1}return ct("s-security-log").hidden=!a,a&&g(),a},get offered(){return a},show(){o=!0,a&&p()},hide(){o=!1},get open(){return o}}}const fo=e=>new URL(`api/v1/${e}`,document.baseURI).toString(),S=e=>document.getElementById(e),Lt=e=>e==null?"–":`${e.toFixed(1)}°`,Eo=e=>`${Math.max(0,Math.round(e/60))} min`,Yo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ft=(e,t,n)=>`${e} ${e===1?t:n}`,cn=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,Ao=e=>{if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`},Go=matchMedia("(prefers-reduced-motion: reduce)"),Vt=new Map;let we=null,qa=null,mt=null;class Ue extends Error{}const Ia="radiate.token";function ch(){try{return localStorage.getItem(Ia)||""}catch{return""}}function dh(e){try{e?localStorage.setItem(Ia,e):localStorage.removeItem(Ia)}catch{}}function uh(){let e=ch(),t="",n=null,o=null,a=2e3,s=null,r=null;const i=(d={},u="GET")=>{const g=e?{...d,Authorization:`Bearer ${e}`}:{...d};return t&&u!=="GET"&&u!=="HEAD"&&(g["X-CSRF-Token"]=t),g},c=async(d,u={})=>{const g=await fetch(fo(d),{...u,headers:i(u.headers,u.method)});if(g.status===401)throw new Ue(d);if(!g.ok)throw new Error(`${d}: HTTP ${g.status} ${await g.text()}`);return g},l=()=>{o=null;const d=new URL(fo("stream"));d.protocol=d.protocol==="https:"?"wss:":"ws:";try{n=new WebSocket(d)}catch{n=null,r("lost"),o=setTimeout(l,a);return}const u=n;u.onopen=()=>{e&&u.send(JSON.stringify({token:e}))},u.onmessage=g=>{a=2e3,r("live"),s(JSON.parse(g.data))},u.onclose=g=>{if(n===u&&(n=null),g.code===4401){r("auth");return}r("lost"),o=setTimeout(l,a),a=Math.min(a*2,15e3)},u.onerror=()=>u.close()};return{hasToken:()=>!!e,setCsrf(d){t=d||""},setToken(d){e=d,dh(d)},house:async()=>(await c("house")).json(),state:async()=>(await c("state")).json(),get:async d=>(await c(d)).json(),text:async d=>(await c(d)).text(),async post(d,u){await c(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)})},async call(d,u,g){const p={method:d,headers:i(g===void 0?{}:{"Content-Type":"application/json"},d)};g!==void 0&&(p.body=JSON.stringify(g));const f=await fetch(fo(u),p);if(f.status===401)throw new Ue(u);const x=await f.text();let h=x;try{h=JSON.parse(x)}catch{}return{status:f.status,body:h}},subscribe(d,u){s=d,r=u,!n&&!o&&l()}}}const Ce=document.documentElement.dataset.transport==="demo"?(await Gi(async()=>{const{createDemoTransport:e}=await import("./demo.js");return{createDemoTransport:e}},[],import.meta.url)).createDemoTransport():uh();async function Pn(e,t){try{await Ce.post(e,t)}catch(n){throw n instanceof Ue?rt():console.error(n),n}}const Xo=(e,t,n,o,a)=>Uu(e,t,{send:()=>Pn(n,o),paint:a,refresh:Wn});function yi(e,t){e.hidden=!t,e.textContent=t}const Ba={viewer:0,household:1,admin:2};let To="admin";const Ha=e=>(Ba[To]??-1)>=Ba[e],jn=e=>Ha(e)?"":To==="household"?"Ask an admin":"Read only";function eo(e,t,n){const o=jn(n);for(const a of e)a&&(a.disabled=!!o,o?a.dataset.locked="":delete a.dataset.locked);return t&&(t.hidden=!o,t.textContent=o),!!o}function hh(){eo([S("mode"),S("demand")],S("controls-lock"),"household"),eo([S("boost")],S("boost-lock"),"household")}const Qo=e=>e.reason_code==="demand.pooled";function vi(e){return e.role==="passive"?["Bypass, not controlled",""]:e.role==="unheated"?["No radiator",""]:e.fire?["Fire lit","fire"]:e.preheating?["Preheating","preheat"]:Qo(e)?["Waiting for a burn","pooled"]:e.calling?["Heating","calling"]:e.topup&&e.extend===!0?["Topping up","extend"]:e.topup&&e.extend===!1?["Heat sink","sink"]:e.topup?["Topped up","sink"]:e.temperature!=null&&e.target!=null&&e.temperature>=e.target-.3?["Comfortable","ok"]:["Waiting",""]}const ph={calling:"brand",fire:"brand",extend:"brand",preheat:"warning",pooled:"warning",back:"warning",stale:"warning",ok:"success",sink:"cool",away:"cool"};function Ro(e,t){const n=ph[t]??"neutral";return n==="cool"?G`<wa-badge class="radiate-cool" appearance="filled-outlined">${e}</wa-badge>`:G`<wa-badge variant=${n} appearance=${n==="neutral"?"outlined":"filled-outlined"}>${e}</wa-badge>`}const ki={fire:"learning paused: fire",fire_holdoff:"learning paused: fire cooling",window:"learning paused: window",shower:"learning paused: shower",cooker_spike:"learning paused: cooking",unexplained_heat:"learning paused: extra heat (sun or guests?)",store_recovery:"learning paused: hot water",heat_unknown:"learning paused: no boiler reading",setpoint_change:"settling",no_data:"gathering data",trv_offline:"TRV offline"},wa=new Map;function $i(e){return wa.has(e)||wa.set(e,Jo()),wa.get(e)}const xi=e=>!!(e.fire_switch??e.fire);function fh(e){const t=$i(e.id),n=!t.shown(xi(Vt.get(e.id)??e));Xo(t,n,`rooms/${e.id}/fire`,{lit:n},is).then(o=>o&&qt(n?`${e.name}: fire lit. Its radiator is closed.`:`${e.name}: fire out.`))}const Si=5,_i=28,mh=600,gh=5e3,ya=new Map;function Gt(e){return ya.has(e)||ya.set(e,{pending:null,timer:null,expiry:null,error:"",clearing:!1}),ya.get(e)}function Zo(e){const t=Gt(e.id);return t.pending!=null?t.pending:e.override?.setpoint!=null&&!t.clearing?e.override.setpoint:e.setpoint??e.target??null}function bh(e,t){const n=Vt.get(e);if(!n||!Number.isFinite(t))return;const o=Gt(e),a=Zo(n)??20,s=Math.min(_i,Math.max(Si,Math.round(t*2)/2));if(s===a){is();return}o.pending=s,o.error="",o.clearing=!1,clearTimeout(o.timer),clearTimeout(o.expiry),o.timer=setTimeout(()=>wh(e),mh),bt()}async function wh(e){const t=Gt(e);t.timer=null;const n=t.pending;try{await Pn(`rooms/${e}/setpoint`,{setpoint:n})}catch(a){t.pending===n&&(t.pending=null,t.error=no(a)),bt();return}t.expiry=setTimeout(()=>{t.pending===n&&!t.timer&&(t.pending=null,bt())},gh);const o=Vt.get(e);o&&t.pending===n&&qt(`${o.name} held at ${Lt(n)}.`),Wn()}async function yh(e){const t=Gt(e);clearTimeout(t.timer),t.timer=null,t.pending=null,t.error="",t.clearing=!0,bt();try{await Pn(`rooms/${e}/setpoint`,{setpoint:null})}catch(o){t.clearing=!1,t.error=no(o),bt();return}const n=Vt.get(e);n&&qt(`${n.name} follows its schedule again.`),Wn()}async function Wn(){try{cs(await Ce.state())}catch{}}function vh(e){return e.until==="cleared"?"Held until cleared":e.expires_in_min==null?"Held until the next change":e.until==="duration"?`Held for ${Ao(e.expires_in_min)}`:we?`Held until ${Yo((we.minute_of_day+e.expires_in_min)%1440)}`:"Held until the next change"}const Un=new Set(["passive","unheated"]);function Ci(e){const t=mt?.rooms?.find(n=>n.id===e.id);return t?t.controllable:!Un.has(e.role)}function kh(e){const t=Gt(e.id);t.pending!=null&&!t.timer&&e.override?.setpoint===t.pending&&(t.pending=null,clearTimeout(t.expiry)),t.clearing&&!e.override&&(t.clearing=!1)}function $h(e){let t=e.reason||"";if(Qo(e)&&(t="Waiting to share a burn with other rooms."),!e.calling&&e.topup&&e.extend===!0&&(t="Topped up now so it does not need a second burn soon."),!e.calling&&e.topup&&e.extend===!1&&(t="Opened so the burner's heat has somewhere to go."),!t&&e.role==="passive"&&(t="Manual valve, always open: counted as the system's open path."),!t&&e.role==="unheated"&&(t="No radiator here. Temperature recorded, not controlled."),!t&&e.heat_source==="continuous"&&(t="Range cooker heat is learned as a steady background."),!t&&e.next_setpoint!=null&&e.next_in_min!=null&&we){const n=(we.minute_of_day+e.next_in_min)%1440;t=`Next ${e.next_setpoint.toFixed(1)}° at ${Yo(n)}.`}return t}function xh(e){if(e.model){const t=e.learning?ki[e.learning]||e.learning:"learning";return t[0].toUpperCase()+t.slice(1)}return e.humidity!=null?`${e.humidity}% RH`:""}function Sh(e){return e.valve?.untrusted?e.valve.leaking?"Valve may not be closing: radiator warmed while shut.":e.valve.misses?`Valve may be stuck: radiator stayed cold for ${ft(e.valve.misses,"burn","burns")}.`:"Valve may be stuck: radiator not warming.":""}let Ge=null;const Xt=matchMedia("(min-width: 75rem)"),ea=matchMedia("(max-width: 40rem)"),xt=S("room-drawer");let Fa=null,va=null;const _h=S("toast"),Ch={success:{icon:"circle-check"},neutral:{icon:"circle-info"},warning:{icon:"triangle-exclamation"}};function qt(e,t="success"){try{_h.create(e,{variant:t,duration:5e3,icon:Ch[t]?.icon})}catch{}}function to(e,t=null){if(Ge=Ge===e?null:e,tn.select(Ge),bt(),!Ge){Xt.matches&&va?.focus?.(),va=null;return}if(Xt.matches){va=t,requestAnimationFrame(()=>S("room-panel").querySelector("h2")?.focus({preventScroll:!0}));const o=S("room-panel"),a=o.getBoundingClientRect().top;(a<0||a>innerHeight-120)&&o.scrollIntoView({block:"nearest",behavior:Go.matches?"auto":"smooth"});return}Fa=t,xt.placement=ea.matches?"bottom":"end",xt.open=!0}function Ei(){Ge&&to(Ge)}xt.addEventListener("wa-after-hide",e=>{e.target===xt&&(Xt.matches||(Ge=null,tn.select(null),bt(),Fa?.focus?.(),Fa=null))});Xt.addEventListener("change",()=>{Xt.matches?xt.open=!1:Ge&&(xt.placement=ea.matches?"bottom":"end",xt.open=!0),bt()});ea.addEventListener("change",()=>bt());document.addEventListener("keydown",e=>{e.key==="Escape"&&Ge&&Xt.matches&&!e.defaultPrevented&&S("room-panel").contains(document.activeElement)&&Ei()});function rs(e){const t=new Map;for(const n of e.alert_details??[]){if(!n.room_id)continue;const o=e.rooms.find(s=>s.id===n.room_id);if(!o)continue;const a=n.message.startsWith(`${o.name}: `)?n.message.slice(o.name.length+2):n.message;t.has(o.id)||t.set(o.id,{room:o,texts:[]}),t.get(o.id).texts.push(a)}for(const n of e.rooms)n.temperature==null&&!t.has(n.id)&&t.set(n.id,{room:n,texts:["no reading"]});return[...t.values()]}function mr(e,t){const[n,o]=vi(e),a=Ci(e),s=a?Zo(e):null,r=Un.has(e.role),i=e.id===Ge,c=a&&(Gt(e.id).pending!=null||e.override?.setpoint!=null&&!Gt(e.id).clearing),l=t.get(e.id);return{r:e,label:n,kind:o,sp:s,observed:r,on:i,held:c,need:l}}function Eh(e){const t=new Map(rs(we).map(a=>[a.room.id,a.texts])),n=(a,s)=>to(s,a.currentTarget),o=a=>a.need?G`<wa-icon class="room-flag" name="triangle-exclamation" label="Needs attention: ${a.need.join(", ")}"></wa-icon>`:ke;return ea.matches?G`<ul class="room-list" aria-labelledby="rooms-h">${e.map(a=>{const s=mr(a,t);return G`<li>
        <button type="button" class="room-item" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
          <span class="room-item-top">
            <span class="room-name"><span class="swatch" style="--swatch:${nr(a.temperature)}" aria-hidden="true"></span><strong>${a.name}</strong>${o(s)}</span>
            ${Ro(s.label,s.kind)}
          </span>
          <span class="room-item-facts">
            <span><span class="fact-label">Now</span> <strong class="readout">${Lt(a.temperature)}</strong></span>
            ${s.sp!=null?G`<span><span class="fact-label">${s.held?"Held at":"Set to"}</span> <strong class="readout">${Lt(s.sp)}</strong></span>`:ke}
            ${!s.observed&&a.opening!=null?G`<span><span class="fact-label">Valve</span> <strong class="readout">${a.opening}%</strong></span>`:ke}
          </span>
        </button>
      </li>`})}</ul>`:G`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${e.map(a=>{const s=mr(a,t);return G`<tr class=${s.on?"selected":""} data-idle=${String(!(a.calling||a.topup))} @click=${r=>{r.target.closest("button")||to(a.id,r.currentTarget.querySelector("button"))}}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
            <span class="swatch" style="--swatch:${nr(a.temperature)}" aria-hidden="true"></span><span class="room-btn-name">${a.name}</span>${o(s)}</button></th>
          <td class="num readout">${Lt(a.temperature)}</td>
          <td class="num readout">${s.sp==null?G`<span class="wa-color-text-quiet">–</span>`:G`${s.held?G`<wa-icon class="held-icon" name="hand" label="Held"></wa-icon> `:ke}${Lt(s.sp)}`}</td>
          <td>${s.observed||a.opening==null?G`<span class="wa-color-text-quiet">–</span>`:G`
            <span class="valve"><wa-progress-bar value=${a.opening} label="${a.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${a.opening}%</span></span>`}</td>
          <td>${Ro(s.label,s.kind)}</td>
        </tr>`})}</tbody>
    </table>
  </wa-scroller>`}function gr(e,t,n){const o=Zo(t);if(bh(t.id,(o??20)+n),!(e.detail>0)||Go.matches)return;e.currentTarget.parentElement.querySelector(".step-value")?.animate([{transform:`translateY(${n>0?6:-6}px)`,opacity:.4},{transform:"translateY(0)",opacity:1}],{duration:180,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}function Ah(e,t,n){return G`<div class="stepper" role="group" aria-label="${e.name} setpoint">
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t<=Si} @click=${o=>gr(o,e,-.5)}>
      <wa-icon name="minus" label="Lower ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
    <output class="step-value readout" aria-live="polite" aria-atomic="true">${Lt(t)}</output>
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t>=_i} @click=${o=>gr(o,e,.5)}>
      <wa-icon name="plus" label="Raise ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
  </div>`}function br(e,{inDrawer:t}){const[n,o]=vi(e),a=Ci(e),s=Gt(e.id),r=jn("household"),i=!!r,c=a?Zo(e):null,l=a&&s.pending==null&&!s.clearing&&e.override?.setpoint!=null,d=a&&s.pending!=null,u=Un.has(e.role),g=!(e.calling||e.topup),p=e.heat_source==="episodic",f=$i(e.id),x=(we?.learning_notes??[]).filter(te=>te.room_id===e.id),h=e.model?eh(e,{outdoor:we?.outdoor,minute_of_day:we?.minute_of_day,notes:x}):[],w=e.model?Zu(e.model):!1,b=Sh(e),k=$h(e),R=rs(we).find(te=>te.room.id===e.id)?.texts.filter(te=>te!=="no reading")??[],E=[];e.humidity!=null&&E.push(["Humidity",`${Math.round(e.humidity)}%`]),!a&&e.setpoint!=null&&!u&&E.push(["Setpoint",Lt(e.setpoint)]);const P=xh(e);if(e.model){const te=e.learning?ki[e.learning]||e.learning:"learning now";E.push(["Learning",(te[0].toUpperCase()+te.slice(1)).replace(/^Learning paused: /,"Paused: ")])}const Z=s.error?"":l?vh(e.override):d?"Sending…":"From the schedule",Q=a?G`
    <div class="setpoint" data-held=${String(l||d)}>
      <div class="setpoint-row">
        <div class="wa-stack wa-gap-3xs">
          <span class="setpoint-label">Setpoint</span>
          <span class="setpoint-hint" aria-live="polite">${s.error?G`<span class="error-line" role="alert">${s.error}</span>`:Z}</span>
        </div>
        ${Ah(e,c,i)}
      </div>
      <div class="wa-cluster wa-gap-xs">
        ${l&&!i?G`<wa-button size="s" appearance="outlined" @click=${()=>yh(e.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>`:ke}
        ${r?G`<wa-tag size="s" class="lock-tag">${r}</wa-tag>`:ke}
      </div>
    </div>`:ke;return G`
    <div class="room-detail" data-room=${e.id}>
      <div class="room-detail-head">
        <div class="wa-stack wa-gap-2xs">
          ${t?ke:G`<h2 class="wa-heading-l" id="room-panel-h" tabindex="-1">${e.name}</h2>`}
          <div class="wa-cluster wa-gap-xs">
            ${Ro(n,o)}
            ${l?G`<wa-tag size="s" class="radiate-cool">Held</wa-tag>`:ke}
          </div>
        </div>
        ${t?ke:G`<wa-button appearance="plain" size="s" class="panel-close" @click=${Ei}><wa-icon name="xmark" label="Close ${e.name}"></wa-icon></wa-button>`}
      </div>

      ${t?Q:ke}
      ${k?G`<p class="reason">${k}</p>`:ke}

      <div class="readouts">
        <div class="readout-block"><span class="readout-label">Now</span><span class="readout readout-xl">${Lt(e.temperature)}</span></div>
        ${e.target!=null&&!u?G`<div class="readout-block"><span class="readout-label">Target</span><span class="readout readout-l">${Lt(e.target)}</span></div>`:ke}
        ${!u&&e.opening!=null?G`<div class="readout-block"><span class="readout-label">Opening limit</span><span class="readout readout-l">${e.opening}%</span></div>`:ke}
      </div>
      ${!u&&e.opening!=null?G`<wa-progress-bar class="opening" data-idle=${String(g)} value=${e.opening} label="${e.name} opening limit, ${e.opening}%"></wa-progress-bar>`:ke}

      ${R.length?G`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${R.map(te=>te[0].toUpperCase()+te.slice(1)).join(". ")}.</wa-callout>`:ke}
      ${b?G`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${b}</wa-callout>`:ke}

      ${t?ke:Q}

      ${p?G`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${!!f.shown(xi(e))} ?disabled=${i} aria-busy=${String(f.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${()=>fh(e)}>Fire lit</wa-switch>
          <p class="action-error fire-error" role="alert" ?hidden=${!f.error}>${f.error}</p>
        </div>`:ke}

      ${E.length?G`<dl class="facts">${E.map(([te,T])=>G`<div><dt>${te}</dt><dd>${T}</dd></div>`)}</dl>`:ke}
      ${!e.model&&P?G`<p class="wa-caption-m wa-color-text-quiet">${P}</p>`:ke}

      ${e.model?G`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${w?G`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>`:ke}</span>
          <div class="wa-stack wa-gap-s">
            ${w?G`<p class="learned-status">${e.model.samples===0?"Still learning. Nothing learned yet, so Radiate uses typical values for now.":"Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>`:ke}
            <dl class="learned-rows">${h.map(te=>G`<div><dt>${te.label}</dt><dd>${te.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${th(e.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>`:ke}
    </div>`}let wr=!1;function Th(){we&&(wr||(S("rooms").textContent="",wr=!0),Mt(Eh(we.rooms),S("rooms")))}function is(){const e=Ge?Vt.get(Ge):null,t=S("room-panel"),n=S("hm-status"),o=!!(e&&Xt.matches);if(t.hidden===o){t.hidden=!o,n.hidden=o;const a=o?t:n;Go.matches||a.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:200,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}if(Mt(o?br(e,{inDrawer:!1}):ke,t),Xt.matches){Mt(ke,xt);return}xt.label=e?.name??"Room",Mt(e?br(e,{inDrawer:!0}):ke,xt)}const Ai={ok:{icon:"circle-check",tone:"success"},heat:{icon:"fire-flame-curved",tone:"brand"},attention:{icon:"triangle-exclamation",tone:"warning"},frost:{icon:"snowflake",tone:"cool"},off:{icon:"power-off",tone:"neutral"},quiet:{icon:"moon",tone:"cool"},stale:{icon:"plug-circle-xmark",tone:"warning"},wait:{icon:"hourglass-half",tone:"neutral"}};function Rh(e){const t=e.rooms.filter(s=>!Un.has(s.role)),n=t.filter(s=>s.calling).length,o=e.telemetry??{};if(ls(e))return["attention","The boiler relay can't be reached"];if((e.alert_details??[]).some(s=>s.code?.startsWith("safe_mode")))return["attention","Safe mode: the boiler is stopping"];if(e.mode==="off")return["off","Heating is off"];if(e.mode==="frost")return["frost","Frost protection only"];if(!o.simulated&&o.boiler_linked===!1)return n?["wait",`${ft(n,"room wants","rooms want")} heat`]:["ok","Rooms are comfortable"];if(e.boiler.state==="firing")return["heat",n?`Heating ${ft(n,"room","rooms")}`:"Burner on"];if(e.boiler.state==="lead")return["heat","Opening valves"];if(e.quiet?.active)return["quiet",`Quiet hours until ${e.quiet.until}`];if(e.boiler.state==="rest")return["ok","Burner resting"];const a=t.filter(Qo).length;return a?["wait",`${ft(a,"room is","rooms are")} waiting for a burn`]:["ok","Rooms are comfortable"]}function Lh(e){let t=null;for(const n of e.rooms)Un.has(n.role)||n.next_in_min==null||n.next_setpoint==null||(!t||n.next_in_min<t.next_in_min)&&(t=n);return t?Yo((e.minute_of_day+t.next_in_min)%1440):null}function Ti(e,t){const[n,o]=document.body.dataset.link==="stale"?["stale","Showing old data"]:Rh(e),a=Ai[n],s=S("hero");if(s.dataset.tone!==a.tone){const g=s.dataset.tone;s.dataset.tone=a.tone,g&&!Go.matches&&s.querySelector(".hero-icon").animate([{transform:"scale(0.85)",opacity:.4},{transform:"scale(1)",opacity:1}],{duration:240,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}S("hero-icon").name=a.icon,S("hero-title").textContent=o,S("hero-why").textContent=t;const r=[];e.outdoor!=null&&r.push(["temperature-half",`Outside ${e.outdoor.toFixed(1)}°`]),r.push(["faucet-drip",e.store?.boost?"Hot water boosted":e.store?.relay?"Hot water on":"Hot water off"]);const i=Lh(e);i&&r.push(["clock",`Next change ${i}`]),Mt(G`${r.map(([g,p])=>G`<li><wa-icon name=${g}></wa-icon>${p}</li>`)}`,S("hero-facts"));const c=rs(e),l=new Map;for(const g of c)for(const p of g.texts)l.set(p,(l.get(p)??0)+1);const d=new Set([...l].filter(([,g])=>g>=3).map(([g])=>g)),u=[];for(const g of d)u.push(G`<li><a class="need-chip" href="#devices"><strong>${g[0].toUpperCase()+g.slice(1)}</strong><span>${ft(l.get(g),"room","rooms")}</span></a></li>`);for(const g of c){const p=g.texts.filter(f=>!d.has(f));p.length&&u.push(G`<li><button type="button" class="need-chip" @click=${f=>to(g.room.id,f.currentTarget)}>
      <strong>${g.room.name}</strong><span>${p.join(", ")}</span></button></li>`)}S("hero-needs").hidden=!u.length,Mt(G`${u}`,S("hero-needs-list"))}function bt(){Th(),is()}const yr=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],Mh=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],mo=e=>Date.UTC(+e.slice(0,4),+e.slice(5,7)-1,+e.slice(8,10))/864e5;function Ri(e,t){const n=t?mo(e)-mo(t):null,o=new Date(mo(e)*864e5).getUTCDay();return n===0?"today":n===1?"tomorrow":n===-1?"yesterday":n!==null&&n>1&&n<7?yr[o]:`${yr[o].slice(0,3)} ${+e.slice(8,10)} ${Mh[+e.slice(5,7)-1]}`}function Lo(e,t){const n=e.slice(11,16),o=Ri(e.slice(0,10),t);return n==="00:00"?o:o==="today"?n:`${o} ${n}`}function vr(e,t){return e.slice(0,10)===t?e.slice(11,16):Lo(e,t)}function Oh(e,t){const n=e.slice(11,16),o=Ri(e.slice(0,10),t),a=o==="tomorrow"||o==="yesterday"?o:`on ${o}`;return o==="today"?`at ${n}`:n==="00:00"?a:`${a} at ${n}`}function Nh(e,t){const n=t.today;if(e.away&&e.reason==="away_until")return[`Away until ${Lo(e.until,n)}.`,"Away","away"];if(e.away)return[`Away since ${vr(e.presence.since,n)}, from Home Assistant.`,"Away","away"];if(e.until){const o=Lo(e.until,n);return[`Due back ${/^\d/.test(o)?"at ":""}${o}. Warming up their rooms.`,"Due back","back"]}if(e.presence?.uncertain&&e.presence.why){const o=e.presence.uncertain==="evidence_old"?"No update":"Home";return[e.presence.why,o,e.presence.uncertain==="evidence_old"?"stale":""]}if(e.presence?.stale){const o=mt?.household?.away?.presence_stale_after_min;return[`Home Assistant hasn't reported${o?` for over ${Ao(o)}`:" lately"}, so Radiate treats them as home.`,"No update","stale"]}if(e.presence?.state==="not_home"){const o=t.presence_delay_min,a=o!=null?` Counts as away after ${Ao(o)}.`:"";return[`Out since ${vr(e.presence.since,n)}.${a}`,"Out",""]}return["Home.","Home",""]}const ka=new Map;function vn(e){return ka.has(e)||ka.set(e,{form:!1,clearing:!1,clearError:"",saving:!1,saveError:""}),ka.get(e)}const Li=e=>S("people-list").querySelector(`[data-person="${CSS.escape(e)}"]`);function zh(e){vn(e.id).form=!0,vn(e.id).saveError="",Qt(we?.away);const n=Li(e.id)?.querySelector("wa-input[name=date]"),o=we?.away?.today;n&&o&&(n.min=o,n.value||(n.value=new Date((mo(o)+1)*864e5).toISOString().slice(0,10))),requestAnimationFrame(()=>n?.focus())}function ja(e){vn(e.id).form=!1,vn(e.id).saveError="",Qt(we?.away),requestAnimationFrame(()=>Li(e.id)?.querySelector(".away-open")?.focus())}async function Ph(e,t){e.preventDefault();const n=e.currentTarget,o=n.querySelector("wa-input[name=date]").value,a=n.querySelector("wa-input[name=time]").value;if(!o)return;const s=a?`${o}T${a}`:o,r=vn(t.id);r.saving=!0,r.saveError="",Qt(we?.away);try{await Pn(`people/${t.id}/away`,{until:s})}catch(i){r.saving=!1;const c=String(i?.message??"");r.saveError=c.includes("in the future")?"Not saved: pick a time that has not passed.":c.includes("within")?"Not saved: pick a date in the next 60 days.":no(i),Qt(we?.away);return}r.saving=!1;for(const i of n.querySelectorAll("wa-input"))i.value="";qt(`${t.name} is away until ${Lo(s.length>10?s:`${s}T00:00`,we?.away?.today)}.`),ja(t),Wn()}async function Dh(e){const t=vn(e.id);t.clearing=!0,t.clearError="",Qt(we?.away);try{await Pn(`people/${e.id}/home`,{})}catch(n){try{if(!/HTTP 404/.test(String(n?.message)))throw n;await Pn(`people/${e.id}/away`,{until:null})}catch(o){t.clearError=no(o)}}t.clearError||qt(`${e.name} is home.`),t.clearing=!1,Qt(we?.away),await Wn()}function qh(e,t){const n=vn(e.id),o=jn("household");o&&(n.form=!1);const[a,s,r]=Nh(e,t);return G`
    <wa-card class="person" data-person=${e.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${e.name}</h3>
        ${Ro(s,r)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${a}</p>
        ${n.form?G`
          <form class="away-form wa-stack wa-gap-s" @submit=${i=>Ph(i,e)} @keydown=${i=>{i.key==="Escape"&&ja(e)}}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${n.saving} ?disabled=${n.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${()=>ja(e)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!n.saveError}>${n.saveError}</p>
          </form>`:G`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${!!o}
              aria-label=${e.until?`Change when ${e.name} is back`:`Set ${e.name} away`}
              @click=${()=>zh(e)}>${e.until?"Change":"Set away"}</wa-button>
            ${!o&&(e.until||e.away)?G`<wa-button size="s" appearance="plain" aria-label="${e.name} is back now"
              ?loading=${n.clearing} ?disabled=${n.clearing} @click=${()=>Dh(e)}>Back now</wa-button>`:ke}
            ${o?G`<wa-tag size="s" class="lock-tag">${o}</wa-tag>`:ke}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!n.clearError}>${n.clearError}</p>
      </div>
    </wa-card>`}function Qt(e){const t=e?.people??[];S("people").hidden=!t.length,S("away-note").hidden=!e?.frost;const n=e?.return,o=S("return-note");if(o.hidden=!n,n){const a=t.filter(i=>i.until&&i.until.slice(0,16)===n.at.slice(0,16)),s=a.length?a:t.filter(i=>i.until),r=s.length?`${cn(s.map(i=>i.name))}'s return`:"a return";o.textContent=`Warming up for ${r} ${Oh(n.at,e.today)}.`}Mt(G`${t.map(a=>qh(a,e))}`,S("people-list")),document.body.dataset.view==="schedules"&&Ui.show()}const Mi=600*1e3,tn=Eu({modelEl:S("hm-model"),statusEl:S("hm-status"),planEl:S("hm-plan"),transport:Ce,arrangeLock:()=>jn("admin"),onSelect:(e,t)=>to(e,t),onWeek:()=>{location.hash="#schedules"}});new MutationObserver(()=>tn.redraw()).observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.fonts?.ready&&document.fonts.ready.then(()=>tn.redraw());const Mo=oi({list:S("week-list"),legendEl:S("week-legend"),frostEl:S("week-frost"),hintEl:S("week-hint")}),ze={key:null,minute:null,at:0,loading:!1,again:!1,gone:!1,shown:!1};let kr=!1;async function $a(e,t,n){try{return await Ce.call(e,t,n)}catch(o){throw o instanceof Ue&&rt(),o}}const Ih={async household(){const e=await $a("GET","household");if(e.status!==200)throw new Error(`household: HTTP ${e.status}`);return e.body},async preview(e){const t=await $a("POST","household/preview",{household:e});if(t.status!==200)throw new Error(`household/preview: HTTP ${t.status}`);return t.body},save:e=>$a("PUT","household",{household:e}),async saved(e){const t=S("week-saved");t.textContent=e,clearTimeout(t.timer),t.timer=setTimeout(()=>{t.textContent=""},15e3),ze.key=null,await ta();try{mt=await Ce.house()}catch{}na()},time:dn};async function ta(){if(!(ze.gone||!Ce.get)){if(ze.loading){ze.again=!0;return}ze.loading=!0,ze.again=!1,ze.at=Date.now();try{const e=await Ce.get("schedules");S("week").hidden=!e.rooms.length,Mo.update(e),tn.week(e),ze.shown=!0,we&&Mo.tick(we.minute_of_day)}catch(e){/HTTP 404|not found/.test(String(e?.message))?ze.gone=!0:e instanceof Ue?rt():ze.at=Date.now()-Mi+3e4}ze.loading=!1,ze.again&&await ta()}}function Bh(e){const t=JSON.stringify([e.away?.everyone,(e.away?.people??[]).map(o=>[o.id,o.away])]),n=ze.minute!=null&&e.minute_of_day<ze.minute;ze.minute=e.minute_of_day,t!==ze.key||n||Date.now()-ze.at>Mi?(ze.key=t,ta()):ze.shown&&Mo.tick(e.minute_of_day)}function $r(e,t,n){e.textContent="";for(const[o,a]of t){const s=Math.max(0,(o+n)/n)*100,r=Math.max(0,(a+n)/n)*100;if(r<=0)continue;const i=document.createElement("i");i.style.left=`${s}%`,i.style.width=`${Math.max(.3,r-s)}%`,e.appendChild(i)}}function ls(e){return!e.telemetry?.simulated&&(e.alert_details??[]).some(t=>t.code==="driver.shelly")}const Hh={idle:["Idle","neutral"],lead:["Opening valves","warning"],firing:["Firing","brand"],rest:["Resting","cool"]};function cs(e){we=e,document.body.dataset.link==="stale"&&qt("Connected to Radiate again."),delete document.body.dataset.link;const t=e.boiler,n=t.state==="firing",o=mt?.boiler.min_burn_s??480,a=t.min_off_s??mt?.boiler.min_off_s??600,s=Fh(e,o);S("status").textContent=s,S("outdoor").textContent=e.outdoor!=null?`Outside ${e.outdoor.toFixed(1)}°`:"",zi(e.mode),Oi(e.settings);const r=S("boiler-chip"),i=ls(e),[c,l]=i?["Not reachable","warning"]:Hh[t.state]??["–","neutral"];r.textContent=c,r.dataset.state=i?"lost":t.state,r.classList.toggle("radiate-cool",l==="cool"),l==="cool"?r.removeAttribute("variant"):r.variant=l;let d=0;n&&(d=Math.min(1,t.burn_elapsed_s/o)),t.state==="rest"&&(d=Math.min(1,t.state_elapsed_s/a));const u=S("guard");u.value=Math.round(d*100),u.dataset.kind=t.state,u.label=n?"Minimum burn":t.state==="rest"?"Minimum off":"Minimum burn or rest",S("guard-row").hidden=!(n||t.state==="rest"),S("boiler-detail").textContent=n?t.burn_elapsed_s<o?`Minimum burn: ${Eo(o-t.burn_elapsed_s)} to go`:"Minimum burn met":t.state==="rest"?`${Eo(Math.max(0,a-t.state_elapsed_s))} until it may start again`:"",Pi(e.store.boost),$r(document.querySelector(".lane.burns"),e.timeline.burns,e.timeline.window_s),$r(document.querySelector(".lane.store"),e.timeline.store,e.timeline.window_s),S("s-starts").textContent=`${t.starts_last_hour}`,S("s-pred").textContent=t.predicted_burn_min?`${t.predicted_burn_min} min`:"–",jh(e),i&&(S("s-today-sub").textContent="Not counted while the relay can't be reached"),S("s-supply").textContent=t.supply!=null?t.supply.toFixed(2):"–",Wh(t);const g=S("banner");e.telemetry?.simulated&&(g.hidden=!1,S("banner-text").textContent=`Demo: simulated reference house, ${Yo(e.minute_of_day)} simulated time. Boiler water ${e.telemetry.boiler_water_c}°, store ${e.telemetry.store_c}°, stairs ${e.telemetry.stairs_c}°.`),Vh(e.telemetry),Uh(e.learning_notes),Qt(e.away),Vt.clear();for(const p of e.rooms)Vt.set(p.id,p),kh(p);Ge&&!Vt.has(Ge)&&(Ge=null),bt(),Ti(e,s),Jh(e.alert_details?e.alert_details.filter(p=>!p.room_id||!e.rooms.some(f=>f.id===p.room_id)).map(p=>p.message):e.alerts),Bi(e.alert_details),tn.update(e),Bh(e),qa=new Date,mt||Xh()}function Fh(e,t){const n=e.boiler,o=e.rooms.filter(u=>!Un.has(u.role)),a=o.filter(u=>u.calling).map(u=>u.name),s=o.filter(u=>!u.calling&&u.topup&&u.extend===!0).map(u=>u.name),r=o.filter(u=>!u.calling&&u.topup&&u.extend!==!0).map(u=>u.name),i=o.filter(Qo).map(u=>u.name),c=e.store?.relay?" Hot water on.":"";if(e.telemetry&&!e.telemetry.simulated&&e.telemetry.boiler_linked===!1)return a.length?`${cn(a)} ${a.length===1?"wants":"want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:"No room needs heat. The boiler switch isn't linked yet.";if(ls(e))return"Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";const l=`Burner on for ${Eo(n.burn_elapsed_s)}`,d=u=>`topping up ${cn(u)} to save a second burn soon`;switch(n.state){case"idle":if(i.length){const u=i.length===1?"is":"are";return`Boiler idle. ${cn(i)} ${u} waiting to share a burn with other rooms.${c}`}return e.quiet?.active?`Quiet hours until ${e.quiet.until}. Heating only to keep rooms above 12°.${c}`:c?`Heating idle.${c}`:"Boiler idle. Rooms are within comfort.";case"lead":return`Opening valves before calling the burner.${a.length?` Heating ${cn(a)}.`:""}${c}`;case"rest":return`Burner resting: minimum off time, ${Eo(n.state_elapsed_s)} so far.${c}`;case"firing":if(a.length){const u=s.length?` Also ${d(s)}.`:"";return`${l}. Heating ${cn(a)}.${u}${c}`}if(s.length)return`${l}, ${d(s)}.${c}`;if(n.burn_elapsed_s<t){const u=r.length?`, with the heat going to ${cn(r)}`:"";return`${l} to finish its minimum burn${u}.${c}`}return`${l}. Stopping now that rooms are warm.${c}`;default:return""}}function jh(e){const t=e.accounting?.today,n=e.accounting?.yesterday,o=S("s-today-label");if(t){o.textContent="Burner today",S("s-today").textContent=t.burner_hours!=null?`${t.burner_hours.toFixed(1)} h`:"–";const r=[];t.starts!=null&&r.push(ft(t.starts,"start","starts")),t.litres!=null&&r.push(`${t.litres.toFixed(1)} L`),t.kwh!=null&&r.push(`${Math.round(t.kwh)} kWh`),S("s-today-sub").textContent=r.join(", ")}else{o.textContent="Burner hours";const r=e.telemetry?.burner_hours;S("s-today").textContent=r!=null?r.toFixed(1):"–",S("s-today-sub").textContent=""}const a=n?.balance;S("s-balance").textContent=a?.score!=null?`${Math.round(a.score)}/100`:"–";let s="No full day yet";n&&(s=a?.score!=null?"":"No burns with two or more rooms"),a?.arrival_spread_min!=null&&(s=`Last room ${Math.round(a.arrival_spread_min)} min after the first`),n?.partial&&(s="Not a full day of data"),S("s-balance-sub").textContent=s}function Wh(e){const t=e.short_cycle,n=S("short-cycle");if(n.hidden=!t,!t)return;const o=e.min_off_s!=null?`${Math.round(e.min_off_s/60)} min`:null,a=o?`Minimum off raised to ${o}`:`Minimum off raised by ${t.extra_off_min} min`,s=t.ends_in_h!=null?` for the next ${Ao(Math.max(1,Math.round(t.ends_in_h*60)))}`:"";S("short-cycle-text").textContent=`${a}${s}, so the burner starts less often.`}const xr={eco:"fewer, longer burns. Rooms might warm a bit later.",comfort:"every room held at its target, with more burns."},An=Jo();function Oi(e){const t=S("demand"),n=S("demand-note"),o=e&&xr[e.demand_mode];if(t.hidden=!o,!o)return;const a=An.shown(e.demand_mode);t.value!==a&&(t.value=a),t.setAttribute("aria-busy",String(An.busy));const s=xr[a];n.dataset.error=String(!!An.error),n.textContent=An.error||(a===e.demand_mode_default?`Default: ${s}`:s[0].toUpperCase()+s.slice(1))}S("demand").addEventListener("change",e=>{const t=we?.settings,n=e.target.value;!t||n===An.shown(t.demand_mode)||Xo(An,n,"settings",{demand_mode:n===t.demand_mode_default?null:n},()=>{we?.settings&&Oi(we.settings)}).then(o=>o&&qt(n==="eco"?"Eco: fewer, longer burns.":"Comfort: every room held at its target."))});let Sr="";function Uh(e=[]){const t=JSON.stringify(e);if(t===Sr)return;Sr=t;const n=S("learning-notes");if(n.hidden=!e.length,n.hidden)return;const o=new Set(e.filter(a=>a.room_id).map(a=>a.room_id)).size;S("learning-notes-lead").textContent=o?`${ft(o,"room's learning was","rooms' learning was")} reset recently. Those rooms learn again from their next burns.`:"Radiate changed what it had learned when it last started.",Mt(G`${[...e].reverse().map(a=>G`<li><span class="payload">${new Date(a.at*1e3).toLocaleString(void 0,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span> <span>${a.message}</span></li>`)}`,n.querySelector("ul"))}let _r="";function Vh(e){const t=S("dryrun");if(t.hidden=!e?.dry_run,t.hidden)return;const n=e.intended_writes??0,o=e.shelly_intended,a=o!=null?`${ft(n,"valve write","valve writes")} and ${ft(o,"boiler command","boiler commands")}`:ft(n,"valve write","valve writes");S("dryrun-count").textContent=n||o?`Held back so far: ${a}.`:"Nothing held back yet.";const s=e.recent_intended??[],r=JSON.stringify(s);if(r===_r)return;_r=r;const i=S("dryrun-recent");i.hidden=!s.length,Mt(G`${[...s].reverse().map(c=>G`<li><code>${c.topic}</code> <code class="payload">${typeof c.payload=="string"?c.payload:JSON.stringify(c.payload)}</code></li>`)}`,i.querySelector("ul"))}const Cr=2;let Er="";function Kh(e){const t=new Map;for(const n of e){const o=n.indexOf(": "),a=o>0?n.slice(o+2):n,s=t.get(a)??{problem:a,first:n,rooms:[]};o>0&&s.rooms.push(n.slice(0,o)),t.set(a,s)}return[...t.values()].map(n=>n.rooms.length<2?n.first:`${n.problem[0].toUpperCase()+n.problem.slice(1)} (${ft(n.rooms.length,"room","rooms")}): ${n.rooms.join(", ")}`)}function Jh(e){const t=JSON.stringify(e);if(t===Er)return;Er=t;const n=S("alerts");n.hidden=!e.length;const o=Kh(e),a=S("alerts-list");a.textContent="",o.forEach((i,c)=>{const l=document.createElement("li");l.textContent=i,l.dataset.extra=String(c>=Cr),a.appendChild(l)});const s=S("alerts-more"),r=o.length-Cr;s.hidden=r<=0,s.dataset.extra=String(Math.max(0,r)),Ni(s.getAttribute("aria-expanded")==="true")}function Ni(e){const t=S("alerts-more");t.setAttribute("aria-expanded",String(e)),t.textContent=e?"Show fewer":`Show ${t.dataset.extra} more`,S("alerts-list").dataset.expanded=String(e)}S("alerts-more").addEventListener("click",()=>{Ni(S("alerts-more").getAttribute("aria-expanded")!=="true")});const Jn=Jo();function zi(e){const t=S("mode"),n=Jn.shown(e);t.value!==n&&(t.value=n),t.setAttribute("aria-busy",String(Jn.busy)),yi(S("mode-error"),Jn.error)}S("mode").addEventListener("change",e=>{const t=e.target.value;!we||t===Jn.shown(we.mode)||Xo(Jn,t,"mode",{mode:t},()=>we&&zi(we.mode)).then(n=>n&&qt({auto:"Heating: Auto. Rooms follow their schedules.",frost:"Heating: Frost protection only.",off:"Heating off. Rooms are still kept above frost."}[t]))});const Yn=Jo();function Pi(e){const t=S("boost"),n=!!Yn.shown(e);t.checked!==n&&(t.checked=n),t.setAttribute("aria-busy",String(Yn.busy)),yi(S("boost-error"),Yn.error)}S("boost").addEventListener("change",()=>{if(!we)return;const e=!Yn.shown(we.store.boost);Xo(Yn,e,"store/boost",{minutes:e?60:0},()=>we&&Pi(we.store.boost)).then(t=>t&&qt(e?"Hot water on for 60 minutes.":"Hot water boost stopped."))});function Yh(){if(!we){S("status").textContent="Cannot reach Radiate. Retrying…",S("hero-title").textContent="Cannot reach Radiate",S("hero-why").textContent="Retrying…",S("hero").dataset.tone="warning",S("hero-icon").name=Ai.stale.icon;return}document.body.dataset.link="stale";const e=`${String(qa.getHours()).padStart(2,"0")}:${String(qa.getMinutes()).padStart(2,"0")}`;S("status").textContent=`Cannot reach Radiate. Retrying… Showing data from ${e}.`,Ti(we,S("status").textContent)}async function Di(){try{return cs(await Ce.state()),!0}catch(e){return e instanceof Ue?rt():Yh(),!1}}function Gh(e){e==="lost"?Di():e==="auth"&&rt()}let xa=!1;async function Xh(){if(!xa){xa=!0;try{mt=await Ce.house(),na()}catch{}xa=!1}}let Gn=null,Kn=null;const qi=ud({transport:Ce,onOpen(){for(const e of document.querySelectorAll("main > .view, main > section[aria-labelledby]"))e.id!=="setup"&&(e.hidden=!0);document.body.dataset.setup="open",window.scrollTo(0,0)},onClose(){delete document.body.dataset.setup,kn(!1),Kn&&!Kn.closest("[hidden]")&&Kn.focus(),Kn=null},async onSaved(e){delete document.body.dataset.setup,kn(!1);const t=S("setup-saved");t.textContent=e,t.hidden=!1,t.focus(),clearTimeout(t.timer),t.timer=setTimeout(()=>{t.hidden=!0},15e3),ze.key=null;try{mt=await Ce.house()}catch{}na(),Wn(),ds.refresh()}});async function na(){Gn??=qi.available();const e=await Gn;e===null&&(Gn=null);const t=!!mt?.household;S("setup-cta").hidden=!e||t,S("setup-change-row").hidden=!e||!t,eo([S("setup-start")],S("setup-start-lock"),"admin"),eo([S("setup-change")],S("setup-change-lock"),"admin");const n=S("week-lock");n.hidden=!e||Ha("household"),n.textContent=jn("household"),e&&!kr&&Ha("household")&&(kr=!0,Mo.setEditor(Ih),ze.key=null,ta())}async function oa(e){Kn=e.currentTarget;try{await qi.open()}catch(t){if(t instanceof Ue){rt();return}const n=S("setup-saved");n.textContent="Couldn't open the household setup. Try again in a moment.",n.hidden=!1}}S("setup-start").addEventListener("click",oa);S("setup-change").addEventListener("click",oa);const Ii=$d({transport:Ce,scanLock:()=>jn("admin"),isAuthError:e=>e instanceof Ue,onAuth:()=>rt()});let Oo=null;const Qh=/^(device\.|driver\.trv_offline$|driver\.shelly$)/;function Bi(e){const t=(e??[]).filter(a=>Qh.test(a.code)).length;tn.devices(t);const n=S("devices-count");n.hidden=!t,n.textContent=String(t);const o=document.querySelector('.view-tab[data-view="devices"]');t?o.setAttribute("aria-label",`Devices, ${t} ${t===1?"needs":"need"} attention`):o.removeAttribute("aria-label"),S("alerts-devices").hidden=!t||Oo!==!0}const Hi=Od({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onCount:Zh});let Wa=null;function Zh(e){const t=S("suggestions-count");t.hidden=!e,t.textContent=String(e);const n=document.querySelector('.view-tab[data-view="suggestions"]');e?n.setAttribute("aria-label",`Suggestions, ${e} to act on`):n.removeAttribute("aria-label")}let Fi=null;const ds=tu({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onView:e=>{const t=Yd(e);S("savings-line").hidden=!t,S("savings-line-link").textContent!==t&&(S("savings-line-link").textContent=t),Fi=e.status==="unavailable"?e.why:null,ep()}});let Ua=null;async function ep(){const e=Fi==="no household"&&Gn?await Gn:!1;S("savings-setup-row").hidden=!e,eo([S("savings-setup")],S("savings-setup-lock"),"admin")}S("savings-setup").addEventListener("click",e=>{history.replaceState(null,"","#"),kn(!1),oa(e)});const ji=$u({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt()});let Va=null;const No=lh({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt()}),Wi=Ru({root:S("guide")});Lu({note:S("guide-note"),tab:document.querySelector('.view-tab[data-view="guide"]')});const zo=Wu({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onOpenSetup:e=>{history.replaceState(null,"","#"),kn(!1),oa(e)},onShowSchedules:()=>{location.hash="#schedules"},moreSections:()=>No.offered?[{id:"security-log",title:"Security log"}]:[]}),tp={show(){zo.show(),No.show()},hide(){zo.hide(),No.hide()}};let Ka=null;const Ui={show(){const e=S("week").hidden&&S("people").hidden&&S("setup-cta").hidden;S("schedules-empty").hidden=!e},hide(){}},Ja={schedules:{offered:()=>!0,module:Ui},devices:{offered:()=>Oo===!0,module:Ii},suggestions:{offered:()=>Wa===!0,module:Hi},savings:{offered:()=>Ua===!0,module:ds},settings:{offered:()=>Ka===!0,module:tp},data:{offered:()=>Va===!0,module:ji},guide:{offered:()=>!0,module:Wi}};function kn(e){if(document.body.dataset.setup==="open")return;const[t,n]=location.hash.slice(1).split("/"),o=Ja[t]?.offered()?t:"house";for(const a of document.querySelectorAll(".view-tab"))a.dataset.view===o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");S("house").hidden=o!=="house";for(const[a,s]of Object.entries(Ja))S(a).hidden=a!==o,a===o?s.module.show():s.module.hide();document.body.dataset.view=o,document.querySelector("wa-page").dataset.view=o,!(o==="guide"&&Wi.reveal(n))&&(o==="settings"&&zo.reveal(n)||(!e&&o!=="house"&&window.scrollTo(0,0),e&&(window.scrollTo(0,0),S(`${o}-h`)?.focus())))}window.addEventListener("hashchange",()=>kn(!0));document.addEventListener("click",e=>{const t=e.target.closest?.('a[href^="#"]');!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.hash===location.hash&&(t.hash.startsWith("#guide")||t.hash.startsWith("#settings/"))&&(e.preventDefault(),kn(!0))});function np(){for(const[e,t]of Object.entries(Ja))document.querySelector(`.view-tab[data-view="${e}"]`).hidden=!t.offered()}async function op(){const[e,t,n,o,a]=await Promise.all([Oo===!0?!0:Ii.available(),Wa===!0?!0:Hi.available(),Ua===!0?!0:ds.available(),Ka===!0?!0:zo.available(),Va===!0?!0:ji.available(),No.available()]);Oo=e,Wa=t,Ua=n,Ka=o,Va=a,np(),Bi(we?.alert_details),kn(!1)}let go=!1;const us=()=>new URL("login",document.baseURI).toString();async function ap(){if(document.documentElement.dataset.transport==="demo")return!0;try{const t=await fetch(fo("auth/config"));go=t.ok&&(await t.json()).login===!0}catch{go=!1}if(!go)return!0;let e;try{e=await Ce.get("auth/me")}catch(t){return t instanceof Ue?(window.location.assign(us()),!1):!0}return e.via==="session"&&sp(e),!0}const Ar={admin:"Admin: you can change anything here.",household:"Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",viewer:"Read only: you can see the house but not change it."};function sp(e){Ce.setCsrf(e.csrf);const t=e.method==="local"?"a password":"single sign-on";S("account-name").textContent=e.user,S("account-who").textContent=`Signed in as ${e.user} with ${t}.`,S("account-role").textContent=Ar[e.role]??Ar.viewer,To=e.role in Ba?e.role:"viewer",document.body.dataset.role=To,hh(),tn.redraw(),bt(),we&&Qt(we.away),S("account").hidden=!1}S("account").addEventListener("wa-select",async e=>{if(e.detail?.item?.value==="sign-out"){S("account-error").hidden=!0;try{await Ce.post("auth/logout",{})}catch(t){if(!(t instanceof Ue)){S("account-error").hidden=!1;return}}window.location.assign(us())}});async function Vi(){if(op(),!!await ap()){try{mt=await Ce.house(),na()}catch(e){if(e instanceof Ue){rt();return}}await Di(),document.body.dataset.auth!=="needed"&&Ce.subscribe(cs,Gh)}}function rt(){if(go){window.location.assign(us());return}if(document.body.dataset.auth==="needed")return;const e=Ce.hasToken();Ce.setToken(""),document.body.dataset.auth="needed",S("signin").hidden=!1,S("status").textContent="Sign in to see the house.";const t=S("signin-error");t.hidden=!e,t.textContent=e?"The saved token was not accepted. Enter it again.":"",requestAnimationFrame(()=>S("signin-token").focus())}S("signin-form").addEventListener("submit",async e=>{e.preventDefault();const t=S("signin-token"),n=S("signin-form").querySelector("wa-button[type=submit]"),o=S("signin-error"),a=String(t.value??"").trim();if(o.hidden=!0,!a)return;n.disabled=!0;const s=/^[\x21-\x7e]+$/.test(a);s&&Ce.setToken(a);try{if(!s)throw new Ue("token");mt=await Ce.house()}catch(r){n.disabled=!1,o.hidden=!1,r instanceof Ue?(Ce.setToken(""),o.textContent="That token was not accepted. Check it and try again."):o.textContent="Cannot reach Radiate. Try again in a moment.",t.select();return}n.disabled=!1,t.value="",S("signin").hidden=!0,delete document.body.dataset.auth,S("status").textContent="Connecting…",await Vi()});await Vi();
