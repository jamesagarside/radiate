import{i as Ke,e as Lr,a as Mr,A as ve,t as Or,E as Nr,_ as v,b as Ee,n as B,c as Ge,W as it,H as Hn,l as zr,o as kt,d as J,w as bt,L as Tt,f as $t,s as Bn,g as Za,h as Fn,r as en,j as Sn,v as es,M as Xi,D as xt}from"./app.js";const Qi="modulepreload",Zi=function(e,t){return new URL(e,t).href},gs={},el=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let r=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const i=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");a=r(n.map(d=>{if(d=Zi(d,o),d in gs)return;gs[d]=!0;const u=d.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(!!o)for(let y=i.length-1;y>=0;y--){const h=i[y];if(h.href===d&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${g}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":Qi,u||(f.as="script"),f.crossOrigin="",f.href=d,c&&f.setAttribute("nonce",c),document.head.appendChild(f),u)return new Promise((y,h)=>{f.addEventListener("load",y),f.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return a.then(r=>{for(const i of r||[])i.status==="rejected"&&s(i.reason);return t().catch(s)})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var tl=(e="768px")=>`
  @media screen and (width < ${e}) {
    [part~='navigation'] {
      display: none;
    }

    :host(:not([disable-navigation-toggle])) slot[name~='navigation-toggle'] {
      display: contents;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var nl=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ol=Ke`
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
 */function al(e){return(t,n)=>{const o=typeof t=="function"?t:t[n];Object.assign(o,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Ea=class extends Mr{constructor(t){if(super(t),this.it=ve,t.type!==Or.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===ve||t==null)return this._t=void 0,this.it=t;if(t===Nr)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}};Ea.directiveName="unsafeHTML",Ea.resultType=1;const sl=Lr(Ea);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function En(e,t,n){return e?t(e):n?.(e)}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function rl(e,t=document.documentElement){if(!Number.isNaN(Number(e)))return Number(e);if(!window.CSS||!CSS.registerProperty)return typeof e=="string"&&e.endsWith("px")?parseFloat(e):Number(e)||0;const n="--wa-length-resolver";if(!CSS.registerProperty.toString().includes(n))try{CSS.registerProperty({name:n,syntax:"<length>",inherits:!1,initialValue:"0px"})}catch{}const o=t.style.getPropertyValue(n);t.style.setProperty(n,e);const a=getComputedStyle(t)?.getPropertyValue(n);return t.style.setProperty(n,o),a?.endsWith("px")?parseFloat(a):Number(a)||0}function il(e){return Number.isNaN(Number(e))?e:`${e}px`}var Ue=class extends it{constructor(){super(),this.hasSlotController=new Hn(this,"navigation-footer","mobile-navigation-footer"),this.headerResizeObserver=this.slotResizeObserver("header"),this.subheaderResizeObserver=this.slotResizeObserver("subheader"),this.bannerResizeObserver=this.slotResizeObserver("banner"),this.footerResizeObserver=this.slotResizeObserver("footer"),this.hasExplicitNavigationToggleSetting=!1,this.handleNavigationToggle=e=>{if(this.view==="desktop"){this.hideNavigation();return}const t=e.composedPath(),n=this.navigationToggleSlot;t.find(o=>o.hasAttribute?.("data-toggle-nav")||o.assignedSlot===n||o===n)&&(e.preventDefault(),this.toggleNavigation())},this.view="desktop",this.navOpen=!1,this.mobileBreakpoint="768px",this.navigationPlacement="start",this.disableNavigationToggle=!1,this.pageResizeObserver=typeof ResizeObserver<"u"?new ResizeObserver(e=>{requestAnimationFrame(()=>{for(const t of e)if(t.contentBoxSize){const o=t.borderBoxSize[0].inlineSize,a=this.view;o>=rl(this.mobileBreakpoint)?this.view="desktop":this.view="mobile",this.requestUpdate("view",a)}})}):null,this.updateNavigationToggleState=e=>{if(e){const o=e.target.name;if(!["navigation","navigation-header","navigation-footer"].includes(o))return}if(this.hasExplicitNavigationToggleSetting)return;const t=!!this.querySelector(":not([slot='navigation-toggle']) [data-toggle-nav]"),n=!!this.querySelector('[slot="navigation"]')||!!this.querySelector('[slot="navigation-header"]')||!!this.querySelector('[slot="navigation-footer"]');this.disableNavigationToggle=t||!n},this.addEventListener("click",this.handleNavigationToggle)}slotResizeObserver(e){return new ResizeObserver(t=>{requestAnimationFrame(()=>{for(const n of t)if(n.contentBoxSize){const o=n.borderBoxSize[0];this.style.setProperty(`--${e}-height`,`${Math.round(o.blockSize)}px`)}})})}updated(e){e.has("view")&&this.hideNavigation(),super.updated(e)}connectedCallback(){super.connectedCallback(),setTimeout(()=>{requestAnimationFrame(()=>{this.pageResizeObserver?.observe(this),this.headerResizeObserver?.observe(this.header),this.subheaderResizeObserver?.observe(this.subheader),this.bannerResizeObserver?.observe(this.banner),this.footerResizeObserver?.observe(this.footer)})})}visiblePixelsInViewport(e){if(!e)return null;const t=e.clientHeight,n=window.innerHeight,o=e.getBoundingClientRect?.();if(!o)return null;const{top:a,bottom:s}=o;return Math.max(0,a>0?Math.min(t,n-a):Math.min(s,n))}firstUpdated(e){if(!document.getElementById("main-content")){const t=document.createElement("div");t.id="main-content",t.slot="skip-to-content-target",this.prepend(t)}this.hasExplicitNavigationToggleSetting=this.disableNavigationToggle,this.shadowRoot.addEventListener("slotchange",this.updateNavigationToggleState),this.updateNavigationToggleState(),super.firstUpdated(e)}disconnectedCallback(){super.disconnectedCallback(),this.pageResizeObserver?.unobserve(this),this.headerResizeObserver?.unobserve(this.header),this.subheaderResizeObserver?.unobserve(this.subheader),this.footerResizeObserver?.unobserve(this.footer),this.bannerResizeObserver?.unobserve(this.banner)}showNavigation(){this.navOpen=!0}hideNavigation(){this.navOpen=!1}toggleNavigation(){this.navOpen=!this.navOpen}render(){const e=this.view==="mobile"&&(this.hasSlotController.test("navigation-footer")||this.hasSlotController.test("mobile-navigation-footer"));let t=this.nonce||globalThis.litNonce||null;return J`
      <a href="#main-content" part="skip-to-content" class="wa-visually-hidden">
        <slot name="skip-to-content">Skip to content</slot>
      </a>

      <!-- unsafeHTML needed for SSR until this is solved: https://github.com/lit/lit/issues/4696 -->
      ${sl(`
        <style
          ${t?`nonce="${t}"`:""}
          id="mobile-styles"
        >
          ${tl(il(this.mobileBreakpoint))}
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
                  ${En(this.view==="desktop",()=>J`<slot name="navigation-header"><div></div></slot>`,()=>J`<div></div>`)}
                </slot>
                <slot name="desktop-navigation">
                  ${En(this.view==="desktop",()=>J`<slot name="navigation"><div></div></slot>`,()=>J`<div></div>`)}
                </slot>
                <slot name="desktop-navigation-footer">
                  ${En(this.view==="desktop",()=>J`<slot name="navigation-footer"><div></div></slot>`,()=>J`<div></div>`)}
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
        ?open=${zr(this.navOpen)}
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
          ${En(this.view==="mobile",()=>J`<slot name="navigation-header"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>
        <slot name="mobile-navigation">
          ${En(this.view==="mobile",()=>J`<slot name="navigation"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>

        <slot
          slot=${kt(e?"footer":void 0)}
          name="mobile-navigation-footer"
          ?hidden=${!e}
        >
          ${En(this.view==="mobile",()=>J`<slot part="navigation-footer" name="navigation-footer"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>
      </wa-drawer>
    `}};Ue.css=[ol,nl];v([Ee("[part~='header']")],Ue.prototype,"header",2);v([Ee("[part~='menu']")],Ue.prototype,"menu",2);v([Ee("[part~='main']")],Ue.prototype,"main",2);v([Ee("[part~='aside']")],Ue.prototype,"aside",2);v([Ee("[part~='subheader']")],Ue.prototype,"subheader",2);v([Ee("[part~='footer']")],Ue.prototype,"footer",2);v([Ee("[part~='banner']")],Ue.prototype,"banner",2);v([Ee("[part~='drawer']")],Ue.prototype,"navigationDrawer",2);v([Ee("slot[name~='navigation-toggle']")],Ue.prototype,"navigationToggleSlot",2);v([B({attribute:"view",reflect:!0})],Ue.prototype,"view",2);v([B({reflect:!0})],Ue.prototype,"nonce",2);v([B({attribute:"nav-open",reflect:!0,type:Boolean})],Ue.prototype,"navOpen",2);v([B({attribute:"mobile-breakpoint",type:String})],Ue.prototype,"mobileBreakpoint",2);v([B({attribute:"navigation-placement",reflect:!0})],Ue.prototype,"navigationPlacement",2);v([B({attribute:"disable-navigation-toggle",reflect:!0,type:Boolean})],Ue.prototype,"disableNavigationToggle",2);Ue=v([Ge("wa-page")],Ue);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ll=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var cl=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??(this.observer=new ResizeObserver(()=>this.check())),this.observer.observe(this.element);for(const t of e)this.observer.observe(t);this.initialCheckHandle??(this.initialCheckHandle=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()}))}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function dl(e,t){const n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var Aa=new Set;function ul(){const e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function hl(){const e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function ia(e){if(Aa.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){const t=ul()+hl();let n=getComputedStyle(document.documentElement).scrollbarGutter;(!n||n==="auto")&&(n="stable"),t<2&&(n=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",n),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function la(e){Aa.delete(e),Aa.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function pl(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qo=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Io=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ho=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Bo=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var mn=[];function Pr(e){bo(e),mn.push(e)}function bo(e){for(let t=mn.length-1;t>=0;t--)if(mn[t]===e){mn.splice(t,1);break}}function Ta(e){return mn.length>0&&mn[mn.length-1]===e}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */async function Ra(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function vt(e,t){return new Promise(n=>{const o=new AbortController,{signal:a}=o;if(e.classList.contains(t))return;e.classList.add(t);let s=!1,r=()=>{s||(s=!0,e.classList.remove(t),n(),o.abort())};e.addEventListener("animationend",r,{once:!0,signal:a}),e.addEventListener("animationcancel",r,{once:!0,signal:a}),requestAnimationFrame(()=>{!s&&e.getAnimations().length===0&&r()})})}function ws(e){return e=e.toString().toLowerCase(),e.indexOf("ms")>-1?parseFloat(e)||0:e.indexOf("s")>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}function fl(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ht=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.hasSlotController=new Hn(this,"footer","header-actions","label"),this.renderedWatcher=new cl(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.withLabel=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&Ta(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.drawer.showModal(),ia(this),this.renderedWatcher.start(this.drawer))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),la(this),this.removeOpenListeners()}async requestClose(e){const t=new Io({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,vt(this.drawer,"pulse");return}this.removeOpenListeners(),await vt(this.drawer,"hide"),this.open=!1,this.drawer.close(),la(this),this.renderedWatcher.stop();const n=this.originalTrigger;typeof n?.focus=="function"&&setTimeout(()=>n.focus()),this.dispatchEvent(new Ho)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),Pr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),bo(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&Ta(this)&&this.requestClose(this.drawer)}handleDialogClick(e){const n=e.target.closest('[data-drawer="close"]');n&&(e.stopPropagation(),this.requestClose(n))}async handleDialogPointerDown(e){e.target===this.drawer&&!dl(e,this.drawer)&&(this.lightDismiss?this.requestClose(this.drawer):await vt(this.drawer,"pulse"))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.drawer.open?(this.removeOpenListeners(),this.drawer.close(),la(this)):e&&!this.drawer.open&&(this.addOpenListeners(),this.drawer.showModal(),ia(this))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open?(this.open=!0,this.requestClose(this.drawer)):this.open||this.renderedWatcher.stop()}async show(){const e=new qo;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),ia(this),this.renderedWatcher.start(this.drawer),requestAnimationFrame(()=>{const t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await vt(this.drawer,"show"),this.dispatchEvent(new Bo)}render(){const e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter"),n=this.label.length>0||this.hasSlotController.test("label","withLabel");return J`
      <dialog
        part="dialog"
        aria-labelledby=${kt(e&&n?"title":void 0)}
        aria-label=${kt(!e&&this.label?this.label:void 0)}
        class=${$t({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?J`
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
    `}};ht.css=ll;v([Ee(".drawer")],ht.prototype,"drawer",2);v([B({type:Boolean,reflect:!0})],ht.prototype,"open",2);v([B({reflect:!0})],ht.prototype,"label",2);v([B({reflect:!0})],ht.prototype,"placement",2);v([B({attribute:"without-header",type:Boolean,reflect:!0})],ht.prototype,"withoutHeader",2);v([B({attribute:"light-dismiss",type:Boolean})],ht.prototype,"lightDismiss",2);v([B({attribute:"with-footer",type:Boolean})],ht.prototype,"withFooter",2);v([B({attribute:"with-label",type:Boolean})],ht.prototype,"withLabel",2);v([bt("open",{waitUntilFirstUpdate:!0})],ht.prototype,"handleOpenChange",1);ht=v([Ge("wa-drawer")],ht);document.addEventListener("click",e=>{const t=e.target.closest("[data-drawer]");if(t instanceof Element){const[n,o]=pl(t.getAttribute("data-drawer")||"");if(n==="open"&&o?.length){const s=t.getRootNode().getElementById(o);s?.localName==="wa-drawer"?s.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ml=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gl=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<"u"&&"createElement"in document&&(t=Object.assign(document.createElement("input"),{required:!0})),n||(n="value");const o={observedAttributes:["required"],message:t?.validationMessage,checkValidity(a){const s={message:"",isValid:!0,invalidKeys:[]};return(a.required??a.hasAttribute("required"))&&!a[n]&&(s.message=typeof o.message=="function"?o.message(a):o.message||"",s.isValid=!1,s.invalidKeys.push("valueMissing")),s}};return o};let wl="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",bl=(e=21)=>{let t="",n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=wl[n[e]&63];return t};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function bs(e,t,n){const o=a=>Object.is(a,-0)?0:a;return e<t?o(t):e>n?o(n):o(e)}function ts(e=""){return`${e}${bl()}`}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ve=class extends Fn{constructor(){super(),this.hasSlotController=new Hn(this,"hint","label"),this.label="",this.hint="",this.name=null,this.disabled=!1,this.orientation="vertical",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{const t=e.target.closest("wa-radio");if(!t||t.disabled||t.forceDisabled||this.disabled)return;const n=this.value;this.value=t.value,t.checked=!0;const o=this.getAllRadios();for(const a of o)t!==a&&(a.checked=!1,a.setAttribute("tabindex","-1"));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})},this.addEventListener("keydown",this.handleKeyDown),this.addEventListener("click",this.handleRadioClick)}static get validators(){const e=[gl({validationElement:Object.assign(document.createElement("input"),{required:!0,type:"radio",name:ts("__wa-radio")})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e=="number"&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){Sn(this.localName,this.size)}get validationTarget(){const e=this.querySelector(":is(wa-radio):not([disabled])");if(e)return e}updated(e){(e.has("disabled")||e.has("size")||e.has("value")||e.has("defaultValue"))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll("wa-radio")]}handleLabelClick(){this.focus()}async syncRadioElements(){const e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute("size",this.size),t.toggleAttribute("data-wa-radio-horizontal",this.orientation!=="vertical"),t.toggleAttribute("data-wa-radio-vertical",this.orientation==="vertical"),t.toggleAttribute("data-wa-radio-first",n===0),t.toggleAttribute("data-wa-radio-inner",n!==0&&n!==e.length-1),t.toggleAttribute("data-wa-radio-last",n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async t=>{await t.updateComplete,!t.disabled&&t.value===this.value?t.checked=!0:t.checked=!1})),this.disabled)e.forEach(t=>{t.tabIndex=-1});else{const t=e.filter(o=>!o.disabled),n=t.find(o=>o.checked);t.length>0&&(n?t.forEach(o=>{o.tabIndex=o.checked?0:-1}):t.forEach((o,a)=>{o.tabIndex=a===0?0:-1})),e.filter(o=>o.disabled).forEach(o=>{o.tabIndex=-1})}}handleKeyDown(e){if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)||this.disabled)return;const t=this.getAllRadios().filter(i=>!i.disabled);if(t.length<=0)return;e.preventDefault();const n=this.value,o=t.find(i=>i.checked)??t[0],a=e.key===" "?0:["ArrowUp","ArrowLeft"].includes(e.key)?-1:1;let s=t.indexOf(o)+a;s||(s=0),s<0&&(s=t.length-1),s>t.length-1&&(s=0);const r=t.some(i=>i.tagName.toLowerCase()==="wa-radio-button");this.getAllRadios().forEach(i=>{i.checked=!1,r||i.setAttribute("tabindex","-1")}),this.value=t[s].value,t[s].checked=!0,r?t[s].shadowRoot.querySelector("button").focus():(t[s].setAttribute("tabindex","0"),t[s].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;const t=this.getAllRadios(),n=t.find(s=>s.checked),o=t.find(s=>!s.disabled),a=n||o;a&&a.focus(e)}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return J`
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
    `}};Ve.css=[Bn,Za,ml];Ve.shadowRootOptions={...Fn.shadowRootOptions,delegatesFocus:!0};v([Ee("slot:not([name])")],Ve.prototype,"defaultSlot",2);v([B()],Ve.prototype,"label",2);v([B({attribute:"hint"})],Ve.prototype,"hint",2);v([B({reflect:!0})],Ve.prototype,"name",2);v([B({type:Boolean,reflect:!0})],Ve.prototype,"disabled",2);v([B({reflect:!0})],Ve.prototype,"orientation",2);v([en()],Ve.prototype,"value",1);v([B({attribute:"value",reflect:!0})],Ve.prototype,"defaultValue",2);v([B({reflect:!0})],Ve.prototype,"size",2);v([bt("size")],Ve.prototype,"handleSizeChange",1);v([B({type:Boolean,reflect:!0})],Ve.prototype,"required",2);v([B({type:Boolean,attribute:"with-label"})],Ve.prototype,"withLabel",2);v([B({type:Boolean,attribute:"with-hint"})],Ve.prototype,"withHint",2);Ve=v([Ge("wa-radio-group")],Ve);Ve.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var yl=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gt=class extends Fn{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance="default",this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener("click",this.handleClick)}handleSizeChange(){Sn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute("role","radio"),this.tabIndex=0,this.setAttribute("aria-disabled",this.disabled||this.forceDisabled?"true":"false")}updated(e){if(super.updated(e),e.has("checked")&&(this.customStates.set("checked",this.checked),this.setAttribute("aria-checked",this.checked?"true":"false"),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has("disabled")||e.has("forceDisabled")){const t=this.disabled||this.forceDisabled;this.customStates.set("disabled",t),this.setAttribute("aria-disabled",t?"true":"false"),t?this.tabIndex=-1:this.tabIndex=this.checked?0:-1}}setValue(){}render(){return J`
      <span part="control" class="control">
        ${this.checked?J`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:""}
      </span>

      <slot part="label" class="label"></slot>
    `}};gt.css=[Za,Bn,yl];v([en()],gt.prototype,"checked",2);v([en()],gt.prototype,"forceDisabled",2);v([B({reflect:!0})],gt.prototype,"value",2);v([B({reflect:!0})],gt.prototype,"appearance",2);v([B({reflect:!0})],gt.prototype,"size",2);v([bt("size")],gt.prototype,"handleSizeChange",1);v([B({type:Boolean})],gt.prototype,"disabled",2);gt=v([Ge("wa-radio")],gt);gt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var vl=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wn=class extends it{constructor(){super(...arguments),this.variant="brand",this.appearance="accent",this.pill=!1,this.attention="none"}render(){return J`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};wn.css=[es,vl];v([B({reflect:!0})],wn.prototype,"variant",2);v([B({reflect:!0})],wn.prototype,"appearance",2);v([B({type:Boolean,reflect:!0})],wn.prototype,"pill",2);v([B({reflect:!0})],wn.prototype,"attention",2);wn=v([Ge("wa-badge")],wn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var kl=class extends Event{constructor(){super("wa-remove",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var $l=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pt=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.variant="neutral",this.appearance="filled-outlined",this.size="m",this.pill=!1,this.withRemove=!1}handleSizeChange(){Sn(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new kl)}render(){return J`
      <slot part="content" class="content"></slot>

      ${this.withRemove?J`
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
    `}};Pt.css=[$l,es,Bn];v([B({reflect:!0})],Pt.prototype,"variant",2);v([B({reflect:!0})],Pt.prototype,"appearance",2);v([B({reflect:!0})],Pt.prototype,"size",2);v([bt("size")],Pt.prototype,"handleSizeChange",1);v([B({type:Boolean,reflect:!0})],Pt.prototype,"pill",2);v([B({attribute:"with-remove",type:Boolean})],Pt.prototype,"withRemove",2);Pt=v([Ge("wa-tag")],Pt);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var xl=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qn=null,ho=0;function Sl(){if(ho+=1,Qn||typeof document>"u")return;const e=document.createElement("div");e.id=ts("wa-toast-live-region-"),e.setAttribute("data-wa-toast-live-region",""),e.style.cssText=`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    pointer-events: none;
    top: 0;
    left: 0;
  `,document.body.append(e),Qn=e}function _l(){ho=Math.max(0,ho-1),!(ho>0)&&(Qn?.remove(),Qn=null)}function Cl(e,t){if(typeof document>"u")return;const n=Qn;if(!n)return;const o=e.trim();if(!o)return;const a=document.createElement("div");a.setAttribute("role",t==="danger"?"alert":"status"),a.setAttribute("aria-live",t==="danger"?"assertive":"polite"),a.setAttribute("aria-atomic","true"),n.append(a),requestAnimationFrame(()=>{requestAnimationFrame(()=>{a.textContent=o})}),setTimeout(()=>a.remove(),1e3)}var Zn=class extends it{constructor(){super(...arguments),this.activatedToastItems=new WeakSet,this.positionCache=new Map,this.placement="top-end",this.handleDocumentKeyDown=async e=>{if(await new Promise(t=>setTimeout(t)),e.key==="Escape"&&!e.defaultPrevented){const t=this.getToastItems();t.length>0&&(e.preventDefault(),t[t.length-1]?.hide())}},this.handleAfterHide=async e=>{const t=e.target;t.parentElement===this&&(this.capturePositions(),t.remove(),await this.animatePositions()),this.getToastItems().length===0&&this.hideStack()}}connectedCallback(){super.connectedCallback(),this.popover="manual",Sl(),document.addEventListener("keydown",this.handleDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener?.("keydown",this.handleDocumentKeyDown),_l()}handleSlotChange(){const e=this.getToastItems(),t=[];e.forEach(n=>{this.activatedToastItems.has(n)||t.push(n)}),t.length>0&&(this.capturePositions(),t.forEach(n=>{this.activatedToastItems.add(n),this.showStack(),n.startTimer(),this.announceToastItem(n)}),requestAnimationFrame(()=>this.animatePositions()))}announceToastItem(e){Cl(e.textContent??"",e.variant)}getToastItems(){return[...this.querySelectorAll(":scope > wa-toast-item")]}capturePositions(){this.positionCache.clear();for(const e of this.getToastItems())this.positionCache.set(e,e.getBoundingClientRect())}async animatePositions(){if(fl()){this.positionCache.clear();return}const e=[];for(const t of this.getToastItems()){const n=this.positionCache.get(t);if(!n)continue;const o=t.getBoundingClientRect(),a=n.top-o.top;if(Math.abs(a)>1){const s=Ra(t,[{transform:`translateY(${a}px)`},{transform:"translateY(0)"}],{duration:200,easing:"cubic-bezier(0.2, 0, 0, 1)"});e.push(s)}}this.positionCache.clear(),await Promise.all(e)}showStack(){this.matches(":popover-open")||(this.showPopover(),this.customStates.set("visible",!0))}hideStack(){this.matches(":popover-open")&&(this.hidePopover(),this.customStates.set("visible",!1))}async create(e,t){const n={allowHtml:!1,duration:5e3,variant:"neutral",size:"m",...t},o=document.createElement("wa-toast-item");if(o.variant=n.variant,o.size=n.size,o.duration=n.duration,n.allowHtml?o.innerHTML=e:o.textContent=e,n.icon){const a=document.createElement("wa-icon");a.setAttribute("slot","icon"),typeof n.icon=="string"?a.setAttribute("name",n.icon):(a.setAttribute("name",n.icon.name),n.icon.library&&a.setAttribute("library",n.icon.library),n.icon.family&&a.setAttribute("family",n.icon.family),n.icon.variant&&a.setAttribute("variant",n.icon.variant)),o.prepend(a)}return this.activatedToastItems.add(o),this.capturePositions(),this.showStack(),this.prepend(o),await o.updateComplete,this.animatePositions(),o.startTimer(),this.announceToastItem(o),o}render(){return J`
      <div part="stack" class="stack" @wa-after-hide=${this.handleAfterHide}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Zn.css=xl;v([Ee(".stack")],Zn.prototype,"stack",2);v([B({reflect:!0})],Zn.prototype,"placement",2);Zn=v([Ge("wa-toast")],Zn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var El=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ct=class extends it{constructor(){super(...arguments),this.hasSlotController=new Hn(this,"icon"),this.localize=new Tt(this),this.animationFrame=null,this.startTime=null,this.isHovering=!1,this.isFocused=!1,this.timeLeft=100,this.variant="neutral",this.size="m",this.duration=5e3,this.withIcon=!1,this.tick=()=>{if(!this.startTime)return;const e=performance.now()-this.startTime,t=Math.min(e/this.duration,1);this.timeLeft=100*(1-t),t<1?this.animationFrame=requestAnimationFrame(this.tick):this.hide()},this.handlePointerEnter=e=>{(e.pointerType==="mouse"||e.pointerType==="pen")&&(this.isHovering=!0,this.pauseTimer())},this.handlePointerLeave=()=>{this.isHovering&&(this.isHovering=!1,this.resumeTimer())},this.handleFocusIn=()=>{this.isFocused=!0,this.pauseTimer()},this.handleFocusOut=()=>{this.isFocused=!1,this.resumeTimer()}}handleSizeChange(){Sn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener("pointerenter",this.handlePointerEnter),this.addEventListener("pointerleave",this.handlePointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),this.removeEventListener("pointerenter",this.handlePointerEnter),this.removeEventListener("pointerleave",this.handlePointerLeave)}async startTimer(){const e=new qo;this.dispatchEvent(e),!e.defaultPrevented&&(await this.updateComplete,await vt(this.toastItemElement,"show"),this.dispatchEvent(new Bo),this.duration>0&&Number.isFinite(this.duration)&&(this.startTime=performance.now(),this.timeLeft=100,this.tick()))}stopTimer(){this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null)}async hide(){this.stopTimer();const e=new Io;this.dispatchEvent(e),!e.defaultPrevented&&(await vt(this.toastItemElement,"hide"),this.dispatchEvent(new Ho),this.remove())}handleCloseClick(){this.hide()}pauseTimer(){this.stopTimer(),this.timeLeft=100}resumeTimer(){!this.isHovering&&!this.isFocused&&this.duration>0&&(this.startTime=performance.now(),this.tick())}render(){const e=this.hasUpdated?this.hasSlotController.test("icon"):this.withIcon,t=this.duration>0;return J`
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
    `}};Ct.css=[El,es,Bn];v([Ee(".toast-item")],Ct.prototype,"toastItemElement",2);v([en()],Ct.prototype,"timeLeft",2);v([B({reflect:!0})],Ct.prototype,"variant",2);v([B({reflect:!0})],Ct.prototype,"size",2);v([bt("size")],Ct.prototype,"handleSizeChange",1);v([B({type:Number})],Ct.prototype,"duration",2);v([B({attribute:"with-icon",type:Boolean})],Ct.prototype,"withIcon",2);Ct=v([Ge("wa-toast-item")],Ct);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Al=Ke`
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
 */const Dr="important",Tl=" !"+Dr,ys=Lr(class extends Mr{constructor(e){if(super(e),e.type!==Or.ATTRIBUTE||e.name!=="style"||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{const o=e[n];return o==null?t:t+`${n=n.includes("-")?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${o};`},"")}update(e,[t]){const{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const o of this.ft)t[o]==null&&(this.ft.delete(o),o.includes("-")?n.removeProperty(o):n[o]=null);for(const o in t){const a=t[o];if(a!=null){this.ft.add(o);const s=typeof a=="string"&&a.endsWith(Tl);o.includes("-")||s?n.setProperty(o,s?a.slice(0,-11):a,s?Dr:""):n[o]=a}}return Nr}});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Jt=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.value=0,this.label=""}updated(e){if(super.updated(e),e.has("value")){const t=parseFloat(getComputedStyle(this.indicator).getPropertyValue("r")),n=2*Math.PI*t,o=n-this.value/100*n;this.indicatorOffset=`${o}px`}}render(){return J`
      <div
        part="base progress-ring"
        class="progress-ring"
        role="progressbar"
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-describedby="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style=${ys({"--percentage":this.value/100})}
      >
        <svg class="image">
          <circle part="track" class="track"></circle>
          <circle
            part="indicator"
            class="indicator"
            style=${ys({"stroke-dashoffset":this.indicatorOffset})}
          ></circle>
        </svg>

        <slot id="label" part="label" class="label"></slot>
      </div>
    `}};Jt.css=Al;v([Ee(".indicator")],Jt.prototype,"indicator",2);v([en()],Jt.prototype,"indicatorOffset",2);v([B({type:Number,reflect:!0})],Jt.prototype,"value",2);v([B()],Jt.prototype,"label",2);Jt=v([Ge("wa-progress-ring")],Jt);Jt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Rl=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Be=class extends Fn{constructor(){super(...arguments),this.hasSlotController=new Hn(this,"hint"),this.localize=new Tt(this),this.title="",this.name=null,this._value=this.getAttribute("value")??null,this.size="m",this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute("checked"),this.required=!1,this.hint="",this.withHint=!1}static get validators(){return[...super.validators,Xi()]}get value(){return this._value??"on"}set value(e){this._value=e}handleSizeChange(){Sn(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})}handleKeyDown(e){const t=this.localize.dir()==="rtl";e.key==="ArrowLeft"&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))})),e.key==="ArrowRight"&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has("value")||e.has("checked")||e.has("defaultChecked")||e.has("disabled"))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set("checked",this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??"on",t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){const e=this.hasSlotController.test("hint","withHint"),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:zr(this.checked);return J`
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
    `}};Be.shadowRootOptions={...Fn.shadowRootOptions,delegatesFocus:!0};Be.css=[Za,Bn,Rl];v([Ee('input[type="checkbox"]')],Be.prototype,"input",2);v([B()],Be.prototype,"title",2);v([B({reflect:!0})],Be.prototype,"name",2);v([B({reflect:!0})],Be.prototype,"value",1);v([B({reflect:!0})],Be.prototype,"size",2);v([bt("size")],Be.prototype,"handleSizeChange",1);v([B({type:Boolean})],Be.prototype,"disabled",2);v([B({type:Boolean,attribute:!1})],Be.prototype,"checked",1);v([B({type:Boolean,attribute:"checked",reflect:!0})],Be.prototype,"defaultChecked",2);v([B({type:Boolean,reflect:!0})],Be.prototype,"required",2);v([B({attribute:"hint"})],Be.prototype,"hint",2);v([B({attribute:"with-hint",type:Boolean})],Be.prototype,"withHint",2);v([bt(["checked","defaultChecked"])],Be.prototype,"handleStateChange",1);v([bt("disabled",{waitUntilFirstUpdate:!0})],Be.prototype,"handleDisabledChange",1);Be=v([Ge("wa-switch")],Be);Be.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ll=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function vs(e,t){return new Promise(n=>{function o(a){a.target===e&&(e.removeEventListener(t,o),n())}e.addEventListener(t,o)})}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ze=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance="outlined",this.iconPlacement="end"}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?"auto":"0",this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(t=>{for(const n of t)n.type==="attributes"&&n.attributeName==="open"&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has("isAnimating")&&this.customStates.set("animating",this.isAnimating)}handleSummaryClick(e){e.composedPath().some(o=>{if(!(o instanceof HTMLElement))return!1;const a=o.tagName?.toLowerCase();return["a","button","input","textarea","select"].includes(a)?!0:o instanceof Fn?!("disabled"in o)||!o.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&(e.preventDefault(),this.hide()),(e.key==="ArrowDown"||e.key==="ArrowRight")&&(e.preventDefault(),this.show())}closeOthersWithSameName(){if(!this.name)return;this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(n=>{n!==this&&n.open&&(n.open=!1)})}async handleOpenChange(){this.animationGeneration++;const e=this.animationGeneration;if(this.open){this.details.open=!0;const t=new qo;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;const n=ws(getComputedStyle(this.body).getPropertyValue("--show-duration"));if(await Ra(this.body,[{height:"0",opacity:"0"},{height:`${this.body.scrollHeight}px`,opacity:"1"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="auto",this.isAnimating=!1,this.dispatchEvent(new Bo)}else{const t=new Io;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;const n=ws(getComputedStyle(this.body).getPropertyValue("--hide-duration"));if(await Ra(this.body,[{height:`${this.body.scrollHeight}px`,opacity:"1"},{height:"0",opacity:"0"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="0",this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new Ho)}}async show(){if(!(this.open||this.disabled))return this.open=!0,vs(this,"wa-after-show")}async hide(){if(!(!this.open||this.disabled))return this.open=!1,vs(this,"wa-after-hide")}render(){const e=this.hasUpdated?this.localize.dir()==="rtl":this.dir==="rtl";return J`
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
    `}};Ze.css=Ll;v([Ee("details")],Ze.prototype,"details",2);v([Ee("summary")],Ze.prototype,"header",2);v([Ee(".body")],Ze.prototype,"body",2);v([Ee(".expand-icon-slot")],Ze.prototype,"expandIconSlot",2);v([en()],Ze.prototype,"isAnimating",2);v([B({type:Boolean,reflect:!0})],Ze.prototype,"open",2);v([B()],Ze.prototype,"summary",2);v([B({reflect:!0})],Ze.prototype,"name",2);v([B({type:Boolean,reflect:!0})],Ze.prototype,"disabled",2);v([B({reflect:!0})],Ze.prototype,"appearance",2);v([B({attribute:"icon-placement",reflect:!0})],Ze.prototype,"iconPlacement",2);v([bt("open",{waitUntilFirstUpdate:!0})],Ze.prototype,"handleOpenChange",1);Ze=v([Ge("wa-details")],Ze);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ml=class extends Event{constructor(e){super("wa-select",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function*qr(e=document.activeElement){e!=null&&(yield e,"shadowRoot"in e&&e.shadowRoot&&e.shadowRoot.mode!=="closed"&&(yield*qr(e.shadowRoot.activeElement)))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ol=Ke`
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
`;const Yt=Math.min,Nt=Math.max,yo=Math.round,so=Math.floor,zt=e=>({x:e,y:e}),Nl={left:"right",right:"left",bottom:"top",top:"bottom"};function Ir(e,t,n){return Nt(e,Yt(t,n))}function jn(e,t){return typeof e=="function"?e(t):e}function bn(e){return e.split("-")[0]}function Wn(e){return e.split("-")[1]}function Hr(e){return e==="x"?"y":"x"}function ns(e){return e==="y"?"height":"width"}function Mt(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function os(e){return Hr(Mt(e))}function zl(e,t,n){n===void 0&&(n=!1);const o=Wn(e),a=os(e),s=ns(a);let r=a==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(r=vo(r)),[r,vo(r)]}function Pl(e){const t=vo(e);return[La(e),t,La(t)]}function La(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const ks=["left","right"],$s=["right","left"],Dl=["top","bottom"],ql=["bottom","top"];function Il(e,t,n){switch(e){case"top":case"bottom":return n?t?$s:ks:t?ks:$s;case"left":case"right":return t?Dl:ql;default:return[]}}function Hl(e,t,n,o){const a=Wn(e);let s=Il(bn(e),n==="start",o);return a&&(s=s.map(r=>r+"-"+a),t&&(s=s.concat(s.map(La)))),s}function vo(e){const t=bn(e);return Nl[t]+e.slice(t.length)}function Bl(e){var t,n,o,a;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(a=e.left)!=null?a:0}}function Br(e){return typeof e!="number"?Bl(e):{top:e,right:e,bottom:e,left:e}}function ko(e){const{x:t,y:n,width:o,height:a}=e;return{width:o,height:a,top:n,left:t,right:t+o,bottom:n+a,x:t,y:n}}function xs(e,t,n){let{reference:o,floating:a}=e;const s=Mt(t),r=os(t),i=ns(r),l=bn(t),c=s==="y",d=o.x+o.width/2-a.width/2,u=o.y+o.height/2-a.height/2,g=o[i]/2-a[i]/2;let p;switch(l){case"top":p={x:d,y:o.y-a.height};break;case"bottom":p={x:d,y:o.y+o.height};break;case"right":p={x:o.x+o.width,y:u};break;case"left":p={x:o.x-a.width,y:u};break;default:p={x:o.x,y:o.y}}const f=Wn(t);return f&&(p[r]+=g*(f==="end"?1:-1)*(n&&c?-1:1)),p}async function Fl(e,t){var n;t===void 0&&(t={});const{x:o,y:a,platform:s,rects:r,elements:i,strategy:l}=e,{boundary:c="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:g=!1,padding:p=0}=jn(t,e),f=Br(p),h=i[g?u==="floating"?"reference":"floating":u],b=ko(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(h)))==null||n?h:h.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(i.floating)),boundary:c,rootBoundary:d,strategy:l})),w=u==="floating"?{x:o,y:a,width:r.floating.width,height:r.floating.height}:r.reference,$=await(s.getOffsetParent==null?void 0:s.getOffsetParent(i.floating)),R=await(s.isElement==null?void 0:s.isElement($))&&await(s.getScale==null?void 0:s.getScale($))||{x:1,y:1},E=ko(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:i,rect:w,offsetParent:$,strategy:l}):w);return{top:(b.top-E.top+f.top)/R.y,bottom:(E.bottom-b.bottom+f.bottom)/R.y,left:(b.left-E.left+f.left)/R.x,right:(E.right-b.right+f.right)/R.x}}const jl=50,Wl=async(e,t,n)=>{const{placement:o="bottom",strategy:a="absolute",middleware:s=[],platform:r}=n,i=r.detectOverflow?r:{...r,detectOverflow:Fl},l=await(r.isRTL==null?void 0:r.isRTL(t));let c=await r.getElementRects({reference:e,floating:t,strategy:a}),{x:d,y:u}=xs(c,o,l),g=o,p=0;const f={};for(let y=0;y<s.length;y++){const h=s[y];if(!h)continue;const{name:b,fn:w}=h,{x:$,y:R,data:E,reset:P}=await w({x:d,y:u,initialPlacement:o,placement:g,strategy:a,middlewareData:f,rects:c,platform:i,elements:{reference:e,floating:t}});d=$??d,u=R??u,f[b]={...f[b],...E},P&&p<jl&&(p++,typeof P=="object"&&(P.placement&&(g=P.placement),P.rects&&(c=P.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:a}):P.rects),{x:d,y:u}=xs(c,g,l)),y=-1)}return{x:d,y:u,placement:g,strategy:a,middlewareData:f}},Ul=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:a,rects:s,platform:r,elements:i,middlewareData:l}=t,{element:c,padding:d=0}=jn(e,t)||{};if(c==null)return{};const u=Br(d),g={x:n,y:o},p=os(a),f=ns(p),y=await r.getDimensions(c),h=p==="y",b=h?"top":"left",w=h?"bottom":"right",$=h?"clientHeight":"clientWidth",R=s.reference[f]+s.reference[p]-g[p]-s.floating[f],E=g[p]-s.reference[p],P=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c));let Z=P?P[$]:0;(!Z||!await(r.isElement==null?void 0:r.isElement(P)))&&(Z=i.floating[$]||s.floating[f]);const Q=R/2-E/2,ne=Z/2-y[f]/2-1,T=Yt(u[b],ne),V=Yt(u[w],ne),q=Z-y[f]-V,m=Z/2-y[f]/2+Q,D=Ir(T,m,q),F=!l.arrow&&Wn(a)!=null&&m!==D&&s.reference[f]/2-(m<T?T:V)-y[f]/2<0,N=F?m<T?m-T:m-q:0;return{[p]:g[p]+N,data:{[p]:D,centerOffset:m-D-N,...F&&{alignmentOffset:N}},reset:F}}}),Vl=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:a,middlewareData:s,rects:r,initialPlacement:i,platform:l,elements:c}=t,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:g,fallbackStrategy:p="bestFit",fallbackAxisSideDirection:f="none",flipAlignment:y=!0,...h}=jn(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const b=bn(a),w=Mt(i),$=bn(i)===i,R=await(l.isRTL==null?void 0:l.isRTL(c.floating)),E=g||($||!y?[vo(i)]:Pl(i)),P=f!=="none";!g&&P&&E.push(...Hl(i,y,f,R));const Z=[i,...E],Q=await l.detectOverflow(t,h),ne=[];let T=((o=s.flip)==null?void 0:o.overflows)||[];if(d&&ne.push(Q[b]),u){const D=zl(a,r,R);ne.push(Q[D[0]],Q[D[1]])}if(T=[...T,{placement:a,overflows:ne}],!ne.every(D=>D<=0)){var V,q;const D=(((V=s.flip)==null?void 0:V.index)||0)+1,F=Z[D];if(F&&(!(u==="alignment"?w!==Mt(F):!1)||T.every(U=>Mt(U.placement)===w?U.overflows[0]>0:!0)))return{data:{index:D,overflows:T},reset:{placement:F}};let N=(q=T.filter(W=>W.overflows[0]<=0).sort((W,U)=>W.overflows[1]-U.overflows[1])[0])==null?void 0:q.placement;if(!N)switch(p){case"bestFit":{var m;const W=(m=T.filter(U=>{if(P){const ee=Mt(U.placement);return ee===w||ee==="y"}return!0}).map(U=>[U.placement,U.overflows.filter(ee=>ee>0).reduce((ee,se)=>ee+se,0)]).sort((U,ee)=>U[1]-ee[1])[0])==null?void 0:m[0];W&&(N=W);break}case"initialPlacement":N=i;break}if(a!==N)return{reset:{placement:N}}}return{}}}},Kl=new Set(["left","top"]);async function Jl(e,t){const{placement:n,platform:o,elements:a}=e,s=await(o.isRTL==null?void 0:o.isRTL(a.floating)),r=bn(n),i=Wn(n),l=Mt(n)==="y",c=Kl.has(r)?-1:1,d=s&&l?-1:1,u=jn(t,e);let{mainAxis:g,crossAxis:p,alignmentAxis:f}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return i&&typeof f=="number"&&(p=i==="end"?f*-1:f),l?{x:p*d,y:g*c}:{x:g*c,y:p*d}}const Yl=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:a,y:s,placement:r,middlewareData:i}=t,l=await Jl(t,e);return r===((n=i.offset)==null?void 0:n.placement)&&(o=i.arrow)!=null&&o.alignmentOffset?{}:{x:a+l.x,y:s+l.y,data:{...l,placement:r}}}}},Gl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:a,platform:s}=t,{mainAxis:r=!0,crossAxis:i=!1,limiter:l={fn:w=>{let{x:$,y:R}=w;return{x:$,y:R}}},...c}=jn(e,t),d={x:n,y:o},u=await s.detectOverflow(t,c),g=Mt(a),p=Hr(g);let f=d[p],y=d[g];const h=(w,$)=>Ir($+u[w==="y"?"top":"left"],$,$-u[w==="y"?"bottom":"right"]);r&&(f=h(p,f)),i&&(y=h(g,y));const b=l.fn({...t,[p]:f,[g]:y});return{...b,data:{x:b.x-n,y:b.y-o,enabled:{[p]:r,[g]:i}}}}}},Xl=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:a,elements:s}=t,{apply:r=()=>{},...i}=jn(e,t),l=await a.detectOverflow(t,i),c=bn(n),d=Wn(n),u=Mt(n)==="y",{width:g,height:p}=o.floating;let f,y;c==="top"||c==="bottom"?(f=c,y=d===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(y=c,f=d==="end"?"top":"bottom");const h=p-l.top-l.bottom,b=g-l.left-l.right,w=Yt(p-l[f],h),$=Yt(g-l[y],b),R=t.middlewareData.shift,E=!R;let P=w,Z=$;R!=null&&R.enabled.x&&(Z=b),R!=null&&R.enabled.y&&(P=h),E&&!d&&(u?Z=g-2*Nt(l.left,l.right):P=p-2*Nt(l.top,l.bottom)),await r({...t,availableWidth:Z,availableHeight:P});const Q=await a.getDimensions(s.floating);return g!==Q.width||p!==Q.height?{reset:{rects:!0}}:{}}}};function Fo(){return typeof window<"u"}function Un(e){return Fr(e)?(e.nodeName||"").toLowerCase():"#document"}function ot(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function qt(e){var t;return(t=(Fr(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Fr(e){return Fo()?e instanceof Node||e instanceof ot(e).Node:!1}function Et(e){return Fo()?e instanceof Element||e instanceof ot(e).Element:!1}function tn(e){return Fo()?e instanceof HTMLElement||e instanceof ot(e).HTMLElement:!1}function Ss(e){return!Fo()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof ot(e).ShadowRoot}function jo(e){const{overflow:t,overflowX:n,overflowY:o,display:a}=At(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&a!=="inline"&&a!=="contents"}function Ql(e){return/^(table|td|th)$/.test(Un(e))}function Wo(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Zl=/transform|translate|scale|rotate|perspective|filter/,ec=/paint|layout|strict|content/,rn=e=>!!e&&e!=="none";let ca;function Uo(e){const t=Et(e)?At(e):e;return rn(t.transform)||rn(t.translate)||rn(t.scale)||rn(t.rotate)||rn(t.perspective)||!as()&&(rn(t.backdropFilter)||rn(t.filter))||Zl.test(t.willChange||"")||ec.test(t.contain||"")}function tc(e){let t=yn(e);for(;tn(t)&&!eo(t);){if(Uo(t))return t;if(Wo(t))return null;t=yn(t)}return null}function as(){return ca==null&&(ca=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),ca}function eo(e){return/^(html|body|#document)$/.test(Un(e))}function At(e){return ot(e).getComputedStyle(e)}function Vo(e){return Et(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function yn(e){if(Un(e)==="html")return e;const t=e.assignedSlot||e.parentNode||Ss(e)&&e.host||qt(e);return Ss(t)?t.host:t}function jr(e){const t=yn(e);return eo(t)?(e.ownerDocument||e).body:tn(t)&&jo(t)?t:jr(t)}function On(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const a=jr(e),s=a===((o=e.ownerDocument)==null?void 0:o.body),r=ot(a);if(s){const i=Ma(r);return t.concat(r,r.visualViewport||[],jo(a)?a:[],i&&n?On(i):[])}else return t.concat(a,On(a,[],n))}function Ma(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Wr(e){const t=At(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const a=tn(e),s=a?e.offsetWidth:n,r=a?e.offsetHeight:o,i=yo(n)!==s||yo(o)!==r;return i&&(n=s,o=r),{width:n,height:o,$:i}}function ss(e){return Et(e)?e:e.contextElement}function Rn(e){const t=ss(e);if(!tn(t))return zt(1);const n=t.getBoundingClientRect(),{width:o,height:a,$:s}=Wr(t);let r=(s?yo(n.width):n.width)/o,i=(s?yo(n.height):n.height)/a;return(!r||!Number.isFinite(r))&&(r=1),(!i||!Number.isFinite(i))&&(i=1),{x:r,y:i}}const nc=zt(0);function Ur(e){const t=ot(e);return!as()||!t.visualViewport?nc:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function oc(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===ot(e)}function vn(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const a=e.getBoundingClientRect(),s=ss(e);let r=zt(1);t&&(o?Et(o)&&(r=Rn(o)):r=Rn(e));const i=oc(s,n,o)?Ur(s):zt(0);let l=(a.left+i.x)/r.x,c=(a.top+i.y)/r.y,d=a.width/r.x,u=a.height/r.y;if(s&&o){const g=ot(s),p=Et(o)?ot(o):o;let f=g,y=Ma(f);for(;y&&p!==f;){const h=Rn(y),b=y.getBoundingClientRect(),w=At(y),$=b.left+(y.clientLeft+parseFloat(w.paddingLeft))*h.x,R=b.top+(y.clientTop+parseFloat(w.paddingTop))*h.y;l*=h.x,c*=h.y,d*=h.x,u*=h.y,l+=$,c+=R,f=ot(y),y=Ma(f)}}return ko({width:d,height:u,x:l,y:c})}function Ko(e,t){const n=Vo(e).scrollLeft;return t?t.left+n:vn(qt(e)).left+n}function Vr(e,t){const n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-Ko(e,n),a=n.top+t.scrollTop;return{x:o,y:a}}function ac(e){let{elements:t,rect:n,offsetParent:o,strategy:a}=e;const s=a==="fixed",r=qt(o),i=t?Wo(t.floating):!1;if(o===r||i&&s)return n;let l={scrollLeft:0,scrollTop:0},c=zt(1);const d=zt(0),u=tn(o);if((u||!s)&&((Un(o)!=="body"||jo(r))&&(l=Vo(o)),u)){const p=vn(o);c=Rn(o),d.x=p.x+o.clientLeft,d.y=p.y+o.clientTop}const g=r&&!u&&!s?Vr(r,l):zt(0);return{width:n.width*c.x,height:n.height*c.y,x:n.x*c.x-l.scrollLeft*c.x+d.x+g.x,y:n.y*c.y-l.scrollTop*c.y+d.y+g.y}}function sc(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function rc(e){const t=Vo(e),n=e.ownerDocument.body,o=Nt(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),a=Nt(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+Ko(e);const r=-t.scrollTop;return At(n).direction==="rtl"&&(s+=Nt(e.clientWidth,n.clientWidth)-o),{width:o,height:a,x:s,y:r}}const ic=25;function lc(e,t,n){n===void 0&&(n="viewport");const o=n==="layoutViewport",a=ot(e),s=qt(e),r=a.visualViewport;let i=s.clientWidth,l=s.clientHeight,c=0,d=0;if(r){const g=!as()||t==="fixed";o?g||(c=-r.offsetLeft,d=-r.offsetTop):(i=r.width,l=r.height,g&&(c=r.offsetLeft,d=r.offsetTop))}if(Ko(s)<=0){const g=s.ownerDocument,p=g.body,f=getComputedStyle(p),y=g.compatMode==="CSS1Compat"&&parseFloat(f.marginLeft)+parseFloat(f.marginRight)||0,h=Math.abs(s.clientWidth-p.clientWidth-y),b=getComputedStyle(s).scrollbarGutter==="stable both-edges"?h/2:h;b<=ic&&(i-=b)}return{width:i,height:l,x:c,y:d}}function cc(e,t){const n=vn(e,!0,t==="fixed"),o=n.top+e.clientTop,a=n.left+e.clientLeft,s=Rn(e),r=e.clientWidth*s.x,i=e.clientHeight*s.y,l=a*s.x,c=o*s.y;return{width:r,height:i,x:l,y:c}}function _s(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=lc(e,n,t);else if(t==="document")o=rc(qt(e));else if(Et(t))o=cc(t,n);else{const a=Ur(e);o={x:t.x-a.x,y:t.y-a.y,width:t.width,height:t.height}}return ko(o)}function dc(e,t){const n=t.get(e);if(n)return n;let o=On(e,[],!1).filter(i=>Et(i)&&Un(i)!=="body"),a=null;const s=At(e).position==="fixed";let r=s?yn(e):e;for(;Et(r)&&!eo(r);){const i=At(r),l=Uo(r),c=a?a.position:s?"fixed":"";!l&&(c==="fixed"||c==="absolute"&&i.position==="static")?o=o.filter(u=>u!==r):a=i,r=yn(r)}return t.set(e,o),o}function uc(e){let{element:t,boundary:n,rootBoundary:o,strategy:a}=e;const r=[...n==="clippingAncestors"?Wo(t)?[]:dc(t,this._c):[].concat(n),o],i=_s(t,r[0],a);let l=i.top,c=i.right,d=i.bottom,u=i.left;for(let g=1;g<r.length;g++){const p=_s(t,r[g],a);l=Nt(p.top,l),c=Yt(p.right,c),d=Yt(p.bottom,d),u=Nt(p.left,u)}return{width:c-u,height:d-l,x:u,y:l}}function hc(e){const{width:t,height:n}=Wr(e);return{width:t,height:n}}function pc(e,t,n){const o=tn(t),a=qt(t),s=n==="fixed",r=vn(e,!0,s,t);let i={scrollLeft:0,scrollTop:0};const l=zt(0);if((o||!s)&&((Un(t)!=="body"||jo(a))&&(i=Vo(t)),o)){const g=vn(t,!0,s,t);l.x=g.x+t.clientLeft,l.y=g.y+t.clientTop}!o&&a&&(l.x=Ko(a));const c=a&&!o&&!s?Vr(a,i):zt(0),d=r.left+i.scrollLeft-l.x-c.x,u=r.top+i.scrollTop-l.y-c.y;return{x:d,y:u,width:r.width,height:r.height}}function da(e){return At(e).position==="static"}function Cs(e,t){if(!tn(e)||At(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return qt(e)===n&&(n=n.ownerDocument.body),n}function Kr(e,t){const n=ot(e);if(Wo(e))return n;if(!tn(e)){let a=yn(e);for(;a&&!eo(a);){if(Et(a)&&!da(a))return a;a=yn(a)}return n}let o=Cs(e,t);for(;o&&Ql(o)&&da(o);)o=Cs(o,t);return o&&eo(o)&&da(o)&&!Uo(o)?n:o||tc(e)||n}const fc=async function(e){const t=this.getOffsetParent||Kr,n=this.getDimensions,o=await n(e.floating);return{reference:pc(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function mc(e){return At(e).direction==="rtl"}const po={convertOffsetParentRelativeRectToViewportRelativeRect:ac,getDocumentElement:qt,getClippingRect:uc,getOffsetParent:Kr,getElementRects:fc,getClientRects:sc,getDimensions:hc,getScale:Rn,isElement:Et,isRTL:mc};function Jr(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function gc(e,t,n){let o=null,a;const s=qt(e);function r(){var d;clearTimeout(a),(d=o)==null||d.disconnect(),o=null}function i(d,u){d===void 0&&(d=!1),u===void 0&&(u=1),r();const g=e.getBoundingClientRect(),{left:p,top:f,width:y,height:h}=g;if(d||t(),!y||!h)return;const b=so(f),w=so(s.clientWidth-(p+y)),$=so(s.clientHeight-(f+h)),R=so(p),P={rootMargin:-b+"px "+-w+"px "+-$+"px "+-R+"px",threshold:Nt(0,Yt(1,u))||1};let Z=!0;function Q(ne){const T=ne[0].intersectionRatio;if(!Jr(g,e.getBoundingClientRect()))return i();if(T!==u){if(!Z)return i();T?i(!1,T):a=setTimeout(()=>{i(!1,1e-7)},1e3)}Z=!1}try{o=new IntersectionObserver(Q,{...P,root:s.ownerDocument})}catch{o=new IntersectionObserver(Q,P)}o.observe(e)}const l=ot(e),c=()=>i(n);return l.addEventListener("resize",c),i(!0),()=>{l.removeEventListener("resize",c),r()}}function Yr(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:a=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:i=typeof IntersectionObserver=="function",animationFrame:l=!1}=o,c=ss(e),d=a||s?[...c?On(c):[],...t?On(t):[]]:[];d.forEach(b=>{a&&b.addEventListener("scroll",n),s&&b.addEventListener("resize",n)});const u=c&&i?gc(c,n,s):null;let g=-1,p=null;r&&(p=new ResizeObserver(b=>{let[w]=b;w&&w.target===c&&p&&t&&(p.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var $;($=p)==null||$.observe(t)})),n()}),c&&!l&&p.observe(c),t&&p.observe(t));let f,y=l?vn(e):null;l&&h();function h(){const b=vn(e);y&&!Jr(y,b)&&n(),y=b,f=requestAnimationFrame(h)}return n(),()=>{var b;d.forEach(w=>{a&&w.removeEventListener("scroll",n),s&&w.removeEventListener("resize",n)}),u?.(),(b=p)==null||b.disconnect(),p=null,l&&cancelAnimationFrame(f)}}const Gr=Yl,Xr=Gl,Qr=Vl,Es=Xl,wc=Ul,Zr=(e,t,n)=>{const o=new Map,a=n??{},s={...po,...a.platform,_c:o};return Wl(e,t,{...a,platform:s})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ua=new Set,Qe=class extends it{constructor(){super(...arguments),this.submenuCleanups=new Map,this.localize=new Tt(this),this.userTypedQuery="",this.openSubmenuStack=[],this.open=!1,this.size="m",this.placement="bottom-start",this.distance=0,this.skidding=0,this.handleDocumentKeyDown=async e=>{const t=this.localize.dir()==="rtl";if(e.key==="Escape"&&this.open&&Ta(this)){const d=this.getTrigger();e.preventDefault(),e.stopPropagation(),this.open=!1,d?.focus({preventScroll:!0});return}const n=[...qr()].find(d=>d.localName==="wa-dropdown-item"),o=n?.localName==="wa-dropdown-item",a=this.getCurrentSubmenuItem(),s=!!a;let r,i,l;s?(r=this.getSubmenuItems(a),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1):(r=this.getItems(),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1);let c;if(e.key==="ArrowUp"&&(e.preventDefault(),e.stopPropagation(),l>0?c=r[l-1]:c=r[r.length-1]),e.key==="ArrowDown"&&(e.preventDefault(),e.stopPropagation(),l!==-1&&l<r.length-1?c=r[l+1]:c=r[0]),e.key===(t?"ArrowLeft":"ArrowRight")&&o&&i&&i.hasSubmenu){e.preventDefault(),e.stopPropagation(),i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0);return}if(e.key===(t?"ArrowRight":"ArrowLeft")&&s){e.preventDefault(),e.stopPropagation();const d=this.removeFromSubmenuStack();d&&(d.submenuOpen=!1,setTimeout(()=>{d.focus({preventScroll:!0}),d.active=!0,(d.slot==="submenu"?this.getSubmenuItems(d.parentElement):this.getItems()).forEach(g=>{g!==d&&(g.active=!1)})},0));return}if((e.key==="Home"||e.key==="End")&&(e.preventDefault(),e.stopPropagation(),c=e.key==="Home"?r[0]:r[r.length-1]),e.key==="Tab"&&await this.hideMenu(),e.key.length===1&&!(e.metaKey||e.ctrlKey||e.altKey)&&!(e.key===" "&&this.userTypedQuery==="")&&(clearTimeout(this.userTypedTimeout),this.userTypedTimeout=setTimeout(()=>{this.userTypedQuery=""},1e3),this.userTypedQuery+=e.key,r.some(d=>{const u=(d.textContent||"").trim().toLowerCase(),g=this.userTypedQuery.trim().toLowerCase();return u.startsWith(g)?(c=d,!0):!1})),c){e.preventDefault(),e.stopPropagation(),r.forEach(d=>d.active=d===c),c.focus({preventScroll:!0}),c.scrollIntoView({block:"nearest"});return}(e.key==="Enter"||e.key===" "&&this.userTypedQuery==="")&&o&&i&&(e.preventDefault(),e.stopPropagation(),i.hasSubmenu?(i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0)):this.makeSelection(i,e))},this.handleDocumentPointerDown=e=>{e.composedPath().some(o=>o instanceof HTMLElement?o===this||o.closest('wa-dropdown, [part="submenu"]'):!1)||(this.open=!1)},this.handleGlobalMouseMove=e=>{const t=this.getCurrentSubmenuItem();if(!t?.submenuOpen||!t.submenuElement)return;const n=t.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl",a=o?n.right:n.left,s=o?Math.max(e.clientX,a):Math.min(e.clientX,a),r=Math.max(n.top,Math.min(e.clientY,n.bottom));t.submenuElement.style.setProperty("--safe-triangle-cursor-x",`${s}px`),t.submenuElement.style.setProperty("--safe-triangle-cursor-y",`${r}px`);const i=e.composedPath(),l=t.matches(":hover"),c=!!t.submenuElement?.matches(":hover"),d=l||!!i.find(g=>g===t),u=c||!!i.find(g=>g instanceof HTMLElement&&g.closest('[part="submenu"]')===t.submenuElement);!d&&!u&&setTimeout(()=>{!l&&!c&&(t.submenuOpen=!1)},100)}}handleSizeChange(){Sn(this.localName,this.size)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.userTypedTimeout),this.closeAllSubmenus(),this.submenuCleanups.forEach(e=>e()),this.submenuCleanups.clear(),document.removeEventListener("mousemove",this.handleGlobalMouseMove),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),bo(this)}firstUpdated(e){super.firstUpdated(e),this.syncAriaAttributes()}async updated(e){if(e.has("open")){const t=e.get("open");if(t===this.open||t===void 0&&this.open===!1)return;this.customStates.set("open",this.open),this.open?await this.showMenu():(this.closeAllSubmenus(),await this.hideMenu())}e.has("size")&&this.syncItemSizes()}getItems(e=!1){const t=(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(n=>n.localName==="wa-dropdown-item");return e?t:t.filter(n=>!n.disabled)}getSubmenuItems(e,t=!1){const n=e.shadowRoot?.querySelector('slot[name="submenu"]')||e.querySelector('slot[name="submenu"]');if(!n)return[];const o=n.assignedElements({flatten:!0}).filter(a=>a.localName==="wa-dropdown-item");return t?o:o.filter(a=>!a.disabled)}syncItemSizes(){(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(t=>t.localName==="wa-dropdown-item").forEach(t=>t.size=this.size)}addToSubmenuStack(e){const t=this.openSubmenuStack.indexOf(e);t!==-1?this.openSubmenuStack=this.openSubmenuStack.slice(0,t+1):this.openSubmenuStack.push(e)}removeFromSubmenuStack(){return this.openSubmenuStack.pop()}getCurrentSubmenuItem(){return this.openSubmenuStack.length>0?this.openSubmenuStack[this.openSubmenuStack.length-1]:void 0}closeAllSubmenus(){this.getItems(!0).forEach(t=>{t.submenuOpen=!1}),this.openSubmenuStack=[]}closeSiblingSubmenus(e){const t=e.closest('wa-dropdown-item:not([slot="submenu"])');let n;t?n=this.getSubmenuItems(t,!0):n=this.getItems(!0),n.forEach(o=>{o!==e&&o.submenuOpen&&(o.submenuOpen=!1)}),this.openSubmenuStack.includes(e)||this.openSubmenuStack.push(e)}getTrigger(){return this.querySelector('[slot="trigger"]')}async showMenu(){if(!this.getTrigger()||!this.popup||!this.menu)return;const t=new qo;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1;return}if(this.popup.active)return;ua.forEach(o=>o.open=!1),this.popup.active=!0,this.open=!0,ua.add(this),Pr(this),this.syncAriaAttributes(),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("pointerdown",this.handleDocumentPointerDown),document.addEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("hide"),await vt(this.menu,"show");const n=this.getItems();n.length>0&&(n.forEach((o,a)=>o.active=a===0),n[0].focus({preventScroll:!0})),this.dispatchEvent(new Bo)}async hideMenu(){if(!this.popup||!this.menu)return;const e=new Io({source:this});if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}this.open=!1,ua.delete(this),bo(this),this.syncAriaAttributes(),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),document.removeEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("show"),await vt(this.menu,"hide"),this.popup.active=this.open,this.dispatchEvent(new Ho)}handleMenuClick(e){const t=e.target.closest("wa-dropdown-item");if(!(!t||t.disabled)){if(t.hasSubmenu){t.submenuOpen||(this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),t.submenuOpen=!0),e.stopPropagation();return}this.makeSelection(t,e)}}async handleMenuSlotChange(){const e=this.getItems(!0);await Promise.all(e.map(o=>o.updateComplete)),this.syncItemSizes();const t=e.some(o=>o.type==="checkbox"),n=e.some(o=>o.hasSubmenu);e.forEach((o,a)=>{o.setAttribute("aria-posinset",String(a+1)),o.setAttribute("aria-setsize",String(e.length)),o.active=a===0,o.checkboxAdjacent=t,o.submenuAdjacent=n})}handleTriggerClick(){this.open=!this.open}handleSubmenuOpening(e){const t=e.detail.item;this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),this.setupSubmenuPosition(t),this.processSubmenuItems(t)}setupSubmenuPosition(e){if(!e.submenuElement)return;this.cleanupSubmenuPosition(e);const t=Yr(e,e.submenuElement,()=>{this.positionSubmenu(e),this.updateSafeTriangleCoordinates(e)});this.submenuCleanups.set(e,t);const n=e.submenuElement.querySelector('slot[name="submenu"]');n&&(n.removeEventListener("slotchange",Qe.handleSubmenuSlotChange),n.addEventListener("slotchange",Qe.handleSubmenuSlotChange),Qe.handleSubmenuSlotChange({target:n}))}static handleSubmenuSlotChange(e){const t=e.target;if(!t)return;const n=t.assignedElements().filter(s=>s.localName==="wa-dropdown-item");if(n.length===0)return;const o=n.some(s=>s.hasSubmenu),a=n.some(s=>s.type==="checkbox");n.forEach(s=>{s.submenuAdjacent=o,s.checkboxAdjacent=a})}processSubmenuItems(e){if(!e.submenuElement)return;const t=this.getSubmenuItems(e,!0),n=t.some(o=>o.hasSubmenu);t.forEach(o=>{o.submenuAdjacent=n})}cleanupSubmenuPosition(e){const t=this.submenuCleanups.get(e);t&&(t(),this.submenuCleanups.delete(e))}positionSubmenu(e){if(!e.submenuElement)return;const n=this.localize.dir()==="rtl"?"left-start":"right-start";Zr(e,e.submenuElement,{placement:n,middleware:[Gr({mainAxis:0,crossAxis:-5}),Qr({fallbackStrategy:"bestFit"}),Xr({padding:8,crossAxis:!0})]}).then(({x:o,y:a,placement:s})=>{e.submenuElement.setAttribute("data-placement",s),Object.assign(e.submenuElement.style,{left:`${o}px`,top:`${a}px`})})}updateSafeTriangleCoordinates(e){if(!e.submenuElement||!e.submenuOpen)return;if(document.activeElement?.matches(":focus-visible")){e.submenuElement.style.setProperty("--safe-triangle-visible","none");return}e.submenuElement.style.setProperty("--safe-triangle-visible","block");const n=e.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl";e.submenuElement.style.setProperty("--safe-triangle-submenu-start-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-start-y",`${n.top}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-y",`${n.bottom}px`)}makeSelection(e,t){const n=this.getTrigger();if(e.disabled)return;e.type==="checkbox"&&(e.checked=!e.checked);const o=new Ml({item:e});this.dispatchEvent(o),o.defaultPrevented||(e.navigate(t),this.open=!1,n?.focus({preventScroll:!0}))}async syncAriaAttributes(){const e=this.getTrigger();let t;e&&(e.localName==="wa-button"?(await customElements.whenDefined("wa-button"),await e.updateComplete,t=e.shadowRoot.querySelector('[part~="base"]')):t=e,t.hasAttribute("id")||t.setAttribute("id",ts("wa-dropdown-trigger-")),t.setAttribute("aria-haspopup","menu"),t.setAttribute("aria-expanded",this.open?"true":"false"),this.menu?.setAttribute("aria-expanded","false"))}render(){let e=this.didSSR&&!this.hasUpdated?this.open:this.popup?.active;return J`
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
    `}};Qe.css=[Bn,Ol];v([Ee("slot:not([name])")],Qe.prototype,"defaultSlot",2);v([Ee("#menu")],Qe.prototype,"menu",2);v([Ee("wa-popup")],Qe.prototype,"popup",2);v([B({type:Boolean,reflect:!0})],Qe.prototype,"open",2);v([B({reflect:!0})],Qe.prototype,"size",2);v([bt("size")],Qe.prototype,"handleSizeChange",1);v([B({reflect:!0})],Qe.prototype,"placement",2);v([B({type:Number})],Qe.prototype,"distance",2);v([B({type:Number})],Qe.prototype,"skidding",2);Qe=v([Ge("wa-dropdown")],Qe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var bc=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pe=class extends it{constructor(){super(...arguments),this.hasSlotController=new Hn(this,"[default]","start","end"),this.active=!1,this.variant="default",this.size="m",this.checkboxAdjacent=!1,this.submenuAdjacent=!1,this.type="normal",this.checked=!1,this.disabled=!1,this.submenuOpen=!1,this.hasSubmenu=!1,this.handleSlotChange=()=>{this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState(),this.hasSubmenu?(this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",this.submenuOpen?"true":"false")):(this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"))},this.handleHostClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handleClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handlePointerEnter=e=>{e.pointerType==="mouse"&&this.hasSubmenu&&!this.disabled&&(this.notifyParentOfOpening(),this.submenuOpen=!0)}}handleSizeChange(){Sn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener?.("click",this.handleHostClick),this.addEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.addEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}disconnectedCallback(){super.disconnectedCallback(),this.closeSubmenu(),this.removeEventListener?.("click",this.handleHostClick),this.removeEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.removeEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}firstUpdated(e){super.firstUpdated(e),this.setAttribute("tabindex","-1"),this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState()}updated(e){e.has("active")&&(this.setAttribute("tabindex",this.active?"0":"-1"),this.customStates.set("active",this.active)),e.has("checked")&&(this.type==="checkbox"?this.setAttribute("aria-checked",this.checked?"true":"false"):this.removeAttribute("aria-checked"),this.customStates.set("checked",this.checked)),e.has("disabled")&&(this.setAttribute("aria-disabled",this.disabled?"true":"false"),this.customStates.set("disabled",this.disabled)),e.has("type")&&(this.type==="checkbox"?(this.setAttribute("role","menuitemcheckbox"),this.setAttribute("aria-checked",this.checked?"true":"false")):(this.setAttribute("role","menuitem"),this.removeAttribute("aria-checked"))),(e.has("href")||e.has("hasSubmenu"))&&this.customStates.set("link",this.isLink()),e.has("submenuOpen")&&(this.customStates.set("submenu-open",this.submenuOpen),this.submenuOpen?this.openSubmenu():this.closeSubmenu())}updateHasSubmenuState(){this.customStates.set("has-submenu",this.hasSubmenu)}async openSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||!this.isConnected||(this.notifyParentOfOpening(),e.showPopover?.(),e.hidden=!1,e.setAttribute("data-visible",""),this.submenuOpen=!0,this.setAttribute("aria-expanded","true"),await vt(e,"show"),setTimeout(()=>{const t=this.getSubmenuItems();t.length>0&&(t.forEach((n,o)=>n.active=o===0),t[0].focus({preventScroll:!0}))},0))}notifyParentOfOpening(){const e=new CustomEvent("submenu-opening",{bubbles:!0,composed:!0,detail:{item:this}});this.dispatchEvent(e);const t=this.parentElement;t&&[...t.children].filter(o=>o!==this&&o.localName==="wa-dropdown-item"&&o.getAttribute("slot")===this.getAttribute("slot")&&o.submenuOpen).forEach(o=>{o.submenuOpen=!1})}async closeSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||(this.submenuOpen=!1,this.setAttribute("aria-expanded","false"),e.hidden||(await vt(e,"hide"),e?.isConnected&&(e.hidden=!0,e.removeAttribute("data-visible"),e.hidePopover?.())))}isLink(){return!!this.href&&!this.hasSubmenu}navigate(e){const t=this.linkElement;!this.isLink()||this.disabled||!t||t.dispatchEvent(new MouseEvent("click",{bubbles:!1,cancelable:!0,composed:!1,altKey:e?.altKey??!1,ctrlKey:e?.ctrlKey??!1,metaKey:e?.metaKey??!1,shiftKey:e?.shiftKey??!1}))}getSubmenuItems(){return[...this.children].filter(e=>e.localName==="wa-dropdown-item"&&e.getAttribute("slot")==="submenu"&&!e.hasAttribute("disabled"))}render(){return J`
      ${this.href?J`
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
      ${this.type==="checkbox"?J`
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

      ${this.hasSubmenu?J`
            <wa-icon
              id="submenu-indicator"
              part="submenu-icon"
              exportparts="svg:submenu-icon__svg"
              library="system"
              name="chevron-right"
            ></wa-icon>
          `:""}
      ${this.hasSubmenu?J`
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
    `}};Pe.css=bc;v([Ee("#submenu")],Pe.prototype,"submenuElement",2);v([Ee("#link")],Pe.prototype,"linkElement",2);v([B({type:Boolean})],Pe.prototype,"active",2);v([B({reflect:!0})],Pe.prototype,"variant",2);v([B({reflect:!0})],Pe.prototype,"size",2);v([bt("size")],Pe.prototype,"handleSizeChange",1);v([B({attribute:"checkbox-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"checkboxAdjacent",2);v([B({attribute:"submenu-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"submenuAdjacent",2);v([B()],Pe.prototype,"value",2);v([B({reflect:!0})],Pe.prototype,"type",2);v([B({type:Boolean})],Pe.prototype,"checked",2);v([B({type:Boolean,reflect:!0})],Pe.prototype,"disabled",2);v([B({type:Boolean,reflect:!0})],Pe.prototype,"submenuOpen",2);v([B({reflect:!0})],Pe.prototype,"href",2);v([B()],Pe.prototype,"target",2);v([B()],Pe.prototype,"rel",2);v([B()],Pe.prototype,"download",2);v([en()],Pe.prototype,"hasSubmenu",2);Pe=v([Ge("wa-dropdown-item")],Pe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var yc=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var vc=Ke`
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
`;function kc(e){return $c(e)}function ha(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function $c(e){for(let t=e;t;t=ha(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=ha(e);t;t=ha(t)){if(!(t instanceof Element))continue;const n=getComputedStyle(t);if(n.display!=="contents"&&(n.position!=="static"||Uo(n)||t.tagName==="BODY"))return t}return null}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function As(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var xc=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),Se=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){const e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let o=0,a=0,s=0,r=0,i=0,l=0,c=0,d=0;n?e.top<t.top?(o=e.left,a=e.bottom,s=e.right,r=e.bottom,i=t.left,l=t.top,c=t.right,d=t.top):(o=t.left,a=t.bottom,s=t.right,r=t.bottom,i=e.left,l=e.top,c=e.right,d=e.top):e.left<t.left?(o=e.right,a=e.top,s=t.left,r=t.top,i=e.right,l=e.bottom,c=t.left,d=t.bottom):(o=t.right,a=t.top,s=e.left,r=e.top,i=t.right,l=t.bottom,c=e.left,d=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${a}px`),this.style.setProperty("--hover-bridge-top-right-x",`${s}px`),this.style.setProperty("--hover-bridge-top-right-y",`${r}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${i}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${d}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=xc,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||As(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Yr(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;const e=[Gr({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(Es({apply:({rects:o})=>{const a=this.sync==="width"||this.sync==="both",s=this.sync==="height"||this.sync==="both";this.popup.style.width=a?`${o.reference.width}px`:"",this.popup.style.height=s?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!As(this.anchor)&&this.boundary==="scroll"&&(t=On(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(Qr({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Xr({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(Es({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:a})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${a}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(wc({element:this.arrowEl,padding:this.arrowPadding}));const n=this.SUPPORTS_POPOVER?o=>po.getOffsetParent(o,kc):po.getOffsetParent;Zr(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...po,getOffsetParent:n}}).then(({x:o,y:a,middlewareData:s,placement:r})=>{const i=this.localize.dir()==="rtl",l={top:"bottom",right:"left",bottom:"top",left:"right"}[r.split("-")[0]];if(this.setAttribute("data-current-placement",r),Object.assign(this.popup.style,{left:`${o}px`,top:`${a}px`}),this.arrow){const c=s.arrow.x,d=s.arrow.y;let u="",g="",p="",f="";if(this.arrowPlacement==="start"){const y=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",g=i?y:"",f=i?"":y}else if(this.arrowPlacement==="end"){const y=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";g=i?"":y,f=i?y:"",p=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(f=typeof c=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof d=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(f=typeof c=="number"?`${c}px`:"",u=typeof d=="number"?`${d}px`:"");Object.assign(this.arrowEl.style,{top:u,right:g,bottom:p,left:f,[l]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new yc)}render(){return J`
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
        ${this.arrow?J`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};Se.css=vc;v([Ee(".popup")],Se.prototype,"popup",2);v([Ee(".arrow")],Se.prototype,"arrowEl",2);v([B({attribute:!1,type:Boolean})],Se.prototype,"SUPPORTS_POPOVER",2);v([B()],Se.prototype,"anchor",2);v([B({type:Boolean,reflect:!0})],Se.prototype,"active",2);v([B({reflect:!0})],Se.prototype,"placement",2);v([B()],Se.prototype,"boundary",2);v([B({type:Number})],Se.prototype,"distance",2);v([B({type:Number})],Se.prototype,"skidding",2);v([B({type:Boolean})],Se.prototype,"arrow",2);v([B({attribute:"arrow-placement"})],Se.prototype,"arrowPlacement",2);v([B({attribute:"arrow-padding",type:Number})],Se.prototype,"arrowPadding",2);v([B({type:Boolean})],Se.prototype,"flip",2);v([B({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],Se.prototype,"flipFallbackPlacements",2);v([B({attribute:"flip-fallback-strategy"})],Se.prototype,"flipFallbackStrategy",2);v([B({type:Object})],Se.prototype,"flipBoundary",2);v([B({attribute:"flip-padding",type:Number})],Se.prototype,"flipPadding",2);v([B({type:Boolean})],Se.prototype,"shift",2);v([B({type:Object})],Se.prototype,"shiftBoundary",2);v([B({attribute:"shift-padding",type:Number})],Se.prototype,"shiftPadding",2);v([B({attribute:"auto-size"})],Se.prototype,"autoSize",2);v([B()],Se.prototype,"sync",2);v([B({type:Object})],Se.prototype,"autoSizeBoundary",2);v([B({attribute:"auto-size-padding",type:Number})],Se.prototype,"autoSizePadding",2);v([B({attribute:"hover-bridge",type:Boolean})],Se.prototype,"hoverBridge",2);Se=v([Ge("wa-popup")],Se);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Sc=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Nn=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${bs(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${bs(this.value,0,100)}%`)}),super.updated(e)}render(){return J`
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
          ${this.indeterminate?"":J` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};Nn.css=Sc;v([B({type:Number,reflect:!0})],Nn.prototype,"value",2);v([B({type:Boolean,reflect:!0})],Nn.prototype,"indeterminate",2);v([B()],Nn.prototype,"label",2);Nn=v([Ge("wa-progress-bar")],Nn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var _c=Ke`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Dt=class extends it{constructor(){super(...arguments),this.localize=new Tt(this),this.resizeObserver=null,this.canScroll=!1,this.orientation="horizontal",this.withoutScrollbar=!1,this.withoutShadow=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.updateScroll()),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}handleKeyDown(e){e.key==="Home"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?0:void 0,top:this.orientation==="vertical"?0:void 0})),e.key==="End"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?this.content.scrollWidth:void 0,top:this.orientation==="vertical"?this.content.scrollHeight:void 0}))}handleSlotChange(){this.updateScroll()}updateScroll(){if(this.orientation==="horizontal"){const e=Math.ceil(this.content.clientWidth),t=Math.abs(Math.ceil(this.content.scrollLeft)),o=Math.ceil(this.content.scrollWidth)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}else{const e=Math.ceil(this.content.clientHeight),t=Math.abs(Math.ceil(this.content.scrollTop)),o=Math.ceil(this.content.scrollHeight)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}}render(){return J`
      ${this.withoutShadow?"":J`
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
    `}};Dt.css=[_c];v([Ee("#content")],Dt.prototype,"content",2);v([en()],Dt.prototype,"canScroll",2);v([B({reflect:!0})],Dt.prototype,"orientation",2);v([B({attribute:"without-scrollbar",type:Boolean,reflect:!0})],Dt.prototype,"withoutScrollbar",2);v([B({attribute:"without-shadow",type:Boolean,reflect:!0})],Dt.prototype,"withoutShadow",2);v([al({passive:!0})],Dt.prototype,"updateScroll",1);Dt=v([Ge("wa-scroller")],Dt);const ro=["People","Routines","Rooms","Temperatures","Result"],$o=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],Cc=Object.fromEntries($o.map(e=>[e.slice(0,3),e])),Ec=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"]],ei=[["shared","Shared","Warm while its people are up and at home, and first thing in the morning even if they then go out."],["bedroom","Bedroom","Warm when its people get up and in the run-up to bed."],["office","Office","Warm while its people work from home."],["while_home","While anyone is home","Warm whenever its people are up and at home, working or not."],["all_day","All day","Warm from the first of its people getting up to the last going to bed, home or not."]],ti={weekdays:{up:"07:00",bed:"22:30",periods:[{type:"out",from:"08:30",to:"17:30"}]},weekend:{up:"08:30",bed:"23:00",periods:[]}},rs=e=>JSON.parse(JSON.stringify(e));function un(e,{end:t=!1}={}){const n=String(e??"").trim().replace(".",":");let o,a,s=n.match(/^(\d{1,2}):(\d{2})$/);if(s)[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})(\d{2})$/))[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})$/))[o,a]=[Number(s[1]),0];else return null;return a>59||o>24||o===24&&(a>0||!t)?null:`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function Ac(e,t){const n=String(e??"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,32)||"person",o=new Set(t);if(n!=="person"&&!o.has(n))return n;for(let a=1;;a++){const s=`${n}_${a}`;if(!o.has(s))return s}}function ni(e,t=""){const n=t||`Person ${e.people.length+1}`,o=Ac(n,e.people.map(a=>a.id));return e.people.push({id:o,name:n,...rs(ti),weekendSame:!1,getting_up_min:null,bedtime_min:null,weekend_days:null,ha_person:null}),o}const Oa=e=>e?.ha_persons?.persons??null;function oi(e,t,n=[]){const o=String(e??"").trim().toLocaleLowerCase();if(!o||!t)return null;const a=t.filter(s=>String(s.name??"").trim().toLocaleLowerCase()===o&&!n.includes(s.entity_id));return a.length===1?a[0].entity_id:null}function Tc(e,t){if(!(!t||e.people.some(n=>n.ha_person)))for(const n of e.people){const o=e.people.map(a=>a.ha_person).filter(Boolean);n.ha_person=oi(n.name,t,o)}}function Rc(e,t){const n=e.map(a=>a.name),o=[["","Not linked"]];for(const a of e){const s=n.indexOf(a.name)!==n.lastIndexOf(a.name);o.push([a.entity_id,s?`${a.name} (${a.entity_id})`:a.name])}return t&&!e.some(a=>a.entity_id===t)&&o.push([t,`${t}, not in Home Assistant now`]),o}const Ts=e=>e?`Linked people count as away once Home Assistant has said they're out for ${Yn(e)}.`:"Linked people count as away as soon as Home Assistant says they're out.";function Lc(e,t){e.people=e.people.filter(n=>n.id!==t);for(const n of e.rooms)n.people&&(n.people=n.people.filter(o=>o!==t),n.people.length||(n.people=null,n.kind==="office"&&(n.kind="shared")))}const Mc=(e,t)=>e.rooms.find(n=>!n.own&&n.kind==="office"&&n.people?.includes(t))?.id??null;function Oc(e,t,n){for(const s of e.rooms)s.kind!=="office"||!s.people?.includes(t)||s.id===n||(s.people=s.people.filter(r=>r!==t),s.people.length||(s.people=null,s.kind="shared"));if(n==null)return;const o=e.rooms.find(s=>s.id===n);if(!o)return;o.own=!1;const a=o.kind==="office"?o.people??[]:[];o.kind="office",o.use==="unused"&&(o.use="in_use"),o.people=[...new Set([...a,t])]}const Nc=e=>[e.weekdays,...e.weekendSame?[]:[e.weekend]].some(t=>t.periods.some(n=>n.type==="work"));function Rs(e){const t=o=>o==null?[]:Array.isArray(o)?o:[o],n=[];for(const o of["out","work"])for(const a of t(e?.[o])){const[s,r]=String(a).split("-");n.push({type:o,from:s??"",to:r??""})}return n.sort((o,a)=>o.from.localeCompare(a.from)),{up:e?.up??"07:00",bed:e?.bed??"22:30",periods:n}}const Ls=e=>(e??[]).map(t=>Cc[String(t).toLowerCase().slice(0,3)]??t);function Ms(e){const t=e.household,n=e.defaults,o={people:[],rooms:[],temperatures:{...n.temperatures,...t?.temperatures??{}},timing:{...n.timing,...t?.timing??{}},away:{...n.away,...t?.away??{}},weekend_days:Ls(t?.weekend_days??n.weekend_days)};if(t)for(const[a,s]of Object.entries(t.people??{}))o.people.push({id:a,name:s.name??a.replace(/_/g," ").replace(/^./,r=>r.toUpperCase()),weekdays:Rs(s.weekdays),weekend:Rs(s.weekend??s.weekdays),weekendSame:s.weekend==null,getting_up_min:s.getting_up_min??null,bedtime_min:s.bedtime_min??null,weekend_days:s.weekend_days?Ls(s.weekend_days):null,ha_person:s.ha_person??null});else ni(o);Tc(o,Oa(e));for(const a of e.rooms){const s=t?.rooms?.[a.id],r={id:a.id,name:a.name,schedule:a.schedule,own:!1,use:"in_use",weekendUse:"in_use",weekendDifferent:!1,kind:"shared",people:null,temperature:null,night_temperature:null,unused_temperature:null,preheat_min:null,adjust:[]};if(s){const i=s.use;r.use=typeof i=="object"?i.weekdays:i,r.weekendUse=typeof i=="object"?i.weekend:i,r.weekendDifferent=typeof i=="object"&&i.weekdays!==i.weekend,r.kind=s.kind??"shared",r.people=s.people??null;for(const l of["temperature","night_temperature","unused_temperature","preheat_min"])r[l]=s[l]??null;r.adjust=rs(s.adjust??[])}else t&&a.schedule?r.own=!0:!t&&/bed/i.test(a.name)&&(r.kind="bedroom");o.rooms.push(r)}return o}const xo=(e,t=!1)=>un(e,{end:t})??String(e??""),zc=e=>`${xo(e.from)}-${xo(e.to,!0)}`;function Os(e){const t={up:xo(e.up)};for(const n of["out","work"]){const o=e.periods.filter(a=>a.type===n).map(zc);o.length&&(t[n]=o)}return t.bed=xo(e.bed,!0),t}function Ns(e){const t=e.people.map(a=>a.id),n={};for(const a of e.people){const s={name:a.name,weekdays:Os(a.weekdays)};a.weekendSame||(s.weekend=Os(a.weekend)),a.getting_up_min!=null&&(s.getting_up_min=a.getting_up_min),a.bedtime_min!=null&&(s.bedtime_min=a.bedtime_min),a.weekend_days!=null&&(s.weekend_days=[...a.weekend_days]);const r=String(a.ha_person??"").trim();r&&(s.ha_person=r),n[a.id]=s}const o={};for(const a of e.rooms){if(a.own)continue;const s={use:a.weekendDifferent&&a.weekendUse!==a.use?{weekdays:a.use,weekend:a.weekendUse}:a.use};a.kind!=="shared"&&(s.kind=a.kind),a.people!=null?s.people=[...a.people]:(a.kind==="bedroom"||a.kind==="office")&&(s.people=[...t]);for(const r of["temperature","night_temperature","unused_temperature","preheat_min"])a[r]!=null&&(s[r]=a[r]);a.adjust?.length&&(s.adjust=rs(a.adjust)),o[a.id]=s}return{weekend_days:[...e.weekend_days],timing:{...e.timing},away:{...e.away},temperatures:{...e.temperatures},people:n,rooms:o}}function fo(e,t){const n={out:0,work:0};return t.map(o=>`${e}.${o.type}[${n[o.type]++}]`)}function Pc(e,t){let n=null;for(const o of e)t!==o&&!t.startsWith(`${o}.`)&&!t.startsWith(`${o}[`)||(!n||o.length>n.length)&&(n=o);return n}function zs(e,t){const n=t.split(".");if(n[0]!=="household")return{step:4,person:0};const o=(n[1]??"").replace(/\[.*$/,"");if(o==="people"){const a=Math.max(0,e.people.findIndex(s=>s.id===n[2]));return n.length<=3||n[3]==="name"||n[3]==="ha_person"?{step:0,person:a}:{step:1,person:a}}return o==="away"?{step:0,person:0}:o==="rooms"?{step:2,person:0}:o==="temperatures"||o==="timing"||o==="weekend_days"?{step:3,person:0}:{step:4,person:0}}function Dc(e){const t=[];for(const n of e.people)for(const o of n.weekendSame?["weekdays"]:["weekdays","weekend"]){const a=n[o],s=`household.people.${n.id}.${o}`;un(a.up)||t.push({path:`${s}.up`,message:"Enter a time such as 07:30"}),un(a.bed,{end:!0})||t.push({path:`${s}.bed`,message:"Enter a time such as 22:30"}),fo(s,a.periods).forEach((r,i)=>{const{from:l,to:c}=a.periods[i];(!un(l)||!un(c,{end:!0}))&&t.push({path:r,message:"Enter both times, such as 08:30 and 17:30"})})}return t}const qc=e=>ei.find(t=>t[0]===e)?.[2]??"",Ic=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,io=(e,t)=>typeof e=="number"&&e<t?`Below ${t}° walls and window frames can get damp, especially in older houses.`:"";function Yn(e,t=null){if(t!=null&&e===t)return"off";if(e<60)return`${e} min`;const n=e%60;return n?`${Math.floor(e/60)} h ${n} min`:`${e/60} h`}const Hc=e=>e.length?Ic($o.filter(t=>e.includes(t)).map(t=>t[0].toUpperCase()+t.slice(1))):"no days";function Bc(e){const t=e.reduce((o,a)=>o+(a.notes?.length??0),0);return t?`${t===1?"1 warm period is":`${t} warm periods are`} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`:""}const Gt=1440,zn=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],Fc=34,hn=15,Na=zn.map(e=>e.slice(0,3).toLowerCase()),jc=["00:00","06:00","12:00","18:00","24:00"],is=e=>`${Number.isInteger(e)?e:e.toFixed(1)}°`,rt=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ut=e=>`${e/Gt*100}%`,ls=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`;function Wc(e,t=null){const n=[];for(const o of e)for(const a of o.days)for(const s of a.transitions)n.push(s.setpoint);return t&&n.push(...Object.values(t).filter(o=>typeof o=="number")),n.length?{low:Math.min(...n),high:Math.max(...n)}:{low:0,high:0}}function Uc(e){let t=1/0;for(const n of e.days)for(const o of n.transitions)t=Math.min(t,o.setpoint);return Number.isFinite(t)?t:0}function Vc(e,t,n=t.low){const o=[...e].filter(r=>r.minute>=0&&r.minute<Gt).sort((r,i)=>r.minute-i.minute);if(!o.length)return[];o[0].minute>0&&o.unshift({minute:0,setpoint:o.at(-1).setpoint});const a=[];o.forEach((r,i)=>{const l=i+1<o.length?o[i+1].minute:Gt;if(l<=r.minute)return;const c=a.at(-1);c&&c.setpoint===r.setpoint?c.end=l:a.push({start:r.minute,end:l,setpoint:r.setpoint})});const s=t.high-t.low;return a.map(r=>({...r,warm:r.setpoint>n,level:s>0?Math.min(1,Math.max(0,(r.setpoint-t.low)/s)):1}))}function Kc(e,t){const n=[];let o=0;for(const a of e){if(!a.warm)continue;const s=Math.min(Math.max(a.start,o),Gt-t);s<o||s>=a.end||(n.push({minute:s,text:is(a.setpoint)}),o=s+t)}return n}const Jc=(e,t)=>t<e.minute?(e.weekday+1)%7:e.weekday;function Yc(e){if(!e)return[];const t=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"],["night","Night"]],n=new Map;for(const[o,a]of t){const s=e[o];typeof s=="number"&&n.set(s,[...n.get(s)??[],a])}return[...n.entries()].sort((o,a)=>a[0]-o[0]).map(([o,a])=>({label:ls(a.map((s,r)=>r?s.toLowerCase():s)),setpoint:o}))}const Gc=e=>`Usually ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`,Xc=(e,t=hn)=>Math.round(e/t)*t,lo=e=>Number(e.slice(0,2))*60+Number(e.slice(3,5)),Ps=(e,t)=>Math.min(t.max,Math.max(t.min,Xc(e)));function Qc(e,t,n){const o=e[t];return n==="start"?{min:t>0?e[t-1].end:0,max:o.end-hn}:{min:o.start+hn,max:t+1<e.length?e[t+1].start:Gt}}function Zc(e,t){const n=a=>JSON.stringify([a.transitions,a.periods??[]]),o=n(e.days[t]);return e.days.flatMap((a,s)=>n(a)===o?[s]:[])}function ed(e){if(e.length===7)return"Every day";const t=a=>zn[a].slice(0,3),n=[];for(const a of[...e].sort((s,r)=>s-r)){const s=n.at(-1);s&&a===s[1]+1?s[1]=a:n.push([a,a])}const o=[];for(const[a,s]of n)if(s-a>=2)o.push(`${t(a)} to ${t(s)}`);else for(let r=a;r<=s;r++)o.push(t(r));return ls(o)}function td(e,t=["saturday","sunday"]){const n=[...new Set(e)].sort((s,r)=>s-r),o=zn.flatMap((s,r)=>t.includes(s.toLowerCase())?[r]:[]),a=s=>s.length===n.length&&s.every((r,i)=>r===n[i]);return n.length===7?"daily":a(o)?"weekend":a([0,1,2,3,4,5,6].filter(s=>!o.includes(s)))?"weekdays":n.length===1?Na[n[0]]:n.map(s=>Na[s])}function nd(e,t,n){if(n===t)return null;const o=n>t;return e==="end"?o?{keep:"warm",from:t,to:n}:{keep:"cold",from:n,to:t}:o?{keep:"cold",from:t,to:n}:{keep:"warm",from:n,to:t}}function Ds(e,t){const n=i=>JSON.stringify([i.days].flat());let o=lo(t.from),a=lo(t.to);const s=[];let r=!1;for(const i of e??[]){if(n(i)!==n(t)){s.push(i);continue}const l=lo(i.from),c=lo(i.to);if(i.keep===t.keep){if(l<=a&&c>=o){o=Math.min(o,l),a=Math.max(a,c);continue}s.push(i)}else l<a&&c>o?(l===o&&c===a&&(r=!0),l<o&&s.push({...i,to:rt(o)}),c>a&&s.push({...i,from:rt(a)})):s.push(i)}return r?s:[...s,{...t,from:rt(o),to:rt(a)}]}function pa(e,t,n){const o=JSON.parse(JSON.stringify(e)),a=o?.rooms?.[t];if(!a)throw new Error(`${t} is not in the household`);const s=n(a.adjust??[]);return s.length?a.adjust=s:delete a.adjust,o}const od=(e,t,n,o)=>`${e}, ${t}, warm ${n==="end"?"until":"from"} ${rt(o)}`,ad=(e,t,n,o)=>`${e}: warm ${t==="end"?"until":"from"} ${rt(o)}, not ${rt(n)}.`,sd=e=>`Without adjustments: ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`;function qs(e){return e?.saved_at?e.source==="house_file"?`Saving copies the household, with this change, to ${e.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`:"":"In the demo, changes last until you close the page."}const rd=[["daily","Every day"],["weekdays","Weekdays"],["weekend","Weekend"],...zn.map((e,t)=>[Na[t],e])];function id(e,t=""){const n=` ${t} `;if(e==="button")return document.createElement("button");if(n.includes(" card "))return document.createElement("wa-card");if(n.includes(" badge ")){const o=document.createElement("wa-badge");return o.setAttribute("variant","neutral"),o.setAttribute("appearance","outlined"),o}return document.createElement(e)}const ld=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s",ce=(e,t,n)=>{const o=id(e,t);return t&&(o.className=e==="button"&&/\b(btn|link)\b/.test(t)?`${t} ${ld(t)}`:t),n!=null&&(o.textContent=n),o};function cd(e,t,n,o){const a=ce("li","week-day");a.append(ce("span","week-dname",zn[t].slice(0,3)));const s=ce("div","week-lane"),r=ce("div","week-labels");r.setAttribute("aria-hidden","true");const i=ce("div","week-track");i.setAttribute("role","img"),a.day={name:zn[t],text:e.text};for(const l of n){if(!l.warm)continue;const c=ce("i","week-block");c.style.left=ut(l.start),c.style.width=ut(l.end-l.start),c.style.setProperty("--level",l.level.toFixed(3)),c.title=`${is(l.setpoint)} ${rt(l.start)} to ${rt(l.end)}`,c.dataset.start=String(l.start),c.dataset.end=String(l.end),i.append(c)}for(const l of e.adjusted??[]){const c=ce("i","week-adj");c.dataset.keep=l.keep,c.style.left=ut(l.start),c.style.width=ut(l.end-l.start),i.append(c)}return s.append(r,i),a.append(s),a.segments=n,ai(a,o),a}function ai(e,t){t?e.setAttribute("aria-current","date"):e.removeAttribute("aria-current");const n=`${e.day.name}${t?", today":""}: ${e.day.text}`;e.querySelector(".week-track").setAttribute("aria-label",n)}function Is(e){const n=e.querySelector(".week-track")?.getBoundingClientRect().width??0;if(!n)return;const o=Math.ceil(Fc/n*Gt);if(e.dataset.labelMin!==String(o)){e.dataset.labelMin=String(o);for(const a of e.querySelectorAll(".week-day")){const s=a.querySelector(".week-labels");s.textContent="";for(const r of Kc(a.segments,o)){const i=ce("span",null,r.text);i.style.left=ut(r.minute),s.append(i)}}}}function dd(e,t,n){const o=ce("article","card week");o.dataset.away=String(!!e.away);const a=ce("header");a.append(ce("h3","name",e.name)),a.append(ce("span","badge",e.source==="household"?"Household":"Hand-written")),o.append(a),e.away&&(o.append(ce("p","week-away",e.away.text)),o.append(ce("p","week-usual",Gc(e.away.usual))));const s=Uc(e),r=ce("ol","week-days");r.setAttribute("aria-label",`${e.name}, Monday to Sunday`),e.days.forEach((d,u)=>r.append(cd(d,u,Vc(d.transitions,t,s),u===n))),o.append(r);const i=ce("div","week-ticks");i.setAttribute("aria-hidden","true");for(const d of jc)i.append(ce("span",null,d));o.append(i);const l=ce("dl","week-summary");for(const d of e.summary){const u=ce("div");u.append(ce("dt",null,d.days),ce("dd",null,d.text)),l.append(u)}o.append(l);for(const d of e.notes)o.append(ce("p","flag",d));e.people.length&&o.append(ce("p","week-meta",`Depends on ${ls(e.people.map(d=>d.name))}.`));const c=ce("i","week-now");return c.setAttribute("aria-hidden","true"),o.append(c),o}const ln=(e,t,n="button")=>{const o=ce("button",e,t);return o.type=n,o},fa=e=>{const t=String(e??"").trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function ud(e,t,n){const{editor:o}=n,a=[...e.querySelectorAll(".week-day")],s=[];let r=null,i=null,l=!1,c=0,d=null;const u=ce("div","week-edit"),g=ce("div","week-pending");g.hidden=!0;const p=ce("p","week-pending-what");p.setAttribute("aria-live","polite");const f=ce("p","week-pending-then");f.setAttribute("aria-live","polite");const y=ce("p","week-source"),h=ce("p","week-error");h.setAttribute("role","alert"),h.hidden=!0;const b=ln("btn btn-primary","Save"),w=ln("btn","Cancel"),$=ce("div","week-buttons");$.append(b,w),g.append(p,f,y,h,$),u.append(g);function R(z,oe){if(z.value=oe,z.style.left=ut(oe),z.getAttribute("role")!=="slider")return;const{label:te,edge:ue}=z.edit;z.setAttribute("aria-valuenow",String(oe)),z.setAttribute("aria-valuetext",rt(oe)),z.setAttribute("aria-label",od(t.name,te,ue,oe))}t.days.forEach((z,oe)=>{const te=z.periods??[];if(!te.length||t.away)return;const ue=Zc(t,oe),ye=ed(ue),Ie=a[oe].querySelector(".week-track");te.forEach((_e,De)=>{for(const qe of["start","end"]){const Me=ce("span","week-edge");Me.dataset.edge=qe,Me.dataset.key=`${ue[0]}:${De}:${qe}`,Me.edit={row:oe,group:ue,label:ye,periods:te,index:De,edge:qe,was:_e[qe],bounds:Qc(te,De,qe)},ue[0]===oe?(Me.tabIndex=0,Me.setAttribute("role","slider"),Me.setAttribute("aria-valuemin",String(Me.edit.bounds.min)),Me.setAttribute("aria-valuemax",String(Me.edit.bounds.max))):Me.setAttribute("aria-hidden","true"),R(Me,_e[qe]),Q(Me),Ie.append(Me),s.push(Me)}})});const E=z=>s.find(oe=>oe.dataset.key===z&&oe.tabIndex===0);function P(z,oe){const{group:te,periods:ue,index:ye,edge:Ie,row:_e}=z.edit,De=ue[ye],[qe,Me]=Ie==="start"?[oe,De.end]:[De.start,oe];for(const Rt of s)Rt.dataset.key===z.dataset.key&&R(Rt,oe);for(const Rt of te){const _n=a[Rt].querySelector(`.week-block[data-start="${De.start}"][data-end="${De.end}"]`);_n&&(_n.style.left=ut(qe),_n.style.width=ut(Me-qe)),a[Rt].dataset.editing="true"}let ge=e.querySelector(".week-drag-label");ge||(ge=ce("span","week-drag-label"),ge.setAttribute("aria-hidden","true"));const lt=a[_e].querySelector(".week-labels");ge.parentElement!==lt&&lt.append(ge),ge.textContent=rt(oe);const an=Number(e.dataset.labelMin||120)*1.4;ge.style.left=ut(Math.min(Gt-an,Math.max(0,oe-an/2)))}function Z(){for(const z of s)R(z,z.edit.was);for(const z of e.querySelectorAll(".week-block"))z.style.left=ut(Number(z.dataset.start)),z.style.width=ut(Number(z.dataset.end)-Number(z.dataset.start));for(const z of a)delete z.dataset.editing;e.querySelector(".week-drag-label")?.remove()}function Q(z){z.addEventListener("pointerdown",te=>{i||l||te.pointerType==="mouse"&&te.button!==0||(r&&r.h.dataset.key!==z.dataset.key&&D(),te.preventDefault(),z.setPointerCapture?.(te.pointerId),i={id:te.pointerId,h:z,rect:z.parentElement.getBoundingClientRect()},e.dataset.dragging="true")}),z.addEventListener("pointermove",te=>{if(!i||te.pointerId!==i.id||!i.rect.width)return;const ue=Ps((te.clientX-i.rect.left)/i.rect.width*Gt,z.edit.bounds);ue!==z.value&&P(z,ue)});const oe=(te,ue)=>{!i||te.pointerId!==i.id||(i=null,delete e.dataset.dragging,ue?ne(z,z.value,!1):r?P(r.h,r.now):D())};z.addEventListener("pointerup",te=>oe(te,!0)),z.addEventListener("pointercancel",te=>oe(te,!1)),z.addEventListener("keydown",te=>{const ue={ArrowLeft:-hn,ArrowDown:-hn,ArrowRight:hn,ArrowUp:hn,PageDown:-60,PageUp:60};let ye;if(te.key in ue)ye=Ps(z.value+ue[te.key],z.edit.bounds);else if(te.key==="Home")ye=z.edit.bounds.min;else if(te.key==="End")ye=z.edit.bounds.max;else if(te.key==="Enter"){te.preventDefault(),r&&m();return}else if(te.key==="Escape"){r&&(te.preventDefault(),D());return}else return;te.preventDefault(),r&&r.h.dataset.key!==z.dataset.key&&D(),P(z,ye),ne(z,ye,!0)})}function ne(z,oe,te){if(oe===z.edit.was){D();return}const{label:ue,edge:ye,was:Ie}=z.edit,_e=r?.h.dataset.key===z.dataset.key;r={h:z,now:oe,keyboard:te,info:_e?r.info:null},g.hidden=!1,p.textContent=ad(ue,ye,Ie,oe),f.textContent="Checking…",h.hidden=!0,b.disabled=!0,clearTimeout(d),d=setTimeout(q,te?400:0)}async function T(z){z.info??=await o.household();const{edge:oe,was:te,group:ue}=z.h.edit,ye=nd(oe,te,z.now),Ie={days:td(ue,n.weekend),keep:ye.keep,from:rt(ye.from),to:rt(ye.to)};return pa(z.info.household,t.id,_e=>Ds(_e,Ie))}function V(z){f.textContent="",h.textContent=z,h.hidden=!1,b.disabled=!0}async function q(){const z=++c,oe=r;if(!oe)return;let te;try{te=await o.preview(await T(oe))}catch{z===c&&V("Couldn't check the change. Check the connection and try again.");return}if(z!==c||oe!==r)return;if(y.textContent=qs(oe.info),y.hidden=!y.textContent,te.errors?.length){V(fa(te.errors[0].message));return}const ue=te.rooms.find(_e=>_e.id===t.id),ye=ue?ue.summary.map(_e=>`${_e.days}: ${_e.text}`).join("; "):"",Ie=(ue?.notes??[]).filter(_e=>!t.notes.includes(_e));f.textContent=[ye&&`${ye}.`,...Ie].filter(Boolean).join(" "),b.disabled=!1}async function m(){const z=r;if(!z)return;clearTimeout(d);const oe=++c;b.disabled=!0,f.textContent="Saving…",h.hidden=!0;let te=null;try{te=await o.save(await T(z))}catch{}if(oe!==c||z!==r)return;if(te?.status===200){r=null,n.saved(`Saved. ${t.name} follows its new week.${F(z.info)}`,z.keyboard?z.h.dataset.key:null);return}const ue=te?.status===400?te.body?.errors?.[0]?.message:null;V(ue?`Not saved. ${fa(ue)}`:"Not saved. Check the connection and try again."),b.disabled=!1}function D(){clearTimeout(d),c++;const z=r?.h.dataset.key;return r=null,Z(),g.hidden=!0,z}b.addEventListener("click",m),w.addEventListener("click",()=>E(D())?.focus()),g.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),E(D())?.focus())});const F=z=>z?.source==="house_file"&&z.saved_at?` The household is now kept in ${z.saved_at}; the house file isn't changed.`:"",N=ce("p","week-error");N.setAttribute("role","alert"),N.hidden=!0;async function W(z,oe){N.hidden=!0;let te=null,ue=null;try{te=await o.household(),ue=await o.save(pa(te.household,t.id,z))}catch{}if(ue?.status===200){n.saved(`${oe}${F(te)}`,null);return}N.textContent="Not saved. Check the connection and try again.",N.hidden=!1}const U=ce("div","week-adjust");if(t.adjust?.length){U.append(ce("h4",null,"Adjustments"));const z=ce("ul");t.adjust.forEach((oe,te)=>{const ue=ce("li"),ye=ln("link","Remove");ye.setAttribute("aria-label",`Remove: ${oe.text}`),ye.addEventListener("click",()=>W(Ie=>Ie.filter((_e,De)=>De!==te),`Removed. ${t.name} follows its new week.`)),ue.append(ce("span",null,oe.text),ye),z.append(ue)}),U.append(z),t.routine&&U.append(ce("p","week-usual",sd(t.routine)))}const ee=ce("div","week-actions"),se=ln("link","Adjust");if(se.setAttribute("aria-expanded","false"),se.setAttribute("aria-label",`Adjust ${t.name}`),ee.append(se),t.adjust?.length){const z=ln("link","Reset to routine");z.setAttribute("aria-label",`Reset ${t.name} to its routine`),z.addEventListener("click",()=>W(()=>[],`${t.name} is back to its routine.`)),ee.append(z)}U.append(ee,N);const de=ce("form","week-form");de.hidden=!0,de.noValidate=!0,de.id=`week-form-${t.id}`,se.setAttribute("aria-controls",de.id);const fe=(z,oe,te)=>{te.name=z,te.id=`${de.id}-${z}`;const ue=ce("div","week-field"),ye=ce("label",null,oe);return ye.htmlFor=te.id,ue.append(ye,te),ue},O=z=>{const oe=ce("select");for(const[te,ue]of z){const ye=ce("option",null,ue);ye.value=te,oe.append(ye)}return oe},k=z=>{const oe=ce("input","time");return Object.assign(oe,{type:"text",inputMode:"numeric",autocomplete:"off",spellcheck:!1,maxLength:5,placeholder:z}),oe.addEventListener("blur",()=>{const te=o.time?.(oe.value,{end:oe.name==="to"});te&&(oe.value=te)}),oe},S=O(rd),L=O([["warm","Warm"],["cold","Cold"]]),j=k("22:30"),X=k("23:00"),M=ce("div","week-fields");M.append(fe("days","Days",S),fe("keep","Keep it",L),fe("from","From",j),fe("to","To",X));const I=ce("p","week-source");I.hidden=!0;const K=ce("p","week-error");K.setAttribute("role","alert"),K.hidden=!0;const ae=ce("div","week-buttons"),ke=ln("btn btn-primary","Save","submit"),Le=ln("btn","Cancel");ae.append(ke,Le),de.append(M,I,K,ae);const Je={days:S,keep:L,from:j,to:X};function Ae(z,oe){for(const te of Object.values(Je))te.removeAttribute("aria-invalid");K.hidden=!oe,K.textContent=oe??"",z&&Je[z]&&(Je[z].setAttribute("aria-invalid","true"),Je[z].setAttribute("aria-describedby",K.id||=`${de.id}-error`))}function on(){de.hidden=!0,l=!1,se.setAttribute("aria-expanded","false"),Ae(null,null),se.focus()}return se.addEventListener("click",async()=>{if(l){on();return}r&&D(),l=!0,de.hidden=!1,se.setAttribute("aria-expanded","true"),S.focus();try{I.textContent=qs(await o.household())}catch{I.textContent=""}I.hidden=!I.textContent}),Le.addEventListener("click",on),de.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),on())}),de.addEventListener("submit",async z=>{z.preventDefault();const oe=(ge,lt)=>o.time?o.time(ge,lt):ge.trim()||null,te=oe(j.value),ue=oe(X.value,{end:!0});if(!te){Ae("from","Enter a time such as 22:30."),j.focus();return}if(!ue){Ae("to","Enter a time such as 23:00."),X.focus();return}Ae(null,null),ke.disabled=!0;const ye={days:S.value,keep:L.value,from:te,to:ue};let Ie=null,_e=null,De=0;try{Ie=await o.household();const ge=pa(Ie.household,t.id,lt=>{const an=Ds(lt,ye);return De=an.length-1,an});_e=await o.save(ge)}catch{}if(ke.disabled=!1,_e?.status===200){l=!1,n.saved(`Saved. ${t.name} follows its new week.${F(Ie)}`,null);return}const qe=_e?.status===400?_e.body?.errors?.[0]:null;if(!qe){Ae(null,"Not saved. Check the connection and try again.");return}const Me=qe.path.match(new RegExp(`\\.adjust\\[${De}\\]\\.(\\w+)$`));Ae(Me?.[1]??null,`Not saved. ${fa(qe.message)}`),Je[Me?.[1]]?.focus()}),U.append(de),u.append(U),e.insertBefore(u,e.querySelector(".week-meta")??e.querySelector(".week-now")),{busy:()=>!!(r||i||l),focus(z){(z&&E(z)||se).focus()}}}function si({list:e,legendEl:t,frostEl:n,hintEl:o=null}){const a=new Map;let s=null,r={low:0,high:0},i=null,l=["saturday","sunday"],c=null;const d=typeof ResizeObserver=="function"?new ResizeObserver(p=>{for(const f of p)Is(f.target)}):null;function u(p){if(!s)return;const f=Jc(s,p);for(const{card:y}of a.values()){const h=y.querySelector(".week-now"),b=y.querySelectorAll(".week-day");b.forEach(($,R)=>{$.hasAttribute("aria-current")!==(R===f)&&ai($,R===f)});const w=b[f]?.querySelector(".week-track");w&&(h.parentElement!==w&&w.append(h),h.style.left=ut(p))}}function g(p){t.textContent="";const f=Yc(p.levels);for(const h of f){const b=ce("span","week-key"),w=ce("i","week-swatch");w.setAttribute("aria-hidden","true"),w.dataset.base=String(h.setpoint<=r.low),w.style.setProperty("--level",(r.high>r.low?(h.setpoint-r.low)/(r.high-r.low):1).toFixed(3)),b.append(w,`${h.label} ${is(h.setpoint)}`),t.append(b)}const y=p.rooms.some(h=>h.days.some(b=>b.adjusted?.length));if(y){const h=ce("span","week-key"),b=ce("i","week-adj-swatch");b.setAttribute("aria-hidden","true"),h.append(b,"Adjusted"),t.append(h)}t.hidden=!f.length&&!y}return{update(p){s=p.now,l=p.weekend_days??l,r=Wc(p.rooms,p.levels),n.hidden=!p.frost,g(p);const f=new Set;let y=!1;p.rooms.forEach((h,b)=>{f.add(h.id);const w=!!i&&h.source==="household";y||=w&&!h.away&&h.days.some(Z=>Z.periods?.length);const $=JSON.stringify([h,r,w]),R=a.get(h.id);if(R?.key===$&&c?.room!==h.id||R?.edit?.busy())return;const E=dd(h,r,s.weekday);R?(d?.unobserve(R.card),R.card.replaceWith(E)):e.insertBefore(E,e.children[b]??null);const P={card:E,key:$,edit:null};w&&(P.edit=ud(E,h,{editor:i,weekend:l,saved(Z,Q){c={room:h.id,key:Q},i.saved(Z)}})),a.set(h.id,P),d?.observe(E),Is(E),c?.room===h.id&&(P.edit?.focus(c.key),c=null)});for(const[h,{card:b}]of a)f.has(h)||(d?.unobserve(b),b.remove(),a.delete(h));o&&(o.hidden=!y),u(s.minute)},tick(p){u(p)},setEditor(p){i=p}}}const za="radiate.householdDraft",je=e=>document.getElementById(e);function hd(e,t="",n=!1){const o=` ${t} `;if(e==="button"&&!n&&/\s(btn|link)\s/.test(o)){const a=document.createElement("wa-button");return o.includes(" btn-primary ")?a.setAttribute("variant","brand"):o.includes(" link ")?(a.setAttribute("appearance","plain"),a.setAttribute("size","s")):a.setAttribute("appearance","outlined"),o.includes(" link ")||a.setAttribute("size","s"),a}if(o.includes(" card "))return document.createElement("wa-card");if(o.includes(" badge ")){const a=document.createElement("wa-badge");return a.setAttribute("variant","neutral"),a.setAttribute("appearance","outlined"),a}return document.createElement(e)}const pd=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s";function Y(e,t={},...n){const o=Object.keys(t).some(s=>s.startsWith("aria-")),a=hd(e,t.class,o);a.localName==="button"&&/\b(btn|link)\b/.test(t.class??"")&&(t={...t,class:`${t.class} ${pd(t.class)}`});for(const[s,r]of Object.entries(t))r==null||r===!1||(s==="text"?a.textContent=r:s==="class"?a.className=r:s.startsWith("on")?a.addEventListener(s.slice(2),r):s in a&&typeof r!="string"?a[s]=r:a.setAttribute(s,r===!0?"":r));for(const s of n.flat())s!=null&&s!==!1&&a.append(s);return a}const $e=e=>`f-${e.replace(/[^a-z0-9]+/gi,"-")}`,Hs=e=>{const t=String(e).trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function fd(){try{return JSON.parse(localStorage.getItem(za)||"null")}catch{return null}}function Bs(e){try{e?localStorage.setItem(za,JSON.stringify(e)):localStorage.removeItem(za)}catch{}}function md({transport:e,onSaved:t,onOpen:n,onClose:o}){const a=je("setup"),s=je("setup-body"),r=je("setup-summary"),i=je("setup-back"),l=je("setup-next"),c=je("setup-progress"),d=je("setup-steps"),u=je("setup-source"),g=je("setup-resume");let p=null,f=null,y="",h=0,b=0,w=0,$=[],R=[],E=!1,P=!1;const Z=new Set,Q=new Set;let ne=null,T=null;const V=()=>{clearTimeout(T),T=setTimeout(()=>Bs({v:1,base:y,step:h,person:b,reached:w,draft:f}),300)},q=()=>{clearTimeout(T),Bs(null)};function m(x,_,A,H="",G=null){const re=A.matches("input, select")?A:A.querySelector("input, select");re.id||=$e(x);const ie=H?`${re.id}-help`:null;return ie&&re.setAttribute("aria-describedby",ie),Y("div",{class:"field","data-path":x},Y("label",{for:re.id,text:_}),A,H?Y("p",{class:"field-help",id:ie,text:H}):null,G)}function D(x,_,{end:A=!1,onChange:H}){const G=Y("input",{id:$e(x),type:"text",inputmode:"numeric",autocomplete:"off",spellcheck:"false",maxlength:"5",placeholder:A?"22:30":"07:30",class:"time",value:_});return G.addEventListener("input",()=>{H(G.value),V()}),G.addEventListener("blur",()=>{const re=un(G.value,{end:A});re&&re!==G.value&&(G.value=re,H(re),V())}),G}function F(x,_,{limit:A,step:H=1,placeholder:G="",onChange:re}){const ie=Y("input",{id:$e(x),type:"number",inputmode:H<1?"decimal":"numeric",min:String(A.off===0?0:A.min),max:String(A.max),step:String(H),placeholder:G===""?"":String(G),class:"num",value:_==null?"":String(_)});return ie.addEventListener("input",()=>{const me=ie.value.trim();re(me===""?null:Number.isFinite(Number(me))?Number(me):me),V()}),ie}const N=(x,_)=>Y("span",{class:"unit"},x,Y("span",{"aria-hidden":"true",text:_}));function W(x,_,A,H){const G=Y("select",{id:$e(x)},A.map(([re,ie])=>Y("option",{value:re,text:ie})));return G.value=_,G.addEventListener("change",()=>{H(G.value),V()}),G}function U(x,_,A,H,G=""){const re=Y("input",{type:"checkbox",id:x,checked:A});return re.addEventListener("change",()=>{H(re.checked),V()}),Y("div",{class:"check"},re,Y("label",{for:x,text:_}),G?Y("p",{class:"field-help",text:G}):null)}function ee(x,_,A){const H=new Set(_);return Y("fieldset",{class:"days","data-path":x},Y("legend",{class:"sr-only",text:"Days"}),$o.map(G=>{const re=`${$e(x)}-${G}`,ie=Y("input",{type:"checkbox",id:re,checked:H.has(G)});return ie.addEventListener("change",()=>{ie.checked?H.add(G):H.delete(G),A($o.filter(me=>H.has(me))),V()}),Y("span",{class:"day"},ie,Y("label",{for:re,text:G[0].toUpperCase()+G.slice(1,3)}))}))}function se(x,_,...A){const H=Y("details",{class:"setup-adv",open:Z.has(x)},Y("summary",{text:_}),Y("div",{class:"setup-adv-body"},...A));return H.addEventListener("toggle",()=>{H.open?Z.add(x):Z.delete(x)}),H}const de=x=>p.limits[x],fe=(x,_)=>p.defaults[x][_],O=(x,_=null)=>`Default ${Yn(x,_)}.`;function k(x,_){return[Y("h3",{class:"setup-title",id:"setup-step-h",tabindex:"-1",text:x}),_?Y("p",{class:"setup-intro",text:_}):null]}function S(x,_,A){const H=Oa(p);let G;return H?G=W(`${_}.ha_person`,x.ha_person??"",Rc(H,x.ha_person),re=>{x.ha_person=re||null,Q.add(x.id)}):(G=Y("input",{id:$e(`${_}.ha_person`),type:"text",class:"entity",value:x.ha_person??"",placeholder:"person.sam",autocomplete:"off",autocapitalize:"none",spellcheck:"false",maxlength:"107"}),G.addEventListener("input",()=>{x.ha_person=G.value.trim()||null,V()})),G.setAttribute("aria-describedby",A),Y("div",{class:"field","data-path":`${_}.ha_person`},Y("label",{for:G.id,text:"Home Assistant person"}),G)}function L(){const x=Y("div",{class:"setup-people"}),_=Oa(p),A=`${$e("household.people")}-ha-help`,H=()=>_?`${Ts(f.away.presence_delay_min)} A link set in the integration's options takes priority.`:`Optional. Type the entity ID, such as person.sam. ${Ts(f.away.presence_delay_min)}`,G=Y("p",{class:"field-help",id:A,text:H()});f.people.forEach((he,be)=>{const Ce=`household.people.${he.id}`,Oe=Y("input",{id:$e(`${Ce}.name`),type:"text",value:he.name,autocomplete:"off",maxlength:"40",required:!0});Oe.addEventListener("input",()=>{he.name=Oe.value,V()}),Oe.addEventListener("change",()=>{if(!_||he.ha_person||Q.has(he.id))return;const yt=f.people.map(sn=>sn.ha_person).filter(Boolean),Cn=oi(he.name,_,yt);if(!Cn)return;he.ha_person=Cn;const ao=document.getElementById($e(`${Ce}.ha_person`));ao&&(ao.value=Cn),V()});const et=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${he.name||`person ${be+1}`}`,disabled:f.people.length<2,onclick:()=>{Lc(f,he.id),b=Math.min(b,f.people.length-1),oe(`${$e("household.people")}-add`),V()}});x.append(Y("div",{class:"setup-person",role:"group","aria-label":`Person ${be+1}`,"data-path":Ce},m(`${Ce}.name`,`Person ${be+1}`,Oe),S(he,Ce,A),et))});const re=Y("button",{type:"button",class:"btn",id:`${$e("household.people")}-add`,text:"Add a person",onclick:()=>{const he=ni(f);oe($e(`household.people.${he}.name`),!0),V()}}),ie=f.away,me=de("away.presence_stale_after_min").off;return[...k("Who lives here?","Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),Y("div",{class:"field-group","data-path":"household.people"},x,G,re),se("away","Advanced: away and presence",m("household.away.presence_delay_min","Counts as away after",N(F("household.away.presence_delay_min",ie.presence_delay_min,{limit:de("away.presence_delay_min"),onChange:he=>{ie.presence_delay_min=he,typeof he=="number"&&(G.textContent=H())}}),"min"),`How long Home Assistant must say someone is out before Radiate counts them as away. ${O(fe("away","presence_delay_min"))}`),m("household.away.presence_stale_after_min","Presence goes stale after",N(F("household.away.presence_stale_after_min",ie.presence_stale_after_min,{limit:de("away.presence_stale_after_min"),onChange:he=>ie.presence_stale_after_min=he}),"min"),`If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${O(fe("away","presence_stale_after_min"),me)}`),m("household.away.return_warmup_min","Warm up for a return up to",N(F("household.away.return_warmup_min",ie.return_warmup_min,{limit:de("away.return_warmup_min"),onChange:he=>ie.return_warmup_min=he}),"min"),`How early Radiate may start warming rooms for someone due back. ${O(fe("away","return_warmup_min"))}`),m("household.away.presence_evidence_max_age_min","Trust not home for",N(F("household.away.presence_evidence_max_age_min",ie.presence_evidence_max_age_min,{limit:de("away.presence_evidence_max_age_min"),onChange:he=>ie.presence_evidence_max_age_min=he}),"min"),`If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${O(fe("away","presence_evidence_max_age_min"))}`),m("household.away.presence_weak_source_delay_min","Wifi or Bluetooth trackers count as away after",N(F("household.away.presence_weak_source_delay_min",ie.presence_weak_source_delay_min,{limit:de("away.presence_weak_source_delay_min"),onChange:he=>ie.presence_weak_source_delay_min=he}),"min"),`A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${O(fe("away","presence_weak_source_delay_min"))}`),m("household.away.everyone_away","When everyone has set an away until",W("household.away.everyone_away",ie.everyone_away,[["frost","Hold every room at frost protection"],["unused","Keep rooms at their unused temperature"]],he=>ie.everyone_away=he),"Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."))]}function j(x,_,A){const H=x[_],G=`household.people.${x.id}.${_}`,re=x.name||"this person",ie=Y("div",{class:"periods"}),me=fo(G,H.periods);H.periods.forEach((be,Ce)=>{const Oe=me[Ce],et=W(`${Oe}.type`,be.type,[["out","Out of the house"],["work","Working from home"]],sn=>{be.type=sn,oe($e(`${fo(G,H.periods)[Ce]}.type`))}),yt=D(`${Oe}.from`,be.from,{onChange:sn=>be.from=sn}),Cn=D(`${Oe}.to`,be.to,{end:!0,onChange:sn=>be.to=sn}),ao=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${be.type==="work"?"working":"out"} ${be.from} to ${be.to}`,onclick:()=>{H.periods.splice(Ce,1),oe(`${$e(G)}-add-out`),V()}});ie.append(Y("div",{class:"period",role:"group","aria-label":`${A}, time ${Ce+1}`,"data-path":Oe},Y("div",{class:"field"},Y("label",{for:et.id,text:"What"}),et),Y("div",{class:"field"},Y("label",{for:yt.id,text:be.type==="work"?"Starts":"Leaves"}),yt),Y("div",{class:"field"},Y("label",{for:Cn.id,text:be.type==="work"?"Finishes":"Back"}),Cn),ao))}),H.periods.length||ie.append(Y("p",{class:"field-help",text:`${re} is at home all day.`}));const he=(be,Ce,Oe)=>()=>{H.periods.push({type:be,from:Ce,to:Oe});const et=fo(G,H.periods).at(-1);oe($e(`${et}.from`)),V()};return Y("fieldset",{class:"routine","data-path":G},Y("legend",{text:A}),m(`${G}.up`,`When does ${re} get up?`,D(`${G}.up`,H.up,{onChange:be=>H.up=be})),Y("div",{class:"field-group"},Y("p",{class:"field-label",text:`Is ${re} out or working from home during the day?`}),ie,Y("div",{class:"row"},Y("button",{type:"button",class:"btn",id:`${$e(G)}-add-out`,text:"Add time out",onclick:he("out","08:30","17:30")}),Y("button",{type:"button",class:"btn",id:`${$e(G)}-add-work`,text:"Add time working from home",onclick:he("work","09:00","17:00")}))),m(`${G}.bed`,`When does ${re} go to bed?`,D(`${G}.bed`,H.bed,{end:!0,onChange:be=>H.bed=be})))}function X(){const x=f.people[b],_=x.name||`Person ${b+1}`,A=`household.people.${x.id}`,H=[...k(`${_}'s routine`,f.people.length>1?`Person ${b+1} of ${f.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.`:"Usual days are enough: Radiate handles one-off changes with away and overrides."),j(x,"weekdays",x.weekendSame?"Every day":"Weekdays"),U(`${$e(A)}-weekend`,"Weekends are different",!x.weekendSame,ie=>{x.weekendSame=!ie,ie&&JSON.stringify(x.weekend)===JSON.stringify(x.weekdays)&&(x.weekend=JSON.parse(JSON.stringify(ti.weekend))),oe(`${$e(A)}-weekend`)})];if(x.weekendSame||H.push(j(x,"weekend","Weekends")),Nc(x)){const ie=f.rooms.map(me=>[me.id,me.name]);H.push(m(`${A}.office`,`Where does ${_} work?`,W(`${A}.office`,Mc(f,x.id)??"",[["","No particular room"],...ie],me=>Oc(f,x.id,me||null)),"That room is warm while they work. Shared rooms aren't heated while someone works."))}const G=f.timing,re=x.weekend_days==null;return H.push(se(`person-${x.id}`,`Advanced: timing for ${_}`,m(`${A}.getting_up_min`,"Getting ready",N(F(`${A}.getting_up_min`,x.getting_up_min,{limit:de("timing.getting_up_min"),placeholder:G.getting_up_min,onChange:ie=>x.getting_up_min=ie}),"min"),`How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${Yn(G.getting_up_min)}.`),m(`${A}.bedtime_min`,"Winding down",N(F(`${A}.bedtime_min`,x.bedtime_min,{limit:de("timing.bedtime_min"),placeholder:G.bedtime_min,onChange:ie=>x.bedtime_min=ie}),"min"),`How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${Yn(G.bedtime_min)}.`),Y("div",{class:"field","data-path":`${A}.weekend_days`},U(`${$e(A)}-own-weekend`,`Same weekend days as the house (${Hc(f.weekend_days)})`,re,ie=>{x.weekend_days=ie?null:[...f.weekend_days],oe(`${$e(A)}-own-weekend`)},"Untick for someone who works weekends."),re?null:ee(`${A}.weekend_days`,x.weekend_days,ie=>x.weekend_days=ie)))),H}function M(x){const _=f.temperatures;return{in_use:`Kept at ${_.in_use}° while it's used.`,occasional:`Kept at ${_.occasional}° while it's used, for a bathroom or guest room.`,unused:`Kept at ${_.unused}° by day and ${_.night}° at night.`,own:"Follows its schedule from the house file. Radiate doesn't change it."}[x]}function I(){const x=Y("div",{class:"setup-rooms"}),_=Ec;for(const A of f.rooms){const H=`household.rooms.${A.id}`,G=A.schedule?[..._,["own","Its own schedule"]]:_,re=W(`${H}.use`,A.own?"own":A.use,G,he=>{A.own=he==="own",A.own||(A.use=he),oe($e(`${H}.use`))}),ie=`${$e(H)}-h`,me=Y("div",{class:"card setup-room",role:"group","aria-labelledby":ie,"data-path":H},Y("h4",{id:ie,text:A.name}));if(me.append(m(`${H}.use`,"How is it used?",re,M(A.own?"own":A.use))),!A.own){if(me.append(U(`${$e(H)}-weekend`,"Different at weekends",A.weekendDifferent,be=>{A.weekendDifferent=be,be||(A.weekendUse=A.use),oe(`${$e(H)}-weekend`)})),A.weekendDifferent&&me.append(m(`${H}.use.weekend`,"At weekends",W(`${H}.use.weekend`,A.weekendUse,_,be=>{A.weekendUse=be}))),!(A.use==="unused"&&(!A.weekendDifferent||A.weekendUse==="unused"))){const be=W(`${H}.kind`,A.kind,ei.map(([Ce,Oe])=>[Ce,Oe]),Ce=>{A.kind=Ce,oe($e(`${H}.kind`))});me.append(m(`${H}.kind`,"What kind of room?",be,qc(A.kind))),f.people.length>1&&me.append(K(A,H))}me.append(ae(A,H))}x.append(me)}return[...k("How is each room used?","Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),x]}function K(x,_){const A=x.people==null,H=Y("fieldset",{class:"who","data-path":`${_}.people`},Y("legend",{class:"field-label",text:"Who uses it?"}));if(H.append(U(`${$e(_)}-everyone`,"Everyone",A,G=>{x.people=G?null:f.people.map(re=>re.id),oe(`${$e(_)}-everyone`)})),!A)for(const G of f.people)H.append(U(`${$e(_)}-${G.id}`,G.name||G.id,x.people.includes(G.id),re=>{const ie=new Set(x.people);re?ie.add(G.id):ie.delete(G.id),x.people=f.people.map(me=>me.id).filter(me=>ie.has(me))}));return H}function ae(x,_){const A=f.temperatures,H=de("temperatures"),G=(me,he)=>Y("p",{class:"field-note","aria-live":"polite",text:io(x[me]??he,p.damp_below_c)}),re=(me,he,be,Ce)=>{const Oe=me==="temperature"?null:G(me,be),et=F(`${_}.${me}`,x[me],{limit:H,step:.5,placeholder:be,onChange:yt=>{x[me]=yt,Oe&&(Oe.textContent=io(yt??be,p.damp_below_c))}});return m(`${_}.${me}`,he,N(et,"°C"),Ce,Oe)},ie=x.use==="unused"?x.weekendUse:x.use;return se(`room-${x.id}`,`Advanced: ${x.name}`,re("temperature","Its own warm temperature",A[ie]??A.in_use,"Replaces the use level's temperature in this room only. Leave empty to use the level's."),re("night_temperature","Its own night temperature",A.night,`For a warmer nursery, say. Leave empty for the house's, ${A.night}°.`),re("unused_temperature","Its own unused temperature",A.unused,`Leave empty for the house's, ${A.unused}°.`),m(`${_}.preheat_min`,"Valve starts early by",N(F(`${_}.preheat_min`,x.preheat_min,{limit:de("timing.preheat_min"),placeholder:f.timing.preheat_min,onChange:me=>x.preheat_min=me}),"min"),`For a slow room with a small radiator. Leave empty for the house setting, ${Yn(f.timing.preheat_min)}.`))}function ke(){const x=f.temperatures,_=de("temperatures"),A=(re,ie,me)=>{const he=`household.temperatures.${re}`,Ce=re==="unused"||re==="night"?Y("p",{class:"field-note","aria-live":"polite",text:io(x[re],p.damp_below_c)}):null,Oe=F(he,x[re],{limit:_,step:.5,onChange:et=>{x[re]=et,Ce&&(Ce.textContent=io(et,p.damp_below_c))}});return m(he,ie,N(Oe,"°C"),`${me} Default ${fe("temperatures",re)}°.`,Ce)},H=f.timing,G=(re,ie,me)=>{const he=`household.timing.${re}`;return m(he,ie,N(F(he,H[re],{limit:de(`timing.${re}`),onChange:be=>H[re]=be}),"min"),`${me} ${O(fe("timing",re))}`)};return[...k("How warm should rooms be?","One temperature for each way a room is used. Rooms change between them through the day."),Y("div",{class:"setup-grid"},A("in_use","In use","Rooms while they're being used."),A("occasional","Occasional","Rooms used now and then, such as a bathroom, while they're used."),A("unused","Unused","Every room by day when it isn't being used."),A("night","Night","Every room overnight, from the last person in bed to the first one up.")),se("timing","Advanced: timing",Y("div",{class:"field","data-path":"household.weekend_days"},Y("p",{class:"field-label",text:"Weekend days"}),ee("household.weekend_days",f.weekend_days,re=>f.weekend_days=re),Y("p",{class:"field-help",text:"The days that use weekend routines and weekend room use. Default Saturday and Sunday."})),G("getting_up_min","Getting ready","How long bedrooms and shared rooms stay warm after someone gets up."),G("bedtime_min","Winding down","How long a bedroom is warm before someone goes to bed."),G("preheat_min","Valves start early by","How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),m("household.timing.live_preheat","How Radiate starts early",W("household.timing.live_preheat",H.live_preheat,[["optimum_start","Learn how early each room needs"],["fixed","A fixed time early, as the valves do"]],re=>H.live_preheat=re),"Learning starts each room as late as it can and still be warm in time. Default learn."),G("merge_gap_min","Join warm periods closer than","Two warm periods this close together become one, so a room doesn't cool for a short gap."))]}function Le(){const x=Y("div",{class:"setup-result"}),_=Y("p",{class:"week-legend",hidden:!0}),A=Y("p",{class:"away-note",hidden:!0,text:"Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back."}),H=Y("div",{class:"weeks"}),G=Y("p",{class:"setup-status",id:"setup-result-status","aria-live":"polite",tabindex:"-1",text:"Building your week…"});return x.append(G,Y("div",{class:"setup-notes",id:"setup-notes"}),Y("div",{class:"week-head"},_),A,H),ne=si({list:H,legendEl:_,frostEl:A}),[...k("Your heating week","Every room's week, built from your answers. Blocks are warm periods, darker when warmer."),x]}const Je=[L,()=>X(),I,ke,Le];function Ae(){d.textContent="",ro.forEach((x,_)=>{const A=_===h,H=Y("li",{"aria-current":A?"step":null,"data-done":String(_<h)}),G=`${_+1}. ${x}`;_<=w&&!A?H.append(Y("button",{type:"button",class:"link",text:G,onclick:re=>te(_,0,re.detail===0)})):H.append(Y("span",{text:G})),d.append(H)})}function on(){u.textContent="";const x=p.saved_problems??[];if(x.length){u.hidden=!1,u.append(Y("p",{text:`Your saved setup couldn't be used, so the house file's setup applies: ${x.map(_=>Hs(_.message)).join(" ")} Saving here replaces it.`}));return}if(p.source==="saved"){u.hidden=!1;const _=p.house_file?"the household section of the house file":"the schedules in the house file";u.append(Y("p",{text:p.saved_at?`This setup is saved by Radiate in ${p.saved_at}. It replaces ${_}, which is left as it is.`:"This setup replaces the schedules the house started with, until you go back to them."}));const A=Y("div",{class:"row",hidden:!0},Y("p",{text:`This deletes the saved setup. Rooms go back to ${_}.`}),Y("button",{type:"button",class:"btn",text:"Delete and use the house file",onclick:an}),Y("button",{type:"button",class:"link",text:"Keep this setup",onclick:()=>{A.hidden=!0,H.hidden=!1,H.focus()}})),H=Y("button",{type:"button",class:"link",text:"Use the house file's setup instead",onclick:()=>{A.hidden=!1,H.hidden=!0,A.querySelector(".btn").focus()}});u.append(H,A);return}if(p.source==="house_file"){u.hidden=!1,u.append(Y("p",{text:"These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed."}));return}u.hidden=!0}function z(x=null){a.dataset.instant=String(P||x!=null);const _=Y("div",{class:"setup-step"},...Je[h]());s.replaceChildren(_),Ae(),i.hidden=h===0&&b===0,l.disabled=!1,l.textContent=h===4?"Save":h===3?"See the result":"Next";const A=h===1?`${ro[1]}, ${f.people[b]?.name||`person ${b+1}`}`:ro[h];c.textContent=`Step ${h+1} of 5: ${A}`,ue(!1),x&&document.getElementById(x)?document.getElementById(x).focus():je("setup-step-h")?.focus(),h===4&&ge()}function oe(x,_=!0){const A=$;z(x),_&&($=A,ue(!1)),V()}function te(x,_=0,A=!1){P=A,h=x,b=Math.min(_,f.people.length-1),w=Math.max(w,h),$=[],R=[],z(),V()}function ue(x){for(const H of s.querySelectorAll(".field-error"))H.remove();for(const H of s.querySelectorAll("[aria-invalid]"))H.removeAttribute("aria-invalid"),H.dataset.describedby?H.setAttribute("aria-describedby",H.dataset.describedby):H.removeAttribute("aria-describedby"),delete H.dataset.describedby;if(r.textContent="",r.hidden=!$.length,!$.length)return;const _=[...s.querySelectorAll("[data-path]")].map(H=>H.dataset.path);r.append(Y("h3",{text:$.length===1?"Check this answer":`Check these ${$.length} answers`}));const A=Y("ul");$.forEach((H,G)=>{const re=Pc(_,H.path),ie=re?s.querySelector(`[data-path="${CSS.escape(re)}"]`):null,me=Hs(H.message),he=ie?.matches("input, select")?ie:ie?.querySelector("input, select, button");if(ie){const Ce=`setup-err-${G}`,Oe=Y("p",{class:"field-error",id:Ce,text:me}),et=ie.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");if(et?et.after(Oe):ie.prepend(Oe),he){he.setAttribute("aria-invalid","true");const yt=he.getAttribute("aria-describedby")??"";he.dataset.describedby=yt,he.setAttribute("aria-describedby",`${Ce} ${yt}`.trim())}}const be=ye(H.path);A.append(Y("li",{},he?Y("a",{href:`#${he.id}`,text:`${be}${me}`,onclick:Ce=>{Ce.preventDefault(),he.focus()}}):Ie(H.path,`${be}${me}`)))}),r.append(A),x&&r.focus()}function ye(x){const _=x.split(".");if(_[1]==="people"&&_[2]){const A=f.people.find(G=>G.id===_[2]),H=_[3]?.startsWith("weekend")&&_[3]!=="weekend_days"?", weekends":_[3]?.startsWith("weekdays")?", weekdays":"";return`${A?.name||_[2]}${H}: `}return _[1]==="rooms"&&_[2]?`${f.rooms.find(A=>A.id===_[2])?.name??_[2]}: `:""}function Ie(x,_){if(!x)return Y("span",{text:_});const{step:A,person:H}=zs(f,x);return A===h&&(A!==1||H===b)?Y("span",{text:_}):Y("button",{type:"button",class:"link",text:`${_} Change it in ${ro[A]}.`,onclick:G=>te(A,H,G.detail===0)})}const _e=x=>x.filter(_=>{const A=zs(f,_.path);return A.step===h&&(h!==1||A.person===b)});async function De(){const x=Dc(f);if(_e(x).length)return{errors:_e(x),notes:[]};const _=await e.call("POST","household/preview",{household:Ns(f)});if(_.status!==200)throw new Error(typeof _.body=="string"?_.body:`HTTP ${_.status}`);return _.body}async function qe(x){if(E)return;if(h===4){await lt();return}E=!0,l.disabled=!0;let _;try{_=await De()}catch{E=!1,l.disabled=!1,$=[{path:"",message:"Couldn't check your answers. Check the connection and try again."}],ue(!0);return}if(E=!1,l.disabled=!1,$=_e(_.errors),$.length){ue(!0);return}h===1&&b<f.people.length-1?te(1,b+1,x):te(h+1,0,x)}function Me(x){h===1&&b>0?te(1,b-1,x):h===2?te(1,f.people.length-1,x):h>0&&te(h-1,0,x)}async function ge(){const x=je("setup-result-status"),_=je("setup-notes");let A;try{A=await De()}catch{x.textContent="Couldn't build the week. Check the connection, then go back and forward to try again.",l.disabled=!0;return}if(h!==4)return;if($=A.errors,R=A.notes??[],l.disabled=$.length>0,$.length){x.textContent="Some answers need changing before Radiate can build the week.",ue(!0);return}x.textContent="Save to start using it. Radiate then rebuilds every room's schedule from your answers.",_.textContent="";const H=Bc(A.rooms);for(const G of R)G.path.startsWith("household.temperatures")||G.path.includes("_temperature")||_.append(Y("p",{class:"flag",text:`${ye(G.path)||""}${G.message[0].toUpperCase()}${G.message.slice(1)}`}));H&&_.append(Y("p",{class:"field-help",text:H})),ne.update(A)}async function lt(){E=!0,l.disabled=!0;const x=je("setup-result-status");x.textContent="Saving…";let _;try{_=await e.call("PUT","household",{household:Ns(f)})}catch{_={status:0,body:null}}if(E=!1,l.disabled=!1,_.status===200){q(),Rt(!1),t("Household setup saved. Every room's schedule is rebuilt from it.");return}if(_.status===400&&_.body?.errors){$=_.body.errors,x.textContent="Not saved: some answers need changing.",ue(!0);return}x.textContent=_.body?.message?`Not saved. ${_.body.message}.`:"Not saved. Check the connection and try again.",x.focus?.()}async function an(){let x;try{x=await e.call("DELETE","household")}catch{x={status:0}}if(x.status!==200){$=[{path:"",message:"Couldn't go back to the house file's setup. Try again."}],ue(!0);return}q(),Rt(!1),t("Using the house file's setup again. The saved setup is deleted.")}function Rt(x=!0){x&&f&&V(),a.hidden=!0,o()}let _n=!1;return l.addEventListener("click",x=>{_n=x.detail===0}),je("setup-form").addEventListener("submit",x=>{x.preventDefault(),qe(_n)}),i.addEventListener("click",x=>Me(x.detail===0)),je("setup-close").addEventListener("click",()=>Rt(!0)),je("setup-restart").addEventListener("click",()=>{q(),f=Ms(p),Q.clear(),g.hidden=!0,w=0,te(0)}),{async open(){const x=await e.call("GET","household");if(x.status!==200)throw new Error(`household: HTTP ${x.status}`);p=x.body,y=JSON.stringify(p.household);const _=fd(),A=_?.v===1&&_.base===y&&_.draft?.people?.length;f=A?_.draft:Ms(p),h=A?Math.min(_.step,4):0,b=A?Math.min(_.person??0,f.people.length-1):0,w=A?Math.max(_.reached??0,h):0,g.hidden=!A,je("setup-h").textContent=p.household?"Change household setup":"Set up your household",$=[],P=!1,Q.clear(),on(),a.hidden=!1,n(),z(),je("setup-h").focus()},async available(){try{return(await e.call("GET","household")).status===200}catch{return null}}}}const We=e=>document.getElementById(e),gd={ok:"success",attention:"warning",offline:"warning"};function wd(e,t){const n=gd[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const bd=1e4,yd=2e3;function So(e){return e==null?"–":e<60?"just now":e<3600?`${Math.floor(e/60)} min ago`:e<172800?`${Math.floor(e/3600)} h ago`:`${Math.floor(e/86400)} days ago`}function Fs(e){const t=Math.max(1,Math.ceil(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} h ${t%60} min`}const vd={strong:"Strong",fair:"Fair",weak:"Weak"},kd={weak:1,fair:2,strong:3},$d={auto:"auto",heat:"heat",off:"off"};function js(e,t){return t==="device.offline"?`Not reachable. Last heard ${So(e.last_seen_s)}.`:t==="device.low_battery"?`Battery low at ${e.battery_pct}%. Replace the batteries soon.`:t==="device.weak_signal"?`Weak signal (LQI ${e.linkquality}). A router nearer to it would help.`:t==="device.stale"?`No temperature for ${So(e.reading_age_s).replace(" ago","")}.`:"Needs attention."}function xd(e){return e.status==="offline"?["Offline","offline"]:e.status==="attention"?["Needs attention","attention"]:e.available==null?["No data yet",""]:["Online","ok"]}function Sd(e){const t=[],n=e.temperature_c!=null?`${e.temperature_c.toFixed(1)}°`:null;if(e.kind==="trv"){const a=e.valve??{};n&&t.push(`${n} at the valve`),a.opening_pct!=null&&t.push(`opening limit ${Math.round(a.opening_pct)}%`),a.running_state&&t.push(a.running_state==="heat"?"heating":"idle"),a.mode&&t.push(`${$d[a.mode]??a.mode} mode`)}else if(e.kind==="relay"){const a=e.relay??{};a.heating!=null&&t.push(`heating ${a.heating?"on":"off"}`),a.store!=null&&t.push(`hot water ${a.store?"on":"off"}`),a.power_w!=null&&t.push(`${Math.round(a.power_w)} W`)}else e.kind==="window"?e.contact!=null&&t.push(e.contact?"window closed":"window open"):e.kind!=="router"&&(n&&t.push(n),e.humidity_pct!=null&&t.push(`${Math.round(e.humidity_pct)}% humidity`));if(!t.length)return e.kind==="router"?"Relays messages for nearby devices.":"–";const o=t.join(", ");return o[0].toUpperCase()+o.slice(1)}function _d(e,t){return e.kind==="relay"?"Wi-Fi":e.route?`Via ${e.route.via_kind==="coordinator"?"the coordinator":e.route.via}${e.route.lqi!=null?` (LQI ${Math.round(e.route.lqi)})`:""}`:t?"Not in the last scan":null}function Cd({transport:e,isAuthError:t,onAuth:n,scanLock:o=()=>""}){const a=new Map;let s=null,r=null,i=!1,l=!1,c="";function d(w,$){let R=a.get(w.id);return R||(R=We("device-tpl").content.firstElementChild.cloneNode(!0),R.id=`device-${w.id.replace(/[^\w-]/g,"_")}`,R.dataset.kind=w.kind,a.set(w.id,R)),R.parentElement!==$&&$.appendChild(R),R}function u(w,$,R){const E=d(w,$);E.querySelector(".name").textContent=w.label,E.dataset.status=w.status;const[P,Z]=xd(w),Q=E.querySelector(".badge");Q.textContent=P,wd(Q,Z);const ne=E.querySelector(".device-flags"),T=w.problems.map(k=>js(w,k.code)),V=JSON.stringify(T);if(ne.dataset.key!==V){ne.dataset.key=V,ne.textContent="";for(const k of T){const S=document.createElement("li");S.className="flag",S.textContent=k,ne.appendChild(S)}}ne.hidden=!T.length;const q=E.querySelector(".ds-battery"),m=q.querySelector(".ds-val"),D=q.querySelector(".meter");w.battery_pct!=null?(m.textContent=`${w.battery_pct}%`,D.hidden=!1,D.dataset.low=String(w.battery_low),D.value=Math.max(0,Math.min(100,w.battery_pct))):(m.textContent=w.power==="mains"?"Mains":"–",D.hidden=!0),q.dataset.low=String(w.battery_low);const F=E.querySelector(".ds-signal"),N=F.querySelector(".ds-val"),W=F.querySelector(".ds-sub"),U=F.querySelector(".sig");W.textContent="",w.kind==="relay"?(N.textContent="Wi-Fi",U.hidden=!0):w.linkquality!=null&&w.available!==!1?(N.textContent=vd[w.signal],W.textContent=`LQI ${w.linkquality}`,U.hidden=!1,U.dataset.level=w.signal,U.dataset.bars=String(kd[w.signal])):(N.textContent="–",U.hidden=!0),F.dataset.weak=String(w.signal==="weak"&&w.available!==!1),E.querySelector(".ds-seen .ds-val").textContent=So(w.last_seen_s),E.querySelector(".device-reading").textContent=Sd(w);const ee=E.querySelector(".meta"),se=[];w.kind!=="relay"&&se.push(["code",w.id]);const de=[w.vendor,w.model].filter(Boolean).join(" ");de&&se.push(["",de]),w.firmware&&se.push(["",`Firmware ${w.firmware}`]);const fe=_d(w,R);fe&&se.push(["route",fe]);const O=JSON.stringify(se);if(ee.dataset.key!==O){ee.dataset.key=O,ee.textContent="";for(const[k,S]of se){const L=document.createElement(k==="code"?"code":"span");k==="route"&&(L.className="route"),L.textContent=S,ee.appendChild(L)}}}function g(w){const $=w.summary,R=[];$.offline&&R.push(`${$.offline} offline`),$.low_battery&&R.push(`${$.low_battery} low battery`),$.weak_signal&&R.push(`${$.weak_signal} weak signal`);const E=`${$.total} ${$.total===1?"device":"devices"}`;We("devices-summary").textContent=$.attention?`${E}. ${$.attention} ${$.attention===1?"needs":"need"} attention${R.length?`: ${R.join(", ")}`:""}.`:`${E}, all healthy.`;const P=w.network??{},Z=[];P.mqtt!=null&&Z.push(P.mqtt?"MQTT connected":"MQTT not connected"),P.zigbee2mqtt!=null&&Z.push(P.zigbee2mqtt?"Zigbee2MQTT online":"Zigbee2MQTT offline"),We("devices-network").textContent=Z.length?`${Z.join(". ")}.`:"";const Q=We("devices-attention"),ne=We("devices-attention-list"),T=w.devices.filter(q=>q.status!=="ok");Q.hidden=!T.length;const V=JSON.stringify(T.map(q=>q.id));if(ne.dataset.key!==V){ne.dataset.key=V,ne.textContent="";for(const q of T){const m=document.createElement("li");m.dataset.id=q.id;const D=document.createElement("a");D.href="#devices",D.className="attention-link",D.textContent=q.label,D.addEventListener("click",N=>{N.preventDefault();const W=a.get(q.id);W&&(W.scrollIntoView({block:"center"}),W.focus({preventScroll:!0}))});const F=document.createElement("span");m.append(D,F),ne.appendChild(m)}}for(const q of T){const m=ne.querySelector(`li[data-id="${CSS.escape(q.id)}"] span`);m&&(m.textContent=`: ${q.problems.map(D=>js(q,D.code)).join(" ")}`)}}function p(w){const $=We("mesh-tree"),R=w.devices.filter(T=>T.route);$.hidden=!R.length;const E=JSON.stringify(R.map(T=>[T.id,T.route.via,T.route.lqi]));if($.dataset.key===E)return;$.dataset.key=E,$.textContent="";const P=new Map;for(const T of R){const V=T.route.via_kind==="coordinator"?"Coordinator":T.route.via;P.has(V)||P.set(V,[]),P.get(V).push(T)}const Z=new Map(w.devices.map(T=>[T.id,T.label])),Q=new Set,ne=(T,V)=>{const q=document.createElement("li"),m=document.createElement("span");m.className="tree-node",m.textContent=V,q.appendChild(m);const D=(P.get(T)??[]).slice().sort((N,W)=>(N.kind==="router")-(W.kind==="router")||N.label.localeCompare(W.label));if(!D.length||Q.has(T))return q;Q.add(T);const F=document.createElement("ul");for(const N of D){const W=document.createElement("span");W.className="tree-lqi",W.textContent=N.route.lqi!=null?`LQI ${Math.round(N.route.lqi)}`:"",W.dataset.weak=String(N.route.lqi!=null&&N.route.lqi<w.limits.weak_signal_lqi);let U;if(N.kind==="router")U=ne(N.id,N.label),U.firstElementChild.after(W);else{U=document.createElement("li");const ee=document.createElement("span");ee.className="tree-node",ee.textContent=N.label,U.append(ee,W)}F.appendChild(U)}return q.appendChild(F),q};$.appendChild(ne("Coordinator","Coordinator"));for(const T of P.keys())!Q.has(T)&&T!=="Coordinator"&&$.appendChild(ne(T,Z.get(T)??T))}function f(w){const $=w.scan,R=We("mesh-scan"),E=We("mesh-status");We("devices-mesh-section").hidden=!$.available&&!w.devices.some(ne=>ne.kind==="router"),R.hidden=!$.available;const P=$.state==="scanning",Z=o();R.disabled=!!Z||P||$.retry_in_s>0,Z?R.dataset.locked="":delete R.dataset.locked,We("mesh-lock").hidden=!Z||!$.available,We("mesh-lock").textContent=Z,R.setAttribute("aria-busy",String(P)),R.loading=P,R.lastChild.textContent=P?"Scanning…":"Scan network",E.dataset.error=String($.state==="failed"||!!c);let Q;c?Q=c:P?Q="Scanning. This can take up to 2 minutes.":$.state==="failed"?Q=`The scan didn't finish: ${$.error}. Radiate will let you try again in ${Fs($.retry_in_s||60)}.`:$.scanned_s_ago!=null?Q=`Scanned ${So($.scanned_s_ago)}.`:Q="Not scanned yet.",!P&&$.retry_in_s>0&&$.state!=="failed"&&!c&&(Q+=` You can scan again in ${Fs($.retry_in_s)}.`),E.textContent=Q}function y(w){s=w,g(w);const $=w.scan.scanned_s_ago!=null,R=We("devices-rooms"),E=We("devices-routers"),P=We("devices-boiler"),Z=new Set;for(const Q of w.devices){Z.add(Q.id);const ne=Q.kind==="router"?E:Q.kind==="relay"?P:R;u(Q,ne,$)}for(const[Q,ne]of a)Z.has(Q)||(ne.remove(),a.delete(Q));We("devices-boiler-section").hidden=!P.children.length,f(w),p(w)}async function h(){if(!l){l=!0;try{y(await e.get("devices"))}catch(w){t(w)?n():s||(We("devices-summary").textContent="Couldn't load the devices. Retrying…")}l=!1,b()}}function b(){clearTimeout(r),i&&(r=setTimeout(h,s?.scan.state==="scanning"?yd:bd))}return We("mesh-scan").addEventListener("click",async()=>{const w=We("mesh-scan");w.disabled=!0,c="";try{const $=await e.call("POST","devices/scan",{});$.status!==200&&(c=`Not started: ${typeof $.body=="object"?$.body.message:$.body}.`)}catch($){if(t($)){n();return}c="Not started. Check the connection and try again."}await h(),w.disabled||w.focus()}),{async available(){try{return y(await e.get("devices")),!0}catch(w){return t(w)?null:/HTTP 404|not found|reports no devices/.test(String(w?.message))?!1:null}},show(){i=!0,h()},hide(){i=!1,clearTimeout(r)}}}const pt=e=>document.getElementById(e),Ed={act:"warning",ok:"success"};function Ws(e,t){const n=Ed[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const Ad=3e4,Td=3e5,Rd={act:["Act on this","act"],consider:["Worth considering","consider"],info:["For information","info"]},Ld={ready:["Ready","ok"],learning:["Learning",""],not_judged:["Not judged",""]},Md={low:"Low confidence",medium:"Medium confidence",high:"High confidence"},ri=(e,t,n)=>`${e} ${e===1?t:n}`;function Od(e){const t=e.summary;if(t.total){const n=[];return t.act&&n.push(`${t.act} to act on`),t.consider&&n.push(`${t.consider} to consider`),t.info&&n.push(`${t.info} for information`),`${ri(t.total,"suggestion","suggestions")}: ${n.join(", ")}.`}return t.rooms_learning&&!t.rooms_ready?"Nothing to suggest yet. Radiate is still learning.":"Nothing to suggest."}function Nd(e){const t=e.summary,n=Math.round(e.settings.min_learning_h);return t.rooms_learning&&!t.rooms_ready?`Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${n} h of learning; you can see how far each room has got below.`:t.rooms_learning?`The rooms Radiate can judge so far heat up and hold their warmth as expected. ${ri(t.rooms_learning,"room is","rooms are")} still learning.`:t.rooms_ready?"Every room Radiate can judge heats up and holds its warmth as expected.":"None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them."}function zd(e){return`${Md[e.confidence]??"Confidence unknown"}. ${e.basis}`}function Pd(e){const t=e.summary;return t.rooms_compared>=t.min_rooms?"":`Rooms are compared with each other once ${t.min_rooms} have enough learning. ${t.rooms_compared?`${t.rooms_compared} so far.`:"None yet."}`}function Dd({transport:e,isAuthError:t,onAuth:n,onCount:o}){const a=new Map,s=new Map;let r=null,i=null,l=!1,c=!1;function d(h){let b=a.get(h.id);b||(b=pt("suggestion-tpl").content.firstElementChild.cloneNode(!0),a.set(h.id,b));const[w,$]=Rd[h.severity]??["",""];b.dataset.severity=h.severity,b.querySelector(".name").textContent=h.title;const R=b.querySelector(".badge");return R.textContent=w,Ws(R,$),b.querySelector(".sg-evidence").textContent=h.evidence,b.querySelector(".sg-action").textContent=h.action,b.querySelector(".sg-basis").textContent=zd(h),b}function u(h,b){let w=s.get(h.room_id);w||(w=pt("learning-tpl").content.firstElementChild.cloneNode(!0),s.set(h.room_id,w)),w.querySelector(".lr-name").textContent=h.room_name;const[$,R]=Ld[h.status]??[h.status,""],E=w.querySelector(".badge");E.textContent=$,Ws(E,R),w.querySelector(".lr-note").textContent=h.note;const P=w.querySelector(".lr-meter");return P.hidden=h.status!=="learning",P.value=Math.round(100*Math.max(0,Math.min(1,h.hours/Math.max(1,b)))),P.label=`${h.room_name}: ${Math.round(h.hours)} of ${Math.round(b)} h of learning`,w}function g(h,b){let w=h.firstElementChild;for(const $ of b)$===w?w=w.nextElementSibling:h.insertBefore($,w);for(;w;){const $=w.nextElementSibling;w.remove(),w=$}}function p(h){r=h,o?.(h.summary.act),pt("suggestions-summary").textContent=Od(h);const b=pt("suggestions-list"),w=new Set(h.suggestions.map(Q=>Q.id));for(const Q of a.keys())w.has(Q)||a.delete(Q);g(b,h.suggestions.map(d));const $=pt("suggestions-empty"),R=h.summary.rooms_learning>0&&!h.summary.rooms_ready;$.hidden=h.suggestions.length>0&&!R,$.dataset.state=R?"learning":"clear",$.classList.toggle("radiate-cool",R),R?$.removeAttribute("variant"):$.setAttribute("variant","success"),pt("suggestions-empty-h").textContent=R?"Still learning":"Nothing to suggest",pt("suggestions-empty-text").textContent=Nd(h);const E=pt("learning-list"),P=new Set(h.learning.map(Q=>Q.room_id));for(const Q of s.keys())P.has(Q)||s.delete(Q);g(E,h.learning.map(Q=>u(Q,h.settings.min_learning_h))),pt("learning-section").hidden=!h.learning.length;const Z=pt("learning-compare");Z.textContent=Pd(h),Z.hidden=!Z.textContent}async function f(){if(!c){c=!0;try{p(await e.get("suggestions"))}catch(h){t(h)?n():!r&&l&&(pt("suggestions-summary").textContent="Couldn't load the suggestions. Retrying…")}c=!1,y()}}function y(){clearTimeout(i),i=setTimeout(f,l?Ad:Td)}return{async available(){try{return p(await e.get("suggestions")),y(),!0}catch(h){return t(h)?null:/HTTP 404|not found/.test(String(h?.message))?!1:null}},show(){l=!0,f()},hide(){l&&(l=!1,y())}}}const Te=e=>document.getElementById(e),qd=6e4,Id=6e5,Hd="−",Pn="–",ii=["January","February","March","April","May","June","July","August","September","October","November","December"],Bd=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Jo=e=>{const[t,n,o]=String(e).split("-").map(Number);return new Date(Date.UTC(t,n-1,o))},Fd=e=>{const t=Jo(e);return`${t.getUTCDate()} ${ii[t.getUTCMonth()]}`},gn=e=>{const t=Jo(e);return`${t.getUTCDate()} ${ii[t.getUTCMonth()].slice(0,3)}`},cs=e=>{const t=Jo(e);return`${Bd[t.getUTCDay()]} ${gn(e)}`};function ft(e){const t=Math.abs(e);return t<9.95?t.toFixed(1):String(Math.round(t))}const Us=e=>`${ft(e)} ${ft(e)==="1.0"?"litre":"litres"}`;function li(e,t=1){if(e==null)return Pn;const n=Number(e.toFixed(t));return n<0?`${Hd}${Math.abs(n).toFixed(t)}`:n.toFixed(t)}const ma=(e,t=1)=>e==null?Pn:e.toFixed(t),Dn=e=>e==null?Pn:`${Math.round(e*100)}%`;function jd(e){return e==null?"with no room in use to keep warm":`with rooms in use warm ${Dn(e)} of the time`}function ci(e){if(e.status==="ready"&&e.totals){const t=e.totals,n=Fd(t.since),o=jd(t.warm_share);return Math.abs(t.litres_saved)<.05?`About the same oil as the baseline since ${n}, ${o}.`:t.litres_saved<0?`About ${Us(t.litres_saved)} more than the baseline since ${n}, ${o}.`:`About ${Us(t.litres_saved)} of oil saved since ${n}, ${o}.`}return e.status==="learning"?Wd(e):Vd(e)}function Wd(e){return`Still learning how much oil this house uses: ${e.why??`${e.progress.eligible_days} of ${e.progress.needed_days} days`}.`}function Ud(e){const t=e.progress,n=Math.max(0,t.needed_days-t.eligible_days);return`${n?`Figures start once ${t.needed_days} full days have counted, so at least ${n} more ${n===1?"day":"days"}`:`${t.eligible_days} days have counted`}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`}const di={"no household":["Savings need a household","The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare."],"no outdoor sensor":["Savings need an outdoor sensor","Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add a Zigbee outdoor sensor as house.outdoor_sensor in the house file, or set house.outdoor_source to home_assistant and pick an outdoor entity in the Radiate integration's options."],"no outdoor readings yet":["Savings need outdoor readings","Radiate takes the outdoor temperature from Home Assistant, and no fresh reading has arrived yet. Check the outdoor entity in the Radiate integration's options, and that it reports at least every few hours."],"no nozzle rating":["Savings need the nozzle rating","Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record."]};function Vd(e){return(di[e.why]??["Savings aren't measured yet"])[0]}function Kd(e){return(di[e.why]??["",`Radiate can't measure savings yet: ${e.why??"no reason given"}.`])[1]}function Jd(e){return[e.litres_upper_bound?"Litres are an upper bound until the burner itself is measured.":e.basis_text??"",e.outdoor?.text??""].filter(Boolean).join(" ")}const Yd=e=>{const t=Jo(e);return t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7),t.toISOString().slice(0,10)};function Vs(e,t="days"){const n=e.days??[];if(t!=="weeks")return n.map(a=>({key:a.date,label:cs(a.date),tick:gn(a.date),counted:a.eligible?1:0,total:1,eligible:a.eligible,why:a.why,litres:a.eligible?a.litres:null,baseline:a.eligible?a.litres_baseline:null,saved:a.eligible?a.litres_saved:null,warm:a.warm_share,deficit:a.comfort_deficit_kh,outdoor:a.outdoor_mean_c}));const o=new Map;for(const a of n){const s=Yd(a.date);o.has(s)||o.set(s,[]),o.get(s).push(a)}return[...o].map(([a,s])=>{const r=s.filter(c=>c.eligible),i=c=>r.length&&r.every(d=>d[c]!=null)?r.reduce((d,u)=>d+u[c],0):null,l=s.filter(c=>c.comfort_deficit_kh!=null);return{key:a,week:!0,label:`Week of ${gn(a)}`,tick:gn(a),counted:r.length,total:s.length,eligible:r.length>0,why:r.length?null:[...new Set(s.map(c=>c.why).filter(Boolean))].join("; ")||"no day counted",litres:i("litres"),baseline:i("litres_baseline"),saved:i("litres_saved"),warm:null,deficit:l.length?l.reduce((c,d)=>c+d.comfort_deficit_kh,0):null,outdoor:null}})}function ui(e){if(!e.eligible)return`${e.label}: not counted, ${e.why}.`;const t=[];e.week&&t.push(`${e.counted} of ${e.total} ${e.total===1?"day":"days"} counted`),e.litres!=null&&t.push(`${e.litres.toFixed(1)} L used`),e.saved!=null&&(t.push(`baseline about ${e.baseline.toFixed(1)} L`),Math.abs(e.saved)<.05?t.push("about the same as the baseline"):e.saved<0?t.push(`about ${ft(e.saved)} L more than the baseline`):t.push(`about ${ft(e.saved)} L saved`));const n=[];e.warm!=null&&n.push(`rooms in use warm ${Dn(e.warm)} of the time`),e.deficit!=null&&n.push(`${e.deficit.toFixed(1)} degree-hours short`),e.outdoor!=null&&n.push(`${e.outdoor.toFixed(1)}° outside on average`);const o=`${e.label}: ${t.join(", ")}.`;return n.length?`${o} ${n.join(", ").replace(/^./,a=>a.toUpperCase())}.`:o}function Gd(e,t,n="days"){const o=n==="weeks"?"week":"day";if(!t.length)return`Oil used each ${o}: no full ${o} yet.`;const a=`${t.length} ${t.length===1?o:`${o}s`} from ${t[0].tick} to ${t.at(-1).tick}`,s=t.filter(d=>d.eligible),r=t.length-s.length,i=r?` ${r} not counted.`:"";if(e.status!=="ready")return`Bar chart of oil used each ${o}, ${a}. ${s.length} counted so far.${i}`;const l=s.filter(d=>d.saved!=null&&d.saved>=.05).length,c=s.filter(d=>d.saved!=null&&d.saved<=-.05).length;return`Bar chart of oil used each ${o} against the baseline, ${a}. Less than the baseline on ${l}, more on ${c}.${i}`}function Xd(e){return(e.days??[]).map(t=>[cs(t.date),t.eligible?"Yes":`No, ${t.why}`,ma(t.litres),ma(t.litres_baseline),li(t.litres_saved),t.outdoor_mean_c==null?Pn:`${t.outdoor_mean_c.toFixed(1)}°`,Dn(t.warm_share),ma(t.comfort_deficit_kh)])}function Qd(e){if(e.status==="ready"&&e.totals){const a=e.totals,s=a.percent_saved,r=s==null?"":s<0?`${Math.abs(s).toFixed(1)}% more than the baseline`:`${s.toFixed(1)}% less than the baseline`;return[[a.litres_saved<0?"Oil over the baseline":"Oil saved",`About ${ft(a.litres_saved)} L`,r],["Oil used",`${ft(a.litres_used)} L`,`Baseline about ${ft(a.litres_baseline)} L`],["Rooms in use warm",Dn(a.warm_share),`${a.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],["Days counted",String(a.days),`Since ${gn(a.since)}`]]}const t=(e.days??[]).filter(a=>a.eligible&&a.litres!=null),n=t.reduce((a,s)=>a+s.litres,0),o=(e.days??[]).filter(a=>!a.partial&&a.warm_share!=null).at(-1);return[["Days counted",`${e.progress.eligible_days} of ${e.progress.needed_days}`,""],["Oil used on those days",t.length?`${ft(n)} L`:Pn,t.length?`${ft(n/t.length)} L a day on average${e.litres_upper_bound?", an upper bound":""}`:""],["Rooms in use warm",o?Dn(o.warm_share):Pn,o?`On ${gn(o.date)}`:""]]}function Zd(e){return e.status==="ready"?ci(e):""}const Ks=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Ye=e=>Math.round(e*10)/10;function eu(e){if(!(e>0))return 1;const t=e/4,n=10**Math.floor(Math.log10(t));return[1,2,2.5,5,10].map(o=>o*n).find(o=>o>=t)}function tu(e,{width:t,height:n,ready:o,active:a=e.length-1,labelEvery:s}){const d=Math.max(10,t-40-4),u=Math.max(10,n-10-22),g=Math.max(0,...e.flatMap(E=>[E.litres??0,o?E.baseline??0:0])),p=eu(g),f=Math.max(p,Math.ceil(g/p)*p),y=E=>Ye(10+u-E/f*u),h=d/Math.max(1,e.length),b=Math.max(3,Math.min(h*.78,40)),w=Math.max(2,b*(o?.56:1)),$=s??Math.max(1,Math.ceil(e.length/Math.max(1,Math.floor(d/56)))),R=[];R.push(`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="false">`),R.push('<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>');for(let E=0;E<=f+1e-9;E+=p){const P=y(E);R.push(`<line class="${E===0?"sv-zero":"sv-grid"}" x1="40" x2="${t-4}" y1="${P}" y2="${P}"/>`);const Z=E+p>f+1e-9?" L":"";R.push(`<text class="sv-ytick" x="34" y="${P+4}" text-anchor="end">${Number(E.toFixed(2))}${Z}</text>`)}return e.forEach((E,P)=>{const Z=40+h*(P+.5),Q=P===a?0:-1;R.push(`<g class="sv-slot" data-i="${P}" tabindex="${Q}" role="img" aria-label="${Ks(ui(E))}" data-counted="${E.eligible}">`),R.push(`<rect class="sv-hit" x="${Ye(40+h*P)}" y="10" width="${Ye(h)}" height="${u}"/>`),!E.eligible||E.litres==null?R.push(`<rect class="sv-empty" x="${Ye(Z-b/2)}" y="10" width="${Ye(b)}" height="${u}"/>`):(R.push(`<rect class="sv-act" x="${Ye(Z-w/2)}" y="${y(E.litres)}" width="${Ye(w)}" height="${Ye(y(0)-y(E.litres))}"/>`),o&&E.baseline!=null&&R.push(`<rect class="sv-base" x="${Ye(Z-b/2)}" y="${y(E.baseline)}" width="${Ye(b)}" height="${Ye(y(0)-y(E.baseline))}"/>`)),R.push(`<rect class="sv-ring" x="${Ye(Z-b/2-3)}" y="7" width="${Ye(b+6)}" height="${u+6}"/>`),R.push("</g>"),P%$===0&&R.push(`<text class="sv-xtick" x="${Ye(Z)}" y="${n-6}" text-anchor="middle">${Ks(E.tick)}</text>`)}),R.push("</svg>"),R.join("")}function nu(e){if(e.status!=="ready"||!e.totals)return[];const t=(e.days??[]).filter(a=>a.eligible&&a.litres_saved!=null);let n=e.totals.litres_saved-t.reduce((a,s)=>a+s.litres_saved,0);const o=[];for(const a of t)n+=a.litres_saved,o.push([a.date,n]);return o}function ou(e,{width:t,height:n}){const i=e.map(f=>f[1]),l=Math.min(0,...i),d=Math.max(0,...i)-l||1,u=f=>Ye(34+(e.length<2?0:f/(e.length-1)*(t-34-8))),g=f=>Ye(8+(1-(f-l)/d)*(n-8-8)),p=e.map((f,y)=>`${y?"L":"M"}${u(y)} ${g(f[1])}`).join(" ");return[`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="true">`,`<line class="sv-zero" x1="34" x2="${t-8}" y1="${g(0)}" y2="${g(0)}"/>`,`<text class="sv-ytick" x="28" y="${g(0)+4}" text-anchor="end">0</text>`,`<path class="sv-line" d="${p}"/>`,e.length?`<rect class="sv-dot" x="${u(e.length-1)-3}" y="${g(i.at(-1))-3}" width="6" height="6"/>`:"","</svg>"].join("")}function au(e,t){if(!t.length)return"";const n=t.at(-1)[1],o=gn(e.totals.since);return Math.abs(n)<.05?`About the same oil as the baseline in all since ${o}.`:n<0?`Running total: about ${ft(n)} L more than the baseline since ${o}.`:`Running total: about ${ft(n)} L saved since ${o}.`}function su({transport:e,isAuthError:t,onAuth:n,onView:o}){let a=null,s=null,r=null,i=!1,l=!1,c="days",d=null,u=[],g=0;const p=()=>Te("savings-chart");function f(T,V){const q=Te(T);q.textContent!==V&&(q.textContent=V),q.hidden=!V}function y(T){Te("savings-stats").replaceChildren(...Qd(T).map(([q,m,D])=>{const F=document.createElement("div"),N=document.createElement("dt");N.textContent=q;const W=document.createElement("dd"),U=document.createElement("span");if(U.textContent=m,W.append(U),D){const ee=document.createElement("span");ee.className="sub",ee.textContent=D,W.append(ee)}return F.append(N,W),F}))}function h(T){const V=u[T];Te("savings-readout").textContent=V?ui(V):""}function b(){const T=p(),V=Math.floor(T.clientWidth);if(!V)return;g=V;const q=T.contains(document.activeElement)?document.activeElement.dataset.i:null;let m=u.findIndex(F=>F.key===d);m<0&&(m=u.length-1);const D=V<520;T.innerHTML=tu(u,{width:V,height:D?180:220,ready:a.status==="ready",active:m}),T.setAttribute("aria-label",Gd(a,u,c)),h(m),q!=null&&T.querySelector(`.sv-slot[data-i="${m}"]`)?.focus()}function w(T){const V=p().querySelectorAll(".sv-slot");if(!V.length)return;const q=Math.max(0,Math.min(V.length-1,T));for(const m of V)m.setAttribute("tabindex","-1");V[q].setAttribute("tabindex","0"),V[q].focus(),d=u[q]?.key??null,h(q)}function $(){const T=p();T.addEventListener("keydown",V=>{const q=Number(document.activeElement?.dataset?.i);if(Number.isNaN(q))return;const m={ArrowRight:q+1,ArrowLeft:q-1,Home:0,End:u.length-1}[V.key];m!=null&&(V.preventDefault(),w(m))}),T.addEventListener("focusin",V=>{const q=Number(V.target?.dataset?.i);Number.isNaN(q)||(d=u[q]?.key??null,h(q))}),T.addEventListener("click",V=>{const q=V.target.closest?.(".sv-slot");q&&w(Number(q.dataset.i))}),T.addEventListener("pointerover",V=>{const q=V.target.closest?.(".sv-slot");q&&V.pointerType==="mouse"&&h(Number(q.dataset.i))}),T.addEventListener("pointerleave",()=>{const V=u.findIndex(q=>q.key===d);h(V<0?u.length-1:V)}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&i&&Math.floor(T.clientWidth)!==g&&b()}).observe(T)}function R(T){const V=T.rooms??[];if(Te("savings-rooms-section").hidden=!V.length,!V.length)return;const q=Math.max(...V.map(F=>Math.abs(F.litres_saved)),.01),m=V.some(F=>F.litres_saved<0),D=Te("savings-rooms");D.dataset.negative=String(m),D.replaceChildren(...V.map(F=>{const N=document.createElement("li");N.className="sv-room";const W=document.createElement("span");W.className="sv-room-name",W.textContent=F.name;const U=document.createElement("span");U.className="sv-room-track",U.setAttribute("aria-hidden","true");const ee=document.createElement("span");ee.className="sv-room-fill",ee.dataset.sign=F.litres_saved<0?"minus":"plus",ee.style.transform=`scaleX(${Math.abs(F.litres_saved)/q})`,U.append(ee);const se=document.createElement("span");se.className="sv-room-value",se.textContent=`${li(F.litres_saved)} L`;const de=document.createElement("span");return de.className="sv-room-sub",de.textContent=F.warm_share==null?"Not in use in this time.":`Warm ${Dn(F.warm_share)} of the time in use, ${F.comfort_deficit_kh.toFixed(1)} degree-hours short.`,N.append(W,U,se,de),N}))}function E(T){Te("savings-table-body").replaceChildren(...Xd(T).map(q=>{const m=document.createElement("tr");return q.forEach((D,F)=>{const N=document.createElement(F===0?"th":"td");F===0&&(N.scope="row"),N.textContent=D,m.append(N)}),m})),Te("savings-table-empty").hidden=(T.days??[]).length>0}function P(T){a=T,o?.(T);const V=JSON.stringify(T);if(V===s)return;s=V;const q=T.status;if(Te("savings").dataset.state=q,f("savings-headline",ci(T)),Te("savings-missing").hidden=q!=="unavailable",f("savings-missing-text",q==="unavailable"?Kd(T):""),Te("savings-body").hidden=q==="unavailable",q==="unavailable")return;f("savings-baseline",T.baseline?.text??""),f("savings-basis",Jd(T));const m=q==="learning";if(Te("savings-progress").hidden=!m,m){const W=T.progress;Te("savings-meter").value=Math.round(100*Math.max(0,Math.min(1,W.eligible_days/Math.max(1,W.needed_days)))),f("savings-learning",Ud(T))}y(T),Te("savings-chart-h").textContent=m?"Oil used each day so far":"Oil used against the baseline",Te("savings-legend-base").hidden=m,Te("savings-modes").hidden=(T.days??[]).length<8,u=Vs(T,c),Te("savings-chart-empty").hidden=u.length>0,Te("savings-chart-wrap").hidden=!u.length,i?b():g=0;const D=(T.days??[]).filter(W=>!W.eligible);Te("savings-skipped").replaceChildren(...D.map(W=>{const U=document.createElement("li");return U.textContent=`${cs(W.date)}: ${W.why}.`,U})),Te("savings-skipped-section").hidden=!D.length;const N=nu(T);if(Te("savings-running").hidden=N.length<2,N.length>=2){const W=Te("savings-line-chart");W.innerHTML=ou(N,{width:Math.max(200,Math.floor(W.clientWidth)||320),height:90}),f("savings-running-text",au(T,N))}R(T),E(T)}async function Z(){if(!l){l=!0;try{P(await e.get("savings"))}catch(T){t(T)?n():!a&&i&&(Te("savings-headline").textContent="Couldn't load the savings. Retrying…")}l=!1,Q()}}function Q(){clearTimeout(r),r=setTimeout(Z,i?qd:Id)}Te("savings-modes").addEventListener("change",T=>{const V=T.target.value;!V||V===c||(c=V,d=null,a&&(u=Vs(a,c),b()))});const ne=Te("savings-table-toggle");return ne.addEventListener("change",()=>{Te("savings-table-wrap").hidden=!ne.checked}),$(),{async available(){try{return P(await e.get("savings")),Q(),!0}catch(T){return t(T)?null:/HTTP 404|not found/.test(String(T?.message))?!1:null}},show(){i=!0,a&&(s=null,P(a)),Z()},hide(){i&&(i=!1,Q())},refresh:Z}}const pe=e=>document.getElementById(e),ru={ok:"success",attention:"warning",warn:"warning",waiting:"cool",cool:"cool"};function Js(e,t){const n=ru[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n)}const Pa="–",iu="−",lu=6e4,cu=500,Ys={"6h":6*3600,"24h":86400,"7d":7*86400,"30d":30*86400},Gs={"6h":"the last 6 hours","24h":"the last 24 hours","7d":"the last 7 days","30d":"the last 30 days"},du=e=>e&&e[0].toLowerCase()+e.slice(1),An=(e,t)=>{const n=Math.abs(e).toFixed(t);return e<0&&Number(n)!==0?`${iu}${n}`:n},st=(e,t,n)=>`${e.toLocaleString("en-GB")} ${e===1?t:n}`;function kn(e){return e.room?`${e.room_name??e.room} ${du(e.label)}`:e.label}function _o(e){return e>=86400?e===86400?"1 day":`${e/86400} days`:e>=3600?`${e/3600} h`:`${e/60} min`}function nt(e,t,n=60){if(e==null||Number.isNaN(e))return Pa;const o=t?.kind??"gauge";if(o==="state")return n<=60||e===0||e===1?e>=.5?"On":"Off":`on ${Math.round(e*100)}% of the time`;if(o==="level")return(t.levels??[])[Math.round(e)]??String(e);switch(t?.unit){case"°C":return`${An(e,1)}°`;case"%":return`${An(e,0)}%`;case"W":return`${An(e,0)} W`;default:return Number.isInteger(e)?An(e,0):An(e,1)}}const uu=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],hu=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Xs=new Map;function Yo(e,t){let n=Xs.get(t);n||(n=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),Xs.set(t,n));const o=Object.fromEntries(n.formatToParts(new Date(e*1e3)).map(i=>[i.type,i.value])),a=Number(o.year),s=Number(o.month),r=Number(o.day);return{y:a,m:s,d:r,H:o.hour,M:o.minute,wd:new Date(Date.UTC(a,s-1,r)).getUTCDay()}}const Co=(e,t)=>{const n=Yo(e,t);return`${n.H}:${n.M}`},Eo=(e,t)=>{const n=Yo(e,t);return`${uu[n.wd]} ${n.d} ${hu[n.m-1]}`},qn=(e,t)=>`${Eo(e,t)} ${Co(e,t)}`;function ga(e,t){const n=Yo(e,t);return`${n.y}-${String(n.m).padStart(2,"0")}-${String(n.d).padStart(2,"0")}T${n.H}:${n.M}`}function Qs(e){return e<90?"just now":e<3600?`${Math.round(e/60)} min ago`:e<172800?`${Math.round(e/3600)} h ago`:`${Math.round(e/86400)} days ago`}function Zs(e){return e<60?`in ${Math.max(1,Math.round(e))} s`:e<5400?`in ${Math.round(e/60)} min`:`in ${Math.round(e/3600)} h`}function pu(e){if(!e?.available)return e?.why??"No raw data here.";const t=e.series?.length??0;if(!t)return"Nothing recorded yet. The first readings appear within a minute.";const n=e.retention_days?` Kept for ${st(Math.round(e.retention_days),"day","days")}.`:"";return`${st(t,"series","series")} from ${qn(e.first,e.timezone)} to now.${n}`}function fu(e,t,n=8){const o=String(t??"").toLowerCase().split(/\s+/).filter(Boolean);if(!o.length||!e?.series)return[];const a=[];for(const s of e.series){const r=`${kn(s)} ${s.metric} ${s.room??""} ${s.room?"":"house"}`.toLowerCase();if(o.every(i=>r.includes(i))&&a.push(s),a.length>=n)break}return a}function mu(e,t,n){const o=e?.series??[];return o.length===1?kn(o[0]):t?.scope==="room"&&!n?`${t.label}, every room`:t?.label??"Raw data"}function gu(e,t){if(!e)return"";const n=e.series.length,o=e.series.reduce((r,i)=>r+i.points.length,0),a=t&&Gs[t]?Gs[t]:`${qn(e.from,e.timezone)} to ${qn(e.to,e.timezone)}`,s=e.step_raised?" (a finer step would be too many points)":"";return`Every ${_o(e.step)}${s}, ${a}. ${st(n,"series","series")}, ${st(o,"point","points")}.`}function hi(e,t,n){const o=e?.points??[];if(!o.length)return[];let a=1/0,s=-1/0,r=0;for(const[,c,d,u]of o)a=Math.min(a,d),s=Math.max(s,u),r+=c;const i=o.at(-1),l=r/o.length;return t?.kind==="state"?[["Latest",nt(i[1],t,n)],["On",`${Math.round(l*100)}%`,"of the time shown"]]:t?.kind==="level"?[["Latest",nt(i[1],t,n)]]:[["Latest",nt(i[1],t)],["Lowest",nt(a,t)],["Highest",nt(s,t)],["Average",nt(l,t)]]}function wu(e,t,n,o,a){const s=e?.points?.[o];if(!s)return"";const[r,i,l,c]=s,d=e.room?e.room_name??e.room:e.label;let u=`${qn(r,a)}: ${d} ${nt(i,t,n)}`;return n>60&&t?.kind==="gauge"&&l!==c&&(u+=`, between ${nt(l,t)} and ${nt(c,t)} in these ${_o(n)}`),n>60&&t?.kind==="level"&&l!==c&&(u=`${qn(r,a)}: ${d} ${nt(l,t)} to ${nt(c,t)} in these ${_o(n)}`),`${u}.`}function bu(e,t,n=cu){const o=[];for(const s of e?.series??[]){const r=t[s.metric];for(const[i,l,c,d]of s.points)o.push([i,kn(s),l,c,d,r])}o.sort((s,r)=>r[0]-s[0]||s[1].localeCompare(r[1]));const a=e?.step??60;return{total:o.length,rows:o.slice(0,n).map(([s,r,i,l,c,d])=>[qn(s,e.timezone),r,nt(i,d,a),a>60&&d?.kind!=="state"?nt(l,d,60):Pa,a>60&&d?.kind!=="state"?nt(c,d,60):Pa])}}function yu(e,t,n){if(!e)return{kind:"none",badge:"Not set up",line:"Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",details:[]};const o=e.queued??{},a=[["Sends to",`${e.endpoint}, ${e.protocol==="http/json"?"JSON":"protobuf"} over HTTP`]],s=o.metrics??0,r=o.logs??0;if(a.push(["Waiting to send",s||r?`${st(s,"minute","minutes")} of readings, ${st(r,"log record","log records")}`:"Nothing"]),a.push(["Sent",`${st(e.sent?.metrics??0,"data point","data points")}, ${st(e.sent?.logs??0,"log record","log records")}`]),e.dropped&&a.push(["Dropped",`${st(e.dropped,"item","items")}: the queue was full, so the oldest went first`,"warn"]),e.rejected&&a.push(["Rejected by the collector",st(e.rejected,"item","items"),"warn"]),e.status==="off")return{kind:"off",badge:"Off",line:"Turned off in the house file (export.otlp.enabled).",details:a};if(e.status==="failing"){const i=e.next_attempt?` Trying again ${Zs(Math.max(0,e.next_attempt-t))}, and keeping the data until then.`:" Retrying, and keeping the data until then.",l=e.last_success?` Last sent at ${Co(e.last_success,n)}, ${Qs(t-e.last_success)}.`:"";return{kind:"attention",badge:"Failing",line:`Can't send: ${e.last_error??"no answer"}.${i}${l}`,details:a}}return e.status==="waiting"?{kind:"waiting",badge:"Waiting",line:`Nothing sent yet.${e.next_attempt?` The next send is due ${Zs(Math.max(0,e.next_attempt-t))}.`:" The first send is due within a minute."}`,details:a}:{kind:"ok",badge:"Sending",line:`Last sent at ${Co(e.last_success,n)}, ${Qs(t-e.last_success)}.`,details:a}}const er=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function vu(e,t=4){const n=e/t,o=10**Math.floor(Math.log10(n||1));for(const a of[1,2,2.5,5,10])if(a*o>=n)return a*o;return 10*o}function ku(e,t){const n=e.step;if(t?.kind==="state")return{lo:0,hi:1,ticks:n>60?[[0,"0%"],[.5,"50%"],[1,"100%"]]:[[0,"Off"],[1,"On"]]};if(t?.kind==="level"){const i=t.levels??[];return{lo:0,hi:Math.max(1,i.length-1),ticks:i.map((l,c)=>[c,l])}}let o=1/0,a=-1/0;for(const i of e.series)for(const[,,l,c]of i.points)o=Math.min(o,l),a=Math.max(a,c);Number.isFinite(o)||(o=0,a=1),a-o<1e-9&&(o-=1,a+=1);const s=vu(a-o);o=Math.floor(o/s)*s,a=Math.ceil(a/s)*s;const r=[];for(let i=o;i<=a+s/2;i+=s){const l=Math.round(i*1e3)/1e3,c=s<1?s<.1?2:1:0,d=t?.unit==="°C"?"°":t?.unit==="%"?"%":"";r.push([l,`${An(l,c)}${d}`])}return{lo:o,hi:a,ticks:r}}function $u(e,t,n,o){const a=t-e,s=Math.max(2,Math.floor(o/80)),i=[3600,3*3600,6*3600,12*3600,86400,2*86400,5*86400,7*86400].find(g=>a/g<=s)??14*86400,l=[],c=Yo(e,n),d=Date.UTC(c.y,c.m-1,c.d,Number(c.H),Number(c.M))/1e3-Math.floor(e/60)*60;let u=Math.ceil((e+d)/i)*i-d;for(;u<=t;u+=i)l.push([u,i>=86400?Eo(u,n):Co(u,n)]);return l}const Wt={left:46,right:14,top:12,bottom:26};function Da(e,t,n,o){const a=t?.kind==="level"?58:Wt.left,s=Math.max(10,n-a-Wt.right),r=Math.max(10,o-Wt.top-Wt.bottom),i=ku(e,t),l=Math.max(1,e.to-e.from);return{left:a,w:s,h:r,y:i,x:c=>a+(c-e.from)/l*s,yv:c=>Wt.top+r-(c-i.lo)/Math.max(1e-9,i.hi-i.lo)*r}}function tr(e,t,n,o){let a="",s=null;const r=n*2.5;for(const[i,l]of e.points){const c=t.x(i).toFixed(1),d=t.yv(l).toFixed(1);s===null||i-s[0]>r?a+=`M${c} ${d}`:o?a+=`H${c}V${d}`:a+=`L${c} ${d}`,s=[i,l]}return a}function xu(e,t,n){const o=[];let a=[];for(const s of e.points)a.length&&s[0]-a.at(-1)[0]>n*2.5&&(o.push(a),a=[]),a.push(s);return a.length&&o.push(a),o.filter(s=>s.length>1).map(s=>{const r=s.map(([l,,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`),i=s.slice().reverse().map(([l,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`);return`M${r.join("L")}L${i.join("L")}Z`}).join("")}function Su(e,t,{width:n,height:o,focus:a}){const s=Da(e,t,n,o),r=e.timezone,i=t?.kind!=="gauge",l=[`<svg width="${n}" height="${o}" viewBox="0 0 ${n} ${o}" aria-hidden="true" focusable="false">`];for(const[u,g]of s.y.ticks){const p=s.yv(u).toFixed(1);l.push(`<line class="rd-grid" x1="${s.left}" x2="${s.left+s.w}" y1="${p}" y2="${p}"/>`),l.push(`<text class="rd-ytick" x="${s.left-6}" y="${p}" dy="0.32em" text-anchor="end">${er(g)}</text>`)}const c=Wt.top+s.h;l.push(`<line class="rd-axis" x1="${s.left}" x2="${s.left+s.w}" y1="${c}" y2="${c}"/>`);for(const[u,g]of $u(e.from,e.to,r,s.w)){const p=s.x(u).toFixed(1);l.push(`<line class="rd-xmark" x1="${p}" x2="${p}" y1="${c}" y2="${c+4}"/>`),l.push(`<text class="rd-xtick" x="${p}" y="${c+17}" text-anchor="middle">${er(g)}</text>`)}const d=e.series.find(u=>u.key===a)??e.series[0];if(d&&e.step>60&&t?.kind==="gauge"){const u=xu(d,s,e.step);u&&l.push(`<path class="rd-band" d="${u}"/>`)}for(const u of e.series)u!==d&&l.push(`<path class="rd-line rd-other" d="${tr(u,s,e.step,i)}"/>`);return d&&l.push(`<path class="rd-line rd-ink" d="${tr(d,s,e.step,i)}"/>`),l.push(`<line class="rd-cursor" x1="0" x2="0" y1="${Wt.top}" y2="${c}" visibility="hidden"/>`),l.push('<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>'),l.push(`<rect class="rd-hit" x="${s.left}" y="${Wt.top}" width="${s.w}" height="${s.h}"/>`),l.push("</svg>"),l.join("")}function _u(e,t,n){const o=e.series.find(l=>l.key===n)??e.series[0];if(!o)return"Chart with no data.";const a=o.points,s=e.series.length>1?` ${st(e.series.length-1,"other series","other series")} shown thinner for comparison.`:"";if(!a.length)return`Line chart of ${kn(o)} with no data.${s}`;const i=hi(o,t,e.step).map(([l,c])=>`${l.toLowerCase()} ${c}`).join(", ");return`Line chart of ${kn(o)}, ${Eo(e.from,e.timezone)} to ${Eo(e.to,e.timezone)}, every ${_o(e.step)}: ${i}.${s} Use the arrow keys to read each point.`}function Cu({transport:e,isAuthError:t,onAuth:n}){let o=null,a=null,s={},r=!1,i=null,l=!1,c=0,d=null,u=null,g=0;const p={metric:"room.temperature",room:"",range:"24h",from:"",to:"",step:"auto"},f=()=>pe("data-chart"),y=()=>s[p.metric];function h(O,k){const S=pe(O);S.textContent!==k&&(S.textContent=k)}function b(O,k=""){const S=pe("data-note");S.hidden=!O,Js(S,k),h("data-note",O)}function w(){const O=new Set((o?.series??[]).map(L=>L.metric)),k=pe("data-metric"),S=[["room","Rooms"],["house","House"]].map(([L,j])=>{const X=document.createElement("optgroup");X.label=j;for(const M of o.metrics.filter(I=>I.scope===L&&O.has(I.metric))){const I=document.createElement("option");I.value=M.metric,I.textContent=M.label,X.append(I)}return X}).filter(L=>L.children.length);k.replaceChildren(...S),O.has(p.metric)||(p.metric=k.querySelector("option")?.value??""),k.value=p.metric}function $(){const O=y(),k=pe("data-room"),S=O?.scope!=="room",L=S?[]:(o?.rooms??[]).filter(X=>o.series.some(M=>M.metric===p.metric&&M.room===X.id)),j=document.createElement("option");j.value="",j.textContent=S?"Whole house":"Every room",k.replaceChildren(j,...L.map(X=>{const M=document.createElement("option");return M.value=X.id,M.textContent=X.name,M})),(S||!L.some(X=>X.id===p.room))&&(p.room=""),k.value=p.room,k.disabled=S}function R(){const O=pe("data-range"),k=p.range==="custom"?"":p.range;O.value!==k&&(O.value=k)}function E(){if(!o?.now||p.range==="custom")return;const O=Ys[p.range];pe("data-from").value=ga(o.now-O,o.timezone),pe("data-to").value=ga(o.now,o.timezone)}function P(){const O=new URLSearchParams;return p.metric&&O.set("metric",p.metric),p.room&&O.set("room",p.room),p.range==="custom"?(p.from&&O.set("from",p.from),p.to&&O.set("to",p.to)):(O.set("from",String(Math.floor(o.now-Ys[p.range]))),O.set("to",String(Math.ceil(o.now)))),O.set("step",p.step),O}function Z(){const O=a.series.find(j=>j.key===u),k=pe("data-stats"),S=O?hi(O,y(),a.step):[];k.hidden=!S.length;const L=a.series.length>1&&O;pe("data-stats-for").hidden=!L,h("data-stats-for",L?`Figures for ${kn(O)}, the line in ink.`:""),k.replaceChildren(...S.map(([j,X,M])=>{const I=document.createElement("div"),K=document.createElement("dt");K.textContent=j;const ae=document.createElement("dd"),ke=document.createElement("span");if(ke.textContent=X,ae.append(ke),M){const Le=document.createElement("span");Le.className="sub",Le.textContent=M,ae.append(Le)}return I.append(K,ae),I}))}function Q(){const O=pe("data-legend");O.hidden=a.series.length<2,O.replaceChildren(...a.series.map(k=>{const S=document.createElement("li"),L=document.createElement("button");L.type="button",L.className="rd-key",L.dataset.key=k.key,L.setAttribute("aria-pressed",String(k.key===u));const j=document.createElement("span");return j.className="rd-swatch",j.setAttribute("aria-hidden","true"),L.append(j,document.createTextNode(k.room?k.room_name??k.room:k.label)),S.append(L),S}))}function ne(){const{total:O,rows:k}=bu(a,s);pe("data-table-body").replaceChildren(...k.map(L=>{const j=document.createElement("tr");return L.forEach((X,M)=>{const I=document.createElement(M===0?"th":"td");M===0&&(I.scope="row"),I.textContent=X,j.append(I)}),j}));const S=a.step>60;for(const L of document.querySelectorAll(".rd-table .rd-range-col"))L.hidden=!S;for(const L of pe("data-table-body").children)L.children[3].hidden=!S,L.children[4].hidden=!S;h("data-table-note",O>k.length?`The newest ${st(k.length,"row","rows")} of ${O.toLocaleString("en-GB")}. Download the CSV for all of them.`:`${st(O,"row","rows")}, newest first.`)}function T(O){const k=a?.series.find(Le=>Le.key===u),S=k?.points??[];if(!S.length){h("data-readout","");return}const L=O==null?S.length-1:Math.max(0,Math.min(S.length-1,O));h("data-readout",wu(k,y(),a.step,L,a.timezone));const j=f().querySelector("svg");if(!j)return;const X=Da(a,y(),c,Number(j.getAttribute("height"))),[M,I]=S[L],K=j.querySelector(".rd-cursor"),ae=j.querySelector(".rd-dot"),ke=O==null?"hidden":"visible";K.setAttribute("x1",X.x(M)),K.setAttribute("x2",X.x(M)),ae.setAttribute("cx",X.x(M)),ae.setAttribute("cy",X.yv(I)),K.setAttribute("visibility",ke),ae.setAttribute("visibility",ke)}function V(){const O=f(),k=Math.floor(O.clientWidth);if(!k||!a)return;c=k;const S=k<520?200:260;O.innerHTML=Su(a,y(),{width:k,height:S,focus:u}),O.setAttribute("aria-label",_u(a,y(),u)),T(d)}function q(){const O=y(),k=a.series.some(S=>S.points.length);if(a.series.some(S=>S.key===u)||(u=(a.series.find(S=>S.points.length)??a.series[0])?.key??null,d=null),h("data-chart-h",mu(a,O,p.room?pe("data-room").selectedOptions[0]?.textContent:"")),h("data-meta",gu(a,p.range==="custom"?null:p.range)),pe("data-empty").hidden=k,pe("data-chart-wrap").hidden=!k,pe("data-downloads").hidden=!k,pe("data-table-toggle").hidden=!k,a.partial?b("Still indexing older readings, so part of this time may be missing for a few minutes.","cool"):b(""),!k){pe("data-stats").hidden=!0,pe("data-legend").hidden=!0;return}Z(),Q(),ne(),r?V():c=0}function m(){const O=yu(o?.export??null,Date.now()/1e3,o?.timezone??"UTC"),k=pe("data-export-badge");Js(k,O.kind),k.setAttribute("appearance",["ok","attention","waiting"].includes(O.kind)?"filled-outlined":"outlined"),h("data-export-badge",O.badge),h("data-export-line",O.line),pe("data-export").dataset.kind=O.kind;const S=pe("data-export-list");S.hidden=!O.details.length,S.replaceChildren(...O.details.map(([L,j,X])=>{const M=document.createElement("div");X&&(M.dataset.kind=X);const I=document.createElement("dt");I.textContent=L;const K=document.createElement("dd");return K.textContent=j,M.append(I,K),M}))}function D(){h("data-summary",pu(o)),m();const O=!!o?.available;pe("data-body").hidden=!O,O&&(s=Object.fromEntries(o.metrics.map(k=>[k.metric,k])),w(),$(),R(),E(),ee())}async function F(){if(!o?.available||!p.metric)return;const O=++g;try{const k=await e.get(`data?${P()}`);if(O!==g)return;a=k,q()}catch(k){if(O!==g)return;if(t(k)){n();return}b(/HTTP 400/.test(String(k?.message))?`Not shown: ${String(k.message).replace(/^.*HTTP 400 /,"")}`:"Couldn't load the readings. Retrying…","warn")}}async function N(){if(!l){l=!0;try{o=await e.get("data/series"),D(),r&&await F()}catch(O){t(O)?n():r&&b("Couldn't load the readings. Retrying…","warn")}l=!1,W()}}function W(){clearTimeout(i),r&&(i=setTimeout(N,lu))}function U(){d=null,p.range!=="custom"?N():F()}function ee(){const O=fu(o,pe("data-search").value),k=pe("data-results"),S=pe("data-search").value.trim()!=="";if(k.hidden=!S,!!S){if(!O.length){const L=document.createElement("li");L.className="rd-none",L.textContent="No series match. Try a room name, or a word such as temperature, valve or burner.",k.replaceChildren(L);return}k.replaceChildren(...O.map(L=>{const j=document.createElement("li"),X=document.createElement("button");return X.type="button",X.className="rd-result",X.dataset.metric=L.metric,X.dataset.room=L.room??"",X.textContent=kn(L),j.append(X),j}))}}function se(){pe("data-search").addEventListener("input",ee),pe("data-search").addEventListener("keydown",S=>{S.key==="Escape"&&(pe("data-search").value="",ee()),S.key==="Enter"&&(S.preventDefault(),pe("data-results").querySelector(".rd-result")?.click())}),pe("data-results").addEventListener("click",S=>{const L=S.target.closest?.(".rd-result");L&&(p.metric=L.dataset.metric,$(),p.room=L.dataset.room,pe("data-metric").value=p.metric,$(),u=null,pe("data-search").value="",ee(),pe("data-search").focus(),U())}),pe("data-metric").addEventListener("change",S=>{p.metric=S.target.value,$(),u=null,U()}),pe("data-room").addEventListener("change",S=>{p.room=S.target.value,u=null,U()}),pe("data-step").addEventListener("change",S=>{p.step=S.target.value,U()}),pe("data-range").addEventListener("change",S=>{const L=S.target.value;!L||p.range===L||(p.range=L,R(),E(),U())});for(const S of["data-from","data-to"])pe(S).addEventListener("change",()=>{p.range="custom",p.from=pe("data-from").value,p.to=pe("data-to").value,R(),U()});pe("data-legend").addEventListener("click",S=>{const L=S.target.closest?.(".rd-key");if(!(!L||L.dataset.key===u)){u=L.dataset.key,d=null;for(const j of pe("data-legend").querySelectorAll(".rd-key"))j.setAttribute("aria-pressed",String(j===L));Z(),V()}});const O=f();O.addEventListener("keydown",S=>{const j=a?.series.find(I=>I.key===u)?.points.length??0;if(!j)return;const X=d??j-1,M={ArrowRight:X+1,ArrowLeft:X-1,Home:0,End:j-1,PageUp:X-10,PageDown:X+10}[S.key];M!=null&&(S.preventDefault(),d=Math.max(0,Math.min(j-1,M)),T(d))}),O.addEventListener("pointermove",S=>{const L=a?.series.find(ae=>ae.key===u),j=O.querySelector("svg");if(!L?.points.length||!j)return;const X=Da(a,y(),c,Number(j.getAttribute("height"))),M=S.clientX-j.getBoundingClientRect().left,I=a.from+(M-X.left)/X.w*(a.to-a.from);let K=0;for(let ae=1;ae<L.points.length;ae++)Math.abs(L.points[ae][0]-I)<Math.abs(L.points[K][0]-I)&&(K=ae);d=K,T(d)}),O.addEventListener("pointerleave",S=>{S.pointerType==="mouse"&&(d=null,T(null))}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&r&&Math.floor(O.clientWidth)!==c&&V()}).observe(O);const k=pe("data-table-toggle");k.addEventListener("change",()=>{pe("data-table-wrap").hidden=!k.checked}),pe("data-csv").addEventListener("click",()=>fe("csv")),pe("data-json").addEventListener("click",()=>fe("json"))}function de(O){const k=a?ga(a.to,a.timezone).slice(0,10):"data";return`radiate-${p.metric}${p.room?`-${p.room}`:""}-${k}.${O}`}async function fe(O){const k=pe("data-dl-status");k.textContent="";try{let S;if(O==="json")S=new Blob([JSON.stringify(a,null,2)],{type:"application/json"});else{const j=P();j.set("format","csv"),S=new Blob([await e.text(`data?${j}`)],{type:"text/csv"})}const L=document.createElement("a");L.href=URL.createObjectURL(S),L.download=de(O),document.body.append(L),L.click(),L.remove(),setTimeout(()=>URL.revokeObjectURL(L.href),1e3),k.textContent=`Downloaded ${L.download}.`}catch(S){if(t(S)){n();return}k.textContent="Not downloaded. Check the connection and try again."}}return se(),{async available(){try{return o=await e.get("data/series"),D(),!!o.available}catch(O){return t(O)?null:/HTTP 404|not found/.test(String(O?.message))?!1:null}},show(){r=!0,N()},hide(){r&&(r=!1,clearTimeout(i))}}}const Re=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),jt=e=>e==null?"–":(Math.round(e*10)/10).toFixed(1),nr=e=>`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,wa=(e,t,n)=>`${e} ${e===1?t:n}`,or=new Set(["passive","unheated"]),tt=.5,Ht=14,Bt=10,ar=/bed|bath|landing|en.?suite|nursery|study|loft|attic/i,qa=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),sr=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16));function Tn(e){const t=[12,15,17,19,22].map(o=>[o,sr(qa(`--t${o}`)||"#888888")]);if(e==null)return sr(qa("--hm-none")||"#cccccc");const n=Math.max(12,Math.min(22,e));for(let o=0;o<t.length-1;o++){const[a,s]=t[o],[r,i]=t[o+1];if(n<=r)return s.map((l,c)=>Math.round(l+(i[c]-l)*((n-a)/(r-a))))}return t.at(-1)[1]}const Ut=(e,t=1)=>`rgb(${e.map(n=>Math.round(n*t)).join(",")})`,rr=e=>Ut(Tn(e)),ba=e=>{const t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},ir=e=>.2126*ba(e[0])+.7152*ba(e[1])+.0722*ba(e[2]),Eu=[20,28,24];function pi(e){const t=ir(e),n=(t+.05)/(ir(Eu)+.05),o=1.05/(t+.05);return n>=o?"#141c18":"#ffffff"}function lr(e){const t=e.filter(r=>ar.test(r.name)),n=e.filter(r=>!ar.test(r.name)),o=t.length&&n.length?["Ground floor","First floor"]:["Ground floor"],a={},s=(r,i)=>r.forEach((l,c)=>{a[l.id]={floor:i,x:c%3*3,y:Math.floor(c/3)*3,w:3,d:3}});return o.length===2?(s(n,0),s(t,1)):s(e,0),{floors:o,rooms:a}}const ya=34,Au=Math.cos(Math.PI/6),fi=Math.sin(Math.PI/6),cr=.34,Tu=e=>Math.max(3.2,e*fi*.8),Ne=(e,t,n)=>[(e-t)*Au*ya,(e+t)*fi*ya-n*ya],co=e=>e.map(t=>t.map(n=>n.toFixed(1)).join(",")).join(" "),Ru=(e,t)=>e.length<=t?e:`${e.slice(0,Math.max(1,t-1)).trimEnd()}…`;function dr(e,t,{selected:n,interactive:o}){let a="",s="";const r=qa("--hm-line");let i=0;for(const[c,d]of Object.entries(e.rooms))t.has(c)&&(i=Math.max(i,d.x+d.w+d.y+d.d));const l=Tu(i);return e.floors.forEach((c,d)=>{const u=d*l,g=Object.entries(e.rooms).filter(([h,b])=>b.floor===d&&t.has(h)),p=Math.max(3,...g.map(([,h])=>h.x+h.w)),f=Math.max(3,...g.map(([,h])=>h.y+h.d));if(s+=`<polygon points="${co([Ne(-.2,-.2,u),Ne(p+.2,-.2,u),Ne(p+.2,f+.2,u),Ne(-.2,f+.2,u)])}" fill="none" stroke="${r}" stroke-width="1.5"/>`,d>0)for(const[h,b]of[[-.2,-.2],[p+.2,-.2],[-.2,f+.2]]){const w=Ne(h,b,u),$=Ne(h,b,u-l+cr);s+=`<line x1="${w[0]}" y1="${w[1]}" x2="${$[0]}" y2="${$[1]}" stroke="${r}" stroke-dasharray="2 4"/>`}const y=Ne(-.2,f+.2,u);s+=`<text class="hm-ftag" x="${y[0]-8}" y="${y[1]+4}" text-anchor="end">${Re(c)}</text>`,g.sort((h,b)=>h[1].x+h[1].y-(b[1].x+b[1].y)).forEach(([h,b])=>{const w=t.get(h),$=Tn(w.temperature),R=.05,E=b.x+R,P=b.y+R,Z=b.w-2*R,Q=b.d-2*R,ne=u+cr,T=[Ne(E,P,ne),Ne(E+Z,P,ne),Ne(E+Z,P+Q,ne),Ne(E,P+Q,ne)],V=[Ne(E+Z,P,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,ne),Ne(E+Z,P,ne)],q=[Ne(E,P+Q,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,ne),Ne(E,P+Q,ne)],m=Ne(E+Z/2,P+Q/2,ne),D=pi($);let F="";if(w.calling||w.topup||w.role==="passive"){const U=Ne(E+.25,P+Q-.15,ne),ee=Ne(E+Math.min(Z-.25,1.4),P+Q-.15,ne);F=`<line class="hm-rad" x1="${U[0]}" y1="${U[1]}" x2="${ee[0]}" y2="${ee[1]}" stroke="${D}" stroke-width="3"/>`}const N=`${w.name}, ${w.temperature==null?"no reading":`${jt(w.temperature)} degrees`}${w.calling?", heating":""}`,W=o?`tabindex="0" role="button" aria-pressed="${h===n}"`:"";a+=`<g class="hm-room" data-id="${Re(h)}" ${W} aria-label="${Re(N)}">
        <polygon points="${co(V)}" fill="${Ut($,.62)}"/><polygon points="${co(q)}" fill="${Ut($,.8)}"/>
        <polygon class="hm-top" points="${co(T)}" fill="${Ut($)}"/>${F}
        <text class="hm-t" x="${m[0]}" y="${m[1]}" text-anchor="middle" fill="${D}">${jt(w.temperature)}</text>
        ${Z>=1.4?`<text class="hm-n" x="${m[0]}" y="${m[1]+13}" text-anchor="middle" fill="${D}">${Re(Ru(w.name,Math.floor(Z*5.5)))}</text>`:""}</g>`})}),s+a}function ur(e){requestAnimationFrame(()=>{try{const t=e.getBBox();t.width&&e.setAttribute("viewBox",`${t.x-10} ${t.y-10} ${t.width+20} ${t.height+20}`)}catch{}})}function Lu({modelEl:e,statusEl:t,planEl:n,transport:o,onSelect:a,onWeek:s,arrangeLock:r=()=>""}){let i=null,l=new Map,c=null,d=!1,u=!1,g=!1,p=0,f=null,y=null,h=0,b=null,w=null,$="";async function R(){try{const k=await o.call("GET","layout");k.status===200&&k.body?.layout?(c=k.body.layout,d=!0):k.status===404&&(u=!0)}catch{}ne()}function E(){clearTimeout(w),$="Saving…",P(),w=setTimeout(async()=>{if(u){$="This server can't keep a layout. Update Radiate to save it.",P();return}try{const k=await o.call("PUT","layout",c);d=k.status===200,$=d?"Saved.":`Not saved: ${typeof k.body=="string"?k.body:"the server refused it"}.`}catch{$="Not saved. Check the connection and move a room to try again."}P()},500)}function P(){const k=e.querySelector(".hm-save");k&&(k.textContent=$)}const Z=()=>Object.keys(c.rooms).filter(k=>l.has(k)),Q=()=>[...l.keys()].filter(k=>!c.rooms[k]);function ne(){if(!c||!l.size)return;if(g){m();return}if(!e.querySelector(".hm-iso")){e.innerHTML=`
        <div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m" id="hm-model-h">Your house</h2>
          <div class="wa-cluster wa-gap-s wa-align-items-center">
            <span class="hm-scale" aria-hidden="true"><span class="hm-lab">12°</span><span class="hm-ramp"></span><span class="hm-lab">22°</span></span>
            <wa-button size="s" appearance="outlined" data-act="arrange" aria-describedby="hm-arrange-lock"><wa-icon slot="start" name="pen-ruler"></wa-icon><span class="hm-arrange-text">Arrange rooms</span></wa-button>
            <wa-tag size="s" class="lock-tag" id="hm-arrange-lock" hidden></wa-tag>
          </div>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line hm-intro">Each block is a room in its temperature colour. A blinking bar is a radiator taking heat. Select a room to see it and change its temperature. <span class="hm-guess" hidden>Rooms are placed by a guess from their names. Arrange them to match your house.</span> <a href="#guide/model">How to read the model</a></p>
          <svg class="hm-iso" role="group" aria-labelledby="hm-model-h"></svg>
        </div>`,e.querySelector("[data-act=arrange]").addEventListener("click",()=>{g=!0,p=0,ne(),ee(),e.querySelector("#hm-model-h")?.focus()});const M=e.querySelector(".hm-iso");M.addEventListener("click",I=>{const K=I.target.closest(".hm-room");K&&T(K.dataset.id,K)}),M.addEventListener("keydown",I=>{const K=I.target.closest(".hm-room");K&&(I.key==="Enter"||I.key===" ")&&(I.preventDefault(),T(K.dataset.id,K))})}e.querySelector(".hm-ramp").style.background=`linear-gradient(90deg, ${[12,15,17,19,22].map(M=>Ut(Tn(M))).join(", ")})`,e.querySelector(".hm-guess").hidden=d;const k=r(),S=e.querySelector("[data-act=arrange]");S.disabled=!!k,k?S.dataset.locked="":delete S.dataset.locked;const L=e.querySelector("#hm-arrange-lock");L.hidden=!k,L.textContent=k;const j=e.querySelector(".hm-iso"),X=j.contains(document.activeElement)?document.activeElement.closest(".hm-room")?.dataset.id:null;j.innerHTML=dr(c,l,{selected:f,interactive:!0}),X&&j.querySelector(`.hm-room[data-id="${CSS.escape(X)}"]`)?.focus(),ur(j)}function T(k,S){a?.(k,S)}function V(){for(const k of e.querySelectorAll(".hm-room"))k.setAttribute("aria-pressed",String(k.dataset.id===f))}const q=40;function m(){const k=Z().filter(M=>c.rooms[M].floor===p);let S="";for(let M=0;M<=Ht/tt;M++)S+=`<line x1="${M*q*tt}" y1="0" x2="${M*q*tt}" y2="${Bt*q}" class="${M%2?"hm-g2":"hm-g1"}"/>`;for(let M=0;M<=Bt/tt;M++)S+=`<line x1="0" y1="${M*q*tt}" x2="${Ht*q}" y2="${M*q*tt}" class="${M%2?"hm-g2":"hm-g1"}"/>`;const L=k.map(M=>{const I=c.rooms[M],K=l.get(M),ae=Tn(K.temperature),ke=pi(ae);return`<g class="hm-r2${M===f?" sel":""}" data-id="${Re(M)}" transform="translate(${I.x*q},${I.y*q})" tabindex="0" role="button"
          aria-label="${Re(K.name)}, ${I.w} by ${I.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${I.w*q}" height="${I.d*q}" fill="${Ut(ae)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ke}">${Re(K.name)}</text>
        <text class="hm-r2s" x="7" y="${I.d*q-7}" fill="${ke}">${I.w} × ${I.d} m</text>
        <rect class="hm-handle" x="${I.w*q-14}" y="${I.d*q-14}" width="14" height="14"/></g>`}).join(""),j=Q(),X=f&&c.rooms[f]?.floor===p?l.get(f):null;e.innerHTML=`
      <div slot="header" class="wa-split wa-gap-s">
        <h2 class="wa-heading-m" id="hm-model-h" tabindex="-1">Arrange rooms</h2>
        <div class="wa-cluster wa-gap-xs">
          <wa-button size="s" appearance="outlined" data-act="reset">Start again</wa-button>
          <wa-button size="s" variant="brand" data-act="done">Done</wa-button>
        </div>
      </div>
      <div class="wa-stack wa-gap-s">
        <div class="wa-cluster wa-gap-2xs hm-floors" role="group" aria-label="Floor">
          ${c.floors.map((M,I)=>`<button type="button" class="wa-size-s ${I===p?"wa-brand":"wa-outlined"}" data-floor="${I}" aria-pressed="${I===p}">${Re(M)}</button>`).join("")}
          ${c.floors.length<6?'<button type="button" class="wa-size-s wa-plain" data-act="add-floor">Add floor</button>':""}
        </div>
        <div class="wa-cluster wa-gap-s wa-align-items-end">
          <wa-input size="s" label="Floor name" maxlength="40" value="${Re(c.floors[p])}" data-act="rename"></wa-input>
          ${c.floors.length>1&&!k.length?'<wa-button size="s" appearance="plain" data-act="remove-floor">Remove this floor</wa-button>':""}
        </div>
        <svg class="hm-plan2d" viewBox="0 0 ${Ht*q} ${Bt*q}" aria-label="Plan of ${Re(c.floors[p])}">${S}${L}</svg>
        <div class="wa-cluster wa-gap-xs wa-align-items-center hm-tray">
          <span class="wa-caption-m wa-color-text-quiet">${j.length?"Not placed yet:":"Every room is placed."}</span>
          ${j.map(M=>`<button type="button" class="wa-size-s wa-outlined hm-chip" data-add="${Re(M)}">Place ${Re(l.get(M).name)}</button>`).join("")}
          ${X?`<button type="button" class="wa-size-s wa-plain" data-act="unplace">Take ${Re(X.name)} off the plan</button>`:""}
        </div>
        <p class="help-line">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
        <p class="hm-save wa-caption-m wa-color-text-quiet" role="status">${Re($)}</p>
      </div>`,D()}function D(){const k=e;k.querySelector("[data-act=done]").addEventListener("click",()=>{g=!1,e.innerHTML="",ne(),ee(),e.querySelector("[data-act=arrange]")?.focus()}),k.querySelector("[data-act=reset]").addEventListener("click",()=>{c=lr([...l.values()]),p=0,E(),m(),ee()});for(const M of k.querySelectorAll("[data-floor]"))M.addEventListener("click",()=>{p=Number(M.dataset.floor),m()});k.querySelector("[data-act=add-floor]")?.addEventListener("click",()=>{c.floors.push(c.floors.length===1?"First floor":c.floors.length===2?"Second floor":`Floor ${c.floors.length+1}`),p=c.floors.length-1,E(),m(),ee()}),k.querySelector("[data-act=remove-floor]")?.addEventListener("click",()=>{c.floors.splice(p,1);for(const M of Object.values(c.rooms))M.floor>p&&(M.floor-=1);p=Math.max(0,p-1),E(),m(),ee()}),k.querySelector("[data-act=rename]").addEventListener("change",M=>{const I=String(M.target.value??"").trim();I&&(c.floors[p]=I,E(),m(),ee())});for(const M of k.querySelectorAll("[data-add]"))M.addEventListener("click",()=>{const I=M.dataset.add;c.rooms[I]={floor:p,...N(p)},f=I,E(),m(),ee(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus()});k.querySelector("[data-act=unplace]")?.addEventListener("click",()=>{delete c.rooms[f],E(),m(),ee()});const S=k.querySelector(".hm-plan2d"),L=M=>{const I=S.createSVGPoint();return I.x=M.clientX,I.y=M.clientY,I.matrixTransform(S.getScreenCTM().inverse())},j=M=>Math.round(M/tt)*tt;S.addEventListener("pointerdown",M=>{const I=M.target.closest(".hm-r2");if(!I||b)return;const K=I.dataset.id,ae=c.rooms[K],ke=L(M);f=K,b={id:K,pointer:M.pointerId,resize:M.target.classList.contains("hm-handle"),ox:ke.x/q-ae.x,oy:ke.y/q-ae.y,moved:!1},S.setPointerCapture(M.pointerId);for(const Le of S.querySelectorAll(".hm-r2"))Le.classList.toggle("sel",Le.dataset.id===K)}),S.addEventListener("pointermove",M=>{if(!b||M.pointerId!==b.pointer)return;const I=c.rooms[b.id],K=L(M);b.resize?(I.w=Math.min(Ht-I.x,Math.max(1,j(K.x/q-I.x))),I.d=Math.min(Bt-I.y,Math.max(1,j(K.y/q-I.y)))):(I.x=Math.max(0,Math.min(Ht-I.w,j(K.x/q-b.ox))),I.y=Math.max(0,Math.min(Bt-I.d,j(K.y/q-b.oy)))),b.moved=!0,F(S,b.id),W()});const X=M=>{if(!b||M.pointerId!==b.pointer)return;const{id:I,moved:K}=b;b=null,K&&E(),m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus({preventScroll:!0})};S.addEventListener("pointerup",X),S.addEventListener("pointercancel",X),S.addEventListener("keydown",M=>{const I=M.target.closest(".hm-r2");if(!I)return;const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[M.key];if(M.key==="Enter"||M.key===" "){M.preventDefault(),f=I.dataset.id,m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(f)}"]`)?.focus();return}if(!K)return;M.preventDefault();const ae=c.rooms[I.dataset.id];M.shiftKey?(ae.w=Math.min(Ht-ae.x,Math.max(1,ae.w+K[0]*tt)),ae.d=Math.min(Bt-ae.y,Math.max(1,ae.d+K[1]*tt))):(ae.x=Math.max(0,Math.min(Ht-ae.w,ae.x+K[0]*tt)),ae.y=Math.max(0,Math.min(Bt-ae.d,ae.y+K[1]*tt))),f=I.dataset.id,F(S,I.dataset.id),I.setAttribute("aria-label",`${l.get(I.dataset.id).name}, ${ae.w} by ${ae.d} metres, at ${ae.x}, ${ae.y}.`),W(),E()})}function F(k,S){const L=c.rooms[S],j=k.querySelector(`.hm-r2[data-id="${CSS.escape(S)}"]`);if(!j)return;j.setAttribute("transform",`translate(${L.x*q},${L.y*q})`);const X=j.querySelector(".hm-body");X.setAttribute("width",L.w*q),X.setAttribute("height",L.d*q);const M=j.querySelector(".hm-handle");M.setAttribute("x",L.w*q-14),M.setAttribute("y",L.d*q-14);const I=j.querySelector(".hm-r2s");I.setAttribute("y",L.d*q-7),I.textContent=`${L.w} × ${L.d} m`}function N(k){const S=Z().map(L=>c.rooms[L]).filter(L=>L.floor===k);for(let L=0;L<=Bt-2;L+=tt)for(let j=0;j<=Ht-2;j+=tt)if(!S.some(X=>j<X.x+X.w&&j+2>X.x&&L<X.y+X.d&&L+2>X.y))return{x:j,y:L,w:2,d:2};return{x:0,y:0,w:2,d:2}}function W(){const k=t.querySelector(".hm-preview");k&&(k.innerHTML=dr(c,l,{selected:f,interactive:!1}),ur(k))}function U(){let k=t.querySelector(".hm-live");return k||(t.innerHTML=`<h2 slot="header" class="wa-heading-m hm-status-h">The house now</h2>
        <div class="wa-stack wa-gap-m">
          <div class="hm-live wa-stack wa-gap-m"></div>
          <p class="help-line hm-help">The big number is rooms that want heat, out of the rooms Radiate controls. <a href="#guide/now">What the house now shows</a></p>
        </div>`,k=t.querySelector(".hm-live")),t.querySelector(".hm-help").hidden=g,t.querySelector(".hm-status-h").textContent=g?"Live model":"The house now",k}function ee(){if(!i)return;const k=U();if(g){k.innerHTML=`
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="help-line">${wa(c.floors.length,"floor","floors")}, ${Z().length} of ${wa(l.size,"room","rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`,W();return}const S=[...l.values()],L=S.filter(ge=>!or.has(ge.role)),j=L.filter(ge=>ge.calling),X=S.filter(ge=>ge.temperature!=null),M=i.telemetry??{},I=M.simulated||M.boiler_linked!==!1,K=i.boiler;let ae;i.mode==="off"?ae="Heating is off.":i.mode==="frost"?ae="Frost protection only.":j.length?I?K.state==="firing"?ae=`${j.length===1?"room is":"rooms are"} heating. Burner on.`:ae=`${j.length===1?"room wants":"rooms want"} heat.`:ae=`${j.length===1?"room wants":"rooms want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:ae="No room needs heat right now.";const ke=L.map(ge=>ge.target).filter(ge=>ge!=null),Le=ke.length?Mu(ke):null,Je=ge=>(Math.max(12,Math.min(22,ge))-12)/10*100,Ae=[...X].sort((ge,lt)=>ge.temperature-lt.temperature),on=X.map(ge=>`<rect x="${Je(ge.temperature)}%" y="14" width="4" height="26" rx="2" fill="${Ut(Tn(ge.temperature))}" transform="translate(-2,0)"><title>${Re(ge.name)} ${jt(ge.temperature)}°</title></rect>`).join(""),z=[12,14,16,18,20,22].map(ge=>`<text class="hm-axis" x="${Je(ge)}%" y="58" text-anchor="middle">${ge}</text>`).join(""),oe=Le!=null?`<rect x="${Je(Le)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>`:"",te=Ae.length?`Coldest ${Ae[0].name} ${jt(Ae[0].temperature)}°, warmest ${Ae.at(-1).name} ${jt(Ae.at(-1).temperature)}°.${Le!=null?` Most heated rooms aim for ${jt(Le)}°.`:""}`:"No readings yet.",ue=!M.simulated&&(i.alert_details??[]).some(ge=>ge.code==="driver.shelly"),ye=I?ue?se("fire","Boiler","Not reachable","Radiate can't see or switch the boiler right now.","warning","text"):se("fire","Boiler",{idle:"Idle",lead:"Opening valves",firing:"Firing",rest:"Resting"}[K.state]??"–",K.state==="firing"?`${Math.round(K.burn_elapsed_s/60)} min so far`:`${wa(K.starts_last_hour,"start","starts")} in the last hour`,K.state==="firing"?"brand":"neutral","text"):se("fire","Boiler","Not linked","Radiate can't switch it until the relay is set up.","neutral","text"),Ie=M.dry_run?se("eye","Dry run",String(M.intended_writes??0),"valve and boiler changes held back","warning"):se("sliders","Mode",{auto:"Auto",frost:"Frost",off:"Off"}[i.mode]??i.mode,i.settings?.demand_mode?`${Ou(i.settings.demand_mode)} demand`:"","neutral","text"),_e=se("microchip","Devices",String(h),h?h===1?"needs attention":"need attention":"all reporting well",h>0?"warning":"neutral"),De=L.map(ge=>ge.model?.confidence).filter(ge=>ge!=null),qe=De.length?Math.round(De.reduce((ge,lt)=>ge+lt,0)/De.length*100):null,Me=se("graduation-cap","Learning",qe==null?"–":`${qe}%`,qe==null?"waiting for the first burns":qe<50?"how sure Radiate is of each room, on average":"average confidence in each room","neutral");k.innerHTML=`
      <div class="hm-hero">
        <div class="hm-big readout">${j.length}<small>/${L.length}</small></div>
        <p class="wa-heading-s">${Re(ae)}</p>
      </div>
      <div class="hm-spread wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">Where every room sits</span>
        <svg role="img" aria-label="${Re(te)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${oe}${on}${z}</svg>
        <span class="wa-caption-m wa-color-text-quiet">${Re(te)}</span>
      </div>
      <div class="hm-cells">${ye}${Ie}${_e}${Me}</div>
      ${de()}`}function se(k,S,L,j,X,M="readout"){const I=M==="readout"?`<span class="hm-value readout">${Re(L)}</span>`:`<span class="hm-value hm-word">${Re(L)}</span>`;return`<div class="hm-cell" data-variant="${X}">
      <span class="wa-cluster wa-gap-xs wa-caption-m wa-color-text-quiet"><wa-icon name="${k}" class="hm-cell-icon"></wa-icon>${Re(S)}</span>
      ${I}<span class="wa-caption-s wa-color-text-quiet">${Re(j)}</span></div>`}function de(){const k=new Map;for(const j of l.values()){if(or.has(j.role)||j.next_setpoint==null||j.next_in_min==null)continue;const X=j.next_in_min;k.has(X)||k.set(X,[]),k.get(X).push(j)}const S=[...k.entries()].sort((j,X)=>j[0]-X[0]).slice(0,3);return S.length?`<div class="hm-next wa-stack wa-gap-2xs"><span class="wa-caption-m wa-color-text-quiet">Coming up</span><ul>${S.map(([j,X])=>{const M=new Map;for(const K of X)M.has(K.next_setpoint)||M.set(K.next_setpoint,[]),M.get(K.next_setpoint).push(K.name);const I=[...M.entries()].map(([K,ae])=>{const ke=ae.length<2?ae[0]:`${ae.slice(0,-1).join(", ")} and ${ae.at(-1)}`,Le=X.find(Ae=>Ae.next_setpoint===K)?.target,Je=Le!=null&&K<Le?"cools to":ae.length>1?"warm to":"warms to";return`${ke} ${ae.length>1&&Je==="cools to"?"cool to":Je} ${jt(K)}°`}).join(". ");return`<li><time class="readout">${nr((i.minute_of_day+j)%1440)}</time><span>${Re(I)}.</span></li>`}).join("")}</ul></div>`:""}function fe(){if(!y?.rooms?.length||!i){n.hidden=!0;return}n.hidden=!1;const k=y.now?.weekday??0,S=i.minute_of_day??y.now?.minute??0,L=y.rooms.map(j=>{const X=[...j.days[k]?.transitions??[]].sort((K,ae)=>K.minute-ae.minute);if(!X.length)return"";X[0].minute>0&&X.unshift({minute:0,setpoint:X.at(-1).setpoint});const M=X.map((K,ae)=>{const ke=ae+1<X.length?X[ae+1].minute:1440;return ke<=K.minute?"":`<span style="width:${(ke-K.minute)/1440*100}%;background:${Ut(Tn(K.setpoint))}" title="${jt(K.setpoint)}° from ${nr(K.minute)}"></span>`}).join(""),I=j.days[k]?.text??"";return`<span class="hm-pname">${Re(j.name)}</span><div class="hm-strip" role="img" aria-label="${Re(`${j.name} today: ${I}`)}">${M}<i class="hm-now" style="left:${S/1440*100}%"></i></div>`}).join("");n.querySelector(".hm-tl")||(n.innerHTML=`<div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m">Today's plan</h2>
          <wa-button size="s" appearance="plain" data-act="week"><wa-icon slot="end" name="arrow-down"></wa-icon>Week schedules</wa-button>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each strip is a room's day, coloured by the temperature it aims for. The upright line is now. <a href="#guide/schedules">Change the weekly times</a></p>
          <div class="hm-tl"></div>
        </div>`,n.querySelector("[data-act=week]").addEventListener("click",()=>s?.())),n.querySelector(".hm-tl").innerHTML=`${L}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`}function O(k){i=k;const S=new Map;for(const j of k.rooms)S.set(j.id,j);const L=!l.size;l=S,c||(c=lr(k.rooms)),L&&R(),g?W():ne(),ee(),fe()}return{update:O,week(k){y=k,fe()},devices(k){h=k,ee()},select(k){f=k,g||V()},redraw(){!g&&e.querySelector(".hm-iso")&&ne(),ee(),fe()},get editing(){return g}}}function Mu(e){const t=new Map;for(const n of e)t.set(n,(t.get(n)??0)+1);return[...t.entries()].sort((n,o)=>o[1]-n[1]||o[0]-n[0])[0][0]}const Ou=e=>e.charAt(0).toUpperCase()+e.slice(1),hr="radiate.guideNote";function Nu({root:e}){const t=n=>n?e.querySelector(`#g-${CSS.escape(n)} > h3`):null;return{show(){},hide(){},reveal(n){const o=t(n);return o?(o.focus({preventScroll:!0}),o.scrollIntoView({block:"start"}),!0):!1}}}function zu({note:e,tab:t}){let n=!1;try{n=localStorage.getItem(hr)==="dismissed"}catch{}e.hidden=n;const o=()=>{e.hidden=!0;try{localStorage.setItem(hr,"dismissed")}catch{}};e.querySelector("[data-act=open]").addEventListener("click",o),e.querySelector("[data-act=dismiss]").addEventListener("click",()=>{o(),t&&!t.hidden&&t.focus()})}const ct=e=>document.getElementById(e),pr=15e3,Pu={zigbee:"Zigbee sensor",home_assistant:"Home Assistant",both:"Both, sensor first",eco:"Eco",comfort:"Comfort",normal:"Normal",internal_sensor_only:"Valve's own sensor",passive:"Bypass",unheated:"No radiator",episodic:"Open fire",continuous:"Range cooker",in_use:"In use",occasional:"Occasional",unused:"Unused"},Du={app:"Set here",house_file:"House file",default:"Default"},pn=e=>Pu[e]??String(e),Ia=(e,t,n)=>`${e} ${e===1?t:n}`,mi=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,cn=e=>`st-${e.replace(/[^a-z0-9_]/gi,"-")}`;function Ha(e,t){const n=Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));return t?t==="°C"?`${n}°`:t==="%"?`${n}%`:`${n} ${t}`:n}function Vt(e,t){if(t==null||t==="")return"–";switch(e.kind){case"number":case"integer":return Ha(Number(t),e.unit);case"bool":return t?"On":"Off";case"list":return Array.isArray(t)&&t.length?t.join(", "):"–";case"use":return typeof t=="string"?pn(t):`Weekdays ${pn(t.weekdays).toLowerCase()}, weekend ${pn(t.weekend).toLowerCase()}`;case"choice":return pn(t);default:return String(t)}}function qu(e){const t=[e.help];return(e.kind==="number"||e.kind==="integer")&&e.min!=null&&e.max!=null&&t.push(`${Ha(e.min,null)} to ${Ha(e.max,e.unit)}.`),!e.secret&&e.default!=null&&e.default!==""&&t.push(`Default ${Vt(e,e.default)}.`),e.restart&&t.push("Used after a restart."),t.join(" ")}function Iu(e){return e.secret?e.is_set?e.source==="house_file"&&e.env.length?`Set from ${e.env.join(", ")}`:e.source==="app"?"Set here":"Set in the house file":"Not set":e.source==="house_file"&&e.env.length?`House file, from ${e.env.join(", ")}`:Du[e.source]??e.source}function Hu(e){return e.secret?e.house_file_set?"Use the house file's":"Clear it":e.house_file_set?`Use the house file's, ${Vt(e,e.house_file_value)}`:e.default!=null?`Use the default, ${Vt(e,e.default)}`:"Use the default"}function Bu(e,t){const n=e.pending_restart.length;if(!n)return"";const o=e.pending_restart.map(t);return`Restart Radiate to use ${Ia(n,"changed setting","changed settings")}: ${mi(o)}.`}function Fu(e,t){return e.length&&t.length?"Saved. Some changes are in use now; restart Radiate for the rest.":t.length?"Saved. Restart Radiate to use it.":e.length?"Saved. In use now.":"Saved."}function fr(e,t){switch(e.kind){case"number":case"integer":{const n=String(t).trim();if(!n)return null;const o=Number(n.replace(",","."));return Number.isFinite(o)?o:n}case"list":{const n=String(t).split(/[,\s]+/).map(o=>o.trim()).filter(Boolean);return n.length?n:null}case"secret":return t===""?void 0:t;case"text":case"choice":return String(t).trim()===""?null:String(t).trim();default:return t}}const ju=(e,t)=>JSON.stringify(e??null)===JSON.stringify(t??null);function gi(e){if(!e.secret)return e.source==="default"?null:e.value}const Wu={set:"cool",restart:"warning"};function Uu(e,t=""){const n=` ${t} `;if(e==="button"&&/\s(btn|link)\s/.test(n)){const o=document.createElement("wa-button");return n.includes(" btn-primary ")?o.setAttribute("variant","brand"):n.includes(" link ")?(o.setAttribute("appearance","plain"),o.setAttribute("size","s")):o.setAttribute("appearance","outlined"),o}return n.includes(" card ")&&e!=="details"?document.createElement("wa-card"):n.includes(" badge ")?document.createElement("wa-badge"):document.createElement(e)}function le(e,t={},...n){const o=Uu(e,t.class);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="class"?o.className=s:a==="text"?o.textContent=s:a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n)a&&o.append(a);if(o.localName==="wa-badge"){const a=Wu[t["data-kind"]]??"neutral";a==="cool"?o.classList.add("radiate-cool"):o.setAttribute("variant",a),o.setAttribute("appearance","filled-outlined")}return o}function Vu(e,t,n,o){const a=document.createElement("wa-radio-group");a.setAttribute("label",e),a.setAttribute("orientation","horizontal"),a.setAttribute("size","s"),a.classList.add("label-hidden");let s=n;t.forEach(([,i],l)=>{const c=document.createElement("wa-radio");c.setAttribute("appearance","button"),c.value=String(l),c.textContent=i,a.append(c)});const r=t.findIndex(([i])=>JSON.stringify(i)===JSON.stringify(s));return a.value=r<0?"":String(r),a.addEventListener("change",()=>{const i=Number(a.value);!Number.isInteger(i)||!t[i]||(s=t[i][0],o())}),{node:a,get:()=>s,focus:()=>a.focus()}}function mr(e,t,n,o,a){const s=le("select",{id:e,"aria-describedby":a});for(const[r,i]of t)s.append(le("option",{value:r,text:i}));return n!=null&&!t.some(([r])=>r===n)&&s.append(le("option",{value:n,text:pn(n)})),s.value=n??"",s.addEventListener("change",o),s}function Ku(e,t,n,o){const a=gi(e);if(e.kind==="bool"){const i=[[!0,"On"],[!1,"Off"]];e.optional&&i.unshift([null,"Not set"]);const l=Vu(e.label,i,e.optional?a:a??e.default,o);return l.node.setAttribute("aria-describedby",n),l.node.id=t,{node:l.node,get:()=>l.get(),focus:l.focus}}if(e.kind==="choice"){const i=e.choices.map(c=>[c,pn(c)]);(e.optional||a==null)&&i.unshift(["",e.optional?"Not set":`Default, ${Vt(e,e.default)}`]);const l=mr(t,i,a,o,n);return{node:l,get:()=>fr(e,l.value),focus:()=>l.focus()}}if(e.kind==="use"){const i=[["","Not set"],...e.choices.map(g=>[g,pn(g)])],l=typeof a=="string"?[a,a]:a?[a.weekdays,a.weekend]:["",""],c=le("div",{class:"st-use",role:"group",id:t,"aria-describedby":n}),d=["Weekdays","Weekend"].map((g,p)=>{const f=`${t}-${p}`,y=mr(f,i,l[p]||"",o);return c.append(le("span",{class:"st-use-part"},le("label",{for:f,text:g}),y)),y});return{node:c,get:()=>{const[g,p]=d.map(f=>f.value);return!g&&!p?null:g===p?g:{weekdays:g||null,weekend:p||null}},focus:()=>d[0].focus()}}const s=le("input",{id:t,"aria-describedby":n,autocomplete:"off",spellcheck:"false"});return e.kind==="number"||e.kind==="integer"?(s.type="text",s.inputMode=e.kind==="integer"||(e.min??0)>=0?e.kind==="integer"?"numeric":"decimal":"text",s.className="num",s.value=a==null?"":String(a),a==null&&e.default!=null&&(s.placeholder=String(e.default))):e.kind==="secret"?(s.type="password",s.autocomplete="new-password",s.placeholder=e.is_set?"Set. Type to replace it":"Not set"):e.kind==="list"?(s.type="text",s.value=Array.isArray(a)?a.join(", "):"",!s.value&&Array.isArray(e.default)&&(s.placeholder=e.default.join(", "))):(s.type="text",s.value=a==null?"":String(a),!s.value&&e.default!=null&&(s.placeholder=String(e.default))),s.addEventListener("input",o),{node:e.unit&&(e.kind==="number"||e.kind==="integer")?le("span",{class:"unit"},s,le("span",{text:e.unit})):s,get:()=>fr(e,s.value),focus:()=>s.focus(),input:s}}function Ju({transport:e,isAuthError:t,onAuth:n,onOpenSetup:o,onShowSchedules:a,moreSections:s=()=>[]}){let r=null,i=!1,l=!1;const c=new Map,d=new Set;let u=null,g=!1;const p=new Map,f=async(m,D,F)=>{try{return await e.call(m,D,F)}catch(N){throw t(N)&&n(),N}};async function y(){if(!l){l=!0;try{const m=await f("GET","settings/config");m.status===200&&(r=m.body,b())}catch{ct("settings-summary").textContent="Couldn't load the settings. Try again in a moment."}finally{l=!1}}}function h(m){return p.get(m)??m}function b(){p.clear();for(const U of r.sections){for(const ee of U.fields??[])p.set(ee.path,ee.label);for(const ee of U.rooms??[])for(const se of ee.fields)p.set(se.path,`${ee.name} ${se.label.toLowerCase()}`)}const m=r.saved.length;ct("settings-summary").textContent=m?`${Ia(m,"setting is","settings are")} set here, over the house file.`:"Every setting comes from the house file or its default.",ct("settings-where").textContent=r.saved_at?`Changes are saved to ${r.saved_at}. The house file isn't changed.`:"In the demo, changes are not saved to a file and end when the demo does.";const D=ct("settings-restart");D.hidden=!r.pending_restart.length,ct("settings-restart-text").textContent=Bu(r,h);const F=ct("settings-problems");if(F.hidden=!r.problems.length,ct("settings-problems-text").textContent=r.problems.length?`The settings saved here weren't used at the last start, so the house file's apply. ${r.problems.map(U=>`${U.path?`${h(U.path)}: `:""}${U.message}`).join(" ")} Change or reset them below.`:"",w(m),ct("settings-toc").replaceChildren(...[...r.sections,...s()].map(U=>le("li",{},le("a",{href:`#settings/${U.id}`,text:U.title})))),ct("settings-sections").replaceChildren(...r.sections.map($)),u){const U=document.getElementById(u);u=null,U?.focus()}}function w(m){const D=ct("settings-all");if(D.hidden=!m,D.replaceChildren(),!m)return;if(!g){const W=le("button",{type:"button",class:"btn",id:"settings-all-btn",text:"Use the house file for every setting"});W.addEventListener("click",()=>{g=!0,u="settings-all-go",b()}),D.append(W);return}const F=le("button",{type:"button",class:"btn btn-primary",id:"settings-all-go",text:"Use the house file"}),N=le("button",{type:"button",class:"link",text:"Keep them"});F.addEventListener("click",()=>V(null,"all",F)),N.addEventListener("click",()=>{g=!1,u="settings-all-btn",b()}),D.append(le("p",{text:`The ${Ia(m,"setting","settings")} set here go back to the house file's values.`}),le("div",{class:"st-actions"},F,N))}function $(m){const D=le("section",{class:"st-sec",id:`s-${m.id}`,"aria-labelledby":`s-${m.id}-h`}),F=le("h3",{class:"section-h",id:`s-${m.id}-h`,tabindex:"-1",text:m.title});D.append(F);const N=le("p",{class:"help-line st-help",text:`${m.help} `});if(m.guide&&N.append(le("a",{class:"help-link",href:`#guide/${m.guide}`,text:`About ${m.title.toLowerCase()}`})),D.append(N),m.link)D.append(R(m));else if(m.per_room)for(const W of m.rooms)D.append(E(`rooms.${W.id}`,W.name,W.fields,!0));else D.append(E(m.id,m.title,m.fields,!1));return D}function R(m){const D=le("div",{class:"card st-plate st-linked"});if(m.link==="household"){const F=le("button",{type:"button",class:"btn btn-primary",text:"Open the household setup"});F.addEventListener("click",N=>o(N)),D.append(F)}else if(m.link==="schedules"){const F=le("button",{type:"button",class:"btn",text:"Show the schedules"});F.addEventListener("click",()=>a()),D.append(F)}return D}function E(m,D,F,N){const W=cn(m),U=F.filter(K=>K.source==="app").length,ee=N?le("details",{class:"card st-plate st-room",id:W}):le("div",{class:"card st-plate",id:W});if(N){const K=le("summary",{},le("span",{class:"st-room-name",text:D}));U&&K.append(le("span",{class:"badge","data-kind":"set",text:`${U} set here`})),F.some(ae=>ae.pending_restart)&&K.append(le("span",{class:"badge","data-kind":"restart",text:"Restart to use"})),ee.append(K),ee.open=d.has(m)||c.has(m),ee.addEventListener("toggle",()=>{ee.open?d.add(m):d.delete(m)})}const se=le("form",{class:"st-form",novalidate:!0,"aria-label":N?D:`${D} settings`}),de=new Map,fe=le("div",{class:"st-foot"}),O=le("button",{type:"submit",class:"btn btn-primary",id:`${W}-save`,text:"Save changes",hidden:!0}),k=le("button",{type:"button",class:"link",text:"Cancel changes",hidden:!0}),S=le("p",{class:"st-status",id:`${W}-status`,role:"status",tabindex:"-1"}),L=le("div",{class:"st-confirm",hidden:!0}),j=()=>F.filter(K=>{const ae=de.get(K.path);if(!ae)return!1;const ke=ae.get();return K.secret?ke!==void 0:!ju(ke,gi(K))}),X=()=>{const K=j().length;O.hidden=!K,O.disabled=!1,k.hidden=!K,O.textContent=K>1?`Save ${K} changes`:"Save changes",L.hidden=!0};for(const K of F)se.append(P(K,de,X));k.addEventListener("click",()=>{c.delete(m),u=`${W}-status`,b()}),se.addEventListener("submit",async K=>{K.preventDefault();const ae=j();if(!ae.length)return;const ke=Object.fromEntries(ae.map(Ae=>[Ae.path,de.get(Ae.path).get()])),Le=ae.filter(Ae=>Ae.hardware&&!Ae.secret),Je=Le.map(Ae=>`${h(Ae.path)}, ${Vt(Ae,ke[Ae.path])}`);Le.length?Q(L,Je,()=>T(m,ke,!0,O,se),O,!0):T(m,ke,!1,O,se)});const M=le("button",{type:"button",class:"link",text:N?`Use the house file for ${D}`:"Use the house file for this section",hidden:!U});M.addEventListener("click",()=>V(m,m,M,L));const I=c.get(m);return I&&I.until>Date.now()&&(S.textContent=I.text,S.dataset.kind=I.kind??""),fe.append(le("div",{class:"st-actions"},O,k,M),L,S),se.append(fe),ee.append(se),ee}function P(m,D,F){const N=cn(m.path),W=le("div",{class:"st-field","data-source":m.source}),U=le("div",{class:"st-head"}),ee=m.kind==="bool"||m.kind==="use"?le("span",{class:"st-label",id:`${N}-label`,text:m.label}):le("label",{class:"st-label",for:N,text:m.label});U.append(ee,le("span",{class:"st-src","data-source":m.source,text:Iu(m)})),m.pending_restart&&U.append(le("span",{class:"tag",text:"Restart to use"})),W.append(U);const se=`${N}-help`,de=`${N}-err`;W.append(le("p",{class:"field-help",id:se,text:qu(m)}));const fe=le("div",{class:"st-control"});if(m.locked)fe.append(le("p",{class:"st-fixed",text:`${Vt(m,m.value)}. ${m.locked}`}));else if(!m.editable)fe.append(le("p",{class:"st-fixed"},le("code",{text:Vt(m,m.value)}),document.createTextNode(" Only the house file sets this.")));else{const O=Ku(m,N,`${se} ${de}`,F);(m.kind==="bool"||m.kind==="use")&&O.node.setAttribute("aria-labelledby",`${N}-label`),D.set(m.path,O),fe.append(O.node)}if(W.append(fe),m.source==="app"&&!m.locked){const O=m.secret?null:m.house_file_set?`House file: ${Vt(m,m.house_file_value)}.`:null,k=le("button",{type:"button",class:"link",id:`${N}-revert`,text:Hu(m)});k.addEventListener("click",()=>V(m.path,Z(m.path),k)),W.append(le("p",{class:"st-file"},O?document.createTextNode(`${O} `):null,k))}return W.append(le("p",{class:"field-error",id:de,hidden:!0})),W}const Z=m=>{const D=m.split(".");if(D[0]==="rooms"&&D.length===3)return`rooms.${D[1]}`;const F=r.sections.find(N=>(N.fields??[]).some(W=>W.path===m));return F?F.id:m};function Q(m,D,F,N,W=!1){const U=W?D:D.map(h);m.replaceChildren(),m.hidden=!1;const ee=le("button",{type:"button",class:"btn btn-primary",text:"Save and allow it"}),se=le("button",{type:"button",class:"link",text:"Cancel"});ee.addEventListener("click",()=>{m.hidden=!0,F()}),se.addEventListener("click",()=>{m.hidden=!0,N?.focus()}),m.append(le("p",{class:"st-confirm-text",text:`This lets Radiate write to the boiler or the valves: ${mi(U)}. Check the wiring and the valves before you go on.`}),le("div",{class:"st-actions"},ee,se)),ee.focus()}function ne(m,D,F,N){for(const fe of m.querySelectorAll(".field-error"))fe.hidden=!0,fe.textContent="";for(const fe of m.querySelectorAll("[aria-invalid]"))fe.removeAttribute("aria-invalid");const W=[],U=[];for(const fe of F??[]){const O=m.querySelector(`#${CSS.escape(cn(fe.path))}-err`);O?(O.textContent=fe.message,O.hidden=!1,m.querySelector(`#${CSS.escape(cn(fe.path))}`)?.setAttribute("aria-invalid","true"),W.push(fe)):U.push(fe)}const ee=m.querySelector(".st-status"),se=U.map(fe=>`${fe.path?`${h(fe.path)}: `:""}${fe.message}`).join(" ");ee.textContent=`${N??"Not saved."}${se?` ${se}`:""}`,ee.dataset.kind="error";const de=W[0]?m.querySelector(`#${CSS.escape(cn(W[0].path))}`):null;de&&de.tagName!=="DIV"?de.focus():ee.focus()}async function T(m,D,F,N,W){N.disabled=!0;try{const U=await f("PUT","settings/config",F?{values:D,confirm:!0}:{values:D});if(U.status===409){const ee=W.querySelector(".st-confirm");Q(ee,U.body.confirm??[],()=>T(m,D,!0,N,W),N),N.disabled=!1;return}if(U.status!==200){const ee=typeof U.body=="object"&&U.body?U.body:{message:String(U.body)};ne(W,m,ee.errors,ee.message),N.disabled=!1;return}q(m,U.body,Fu(U.body.applied??[],U.body.restart??[]))}catch{const U=W.querySelector(".st-status");U.textContent="Not saved. Check the connection and try again.",U.dataset.kind="error",N.disabled=!1}}async function V(m,D,F,N){const W=m==null?"settings/config":`settings/config/${encodeURIComponent(m)}`,U=async ee=>{F.disabled=!0;try{const se=await f("DELETE",W,ee?{confirm:!0}:void 0);if(se.status===409){const de=N??F.closest("form")?.querySelector(".st-confirm")??ct("settings-all");F.disabled=!1,Q(de,se.body.confirm??[],()=>U(!0),F);return}if(se.status!==200){const de=typeof se.body=="object"&&se.body?se.body:{message:String(se.body)},fe=F.closest("form");if(F.disabled=!1,fe)ne(fe,D,de.errors,de.message??"Not changed.");else{const O=(de.errors??[]).map(k=>`${h(k.path)}: ${k.message}`).join(" ");ct("settings-all").append(le("p",{class:"st-status","data-kind":"error",role:"alert",text:`${de.message??"Not changed."} ${O}`}))}return}g=!1,q(D,se.body,"Back to the house file.")}catch{F.disabled=!1}};U(!1)}function q(m,D,F){r=D,c.set(m,{text:F,until:Date.now()+pr}),setTimeout(()=>{const N=c.get(m);if(N&&N.until<=Date.now()){c.delete(m);const W=document.getElementById(`${cn(m)}-status`);W&&(W.textContent="")}},pr+50),u=m==="all"?"settings-h":`${cn(m)}-status`,b()}return{async available(){try{const m=await f("GET","settings/config");return m.status!==200?!1:(r=m.body,!0)}catch{return!1}},show(){i=!0,r&&b(),y()},hide(){i=!1},reveal(m){const D=m?document.getElementById(`s-${m}-h`):null;return D?(D.focus({preventScroll:!0}),D.scrollIntoView({block:"start"}),!0):!1},get open(){return i}}}const wi=5e3;function Go({holdMs:e=wi,now:t=()=>Date.now()}={}){let n,o=!1,a=0,s=0,r=0,i="";const l=()=>{o=!1,n=void 0};return{press(c){return n=c,o=!0,i="",s+=1,a=s,s},done(c){c===s&&(a=0,r=t())},failed(c,d){c===s&&(a=0,l(),i=d)},shown(c){return o&&!a&&(c===n||t()-r>e)&&l(),o?n:c},get busy(){return a!==0},get error(){return i},clearError(){i=""}}}async function Yu(e,t,{send:n,paint:o,refresh:a,later:s=setTimeout}){const r=e.press(t);o();try{await n()}catch(i){return e.failed(r,oo(i)),o(),!1}return e.done(r),o(),s(o,wi+50),await a(),!0}function oo(e){const t=String(e?.message??"");return/HTTP 403/.test(t)&&/csrf/.test(t)?"Not saved: your sign-in has expired. Reload the page.":/HTTP 403/.test(t)?"Not saved: ask an admin.":"Not saved. Try again."}const bi=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Gu=10,yi=.4,Xu=.75,Qu=180,Zu=["dry_burner","dry_relay"],uo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,Lt=e=>`${e.toFixed(1)}°`,gr=e=>e.toLocaleString("en-GB");function wr(e){if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`}function Ft(e){return e>=.095?e.toFixed(1):e.toFixed(2)}function eh(e,t=new Date().getFullYear()){const[n,o,a]=e.split("-").map(Number);return`${a} ${bi[o-1]}${n===t?"":` ${n}`}`}const th=e=>e===1?"once":e===2?"twice":`${e} times`;function br(e){return e<yi?"still learning":e<Xu?"fairly sure of":"sure of"}function nh(e){const t=br(e.confidence),n=br(e.loss_confidence??e.confidence);return t===n?`Radiate is ${t} how fast this room warms and cools.`:`Radiate is ${t} how fast this room warms, and ${n} how fast it cools.`}const vi=e=>e.samples===0||e.confidence<yi;function oh(e,t={}){const n=e.model,o=[],a=(h,b,w)=>o.push({key:h,label:b,text:w}),s=e.temperature,r=t.outdoor,i=n.heating_kph;if(i){let h=`With the boiler on and the valve open, about ${Ft(i.with_house)}° an hour while most of the house is heating, or ${Ft(i.alone)}° an hour when it's the only room taking heat.`;if(s!=null&&r!=null){const b=i.with_house-n.b*(s-r)+n.d;h+=b>.05?` Now, with ${Lt(r)} outside, it would gain about ${Ft(b)}° an hour after the heat it loses.`:` Now, with ${Lt(r)} outside, it loses heat about as fast as the radiator adds it while the house heats.`}a("warms","Warms up",h)}else a("warms","Warms up",`The radiator can warm it by up to about ${Ft(n.a)}° an hour with the boiler on and the valve fully open.`);let l=`With the heating off, it cools by about ${Ft(n.b*Gu)}° an hour when it's 10° colder outside than in.`;s!=null&&r!=null&&s-r>=1&&(l+=` Now, at ${Lt(s)} inside and ${Lt(r)} outside, that's about ${Ft(n.b*(s-r))}° an hour.`),a("cools","Cools down",l),e.heat_source==="continuous"?a("steady","Other heat",`The range cooker adds about ${Ft(Math.max(0,n.d))}° an hour on its own, all day, so the radiator is needed less.`):n.d>=.15&&a("steady","Other heat",`Something other than the radiator adds about ${Ft(n.d)}° an hour, such as a warm room next door.`);const c=Math.round(n.arrival_lag_min);a("lag","Heat arrives",n.lag_measured?`About ${c} min after the boiler fires, timed over ${n.lag_measured===1?"its last warm-up":`its last ${n.lag_measured} warm-ups`}.`:`Not timed yet, so Radiate allows ${c} min for the hot water to reach the radiator.`);let d;if(n.samples===0)d="Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";else{d=nh(n);const h=n.learned?.since?` since ${eh(n.learned.since,t.year)}`:"",b=n.samples>=120?`, about ${gr(Math.round(n.samples/60))} hours of learning`:"";d+=` From ${gr(n.samples)} ${n.samples===1?"reading":"readings"}${h}${b}.`}e.role==="internal_sensor_only"&&(d+=" This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.");const u=n.learned?.updates??{},g=Object.values(u).reduce((h,b)=>h+b,0),p=Zu.reduce((h,b)=>h+(u[b]??0),0);g&&p===g&&(d+=" All of it was learned in dry run, while Radiate watched the heating without running it."),a("sure","How sure",d);let f="Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";const y=n.warm_up;if(y&&t.minute_of_day!=null){const h=y.min==null||y.min<60?y.min:Math.round(y.min/5)*5,b=uo((t.minute_of_day+y.in_min)%1440),w=y.quiet_until_min??null,$=w==null?null:(w-t.minute_of_day+1440)%1440,R=w==null?"as early as it can":`as soon as quiet hours end at ${uo(w)}`;if(y.min==null)f+=` It can't tell yet how long this room takes to reach ${Lt(y.to_c)} by ${b}, so it starts ${R}.`;else if(y.min>Qu)f+=` To get from ${Lt(y.from_c)} to ${Lt(y.to_c)} by ${b}, it reckons this room needs about ${wr(h)}, longer than it looks ahead, so it starts ${R}.`;else{const E=y.in_min-h,P=E<=0?"now":`at about ${uo((t.minute_of_day+E)%1440)}`;if(f+=` To get from ${Lt(y.from_c)} to ${Lt(y.to_c)} by ${b}, it allows about ${wr(h)}, so it `,w!=null&&E<$){const Z=$+h>y.in_min?`, and may get there after ${b}`:"";f+=`would start ${P}. Quiet hours hold it until ${uo(w)}, so it starts then${Z}.`}else f+=`starts warming ${P}.`}}n.lockshield!=null&&(f+=n.lockshield_learned===!1?` Between burns, the valve's opening limit rests at ${n.lockshield}% until Radiate has seen enough burns to set it.`:` Between burns, the valve's opening limit rests at ${n.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`),a("uses","Used for",f),n.relearns>0&&a("relearned","Relearned",`Radiate relearned this room ${th(n.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);for(const h of t.notes??[]){const b=new Date(h.at*1e3),w=`${b.getDate()} ${bi[b.getMonth()]}`,$=h.code==="learning.reset"||h.code==="learning.invalidated"?"Started again":"Carried over";a(`note-${h.at}`,$,`${w}. ${h.message}`)}return o}function ah(e){return`In the model's own terms: heating gain ${e.a.toFixed(2)} K/h, loss rate ${e.b.toFixed(3)} per hour per degree, other heat ${e.d.toFixed(2)} K/h, arrival lag ${Math.round(e.arrival_lag_min)} min, confidence ${Math.round(e.confidence*100)}%.`}const dt=e=>document.getElementById(e),ki="–",va=50,sh={"radiate.security.login":"Signed in","radiate.security.login.failed":"Sign-in refused","radiate.security.logout":"Signed out","radiate.security.session.ended":"Session ended","radiate.security.request.refused":"Request refused","radiate.security.access.denied":"Not allowed","radiate.security.lockout.started":"Sign-in locked","radiate.security.lockout.ended":"Sign-in unlocked","radiate.security.user.changed":"User changed","radiate.security.config.changed":"Changed","radiate.security.control.used":"Control used","radiate.security.login.config":"Started"},rh={password:"password",oidc:"single sign-on",saml:"SAML",token:"API token",ingress:"Home Assistant",cli:"command line",session:"signed in",open:"open server"},ih=e=>sh[e.event]??e.event;function lh(e){const t=e.attributes??{};return e.user?e.user:rh[t["radiate.auth.method"]]??ki}function ch(e,t){const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e*1e3))}function dh(e,t){const n=e.events.length,o=t.outcome==="failure"?"refusals":t.outcome==="success"?"allowed events":"events",a=t.user?` for ${t.user}`:"",s=`Kept for ${e.retention_days} days.`;return n?`The latest ${n===1?"event":`${n} ${o}`}${a}, newest first. ${s}`:`No ${o}${a} yet. ${s}`}function uh({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=!1,s=[],r=null,i=!1;const l={outcome:"",user:""},c=f=>{const y=new URLSearchParams({limit:String(va)});return l.outcome&&y.set("outcome",l.outcome),l.user&&y.set("user",l.user),f&&y.set("before",String(f)),`audit?${y}`};function d(f){const y=document.createElement("tr");f.outcome==="failure"&&(y.dataset.kind="warn");const h=($,R,E)=>{const P=document.createElement($);return P.textContent=R,E&&(P.className=E),P},b=h("th",ch(f.at));b.scope="row";const w=h("td",ih(f));if(f.outcome==="failure"){const $=document.createElement("wa-badge");$.textContent="Refused",$.setAttribute("variant","warning"),$.setAttribute("appearance","filled-outlined"),w.append(" ",$)}return y.append(b,w,h("td",lh(f)),h("td",f.source??ki),h("td",f.message,"sl-detail")),y}function u(f){const y=dt("security-user"),h=["",...f],b=[...y.options].map(w=>w.value);h.join(`
`)!==b.join(`
`)&&(y.replaceChildren(...h.map(w=>{const $=document.createElement("option");return $.value=w,$.textContent=w||"Everyone",$})),y.value=h.includes(l.user)?l.user:"")}function g(){r&&(u(r.users??[]),dt("security-summary").textContent=dh({...r,events:s},l),dt("security-body").replaceChildren(...s.map(d)),dt("security-table").hidden=!s.length,dt("security-more").hidden=!i)}async function p(f=!1){const y=f&&s.length?s.at(-1).id:null;try{const h=await e.get(c(y));r=h,s=f?[...s,...h.events]:h.events,i=h.events.length===va,dt("security-error").hidden=!0,g()}catch(h){if(t(h)){n();return}dt("security-error").hidden=!1}}return dt("security-outcome").addEventListener("change",f=>{const y=f.target.value==="all"?"":f.target.value;y!==l.outcome&&(l.outcome=y,p())}),dt("security-user").addEventListener("change",f=>{l.user=f.target.value,p()}),dt("security-more").addEventListener("click",()=>p(!0)),dt("security-refresh").addEventListener("click",()=>p()),{async available(){try{r=await e.get(c()),s=r.events,i=s.length===va,a=!0}catch{a=!1}return dt("s-security-log").hidden=!a,a&&g(),a},get offered(){return a},show(){o=!0,a&&p()},hide(){o=!1},get open(){return o}}}const He=e=>document.getElementById(e),hh="heating-dashboard.yaml",ph=(e,t)=>{const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e))};function fh(e,t){if(!e?.reported_at)return["The Radiate integration hasn't reported to this server yet. Add it from HACS to get room thermostats, the heating mode and hot water in Home Assistant, then generate the dashboard.","warning"];const n=ph(e.reported_at);return e.reporting?[`The Radiate integration is connected. It last reported at ${n}.`,"success"]:[`The Radiate integration last reported at ${n}, so it may have stopped. Check that Home Assistant is running and the integration is loaded.`,"warning"]}function mh(e){const t=e.yaml.trimEnd().split(`
`).length,n=`${e.rooms} ${e.rooms===1?"room":"rooms"}`,o=e.people?`, ${e.people} ${e.people===1?"person":"people"}`:"",a=e.radiate?"with the Radiate integration":"with Zigbee2MQTT's entities only";return`Three views (Overview, Rooms and Analysis) for ${n}${o}, ${a}. ${t} lines.`}function gh({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=null,s=null;const r=()=>`ha/dashboard?${new URLSearchParams({hours:He("ha-hours").value,radiate:He("ha-radiate").checked?"true":"false"})}`;function i(){if(!a)return;const[u,g]=fh(a.integration),p=He("ha-integration");p.hidden=!a.radiate,p.setAttribute("variant",g),He("ha-integration-text").textContent=u,He("ha-summary").textContent=mh(a),He("ha-preview").textContent=a.yaml,He("ha-error").hidden=!0}async function l(){const u=e.get(r());s=u;try{const g=await u;return s!==u||(a=g,i()),!0}catch(g){return t(g)?(n(),!1):(s===u&&(He("ha-error").hidden=!o),!1)}}async function c(){if(!a)return;const u=He("ha-copy");try{await navigator.clipboard.writeText(a.yaml),He("ha-summary").textContent="Copied. Paste it into the raw configuration editor in Home Assistant."}catch{He("ha-preview-box").open=!0;const g=document.createRange();g.selectNodeContents(He("ha-preview"));const p=getSelection();p.removeAllRanges(),p.addRange(g),He("ha-preview").focus(),He("ha-summary").textContent="Couldn't copy here. The dashboard is selected: copy it with your keyboard."}u.focus()}function d(){if(!a)return;const u=URL.createObjectURL(new Blob([a.yaml],{type:"text/yaml"})),g=document.createElement("a");g.href=u,g.download=hh,document.body.append(g),g.click(),g.remove(),setTimeout(()=>URL.revokeObjectURL(u),0)}return He("ha-hours").addEventListener("change",l),He("ha-radiate").addEventListener("change",l),He("ha-copy").addEventListener("click",c),He("ha-download").addEventListener("click",d),{async available(){return o=await l(),He("s-home-assistant").hidden=!o,o},get offered(){return o},show(){o&&l()},hide(){}}}const mo=e=>new URL(`api/v1/${e}`,document.baseURI).toString(),C=e=>document.getElementById(e),Ot=e=>e==null?"–":`${e.toFixed(1)}°`,Ao=e=>`${Math.max(0,Math.round(e/60))} min`,Xo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,St=(e,t,n)=>`${e} ${e===1?t:n}`,dn=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,To=e=>{if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`},Qo=matchMedia("(prefers-reduced-motion: reduce)"),Kt=new Map;let we=null,Ba=null,mt=null;class Fe extends Error{}const Fa="radiate.token";function wh(){try{return localStorage.getItem(Fa)||""}catch{return""}}function bh(e){try{e?localStorage.setItem(Fa,e):localStorage.removeItem(Fa)}catch{}}function yh(){let e=wh(),t="",n=null,o=null,a=2e3,s=null,r=null;const i=(d={},u="GET")=>{const g=e?{...d,Authorization:`Bearer ${e}`}:{...d};return t&&u!=="GET"&&u!=="HEAD"&&(g["X-CSRF-Token"]=t),g},l=async(d,u={})=>{const g=await fetch(mo(d),{...u,headers:i(u.headers,u.method)});if(g.status===401)throw new Fe(d);if(!g.ok)throw new Error(`${d}: HTTP ${g.status} ${await g.text()}`);return g},c=()=>{o=null;const d=new URL(mo("stream"));d.protocol=d.protocol==="https:"?"wss:":"ws:";try{n=new WebSocket(d)}catch{n=null,r("lost"),o=setTimeout(c,a);return}const u=n;u.onopen=()=>{e&&u.send(JSON.stringify({token:e}))},u.onmessage=g=>{a=2e3,r("live"),s(JSON.parse(g.data))},u.onclose=g=>{if(n===u&&(n=null),g.code===4401){r("auth");return}r("lost"),o=setTimeout(c,a),a=Math.min(a*2,15e3)},u.onerror=()=>u.close()};return{hasToken:()=>!!e,setCsrf(d){t=d||""},setToken(d){e=d,bh(d)},house:async()=>(await l("house")).json(),state:async()=>(await l("state")).json(),get:async d=>(await l(d)).json(),text:async d=>(await l(d)).text(),async post(d,u){await l(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)})},async call(d,u,g){const p={method:d,headers:i(g===void 0?{}:{"Content-Type":"application/json"},d)};g!==void 0&&(p.body=JSON.stringify(g));const f=await fetch(mo(u),p);if(f.status===401)throw new Fe(u);const y=await f.text();let h=y;try{h=JSON.parse(y)}catch{}return{status:f.status,body:h}},subscribe(d,u){s=d,r=u,!n&&!o&&c()}}}const xe=document.documentElement.dataset.transport==="demo"?(await el(async()=>{const{createDemoTransport:e}=await import("./demo.js");return{createDemoTransport:e}},[],import.meta.url)).createDemoTransport():yh();async function In(e,t){try{await xe.post(e,t)}catch(n){throw n instanceof Fe?at():console.error(n),n}}const Zo=(e,t,n,o,a)=>Yu(e,t,{send:()=>In(n,o),paint:a,refresh:Kn});function $i(e,t){e.hidden=!t,e.textContent=t}const ja={viewer:0,household:1,admin:2};let Ro="admin";const Wa=e=>(ja[Ro]??-1)>=ja[e],Vn=e=>Wa(e)?"":Ro==="household"?"Ask an admin":"Read only";function to(e,t,n){const o=Vn(n);for(const a of e)a&&(a.disabled=!!o,o?a.dataset.locked="":delete a.dataset.locked);return t&&(t.hidden=!o,t.textContent=o),!!o}function vh(){to([C("mode"),C("demand")],C("controls-lock"),"household"),to([C("boost")],C("boost-lock"),"household")}const ea=e=>e.reason_code==="demand.pooled";function xi(e){return e.role==="passive"?["Bypass, not controlled",""]:e.role==="unheated"?["No radiator",""]:e.fire?e.fire_switch===!1?["Fire detected","fire"]:["Fire lit","fire"]:e.preheating?["Preheating","preheat"]:ea(e)?["Waiting for a burn","pooled"]:e.calling?["Heating","calling"]:e.topup&&e.extend===!0?["Topping up","extend"]:e.topup&&e.extend===!1?["Heat sink","sink"]:e.topup?["Topped up","sink"]:e.temperature!=null&&e.target!=null&&e.temperature>=e.target-.3?["Comfortable","ok"]:["Waiting",""]}const kh={calling:"brand",fire:"brand",extend:"brand",preheat:"warning",pooled:"warning",back:"warning",stale:"warning",ok:"success",sink:"cool",away:"cool"};function Lo(e,t){const n=kh[t]??"neutral";return n==="cool"?J`<wa-badge class="radiate-cool" appearance="filled-outlined">${e}</wa-badge>`:J`<wa-badge variant=${n} appearance=${n==="neutral"?"outlined":"filled-outlined"}>${e}</wa-badge>`}const $h={fire:"Paused while the fire warms the room",fire_holdoff:"Paused until the room cools after the fire",window:"Paused while a window is open",shower:"Paused after a shower",cooker_spike:"Paused while cooking warms the room",unexplained_heat:"Paused: extra heat from somewhere, the sun or guests perhaps",store_recovery:"Paused while the boiler heats the hot water",heat_unknown:"Paused until the boiler's state is known",setpoint_change:"Waiting for the room to settle at its new temperature",no_data:"Waiting for enough readings",trv_offline:"Waiting for the TRV to come back"};function Si(e){if(e.learning)return $h[e.learning]??`Paused: ${e.learning.replaceAll("_"," ")}`;const t=e.model;if(!t.samples)return"Just started, using typical values for now";const n=`${Math.round(t.confidence*100)}% sure`;return vi(t)?`Still learning this room, ${n}`:t.confidence<.75?`Fairly sure of this room, ${n}`:`Sure of this room, ${n}`}const ka=new Map;function _i(e){return ka.has(e)||ka.set(e,Go()),ka.get(e)}const Ci=e=>!!(e.fire_switch??e.fire);function xh(e){const t=_i(e.id),n=!t.shown(Ci(Kt.get(e.id)??e));Zo(t,n,`rooms/${e.id}/fire`,{lit:n},us).then(o=>o&&It(n?`${e.name}: fire lit. Its radiator is closed.`:`${e.name}: fire out.`))}const Ei=5,Ai=28,Sh=600,_h=5e3,$a=new Map;function Xt(e){return $a.has(e)||$a.set(e,{pending:null,timer:null,expiry:null,error:"",clearing:!1}),$a.get(e)}function ta(e){const t=Xt(e.id);return t.pending!=null?t.pending:e.override?.setpoint!=null&&!t.clearing?e.override.setpoint:e.setpoint??e.target??null}function Ch(e,t){const n=Kt.get(e);if(!n||!Number.isFinite(t))return;const o=Xt(e),a=ta(n)??20,s=Math.min(Ai,Math.max(Ei,Math.round(t*2)/2));if(s===a){us();return}o.pending=s,o.error="",o.clearing=!1,clearTimeout(o.timer),clearTimeout(o.expiry),o.timer=setTimeout(()=>Eh(e),Sh),wt()}async function Eh(e){const t=Xt(e);t.timer=null;const n=t.pending;try{await In(`rooms/${e}/setpoint`,{setpoint:n})}catch(a){t.pending===n&&(t.pending=null,t.error=oo(a)),wt();return}t.expiry=setTimeout(()=>{t.pending===n&&!t.timer&&(t.pending=null,wt())},_h);const o=Kt.get(e);o&&t.pending===n&&It(`${o.name} held at ${Ot(n)}.`),Kn()}async function Ah(e){const t=Xt(e);clearTimeout(t.timer),t.timer=null,t.pending=null,t.error="",t.clearing=!0,wt();try{await In(`rooms/${e}/setpoint`,{setpoint:null})}catch(o){t.clearing=!1,t.error=oo(o),wt();return}const n=Kt.get(e);n&&It(`${n.name} follows its schedule again.`),Kn()}async function Kn(){try{ps(await xe.state())}catch{}}function Th(e){return e.until==="cleared"?"Held until cleared":e.expires_in_min==null?"Held until the next change":e.until==="duration"?`Held for ${To(e.expires_in_min)}`:we?`Held until ${Xo((we.minute_of_day+e.expires_in_min)%1440)}`:"Held until the next change"}const Jn=new Set(["passive","unheated"]);function Ti(e){const t=mt?.rooms?.find(n=>n.id===e.id);return t?t.controllable:!Jn.has(e.role)}function Rh(e){const t=Xt(e.id);t.pending!=null&&!t.timer&&e.override?.setpoint===t.pending&&(t.pending=null,clearTimeout(t.expiry)),t.clearing&&!e.override&&(t.clearing=!1)}function Lh(e){let t=e.reason||"";if(ea(e)&&(t="Waiting to share a burn with other rooms."),!e.calling&&e.topup&&e.extend===!0&&(t="Topped up now so it does not need a second burn soon."),!e.calling&&e.topup&&e.extend===!1&&(t="Opened so the burner's heat has somewhere to go."),!t&&e.role==="passive"&&(t="Manual valve, always open: counted as the system's open path."),!t&&e.role==="unheated"&&(t="No radiator here. Temperature recorded, not controlled."),!t&&e.heat_source==="continuous"&&(t="Range cooker heat is learned as a steady background."),!t&&e.next_setpoint!=null&&e.next_in_min!=null&&we){const n=(we.minute_of_day+e.next_in_min)%1440;t=`Next ${e.next_setpoint.toFixed(1)}° at ${Xo(n)}.`}return t}function Mh(e){return e.model?Si(e):e.humidity!=null?`${e.humidity}% RH`:""}function Oh(e){return e.valve?.untrusted?e.valve.leaking?"Valve may not be closing: radiator warmed while shut.":e.valve.misses?`Valve may be stuck: radiator stayed cold for ${St(e.valve.misses,"burn","burns")}.`:"Valve may be stuck: radiator not warming.":""}let Xe=null;const Qt=matchMedia("(min-width: 75rem)"),na=matchMedia("(max-width: 40rem)"),_t=C("room-drawer");let Ua=null,xa=null;const Nh=C("toast"),zh={success:{icon:"circle-check"},neutral:{icon:"circle-info"},warning:{icon:"triangle-exclamation"}};function It(e,t="success"){try{Nh.create(e,{variant:t,duration:5e3,icon:zh[t]?.icon})}catch{}}function no(e,t=null){if(Xe=Xe===e?null:e,nn.select(Xe),wt(),!Xe){Qt.matches&&xa?.focus?.(),xa=null;return}if(Qt.matches){xa=t,requestAnimationFrame(()=>C("room-panel").querySelector("h2")?.focus({preventScroll:!0}));const o=C("room-panel"),a=o.getBoundingClientRect().top;(a<0||a>innerHeight-120)&&o.scrollIntoView({block:"nearest",behavior:Qo.matches?"auto":"smooth"});return}Ua=t,_t.placement=na.matches?"bottom":"end",_t.open=!0}function Ri(){Xe&&no(Xe)}_t.addEventListener("wa-after-hide",e=>{e.target===_t&&(Qt.matches||(Xe=null,nn.select(null),wt(),Ua?.focus?.(),Ua=null))});Qt.addEventListener("change",()=>{Qt.matches?_t.open=!1:Xe&&(_t.placement=na.matches?"bottom":"end",_t.open=!0),wt()});na.addEventListener("change",()=>wt());document.addEventListener("keydown",e=>{e.key==="Escape"&&Xe&&Qt.matches&&!e.defaultPrevented&&C("room-panel").contains(document.activeElement)&&Ri()});function ds(e){const t=new Map;for(const n of e.alert_details??[]){if(!n.room_id)continue;const o=e.rooms.find(s=>s.id===n.room_id);if(!o)continue;const a=n.message.startsWith(`${o.name}: `)?n.message.slice(o.name.length+2):n.message;t.has(o.id)||t.set(o.id,{room:o,texts:[]}),t.get(o.id).texts.push(a)}for(const n of e.rooms)n.temperature==null&&!t.has(n.id)&&t.set(n.id,{room:n,texts:["no reading"]});return[...t.values()]}function yr(e,t){const[n,o]=xi(e),a=Ti(e),s=a?ta(e):null,r=Jn.has(e.role),i=e.id===Xe,l=a&&(Xt(e.id).pending!=null||e.override?.setpoint!=null&&!Xt(e.id).clearing),c=t.get(e.id);return{r:e,label:n,kind:o,sp:s,observed:r,on:i,held:l,need:c}}function Ph(e){const t=new Map(ds(we).map(a=>[a.room.id,a.texts])),n=(a,s)=>no(s,a.currentTarget),o=a=>a.need?J`<wa-icon class="room-flag" name="triangle-exclamation" label="Needs attention: ${a.need.join(", ")}"></wa-icon>`:ve;return na.matches?J`<ul class="room-list" aria-labelledby="rooms-h">${e.map(a=>{const s=yr(a,t);return J`<li>
        <button type="button" class="room-item" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
          <span class="room-item-top">
            <span class="room-name"><span class="swatch" style="--swatch:${rr(a.temperature)}" aria-hidden="true"></span><strong>${a.name}</strong>${o(s)}</span>
            ${Lo(s.label,s.kind)}
          </span>
          <span class="room-item-facts">
            <span><span class="fact-label">Now</span> <strong class="readout">${Ot(a.temperature)}</strong></span>
            ${s.sp!=null?J`<span><span class="fact-label">${s.held?"Held at":"Set to"}</span> <strong class="readout">${Ot(s.sp)}</strong></span>`:ve}
            ${!s.observed&&a.opening!=null?J`<span><span class="fact-label">Valve</span> <strong class="readout">${a.opening}%</strong></span>`:ve}
          </span>
        </button>
      </li>`})}</ul>`:J`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${e.map(a=>{const s=yr(a,t);return J`<tr class=${s.on?"selected":""} data-idle=${String(!(a.calling||a.topup))} @click=${r=>{r.target.closest("button")||no(a.id,r.currentTarget.querySelector("button"))}}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
            <span class="swatch" style="--swatch:${rr(a.temperature)}" aria-hidden="true"></span><span class="room-btn-name">${a.name}</span>${o(s)}</button></th>
          <td class="num readout">${Ot(a.temperature)}</td>
          <td class="num readout">${s.sp==null?J`<span class="wa-color-text-quiet">–</span>`:J`${s.held?J`<wa-icon class="held-icon" name="hand" label="Held"></wa-icon> `:ve}${Ot(s.sp)}`}</td>
          <td>${s.observed||a.opening==null?J`<span class="wa-color-text-quiet">–</span>`:J`
            <span class="valve"><wa-progress-bar value=${a.opening} label="${a.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${a.opening}%</span></span>`}</td>
          <td>${Lo(s.label,s.kind)}</td>
        </tr>`})}</tbody>
    </table>
  </wa-scroller>`}function vr(e,t,n){const o=ta(t);if(Ch(t.id,(o??20)+n),!(e.detail>0)||Qo.matches)return;e.currentTarget.parentElement.querySelector(".step-value")?.animate([{transform:`translateY(${n>0?6:-6}px)`,opacity:.4},{transform:"translateY(0)",opacity:1}],{duration:180,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}function Dh(e,t,n){return J`<div class="stepper" role="group" aria-label="${e.name} setpoint">
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t<=Ei} @click=${o=>vr(o,e,-.5)}>
      <wa-icon name="minus" label="Lower ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
    <output class="step-value readout" aria-live="polite" aria-atomic="true">${Ot(t)}</output>
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t>=Ai} @click=${o=>vr(o,e,.5)}>
      <wa-icon name="plus" label="Raise ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
  </div>`}function kr(e,{inDrawer:t}){const[n,o]=xi(e),a=Ti(e),s=Xt(e.id),r=Vn("household"),i=!!r,l=a?ta(e):null,c=a&&s.pending==null&&!s.clearing&&e.override?.setpoint!=null,d=a&&s.pending!=null,u=Jn.has(e.role),g=!(e.calling||e.topup),p=e.heat_source==="episodic",f=_i(e.id),y=(we?.learning_notes??[]).filter(ne=>ne.room_id===e.id),h=e.model?oh(e,{outdoor:we?.outdoor,minute_of_day:we?.minute_of_day,notes:y}):[],b=e.model?vi(e.model):!1,w=Oh(e),$=Lh(e),R=ds(we).find(ne=>ne.room.id===e.id)?.texts.filter(ne=>ne!=="no reading")??[],E=[];e.humidity!=null&&E.push(["Humidity",`${Math.round(e.humidity)}%`]),!a&&e.setpoint!=null&&!u&&E.push(["Setpoint",Ot(e.setpoint)]);const P=Mh(e);e.model&&E.push(["Learning",Si(e)]);const Z=s.error?"":c?Th(e.override):d?"Sending…":"From the schedule",Q=a?J`
    <div class="setpoint" data-held=${String(c||d)}>
      <div class="setpoint-row">
        <div class="wa-stack wa-gap-3xs">
          <span class="setpoint-label">Setpoint</span>
          <span class="setpoint-hint" aria-live="polite">${s.error?J`<span class="error-line" role="alert">${s.error}</span>`:Z}</span>
        </div>
        ${Dh(e,l,i)}
      </div>
      <div class="wa-cluster wa-gap-xs">
        ${c&&!i?J`<wa-button size="s" appearance="outlined" @click=${()=>Ah(e.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>`:ve}
        ${r?J`<wa-tag size="s" class="lock-tag">${r}</wa-tag>`:ve}
      </div>
    </div>`:ve;return J`
    <div class="room-detail" data-room=${e.id}>
      <div class="room-detail-head">
        <div class="wa-stack wa-gap-2xs">
          ${t?ve:J`<h2 class="wa-heading-l" id="room-panel-h" tabindex="-1">${e.name}</h2>`}
          <div class="wa-cluster wa-gap-xs">
            ${Lo(n,o)}
            ${c?J`<wa-tag size="s" class="radiate-cool">Held</wa-tag>`:ve}
          </div>
        </div>
        ${t?ve:J`<wa-button appearance="plain" size="s" class="panel-close" @click=${Ri}><wa-icon name="xmark" label="Close ${e.name}"></wa-icon></wa-button>`}
      </div>

      ${t?Q:ve}
      ${$?J`<p class="reason">${$}</p>`:ve}

      <div class="readouts">
        <div class="readout-block"><span class="readout-label">Now</span><span class="readout readout-xl">${Ot(e.temperature)}</span></div>
        ${e.target!=null&&!u?J`<div class="readout-block"><span class="readout-label">Target</span><span class="readout readout-l">${Ot(e.target)}</span></div>`:ve}
        ${!u&&e.opening!=null?J`<div class="readout-block"><span class="readout-label">Opening limit</span><span class="readout readout-l">${e.opening}%</span></div>`:ve}
      </div>
      ${!u&&e.opening!=null?J`<wa-progress-bar class="opening" data-idle=${String(g)} value=${e.opening} label="${e.name} opening limit, ${e.opening}%"></wa-progress-bar>`:ve}

      ${R.length?J`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${R.map(ne=>ne[0].toUpperCase()+ne.slice(1)).join(". ")}.</wa-callout>`:ve}
      ${w?J`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${w}</wa-callout>`:ve}

      ${t?ve:Q}

      ${p?J`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${!!f.shown(Ci(e))} ?disabled=${i} aria-busy=${String(f.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${()=>xh(e)}>Fire lit</wa-switch>
          ${e.fire&&e.fire_switch===!1&&!f.busy?J`<p class="fire-spotted"><wa-icon name="eye"></wa-icon>Radiate spotted the fire. Switch on to confirm.</p>`:ve}
          <p class="action-error fire-error" role="alert" ?hidden=${!f.error}>${f.error}</p>
        </div>`:ve}

      ${E.length?J`<dl class="facts">${E.map(([ne,T])=>J`<div><dt>${ne}</dt><dd>${T}</dd></div>`)}</dl>`:ve}
      ${!e.model&&P?J`<p class="wa-caption-m wa-color-text-quiet">${P}</p>`:ve}

      ${e.model?J`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${b?J`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>`:ve}</span>
          <div class="wa-stack wa-gap-s">
            ${b?J`<p class="learned-status">${e.model.samples===0?"Still learning. Nothing learned yet, so Radiate uses typical values for now.":"Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>`:ve}
            <dl class="learned-rows">${h.map(ne=>J`<div><dt>${ne.label}</dt><dd>${ne.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${ah(e.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>`:ve}
    </div>`}let $r=!1;function qh(){we&&($r||(C("rooms").textContent="",$r=!0),xt(Ph(we.rooms),C("rooms")))}function us(){const e=Xe?Kt.get(Xe):null,t=C("room-panel"),n=C("hm-status"),o=!!(e&&Qt.matches);if(t.hidden===o){t.hidden=!o,n.hidden=o;const a=o?t:n;Qo.matches||a.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:200,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}if(xt(o?kr(e,{inDrawer:!1}):ve,t),Qt.matches){xt(ve,_t);return}_t.label=e?.name??"Room",xt(e?kr(e,{inDrawer:!0}):ve,_t)}const Li={ok:{icon:"circle-check",tone:"success"},heat:{icon:"fire-flame-curved",tone:"brand"},attention:{icon:"triangle-exclamation",tone:"warning"},frost:{icon:"snowflake",tone:"cool"},off:{icon:"power-off",tone:"neutral"},quiet:{icon:"moon",tone:"cool"},stale:{icon:"plug-circle-xmark",tone:"warning"},wait:{icon:"hourglass-half",tone:"neutral"}};function Ih(e){const t=e.rooms.filter(s=>!Jn.has(s.role)),n=t.filter(s=>s.calling).length,o=e.telemetry??{};if(hs(e))return["attention","The boiler relay can't be reached"];if((e.alert_details??[]).some(s=>s.code?.startsWith("safe_mode")))return["attention","Safe mode: the boiler is stopping"];if(e.mode==="off")return["off","Heating is off"];if(e.mode==="frost")return["frost","Frost protection only"];if(!o.simulated&&o.boiler_linked===!1)return n?["wait",`${St(n,"room wants","rooms want")} heat`]:["ok","Rooms are comfortable"];if(e.boiler.state==="firing")return["heat",n?`Heating ${St(n,"room","rooms")}`:"Burner on"];if(e.boiler.state==="lead")return["heat","Opening valves"];if(e.quiet?.active)return["quiet",`Quiet hours until ${e.quiet.until}`];if(e.boiler.state==="rest")return["ok","Burner resting"];const a=t.filter(ea).length;return a?["wait",`${St(a,"room is","rooms are")} waiting for a burn`]:["ok","Rooms are comfortable"]}function Hh(e){let t=null;for(const n of e.rooms)Jn.has(n.role)||n.next_in_min==null||n.next_setpoint==null||(!t||n.next_in_min<t.next_in_min)&&(t=n);return t?Xo((e.minute_of_day+t.next_in_min)%1440):null}function Mi(e,t){const[n,o]=document.body.dataset.link==="stale"?["stale","Showing old data"]:Ih(e),a=Li[n],s=C("hero");if(s.dataset.tone!==a.tone){const y=s.dataset.tone;s.dataset.tone=a.tone,y&&!Qo.matches&&s.querySelector(".hero-icon").animate([{transform:"scale(0.85)",opacity:.4},{transform:"scale(1)",opacity:1}],{duration:240,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}C("hero-icon").name=a.icon,C("hero-title").textContent=o,C("hero-why").textContent=t;const r=[];e.outdoor!=null&&r.push(["temperature-half",`Outside ${e.outdoor.toFixed(1)}°`]),r.push(["faucet-drip",e.store?.boost?"Hot water boosted":e.store?.relay?"Hot water on":"Hot water off"]);const i=Hh(e);i&&r.push(["clock",`Next change ${i}`]),xt(J`${r.map(([y,h])=>J`<li><wa-icon name=${y}></wa-icon>${h}</li>`)}`,C("hero-facts"));const l=ds(e),c=new Map;for(const y of l)for(const h of y.texts)c.set(h,(c.get(h)??0)+1);const d=new Set([...c].filter(([,y])=>y>=3).map(([y])=>y)),u=[];for(const y of d)u.push(J`<li><a class="need-chip" href="#devices"><strong>${y[0].toUpperCase()+y.slice(1)}</strong><span>${St(c.get(y),"room","rooms")}</span></a></li>`);for(const y of l){const h=y.texts.filter(b=>!d.has(b));h.length&&u.push(J`<li><button type="button" class="need-chip" @click=${b=>no(y.room.id,b.currentTarget)}>
      <strong>${y.room.name}</strong><span>${h.join(", ")}</span></button></li>`)}const g=Bh(e),p=No===!0;for(const y of g.slice(0,xr)){const h=y.message.indexOf(": "),[b,w]=h>0?[y.message.slice(0,h),y.message.slice(h+2)]:[y.message,""],$=p&&(!y.code||ji.test(y.code))?"#devices":"#guide/alerts";u.push(J`<li><a class="need-chip" href=${$}><strong>${b}</strong>${w?J`<span>${w}</span>`:ve}</a></li>`)}const f=g.length-xr;f>0&&u.push(J`<li><a class="need-chip need-more" href=${p?"#devices":"#guide/alerts"}><strong>${f} more ${f===1?"alert":"alerts"}</strong></a></li>`),C("hero-needs").hidden=!u.length,xt(J`${u}`,C("hero-needs-list")),oa(e)}function Bh(e){return e.alert_details?e.alert_details.filter(t=>!t.room_id||!e.rooms.some(n=>n.id===t.room_id)):(e.alerts??[]).map(t=>({code:null,message:t}))}const xr=2,Fh={auto:"Auto",frost:"Frost",off:"Off"};function oa(e){const t=Ln.shown(e.mode),n=[Fh[t]??t],o=e.settings?.demand_mode;Ka[o]&&n.push(fn.shown(o)==="comfort"?"Comfort":"Eco"),n.push(Mn.shown(e.store?.boost)?"hot water boosted":e.store?.relay?"hot water on":"hot water off"),C("hero-summary-text").textContent=n.join(", ")}function Oi(e){C("hero-summary").setAttribute("aria-expanded",String(e)),C("hero-summary-act").textContent=e?"Done":"Change",C("hero").dataset.controls=e?"open":"closed"}C("hero-summary").addEventListener("click",()=>Oi(C("hero-summary").getAttribute("aria-expanded")!=="true"));Oi(!1);function wt(){qh(),us()}const Sr=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],jh=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],go=e=>Date.UTC(+e.slice(0,4),+e.slice(5,7)-1,+e.slice(8,10))/864e5;function Ni(e,t){const n=t?go(e)-go(t):null,o=new Date(go(e)*864e5).getUTCDay();return n===0?"today":n===1?"tomorrow":n===-1?"yesterday":n!==null&&n>1&&n<7?Sr[o]:`${Sr[o].slice(0,3)} ${+e.slice(8,10)} ${jh[+e.slice(5,7)-1]}`}function Mo(e,t){const n=e.slice(11,16),o=Ni(e.slice(0,10),t);return n==="00:00"?o:o==="today"?n:`${o} ${n}`}function _r(e,t){return e.slice(0,10)===t?e.slice(11,16):Mo(e,t)}function Wh(e,t){const n=e.slice(11,16),o=Ni(e.slice(0,10),t),a=o==="tomorrow"||o==="yesterday"?o:`on ${o}`;return o==="today"?`at ${n}`:n==="00:00"?a:`${a} at ${n}`}function Uh(e,t){const n=t.today;if(e.away&&e.reason==="away_until")return[`Away until ${Mo(e.until,n)}.`,"Away","away"];if(e.away)return[`Away since ${_r(e.presence.since,n)}, from Home Assistant.`,"Away","away"];if(e.until){const o=Mo(e.until,n);return[`Due back ${/^\d/.test(o)?"at ":""}${o}. Warming up their rooms.`,"Due back","back"]}if(e.presence?.uncertain&&e.presence.why){const o=e.presence.uncertain==="evidence_old"?"No update":"Home";return[e.presence.why,o,e.presence.uncertain==="evidence_old"?"stale":""]}if(e.presence?.stale){const o=mt?.household?.away?.presence_stale_after_min;return[`Home Assistant hasn't reported${o?` for over ${To(o)}`:" lately"}, so Radiate treats them as home.`,"No update","stale"]}if(e.presence?.state==="not_home"){const o=t.presence_delay_min,a=o!=null?` Counts as away after ${To(o)}.`:"";return[`Out since ${_r(e.presence.since,n)}.${a}`,"Out",""]}return["Home.","Home",""]}const Sa=new Map;function $n(e){return Sa.has(e)||Sa.set(e,{form:!1,clearing:!1,clearError:"",saving:!1,saveError:""}),Sa.get(e)}const zi=e=>C("people-list").querySelector(`[data-person="${CSS.escape(e)}"]`);function Vh(e){$n(e.id).form=!0,$n(e.id).saveError="",Zt(we?.away);const n=zi(e.id)?.querySelector("wa-input[name=date]"),o=we?.away?.today;n&&o&&(n.min=o,n.value||(n.value=new Date((go(o)+1)*864e5).toISOString().slice(0,10))),requestAnimationFrame(()=>n?.focus())}function Va(e){$n(e.id).form=!1,$n(e.id).saveError="",Zt(we?.away),requestAnimationFrame(()=>zi(e.id)?.querySelector(".away-open")?.focus())}async function Kh(e,t){e.preventDefault();const n=e.currentTarget,o=n.querySelector("wa-input[name=date]").value,a=n.querySelector("wa-input[name=time]").value;if(!o)return;const s=a?`${o}T${a}`:o,r=$n(t.id);r.saving=!0,r.saveError="",Zt(we?.away);try{await In(`people/${t.id}/away`,{until:s})}catch(i){r.saving=!1;const l=String(i?.message??"");r.saveError=l.includes("in the future")?"Not saved: pick a time that has not passed.":l.includes("within")?"Not saved: pick a date in the next 60 days.":oo(i),Zt(we?.away);return}r.saving=!1;for(const i of n.querySelectorAll("wa-input"))i.value="";It(`${t.name} is away until ${Mo(s.length>10?s:`${s}T00:00`,we?.away?.today)}.`),Va(t),Kn()}async function Jh(e){const t=$n(e.id);t.clearing=!0,t.clearError="",Zt(we?.away);try{await In(`people/${e.id}/home`,{})}catch(n){try{if(!/HTTP 404/.test(String(n?.message)))throw n;await In(`people/${e.id}/away`,{until:null})}catch(o){t.clearError=oo(o)}}t.clearError||It(`${e.name} is home.`),t.clearing=!1,Zt(we?.away),await Kn()}function Yh(e,t){const n=$n(e.id),o=Vn("household");o&&(n.form=!1);const[a,s,r]=Uh(e,t);return J`
    <wa-card class="person" data-person=${e.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${e.name}</h3>
        ${Lo(s,r)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${a}</p>
        ${n.form?J`
          <form class="away-form wa-stack wa-gap-s" @submit=${i=>Kh(i,e)} @keydown=${i=>{i.key==="Escape"&&Va(e)}}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${n.saving} ?disabled=${n.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${()=>Va(e)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!n.saveError}>${n.saveError}</p>
          </form>`:J`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${!!o}
              aria-label=${e.until?`Change when ${e.name} is back`:`Set ${e.name} away`}
              @click=${()=>Vh(e)}>${e.until?"Change":"Set away"}</wa-button>
            ${!o&&(e.until||e.away)?J`<wa-button size="s" appearance="plain" aria-label="${e.name} is back now"
              ?loading=${n.clearing} ?disabled=${n.clearing} @click=${()=>Jh(e)}>Back now</wa-button>`:ve}
            ${o?J`<wa-tag size="s" class="lock-tag">${o}</wa-tag>`:ve}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!n.clearError}>${n.clearError}</p>
      </div>
    </wa-card>`}function Zt(e){const t=e?.people??[];C("people-empty").hidden=t.length>0,C("away-note").hidden=!e?.frost;const n=e?.return,o=C("return-note");if(o.hidden=!n,n){const a=t.filter(i=>i.until&&i.until.slice(0,16)===n.at.slice(0,16)),s=a.length?a:t.filter(i=>i.until),r=s.length?`${dn(s.map(i=>i.name))}'s return`:"a return";o.textContent=`Warming up for ${r} ${Wh(n.at,e.today)}.`}xt(J`${t.map(a=>Yh(a,e))}`,C("people-list")),document.body.dataset.view==="schedules"&&Yi.show()}const Gh={show(){},hide(){}},Pi=600*1e3,nn=Lu({modelEl:C("hm-model"),statusEl:C("hm-status"),planEl:C("hm-plan"),transport:xe,arrangeLock:()=>Vn("admin"),onSelect:(e,t)=>no(e,t),onWeek:()=>{location.hash="#schedules"}});new MutationObserver(()=>nn.redraw()).observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.fonts?.ready&&document.fonts.ready.then(()=>nn.redraw());const Oo=si({list:C("week-list"),legendEl:C("week-legend"),frostEl:C("week-frost"),hintEl:C("week-hint")}),ze={key:null,minute:null,at:0,loading:!1,again:!1,gone:!1,shown:!1};let Cr=!1;async function _a(e,t,n){try{return await xe.call(e,t,n)}catch(o){throw o instanceof Fe&&at(),o}}const Xh={async household(){const e=await _a("GET","household");if(e.status!==200)throw new Error(`household: HTTP ${e.status}`);return e.body},async preview(e){const t=await _a("POST","household/preview",{household:e});if(t.status!==200)throw new Error(`household/preview: HTTP ${t.status}`);return t.body},save:e=>_a("PUT","household",{household:e}),async saved(e){const t=C("week-saved");t.textContent=e,clearTimeout(t.timer),t.timer=setTimeout(()=>{t.textContent=""},15e3),ze.key=null,await aa();try{mt=await xe.house()}catch{}sa()},time:un};async function aa(){if(!(ze.gone||!xe.get)){if(ze.loading){ze.again=!0;return}ze.loading=!0,ze.again=!1,ze.at=Date.now();try{const e=await xe.get("schedules");C("week").hidden=!e.rooms.length,Oo.update(e),nn.week(e),ze.shown=!0,we&&Oo.tick(we.minute_of_day)}catch(e){/HTTP 404|not found/.test(String(e?.message))?ze.gone=!0:e instanceof Fe?at():ze.at=Date.now()-Pi+3e4}ze.loading=!1,ze.again&&await aa()}}function Qh(e){const t=JSON.stringify([e.away?.everyone,(e.away?.people??[]).map(o=>[o.id,o.away])]),n=ze.minute!=null&&e.minute_of_day<ze.minute;ze.minute=e.minute_of_day,t!==ze.key||n||Date.now()-ze.at>Pi?(ze.key=t,aa()):ze.shown&&Oo.tick(e.minute_of_day)}function Er(e,t,n){e.textContent="";for(const[o,a]of t){const s=Math.max(0,(o+n)/n)*100,r=Math.max(0,(a+n)/n)*100;if(r<=0)continue;const i=document.createElement("i");i.style.left=`${s}%`,i.style.width=`${Math.max(.3,r-s)}%`,e.appendChild(i)}}function hs(e){return!e.telemetry?.simulated&&(e.alert_details??[]).some(t=>t.code==="driver.shelly")}const Zh={idle:["Idle","neutral"],lead:["Opening valves","warning"],firing:["Firing","brand"],rest:["Resting","cool"]};function ps(e){we=e,document.body.dataset.link==="stale"&&It("Connected to Radiate again."),delete document.body.dataset.link;const t=e.boiler,n=t.state==="firing",o=mt?.boiler.min_burn_s??480,a=t.min_off_s??mt?.boiler.min_off_s??600,s=ep(e,o);C("status").textContent=s,C("outdoor").textContent=e.outdoor!=null?`Outside ${e.outdoor.toFixed(1)}°`:"",qi(e.mode),Di(e.settings);const r=C("boiler-chip"),i=hs(e),[l,c]=i?["Not reachable","warning"]:Zh[t.state]??["–","neutral"];r.textContent=l,r.dataset.state=i?"lost":t.state,r.classList.toggle("radiate-cool",c==="cool"),c==="cool"?r.removeAttribute("variant"):r.variant=c;let d=0;n&&(d=Math.min(1,t.burn_elapsed_s/o)),t.state==="rest"&&(d=Math.min(1,t.state_elapsed_s/a));const u=C("guard");u.value=Math.round(d*100),u.dataset.kind=t.state,u.label=n?"Minimum burn":t.state==="rest"?"Minimum off":"Minimum burn or rest",C("guard-row").hidden=!(n||t.state==="rest"),C("boiler-detail").textContent=n?t.burn_elapsed_s<o?`Minimum burn: ${Ao(o-t.burn_elapsed_s)} to go`:"Minimum burn met":t.state==="rest"?`${Ao(Math.max(0,a-t.state_elapsed_s))} until it may start again`:"",Ii(e.store.boost),Er(document.querySelector(".lane.burns"),e.timeline.burns,e.timeline.window_s),Er(document.querySelector(".lane.store"),e.timeline.store,e.timeline.window_s),C("s-starts").textContent=`${t.starts_last_hour}`,C("s-pred").textContent=t.predicted_burn_min?`${t.predicted_burn_min} min`:"–",tp(e),i&&(C("s-today-sub").textContent="Not counted while the relay can't be reached"),C("s-supply").textContent=t.supply!=null?t.supply.toFixed(2):"–",np(t);const g=C("banner");e.telemetry?.simulated&&(g.hidden=!1,xt(J`Demo: simulated reference house, ${Xo(e.minute_of_day)} simulated time.<span class="note-long"> Boiler water ${e.telemetry.boiler_water_c}°, store ${e.telemetry.store_c}°, stairs ${e.telemetry.stairs_c}°.</span>`,C("banner-text"))),ap(e.telemetry),op(e.learning_notes),Zt(e.away),Kt.clear();for(const p of e.rooms)Kt.set(p.id,p),Rh(p);Xe&&!Kt.has(Xe)&&(Xe=null),wt(),Mi(e,s),Wi(e.alert_details),nn.update(e),Qh(e),Ba=new Date,mt||ip()}function ep(e,t){const n=e.boiler,o=e.rooms.filter(u=>!Jn.has(u.role)),a=o.filter(u=>u.calling).map(u=>u.name),s=o.filter(u=>!u.calling&&u.topup&&u.extend===!0).map(u=>u.name),r=o.filter(u=>!u.calling&&u.topup&&u.extend!==!0).map(u=>u.name),i=o.filter(ea).map(u=>u.name),l=e.store?.relay?" Hot water on.":"";if(e.telemetry&&!e.telemetry.simulated&&e.telemetry.boiler_linked===!1)return a.length?`${dn(a)} ${a.length===1?"wants":"want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:"No room needs heat. The boiler switch isn't linked yet.";if(hs(e))return"Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";const c=`Burner on for ${Ao(n.burn_elapsed_s)}`,d=u=>`topping up ${dn(u)} to save a second burn soon`;switch(n.state){case"idle":if(i.length){const u=i.length===1?"is":"are";return`Boiler idle. ${dn(i)} ${u} waiting to share a burn with other rooms.${l}`}return e.quiet?.active?`Quiet hours until ${e.quiet.until}. Heating only to keep rooms above 12°.${l}`:l?`Heating idle.${l}`:"Boiler idle. Rooms are within comfort.";case"lead":return`Opening valves before calling the burner.${a.length?` Heating ${dn(a)}.`:""}${l}`;case"rest":return`Burner resting: minimum off time, ${Ao(n.state_elapsed_s)} so far.${l}`;case"firing":if(a.length){const u=s.length?` Also ${d(s)}.`:"";return`${c}. Heating ${dn(a)}.${u}${l}`}if(s.length)return`${c}, ${d(s)}.${l}`;if(n.burn_elapsed_s<t){const u=r.length?`, with the heat going to ${dn(r)}`:"";return`${c} to finish its minimum burn${u}.${l}`}return`${c}. Stopping now that rooms are warm.${l}`;default:return""}}function tp(e){const t=e.accounting?.today,n=e.accounting?.yesterday,o=C("s-today-label");if(t){o.textContent="Burner today",C("s-today").textContent=t.burner_hours!=null?`${t.burner_hours.toFixed(1)} h`:"–";const r=[];t.starts!=null&&r.push(St(t.starts,"start","starts")),t.litres!=null&&r.push(`${t.litres.toFixed(1)} L`),t.kwh!=null&&r.push(`${Math.round(t.kwh)} kWh`),C("s-today-sub").textContent=r.join(", ")}else{o.textContent="Burner hours";const r=e.telemetry?.burner_hours;C("s-today").textContent=r!=null?r.toFixed(1):"–",C("s-today-sub").textContent=""}const a=n?.balance;C("s-balance").textContent=a?.score!=null?`${Math.round(a.score)}/100`:"–";let s="No full day yet";n&&(s=a?.score!=null?"":"No burns with two or more rooms"),a?.arrival_spread_min!=null&&(s=`Last room ${Math.round(a.arrival_spread_min)} min after the first`),n?.partial&&(s="Not a full day of data"),C("s-balance-sub").textContent=s}function np(e){const t=e.short_cycle,n=C("short-cycle");if(n.hidden=!t,!t)return;const o=e.min_off_s!=null?`${Math.round(e.min_off_s/60)} min`:null,a=o?`Minimum off raised to ${o}`:`Minimum off raised by ${t.extra_off_min} min`,s=t.ends_in_h!=null?` for the next ${To(Math.max(1,Math.round(t.ends_in_h*60)))}`:"";C("short-cycle-text").textContent=`${a}${s}, so the burner starts less often.`}const Ka={eco:"fewer, longer burns. Rooms might warm a bit later.",comfort:"every room held at its target, with more burns."},fn=Go();function Di(e){const t=C("demand"),n=C("demand-note"),o=e&&Ka[e.demand_mode];if(t.hidden=!o,we&&oa(we),!o)return;const a=fn.shown(e.demand_mode);t.value!==a&&(t.value=a),t.setAttribute("aria-busy",String(fn.busy));const s=Ka[a];n.dataset.error=String(!!fn.error),n.textContent=fn.error||(a===e.demand_mode_default?`Default: ${s}`:s[0].toUpperCase()+s.slice(1))}C("demand").addEventListener("change",e=>{const t=we?.settings,n=e.target.value;!t||n===fn.shown(t.demand_mode)||Zo(fn,n,"settings",{demand_mode:n===t.demand_mode_default?null:n},()=>{we?.settings&&Di(we.settings)}).then(o=>o&&It(n==="eco"?"Eco: fewer, longer burns.":"Comfort: every room held at its target."))});let Ar="";function op(e=[]){const t=JSON.stringify(e);if(t===Ar)return;Ar=t;const n=C("learning-notes");if(n.hidden=!e.length,n.hidden)return;const o=new Set(e.filter(a=>a.room_id).map(a=>a.room_id)).size;C("learning-notes-lead").textContent=o?`${St(o,"room's learning was","rooms' learning was")} reset recently. Those rooms learn again from their next burns.`:"Radiate changed what it had learned when it last started.",xt(J`${[...e].reverse().map(a=>J`<li><span class="payload">${new Date(a.at*1e3).toLocaleString(void 0,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span> <span>${a.message}</span></li>`)}`,n.querySelector("ul"))}let Tr="";function ap(e){const t=C("dryrun");if(t.hidden=!e?.dry_run,t.hidden)return;const n=e.intended_writes??0,o=e.shelly_intended,a=o!=null?`${St(n,"valve write","valve writes")} and ${St(o,"boiler command","boiler commands")}`:St(n,"valve write","valve writes");C("dryrun-count").textContent=n||o?`Held back so far: ${a}.`:"Nothing held back yet.";const s=e.recent_intended??[],r=JSON.stringify(s);if(r===Tr)return;Tr=r;const i=C("dryrun-recent");i.hidden=!s.length,xt(J`${[...s].reverse().map(l=>J`<li><code>${l.topic}</code> <code class="payload">${typeof l.payload=="string"?l.payload:JSON.stringify(l.payload)}</code></li>`)}`,i.querySelector("ul"))}const Ln=Go();function qi(e){const t=C("mode"),n=Ln.shown(e);t.value!==n&&(t.value=n),t.setAttribute("aria-busy",String(Ln.busy)),$i(C("mode-error"),Ln.error),we&&oa(we)}C("mode").addEventListener("change",e=>{const t=e.target.value;!we||t===Ln.shown(we.mode)||Zo(Ln,t,"mode",{mode:t},()=>we&&qi(we.mode)).then(n=>n&&It({auto:"Heating: Auto. Rooms follow their schedules.",frost:"Heating: Frost protection only.",off:"Heating off. Rooms are still kept above frost."}[t]))});const Mn=Go();function Ii(e){const t=C("boost"),n=!!Mn.shown(e);t.checked!==n&&(t.checked=n),t.setAttribute("aria-busy",String(Mn.busy)),$i(C("boost-error"),Mn.error),we&&oa(we)}C("boost").addEventListener("change",()=>{if(!we)return;const e=!Mn.shown(we.store.boost);Zo(Mn,e,"store/boost",{minutes:e?60:0},()=>we&&Ii(we.store.boost)).then(t=>t&&It(e?"Hot water on for 60 minutes.":"Hot water boost stopped."))});function sp(){if(!we){C("status").textContent="Cannot reach Radiate. Retrying…",C("hero-title").textContent="Cannot reach Radiate",C("hero-why").textContent="Retrying…",C("hero").dataset.tone="warning",C("hero-icon").name=Li.stale.icon;return}document.body.dataset.link="stale";const e=`${String(Ba.getHours()).padStart(2,"0")}:${String(Ba.getMinutes()).padStart(2,"0")}`;C("status").textContent=`Cannot reach Radiate. Retrying… Showing data from ${e}.`,Mi(we,C("status").textContent)}async function Hi(){try{return ps(await xe.state()),!0}catch(e){return e instanceof Fe?at():sp(),!1}}function rp(e){e==="lost"?Hi():e==="auth"&&at()}let Ca=!1;async function ip(){if(!Ca){Ca=!0;try{mt=await xe.house(),sa()}catch{}Ca=!1}}let Xn=null,Gn=null;const Bi=md({transport:xe,onOpen(){for(const e of document.querySelectorAll("main > .view, main > section[aria-labelledby]"))e.id!=="setup"&&(e.hidden=!0);document.body.dataset.setup="open",window.scrollTo(0,0)},onClose(){delete document.body.dataset.setup,xn(!1),Gn&&!Gn.closest("[hidden]")&&Gn.focus(),Gn=null},async onSaved(e){delete document.body.dataset.setup,xn(!1);const t=C("setup-saved");t.textContent=e,t.hidden=!1,t.focus(),clearTimeout(t.timer),t.timer=setTimeout(()=>{t.hidden=!0},15e3),ze.key=null;try{mt=await xe.house()}catch{}sa(),Kn(),fs.refresh()}});async function sa(){Xn??=Bi.available();const e=await Xn;e===null&&(Xn=null);const t=!!mt?.household;C("setup-cta").hidden=!e||t,C("setup-change-row").hidden=!e||!t,to([C("setup-start")],C("setup-start-lock"),"admin"),to([C("setup-change")],C("setup-change-lock"),"admin");const n=C("week-lock");n.hidden=!e||Wa("household"),n.textContent=Vn("household"),e&&!Cr&&Wa("household")&&(Cr=!0,Oo.setEditor(Xh),ze.key=null,aa())}async function ra(e){Gn=e.currentTarget;try{await Bi.open()}catch(t){if(t instanceof Fe){at();return}const n=C("setup-saved");n.textContent="Couldn't open the household setup. Try again in a moment.",n.hidden=!1}}C("setup-start").addEventListener("click",ra);C("setup-change").addEventListener("click",ra);const Fi=Cd({transport:xe,scanLock:()=>Vn("admin"),isAuthError:e=>e instanceof Fe,onAuth:()=>at()});let No=null;const ji=/^(device\.|driver\.trv_offline$|driver\.shelly$)/;function Wi(e){const t=(e??[]).filter(a=>ji.test(a.code)).length;nn.devices(t);const n=C("devices-count");n.hidden=!t,n.textContent=String(t);const o=document.querySelector('.view-tab[data-view="devices"]');t?o.setAttribute("aria-label",`Devices, ${t} ${t===1?"needs":"need"} attention`):o.removeAttribute("aria-label")}const Ui=Dd({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at(),onCount:lp});let Ja=null;function lp(e){const t=C("suggestions-count");t.hidden=!e,t.textContent=String(e);const n=document.querySelector('.view-tab[data-view="suggestions"]');e?n.setAttribute("aria-label",`Suggestions, ${e} to act on`):n.removeAttribute("aria-label")}let Vi=null;const fs=su({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at(),onView:e=>{const t=Zd(e);C("savings-line").hidden=!t,C("savings-line-link").textContent!==t&&(C("savings-line-link").textContent=t),Vi=e.status==="unavailable"?e.why:null,cp()}});let Ya=null;async function cp(){const e=Vi==="no household"&&Xn?await Xn:!1;C("savings-setup-row").hidden=!e,to([C("savings-setup")],C("savings-setup-lock"),"admin")}C("savings-setup").addEventListener("click",e=>{history.replaceState(null,"","#"),xn(!1),ra(e)});const Ki=Cu({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at()});let Ga=null;const zo=uh({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at()}),Po=gh({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at()}),Ji=Nu({root:C("guide")});zu({note:C("guide-note"),tab:document.querySelector('.view-tab[data-view="guide"]')});const Do=Ju({transport:xe,isAuthError:e=>e instanceof Fe,onAuth:()=>at(),onOpenSetup:e=>{history.replaceState(null,"","#"),xn(!1),ra(e)},onShowSchedules:()=>{location.hash="#schedules"},moreSections:()=>[...Po.offered?[{id:"home-assistant",title:"Home Assistant"}]:[],...zo.offered?[{id:"security-log",title:"Security log"}]:[]]}),dp={show(){Do.show(),Po.show(),zo.show()},hide(){Do.hide(),zo.hide()}};let Xa=null;const Yi={show(){const e=C("week").hidden&&C("setup-cta").hidden;C("schedules-empty").hidden=!e},hide(){}},Qa={schedules:{offered:()=>!0,module:Yi},people:{offered:()=>!0,module:Gh},devices:{offered:()=>No===!0,module:Fi},suggestions:{offered:()=>Ja===!0,module:Ui},savings:{offered:()=>Ya===!0,module:fs},settings:{offered:()=>Xa===!0,module:dp},data:{offered:()=>Ga===!0,module:Ki},guide:{offered:()=>!0,module:Ji}};function xn(e){if(document.body.dataset.setup==="open")return;const[t,n]=location.hash.slice(1).split("/"),o=Qa[t]?.offered()?t:"house";for(const a of document.querySelectorAll(".view-tab"))a.dataset.view===o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");C("house").hidden=o!=="house";for(const[a,s]of Object.entries(Qa))C(a).hidden=a!==o,a===o?s.module.show():s.module.hide();document.body.dataset.view=o,document.querySelector("wa-page").dataset.view=o,!(o==="guide"&&Ji.reveal(n))&&(o==="settings"&&Do.reveal(n)||(!e&&o!=="house"&&window.scrollTo(0,0),e&&(window.scrollTo(0,0),C(`${o}-h`)?.focus())))}window.addEventListener("hashchange",()=>xn(!0));document.addEventListener("click",e=>{const t=e.target.closest?.('a[href^="#"]');!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.hash===location.hash&&(t.hash.startsWith("#guide")||t.hash.startsWith("#settings/"))&&(e.preventDefault(),xn(!0))});function up(){for(const[e,t]of Object.entries(Qa))document.querySelector(`.view-tab[data-view="${e}"]`).hidden=!t.offered()}async function hp(){const[e,t,n,o,a]=await Promise.all([No===!0?!0:Fi.available(),Ja===!0?!0:Ui.available(),Ya===!0?!0:fs.available(),Xa===!0?!0:Do.available(),Ga===!0?!0:Ki.available(),zo.available(),Po.offered?!0:Po.available()]);No=e,Ja=t,Ya=n,Xa=o,Ga=a,up(),Wi(we?.alert_details),xn(!1)}let wo=!1;const ms=()=>new URL("login",document.baseURI).toString();async function pp(){if(document.documentElement.dataset.transport==="demo")return!0;try{const t=await fetch(mo("auth/config"));wo=t.ok&&(await t.json()).login===!0}catch{wo=!1}if(!wo)return!0;let e;try{e=await xe.get("auth/me")}catch(t){return t instanceof Fe?(window.location.assign(ms()),!1):!0}return e.via==="session"&&fp(e),!0}const Rr={admin:"Admin: you can change anything here.",household:"Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",viewer:"Read only: you can see the house but not change it."};function fp(e){xe.setCsrf(e.csrf);const t=e.method==="local"?"a password":"single sign-on";C("account-name").textContent=e.user,C("account-who").textContent=`Signed in as ${e.user} with ${t}.`,C("account-role").textContent=Rr[e.role]??Rr.viewer,Ro=e.role in ja?e.role:"viewer",document.body.dataset.role=Ro,vh(),nn.redraw(),wt(),we&&Zt(we.away),C("account").hidden=!1}C("account").addEventListener("wa-select",async e=>{if(e.detail?.item?.value==="sign-out"){C("account-error").hidden=!0;try{await xe.post("auth/logout",{})}catch(t){if(!(t instanceof Fe)){C("account-error").hidden=!1;return}}window.location.assign(ms())}});async function Gi(){if(hp(),!!await pp()){try{mt=await xe.house(),sa()}catch(e){if(e instanceof Fe){at();return}}await Hi(),document.body.dataset.auth!=="needed"&&xe.subscribe(ps,rp)}}function at(){if(wo){window.location.assign(ms());return}if(document.body.dataset.auth==="needed")return;const e=xe.hasToken();xe.setToken(""),document.body.dataset.auth="needed",C("signin").hidden=!1,C("status").textContent="Sign in to see the house.";const t=C("signin-error");t.hidden=!e,t.textContent=e?"The saved token was not accepted. Enter it again.":"",requestAnimationFrame(()=>C("signin-token").focus())}C("signin-form").addEventListener("submit",async e=>{e.preventDefault();const t=C("signin-token"),n=C("signin-form").querySelector("wa-button[type=submit]"),o=C("signin-error"),a=String(t.value??"").trim();if(o.hidden=!0,!a)return;n.disabled=!0;const s=/^[\x21-\x7e]+$/.test(a);s&&xe.setToken(a);try{if(!s)throw new Fe("token");mt=await xe.house()}catch(r){n.disabled=!1,o.hidden=!1,r instanceof Fe?(xe.setToken(""),o.textContent="That token was not accepted. Check it and try again."):o.textContent="Cannot reach Radiate. Try again in a moment.",t.select();return}n.disabled=!1,t.value="",C("signin").hidden=!0,delete document.body.dataset.auth,C("status").textContent="Connecting…",await Gi()});await Gi();
