import{i as Ve,e as Cr,a as Er,A as $e,t as Tr,E as Ar,_ as y,b as Ee,n as B,c as Ye,W as rt,H as Pn,l as Rr,o as kt,d as X,w as bt,L as Et,f as $t,s as Dn,g as Ka,h as qn,r as Qt,j as kn,v as Ja,M as Wi,D as Mt}from"./app.js";const Ui="modulepreload",Vi=function(e,t){return new URL(e,t).href},hs={},Ki=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let r=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const i=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");a=r(n.map(d=>{if(d=Vi(d,o),d in hs)return;hs[d]=!0;const u=d.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(!!o)for(let x=i.length-1;x>=0;x--){const h=i[x];if(h.href===d&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${g}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":Ui,u||(f.as="script"),f.crossOrigin="",f.href=d,c&&f.setAttribute("nonce",c),document.head.appendChild(f),u)return new Promise((x,h)=>{f.addEventListener("load",x),f.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return a.then(r=>{for(const i of r||[])i.status==="rejected"&&s(i.reason);return t().catch(s)})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ji=(e="768px")=>`
  @media screen and (width < ${e}) {
    [part~='navigation'] {
      display: none;
    }

    :host(:not([disable-navigation-toggle])) slot[name~='navigation-toggle'] {
      display: contents;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Yi=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Gi=Ve`
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
 */function Xi(e){return(t,n)=>{const o=typeof t=="function"?t:t[n];Object.assign(o,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let ka=class extends Er{constructor(t){if(super(t),this.it=$e,t.type!==Tr.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===$e||t==null)return this._t=void 0,this.it=t;if(t===Ar)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}};ka.directiveName="unsafeHTML",ka.resultType=1;const Qi=Cr(ka);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Sn(e,t,n){return e?t(e):n?.(e)}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Zi(e,t=document.documentElement){if(!Number.isNaN(Number(e)))return Number(e);if(!window.CSS||!CSS.registerProperty)return typeof e=="string"&&e.endsWith("px")?parseFloat(e):Number(e)||0;const n="--wa-length-resolver";if(!CSS.registerProperty.toString().includes(n))try{CSS.registerProperty({name:n,syntax:"<length>",inherits:!1,initialValue:"0px"})}catch{}const o=t.style.getPropertyValue(n);t.style.setProperty(n,e);const a=getComputedStyle(t)?.getPropertyValue(n);return t.style.setProperty(n,o),a?.endsWith("px")?parseFloat(a):Number(a)||0}function el(e){return Number.isNaN(Number(e))?e:`${e}px`}var je=class extends rt{constructor(){super(),this.hasSlotController=new Pn(this,"navigation-footer","mobile-navigation-footer"),this.headerResizeObserver=this.slotResizeObserver("header"),this.subheaderResizeObserver=this.slotResizeObserver("subheader"),this.bannerResizeObserver=this.slotResizeObserver("banner"),this.footerResizeObserver=this.slotResizeObserver("footer"),this.hasExplicitNavigationToggleSetting=!1,this.handleNavigationToggle=e=>{if(this.view==="desktop"){this.hideNavigation();return}const t=e.composedPath(),n=this.navigationToggleSlot;t.find(o=>o.hasAttribute?.("data-toggle-nav")||o.assignedSlot===n||o===n)&&(e.preventDefault(),this.toggleNavigation())},this.view="desktop",this.navOpen=!1,this.mobileBreakpoint="768px",this.navigationPlacement="start",this.disableNavigationToggle=!1,this.pageResizeObserver=typeof ResizeObserver<"u"?new ResizeObserver(e=>{requestAnimationFrame(()=>{for(const t of e)if(t.contentBoxSize){const o=t.borderBoxSize[0].inlineSize,a=this.view;o>=Zi(this.mobileBreakpoint)?this.view="desktop":this.view="mobile",this.requestUpdate("view",a)}})}):null,this.updateNavigationToggleState=e=>{if(e){const o=e.target.name;if(!["navigation","navigation-header","navigation-footer"].includes(o))return}if(this.hasExplicitNavigationToggleSetting)return;const t=!!this.querySelector(":not([slot='navigation-toggle']) [data-toggle-nav]"),n=!!this.querySelector('[slot="navigation"]')||!!this.querySelector('[slot="navigation-header"]')||!!this.querySelector('[slot="navigation-footer"]');this.disableNavigationToggle=t||!n},this.addEventListener("click",this.handleNavigationToggle)}slotResizeObserver(e){return new ResizeObserver(t=>{requestAnimationFrame(()=>{for(const n of t)if(n.contentBoxSize){const o=n.borderBoxSize[0];this.style.setProperty(`--${e}-height`,`${Math.round(o.blockSize)}px`)}})})}updated(e){e.has("view")&&this.hideNavigation(),super.updated(e)}connectedCallback(){super.connectedCallback(),setTimeout(()=>{requestAnimationFrame(()=>{this.pageResizeObserver?.observe(this),this.headerResizeObserver?.observe(this.header),this.subheaderResizeObserver?.observe(this.subheader),this.bannerResizeObserver?.observe(this.banner),this.footerResizeObserver?.observe(this.footer)})})}visiblePixelsInViewport(e){if(!e)return null;const t=e.clientHeight,n=window.innerHeight,o=e.getBoundingClientRect?.();if(!o)return null;const{top:a,bottom:s}=o;return Math.max(0,a>0?Math.min(t,n-a):Math.min(s,n))}firstUpdated(e){if(!document.getElementById("main-content")){const t=document.createElement("div");t.id="main-content",t.slot="skip-to-content-target",this.prepend(t)}this.hasExplicitNavigationToggleSetting=this.disableNavigationToggle,this.shadowRoot.addEventListener("slotchange",this.updateNavigationToggleState),this.updateNavigationToggleState(),super.firstUpdated(e)}disconnectedCallback(){super.disconnectedCallback(),this.pageResizeObserver?.unobserve(this),this.headerResizeObserver?.unobserve(this.header),this.subheaderResizeObserver?.unobserve(this.subheader),this.footerResizeObserver?.unobserve(this.footer),this.bannerResizeObserver?.unobserve(this.banner)}showNavigation(){this.navOpen=!0}hideNavigation(){this.navOpen=!1}toggleNavigation(){this.navOpen=!this.navOpen}render(){const e=this.view==="mobile"&&(this.hasSlotController.test("navigation-footer")||this.hasSlotController.test("mobile-navigation-footer"));let t=this.nonce||globalThis.litNonce||null;return X`
      <a href="#main-content" part="skip-to-content" class="wa-visually-hidden">
        <slot name="skip-to-content">Skip to content</slot>
      </a>

      <!-- unsafeHTML needed for SSR until this is solved: https://github.com/lit/lit/issues/4696 -->
      ${Qi(`
        <style
          ${t?`nonce="${t}"`:""}
          id="mobile-styles"
        >
          ${Ji(el(this.mobileBreakpoint))}
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
                  ${Sn(this.view==="desktop",()=>X`<slot name="navigation-header"><div></div></slot>`,()=>X`<div></div>`)}
                </slot>
                <slot name="desktop-navigation">
                  ${Sn(this.view==="desktop",()=>X`<slot name="navigation"><div></div></slot>`,()=>X`<div></div>`)}
                </slot>
                <slot name="desktop-navigation-footer">
                  ${Sn(this.view==="desktop",()=>X`<slot name="navigation-footer"><div></div></slot>`,()=>X`<div></div>`)}
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
        ?open=${Rr(this.navOpen)}
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
          ${Sn(this.view==="mobile",()=>X`<slot name="navigation-header"><div></div></slot>`,()=>X`<div></div>`)}
        </slot>
        <slot name="mobile-navigation">
          ${Sn(this.view==="mobile",()=>X`<slot name="navigation"><div></div></slot>`,()=>X`<div></div>`)}
        </slot>

        <slot
          slot=${kt(e?"footer":void 0)}
          name="mobile-navigation-footer"
          ?hidden=${!e}
        >
          ${Sn(this.view==="mobile",()=>X`<slot part="navigation-footer" name="navigation-footer"><div></div></slot>`,()=>X`<div></div>`)}
        </slot>
      </wa-drawer>
    `}};je.css=[Gi,Yi];y([Ee("[part~='header']")],je.prototype,"header",2);y([Ee("[part~='menu']")],je.prototype,"menu",2);y([Ee("[part~='main']")],je.prototype,"main",2);y([Ee("[part~='aside']")],je.prototype,"aside",2);y([Ee("[part~='subheader']")],je.prototype,"subheader",2);y([Ee("[part~='footer']")],je.prototype,"footer",2);y([Ee("[part~='banner']")],je.prototype,"banner",2);y([Ee("[part~='drawer']")],je.prototype,"navigationDrawer",2);y([Ee("slot[name~='navigation-toggle']")],je.prototype,"navigationToggleSlot",2);y([B({attribute:"view",reflect:!0})],je.prototype,"view",2);y([B({reflect:!0})],je.prototype,"nonce",2);y([B({attribute:"nav-open",reflect:!0,type:Boolean})],je.prototype,"navOpen",2);y([B({attribute:"mobile-breakpoint",type:String})],je.prototype,"mobileBreakpoint",2);y([B({attribute:"navigation-placement",reflect:!0})],je.prototype,"navigationPlacement",2);y([B({attribute:"disable-navigation-toggle",reflect:!0,type:Boolean})],je.prototype,"disableNavigationToggle",2);je=y([Ye("wa-page")],je);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var tl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var nl=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??(this.observer=new ResizeObserver(()=>this.check())),this.observer.observe(this.element);for(const t of e)this.observer.observe(t);this.initialCheckHandle??(this.initialCheckHandle=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()}))}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function ol(e,t){const n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var $a=new Set;function al(){const e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function sl(){const e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function ta(e){if($a.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){const t=al()+sl();let n=getComputedStyle(document.documentElement).scrollbarGutter;(!n||n==="auto")&&(n="stable"),t<2&&(n=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",n),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function na(e){$a.delete(e),$a.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function rl(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var zo=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Po=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Do=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qo=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var hn=[];function Lr(e){wo(e),hn.push(e)}function wo(e){for(let t=hn.length-1;t>=0;t--)if(hn[t]===e){hn.splice(t,1);break}}function xa(e){return hn.length>0&&hn[hn.length-1]===e}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */async function Sa(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function vt(e,t){return new Promise(n=>{const o=new AbortController,{signal:a}=o;if(e.classList.contains(t))return;e.classList.add(t);let s=!1,r=()=>{s||(s=!0,e.classList.remove(t),n(),o.abort())};e.addEventListener("animationend",r,{once:!0,signal:a}),e.addEventListener("animationcancel",r,{once:!0,signal:a}),requestAnimationFrame(()=>{!s&&e.getAnimations().length===0&&r()})})}function ps(e){return e=e.toString().toLowerCase(),e.indexOf("ms")>-1?parseFloat(e)||0:e.indexOf("s")>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}function il(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ut=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.hasSlotController=new Pn(this,"footer","header-actions","label"),this.renderedWatcher=new nl(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.withLabel=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&xa(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.drawer.showModal(),ta(this),this.renderedWatcher.start(this.drawer))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),na(this),this.removeOpenListeners()}async requestClose(e){const t=new Po({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,vt(this.drawer,"pulse");return}this.removeOpenListeners(),await vt(this.drawer,"hide"),this.open=!1,this.drawer.close(),na(this),this.renderedWatcher.stop();const n=this.originalTrigger;typeof n?.focus=="function"&&setTimeout(()=>n.focus()),this.dispatchEvent(new Do)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),Lr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),wo(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&xa(this)&&this.requestClose(this.drawer)}handleDialogClick(e){const n=e.target.closest('[data-drawer="close"]');n&&(e.stopPropagation(),this.requestClose(n))}async handleDialogPointerDown(e){e.target===this.drawer&&!ol(e,this.drawer)&&(this.lightDismiss?this.requestClose(this.drawer):await vt(this.drawer,"pulse"))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.drawer.open?(this.removeOpenListeners(),this.drawer.close(),na(this)):e&&!this.drawer.open&&(this.addOpenListeners(),this.drawer.showModal(),ta(this))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open?(this.open=!0,this.requestClose(this.drawer)):this.open||this.renderedWatcher.stop()}async show(){const e=new zo;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),ta(this),this.renderedWatcher.start(this.drawer),requestAnimationFrame(()=>{const t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await vt(this.drawer,"show"),this.dispatchEvent(new qo)}render(){const e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter"),n=this.label.length>0||this.hasSlotController.test("label","withLabel");return X`
      <dialog
        part="dialog"
        aria-labelledby=${kt(e&&n?"title":void 0)}
        aria-label=${kt(!e&&this.label?this.label:void 0)}
        class=${$t({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?X`
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
    `}};ut.css=tl;y([Ee(".drawer")],ut.prototype,"drawer",2);y([B({type:Boolean,reflect:!0})],ut.prototype,"open",2);y([B({reflect:!0})],ut.prototype,"label",2);y([B({reflect:!0})],ut.prototype,"placement",2);y([B({attribute:"without-header",type:Boolean,reflect:!0})],ut.prototype,"withoutHeader",2);y([B({attribute:"light-dismiss",type:Boolean})],ut.prototype,"lightDismiss",2);y([B({attribute:"with-footer",type:Boolean})],ut.prototype,"withFooter",2);y([B({attribute:"with-label",type:Boolean})],ut.prototype,"withLabel",2);y([bt("open",{waitUntilFirstUpdate:!0})],ut.prototype,"handleOpenChange",1);ut=y([Ye("wa-drawer")],ut);document.addEventListener("click",e=>{const t=e.target.closest("[data-drawer]");if(t instanceof Element){const[n,o]=rl(t.getAttribute("data-drawer")||"");if(n==="open"&&o?.length){const s=t.getRootNode().getElementById(o);s?.localName==="wa-drawer"?s.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ll=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var cl=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<"u"&&"createElement"in document&&(t=Object.assign(document.createElement("input"),{required:!0})),n||(n="value");const o={observedAttributes:["required"],message:t?.validationMessage,checkValidity(a){const s={message:"",isValid:!0,invalidKeys:[]};return(a.required??a.hasAttribute("required"))&&!a[n]&&(s.message=typeof o.message=="function"?o.message(a):o.message||"",s.isValid=!1,s.invalidKeys.push("valueMissing")),s}};return o};let dl="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",ul=(e=21)=>{let t="",n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=dl[n[e]&63];return t};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function fs(e,t,n){const o=a=>Object.is(a,-0)?0:a;return e<t?o(t):e>n?o(n):o(e)}function Ya(e=""){return`${e}${ul()}`}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var We=class extends qn{constructor(){super(),this.hasSlotController=new Pn(this,"hint","label"),this.label="",this.hint="",this.name=null,this.disabled=!1,this.orientation="vertical",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{const t=e.target.closest("wa-radio");if(!t||t.disabled||t.forceDisabled||this.disabled)return;const n=this.value;this.value=t.value,t.checked=!0;const o=this.getAllRadios();for(const a of o)t!==a&&(a.checked=!1,a.setAttribute("tabindex","-1"));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})},this.addEventListener("keydown",this.handleKeyDown),this.addEventListener("click",this.handleRadioClick)}static get validators(){const e=[cl({validationElement:Object.assign(document.createElement("input"),{required:!0,type:"radio",name:Ya("__wa-radio")})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e=="number"&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){kn(this.localName,this.size)}get validationTarget(){const e=this.querySelector(":is(wa-radio):not([disabled])");if(e)return e}updated(e){(e.has("disabled")||e.has("size")||e.has("value")||e.has("defaultValue"))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll("wa-radio")]}handleLabelClick(){this.focus()}async syncRadioElements(){const e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute("size",this.size),t.toggleAttribute("data-wa-radio-horizontal",this.orientation!=="vertical"),t.toggleAttribute("data-wa-radio-vertical",this.orientation==="vertical"),t.toggleAttribute("data-wa-radio-first",n===0),t.toggleAttribute("data-wa-radio-inner",n!==0&&n!==e.length-1),t.toggleAttribute("data-wa-radio-last",n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async t=>{await t.updateComplete,!t.disabled&&t.value===this.value?t.checked=!0:t.checked=!1})),this.disabled)e.forEach(t=>{t.tabIndex=-1});else{const t=e.filter(o=>!o.disabled),n=t.find(o=>o.checked);t.length>0&&(n?t.forEach(o=>{o.tabIndex=o.checked?0:-1}):t.forEach((o,a)=>{o.tabIndex=a===0?0:-1})),e.filter(o=>o.disabled).forEach(o=>{o.tabIndex=-1})}}handleKeyDown(e){if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)||this.disabled)return;const t=this.getAllRadios().filter(i=>!i.disabled);if(t.length<=0)return;e.preventDefault();const n=this.value,o=t.find(i=>i.checked)??t[0],a=e.key===" "?0:["ArrowUp","ArrowLeft"].includes(e.key)?-1:1;let s=t.indexOf(o)+a;s||(s=0),s<0&&(s=t.length-1),s>t.length-1&&(s=0);const r=t.some(i=>i.tagName.toLowerCase()==="wa-radio-button");this.getAllRadios().forEach(i=>{i.checked=!1,r||i.setAttribute("tabindex","-1")}),this.value=t[s].value,t[s].checked=!0,r?t[s].shadowRoot.querySelector("button").focus():(t[s].setAttribute("tabindex","0"),t[s].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;const t=this.getAllRadios(),n=t.find(s=>s.checked),o=t.find(s=>!s.disabled),a=n||o;a&&a.focus(e)}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return X`
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
    `}};We.css=[Dn,Ka,ll];We.shadowRootOptions={...qn.shadowRootOptions,delegatesFocus:!0};y([Ee("slot:not([name])")],We.prototype,"defaultSlot",2);y([B()],We.prototype,"label",2);y([B({attribute:"hint"})],We.prototype,"hint",2);y([B({reflect:!0})],We.prototype,"name",2);y([B({type:Boolean,reflect:!0})],We.prototype,"disabled",2);y([B({reflect:!0})],We.prototype,"orientation",2);y([Qt()],We.prototype,"value",1);y([B({attribute:"value",reflect:!0})],We.prototype,"defaultValue",2);y([B({reflect:!0})],We.prototype,"size",2);y([bt("size")],We.prototype,"handleSizeChange",1);y([B({type:Boolean,reflect:!0})],We.prototype,"required",2);y([B({type:Boolean,attribute:"with-label"})],We.prototype,"withLabel",2);y([B({type:Boolean,attribute:"with-hint"})],We.prototype,"withHint",2);We=y([Ye("wa-radio-group")],We);We.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var hl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gt=class extends qn{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance="default",this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener("click",this.handleClick)}handleSizeChange(){kn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute("role","radio"),this.tabIndex=0,this.setAttribute("aria-disabled",this.disabled||this.forceDisabled?"true":"false")}updated(e){if(super.updated(e),e.has("checked")&&(this.customStates.set("checked",this.checked),this.setAttribute("aria-checked",this.checked?"true":"false"),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has("disabled")||e.has("forceDisabled")){const t=this.disabled||this.forceDisabled;this.customStates.set("disabled",t),this.setAttribute("aria-disabled",t?"true":"false"),t?this.tabIndex=-1:this.tabIndex=this.checked?0:-1}}setValue(){}render(){return X`
      <span part="control" class="control">
        ${this.checked?X`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:""}
      </span>

      <slot part="label" class="label"></slot>
    `}};gt.css=[Ka,Dn,hl];y([Qt()],gt.prototype,"checked",2);y([Qt()],gt.prototype,"forceDisabled",2);y([B({reflect:!0})],gt.prototype,"value",2);y([B({reflect:!0})],gt.prototype,"appearance",2);y([B({reflect:!0})],gt.prototype,"size",2);y([bt("size")],gt.prototype,"handleSizeChange",1);y([B({type:Boolean})],gt.prototype,"disabled",2);gt=y([Ye("wa-radio")],gt);gt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var pl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var fn=class extends rt{constructor(){super(...arguments),this.variant="brand",this.appearance="accent",this.pill=!1,this.attention="none"}render(){return X`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};fn.css=[Ja,pl];y([B({reflect:!0})],fn.prototype,"variant",2);y([B({reflect:!0})],fn.prototype,"appearance",2);y([B({type:Boolean,reflect:!0})],fn.prototype,"pill",2);y([B({reflect:!0})],fn.prototype,"attention",2);fn=y([Ye("wa-badge")],fn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var fl=class extends Event{constructor(){super("wa-remove",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ml=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var zt=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.variant="neutral",this.appearance="filled-outlined",this.size="m",this.pill=!1,this.withRemove=!1}handleSizeChange(){kn(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new fl)}render(){return X`
      <slot part="content" class="content"></slot>

      ${this.withRemove?X`
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
    `}};zt.css=[ml,Ja,Dn];y([B({reflect:!0})],zt.prototype,"variant",2);y([B({reflect:!0})],zt.prototype,"appearance",2);y([B({reflect:!0})],zt.prototype,"size",2);y([bt("size")],zt.prototype,"handleSizeChange",1);y([B({type:Boolean,reflect:!0})],zt.prototype,"pill",2);y([B({attribute:"with-remove",type:Boolean})],zt.prototype,"withRemove",2);zt=y([Ye("wa-tag")],zt);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xn=null,uo=0;function wl(){if(uo+=1,Xn||typeof document>"u")return;const e=document.createElement("div");e.id=Ya("wa-toast-live-region-"),e.setAttribute("data-wa-toast-live-region",""),e.style.cssText=`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    pointer-events: none;
    top: 0;
    left: 0;
  `,document.body.append(e),Xn=e}function bl(){uo=Math.max(0,uo-1),!(uo>0)&&(Xn?.remove(),Xn=null)}function yl(e,t){if(typeof document>"u")return;const n=Xn;if(!n)return;const o=e.trim();if(!o)return;const a=document.createElement("div");a.setAttribute("role",t==="danger"?"alert":"status"),a.setAttribute("aria-live",t==="danger"?"assertive":"polite"),a.setAttribute("aria-atomic","true"),n.append(a),requestAnimationFrame(()=>{requestAnimationFrame(()=>{a.textContent=o})}),setTimeout(()=>a.remove(),1e3)}var Qn=class extends rt{constructor(){super(...arguments),this.activatedToastItems=new WeakSet,this.positionCache=new Map,this.placement="top-end",this.handleDocumentKeyDown=async e=>{if(await new Promise(t=>setTimeout(t)),e.key==="Escape"&&!e.defaultPrevented){const t=this.getToastItems();t.length>0&&(e.preventDefault(),t[t.length-1]?.hide())}},this.handleAfterHide=async e=>{const t=e.target;t.parentElement===this&&(this.capturePositions(),t.remove(),await this.animatePositions()),this.getToastItems().length===0&&this.hideStack()}}connectedCallback(){super.connectedCallback(),this.popover="manual",wl(),document.addEventListener("keydown",this.handleDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener?.("keydown",this.handleDocumentKeyDown),bl()}handleSlotChange(){const e=this.getToastItems(),t=[];e.forEach(n=>{this.activatedToastItems.has(n)||t.push(n)}),t.length>0&&(this.capturePositions(),t.forEach(n=>{this.activatedToastItems.add(n),this.showStack(),n.startTimer(),this.announceToastItem(n)}),requestAnimationFrame(()=>this.animatePositions()))}announceToastItem(e){yl(e.textContent??"",e.variant)}getToastItems(){return[...this.querySelectorAll(":scope > wa-toast-item")]}capturePositions(){this.positionCache.clear();for(const e of this.getToastItems())this.positionCache.set(e,e.getBoundingClientRect())}async animatePositions(){if(il()){this.positionCache.clear();return}const e=[];for(const t of this.getToastItems()){const n=this.positionCache.get(t);if(!n)continue;const o=t.getBoundingClientRect(),a=n.top-o.top;if(Math.abs(a)>1){const s=Sa(t,[{transform:`translateY(${a}px)`},{transform:"translateY(0)"}],{duration:200,easing:"cubic-bezier(0.2, 0, 0, 1)"});e.push(s)}}this.positionCache.clear(),await Promise.all(e)}showStack(){this.matches(":popover-open")||(this.showPopover(),this.customStates.set("visible",!0))}hideStack(){this.matches(":popover-open")&&(this.hidePopover(),this.customStates.set("visible",!1))}async create(e,t){const n={allowHtml:!1,duration:5e3,variant:"neutral",size:"m",...t},o=document.createElement("wa-toast-item");if(o.variant=n.variant,o.size=n.size,o.duration=n.duration,n.allowHtml?o.innerHTML=e:o.textContent=e,n.icon){const a=document.createElement("wa-icon");a.setAttribute("slot","icon"),typeof n.icon=="string"?a.setAttribute("name",n.icon):(a.setAttribute("name",n.icon.name),n.icon.library&&a.setAttribute("library",n.icon.library),n.icon.family&&a.setAttribute("family",n.icon.family),n.icon.variant&&a.setAttribute("variant",n.icon.variant)),o.prepend(a)}return this.activatedToastItems.add(o),this.capturePositions(),this.showStack(),this.prepend(o),await o.updateComplete,this.animatePositions(),o.startTimer(),this.announceToastItem(o),o}render(){return X`
      <div part="stack" class="stack" @wa-after-hide=${this.handleAfterHide}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Qn.css=gl;y([Ee(".stack")],Qn.prototype,"stack",2);y([B({reflect:!0})],Qn.prototype,"placement",2);Qn=y([Ye("wa-toast")],Qn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var vl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var St=class extends rt{constructor(){super(...arguments),this.hasSlotController=new Pn(this,"icon"),this.localize=new Et(this),this.animationFrame=null,this.startTime=null,this.isHovering=!1,this.isFocused=!1,this.timeLeft=100,this.variant="neutral",this.size="m",this.duration=5e3,this.withIcon=!1,this.tick=()=>{if(!this.startTime)return;const e=performance.now()-this.startTime,t=Math.min(e/this.duration,1);this.timeLeft=100*(1-t),t<1?this.animationFrame=requestAnimationFrame(this.tick):this.hide()},this.handlePointerEnter=e=>{(e.pointerType==="mouse"||e.pointerType==="pen")&&(this.isHovering=!0,this.pauseTimer())},this.handlePointerLeave=()=>{this.isHovering&&(this.isHovering=!1,this.resumeTimer())},this.handleFocusIn=()=>{this.isFocused=!0,this.pauseTimer()},this.handleFocusOut=()=>{this.isFocused=!1,this.resumeTimer()}}handleSizeChange(){kn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener("pointerenter",this.handlePointerEnter),this.addEventListener("pointerleave",this.handlePointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),this.removeEventListener("pointerenter",this.handlePointerEnter),this.removeEventListener("pointerleave",this.handlePointerLeave)}async startTimer(){const e=new zo;this.dispatchEvent(e),!e.defaultPrevented&&(await this.updateComplete,await vt(this.toastItemElement,"show"),this.dispatchEvent(new qo),this.duration>0&&Number.isFinite(this.duration)&&(this.startTime=performance.now(),this.timeLeft=100,this.tick()))}stopTimer(){this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null)}async hide(){this.stopTimer();const e=new Po;this.dispatchEvent(e),!e.defaultPrevented&&(await vt(this.toastItemElement,"hide"),this.dispatchEvent(new Do),this.remove())}handleCloseClick(){this.hide()}pauseTimer(){this.stopTimer(),this.timeLeft=100}resumeTimer(){!this.isHovering&&!this.isFocused&&this.duration>0&&(this.startTime=performance.now(),this.tick())}render(){const e=this.hasUpdated?this.hasSlotController.test("icon"):this.withIcon,t=this.duration>0;return X`
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
    `}};St.css=[vl,Ja,Dn];y([Ee(".toast-item")],St.prototype,"toastItemElement",2);y([Qt()],St.prototype,"timeLeft",2);y([B({reflect:!0})],St.prototype,"variant",2);y([B({reflect:!0})],St.prototype,"size",2);y([bt("size")],St.prototype,"handleSizeChange",1);y([B({type:Number})],St.prototype,"duration",2);y([B({attribute:"with-icon",type:Boolean})],St.prototype,"withIcon",2);St=y([Ye("wa-toast-item")],St);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var kl=Ve`
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
 */const Mr="important",$l=" !"+Mr,ms=Cr(class extends Er{constructor(e){if(super(e),e.type!==Tr.ATTRIBUTE||e.name!=="style"||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{const o=e[n];return o==null?t:t+`${n=n.includes("-")?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${o};`},"")}update(e,[t]){const{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const o of this.ft)t[o]==null&&(this.ft.delete(o),o.includes("-")?n.removeProperty(o):n[o]=null);for(const o in t){const a=t[o];if(a!=null){this.ft.add(o);const s=typeof a=="string"&&a.endsWith($l);o.includes("-")||s?n.setProperty(o,s?a.slice(0,-11):a,s?Mr:""):n[o]=a}}return Ar}});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Vt=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.value=0,this.label=""}updated(e){if(super.updated(e),e.has("value")){const t=parseFloat(getComputedStyle(this.indicator).getPropertyValue("r")),n=2*Math.PI*t,o=n-this.value/100*n;this.indicatorOffset=`${o}px`}}render(){return X`
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
    `}};Vt.css=kl;y([Ee(".indicator")],Vt.prototype,"indicator",2);y([Qt()],Vt.prototype,"indicatorOffset",2);y([B({type:Number,reflect:!0})],Vt.prototype,"value",2);y([B()],Vt.prototype,"label",2);Vt=y([Ye("wa-progress-ring")],Vt);Vt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var xl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var He=class extends qn{constructor(){super(...arguments),this.hasSlotController=new Pn(this,"hint"),this.localize=new Et(this),this.title="",this.name=null,this._value=this.getAttribute("value")??null,this.size="m",this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute("checked"),this.required=!1,this.hint="",this.withHint=!1}static get validators(){return[...super.validators,Wi()]}get value(){return this._value??"on"}set value(e){this._value=e}handleSizeChange(){kn(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})}handleKeyDown(e){const t=this.localize.dir()==="rtl";e.key==="ArrowLeft"&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))})),e.key==="ArrowRight"&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has("value")||e.has("checked")||e.has("defaultChecked")||e.has("disabled"))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set("checked",this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??"on",t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){const e=this.hasSlotController.test("hint","withHint"),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:Rr(this.checked);return X`
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
    `}};He.shadowRootOptions={...qn.shadowRootOptions,delegatesFocus:!0};He.css=[Ka,Dn,xl];y([Ee('input[type="checkbox"]')],He.prototype,"input",2);y([B()],He.prototype,"title",2);y([B({reflect:!0})],He.prototype,"name",2);y([B({reflect:!0})],He.prototype,"value",1);y([B({reflect:!0})],He.prototype,"size",2);y([bt("size")],He.prototype,"handleSizeChange",1);y([B({type:Boolean})],He.prototype,"disabled",2);y([B({type:Boolean,attribute:!1})],He.prototype,"checked",1);y([B({type:Boolean,attribute:"checked",reflect:!0})],He.prototype,"defaultChecked",2);y([B({type:Boolean,reflect:!0})],He.prototype,"required",2);y([B({attribute:"hint"})],He.prototype,"hint",2);y([B({attribute:"with-hint",type:Boolean})],He.prototype,"withHint",2);y([bt(["checked","defaultChecked"])],He.prototype,"handleStateChange",1);y([bt("disabled",{waitUntilFirstUpdate:!0})],He.prototype,"handleDisabledChange",1);He=y([Ye("wa-switch")],He);He.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Sl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function gs(e,t){return new Promise(n=>{function o(a){a.target===e&&(e.removeEventListener(t,o),n())}e.addEventListener(t,o)})}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qe=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance="outlined",this.iconPlacement="end"}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?"auto":"0",this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(t=>{for(const n of t)n.type==="attributes"&&n.attributeName==="open"&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has("isAnimating")&&this.customStates.set("animating",this.isAnimating)}handleSummaryClick(e){e.composedPath().some(o=>{if(!(o instanceof HTMLElement))return!1;const a=o.tagName?.toLowerCase();return["a","button","input","textarea","select"].includes(a)?!0:o instanceof qn?!("disabled"in o)||!o.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&(e.preventDefault(),this.hide()),(e.key==="ArrowDown"||e.key==="ArrowRight")&&(e.preventDefault(),this.show())}closeOthersWithSameName(){if(!this.name)return;this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(n=>{n!==this&&n.open&&(n.open=!1)})}async handleOpenChange(){this.animationGeneration++;const e=this.animationGeneration;if(this.open){this.details.open=!0;const t=new zo;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;const n=ps(getComputedStyle(this.body).getPropertyValue("--show-duration"));if(await Sa(this.body,[{height:"0",opacity:"0"},{height:`${this.body.scrollHeight}px`,opacity:"1"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="auto",this.isAnimating=!1,this.dispatchEvent(new qo)}else{const t=new Po;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;const n=ps(getComputedStyle(this.body).getPropertyValue("--hide-duration"));if(await Sa(this.body,[{height:`${this.body.scrollHeight}px`,opacity:"1"},{height:"0",opacity:"0"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="0",this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new Do)}}async show(){if(!(this.open||this.disabled))return this.open=!0,gs(this,"wa-after-show")}async hide(){if(!(!this.open||this.disabled))return this.open=!1,gs(this,"wa-after-hide")}render(){const e=this.hasUpdated?this.localize.dir()==="rtl":this.dir==="rtl";return X`
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
    `}};Qe.css=Sl;y([Ee("details")],Qe.prototype,"details",2);y([Ee("summary")],Qe.prototype,"header",2);y([Ee(".body")],Qe.prototype,"body",2);y([Ee(".expand-icon-slot")],Qe.prototype,"expandIconSlot",2);y([Qt()],Qe.prototype,"isAnimating",2);y([B({type:Boolean,reflect:!0})],Qe.prototype,"open",2);y([B()],Qe.prototype,"summary",2);y([B({reflect:!0})],Qe.prototype,"name",2);y([B({type:Boolean,reflect:!0})],Qe.prototype,"disabled",2);y([B({reflect:!0})],Qe.prototype,"appearance",2);y([B({attribute:"icon-placement",reflect:!0})],Qe.prototype,"iconPlacement",2);y([bt("open",{waitUntilFirstUpdate:!0})],Qe.prototype,"handleOpenChange",1);Qe=y([Ye("wa-details")],Qe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var _l=class extends Event{constructor(e){super("wa-select",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function*Or(e=document.activeElement){e!=null&&(yield e,"shadowRoot"in e&&e.shadowRoot&&e.shadowRoot.mode!=="closed"&&(yield*Or(e.shadowRoot.activeElement)))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Cl=Ve`
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
`;const Kt=Math.min,Ot=Math.max,bo=Math.round,ao=Math.floor,Nt=e=>({x:e,y:e}),El={left:"right",right:"left",bottom:"top",top:"bottom"};function Nr(e,t,n){return Ot(e,Kt(t,n))}function In(e,t){return typeof e=="function"?e(t):e}function mn(e){return e.split("-")[0]}function Hn(e){return e.split("-")[1]}function zr(e){return e==="x"?"y":"x"}function Ga(e){return e==="y"?"height":"width"}function Rt(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function Xa(e){return zr(Rt(e))}function Tl(e,t,n){n===void 0&&(n=!1);const o=Hn(e),a=Xa(e),s=Ga(a);let r=a==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(r=yo(r)),[r,yo(r)]}function Al(e){const t=yo(e);return[_a(e),t,_a(t)]}function _a(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const ws=["left","right"],bs=["right","left"],Rl=["top","bottom"],Ll=["bottom","top"];function Ml(e,t,n){switch(e){case"top":case"bottom":return n?t?bs:ws:t?ws:bs;case"left":case"right":return t?Rl:Ll;default:return[]}}function Ol(e,t,n,o){const a=Hn(e);let s=Ml(mn(e),n==="start",o);return a&&(s=s.map(r=>r+"-"+a),t&&(s=s.concat(s.map(_a)))),s}function yo(e){const t=mn(e);return El[t]+e.slice(t.length)}function Nl(e){var t,n,o,a;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(a=e.left)!=null?a:0}}function Pr(e){return typeof e!="number"?Nl(e):{top:e,right:e,bottom:e,left:e}}function vo(e){const{x:t,y:n,width:o,height:a}=e;return{width:o,height:a,top:n,left:t,right:t+o,bottom:n+a,x:t,y:n}}function ys(e,t,n){let{reference:o,floating:a}=e;const s=Rt(t),r=Xa(t),i=Ga(r),l=mn(t),c=s==="y",d=o.x+o.width/2-a.width/2,u=o.y+o.height/2-a.height/2,g=o[i]/2-a[i]/2;let p;switch(l){case"top":p={x:d,y:o.y-a.height};break;case"bottom":p={x:d,y:o.y+o.height};break;case"right":p={x:o.x+o.width,y:u};break;case"left":p={x:o.x-a.width,y:u};break;default:p={x:o.x,y:o.y}}const f=Hn(t);return f&&(p[r]+=g*(f==="end"?1:-1)*(n&&c?-1:1)),p}async function zl(e,t){var n;t===void 0&&(t={});const{x:o,y:a,platform:s,rects:r,elements:i,strategy:l}=e,{boundary:c="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:g=!1,padding:p=0}=In(t,e),f=Pr(p),h=i[g?u==="floating"?"reference":"floating":u],b=vo(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(h)))==null||n?h:h.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(i.floating)),boundary:c,rootBoundary:d,strategy:l})),w=u==="floating"?{x:o,y:a,width:r.floating.width,height:r.floating.height}:r.reference,k=await(s.getOffsetParent==null?void 0:s.getOffsetParent(i.floating)),R=await(s.isElement==null?void 0:s.isElement(k))&&await(s.getScale==null?void 0:s.getScale(k))||{x:1,y:1},T=vo(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:i,rect:w,offsetParent:k,strategy:l}):w);return{top:(b.top-T.top+f.top)/R.y,bottom:(T.bottom-b.bottom+f.bottom)/R.y,left:(b.left-T.left+f.left)/R.x,right:(T.right-b.right+f.right)/R.x}}const Pl=50,Dl=async(e,t,n)=>{const{placement:o="bottom",strategy:a="absolute",middleware:s=[],platform:r}=n,i=r.detectOverflow?r:{...r,detectOverflow:zl},l=await(r.isRTL==null?void 0:r.isRTL(t));let c=await r.getElementRects({reference:e,floating:t,strategy:a}),{x:d,y:u}=ys(c,o,l),g=o,p=0;const f={};for(let x=0;x<s.length;x++){const h=s[x];if(!h)continue;const{name:b,fn:w}=h,{x:k,y:R,data:T,reset:D}=await w({x:d,y:u,initialPlacement:o,placement:g,strategy:a,middlewareData:f,rects:c,platform:i,elements:{reference:e,floating:t}});d=k??d,u=R??u,f[b]={...f[b],...T},D&&p<Pl&&(p++,typeof D=="object"&&(D.placement&&(g=D.placement),D.rects&&(c=D.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:a}):D.rects),{x:d,y:u}=ys(c,g,l)),x=-1)}return{x:d,y:u,placement:g,strategy:a,middlewareData:f}},ql=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:a,rects:s,platform:r,elements:i,middlewareData:l}=t,{element:c,padding:d=0}=In(e,t)||{};if(c==null)return{};const u=Pr(d),g={x:n,y:o},p=Xa(a),f=Ga(p),x=await r.getDimensions(c),h=p==="y",b=h?"top":"left",w=h?"bottom":"right",k=h?"clientHeight":"clientWidth",R=s.reference[f]+s.reference[p]-g[p]-s.floating[f],T=g[p]-s.reference[p],D=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c));let Z=D?D[k]:0;(!Z||!await(r.isElement==null?void 0:r.isElement(D)))&&(Z=i.floating[k]||s.floating[f]);const V=R/2-T/2,ae=Z/2-x[f]/2-1,C=Kt(u[b],ae),K=Kt(u[w],ae),q=Z-x[f]-K,m=Z/2-x[f]/2+V,P=Nr(C,m,q),F=!l.arrow&&Hn(a)!=null&&m!==P&&s.reference[f]/2-(m<C?C:K)-x[f]/2<0,N=F?m<C?m-C:m-q:0;return{[p]:g[p]+N,data:{[p]:P,centerOffset:m-P-N,...F&&{alignmentOffset:N}},reset:F}}}),Il=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:a,middlewareData:s,rects:r,initialPlacement:i,platform:l,elements:c}=t,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:g,fallbackStrategy:p="bestFit",fallbackAxisSideDirection:f="none",flipAlignment:x=!0,...h}=In(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const b=mn(a),w=Rt(i),k=mn(i)===i,R=await(l.isRTL==null?void 0:l.isRTL(c.floating)),T=g||(k||!x?[yo(i)]:Al(i)),D=f!=="none";!g&&D&&T.push(...Ol(i,x,f,R));const Z=[i,...T],V=await l.detectOverflow(t,h),ae=[];let C=((o=s.flip)==null?void 0:o.overflows)||[];if(d&&ae.push(V[b]),u){const P=Tl(a,r,R);ae.push(V[P[0]],V[P[1]])}if(C=[...C,{placement:a,overflows:ae}],!ae.every(P=>P<=0)){var K,q;const P=(((K=s.flip)==null?void 0:K.index)||0)+1,F=Z[P];if(F&&(!(u==="alignment"?w!==Rt(F):!1)||C.every(U=>Rt(U.placement)===w?U.overflows[0]>0:!0)))return{data:{index:P,overflows:C},reset:{placement:F}};let N=(q=C.filter(W=>W.overflows[0]<=0).sort((W,U)=>W.overflows[1]-U.overflows[1])[0])==null?void 0:q.placement;if(!N)switch(p){case"bestFit":{var m;const W=(m=C.filter(U=>{if(D){const ee=Rt(U.placement);return ee===w||ee==="y"}return!0}).map(U=>[U.placement,U.overflows.filter(ee=>ee>0).reduce((ee,se)=>ee+se,0)]).sort((U,ee)=>U[1]-ee[1])[0])==null?void 0:m[0];W&&(N=W);break}case"initialPlacement":N=i;break}if(a!==N)return{reset:{placement:N}}}return{}}}},Hl=new Set(["left","top"]);async function Bl(e,t){const{placement:n,platform:o,elements:a}=e,s=await(o.isRTL==null?void 0:o.isRTL(a.floating)),r=mn(n),i=Hn(n),l=Rt(n)==="y",c=Hl.has(r)?-1:1,d=s&&l?-1:1,u=In(t,e);let{mainAxis:g,crossAxis:p,alignmentAxis:f}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return i&&typeof f=="number"&&(p=i==="end"?f*-1:f),l?{x:p*d,y:g*c}:{x:g*c,y:p*d}}const Fl=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:a,y:s,placement:r,middlewareData:i}=t,l=await Bl(t,e);return r===((n=i.offset)==null?void 0:n.placement)&&(o=i.arrow)!=null&&o.alignmentOffset?{}:{x:a+l.x,y:s+l.y,data:{...l,placement:r}}}}},jl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:a,platform:s}=t,{mainAxis:r=!0,crossAxis:i=!1,limiter:l={fn:w=>{let{x:k,y:R}=w;return{x:k,y:R}}},...c}=In(e,t),d={x:n,y:o},u=await s.detectOverflow(t,c),g=Rt(a),p=zr(g);let f=d[p],x=d[g];const h=(w,k)=>Nr(k+u[w==="y"?"top":"left"],k,k-u[w==="y"?"bottom":"right"]);r&&(f=h(p,f)),i&&(x=h(g,x));const b=l.fn({...t,[p]:f,[g]:x});return{...b,data:{x:b.x-n,y:b.y-o,enabled:{[p]:r,[g]:i}}}}}},Wl=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:a,elements:s}=t,{apply:r=()=>{},...i}=In(e,t),l=await a.detectOverflow(t,i),c=mn(n),d=Hn(n),u=Rt(n)==="y",{width:g,height:p}=o.floating;let f,x;c==="top"||c==="bottom"?(f=c,x=d===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(x=c,f=d==="end"?"top":"bottom");const h=p-l.top-l.bottom,b=g-l.left-l.right,w=Kt(p-l[f],h),k=Kt(g-l[x],b),R=t.middlewareData.shift,T=!R;let D=w,Z=k;R!=null&&R.enabled.x&&(Z=b),R!=null&&R.enabled.y&&(D=h),T&&!d&&(u?Z=g-2*Ot(l.left,l.right):D=p-2*Ot(l.top,l.bottom)),await r({...t,availableWidth:Z,availableHeight:D});const V=await a.getDimensions(s.floating);return g!==V.width||p!==V.height?{reset:{rects:!0}}:{}}}};function Io(){return typeof window<"u"}function Bn(e){return Dr(e)?(e.nodeName||"").toLowerCase():"#document"}function nt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Dt(e){var t;return(t=(Dr(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Dr(e){return Io()?e instanceof Node||e instanceof nt(e).Node:!1}function _t(e){return Io()?e instanceof Element||e instanceof nt(e).Element:!1}function Zt(e){return Io()?e instanceof HTMLElement||e instanceof nt(e).HTMLElement:!1}function vs(e){return!Io()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof nt(e).ShadowRoot}function Ho(e){const{overflow:t,overflowX:n,overflowY:o,display:a}=Ct(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&a!=="inline"&&a!=="contents"}function Ul(e){return/^(table|td|th)$/.test(Bn(e))}function Bo(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Vl=/transform|translate|scale|rotate|perspective|filter/,Kl=/paint|layout|strict|content/,an=e=>!!e&&e!=="none";let oa;function Fo(e){const t=_t(e)?Ct(e):e;return an(t.transform)||an(t.translate)||an(t.scale)||an(t.rotate)||an(t.perspective)||!Qa()&&(an(t.backdropFilter)||an(t.filter))||Vl.test(t.willChange||"")||Kl.test(t.contain||"")}function Jl(e){let t=gn(e);for(;Zt(t)&&!Zn(t);){if(Fo(t))return t;if(Bo(t))return null;t=gn(t)}return null}function Qa(){return oa==null&&(oa=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),oa}function Zn(e){return/^(html|body|#document)$/.test(Bn(e))}function Ct(e){return nt(e).getComputedStyle(e)}function jo(e){return _t(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function gn(e){if(Bn(e)==="html")return e;const t=e.assignedSlot||e.parentNode||vs(e)&&e.host||Dt(e);return vs(t)?t.host:t}function qr(e){const t=gn(e);return Zn(t)?(e.ownerDocument||e).body:Zt(t)&&Ho(t)?t:qr(t)}function An(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const a=qr(e),s=a===((o=e.ownerDocument)==null?void 0:o.body),r=nt(a);if(s){const i=Ca(r);return t.concat(r,r.visualViewport||[],Ho(a)?a:[],i&&n?An(i):[])}else return t.concat(a,An(a,[],n))}function Ca(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Ir(e){const t=Ct(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const a=Zt(e),s=a?e.offsetWidth:n,r=a?e.offsetHeight:o,i=bo(n)!==s||bo(o)!==r;return i&&(n=s,o=r),{width:n,height:o,$:i}}function Za(e){return _t(e)?e:e.contextElement}function Tn(e){const t=Za(e);if(!Zt(t))return Nt(1);const n=t.getBoundingClientRect(),{width:o,height:a,$:s}=Ir(t);let r=(s?bo(n.width):n.width)/o,i=(s?bo(n.height):n.height)/a;return(!r||!Number.isFinite(r))&&(r=1),(!i||!Number.isFinite(i))&&(i=1),{x:r,y:i}}const Yl=Nt(0);function Hr(e){const t=nt(e);return!Qa()||!t.visualViewport?Yl:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Gl(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===nt(e)}function wn(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const a=e.getBoundingClientRect(),s=Za(e);let r=Nt(1);t&&(o?_t(o)&&(r=Tn(o)):r=Tn(e));const i=Gl(s,n,o)?Hr(s):Nt(0);let l=(a.left+i.x)/r.x,c=(a.top+i.y)/r.y,d=a.width/r.x,u=a.height/r.y;if(s&&o){const g=nt(s),p=_t(o)?nt(o):o;let f=g,x=Ca(f);for(;x&&p!==f;){const h=Tn(x),b=x.getBoundingClientRect(),w=Ct(x),k=b.left+(x.clientLeft+parseFloat(w.paddingLeft))*h.x,R=b.top+(x.clientTop+parseFloat(w.paddingTop))*h.y;l*=h.x,c*=h.y,d*=h.x,u*=h.y,l+=k,c+=R,f=nt(x),x=Ca(f)}}return vo({width:d,height:u,x:l,y:c})}function Wo(e,t){const n=jo(e).scrollLeft;return t?t.left+n:wn(Dt(e)).left+n}function Br(e,t){const n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-Wo(e,n),a=n.top+t.scrollTop;return{x:o,y:a}}function Xl(e){let{elements:t,rect:n,offsetParent:o,strategy:a}=e;const s=a==="fixed",r=Dt(o),i=t?Bo(t.floating):!1;if(o===r||i&&s)return n;let l={scrollLeft:0,scrollTop:0},c=Nt(1);const d=Nt(0),u=Zt(o);if((u||!s)&&((Bn(o)!=="body"||Ho(r))&&(l=jo(o)),u)){const p=wn(o);c=Tn(o),d.x=p.x+o.clientLeft,d.y=p.y+o.clientTop}const g=r&&!u&&!s?Br(r,l):Nt(0);return{width:n.width*c.x,height:n.height*c.y,x:n.x*c.x-l.scrollLeft*c.x+d.x+g.x,y:n.y*c.y-l.scrollTop*c.y+d.y+g.y}}function Ql(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Zl(e){const t=jo(e),n=e.ownerDocument.body,o=Ot(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),a=Ot(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+Wo(e);const r=-t.scrollTop;return Ct(n).direction==="rtl"&&(s+=Ot(e.clientWidth,n.clientWidth)-o),{width:o,height:a,x:s,y:r}}const ec=25;function tc(e,t,n){n===void 0&&(n="viewport");const o=n==="layoutViewport",a=nt(e),s=Dt(e),r=a.visualViewport;let i=s.clientWidth,l=s.clientHeight,c=0,d=0;if(r){const g=!Qa()||t==="fixed";o?g||(c=-r.offsetLeft,d=-r.offsetTop):(i=r.width,l=r.height,g&&(c=r.offsetLeft,d=r.offsetTop))}if(Wo(s)<=0){const g=s.ownerDocument,p=g.body,f=getComputedStyle(p),x=g.compatMode==="CSS1Compat"&&parseFloat(f.marginLeft)+parseFloat(f.marginRight)||0,h=Math.abs(s.clientWidth-p.clientWidth-x),b=getComputedStyle(s).scrollbarGutter==="stable both-edges"?h/2:h;b<=ec&&(i-=b)}return{width:i,height:l,x:c,y:d}}function nc(e,t){const n=wn(e,!0,t==="fixed"),o=n.top+e.clientTop,a=n.left+e.clientLeft,s=Tn(e),r=e.clientWidth*s.x,i=e.clientHeight*s.y,l=a*s.x,c=o*s.y;return{width:r,height:i,x:l,y:c}}function ks(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=tc(e,n,t);else if(t==="document")o=Zl(Dt(e));else if(_t(t))o=nc(t,n);else{const a=Hr(e);o={x:t.x-a.x,y:t.y-a.y,width:t.width,height:t.height}}return vo(o)}function oc(e,t){const n=t.get(e);if(n)return n;let o=An(e,[],!1).filter(i=>_t(i)&&Bn(i)!=="body"),a=null;const s=Ct(e).position==="fixed";let r=s?gn(e):e;for(;_t(r)&&!Zn(r);){const i=Ct(r),l=Fo(r),c=a?a.position:s?"fixed":"";!l&&(c==="fixed"||c==="absolute"&&i.position==="static")?o=o.filter(u=>u!==r):a=i,r=gn(r)}return t.set(e,o),o}function ac(e){let{element:t,boundary:n,rootBoundary:o,strategy:a}=e;const r=[...n==="clippingAncestors"?Bo(t)?[]:oc(t,this._c):[].concat(n),o],i=ks(t,r[0],a);let l=i.top,c=i.right,d=i.bottom,u=i.left;for(let g=1;g<r.length;g++){const p=ks(t,r[g],a);l=Ot(p.top,l),c=Kt(p.right,c),d=Kt(p.bottom,d),u=Ot(p.left,u)}return{width:c-u,height:d-l,x:u,y:l}}function sc(e){const{width:t,height:n}=Ir(e);return{width:t,height:n}}function rc(e,t,n){const o=Zt(t),a=Dt(t),s=n==="fixed",r=wn(e,!0,s,t);let i={scrollLeft:0,scrollTop:0};const l=Nt(0);if((o||!s)&&((Bn(t)!=="body"||Ho(a))&&(i=jo(t)),o)){const g=wn(t,!0,s,t);l.x=g.x+t.clientLeft,l.y=g.y+t.clientTop}!o&&a&&(l.x=Wo(a));const c=a&&!o&&!s?Br(a,i):Nt(0),d=r.left+i.scrollLeft-l.x-c.x,u=r.top+i.scrollTop-l.y-c.y;return{x:d,y:u,width:r.width,height:r.height}}function aa(e){return Ct(e).position==="static"}function $s(e,t){if(!Zt(e)||Ct(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return Dt(e)===n&&(n=n.ownerDocument.body),n}function Fr(e,t){const n=nt(e);if(Bo(e))return n;if(!Zt(e)){let a=gn(e);for(;a&&!Zn(a);){if(_t(a)&&!aa(a))return a;a=gn(a)}return n}let o=$s(e,t);for(;o&&Ul(o)&&aa(o);)o=$s(o,t);return o&&Zn(o)&&aa(o)&&!Fo(o)?n:o||Jl(e)||n}const ic=async function(e){const t=this.getOffsetParent||Fr,n=this.getDimensions,o=await n(e.floating);return{reference:rc(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function lc(e){return Ct(e).direction==="rtl"}const ho={convertOffsetParentRelativeRectToViewportRelativeRect:Xl,getDocumentElement:Dt,getClippingRect:ac,getOffsetParent:Fr,getElementRects:ic,getClientRects:Ql,getDimensions:sc,getScale:Tn,isElement:_t,isRTL:lc};function jr(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function cc(e,t,n){let o=null,a;const s=Dt(e);function r(){var d;clearTimeout(a),(d=o)==null||d.disconnect(),o=null}function i(d,u){d===void 0&&(d=!1),u===void 0&&(u=1),r();const g=e.getBoundingClientRect(),{left:p,top:f,width:x,height:h}=g;if(d||t(),!x||!h)return;const b=ao(f),w=ao(s.clientWidth-(p+x)),k=ao(s.clientHeight-(f+h)),R=ao(p),D={rootMargin:-b+"px "+-w+"px "+-k+"px "+-R+"px",threshold:Ot(0,Kt(1,u))||1};let Z=!0;function V(ae){const C=ae[0].intersectionRatio;if(!jr(g,e.getBoundingClientRect()))return i();if(C!==u){if(!Z)return i();C?i(!1,C):a=setTimeout(()=>{i(!1,1e-7)},1e3)}Z=!1}try{o=new IntersectionObserver(V,{...D,root:s.ownerDocument})}catch{o=new IntersectionObserver(V,D)}o.observe(e)}const l=nt(e),c=()=>i(n);return l.addEventListener("resize",c),i(!0),()=>{l.removeEventListener("resize",c),r()}}function Wr(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:a=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:i=typeof IntersectionObserver=="function",animationFrame:l=!1}=o,c=Za(e),d=a||s?[...c?An(c):[],...t?An(t):[]]:[];d.forEach(b=>{a&&b.addEventListener("scroll",n),s&&b.addEventListener("resize",n)});const u=c&&i?cc(c,n,s):null;let g=-1,p=null;r&&(p=new ResizeObserver(b=>{let[w]=b;w&&w.target===c&&p&&t&&(p.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var k;(k=p)==null||k.observe(t)})),n()}),c&&!l&&p.observe(c),t&&p.observe(t));let f,x=l?wn(e):null;l&&h();function h(){const b=wn(e);x&&!jr(x,b)&&n(),x=b,f=requestAnimationFrame(h)}return n(),()=>{var b;d.forEach(w=>{a&&w.removeEventListener("scroll",n),s&&w.removeEventListener("resize",n)}),u?.(),(b=p)==null||b.disconnect(),p=null,l&&cancelAnimationFrame(f)}}const Ur=Fl,Vr=jl,Kr=Il,xs=Wl,dc=ql,Jr=(e,t,n)=>{const o=new Map,a=n??{},s={...ho,...a.platform,_c:o};return Dl(e,t,{...a,platform:s})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var sa=new Set,Xe=class extends rt{constructor(){super(...arguments),this.submenuCleanups=new Map,this.localize=new Et(this),this.userTypedQuery="",this.openSubmenuStack=[],this.open=!1,this.size="m",this.placement="bottom-start",this.distance=0,this.skidding=0,this.handleDocumentKeyDown=async e=>{const t=this.localize.dir()==="rtl";if(e.key==="Escape"&&this.open&&xa(this)){const d=this.getTrigger();e.preventDefault(),e.stopPropagation(),this.open=!1,d?.focus({preventScroll:!0});return}const n=[...Or()].find(d=>d.localName==="wa-dropdown-item"),o=n?.localName==="wa-dropdown-item",a=this.getCurrentSubmenuItem(),s=!!a;let r,i,l;s?(r=this.getSubmenuItems(a),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1):(r=this.getItems(),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1);let c;if(e.key==="ArrowUp"&&(e.preventDefault(),e.stopPropagation(),l>0?c=r[l-1]:c=r[r.length-1]),e.key==="ArrowDown"&&(e.preventDefault(),e.stopPropagation(),l!==-1&&l<r.length-1?c=r[l+1]:c=r[0]),e.key===(t?"ArrowLeft":"ArrowRight")&&o&&i&&i.hasSubmenu){e.preventDefault(),e.stopPropagation(),i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0);return}if(e.key===(t?"ArrowRight":"ArrowLeft")&&s){e.preventDefault(),e.stopPropagation();const d=this.removeFromSubmenuStack();d&&(d.submenuOpen=!1,setTimeout(()=>{d.focus({preventScroll:!0}),d.active=!0,(d.slot==="submenu"?this.getSubmenuItems(d.parentElement):this.getItems()).forEach(g=>{g!==d&&(g.active=!1)})},0));return}if((e.key==="Home"||e.key==="End")&&(e.preventDefault(),e.stopPropagation(),c=e.key==="Home"?r[0]:r[r.length-1]),e.key==="Tab"&&await this.hideMenu(),e.key.length===1&&!(e.metaKey||e.ctrlKey||e.altKey)&&!(e.key===" "&&this.userTypedQuery==="")&&(clearTimeout(this.userTypedTimeout),this.userTypedTimeout=setTimeout(()=>{this.userTypedQuery=""},1e3),this.userTypedQuery+=e.key,r.some(d=>{const u=(d.textContent||"").trim().toLowerCase(),g=this.userTypedQuery.trim().toLowerCase();return u.startsWith(g)?(c=d,!0):!1})),c){e.preventDefault(),e.stopPropagation(),r.forEach(d=>d.active=d===c),c.focus({preventScroll:!0}),c.scrollIntoView({block:"nearest"});return}(e.key==="Enter"||e.key===" "&&this.userTypedQuery==="")&&o&&i&&(e.preventDefault(),e.stopPropagation(),i.hasSubmenu?(i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,g)=>u.active=g===0),d[0].focus({preventScroll:!0}))},0)):this.makeSelection(i,e))},this.handleDocumentPointerDown=e=>{e.composedPath().some(o=>o instanceof HTMLElement?o===this||o.closest('wa-dropdown, [part="submenu"]'):!1)||(this.open=!1)},this.handleGlobalMouseMove=e=>{const t=this.getCurrentSubmenuItem();if(!t?.submenuOpen||!t.submenuElement)return;const n=t.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl",a=o?n.right:n.left,s=o?Math.max(e.clientX,a):Math.min(e.clientX,a),r=Math.max(n.top,Math.min(e.clientY,n.bottom));t.submenuElement.style.setProperty("--safe-triangle-cursor-x",`${s}px`),t.submenuElement.style.setProperty("--safe-triangle-cursor-y",`${r}px`);const i=e.composedPath(),l=t.matches(":hover"),c=!!t.submenuElement?.matches(":hover"),d=l||!!i.find(g=>g===t),u=c||!!i.find(g=>g instanceof HTMLElement&&g.closest('[part="submenu"]')===t.submenuElement);!d&&!u&&setTimeout(()=>{!l&&!c&&(t.submenuOpen=!1)},100)}}handleSizeChange(){kn(this.localName,this.size)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.userTypedTimeout),this.closeAllSubmenus(),this.submenuCleanups.forEach(e=>e()),this.submenuCleanups.clear(),document.removeEventListener("mousemove",this.handleGlobalMouseMove),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),wo(this)}firstUpdated(e){super.firstUpdated(e),this.syncAriaAttributes()}async updated(e){if(e.has("open")){const t=e.get("open");if(t===this.open||t===void 0&&this.open===!1)return;this.customStates.set("open",this.open),this.open?await this.showMenu():(this.closeAllSubmenus(),await this.hideMenu())}e.has("size")&&this.syncItemSizes()}getItems(e=!1){const t=(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(n=>n.localName==="wa-dropdown-item");return e?t:t.filter(n=>!n.disabled)}getSubmenuItems(e,t=!1){const n=e.shadowRoot?.querySelector('slot[name="submenu"]')||e.querySelector('slot[name="submenu"]');if(!n)return[];const o=n.assignedElements({flatten:!0}).filter(a=>a.localName==="wa-dropdown-item");return t?o:o.filter(a=>!a.disabled)}syncItemSizes(){(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(t=>t.localName==="wa-dropdown-item").forEach(t=>t.size=this.size)}addToSubmenuStack(e){const t=this.openSubmenuStack.indexOf(e);t!==-1?this.openSubmenuStack=this.openSubmenuStack.slice(0,t+1):this.openSubmenuStack.push(e)}removeFromSubmenuStack(){return this.openSubmenuStack.pop()}getCurrentSubmenuItem(){return this.openSubmenuStack.length>0?this.openSubmenuStack[this.openSubmenuStack.length-1]:void 0}closeAllSubmenus(){this.getItems(!0).forEach(t=>{t.submenuOpen=!1}),this.openSubmenuStack=[]}closeSiblingSubmenus(e){const t=e.closest('wa-dropdown-item:not([slot="submenu"])');let n;t?n=this.getSubmenuItems(t,!0):n=this.getItems(!0),n.forEach(o=>{o!==e&&o.submenuOpen&&(o.submenuOpen=!1)}),this.openSubmenuStack.includes(e)||this.openSubmenuStack.push(e)}getTrigger(){return this.querySelector('[slot="trigger"]')}async showMenu(){if(!this.getTrigger()||!this.popup||!this.menu)return;const t=new zo;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1;return}if(this.popup.active)return;sa.forEach(o=>o.open=!1),this.popup.active=!0,this.open=!0,sa.add(this),Lr(this),this.syncAriaAttributes(),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("pointerdown",this.handleDocumentPointerDown),document.addEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("hide"),await vt(this.menu,"show");const n=this.getItems();n.length>0&&(n.forEach((o,a)=>o.active=a===0),n[0].focus({preventScroll:!0})),this.dispatchEvent(new qo)}async hideMenu(){if(!this.popup||!this.menu)return;const e=new Po({source:this});if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}this.open=!1,sa.delete(this),wo(this),this.syncAriaAttributes(),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),document.removeEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("show"),await vt(this.menu,"hide"),this.popup.active=this.open,this.dispatchEvent(new Do)}handleMenuClick(e){const t=e.target.closest("wa-dropdown-item");if(!(!t||t.disabled)){if(t.hasSubmenu){t.submenuOpen||(this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),t.submenuOpen=!0),e.stopPropagation();return}this.makeSelection(t,e)}}async handleMenuSlotChange(){const e=this.getItems(!0);await Promise.all(e.map(o=>o.updateComplete)),this.syncItemSizes();const t=e.some(o=>o.type==="checkbox"),n=e.some(o=>o.hasSubmenu);e.forEach((o,a)=>{o.setAttribute("aria-posinset",String(a+1)),o.setAttribute("aria-setsize",String(e.length)),o.active=a===0,o.checkboxAdjacent=t,o.submenuAdjacent=n})}handleTriggerClick(){this.open=!this.open}handleSubmenuOpening(e){const t=e.detail.item;this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),this.setupSubmenuPosition(t),this.processSubmenuItems(t)}setupSubmenuPosition(e){if(!e.submenuElement)return;this.cleanupSubmenuPosition(e);const t=Wr(e,e.submenuElement,()=>{this.positionSubmenu(e),this.updateSafeTriangleCoordinates(e)});this.submenuCleanups.set(e,t);const n=e.submenuElement.querySelector('slot[name="submenu"]');n&&(n.removeEventListener("slotchange",Xe.handleSubmenuSlotChange),n.addEventListener("slotchange",Xe.handleSubmenuSlotChange),Xe.handleSubmenuSlotChange({target:n}))}static handleSubmenuSlotChange(e){const t=e.target;if(!t)return;const n=t.assignedElements().filter(s=>s.localName==="wa-dropdown-item");if(n.length===0)return;const o=n.some(s=>s.hasSubmenu),a=n.some(s=>s.type==="checkbox");n.forEach(s=>{s.submenuAdjacent=o,s.checkboxAdjacent=a})}processSubmenuItems(e){if(!e.submenuElement)return;const t=this.getSubmenuItems(e,!0),n=t.some(o=>o.hasSubmenu);t.forEach(o=>{o.submenuAdjacent=n})}cleanupSubmenuPosition(e){const t=this.submenuCleanups.get(e);t&&(t(),this.submenuCleanups.delete(e))}positionSubmenu(e){if(!e.submenuElement)return;const n=this.localize.dir()==="rtl"?"left-start":"right-start";Jr(e,e.submenuElement,{placement:n,middleware:[Ur({mainAxis:0,crossAxis:-5}),Kr({fallbackStrategy:"bestFit"}),Vr({padding:8,crossAxis:!0})]}).then(({x:o,y:a,placement:s})=>{e.submenuElement.setAttribute("data-placement",s),Object.assign(e.submenuElement.style,{left:`${o}px`,top:`${a}px`})})}updateSafeTriangleCoordinates(e){if(!e.submenuElement||!e.submenuOpen)return;if(document.activeElement?.matches(":focus-visible")){e.submenuElement.style.setProperty("--safe-triangle-visible","none");return}e.submenuElement.style.setProperty("--safe-triangle-visible","block");const n=e.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl";e.submenuElement.style.setProperty("--safe-triangle-submenu-start-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-start-y",`${n.top}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-y",`${n.bottom}px`)}makeSelection(e,t){const n=this.getTrigger();if(e.disabled)return;e.type==="checkbox"&&(e.checked=!e.checked);const o=new _l({item:e});this.dispatchEvent(o),o.defaultPrevented||(e.navigate(t),this.open=!1,n?.focus({preventScroll:!0}))}async syncAriaAttributes(){const e=this.getTrigger();let t;e&&(e.localName==="wa-button"?(await customElements.whenDefined("wa-button"),await e.updateComplete,t=e.shadowRoot.querySelector('[part~="base"]')):t=e,t.hasAttribute("id")||t.setAttribute("id",Ya("wa-dropdown-trigger-")),t.setAttribute("aria-haspopup","menu"),t.setAttribute("aria-expanded",this.open?"true":"false"),this.menu?.setAttribute("aria-expanded","false"))}render(){let e=this.didSSR&&!this.hasUpdated?this.open:this.popup?.active;return X`
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
    `}};Xe.css=[Dn,Cl];y([Ee("slot:not([name])")],Xe.prototype,"defaultSlot",2);y([Ee("#menu")],Xe.prototype,"menu",2);y([Ee("wa-popup")],Xe.prototype,"popup",2);y([B({type:Boolean,reflect:!0})],Xe.prototype,"open",2);y([B({reflect:!0})],Xe.prototype,"size",2);y([bt("size")],Xe.prototype,"handleSizeChange",1);y([B({reflect:!0})],Xe.prototype,"placement",2);y([B({type:Number})],Xe.prototype,"distance",2);y([B({type:Number})],Xe.prototype,"skidding",2);Xe=y([Ye("wa-dropdown")],Xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var uc=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pe=class extends rt{constructor(){super(...arguments),this.hasSlotController=new Pn(this,"[default]","start","end"),this.active=!1,this.variant="default",this.size="m",this.checkboxAdjacent=!1,this.submenuAdjacent=!1,this.type="normal",this.checked=!1,this.disabled=!1,this.submenuOpen=!1,this.hasSubmenu=!1,this.handleSlotChange=()=>{this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState(),this.hasSubmenu?(this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",this.submenuOpen?"true":"false")):(this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"))},this.handleHostClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handleClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handlePointerEnter=e=>{e.pointerType==="mouse"&&this.hasSubmenu&&!this.disabled&&(this.notifyParentOfOpening(),this.submenuOpen=!0)}}handleSizeChange(){kn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener?.("click",this.handleHostClick),this.addEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.addEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}disconnectedCallback(){super.disconnectedCallback(),this.closeSubmenu(),this.removeEventListener?.("click",this.handleHostClick),this.removeEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.removeEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}firstUpdated(e){super.firstUpdated(e),this.setAttribute("tabindex","-1"),this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState()}updated(e){e.has("active")&&(this.setAttribute("tabindex",this.active?"0":"-1"),this.customStates.set("active",this.active)),e.has("checked")&&(this.type==="checkbox"?this.setAttribute("aria-checked",this.checked?"true":"false"):this.removeAttribute("aria-checked"),this.customStates.set("checked",this.checked)),e.has("disabled")&&(this.setAttribute("aria-disabled",this.disabled?"true":"false"),this.customStates.set("disabled",this.disabled)),e.has("type")&&(this.type==="checkbox"?(this.setAttribute("role","menuitemcheckbox"),this.setAttribute("aria-checked",this.checked?"true":"false")):(this.setAttribute("role","menuitem"),this.removeAttribute("aria-checked"))),(e.has("href")||e.has("hasSubmenu"))&&this.customStates.set("link",this.isLink()),e.has("submenuOpen")&&(this.customStates.set("submenu-open",this.submenuOpen),this.submenuOpen?this.openSubmenu():this.closeSubmenu())}updateHasSubmenuState(){this.customStates.set("has-submenu",this.hasSubmenu)}async openSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||!this.isConnected||(this.notifyParentOfOpening(),e.showPopover?.(),e.hidden=!1,e.setAttribute("data-visible",""),this.submenuOpen=!0,this.setAttribute("aria-expanded","true"),await vt(e,"show"),setTimeout(()=>{const t=this.getSubmenuItems();t.length>0&&(t.forEach((n,o)=>n.active=o===0),t[0].focus({preventScroll:!0}))},0))}notifyParentOfOpening(){const e=new CustomEvent("submenu-opening",{bubbles:!0,composed:!0,detail:{item:this}});this.dispatchEvent(e);const t=this.parentElement;t&&[...t.children].filter(o=>o!==this&&o.localName==="wa-dropdown-item"&&o.getAttribute("slot")===this.getAttribute("slot")&&o.submenuOpen).forEach(o=>{o.submenuOpen=!1})}async closeSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||(this.submenuOpen=!1,this.setAttribute("aria-expanded","false"),e.hidden||(await vt(e,"hide"),e?.isConnected&&(e.hidden=!0,e.removeAttribute("data-visible"),e.hidePopover?.())))}isLink(){return!!this.href&&!this.hasSubmenu}navigate(e){const t=this.linkElement;!this.isLink()||this.disabled||!t||t.dispatchEvent(new MouseEvent("click",{bubbles:!1,cancelable:!0,composed:!1,altKey:e?.altKey??!1,ctrlKey:e?.ctrlKey??!1,metaKey:e?.metaKey??!1,shiftKey:e?.shiftKey??!1}))}getSubmenuItems(){return[...this.children].filter(e=>e.localName==="wa-dropdown-item"&&e.getAttribute("slot")==="submenu"&&!e.hasAttribute("disabled"))}render(){return X`
      ${this.href?X`
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
      ${this.type==="checkbox"?X`
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

      ${this.hasSubmenu?X`
            <wa-icon
              id="submenu-indicator"
              part="submenu-icon"
              exportparts="svg:submenu-icon__svg"
              library="system"
              name="chevron-right"
            ></wa-icon>
          `:""}
      ${this.hasSubmenu?X`
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
    `}};Pe.css=uc;y([Ee("#submenu")],Pe.prototype,"submenuElement",2);y([Ee("#link")],Pe.prototype,"linkElement",2);y([B({type:Boolean})],Pe.prototype,"active",2);y([B({reflect:!0})],Pe.prototype,"variant",2);y([B({reflect:!0})],Pe.prototype,"size",2);y([bt("size")],Pe.prototype,"handleSizeChange",1);y([B({attribute:"checkbox-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"checkboxAdjacent",2);y([B({attribute:"submenu-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"submenuAdjacent",2);y([B()],Pe.prototype,"value",2);y([B({reflect:!0})],Pe.prototype,"type",2);y([B({type:Boolean})],Pe.prototype,"checked",2);y([B({type:Boolean,reflect:!0})],Pe.prototype,"disabled",2);y([B({type:Boolean,reflect:!0})],Pe.prototype,"submenuOpen",2);y([B({reflect:!0})],Pe.prototype,"href",2);y([B()],Pe.prototype,"target",2);y([B()],Pe.prototype,"rel",2);y([B()],Pe.prototype,"download",2);y([Qt()],Pe.prototype,"hasSubmenu",2);Pe=y([Ye("wa-dropdown-item")],Pe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var hc=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var pc=Ve`
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
`;function fc(e){return mc(e)}function ra(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function mc(e){for(let t=e;t;t=ra(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=ra(e);t;t=ra(t)){if(!(t instanceof Element))continue;const n=getComputedStyle(t);if(n.display!=="contents"&&(n.position!=="static"||Fo(n)||t.tagName==="BODY"))return t}return null}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Ss(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var gc=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),xe=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){const e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let o=0,a=0,s=0,r=0,i=0,l=0,c=0,d=0;n?e.top<t.top?(o=e.left,a=e.bottom,s=e.right,r=e.bottom,i=t.left,l=t.top,c=t.right,d=t.top):(o=t.left,a=t.bottom,s=t.right,r=t.bottom,i=e.left,l=e.top,c=e.right,d=e.top):e.left<t.left?(o=e.right,a=e.top,s=t.left,r=t.top,i=e.right,l=e.bottom,c=t.left,d=t.bottom):(o=t.right,a=t.top,s=e.left,r=e.top,i=t.right,l=t.bottom,c=e.left,d=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${a}px`),this.style.setProperty("--hover-bridge-top-right-x",`${s}px`),this.style.setProperty("--hover-bridge-top-right-y",`${r}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${i}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${d}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=gc,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||Ss(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Wr(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;const e=[Ur({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(xs({apply:({rects:o})=>{const a=this.sync==="width"||this.sync==="both",s=this.sync==="height"||this.sync==="both";this.popup.style.width=a?`${o.reference.width}px`:"",this.popup.style.height=s?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!Ss(this.anchor)&&this.boundary==="scroll"&&(t=An(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(Kr({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Vr({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(xs({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:a})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${a}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(dc({element:this.arrowEl,padding:this.arrowPadding}));const n=this.SUPPORTS_POPOVER?o=>ho.getOffsetParent(o,fc):ho.getOffsetParent;Jr(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...ho,getOffsetParent:n}}).then(({x:o,y:a,middlewareData:s,placement:r})=>{const i=this.localize.dir()==="rtl",l={top:"bottom",right:"left",bottom:"top",left:"right"}[r.split("-")[0]];if(this.setAttribute("data-current-placement",r),Object.assign(this.popup.style,{left:`${o}px`,top:`${a}px`}),this.arrow){const c=s.arrow.x,d=s.arrow.y;let u="",g="",p="",f="";if(this.arrowPlacement==="start"){const x=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",g=i?x:"",f=i?"":x}else if(this.arrowPlacement==="end"){const x=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";g=i?"":x,f=i?x:"",p=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(f=typeof c=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof d=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(f=typeof c=="number"?`${c}px`:"",u=typeof d=="number"?`${d}px`:"");Object.assign(this.arrowEl.style,{top:u,right:g,bottom:p,left:f,[l]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new hc)}render(){return X`
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
        ${this.arrow?X`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};xe.css=pc;y([Ee(".popup")],xe.prototype,"popup",2);y([Ee(".arrow")],xe.prototype,"arrowEl",2);y([B({attribute:!1,type:Boolean})],xe.prototype,"SUPPORTS_POPOVER",2);y([B()],xe.prototype,"anchor",2);y([B({type:Boolean,reflect:!0})],xe.prototype,"active",2);y([B({reflect:!0})],xe.prototype,"placement",2);y([B()],xe.prototype,"boundary",2);y([B({type:Number})],xe.prototype,"distance",2);y([B({type:Number})],xe.prototype,"skidding",2);y([B({type:Boolean})],xe.prototype,"arrow",2);y([B({attribute:"arrow-placement"})],xe.prototype,"arrowPlacement",2);y([B({attribute:"arrow-padding",type:Number})],xe.prototype,"arrowPadding",2);y([B({type:Boolean})],xe.prototype,"flip",2);y([B({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],xe.prototype,"flipFallbackPlacements",2);y([B({attribute:"flip-fallback-strategy"})],xe.prototype,"flipFallbackStrategy",2);y([B({type:Object})],xe.prototype,"flipBoundary",2);y([B({attribute:"flip-padding",type:Number})],xe.prototype,"flipPadding",2);y([B({type:Boolean})],xe.prototype,"shift",2);y([B({type:Object})],xe.prototype,"shiftBoundary",2);y([B({attribute:"shift-padding",type:Number})],xe.prototype,"shiftPadding",2);y([B({attribute:"auto-size"})],xe.prototype,"autoSize",2);y([B()],xe.prototype,"sync",2);y([B({type:Object})],xe.prototype,"autoSizeBoundary",2);y([B({attribute:"auto-size-padding",type:Number})],xe.prototype,"autoSizePadding",2);y([B({attribute:"hover-bridge",type:Boolean})],xe.prototype,"hoverBridge",2);xe=y([Ye("wa-popup")],xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wc=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Rn=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${fs(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${fs(this.value,0,100)}%`)}),super.updated(e)}render(){return X`
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
          ${this.indeterminate?"":X` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};Rn.css=wc;y([B({type:Number,reflect:!0})],Rn.prototype,"value",2);y([B({type:Boolean,reflect:!0})],Rn.prototype,"indeterminate",2);y([B()],Rn.prototype,"label",2);Rn=y([Ye("wa-progress-bar")],Rn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var bc=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pt=class extends rt{constructor(){super(...arguments),this.localize=new Et(this),this.resizeObserver=null,this.canScroll=!1,this.orientation="horizontal",this.withoutScrollbar=!1,this.withoutShadow=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.updateScroll()),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}handleKeyDown(e){e.key==="Home"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?0:void 0,top:this.orientation==="vertical"?0:void 0})),e.key==="End"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?this.content.scrollWidth:void 0,top:this.orientation==="vertical"?this.content.scrollHeight:void 0}))}handleSlotChange(){this.updateScroll()}updateScroll(){if(this.orientation==="horizontal"){const e=Math.ceil(this.content.clientWidth),t=Math.abs(Math.ceil(this.content.scrollLeft)),o=Math.ceil(this.content.scrollWidth)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}else{const e=Math.ceil(this.content.clientHeight),t=Math.abs(Math.ceil(this.content.scrollTop)),o=Math.ceil(this.content.scrollHeight)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}}render(){return X`
      ${this.withoutShadow?"":X`
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
    `}};Pt.css=[bc];y([Ee("#content")],Pt.prototype,"content",2);y([Qt()],Pt.prototype,"canScroll",2);y([B({reflect:!0})],Pt.prototype,"orientation",2);y([B({attribute:"without-scrollbar",type:Boolean,reflect:!0})],Pt.prototype,"withoutScrollbar",2);y([B({attribute:"without-shadow",type:Boolean,reflect:!0})],Pt.prototype,"withoutShadow",2);y([Xi({passive:!0})],Pt.prototype,"updateScroll",1);Pt=y([Ye("wa-scroller")],Pt);const so=["People","Routines","Rooms","Temperatures","Result"],ko=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],yc=Object.fromEntries(ko.map(e=>[e.slice(0,3),e])),vc=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"]],Yr=[["shared","Shared","Warm while its people are up and at home, and first thing in the morning even if they then go out."],["bedroom","Bedroom","Warm when its people get up and in the run-up to bed."],["office","Office","Warm while its people work from home."],["while_home","While anyone is home","Warm whenever its people are up and at home, working or not."],["all_day","All day","Warm from the first of its people getting up to the last going to bed, home or not."]],Gr={weekdays:{up:"07:00",bed:"22:30",periods:[{type:"out",from:"08:30",to:"17:30"}]},weekend:{up:"08:30",bed:"23:00",periods:[]}},es=e=>JSON.parse(JSON.stringify(e));function cn(e,{end:t=!1}={}){const n=String(e??"").trim().replace(".",":");let o,a,s=n.match(/^(\d{1,2}):(\d{2})$/);if(s)[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})(\d{2})$/))[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})$/))[o,a]=[Number(s[1]),0];else return null;return a>59||o>24||o===24&&(a>0||!t)?null:`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function kc(e,t){const n=String(e??"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,32)||"person",o=new Set(t);if(n!=="person"&&!o.has(n))return n;for(let a=1;;a++){const s=`${n}_${a}`;if(!o.has(s))return s}}function Xr(e,t=""){const n=t||`Person ${e.people.length+1}`,o=kc(n,e.people.map(a=>a.id));return e.people.push({id:o,name:n,...es(Gr),weekendSame:!1,getting_up_min:null,bedtime_min:null,weekend_days:null,ha_person:null}),o}const Ea=e=>e?.ha_persons?.persons??null;function Qr(e,t,n=[]){const o=String(e??"").trim().toLocaleLowerCase();if(!o||!t)return null;const a=t.filter(s=>String(s.name??"").trim().toLocaleLowerCase()===o&&!n.includes(s.entity_id));return a.length===1?a[0].entity_id:null}function $c(e,t){if(!(!t||e.people.some(n=>n.ha_person)))for(const n of e.people){const o=e.people.map(a=>a.ha_person).filter(Boolean);n.ha_person=Qr(n.name,t,o)}}function xc(e,t){const n=e.map(a=>a.name),o=[["","Not linked"]];for(const a of e){const s=n.indexOf(a.name)!==n.lastIndexOf(a.name);o.push([a.entity_id,s?`${a.name} (${a.entity_id})`:a.name])}return t&&!e.some(a=>a.entity_id===t)&&o.push([t,`${t}, not in Home Assistant now`]),o}const _s=e=>e?`Linked people count as away once Home Assistant has said they're out for ${Vn(e)}.`:"Linked people count as away as soon as Home Assistant says they're out.";function Sc(e,t){e.people=e.people.filter(n=>n.id!==t);for(const n of e.rooms)n.people&&(n.people=n.people.filter(o=>o!==t),n.people.length||(n.people=null,n.kind==="office"&&(n.kind="shared")))}const _c=(e,t)=>e.rooms.find(n=>!n.own&&n.kind==="office"&&n.people?.includes(t))?.id??null;function Cc(e,t,n){for(const s of e.rooms)s.kind!=="office"||!s.people?.includes(t)||s.id===n||(s.people=s.people.filter(r=>r!==t),s.people.length||(s.people=null,s.kind="shared"));if(n==null)return;const o=e.rooms.find(s=>s.id===n);if(!o)return;o.own=!1;const a=o.kind==="office"?o.people??[]:[];o.kind="office",o.use==="unused"&&(o.use="in_use"),o.people=[...new Set([...a,t])]}const Ec=e=>[e.weekdays,...e.weekendSame?[]:[e.weekend]].some(t=>t.periods.some(n=>n.type==="work"));function Cs(e){const t=o=>o==null?[]:Array.isArray(o)?o:[o],n=[];for(const o of["out","work"])for(const a of t(e?.[o])){const[s,r]=String(a).split("-");n.push({type:o,from:s??"",to:r??""})}return n.sort((o,a)=>o.from.localeCompare(a.from)),{up:e?.up??"07:00",bed:e?.bed??"22:30",periods:n}}const Es=e=>(e??[]).map(t=>yc[String(t).toLowerCase().slice(0,3)]??t);function Ts(e){const t=e.household,n=e.defaults,o={people:[],rooms:[],temperatures:{...n.temperatures,...t?.temperatures??{}},timing:{...n.timing,...t?.timing??{}},away:{...n.away,...t?.away??{}},weekend_days:Es(t?.weekend_days??n.weekend_days)};if(t)for(const[a,s]of Object.entries(t.people??{}))o.people.push({id:a,name:s.name??a.replace(/_/g," ").replace(/^./,r=>r.toUpperCase()),weekdays:Cs(s.weekdays),weekend:Cs(s.weekend??s.weekdays),weekendSame:s.weekend==null,getting_up_min:s.getting_up_min??null,bedtime_min:s.bedtime_min??null,weekend_days:s.weekend_days?Es(s.weekend_days):null,ha_person:s.ha_person??null});else Xr(o);$c(o,Ea(e));for(const a of e.rooms){const s=t?.rooms?.[a.id],r={id:a.id,name:a.name,schedule:a.schedule,own:!1,use:"in_use",weekendUse:"in_use",weekendDifferent:!1,kind:"shared",people:null,temperature:null,night_temperature:null,unused_temperature:null,preheat_min:null,adjust:[]};if(s){const i=s.use;r.use=typeof i=="object"?i.weekdays:i,r.weekendUse=typeof i=="object"?i.weekend:i,r.weekendDifferent=typeof i=="object"&&i.weekdays!==i.weekend,r.kind=s.kind??"shared",r.people=s.people??null;for(const l of["temperature","night_temperature","unused_temperature","preheat_min"])r[l]=s[l]??null;r.adjust=es(s.adjust??[])}else t&&a.schedule?r.own=!0:!t&&/bed/i.test(a.name)&&(r.kind="bedroom");o.rooms.push(r)}return o}const $o=(e,t=!1)=>cn(e,{end:t})??String(e??""),Tc=e=>`${$o(e.from)}-${$o(e.to,!0)}`;function As(e){const t={up:$o(e.up)};for(const n of["out","work"]){const o=e.periods.filter(a=>a.type===n).map(Tc);o.length&&(t[n]=o)}return t.bed=$o(e.bed,!0),t}function Rs(e){const t=e.people.map(a=>a.id),n={};for(const a of e.people){const s={name:a.name,weekdays:As(a.weekdays)};a.weekendSame||(s.weekend=As(a.weekend)),a.getting_up_min!=null&&(s.getting_up_min=a.getting_up_min),a.bedtime_min!=null&&(s.bedtime_min=a.bedtime_min),a.weekend_days!=null&&(s.weekend_days=[...a.weekend_days]);const r=String(a.ha_person??"").trim();r&&(s.ha_person=r),n[a.id]=s}const o={};for(const a of e.rooms){if(a.own)continue;const s={use:a.weekendDifferent&&a.weekendUse!==a.use?{weekdays:a.use,weekend:a.weekendUse}:a.use};a.kind!=="shared"&&(s.kind=a.kind),a.people!=null?s.people=[...a.people]:(a.kind==="bedroom"||a.kind==="office")&&(s.people=[...t]);for(const r of["temperature","night_temperature","unused_temperature","preheat_min"])a[r]!=null&&(s[r]=a[r]);a.adjust?.length&&(s.adjust=es(a.adjust)),o[a.id]=s}return{weekend_days:[...e.weekend_days],timing:{...e.timing},away:{...e.away},temperatures:{...e.temperatures},people:n,rooms:o}}function po(e,t){const n={out:0,work:0};return t.map(o=>`${e}.${o.type}[${n[o.type]++}]`)}function Ac(e,t){let n=null;for(const o of e)t!==o&&!t.startsWith(`${o}.`)&&!t.startsWith(`${o}[`)||(!n||o.length>n.length)&&(n=o);return n}function Ls(e,t){const n=t.split(".");if(n[0]!=="household")return{step:4,person:0};const o=(n[1]??"").replace(/\[.*$/,"");if(o==="people"){const a=Math.max(0,e.people.findIndex(s=>s.id===n[2]));return n.length<=3||n[3]==="name"||n[3]==="ha_person"?{step:0,person:a}:{step:1,person:a}}return o==="away"?{step:0,person:0}:o==="rooms"?{step:2,person:0}:o==="temperatures"||o==="timing"||o==="weekend_days"?{step:3,person:0}:{step:4,person:0}}function Rc(e){const t=[];for(const n of e.people)for(const o of n.weekendSame?["weekdays"]:["weekdays","weekend"]){const a=n[o],s=`household.people.${n.id}.${o}`;cn(a.up)||t.push({path:`${s}.up`,message:"Enter a time such as 07:30"}),cn(a.bed,{end:!0})||t.push({path:`${s}.bed`,message:"Enter a time such as 22:30"}),po(s,a.periods).forEach((r,i)=>{const{from:l,to:c}=a.periods[i];(!cn(l)||!cn(c,{end:!0}))&&t.push({path:r,message:"Enter both times, such as 08:30 and 17:30"})})}return t}const Lc=e=>Yr.find(t=>t[0]===e)?.[2]??"",Mc=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ro=(e,t)=>typeof e=="number"&&e<t?`Below ${t}° walls and window frames can get damp, especially in older houses.`:"";function Vn(e,t=null){if(t!=null&&e===t)return"off";if(e<60)return`${e} min`;const n=e%60;return n?`${Math.floor(e/60)} h ${n} min`:`${e/60} h`}const Oc=e=>e.length?Mc(ko.filter(t=>e.includes(t)).map(t=>t[0].toUpperCase()+t.slice(1))):"no days";function Nc(e){const t=e.reduce((o,a)=>o+(a.notes?.length??0),0);return t?`${t===1?"1 warm period is":`${t} warm periods are`} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`:""}const Jt=1440,Ln=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],zc=34,dn=15,Ta=Ln.map(e=>e.slice(0,3).toLowerCase()),Pc=["00:00","06:00","12:00","18:00","24:00"],ts=e=>`${Number.isInteger(e)?e:e.toFixed(1)}°`,st=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,dt=e=>`${e/Jt*100}%`,ns=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`;function Dc(e,t=null){const n=[];for(const o of e)for(const a of o.days)for(const s of a.transitions)n.push(s.setpoint);return t&&n.push(...Object.values(t).filter(o=>typeof o=="number")),n.length?{low:Math.min(...n),high:Math.max(...n)}:{low:0,high:0}}function qc(e){let t=1/0;for(const n of e.days)for(const o of n.transitions)t=Math.min(t,o.setpoint);return Number.isFinite(t)?t:0}function Ic(e,t,n=t.low){const o=[...e].filter(r=>r.minute>=0&&r.minute<Jt).sort((r,i)=>r.minute-i.minute);if(!o.length)return[];o[0].minute>0&&o.unshift({minute:0,setpoint:o.at(-1).setpoint});const a=[];o.forEach((r,i)=>{const l=i+1<o.length?o[i+1].minute:Jt;if(l<=r.minute)return;const c=a.at(-1);c&&c.setpoint===r.setpoint?c.end=l:a.push({start:r.minute,end:l,setpoint:r.setpoint})});const s=t.high-t.low;return a.map(r=>({...r,warm:r.setpoint>n,level:s>0?Math.min(1,Math.max(0,(r.setpoint-t.low)/s)):1}))}function Hc(e,t){const n=[];let o=0;for(const a of e){if(!a.warm)continue;const s=Math.min(Math.max(a.start,o),Jt-t);s<o||s>=a.end||(n.push({minute:s,text:ts(a.setpoint)}),o=s+t)}return n}const Bc=(e,t)=>t<e.minute?(e.weekday+1)%7:e.weekday;function Fc(e){if(!e)return[];const t=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"],["night","Night"]],n=new Map;for(const[o,a]of t){const s=e[o];typeof s=="number"&&n.set(s,[...n.get(s)??[],a])}return[...n.entries()].sort((o,a)=>a[0]-o[0]).map(([o,a])=>({label:ns(a.map((s,r)=>r?s.toLowerCase():s)),setpoint:o}))}const jc=e=>`Usually ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`,Wc=(e,t=dn)=>Math.round(e/t)*t,io=e=>Number(e.slice(0,2))*60+Number(e.slice(3,5)),Ms=(e,t)=>Math.min(t.max,Math.max(t.min,Wc(e)));function Uc(e,t,n){const o=e[t];return n==="start"?{min:t>0?e[t-1].end:0,max:o.end-dn}:{min:o.start+dn,max:t+1<e.length?e[t+1].start:Jt}}function Vc(e,t){const n=a=>JSON.stringify([a.transitions,a.periods??[]]),o=n(e.days[t]);return e.days.flatMap((a,s)=>n(a)===o?[s]:[])}function Kc(e){if(e.length===7)return"Every day";const t=a=>Ln[a].slice(0,3),n=[];for(const a of[...e].sort((s,r)=>s-r)){const s=n.at(-1);s&&a===s[1]+1?s[1]=a:n.push([a,a])}const o=[];for(const[a,s]of n)if(s-a>=2)o.push(`${t(a)} to ${t(s)}`);else for(let r=a;r<=s;r++)o.push(t(r));return ns(o)}function Jc(e,t=["saturday","sunday"]){const n=[...new Set(e)].sort((s,r)=>s-r),o=Ln.flatMap((s,r)=>t.includes(s.toLowerCase())?[r]:[]),a=s=>s.length===n.length&&s.every((r,i)=>r===n[i]);return n.length===7?"daily":a(o)?"weekend":a([0,1,2,3,4,5,6].filter(s=>!o.includes(s)))?"weekdays":n.length===1?Ta[n[0]]:n.map(s=>Ta[s])}function Yc(e,t,n){if(n===t)return null;const o=n>t;return e==="end"?o?{keep:"warm",from:t,to:n}:{keep:"cold",from:n,to:t}:o?{keep:"cold",from:t,to:n}:{keep:"warm",from:n,to:t}}function Os(e,t){const n=i=>JSON.stringify([i.days].flat());let o=io(t.from),a=io(t.to);const s=[];let r=!1;for(const i of e??[]){if(n(i)!==n(t)){s.push(i);continue}const l=io(i.from),c=io(i.to);if(i.keep===t.keep){if(l<=a&&c>=o){o=Math.min(o,l),a=Math.max(a,c);continue}s.push(i)}else l<a&&c>o?(l===o&&c===a&&(r=!0),l<o&&s.push({...i,to:st(o)}),c>a&&s.push({...i,from:st(a)})):s.push(i)}return r?s:[...s,{...t,from:st(o),to:st(a)}]}function ia(e,t,n){const o=JSON.parse(JSON.stringify(e)),a=o?.rooms?.[t];if(!a)throw new Error(`${t} is not in the household`);const s=n(a.adjust??[]);return s.length?a.adjust=s:delete a.adjust,o}const Gc=(e,t,n,o)=>`${e}, ${t}, warm ${n==="end"?"until":"from"} ${st(o)}`,Xc=(e,t,n,o)=>`${e}: warm ${t==="end"?"until":"from"} ${st(o)}, not ${st(n)}.`,Qc=e=>`Without adjustments: ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`;function Ns(e){return e?.saved_at?e.source==="house_file"?`Saving copies the household, with this change, to ${e.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`:"":"In the demo, changes last until you close the page."}const Zc=[["daily","Every day"],["weekdays","Weekdays"],["weekend","Weekend"],...Ln.map((e,t)=>[Ta[t],e])],ce=(e,t,n)=>{const o=document.createElement(e);return t&&(o.className=t),n!=null&&(o.textContent=n),o};function ed(e,t,n,o){const a=ce("li","week-day");a.append(ce("span","week-dname",Ln[t].slice(0,3)));const s=ce("div","week-lane"),r=ce("div","week-labels");r.setAttribute("aria-hidden","true");const i=ce("div","week-track");i.setAttribute("role","img"),a.day={name:Ln[t],text:e.text};for(const l of n){if(!l.warm)continue;const c=ce("i","week-block");c.style.left=dt(l.start),c.style.width=dt(l.end-l.start),c.style.setProperty("--level",l.level.toFixed(3)),c.title=`${ts(l.setpoint)} ${st(l.start)} to ${st(l.end)}`,c.dataset.start=String(l.start),c.dataset.end=String(l.end),i.append(c)}for(const l of e.adjusted??[]){const c=ce("i","week-adj");c.dataset.keep=l.keep,c.style.left=dt(l.start),c.style.width=dt(l.end-l.start),i.append(c)}return s.append(r,i),a.append(s),a.segments=n,Zr(a,o),a}function Zr(e,t){t?e.setAttribute("aria-current","date"):e.removeAttribute("aria-current");const n=`${e.day.name}${t?", today":""}: ${e.day.text}`;e.querySelector(".week-track").setAttribute("aria-label",n)}function zs(e){const n=e.querySelector(".week-track")?.getBoundingClientRect().width??0;if(!n)return;const o=Math.ceil(zc/n*Jt);if(e.dataset.labelMin!==String(o)){e.dataset.labelMin=String(o);for(const a of e.querySelectorAll(".week-day")){const s=a.querySelector(".week-labels");s.textContent="";for(const r of Hc(a.segments,o)){const i=ce("span",null,r.text);i.style.left=dt(r.minute),s.append(i)}}}}function td(e,t,n){const o=ce("article","card week");o.dataset.away=String(!!e.away);const a=ce("header");a.append(ce("h3","name",e.name)),a.append(ce("span","badge",e.source==="household"?"Household":"Hand-written")),o.append(a),e.away&&(o.append(ce("p","week-away",e.away.text)),o.append(ce("p","week-usual",jc(e.away.usual))));const s=qc(e),r=ce("ol","week-days");r.setAttribute("aria-label",`${e.name}, Monday to Sunday`),e.days.forEach((d,u)=>r.append(ed(d,u,Ic(d.transitions,t,s),u===n))),o.append(r);const i=ce("div","week-ticks");i.setAttribute("aria-hidden","true");for(const d of Pc)i.append(ce("span",null,d));o.append(i);const l=ce("dl","week-summary");for(const d of e.summary){const u=ce("div");u.append(ce("dt",null,d.days),ce("dd",null,d.text)),l.append(u)}o.append(l);for(const d of e.notes)o.append(ce("p","flag",d));e.people.length&&o.append(ce("p","week-meta",`Depends on ${ns(e.people.map(d=>d.name))}.`));const c=ce("i","week-now");return c.setAttribute("aria-hidden","true"),o.append(c),o}const sn=(e,t,n="button")=>{const o=ce("button",e,t);return o.type=n,o},la=e=>{const t=String(e??"").trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function nd(e,t,n){const{editor:o}=n,a=[...e.querySelectorAll(".week-day")],s=[];let r=null,i=null,l=!1,c=0,d=null;const u=ce("div","week-edit"),g=ce("div","week-pending");g.hidden=!0;const p=ce("p","week-pending-what");p.setAttribute("aria-live","polite");const f=ce("p","week-pending-then");f.setAttribute("aria-live","polite");const x=ce("p","week-source"),h=ce("p","week-error");h.setAttribute("role","alert"),h.hidden=!0;const b=sn("btn btn-primary","Save"),w=sn("btn","Cancel"),k=ce("div","week-buttons");k.append(b,w),g.append(p,f,x,h,k),u.append(g);function R(z,ne){if(z.value=ne,z.style.left=dt(ne),z.getAttribute("role")!=="slider")return;const{label:te,edge:ue}=z.edit;z.setAttribute("aria-valuenow",String(ne)),z.setAttribute("aria-valuetext",st(ne)),z.setAttribute("aria-label",Gc(t.name,te,ue,ne))}t.days.forEach((z,ne)=>{const te=z.periods??[];if(!te.length||t.away)return;const ue=Vc(t,ne),ye=Kc(ue),Ie=a[ne].querySelector(".week-track");te.forEach((Se,De)=>{for(const qe of["start","end"]){const Me=ce("span","week-edge");Me.dataset.edge=qe,Me.dataset.key=`${ue[0]}:${De}:${qe}`,Me.edit={row:ne,group:ue,label:ye,periods:te,index:De,edge:qe,was:Se[qe],bounds:Uc(te,De,qe)},ue[0]===ne?(Me.tabIndex=0,Me.setAttribute("role","slider"),Me.setAttribute("aria-valuemin",String(Me.edit.bounds.min)),Me.setAttribute("aria-valuemax",String(Me.edit.bounds.max))):Me.setAttribute("aria-hidden","true"),R(Me,Se[qe]),V(Me),Ie.append(Me),s.push(Me)}})});const T=z=>s.find(ne=>ne.dataset.key===z&&ne.tabIndex===0);function D(z,ne){const{group:te,periods:ue,index:ye,edge:Ie,row:Se}=z.edit,De=ue[ye],[qe,Me]=Ie==="start"?[ne,De.end]:[De.start,ne];for(const Tt of s)Tt.dataset.key===z.dataset.key&&R(Tt,ne);for(const Tt of te){const $n=a[Tt].querySelector(`.week-block[data-start="${De.start}"][data-end="${De.end}"]`);$n&&($n.style.left=dt(qe),$n.style.width=dt(Me-qe)),a[Tt].dataset.editing="true"}let ge=e.querySelector(".week-drag-label");ge||(ge=ce("span","week-drag-label"),ge.setAttribute("aria-hidden","true"));const lt=a[Se].querySelector(".week-labels");ge.parentElement!==lt&&lt.append(ge),ge.textContent=st(ne);const nn=Number(e.dataset.labelMin||120)*1.4;ge.style.left=dt(Math.min(Jt-nn,Math.max(0,ne-nn/2)))}function Z(){for(const z of s)R(z,z.edit.was);for(const z of e.querySelectorAll(".week-block"))z.style.left=dt(Number(z.dataset.start)),z.style.width=dt(Number(z.dataset.end)-Number(z.dataset.start));for(const z of a)delete z.dataset.editing;e.querySelector(".week-drag-label")?.remove()}function V(z){z.addEventListener("pointerdown",te=>{i||l||te.pointerType==="mouse"&&te.button!==0||(r&&r.h.dataset.key!==z.dataset.key&&P(),te.preventDefault(),z.setPointerCapture?.(te.pointerId),i={id:te.pointerId,h:z,rect:z.parentElement.getBoundingClientRect()},e.dataset.dragging="true")}),z.addEventListener("pointermove",te=>{if(!i||te.pointerId!==i.id||!i.rect.width)return;const ue=Ms((te.clientX-i.rect.left)/i.rect.width*Jt,z.edit.bounds);ue!==z.value&&D(z,ue)});const ne=(te,ue)=>{!i||te.pointerId!==i.id||(i=null,delete e.dataset.dragging,ue?ae(z,z.value,!1):r?D(r.h,r.now):P())};z.addEventListener("pointerup",te=>ne(te,!0)),z.addEventListener("pointercancel",te=>ne(te,!1)),z.addEventListener("keydown",te=>{const ue={ArrowLeft:-dn,ArrowDown:-dn,ArrowRight:dn,ArrowUp:dn,PageDown:-60,PageUp:60};let ye;if(te.key in ue)ye=Ms(z.value+ue[te.key],z.edit.bounds);else if(te.key==="Home")ye=z.edit.bounds.min;else if(te.key==="End")ye=z.edit.bounds.max;else if(te.key==="Enter"){te.preventDefault(),r&&m();return}else if(te.key==="Escape"){r&&(te.preventDefault(),P());return}else return;te.preventDefault(),r&&r.h.dataset.key!==z.dataset.key&&P(),D(z,ye),ae(z,ye,!0)})}function ae(z,ne,te){if(ne===z.edit.was){P();return}const{label:ue,edge:ye,was:Ie}=z.edit,Se=r?.h.dataset.key===z.dataset.key;r={h:z,now:ne,keyboard:te,info:Se?r.info:null},g.hidden=!1,p.textContent=Xc(ue,ye,Ie,ne),f.textContent="Checking…",h.hidden=!0,b.disabled=!0,clearTimeout(d),d=setTimeout(q,te?400:0)}async function C(z){z.info??=await o.household();const{edge:ne,was:te,group:ue}=z.h.edit,ye=Yc(ne,te,z.now),Ie={days:Jc(ue,n.weekend),keep:ye.keep,from:st(ye.from),to:st(ye.to)};return ia(z.info.household,t.id,Se=>Os(Se,Ie))}function K(z){f.textContent="",h.textContent=z,h.hidden=!1,b.disabled=!0}async function q(){const z=++c,ne=r;if(!ne)return;let te;try{te=await o.preview(await C(ne))}catch{z===c&&K("Couldn't check the change. Check the connection and try again.");return}if(z!==c||ne!==r)return;if(x.textContent=Ns(ne.info),x.hidden=!x.textContent,te.errors?.length){K(la(te.errors[0].message));return}const ue=te.rooms.find(Se=>Se.id===t.id),ye=ue?ue.summary.map(Se=>`${Se.days}: ${Se.text}`).join("; "):"",Ie=(ue?.notes??[]).filter(Se=>!t.notes.includes(Se));f.textContent=[ye&&`${ye}.`,...Ie].filter(Boolean).join(" "),b.disabled=!1}async function m(){const z=r;if(!z)return;clearTimeout(d);const ne=++c;b.disabled=!0,f.textContent="Saving…",h.hidden=!0;let te=null;try{te=await o.save(await C(z))}catch{}if(ne!==c||z!==r)return;if(te?.status===200){r=null,n.saved(`Saved. ${t.name} follows its new week.${F(z.info)}`,z.keyboard?z.h.dataset.key:null);return}const ue=te?.status===400?te.body?.errors?.[0]?.message:null;K(ue?`Not saved. ${la(ue)}`:"Not saved. Check the connection and try again."),b.disabled=!1}function P(){clearTimeout(d),c++;const z=r?.h.dataset.key;return r=null,Z(),g.hidden=!0,z}b.addEventListener("click",m),w.addEventListener("click",()=>T(P())?.focus()),g.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),T(P())?.focus())});const F=z=>z?.source==="house_file"&&z.saved_at?` The household is now kept in ${z.saved_at}; the house file isn't changed.`:"",N=ce("p","week-error");N.setAttribute("role","alert"),N.hidden=!0;async function W(z,ne){N.hidden=!0;let te=null,ue=null;try{te=await o.household(),ue=await o.save(ia(te.household,t.id,z))}catch{}if(ue?.status===200){n.saved(`${ne}${F(te)}`,null);return}N.textContent="Not saved. Check the connection and try again.",N.hidden=!1}const U=ce("div","week-adjust");if(t.adjust?.length){U.append(ce("h4",null,"Adjustments"));const z=ce("ul");t.adjust.forEach((ne,te)=>{const ue=ce("li"),ye=sn("link","Remove");ye.setAttribute("aria-label",`Remove: ${ne.text}`),ye.addEventListener("click",()=>W(Ie=>Ie.filter((Se,De)=>De!==te),`Removed. ${t.name} follows its new week.`)),ue.append(ce("span",null,ne.text),ye),z.append(ue)}),U.append(z),t.routine&&U.append(ce("p","week-usual",Qc(t.routine)))}const ee=ce("div","week-actions"),se=sn("link","Adjust");if(se.setAttribute("aria-expanded","false"),se.setAttribute("aria-label",`Adjust ${t.name}`),ee.append(se),t.adjust?.length){const z=sn("link","Reset to routine");z.setAttribute("aria-label",`Reset ${t.name} to its routine`),z.addEventListener("click",()=>W(()=>[],`${t.name} is back to its routine.`)),ee.append(z)}U.append(ee,N);const de=ce("form","week-form");de.hidden=!0,de.noValidate=!0,de.id=`week-form-${t.id}`,se.setAttribute("aria-controls",de.id);const pe=(z,ne,te)=>{te.name=z,te.id=`${de.id}-${z}`;const ue=ce("div","week-field"),ye=ce("label",null,ne);return ye.htmlFor=te.id,ue.append(ye,te),ue},O=z=>{const ne=ce("select");for(const[te,ue]of z){const ye=ce("option",null,ue);ye.value=te,ne.append(ye)}return ne},v=z=>{const ne=ce("input","time");return Object.assign(ne,{type:"text",inputMode:"numeric",autocomplete:"off",spellcheck:!1,maxLength:5,placeholder:z}),ne.addEventListener("blur",()=>{const te=o.time?.(ne.value,{end:ne.name==="to"});te&&(ne.value=te)}),ne},S=O(Zc),M=O([["warm","Warm"],["cold","Cold"]]),j=v("22:30"),Q=v("23:00"),L=ce("div","week-fields");L.append(pe("days","Days",S),pe("keep","Keep it",M),pe("from","From",j),pe("to","To",Q));const I=ce("p","week-source");I.hidden=!0;const J=ce("p","week-error");J.setAttribute("role","alert"),J.hidden=!0;const oe=ce("div","week-buttons"),ve=sn("btn btn-primary","Save","submit"),Le=sn("btn","Cancel");oe.append(ve,Le),de.append(L,I,J,oe);const Ke={days:S,keep:M,from:j,to:Q};function Te(z,ne){for(const te of Object.values(Ke))te.removeAttribute("aria-invalid");J.hidden=!ne,J.textContent=ne??"",z&&Ke[z]&&(Ke[z].setAttribute("aria-invalid","true"),Ke[z].setAttribute("aria-describedby",J.id||=`${de.id}-error`))}function tn(){de.hidden=!0,l=!1,se.setAttribute("aria-expanded","false"),Te(null,null),se.focus()}return se.addEventListener("click",async()=>{if(l){tn();return}r&&P(),l=!0,de.hidden=!1,se.setAttribute("aria-expanded","true"),S.focus();try{I.textContent=Ns(await o.household())}catch{I.textContent=""}I.hidden=!I.textContent}),Le.addEventListener("click",tn),de.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),tn())}),de.addEventListener("submit",async z=>{z.preventDefault();const ne=(ge,lt)=>o.time?o.time(ge,lt):ge.trim()||null,te=ne(j.value),ue=ne(Q.value,{end:!0});if(!te){Te("from","Enter a time such as 22:30."),j.focus();return}if(!ue){Te("to","Enter a time such as 23:00."),Q.focus();return}Te(null,null),ve.disabled=!0;const ye={days:S.value,keep:M.value,from:te,to:ue};let Ie=null,Se=null,De=0;try{Ie=await o.household();const ge=ia(Ie.household,t.id,lt=>{const nn=Os(lt,ye);return De=nn.length-1,nn});Se=await o.save(ge)}catch{}if(ve.disabled=!1,Se?.status===200){l=!1,n.saved(`Saved. ${t.name} follows its new week.${F(Ie)}`,null);return}const qe=Se?.status===400?Se.body?.errors?.[0]:null;if(!qe){Te(null,"Not saved. Check the connection and try again.");return}const Me=qe.path.match(new RegExp(`\\.adjust\\[${De}\\]\\.(\\w+)$`));Te(Me?.[1]??null,`Not saved. ${la(qe.message)}`),Ke[Me?.[1]]?.focus()}),U.append(de),u.append(U),e.insertBefore(u,e.querySelector(".week-meta")??e.querySelector(".week-now")),{busy:()=>!!(r||i||l),focus(z){(z&&T(z)||se).focus()}}}function ei({list:e,legendEl:t,frostEl:n,hintEl:o=null}){const a=new Map;let s=null,r={low:0,high:0},i=null,l=["saturday","sunday"],c=null;const d=typeof ResizeObserver=="function"?new ResizeObserver(p=>{for(const f of p)zs(f.target)}):null;function u(p){if(!s)return;const f=Bc(s,p);for(const{card:x}of a.values()){const h=x.querySelector(".week-now"),b=x.querySelectorAll(".week-day");b.forEach((k,R)=>{k.hasAttribute("aria-current")!==(R===f)&&Zr(k,R===f)});const w=b[f]?.querySelector(".week-track");w&&(h.parentElement!==w&&w.append(h),h.style.left=dt(p))}}function g(p){t.textContent="";const f=Fc(p.levels);for(const h of f){const b=ce("span","week-key"),w=ce("i","week-swatch");w.setAttribute("aria-hidden","true"),w.dataset.base=String(h.setpoint<=r.low),w.style.setProperty("--level",(r.high>r.low?(h.setpoint-r.low)/(r.high-r.low):1).toFixed(3)),b.append(w,`${h.label} ${ts(h.setpoint)}`),t.append(b)}const x=p.rooms.some(h=>h.days.some(b=>b.adjusted?.length));if(x){const h=ce("span","week-key"),b=ce("i","week-adj-swatch");b.setAttribute("aria-hidden","true"),h.append(b,"Adjusted"),t.append(h)}t.hidden=!f.length&&!x}return{update(p){s=p.now,l=p.weekend_days??l,r=Dc(p.rooms,p.levels),n.hidden=!p.frost,g(p);const f=new Set;let x=!1;p.rooms.forEach((h,b)=>{f.add(h.id);const w=!!i&&h.source==="household";x||=w&&!h.away&&h.days.some(Z=>Z.periods?.length);const k=JSON.stringify([h,r,w]),R=a.get(h.id);if(R?.key===k&&c?.room!==h.id||R?.edit?.busy())return;const T=td(h,r,s.weekday);R?(d?.unobserve(R.card),R.card.replaceWith(T)):e.insertBefore(T,e.children[b]??null);const D={card:T,key:k,edit:null};w&&(D.edit=nd(T,h,{editor:i,weekend:l,saved(Z,V){c={room:h.id,key:V},i.saved(Z)}})),a.set(h.id,D),d?.observe(T),zs(T),c?.room===h.id&&(D.edit?.focus(c.key),c=null)});for(const[h,{card:b}]of a)f.has(h)||(d?.unobserve(b),b.remove(),a.delete(h));o&&(o.hidden=!x),u(s.minute)},tick(p){u(p)},setEditor(p){i=p}}}const Aa="radiate.householdDraft",Be=e=>document.getElementById(e);function Y(e,t={},...n){const o=document.createElement(e);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="text"?o.textContent=s:a==="class"?o.className=s:a.startsWith("on")?o.addEventListener(a.slice(2),s):a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n.flat())a!=null&&a!==!1&&o.append(a);return o}const ke=e=>`f-${e.replace(/[^a-z0-9]+/gi,"-")}`,Ps=e=>{const t=String(e).trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function od(){try{return JSON.parse(localStorage.getItem(Aa)||"null")}catch{return null}}function Ds(e){try{e?localStorage.setItem(Aa,JSON.stringify(e)):localStorage.removeItem(Aa)}catch{}}function ad({transport:e,onSaved:t,onOpen:n,onClose:o}){const a=Be("setup"),s=Be("setup-body"),r=Be("setup-summary"),i=Be("setup-back"),l=Be("setup-next"),c=Be("setup-progress"),d=Be("setup-steps"),u=Be("setup-source"),g=Be("setup-resume");let p=null,f=null,x="",h=0,b=0,w=0,k=[],R=[],T=!1,D=!1;const Z=new Set,V=new Set;let ae=null,C=null;const K=()=>{clearTimeout(C),C=setTimeout(()=>Ds({v:1,base:x,step:h,person:b,reached:w,draft:f}),300)},q=()=>{clearTimeout(C),Ds(null)};function m($,E,A,H="",G=null){const re=A.matches("input, select")?A:A.querySelector("input, select");re.id||=ke($);const ie=H?`${re.id}-help`:null;return ie&&re.setAttribute("aria-describedby",ie),Y("div",{class:"field","data-path":$},Y("label",{for:re.id,text:E}),A,H?Y("p",{class:"field-help",id:ie,text:H}):null,G)}function P($,E,{end:A=!1,onChange:H}){const G=Y("input",{id:ke($),type:"text",inputmode:"numeric",autocomplete:"off",spellcheck:"false",maxlength:"5",placeholder:A?"22:30":"07:30",class:"time",value:E});return G.addEventListener("input",()=>{H(G.value),K()}),G.addEventListener("blur",()=>{const re=cn(G.value,{end:A});re&&re!==G.value&&(G.value=re,H(re),K())}),G}function F($,E,{limit:A,step:H=1,placeholder:G="",onChange:re}){const ie=Y("input",{id:ke($),type:"number",inputmode:H<1?"decimal":"numeric",min:String(A.off===0?0:A.min),max:String(A.max),step:String(H),placeholder:G===""?"":String(G),class:"num",value:E==null?"":String(E)});return ie.addEventListener("input",()=>{const me=ie.value.trim();re(me===""?null:Number.isFinite(Number(me))?Number(me):me),K()}),ie}const N=($,E)=>Y("span",{class:"unit"},$,Y("span",{"aria-hidden":"true",text:E}));function W($,E,A,H){const G=Y("select",{id:ke($)},A.map(([re,ie])=>Y("option",{value:re,text:ie})));return G.value=E,G.addEventListener("change",()=>{H(G.value),K()}),G}function U($,E,A,H,G=""){const re=Y("input",{type:"checkbox",id:$,checked:A});return re.addEventListener("change",()=>{H(re.checked),K()}),Y("div",{class:"check"},re,Y("label",{for:$,text:E}),G?Y("p",{class:"field-help",text:G}):null)}function ee($,E,A){const H=new Set(E);return Y("fieldset",{class:"days","data-path":$},Y("legend",{class:"sr-only",text:"Days"}),ko.map(G=>{const re=`${ke($)}-${G}`,ie=Y("input",{type:"checkbox",id:re,checked:H.has(G)});return ie.addEventListener("change",()=>{ie.checked?H.add(G):H.delete(G),A(ko.filter(me=>H.has(me))),K()}),Y("span",{class:"day"},ie,Y("label",{for:re,text:G[0].toUpperCase()+G.slice(1,3)}))}))}function se($,E,...A){const H=Y("details",{class:"setup-adv",open:Z.has($)},Y("summary",{text:E}),Y("div",{class:"setup-adv-body"},...A));return H.addEventListener("toggle",()=>{H.open?Z.add($):Z.delete($)}),H}const de=$=>p.limits[$],pe=($,E)=>p.defaults[$][E],O=($,E=null)=>`Default ${Vn($,E)}.`;function v($,E){return[Y("h3",{class:"setup-title",id:"setup-step-h",tabindex:"-1",text:$}),E?Y("p",{class:"setup-intro",text:E}):null]}function S($,E,A){const H=Ea(p);let G;return H?G=W(`${E}.ha_person`,$.ha_person??"",xc(H,$.ha_person),re=>{$.ha_person=re||null,V.add($.id)}):(G=Y("input",{id:ke(`${E}.ha_person`),type:"text",class:"entity",value:$.ha_person??"",placeholder:"person.sam",autocomplete:"off",autocapitalize:"none",spellcheck:"false",maxlength:"107"}),G.addEventListener("input",()=>{$.ha_person=G.value.trim()||null,K()})),G.setAttribute("aria-describedby",A),Y("div",{class:"field","data-path":`${E}.ha_person`},Y("label",{for:G.id,text:"Home Assistant person"}),G)}function M(){const $=Y("div",{class:"setup-people"}),E=Ea(p),A=`${ke("household.people")}-ha-help`,H=()=>E?`${_s(f.away.presence_delay_min)} A link set in the integration's options takes priority.`:`Optional. Type the entity ID, such as person.sam. ${_s(f.away.presence_delay_min)}`,G=Y("p",{class:"field-help",id:A,text:H()});f.people.forEach((he,we)=>{const _e=`household.people.${he.id}`,Oe=Y("input",{id:ke(`${_e}.name`),type:"text",value:he.name,autocomplete:"off",maxlength:"40",required:!0});Oe.addEventListener("input",()=>{he.name=Oe.value,K()}),Oe.addEventListener("change",()=>{if(!E||he.ha_person||V.has(he.id))return;const yt=f.people.map(on=>on.ha_person).filter(Boolean),xn=Qr(he.name,E,yt);if(!xn)return;he.ha_person=xn;const oo=document.getElementById(ke(`${_e}.ha_person`));oo&&(oo.value=xn),K()});const Ze=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${he.name||`person ${we+1}`}`,disabled:f.people.length<2,onclick:()=>{Sc(f,he.id),b=Math.min(b,f.people.length-1),ne(`${ke("household.people")}-add`),K()}});$.append(Y("div",{class:"setup-person",role:"group","aria-label":`Person ${we+1}`,"data-path":_e},m(`${_e}.name`,`Person ${we+1}`,Oe),S(he,_e,A),Ze))});const re=Y("button",{type:"button",class:"btn",id:`${ke("household.people")}-add`,text:"Add a person",onclick:()=>{const he=Xr(f);ne(ke(`household.people.${he}.name`),!0),K()}}),ie=f.away,me=de("away.presence_stale_after_min").off;return[...v("Who lives here?","Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),Y("div",{class:"field-group","data-path":"household.people"},$,G,re),se("away","Advanced: away and presence",m("household.away.presence_delay_min","Counts as away after",N(F("household.away.presence_delay_min",ie.presence_delay_min,{limit:de("away.presence_delay_min"),onChange:he=>{ie.presence_delay_min=he,typeof he=="number"&&(G.textContent=H())}}),"min"),`How long Home Assistant must say someone is out before Radiate counts them as away. ${O(pe("away","presence_delay_min"))}`),m("household.away.presence_stale_after_min","Presence goes stale after",N(F("household.away.presence_stale_after_min",ie.presence_stale_after_min,{limit:de("away.presence_stale_after_min"),onChange:he=>ie.presence_stale_after_min=he}),"min"),`If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${O(pe("away","presence_stale_after_min"),me)}`),m("household.away.return_warmup_min","Warm up for a return up to",N(F("household.away.return_warmup_min",ie.return_warmup_min,{limit:de("away.return_warmup_min"),onChange:he=>ie.return_warmup_min=he}),"min"),`How early Radiate may start warming rooms for someone due back. ${O(pe("away","return_warmup_min"))}`),m("household.away.presence_evidence_max_age_min","Trust not home for",N(F("household.away.presence_evidence_max_age_min",ie.presence_evidence_max_age_min,{limit:de("away.presence_evidence_max_age_min"),onChange:he=>ie.presence_evidence_max_age_min=he}),"min"),`If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${O(pe("away","presence_evidence_max_age_min"))}`),m("household.away.presence_weak_source_delay_min","Wifi or Bluetooth trackers count as away after",N(F("household.away.presence_weak_source_delay_min",ie.presence_weak_source_delay_min,{limit:de("away.presence_weak_source_delay_min"),onChange:he=>ie.presence_weak_source_delay_min=he}),"min"),`A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${O(pe("away","presence_weak_source_delay_min"))}`),m("household.away.everyone_away","When everyone has set an away until",W("household.away.everyone_away",ie.everyone_away,[["frost","Hold every room at frost protection"],["unused","Keep rooms at their unused temperature"]],he=>ie.everyone_away=he),"Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."))]}function j($,E,A){const H=$[E],G=`household.people.${$.id}.${E}`,re=$.name||"this person",ie=Y("div",{class:"periods"}),me=po(G,H.periods);H.periods.forEach((we,_e)=>{const Oe=me[_e],Ze=W(`${Oe}.type`,we.type,[["out","Out of the house"],["work","Working from home"]],on=>{we.type=on,ne(ke(`${po(G,H.periods)[_e]}.type`))}),yt=P(`${Oe}.from`,we.from,{onChange:on=>we.from=on}),xn=P(`${Oe}.to`,we.to,{end:!0,onChange:on=>we.to=on}),oo=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${we.type==="work"?"working":"out"} ${we.from} to ${we.to}`,onclick:()=>{H.periods.splice(_e,1),ne(`${ke(G)}-add-out`),K()}});ie.append(Y("div",{class:"period",role:"group","aria-label":`${A}, time ${_e+1}`,"data-path":Oe},Y("div",{class:"field"},Y("label",{for:Ze.id,text:"What"}),Ze),Y("div",{class:"field"},Y("label",{for:yt.id,text:we.type==="work"?"Starts":"Leaves"}),yt),Y("div",{class:"field"},Y("label",{for:xn.id,text:we.type==="work"?"Finishes":"Back"}),xn),oo))}),H.periods.length||ie.append(Y("p",{class:"field-help",text:`${re} is at home all day.`}));const he=(we,_e,Oe)=>()=>{H.periods.push({type:we,from:_e,to:Oe});const Ze=po(G,H.periods).at(-1);ne(ke(`${Ze}.from`)),K()};return Y("fieldset",{class:"routine","data-path":G},Y("legend",{text:A}),m(`${G}.up`,`When does ${re} get up?`,P(`${G}.up`,H.up,{onChange:we=>H.up=we})),Y("div",{class:"field-group"},Y("p",{class:"field-label",text:`Is ${re} out or working from home during the day?`}),ie,Y("div",{class:"row"},Y("button",{type:"button",class:"btn",id:`${ke(G)}-add-out`,text:"Add time out",onclick:he("out","08:30","17:30")}),Y("button",{type:"button",class:"btn",id:`${ke(G)}-add-work`,text:"Add time working from home",onclick:he("work","09:00","17:00")}))),m(`${G}.bed`,`When does ${re} go to bed?`,P(`${G}.bed`,H.bed,{end:!0,onChange:we=>H.bed=we})))}function Q(){const $=f.people[b],E=$.name||`Person ${b+1}`,A=`household.people.${$.id}`,H=[...v(`${E}'s routine`,f.people.length>1?`Person ${b+1} of ${f.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.`:"Usual days are enough: Radiate handles one-off changes with away and overrides."),j($,"weekdays",$.weekendSame?"Every day":"Weekdays"),U(`${ke(A)}-weekend`,"Weekends are different",!$.weekendSame,ie=>{$.weekendSame=!ie,ie&&JSON.stringify($.weekend)===JSON.stringify($.weekdays)&&($.weekend=JSON.parse(JSON.stringify(Gr.weekend))),ne(`${ke(A)}-weekend`)})];if($.weekendSame||H.push(j($,"weekend","Weekends")),Ec($)){const ie=f.rooms.map(me=>[me.id,me.name]);H.push(m(`${A}.office`,`Where does ${E} work?`,W(`${A}.office`,_c(f,$.id)??"",[["","No particular room"],...ie],me=>Cc(f,$.id,me||null)),"That room is warm while they work. Shared rooms aren't heated while someone works."))}const G=f.timing,re=$.weekend_days==null;return H.push(se(`person-${$.id}`,`Advanced: timing for ${E}`,m(`${A}.getting_up_min`,"Getting ready",N(F(`${A}.getting_up_min`,$.getting_up_min,{limit:de("timing.getting_up_min"),placeholder:G.getting_up_min,onChange:ie=>$.getting_up_min=ie}),"min"),`How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${Vn(G.getting_up_min)}.`),m(`${A}.bedtime_min`,"Winding down",N(F(`${A}.bedtime_min`,$.bedtime_min,{limit:de("timing.bedtime_min"),placeholder:G.bedtime_min,onChange:ie=>$.bedtime_min=ie}),"min"),`How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${Vn(G.bedtime_min)}.`),Y("div",{class:"field","data-path":`${A}.weekend_days`},U(`${ke(A)}-own-weekend`,`Same weekend days as the house (${Oc(f.weekend_days)})`,re,ie=>{$.weekend_days=ie?null:[...f.weekend_days],ne(`${ke(A)}-own-weekend`)},"Untick for someone who works weekends."),re?null:ee(`${A}.weekend_days`,$.weekend_days,ie=>$.weekend_days=ie)))),H}function L($){const E=f.temperatures;return{in_use:`Kept at ${E.in_use}° while it's used.`,occasional:`Kept at ${E.occasional}° while it's used, for a bathroom or guest room.`,unused:`Kept at ${E.unused}° by day and ${E.night}° at night.`,own:"Follows its schedule from the house file. Radiate doesn't change it."}[$]}function I(){const $=Y("div",{class:"setup-rooms"}),E=vc;for(const A of f.rooms){const H=`household.rooms.${A.id}`,G=A.schedule?[...E,["own","Its own schedule"]]:E,re=W(`${H}.use`,A.own?"own":A.use,G,he=>{A.own=he==="own",A.own||(A.use=he),ne(ke(`${H}.use`))}),ie=`${ke(H)}-h`,me=Y("div",{class:"card setup-room",role:"group","aria-labelledby":ie,"data-path":H},Y("h4",{id:ie,text:A.name}));if(me.append(m(`${H}.use`,"How is it used?",re,L(A.own?"own":A.use))),!A.own){if(me.append(U(`${ke(H)}-weekend`,"Different at weekends",A.weekendDifferent,we=>{A.weekendDifferent=we,we||(A.weekendUse=A.use),ne(`${ke(H)}-weekend`)})),A.weekendDifferent&&me.append(m(`${H}.use.weekend`,"At weekends",W(`${H}.use.weekend`,A.weekendUse,E,we=>{A.weekendUse=we}))),!(A.use==="unused"&&(!A.weekendDifferent||A.weekendUse==="unused"))){const we=W(`${H}.kind`,A.kind,Yr.map(([_e,Oe])=>[_e,Oe]),_e=>{A.kind=_e,ne(ke(`${H}.kind`))});me.append(m(`${H}.kind`,"What kind of room?",we,Lc(A.kind))),f.people.length>1&&me.append(J(A,H))}me.append(oe(A,H))}$.append(me)}return[...v("How is each room used?","Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),$]}function J($,E){const A=$.people==null,H=Y("fieldset",{class:"who","data-path":`${E}.people`},Y("legend",{class:"field-label",text:"Who uses it?"}));if(H.append(U(`${ke(E)}-everyone`,"Everyone",A,G=>{$.people=G?null:f.people.map(re=>re.id),ne(`${ke(E)}-everyone`)})),!A)for(const G of f.people)H.append(U(`${ke(E)}-${G.id}`,G.name||G.id,$.people.includes(G.id),re=>{const ie=new Set($.people);re?ie.add(G.id):ie.delete(G.id),$.people=f.people.map(me=>me.id).filter(me=>ie.has(me))}));return H}function oe($,E){const A=f.temperatures,H=de("temperatures"),G=(me,he)=>Y("p",{class:"field-note","aria-live":"polite",text:ro($[me]??he,p.damp_below_c)}),re=(me,he,we,_e)=>{const Oe=me==="temperature"?null:G(me,we),Ze=F(`${E}.${me}`,$[me],{limit:H,step:.5,placeholder:we,onChange:yt=>{$[me]=yt,Oe&&(Oe.textContent=ro(yt??we,p.damp_below_c))}});return m(`${E}.${me}`,he,N(Ze,"°C"),_e,Oe)},ie=$.use==="unused"?$.weekendUse:$.use;return se(`room-${$.id}`,`Advanced: ${$.name}`,re("temperature","Its own warm temperature",A[ie]??A.in_use,"Replaces the use level's temperature in this room only. Leave empty to use the level's."),re("night_temperature","Its own night temperature",A.night,`For a warmer nursery, say. Leave empty for the house's, ${A.night}°.`),re("unused_temperature","Its own unused temperature",A.unused,`Leave empty for the house's, ${A.unused}°.`),m(`${E}.preheat_min`,"Valve starts early by",N(F(`${E}.preheat_min`,$.preheat_min,{limit:de("timing.preheat_min"),placeholder:f.timing.preheat_min,onChange:me=>$.preheat_min=me}),"min"),`For a slow room with a small radiator. Leave empty for the house setting, ${Vn(f.timing.preheat_min)}.`))}function ve(){const $=f.temperatures,E=de("temperatures"),A=(re,ie,me)=>{const he=`household.temperatures.${re}`,_e=re==="unused"||re==="night"?Y("p",{class:"field-note","aria-live":"polite",text:ro($[re],p.damp_below_c)}):null,Oe=F(he,$[re],{limit:E,step:.5,onChange:Ze=>{$[re]=Ze,_e&&(_e.textContent=ro(Ze,p.damp_below_c))}});return m(he,ie,N(Oe,"°C"),`${me} Default ${pe("temperatures",re)}°.`,_e)},H=f.timing,G=(re,ie,me)=>{const he=`household.timing.${re}`;return m(he,ie,N(F(he,H[re],{limit:de(`timing.${re}`),onChange:we=>H[re]=we}),"min"),`${me} ${O(pe("timing",re))}`)};return[...v("How warm should rooms be?","One temperature for each way a room is used. Rooms change between them through the day."),Y("div",{class:"setup-grid"},A("in_use","In use","Rooms while they're being used."),A("occasional","Occasional","Rooms used now and then, such as a bathroom, while they're used."),A("unused","Unused","Every room by day when it isn't being used."),A("night","Night","Every room overnight, from the last person in bed to the first one up.")),se("timing","Advanced: timing",Y("div",{class:"field","data-path":"household.weekend_days"},Y("p",{class:"field-label",text:"Weekend days"}),ee("household.weekend_days",f.weekend_days,re=>f.weekend_days=re),Y("p",{class:"field-help",text:"The days that use weekend routines and weekend room use. Default Saturday and Sunday."})),G("getting_up_min","Getting ready","How long bedrooms and shared rooms stay warm after someone gets up."),G("bedtime_min","Winding down","How long a bedroom is warm before someone goes to bed."),G("preheat_min","Valves start early by","How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),m("household.timing.live_preheat","How Radiate starts early",W("household.timing.live_preheat",H.live_preheat,[["optimum_start","Learn how early each room needs"],["fixed","A fixed time early, as the valves do"]],re=>H.live_preheat=re),"Learning starts each room as late as it can and still be warm in time. Default learn."),G("merge_gap_min","Join warm periods closer than","Two warm periods this close together become one, so a room doesn't cool for a short gap."))]}function Le(){const $=Y("div",{class:"setup-result"}),E=Y("p",{class:"week-legend",hidden:!0}),A=Y("p",{class:"away-note",hidden:!0,text:"Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back."}),H=Y("div",{class:"weeks"}),G=Y("p",{class:"setup-status",id:"setup-result-status","aria-live":"polite",tabindex:"-1",text:"Building your week…"});return $.append(G,Y("div",{class:"setup-notes",id:"setup-notes"}),Y("div",{class:"week-head"},E),A,H),ae=ei({list:H,legendEl:E,frostEl:A}),[...v("Your heating week","Every room's week, built from your answers. Blocks are warm periods, darker when warmer."),$]}const Ke=[M,()=>Q(),I,ve,Le];function Te(){d.textContent="",so.forEach(($,E)=>{const A=E===h,H=Y("li",{"aria-current":A?"step":null,"data-done":String(E<h)}),G=`${E+1}. ${$}`;E<=w&&!A?H.append(Y("button",{type:"button",class:"link",text:G,onclick:re=>te(E,0,re.detail===0)})):H.append(Y("span",{text:G})),d.append(H)})}function tn(){u.textContent="";const $=p.saved_problems??[];if($.length){u.hidden=!1,u.append(Y("p",{text:`Your saved setup couldn't be used, so the house file's setup applies: ${$.map(E=>Ps(E.message)).join(" ")} Saving here replaces it.`}));return}if(p.source==="saved"){u.hidden=!1;const E=p.house_file?"the household section of the house file":"the schedules in the house file";u.append(Y("p",{text:p.saved_at?`This setup is saved by Radiate in ${p.saved_at}. It replaces ${E}, which is left as it is.`:"This setup replaces the schedules the house started with, until you go back to them."}));const A=Y("div",{class:"row",hidden:!0},Y("p",{text:`This deletes the saved setup. Rooms go back to ${E}.`}),Y("button",{type:"button",class:"btn",text:"Delete and use the house file",onclick:nn}),Y("button",{type:"button",class:"link",text:"Keep this setup",onclick:()=>{A.hidden=!0,H.hidden=!1,H.focus()}})),H=Y("button",{type:"button",class:"link",text:"Use the house file's setup instead",onclick:()=>{A.hidden=!1,H.hidden=!0,A.querySelector(".btn").focus()}});u.append(H,A);return}if(p.source==="house_file"){u.hidden=!1,u.append(Y("p",{text:"These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed."}));return}u.hidden=!0}function z($=null){a.dataset.instant=String(D||$!=null);const E=Y("div",{class:"setup-step"},...Ke[h]());s.replaceChildren(E),Te(),i.hidden=h===0&&b===0,l.disabled=!1,l.textContent=h===4?"Save":h===3?"See the result":"Next";const A=h===1?`${so[1]}, ${f.people[b]?.name||`person ${b+1}`}`:so[h];c.textContent=`Step ${h+1} of 5: ${A}`,ue(!1),$&&document.getElementById($)?document.getElementById($).focus():Be("setup-step-h")?.focus(),h===4&&ge()}function ne($,E=!0){const A=k;z($),E&&(k=A,ue(!1)),K()}function te($,E=0,A=!1){D=A,h=$,b=Math.min(E,f.people.length-1),w=Math.max(w,h),k=[],R=[],z(),K()}function ue($){for(const H of s.querySelectorAll(".field-error"))H.remove();for(const H of s.querySelectorAll("[aria-invalid]"))H.removeAttribute("aria-invalid"),H.dataset.describedby?H.setAttribute("aria-describedby",H.dataset.describedby):H.removeAttribute("aria-describedby"),delete H.dataset.describedby;if(r.textContent="",r.hidden=!k.length,!k.length)return;const E=[...s.querySelectorAll("[data-path]")].map(H=>H.dataset.path);r.append(Y("h3",{text:k.length===1?"Check this answer":`Check these ${k.length} answers`}));const A=Y("ul");k.forEach((H,G)=>{const re=Ac(E,H.path),ie=re?s.querySelector(`[data-path="${CSS.escape(re)}"]`):null,me=Ps(H.message),he=ie?.matches("input, select")?ie:ie?.querySelector("input, select, button");if(ie){const _e=`setup-err-${G}`,Oe=Y("p",{class:"field-error",id:_e,text:me}),Ze=ie.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");if(Ze?Ze.after(Oe):ie.prepend(Oe),he){he.setAttribute("aria-invalid","true");const yt=he.getAttribute("aria-describedby")??"";he.dataset.describedby=yt,he.setAttribute("aria-describedby",`${_e} ${yt}`.trim())}}const we=ye(H.path);A.append(Y("li",{},he?Y("a",{href:`#${he.id}`,text:`${we}${me}`,onclick:_e=>{_e.preventDefault(),he.focus()}}):Ie(H.path,`${we}${me}`)))}),r.append(A),$&&r.focus()}function ye($){const E=$.split(".");if(E[1]==="people"&&E[2]){const A=f.people.find(G=>G.id===E[2]),H=E[3]?.startsWith("weekend")&&E[3]!=="weekend_days"?", weekends":E[3]?.startsWith("weekdays")?", weekdays":"";return`${A?.name||E[2]}${H}: `}return E[1]==="rooms"&&E[2]?`${f.rooms.find(A=>A.id===E[2])?.name??E[2]}: `:""}function Ie($,E){if(!$)return Y("span",{text:E});const{step:A,person:H}=Ls(f,$);return A===h&&(A!==1||H===b)?Y("span",{text:E}):Y("button",{type:"button",class:"link",text:`${E} Change it in ${so[A]}.`,onclick:G=>te(A,H,G.detail===0)})}const Se=$=>$.filter(E=>{const A=Ls(f,E.path);return A.step===h&&(h!==1||A.person===b)});async function De(){const $=Rc(f);if(Se($).length)return{errors:Se($),notes:[]};const E=await e.call("POST","household/preview",{household:Rs(f)});if(E.status!==200)throw new Error(typeof E.body=="string"?E.body:`HTTP ${E.status}`);return E.body}async function qe($){if(T)return;if(h===4){await lt();return}T=!0,l.disabled=!0;let E;try{E=await De()}catch{T=!1,l.disabled=!1,k=[{path:"",message:"Couldn't check your answers. Check the connection and try again."}],ue(!0);return}if(T=!1,l.disabled=!1,k=Se(E.errors),k.length){ue(!0);return}h===1&&b<f.people.length-1?te(1,b+1,$):te(h+1,0,$)}function Me($){h===1&&b>0?te(1,b-1,$):h===2?te(1,f.people.length-1,$):h>0&&te(h-1,0,$)}async function ge(){const $=Be("setup-result-status"),E=Be("setup-notes");let A;try{A=await De()}catch{$.textContent="Couldn't build the week. Check the connection, then go back and forward to try again.",l.disabled=!0;return}if(h!==4)return;if(k=A.errors,R=A.notes??[],l.disabled=k.length>0,k.length){$.textContent="Some answers need changing before Radiate can build the week.",ue(!0);return}$.textContent="Save to start using it. Radiate then rebuilds every room's schedule from your answers.",E.textContent="";const H=Nc(A.rooms);for(const G of R)G.path.startsWith("household.temperatures")||G.path.includes("_temperature")||E.append(Y("p",{class:"flag",text:`${ye(G.path)||""}${G.message[0].toUpperCase()}${G.message.slice(1)}`}));H&&E.append(Y("p",{class:"field-help",text:H})),ae.update(A)}async function lt(){T=!0,l.disabled=!0;const $=Be("setup-result-status");$.textContent="Saving…";let E;try{E=await e.call("PUT","household",{household:Rs(f)})}catch{E={status:0,body:null}}if(T=!1,l.disabled=!1,E.status===200){q(),Tt(!1),t("Household setup saved. Every room's schedule is rebuilt from it.");return}if(E.status===400&&E.body?.errors){k=E.body.errors,$.textContent="Not saved: some answers need changing.",ue(!0);return}$.textContent=E.body?.message?`Not saved. ${E.body.message}.`:"Not saved. Check the connection and try again.",$.focus?.()}async function nn(){let $;try{$=await e.call("DELETE","household")}catch{$={status:0}}if($.status!==200){k=[{path:"",message:"Couldn't go back to the house file's setup. Try again."}],ue(!0);return}q(),Tt(!1),t("Using the house file's setup again. The saved setup is deleted.")}function Tt($=!0){$&&f&&K(),a.hidden=!0,o()}let $n=!1;return l.addEventListener("click",$=>{$n=$.detail===0}),Be("setup-form").addEventListener("submit",$=>{$.preventDefault(),qe($n)}),i.addEventListener("click",$=>Me($.detail===0)),Be("setup-close").addEventListener("click",()=>Tt(!0)),Be("setup-restart").addEventListener("click",()=>{q(),f=Ts(p),V.clear(),g.hidden=!0,w=0,te(0)}),{async open(){const $=await e.call("GET","household");if($.status!==200)throw new Error(`household: HTTP ${$.status}`);p=$.body,x=JSON.stringify(p.household);const E=od(),A=E?.v===1&&E.base===x&&E.draft?.people?.length;f=A?E.draft:Ts(p),h=A?Math.min(E.step,4):0,b=A?Math.min(E.person??0,f.people.length-1):0,w=A?Math.max(E.reached??0,h):0,g.hidden=!A,Be("setup-h").textContent=p.household?"Change household setup":"Set up your household",k=[],D=!1,V.clear(),tn(),a.hidden=!1,n(),z(),Be("setup-h").focus()},async available(){try{return(await e.call("GET","household")).status===200}catch{return null}}}}const Fe=e=>document.getElementById(e),sd=1e4,rd=2e3;function xo(e){return e==null?"–":e<60?"just now":e<3600?`${Math.floor(e/60)} min ago`:e<172800?`${Math.floor(e/3600)} h ago`:`${Math.floor(e/86400)} days ago`}function qs(e){const t=Math.max(1,Math.ceil(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} h ${t%60} min`}const id={strong:"Strong",fair:"Fair",weak:"Weak"},ld={weak:1,fair:2,strong:3},cd={auto:"auto",heat:"heat",off:"off"};function Is(e,t){return t==="device.offline"?`Not reachable. Last heard ${xo(e.last_seen_s)}.`:t==="device.low_battery"?`Battery low at ${e.battery_pct}%. Replace the batteries soon.`:t==="device.weak_signal"?`Weak signal (LQI ${e.linkquality}). A router nearer to it would help.`:t==="device.stale"?`No temperature for ${xo(e.reading_age_s).replace(" ago","")}.`:"Needs attention."}function dd(e){return e.status==="offline"?["Offline","offline"]:e.status==="attention"?["Needs attention","attention"]:e.available==null?["No data yet",""]:["Online","ok"]}function ud(e){const t=[],n=e.temperature_c!=null?`${e.temperature_c.toFixed(1)}°`:null;if(e.kind==="trv"){const a=e.valve??{};n&&t.push(`${n} at the valve`),a.opening_pct!=null&&t.push(`opening limit ${Math.round(a.opening_pct)}%`),a.running_state&&t.push(a.running_state==="heat"?"heating":"idle"),a.mode&&t.push(`${cd[a.mode]??a.mode} mode`)}else if(e.kind==="relay"){const a=e.relay??{};a.heating!=null&&t.push(`heating ${a.heating?"on":"off"}`),a.store!=null&&t.push(`hot water ${a.store?"on":"off"}`),a.power_w!=null&&t.push(`${Math.round(a.power_w)} W`)}else e.kind==="window"?e.contact!=null&&t.push(e.contact?"window closed":"window open"):e.kind!=="router"&&(n&&t.push(n),e.humidity_pct!=null&&t.push(`${Math.round(e.humidity_pct)}% humidity`));if(!t.length)return e.kind==="router"?"Relays messages for nearby devices.":"–";const o=t.join(", ");return o[0].toUpperCase()+o.slice(1)}function hd(e,t){return e.kind==="relay"?"Wi-Fi":e.route?`Via ${e.route.via_kind==="coordinator"?"the coordinator":e.route.via}${e.route.lqi!=null?` (LQI ${Math.round(e.route.lqi)})`:""}`:t?"Not in the last scan":null}function pd({transport:e,isAuthError:t,onAuth:n,scanLock:o=()=>""}){const a=new Map;let s=null,r=null,i=!1,l=!1,c="";function d(w,k){let R=a.get(w.id);return R||(R=Fe("device-tpl").content.firstElementChild.cloneNode(!0),R.id=`device-${w.id.replace(/[^\w-]/g,"_")}`,R.dataset.kind=w.kind,a.set(w.id,R)),R.parentElement!==k&&k.appendChild(R),R}function u(w,k,R){const T=d(w,k);T.querySelector(".name").textContent=w.label,T.dataset.status=w.status;const[D,Z]=dd(w),V=T.querySelector(".badge");V.textContent=D,V.dataset.kind=Z;const ae=T.querySelector(".device-flags"),C=w.problems.map(v=>Is(w,v.code)),K=JSON.stringify(C);if(ae.dataset.key!==K){ae.dataset.key=K,ae.textContent="";for(const v of C){const S=document.createElement("li");S.className="flag",S.textContent=v,ae.appendChild(S)}}ae.hidden=!C.length;const q=T.querySelector(".ds-battery"),m=q.querySelector(".ds-val"),P=q.querySelector(".meter");w.battery_pct!=null?(m.textContent=`${w.battery_pct}%`,P.hidden=!1,P.dataset.low=String(w.battery_low),P.firstElementChild.style.transform=`scaleX(${Math.max(0,Math.min(100,w.battery_pct))/100})`):(m.textContent=w.power==="mains"?"Mains":"–",P.hidden=!0),q.dataset.low=String(w.battery_low);const F=T.querySelector(".ds-signal"),N=F.querySelector(".ds-val"),W=F.querySelector(".ds-sub"),U=F.querySelector(".sig");W.textContent="",w.kind==="relay"?(N.textContent="Wi-Fi",U.hidden=!0):w.linkquality!=null&&w.available!==!1?(N.textContent=id[w.signal],W.textContent=`LQI ${w.linkquality}`,U.hidden=!1,U.dataset.level=w.signal,U.dataset.bars=String(ld[w.signal])):(N.textContent="–",U.hidden=!0),F.dataset.weak=String(w.signal==="weak"&&w.available!==!1),T.querySelector(".ds-seen .ds-val").textContent=xo(w.last_seen_s),T.querySelector(".device-reading").textContent=ud(w);const ee=T.querySelector(".meta"),se=[];w.kind!=="relay"&&se.push(["code",w.id]);const de=[w.vendor,w.model].filter(Boolean).join(" ");de&&se.push(["",de]),w.firmware&&se.push(["",`Firmware ${w.firmware}`]);const pe=hd(w,R);pe&&se.push(["route",pe]);const O=JSON.stringify(se);if(ee.dataset.key!==O){ee.dataset.key=O,ee.textContent="";for(const[v,S]of se){const M=document.createElement(v==="code"?"code":"span");v==="route"&&(M.className="route"),M.textContent=S,ee.appendChild(M)}}}function g(w){const k=w.summary,R=[];k.offline&&R.push(`${k.offline} offline`),k.low_battery&&R.push(`${k.low_battery} low battery`),k.weak_signal&&R.push(`${k.weak_signal} weak signal`);const T=`${k.total} ${k.total===1?"device":"devices"}`;Fe("devices-summary").textContent=k.attention?`${T}. ${k.attention} ${k.attention===1?"needs":"need"} attention${R.length?`: ${R.join(", ")}`:""}.`:`${T}, all healthy.`;const D=w.network??{},Z=[];D.mqtt!=null&&Z.push(D.mqtt?"MQTT connected":"MQTT not connected"),D.zigbee2mqtt!=null&&Z.push(D.zigbee2mqtt?"Zigbee2MQTT online":"Zigbee2MQTT offline"),Fe("devices-network").textContent=Z.length?`${Z.join(". ")}.`:"";const V=Fe("devices-attention"),ae=Fe("devices-attention-list"),C=w.devices.filter(q=>q.status!=="ok");V.hidden=!C.length;const K=JSON.stringify(C.map(q=>q.id));if(ae.dataset.key!==K){ae.dataset.key=K,ae.textContent="";for(const q of C){const m=document.createElement("li");m.dataset.id=q.id;const P=document.createElement("a");P.href="#devices",P.className="attention-link",P.textContent=q.label,P.addEventListener("click",N=>{N.preventDefault();const W=a.get(q.id);W&&(W.scrollIntoView({block:"center"}),W.focus({preventScroll:!0}))});const F=document.createElement("span");m.append(P,F),ae.appendChild(m)}}for(const q of C){const m=ae.querySelector(`li[data-id="${CSS.escape(q.id)}"] span`);m&&(m.textContent=`: ${q.problems.map(P=>Is(q,P.code)).join(" ")}`)}}function p(w){const k=Fe("mesh-tree"),R=w.devices.filter(C=>C.route);k.hidden=!R.length;const T=JSON.stringify(R.map(C=>[C.id,C.route.via,C.route.lqi]));if(k.dataset.key===T)return;k.dataset.key=T,k.textContent="";const D=new Map;for(const C of R){const K=C.route.via_kind==="coordinator"?"Coordinator":C.route.via;D.has(K)||D.set(K,[]),D.get(K).push(C)}const Z=new Map(w.devices.map(C=>[C.id,C.label])),V=new Set,ae=(C,K)=>{const q=document.createElement("li"),m=document.createElement("span");m.className="tree-node",m.textContent=K,q.appendChild(m);const P=(D.get(C)??[]).slice().sort((N,W)=>(N.kind==="router")-(W.kind==="router")||N.label.localeCompare(W.label));if(!P.length||V.has(C))return q;V.add(C);const F=document.createElement("ul");for(const N of P){const W=document.createElement("span");W.className="tree-lqi",W.textContent=N.route.lqi!=null?`LQI ${Math.round(N.route.lqi)}`:"",W.dataset.weak=String(N.route.lqi!=null&&N.route.lqi<w.limits.weak_signal_lqi);let U;if(N.kind==="router")U=ae(N.id,N.label),U.firstElementChild.after(W);else{U=document.createElement("li");const ee=document.createElement("span");ee.className="tree-node",ee.textContent=N.label,U.append(ee,W)}F.appendChild(U)}return q.appendChild(F),q};k.appendChild(ae("Coordinator","Coordinator"));for(const C of D.keys())!V.has(C)&&C!=="Coordinator"&&k.appendChild(ae(C,Z.get(C)??C))}function f(w){const k=w.scan,R=Fe("mesh-scan"),T=Fe("mesh-status");Fe("devices-mesh-section").hidden=!k.available&&!w.devices.some(ae=>ae.kind==="router"),R.hidden=!k.available;const D=k.state==="scanning",Z=o();R.disabled=!!Z||D||k.retry_in_s>0,Z?R.dataset.locked="":delete R.dataset.locked,Fe("mesh-lock").hidden=!Z||!k.available,Fe("mesh-lock").textContent=Z,R.setAttribute("aria-busy",String(D)),R.textContent=D?"Scanning…":"Scan network",T.dataset.error=String(k.state==="failed"||!!c);let V;c?V=c:D?V="Scanning. This can take up to 2 minutes.":k.state==="failed"?V=`The scan didn't finish: ${k.error}. Radiate will let you try again in ${qs(k.retry_in_s||60)}.`:k.scanned_s_ago!=null?V=`Scanned ${xo(k.scanned_s_ago)}.`:V="Not scanned yet.",!D&&k.retry_in_s>0&&k.state!=="failed"&&!c&&(V+=` You can scan again in ${qs(k.retry_in_s)}.`),T.textContent=V}function x(w){s=w,g(w);const k=w.scan.scanned_s_ago!=null,R=Fe("devices-rooms"),T=Fe("devices-routers"),D=Fe("devices-boiler"),Z=new Set;for(const V of w.devices){Z.add(V.id);const ae=V.kind==="router"?T:V.kind==="relay"?D:R;u(V,ae,k)}for(const[V,ae]of a)Z.has(V)||(ae.remove(),a.delete(V));Fe("devices-boiler-section").hidden=!D.children.length,f(w),p(w)}async function h(){if(!l){l=!0;try{x(await e.get("devices"))}catch(w){t(w)?n():s||(Fe("devices-summary").textContent="Couldn't load the devices. Retrying…")}l=!1,b()}}function b(){clearTimeout(r),i&&(r=setTimeout(h,s?.scan.state==="scanning"?rd:sd))}return Fe("mesh-scan").addEventListener("click",async()=>{const w=Fe("mesh-scan");w.disabled=!0,c="";try{const k=await e.call("POST","devices/scan",{});k.status!==200&&(c=`Not started: ${typeof k.body=="object"?k.body.message:k.body}.`)}catch(k){if(t(k)){n();return}c="Not started. Check the connection and try again."}await h(),w.disabled||w.focus()}),{async available(){try{return x(await e.get("devices")),!0}catch(w){return t(w)?null:/HTTP 404|not found|reports no devices/.test(String(w?.message))?!1:null}},show(){i=!0,h()},hide(){i=!1,clearTimeout(r)}}}const ht=e=>document.getElementById(e),fd=3e4,md=3e5,gd={act:["Act on this","act"],consider:["Worth considering","consider"],info:["For information","info"]},wd={ready:["Ready","ok"],learning:["Learning",""],not_judged:["Not judged",""]},bd={low:"Low confidence",medium:"Medium confidence",high:"High confidence"},ti=(e,t,n)=>`${e} ${e===1?t:n}`;function yd(e){const t=e.summary;if(t.total){const n=[];return t.act&&n.push(`${t.act} to act on`),t.consider&&n.push(`${t.consider} to consider`),t.info&&n.push(`${t.info} for information`),`${ti(t.total,"suggestion","suggestions")}: ${n.join(", ")}.`}return t.rooms_learning&&!t.rooms_ready?"Nothing to suggest yet. Radiate is still learning.":"Nothing to suggest."}function vd(e){const t=e.summary,n=Math.round(e.settings.min_learning_h);return t.rooms_learning&&!t.rooms_ready?`Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${n} h of learning; you can see how far each room has got below.`:t.rooms_learning?`The rooms Radiate can judge so far heat up and hold their warmth as expected. ${ti(t.rooms_learning,"room is","rooms are")} still learning.`:t.rooms_ready?"Every room Radiate can judge heats up and holds its warmth as expected.":"None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them."}function kd(e){return`${bd[e.confidence]??"Confidence unknown"}. ${e.basis}`}function $d(e){const t=e.summary;return t.rooms_compared>=t.min_rooms?"":`Rooms are compared with each other once ${t.min_rooms} have enough learning. ${t.rooms_compared?`${t.rooms_compared} so far.`:"None yet."}`}function xd({transport:e,isAuthError:t,onAuth:n,onCount:o}){const a=new Map,s=new Map;let r=null,i=null,l=!1,c=!1;function d(h){let b=a.get(h.id);b||(b=ht("suggestion-tpl").content.firstElementChild.cloneNode(!0),a.set(h.id,b));const[w,k]=gd[h.severity]??["",""];b.dataset.severity=h.severity,b.querySelector(".name").textContent=h.title;const R=b.querySelector(".badge");return R.textContent=w,R.dataset.kind=k,b.querySelector(".sg-evidence").textContent=h.evidence,b.querySelector(".sg-action").textContent=h.action,b.querySelector(".sg-basis").textContent=kd(h),b}function u(h,b){let w=s.get(h.room_id);w||(w=ht("learning-tpl").content.firstElementChild.cloneNode(!0),s.set(h.room_id,w)),w.querySelector(".lr-name").textContent=h.room_name;const[k,R]=wd[h.status]??[h.status,""],T=w.querySelector(".badge");T.textContent=k,T.dataset.kind=R,w.querySelector(".lr-note").textContent=h.note;const D=w.querySelector(".meter");D.hidden=h.status!=="learning";const Z=Math.max(0,Math.min(1,h.hours/Math.max(1,b)));return D.firstElementChild.style.transform=`scaleX(${Z})`,w}function g(h,b){let w=h.firstElementChild;for(const k of b)k===w?w=w.nextElementSibling:h.insertBefore(k,w);for(;w;){const k=w.nextElementSibling;w.remove(),w=k}}function p(h){r=h,o?.(h.summary.act),ht("suggestions-summary").textContent=yd(h);const b=ht("suggestions-list"),w=new Set(h.suggestions.map(V=>V.id));for(const V of a.keys())w.has(V)||a.delete(V);g(b,h.suggestions.map(d));const k=ht("suggestions-empty"),R=h.summary.rooms_learning>0&&!h.summary.rooms_ready;k.hidden=h.suggestions.length>0&&!R,k.dataset.state=R?"learning":"clear",ht("suggestions-empty-h").textContent=R?"Still learning":"Nothing to suggest",ht("suggestions-empty-text").textContent=vd(h);const T=ht("learning-list"),D=new Set(h.learning.map(V=>V.room_id));for(const V of s.keys())D.has(V)||s.delete(V);g(T,h.learning.map(V=>u(V,h.settings.min_learning_h))),ht("learning-section").hidden=!h.learning.length;const Z=ht("learning-compare");Z.textContent=$d(h),Z.hidden=!Z.textContent}async function f(){if(!c){c=!0;try{p(await e.get("suggestions"))}catch(h){t(h)?n():!r&&l&&(ht("suggestions-summary").textContent="Couldn't load the suggestions. Retrying…")}c=!1,x()}}function x(){clearTimeout(i),i=setTimeout(f,l?fd:md)}return{async available(){try{return p(await e.get("suggestions")),x(),!0}catch(h){return t(h)?null:/HTTP 404|not found/.test(String(h?.message))?!1:null}},show(){l=!0,f()},hide(){l&&(l=!1,x())}}}const Ae=e=>document.getElementById(e),Sd=6e4,_d=6e5,Cd="−",Mn="–",ni=["January","February","March","April","May","June","July","August","September","October","November","December"],Ed=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Uo=e=>{const[t,n,o]=String(e).split("-").map(Number);return new Date(Date.UTC(t,n-1,o))},Td=e=>{const t=Uo(e);return`${t.getUTCDate()} ${ni[t.getUTCMonth()]}`},pn=e=>{const t=Uo(e);return`${t.getUTCDate()} ${ni[t.getUTCMonth()].slice(0,3)}`},os=e=>{const t=Uo(e);return`${Ed[t.getUTCDay()]} ${pn(e)}`};function pt(e){const t=Math.abs(e);return t<9.95?t.toFixed(1):String(Math.round(t))}const Hs=e=>`${pt(e)} ${pt(e)==="1.0"?"litre":"litres"}`;function oi(e,t=1){if(e==null)return Mn;const n=Number(e.toFixed(t));return n<0?`${Cd}${Math.abs(n).toFixed(t)}`:n.toFixed(t)}const ca=(e,t=1)=>e==null?Mn:e.toFixed(t),On=e=>e==null?Mn:`${Math.round(e*100)}%`;function Ad(e){return e==null?"with no room in use to keep warm":`with rooms in use warm ${On(e)} of the time`}function ai(e){if(e.status==="ready"&&e.totals){const t=e.totals,n=Td(t.since),o=Ad(t.warm_share);return Math.abs(t.litres_saved)<.05?`About the same oil as the baseline since ${n}, ${o}.`:t.litres_saved<0?`About ${Hs(t.litres_saved)} more than the baseline since ${n}, ${o}.`:`About ${Hs(t.litres_saved)} of oil saved since ${n}, ${o}.`}return e.status==="learning"?Rd(e):Md(e)}function Rd(e){return`Still learning how much oil this house uses: ${e.why??`${e.progress.eligible_days} of ${e.progress.needed_days} days`}.`}function Ld(e){const t=e.progress,n=Math.max(0,t.needed_days-t.eligible_days);return`${n?`Figures start once ${t.needed_days} full days have counted, so at least ${n} more ${n===1?"day":"days"}`:`${t.eligible_days} days have counted`}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`}const si={"no household":["Savings need a household","The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare."],"no outdoor sensor":["Savings need an outdoor sensor","Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add a Zigbee outdoor sensor as house.outdoor_sensor in the house file, or set house.outdoor_source to home_assistant and pick an outdoor entity in the Radiate integration's options."],"no outdoor readings yet":["Savings need outdoor readings","Radiate takes the outdoor temperature from Home Assistant, and no fresh reading has arrived yet. Check the outdoor entity in the Radiate integration's options, and that it reports at least every few hours."],"no nozzle rating":["Savings need the nozzle rating","Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record."]};function Md(e){return(si[e.why]??["Savings aren't measured yet"])[0]}function Od(e){return(si[e.why]??["",`Radiate can't measure savings yet: ${e.why??"no reason given"}.`])[1]}function Nd(e){return[e.litres_upper_bound?"Litres are an upper bound until the burner itself is measured.":e.basis_text??"",e.outdoor?.text??""].filter(Boolean).join(" ")}const zd=e=>{const t=Uo(e);return t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7),t.toISOString().slice(0,10)};function Bs(e,t="days"){const n=e.days??[];if(t!=="weeks")return n.map(a=>({key:a.date,label:os(a.date),tick:pn(a.date),counted:a.eligible?1:0,total:1,eligible:a.eligible,why:a.why,litres:a.eligible?a.litres:null,baseline:a.eligible?a.litres_baseline:null,saved:a.eligible?a.litres_saved:null,warm:a.warm_share,deficit:a.comfort_deficit_kh,outdoor:a.outdoor_mean_c}));const o=new Map;for(const a of n){const s=zd(a.date);o.has(s)||o.set(s,[]),o.get(s).push(a)}return[...o].map(([a,s])=>{const r=s.filter(c=>c.eligible),i=c=>r.length&&r.every(d=>d[c]!=null)?r.reduce((d,u)=>d+u[c],0):null,l=s.filter(c=>c.comfort_deficit_kh!=null);return{key:a,week:!0,label:`Week of ${pn(a)}`,tick:pn(a),counted:r.length,total:s.length,eligible:r.length>0,why:r.length?null:[...new Set(s.map(c=>c.why).filter(Boolean))].join("; ")||"no day counted",litres:i("litres"),baseline:i("litres_baseline"),saved:i("litres_saved"),warm:null,deficit:l.length?l.reduce((c,d)=>c+d.comfort_deficit_kh,0):null,outdoor:null}})}function ri(e){if(!e.eligible)return`${e.label}: not counted, ${e.why}.`;const t=[];e.week&&t.push(`${e.counted} of ${e.total} ${e.total===1?"day":"days"} counted`),e.litres!=null&&t.push(`${e.litres.toFixed(1)} L used`),e.saved!=null&&(t.push(`baseline about ${e.baseline.toFixed(1)} L`),Math.abs(e.saved)<.05?t.push("about the same as the baseline"):e.saved<0?t.push(`about ${pt(e.saved)} L more than the baseline`):t.push(`about ${pt(e.saved)} L saved`));const n=[];e.warm!=null&&n.push(`rooms in use warm ${On(e.warm)} of the time`),e.deficit!=null&&n.push(`${e.deficit.toFixed(1)} degree-hours short`),e.outdoor!=null&&n.push(`${e.outdoor.toFixed(1)}° outside on average`);const o=`${e.label}: ${t.join(", ")}.`;return n.length?`${o} ${n.join(", ").replace(/^./,a=>a.toUpperCase())}.`:o}function Pd(e,t,n="days"){const o=n==="weeks"?"week":"day";if(!t.length)return`Oil used each ${o}: no full ${o} yet.`;const a=`${t.length} ${t.length===1?o:`${o}s`} from ${t[0].tick} to ${t.at(-1).tick}`,s=t.filter(d=>d.eligible),r=t.length-s.length,i=r?` ${r} not counted.`:"";if(e.status!=="ready")return`Bar chart of oil used each ${o}, ${a}. ${s.length} counted so far.${i}`;const l=s.filter(d=>d.saved!=null&&d.saved>=.05).length,c=s.filter(d=>d.saved!=null&&d.saved<=-.05).length;return`Bar chart of oil used each ${o} against the baseline, ${a}. Less than the baseline on ${l}, more on ${c}.${i}`}function Dd(e){return(e.days??[]).map(t=>[os(t.date),t.eligible?"Yes":`No, ${t.why}`,ca(t.litres),ca(t.litres_baseline),oi(t.litres_saved),t.outdoor_mean_c==null?Mn:`${t.outdoor_mean_c.toFixed(1)}°`,On(t.warm_share),ca(t.comfort_deficit_kh)])}function qd(e){if(e.status==="ready"&&e.totals){const a=e.totals,s=a.percent_saved,r=s==null?"":s<0?`${Math.abs(s).toFixed(1)}% more than the baseline`:`${s.toFixed(1)}% less than the baseline`;return[[a.litres_saved<0?"Oil over the baseline":"Oil saved",`About ${pt(a.litres_saved)} L`,r],["Oil used",`${pt(a.litres_used)} L`,`Baseline about ${pt(a.litres_baseline)} L`],["Rooms in use warm",On(a.warm_share),`${a.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],["Days counted",String(a.days),`Since ${pn(a.since)}`]]}const t=(e.days??[]).filter(a=>a.eligible&&a.litres!=null),n=t.reduce((a,s)=>a+s.litres,0),o=(e.days??[]).filter(a=>!a.partial&&a.warm_share!=null).at(-1);return[["Days counted",`${e.progress.eligible_days} of ${e.progress.needed_days}`,""],["Oil used on those days",t.length?`${pt(n)} L`:Mn,t.length?`${pt(n/t.length)} L a day on average${e.litres_upper_bound?", an upper bound":""}`:""],["Rooms in use warm",o?On(o.warm_share):Mn,o?`On ${pn(o.date)}`:""]]}function Id(e){return e.status==="ready"?ai(e):""}const Fs=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Je=e=>Math.round(e*10)/10;function Hd(e){if(!(e>0))return 1;const t=e/4,n=10**Math.floor(Math.log10(t));return[1,2,2.5,5,10].map(o=>o*n).find(o=>o>=t)}function Bd(e,{width:t,height:n,ready:o,active:a=e.length-1,labelEvery:s}){const d=Math.max(10,t-40-4),u=Math.max(10,n-10-22),g=Math.max(0,...e.flatMap(T=>[T.litres??0,o?T.baseline??0:0])),p=Hd(g),f=Math.max(p,Math.ceil(g/p)*p),x=T=>Je(10+u-T/f*u),h=d/Math.max(1,e.length),b=Math.max(3,Math.min(h*.78,40)),w=Math.max(2,b*(o?.56:1)),k=s??Math.max(1,Math.ceil(e.length/Math.max(1,Math.floor(d/56)))),R=[];R.push(`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="false">`),R.push('<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>');for(let T=0;T<=f+1e-9;T+=p){const D=x(T);R.push(`<line class="${T===0?"sv-zero":"sv-grid"}" x1="40" x2="${t-4}" y1="${D}" y2="${D}"/>`);const Z=T+p>f+1e-9?" L":"";R.push(`<text class="sv-ytick" x="34" y="${D+4}" text-anchor="end">${Number(T.toFixed(2))}${Z}</text>`)}return e.forEach((T,D)=>{const Z=40+h*(D+.5),V=D===a?0:-1;R.push(`<g class="sv-slot" data-i="${D}" tabindex="${V}" role="img" aria-label="${Fs(ri(T))}" data-counted="${T.eligible}">`),R.push(`<rect class="sv-hit" x="${Je(40+h*D)}" y="10" width="${Je(h)}" height="${u}"/>`),!T.eligible||T.litres==null?R.push(`<rect class="sv-empty" x="${Je(Z-b/2)}" y="10" width="${Je(b)}" height="${u}"/>`):(R.push(`<rect class="sv-act" x="${Je(Z-w/2)}" y="${x(T.litres)}" width="${Je(w)}" height="${Je(x(0)-x(T.litres))}"/>`),o&&T.baseline!=null&&R.push(`<rect class="sv-base" x="${Je(Z-b/2)}" y="${x(T.baseline)}" width="${Je(b)}" height="${Je(x(0)-x(T.baseline))}"/>`)),R.push(`<rect class="sv-ring" x="${Je(Z-b/2-3)}" y="7" width="${Je(b+6)}" height="${u+6}"/>`),R.push("</g>"),D%k===0&&R.push(`<text class="sv-xtick" x="${Je(Z)}" y="${n-6}" text-anchor="middle">${Fs(T.tick)}</text>`)}),R.push("</svg>"),R.join("")}function Fd(e){if(e.status!=="ready"||!e.totals)return[];const t=(e.days??[]).filter(a=>a.eligible&&a.litres_saved!=null);let n=e.totals.litres_saved-t.reduce((a,s)=>a+s.litres_saved,0);const o=[];for(const a of t)n+=a.litres_saved,o.push([a.date,n]);return o}function jd(e,{width:t,height:n}){const i=e.map(f=>f[1]),l=Math.min(0,...i),d=Math.max(0,...i)-l||1,u=f=>Je(34+(e.length<2?0:f/(e.length-1)*(t-34-8))),g=f=>Je(8+(1-(f-l)/d)*(n-8-8)),p=e.map((f,x)=>`${x?"L":"M"}${u(x)} ${g(f[1])}`).join(" ");return[`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="true">`,`<line class="sv-zero" x1="34" x2="${t-8}" y1="${g(0)}" y2="${g(0)}"/>`,`<text class="sv-ytick" x="28" y="${g(0)+4}" text-anchor="end">0</text>`,`<path class="sv-line" d="${p}"/>`,e.length?`<rect class="sv-dot" x="${u(e.length-1)-3}" y="${g(i.at(-1))-3}" width="6" height="6"/>`:"","</svg>"].join("")}function Wd(e,t){if(!t.length)return"";const n=t.at(-1)[1],o=pn(e.totals.since);return Math.abs(n)<.05?`About the same oil as the baseline in all since ${o}.`:n<0?`Running total: about ${pt(n)} L more than the baseline since ${o}.`:`Running total: about ${pt(n)} L saved since ${o}.`}function Ud({transport:e,isAuthError:t,onAuth:n,onView:o}){let a=null,s=null,r=null,i=!1,l=!1,c="days",d=null,u=[],g=0;const p=()=>Ae("savings-chart");function f(C,K){const q=Ae(C);q.textContent!==K&&(q.textContent=K),q.hidden=!K}function x(C){Ae("savings-stats").replaceChildren(...qd(C).map(([q,m,P])=>{const F=document.createElement("div"),N=document.createElement("dt");N.textContent=q;const W=document.createElement("dd"),U=document.createElement("span");if(U.textContent=m,W.append(U),P){const ee=document.createElement("span");ee.className="sub",ee.textContent=P,W.append(ee)}return F.append(N,W),F}))}function h(C){const K=u[C];Ae("savings-readout").textContent=K?ri(K):""}function b(){const C=p(),K=Math.floor(C.clientWidth);if(!K)return;g=K;const q=C.contains(document.activeElement)?document.activeElement.dataset.i:null;let m=u.findIndex(F=>F.key===d);m<0&&(m=u.length-1);const P=K<520;C.innerHTML=Bd(u,{width:K,height:P?180:220,ready:a.status==="ready",active:m}),C.setAttribute("aria-label",Pd(a,u,c)),h(m),q!=null&&C.querySelector(`.sv-slot[data-i="${m}"]`)?.focus()}function w(C){const K=p().querySelectorAll(".sv-slot");if(!K.length)return;const q=Math.max(0,Math.min(K.length-1,C));for(const m of K)m.setAttribute("tabindex","-1");K[q].setAttribute("tabindex","0"),K[q].focus(),d=u[q]?.key??null,h(q)}function k(){const C=p();C.addEventListener("keydown",K=>{const q=Number(document.activeElement?.dataset?.i);if(Number.isNaN(q))return;const m={ArrowRight:q+1,ArrowLeft:q-1,Home:0,End:u.length-1}[K.key];m!=null&&(K.preventDefault(),w(m))}),C.addEventListener("focusin",K=>{const q=Number(K.target?.dataset?.i);Number.isNaN(q)||(d=u[q]?.key??null,h(q))}),C.addEventListener("click",K=>{const q=K.target.closest?.(".sv-slot");q&&w(Number(q.dataset.i))}),C.addEventListener("pointerover",K=>{const q=K.target.closest?.(".sv-slot");q&&K.pointerType==="mouse"&&h(Number(q.dataset.i))}),C.addEventListener("pointerleave",()=>{const K=u.findIndex(q=>q.key===d);h(K<0?u.length-1:K)}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&i&&Math.floor(C.clientWidth)!==g&&b()}).observe(C)}function R(C){const K=C.rooms??[];if(Ae("savings-rooms-section").hidden=!K.length,!K.length)return;const q=Math.max(...K.map(F=>Math.abs(F.litres_saved)),.01),m=K.some(F=>F.litres_saved<0),P=Ae("savings-rooms");P.dataset.negative=String(m),P.replaceChildren(...K.map(F=>{const N=document.createElement("li");N.className="sv-room";const W=document.createElement("span");W.className="sv-room-name",W.textContent=F.name;const U=document.createElement("span");U.className="sv-room-track",U.setAttribute("aria-hidden","true");const ee=document.createElement("span");ee.className="sv-room-fill",ee.dataset.sign=F.litres_saved<0?"minus":"plus",ee.style.transform=`scaleX(${Math.abs(F.litres_saved)/q})`,U.append(ee);const se=document.createElement("span");se.className="sv-room-value",se.textContent=`${oi(F.litres_saved)} L`;const de=document.createElement("span");return de.className="sv-room-sub",de.textContent=F.warm_share==null?"Not in use in this time.":`Warm ${On(F.warm_share)} of the time in use, ${F.comfort_deficit_kh.toFixed(1)} degree-hours short.`,N.append(W,U,se,de),N}))}function T(C){Ae("savings-table-body").replaceChildren(...Dd(C).map(q=>{const m=document.createElement("tr");return q.forEach((P,F)=>{const N=document.createElement(F===0?"th":"td");F===0&&(N.scope="row"),N.textContent=P,m.append(N)}),m})),Ae("savings-table-empty").hidden=(C.days??[]).length>0}function D(C){a=C,o?.(C);const K=JSON.stringify(C);if(K===s)return;s=K;const q=C.status;if(Ae("savings").dataset.state=q,f("savings-headline",ai(C)),Ae("savings-missing").hidden=q!=="unavailable",f("savings-missing-text",q==="unavailable"?Od(C):""),Ae("savings-body").hidden=q==="unavailable",q==="unavailable")return;f("savings-baseline",C.baseline?.text??""),f("savings-basis",Nd(C));const m=q==="learning";if(Ae("savings-progress").hidden=!m,m){const W=C.progress;Ae("savings-meter").style.transform=`scaleX(${Math.max(0,Math.min(1,W.eligible_days/Math.max(1,W.needed_days)))})`,f("savings-learning",Ld(C))}x(C),Ae("savings-chart-h").textContent=m?"Oil used each day so far":"Oil used against the baseline",Ae("savings-legend-base").hidden=m,Ae("savings-modes").hidden=(C.days??[]).length<8,u=Bs(C,c),Ae("savings-chart-empty").hidden=u.length>0,Ae("savings-chart-wrap").hidden=!u.length,i?b():g=0;const P=(C.days??[]).filter(W=>!W.eligible);Ae("savings-skipped").replaceChildren(...P.map(W=>{const U=document.createElement("li");return U.textContent=`${os(W.date)}: ${W.why}.`,U})),Ae("savings-skipped-section").hidden=!P.length;const N=Fd(C);if(Ae("savings-running").hidden=N.length<2,N.length>=2){const W=Ae("savings-line-chart");W.innerHTML=jd(N,{width:Math.max(200,Math.floor(W.clientWidth)||320),height:90}),f("savings-running-text",Wd(C,N))}R(C),T(C)}async function Z(){if(!l){l=!0;try{D(await e.get("savings"))}catch(C){t(C)?n():!a&&i&&(Ae("savings-headline").textContent="Couldn't load the savings. Retrying…")}l=!1,V()}}function V(){clearTimeout(r),r=setTimeout(Z,i?Sd:_d)}for(const C of document.querySelectorAll("#savings-modes [data-mode]"))C.addEventListener("click",()=>{if(C.dataset.mode!==c){c=C.dataset.mode;for(const K of document.querySelectorAll("#savings-modes [data-mode]"))K.setAttribute("aria-checked",String(K===C));d=null,a&&(u=Bs(a,c),b())}});const ae=Ae("savings-table-toggle");return ae.addEventListener("click",()=>{const C=ae.getAttribute("aria-pressed")!=="true";ae.setAttribute("aria-pressed",String(C)),ae.textContent=C?"Hide table":"Show as table",Ae("savings-table-wrap").hidden=!C}),k(),{async available(){try{return D(await e.get("savings")),V(),!0}catch(C){return t(C)?null:/HTTP 404|not found/.test(String(C?.message))?!1:null}},show(){i=!0,a&&(s=null,D(a)),Z()},hide(){i&&(i=!1,V())},refresh:Z}}const fe=e=>document.getElementById(e),Ra="–",Vd="−",Kd=6e4,Jd=500,js={"6h":6*3600,"24h":86400,"7d":7*86400,"30d":30*86400},Ws={"6h":"the last 6 hours","24h":"the last 24 hours","7d":"the last 7 days","30d":"the last 30 days"},Yd=e=>e&&e[0].toLowerCase()+e.slice(1),_n=(e,t)=>{const n=Math.abs(e).toFixed(t);return e<0&&Number(n)!==0?`${Vd}${n}`:n},at=(e,t,n)=>`${e.toLocaleString("en-GB")} ${e===1?t:n}`;function bn(e){return e.room?`${e.room_name??e.room} ${Yd(e.label)}`:e.label}function So(e){return e>=86400?e===86400?"1 day":`${e/86400} days`:e>=3600?`${e/3600} h`:`${e/60} min`}function tt(e,t,n=60){if(e==null||Number.isNaN(e))return Ra;const o=t?.kind??"gauge";if(o==="state")return n<=60||e===0||e===1?e>=.5?"On":"Off":`on ${Math.round(e*100)}% of the time`;if(o==="level")return(t.levels??[])[Math.round(e)]??String(e);switch(t?.unit){case"°C":return`${_n(e,1)}°`;case"%":return`${_n(e,0)}%`;case"W":return`${_n(e,0)} W`;default:return Number.isInteger(e)?_n(e,0):_n(e,1)}}const Gd=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Xd=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Us=new Map;function Vo(e,t){let n=Us.get(t);n||(n=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),Us.set(t,n));const o=Object.fromEntries(n.formatToParts(new Date(e*1e3)).map(i=>[i.type,i.value])),a=Number(o.year),s=Number(o.month),r=Number(o.day);return{y:a,m:s,d:r,H:o.hour,M:o.minute,wd:new Date(Date.UTC(a,s-1,r)).getUTCDay()}}const _o=(e,t)=>{const n=Vo(e,t);return`${n.H}:${n.M}`},Co=(e,t)=>{const n=Vo(e,t);return`${Gd[n.wd]} ${n.d} ${Xd[n.m-1]}`},Nn=(e,t)=>`${Co(e,t)} ${_o(e,t)}`;function da(e,t){const n=Vo(e,t);return`${n.y}-${String(n.m).padStart(2,"0")}-${String(n.d).padStart(2,"0")}T${n.H}:${n.M}`}function Vs(e){return e<90?"just now":e<3600?`${Math.round(e/60)} min ago`:e<172800?`${Math.round(e/3600)} h ago`:`${Math.round(e/86400)} days ago`}function Ks(e){return e<60?`in ${Math.max(1,Math.round(e))} s`:e<5400?`in ${Math.round(e/60)} min`:`in ${Math.round(e/3600)} h`}function Qd(e){if(!e?.available)return e?.why??"No raw data here.";const t=e.series?.length??0;if(!t)return"Nothing recorded yet. The first readings appear within a minute.";const n=e.retention_days?` Kept for ${at(Math.round(e.retention_days),"day","days")}.`:"";return`${at(t,"series","series")} from ${Nn(e.first,e.timezone)} to now.${n}`}function Zd(e,t,n=8){const o=String(t??"").toLowerCase().split(/\s+/).filter(Boolean);if(!o.length||!e?.series)return[];const a=[];for(const s of e.series){const r=`${bn(s)} ${s.metric} ${s.room??""} ${s.room?"":"house"}`.toLowerCase();if(o.every(i=>r.includes(i))&&a.push(s),a.length>=n)break}return a}function eu(e,t,n){const o=e?.series??[];return o.length===1?bn(o[0]):t?.scope==="room"&&!n?`${t.label}, every room`:t?.label??"Raw data"}function tu(e,t){if(!e)return"";const n=e.series.length,o=e.series.reduce((r,i)=>r+i.points.length,0),a=t&&Ws[t]?Ws[t]:`${Nn(e.from,e.timezone)} to ${Nn(e.to,e.timezone)}`,s=e.step_raised?" (a finer step would be too many points)":"";return`Every ${So(e.step)}${s}, ${a}. ${at(n,"series","series")}, ${at(o,"point","points")}.`}function ii(e,t,n){const o=e?.points??[];if(!o.length)return[];let a=1/0,s=-1/0,r=0;for(const[,c,d,u]of o)a=Math.min(a,d),s=Math.max(s,u),r+=c;const i=o.at(-1),l=r/o.length;return t?.kind==="state"?[["Latest",tt(i[1],t,n)],["On",`${Math.round(l*100)}%`,"of the time shown"]]:t?.kind==="level"?[["Latest",tt(i[1],t,n)]]:[["Latest",tt(i[1],t)],["Lowest",tt(a,t)],["Highest",tt(s,t)],["Average",tt(l,t)]]}function nu(e,t,n,o,a){const s=e?.points?.[o];if(!s)return"";const[r,i,l,c]=s,d=e.room?e.room_name??e.room:e.label;let u=`${Nn(r,a)}: ${d} ${tt(i,t,n)}`;return n>60&&t?.kind==="gauge"&&l!==c&&(u+=`, between ${tt(l,t)} and ${tt(c,t)} in these ${So(n)}`),n>60&&t?.kind==="level"&&l!==c&&(u=`${Nn(r,a)}: ${d} ${tt(l,t)} to ${tt(c,t)} in these ${So(n)}`),`${u}.`}function ou(e,t,n=Jd){const o=[];for(const s of e?.series??[]){const r=t[s.metric];for(const[i,l,c,d]of s.points)o.push([i,bn(s),l,c,d,r])}o.sort((s,r)=>r[0]-s[0]||s[1].localeCompare(r[1]));const a=e?.step??60;return{total:o.length,rows:o.slice(0,n).map(([s,r,i,l,c,d])=>[Nn(s,e.timezone),r,tt(i,d,a),a>60&&d?.kind!=="state"?tt(l,d,60):Ra,a>60&&d?.kind!=="state"?tt(c,d,60):Ra])}}function au(e,t,n){if(!e)return{kind:"none",badge:"Not set up",line:"Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",details:[]};const o=e.queued??{},a=[["Sends to",`${e.endpoint}, ${e.protocol==="http/json"?"JSON":"protobuf"} over HTTP`]],s=o.metrics??0,r=o.logs??0;if(a.push(["Waiting to send",s||r?`${at(s,"minute","minutes")} of readings, ${at(r,"log record","log records")}`:"Nothing"]),a.push(["Sent",`${at(e.sent?.metrics??0,"data point","data points")}, ${at(e.sent?.logs??0,"log record","log records")}`]),e.dropped&&a.push(["Dropped",`${at(e.dropped,"item","items")}: the queue was full, so the oldest went first`,"warn"]),e.rejected&&a.push(["Rejected by the collector",at(e.rejected,"item","items"),"warn"]),e.status==="off")return{kind:"off",badge:"Off",line:"Turned off in the house file (export.otlp.enabled).",details:a};if(e.status==="failing"){const i=e.next_attempt?` Trying again ${Ks(Math.max(0,e.next_attempt-t))}, and keeping the data until then.`:" Retrying, and keeping the data until then.",l=e.last_success?` Last sent at ${_o(e.last_success,n)}, ${Vs(t-e.last_success)}.`:"";return{kind:"attention",badge:"Failing",line:`Can't send: ${e.last_error??"no answer"}.${i}${l}`,details:a}}return e.status==="waiting"?{kind:"waiting",badge:"Waiting",line:`Nothing sent yet.${e.next_attempt?` The next send is due ${Ks(Math.max(0,e.next_attempt-t))}.`:" The first send is due within a minute."}`,details:a}:{kind:"ok",badge:"Sending",line:`Last sent at ${_o(e.last_success,n)}, ${Vs(t-e.last_success)}.`,details:a}}const Js=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function su(e,t=4){const n=e/t,o=10**Math.floor(Math.log10(n||1));for(const a of[1,2,2.5,5,10])if(a*o>=n)return a*o;return 10*o}function ru(e,t){const n=e.step;if(t?.kind==="state")return{lo:0,hi:1,ticks:n>60?[[0,"0%"],[.5,"50%"],[1,"100%"]]:[[0,"Off"],[1,"On"]]};if(t?.kind==="level"){const i=t.levels??[];return{lo:0,hi:Math.max(1,i.length-1),ticks:i.map((l,c)=>[c,l])}}let o=1/0,a=-1/0;for(const i of e.series)for(const[,,l,c]of i.points)o=Math.min(o,l),a=Math.max(a,c);Number.isFinite(o)||(o=0,a=1),a-o<1e-9&&(o-=1,a+=1);const s=su(a-o);o=Math.floor(o/s)*s,a=Math.ceil(a/s)*s;const r=[];for(let i=o;i<=a+s/2;i+=s){const l=Math.round(i*1e3)/1e3,c=s<1?s<.1?2:1:0,d=t?.unit==="°C"?"°":t?.unit==="%"?"%":"";r.push([l,`${_n(l,c)}${d}`])}return{lo:o,hi:a,ticks:r}}function iu(e,t,n,o){const a=t-e,s=Math.max(2,Math.floor(o/80)),i=[3600,3*3600,6*3600,12*3600,86400,2*86400,5*86400,7*86400].find(g=>a/g<=s)??14*86400,l=[],c=Vo(e,n),d=Date.UTC(c.y,c.m-1,c.d,Number(c.H),Number(c.M))/1e3-Math.floor(e/60)*60;let u=Math.ceil((e+d)/i)*i-d;for(;u<=t;u+=i)l.push([u,i>=86400?Co(u,n):_o(u,n)]);return l}const Ft={left:46,right:14,top:12,bottom:26};function La(e,t,n,o){const a=t?.kind==="level"?58:Ft.left,s=Math.max(10,n-a-Ft.right),r=Math.max(10,o-Ft.top-Ft.bottom),i=ru(e,t),l=Math.max(1,e.to-e.from);return{left:a,w:s,h:r,y:i,x:c=>a+(c-e.from)/l*s,yv:c=>Ft.top+r-(c-i.lo)/Math.max(1e-9,i.hi-i.lo)*r}}function Ys(e,t,n,o){let a="",s=null;const r=n*2.5;for(const[i,l]of e.points){const c=t.x(i).toFixed(1),d=t.yv(l).toFixed(1);s===null||i-s[0]>r?a+=`M${c} ${d}`:o?a+=`H${c}V${d}`:a+=`L${c} ${d}`,s=[i,l]}return a}function lu(e,t,n){const o=[];let a=[];for(const s of e.points)a.length&&s[0]-a.at(-1)[0]>n*2.5&&(o.push(a),a=[]),a.push(s);return a.length&&o.push(a),o.filter(s=>s.length>1).map(s=>{const r=s.map(([l,,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`),i=s.slice().reverse().map(([l,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`);return`M${r.join("L")}L${i.join("L")}Z`}).join("")}function cu(e,t,{width:n,height:o,focus:a}){const s=La(e,t,n,o),r=e.timezone,i=t?.kind!=="gauge",l=[`<svg width="${n}" height="${o}" viewBox="0 0 ${n} ${o}" aria-hidden="true" focusable="false">`];for(const[u,g]of s.y.ticks){const p=s.yv(u).toFixed(1);l.push(`<line class="rd-grid" x1="${s.left}" x2="${s.left+s.w}" y1="${p}" y2="${p}"/>`),l.push(`<text class="rd-ytick" x="${s.left-6}" y="${p}" dy="0.32em" text-anchor="end">${Js(g)}</text>`)}const c=Ft.top+s.h;l.push(`<line class="rd-axis" x1="${s.left}" x2="${s.left+s.w}" y1="${c}" y2="${c}"/>`);for(const[u,g]of iu(e.from,e.to,r,s.w)){const p=s.x(u).toFixed(1);l.push(`<line class="rd-xmark" x1="${p}" x2="${p}" y1="${c}" y2="${c+4}"/>`),l.push(`<text class="rd-xtick" x="${p}" y="${c+17}" text-anchor="middle">${Js(g)}</text>`)}const d=e.series.find(u=>u.key===a)??e.series[0];if(d&&e.step>60&&t?.kind==="gauge"){const u=lu(d,s,e.step);u&&l.push(`<path class="rd-band" d="${u}"/>`)}for(const u of e.series)u!==d&&l.push(`<path class="rd-line rd-other" d="${Ys(u,s,e.step,i)}"/>`);return d&&l.push(`<path class="rd-line rd-ink" d="${Ys(d,s,e.step,i)}"/>`),l.push(`<line class="rd-cursor" x1="0" x2="0" y1="${Ft.top}" y2="${c}" visibility="hidden"/>`),l.push('<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>'),l.push(`<rect class="rd-hit" x="${s.left}" y="${Ft.top}" width="${s.w}" height="${s.h}"/>`),l.push("</svg>"),l.join("")}function du(e,t,n){const o=e.series.find(l=>l.key===n)??e.series[0];if(!o)return"Chart with no data.";const a=o.points,s=e.series.length>1?` ${at(e.series.length-1,"other series","other series")} shown thinner for comparison.`:"";if(!a.length)return`Line chart of ${bn(o)} with no data.${s}`;const i=ii(o,t,e.step).map(([l,c])=>`${l.toLowerCase()} ${c}`).join(", ");return`Line chart of ${bn(o)}, ${Co(e.from,e.timezone)} to ${Co(e.to,e.timezone)}, every ${So(e.step)}: ${i}.${s} Use the arrow keys to read each point.`}function uu({transport:e,isAuthError:t,onAuth:n}){let o=null,a=null,s={},r=!1,i=null,l=!1,c=0,d=null,u=null,g=0;const p={metric:"room.temperature",room:"",range:"24h",from:"",to:"",step:"auto"},f=()=>fe("data-chart"),x=()=>s[p.metric];function h(O,v){const S=fe(O);S.textContent!==v&&(S.textContent=v)}function b(O,v=""){const S=fe("data-note");S.hidden=!O,S.dataset.kind=v,h("data-note",O)}function w(){const O=new Set((o?.series??[]).map(M=>M.metric)),v=fe("data-metric"),S=[["room","Rooms"],["house","House"]].map(([M,j])=>{const Q=document.createElement("optgroup");Q.label=j;for(const L of o.metrics.filter(I=>I.scope===M&&O.has(I.metric))){const I=document.createElement("option");I.value=L.metric,I.textContent=L.label,Q.append(I)}return Q}).filter(M=>M.children.length);v.replaceChildren(...S),O.has(p.metric)||(p.metric=v.querySelector("option")?.value??""),v.value=p.metric}function k(){const O=x(),v=fe("data-room"),S=O?.scope!=="room",M=S?[]:(o?.rooms??[]).filter(Q=>o.series.some(L=>L.metric===p.metric&&L.room===Q.id)),j=document.createElement("option");j.value="",j.textContent=S?"Whole house":"Every room",v.replaceChildren(j,...M.map(Q=>{const L=document.createElement("option");return L.value=Q.id,L.textContent=Q.name,L})),(S||!M.some(Q=>Q.id===p.room))&&(p.room=""),v.value=p.room,v.disabled=S}function R(){for(const O of document.querySelectorAll("#data-range [data-range]"))O.setAttribute("aria-checked",String(O.dataset.range===p.range))}function T(){if(!o?.now||p.range==="custom")return;const O=js[p.range];fe("data-from").value=da(o.now-O,o.timezone),fe("data-to").value=da(o.now,o.timezone)}function D(){const O=new URLSearchParams;return p.metric&&O.set("metric",p.metric),p.room&&O.set("room",p.room),p.range==="custom"?(p.from&&O.set("from",p.from),p.to&&O.set("to",p.to)):(O.set("from",String(Math.floor(o.now-js[p.range]))),O.set("to",String(Math.ceil(o.now)))),O.set("step",p.step),O}function Z(){const O=a.series.find(j=>j.key===u),v=fe("data-stats"),S=O?ii(O,x(),a.step):[];v.hidden=!S.length;const M=a.series.length>1&&O;fe("data-stats-for").hidden=!M,h("data-stats-for",M?`Figures for ${bn(O)}, the line in ink.`:""),v.replaceChildren(...S.map(([j,Q,L])=>{const I=document.createElement("div"),J=document.createElement("dt");J.textContent=j;const oe=document.createElement("dd"),ve=document.createElement("span");if(ve.textContent=Q,oe.append(ve),L){const Le=document.createElement("span");Le.className="sub",Le.textContent=L,oe.append(Le)}return I.append(J,oe),I}))}function V(){const O=fe("data-legend");O.hidden=a.series.length<2,O.replaceChildren(...a.series.map(v=>{const S=document.createElement("li"),M=document.createElement("button");M.type="button",M.className="rd-key",M.dataset.key=v.key,M.setAttribute("aria-pressed",String(v.key===u));const j=document.createElement("span");return j.className="rd-swatch",j.setAttribute("aria-hidden","true"),M.append(j,document.createTextNode(v.room?v.room_name??v.room:v.label)),S.append(M),S}))}function ae(){const{total:O,rows:v}=ou(a,s);fe("data-table-body").replaceChildren(...v.map(M=>{const j=document.createElement("tr");return M.forEach((Q,L)=>{const I=document.createElement(L===0?"th":"td");L===0&&(I.scope="row"),I.textContent=Q,j.append(I)}),j}));const S=a.step>60;for(const M of document.querySelectorAll(".rd-table .rd-range-col"))M.hidden=!S;for(const M of fe("data-table-body").children)M.children[3].hidden=!S,M.children[4].hidden=!S;h("data-table-note",O>v.length?`The newest ${at(v.length,"row","rows")} of ${O.toLocaleString("en-GB")}. Download the CSV for all of them.`:`${at(O,"row","rows")}, newest first.`)}function C(O){const v=a?.series.find(Le=>Le.key===u),S=v?.points??[];if(!S.length){h("data-readout","");return}const M=O==null?S.length-1:Math.max(0,Math.min(S.length-1,O));h("data-readout",nu(v,x(),a.step,M,a.timezone));const j=f().querySelector("svg");if(!j)return;const Q=La(a,x(),c,Number(j.getAttribute("height"))),[L,I]=S[M],J=j.querySelector(".rd-cursor"),oe=j.querySelector(".rd-dot"),ve=O==null?"hidden":"visible";J.setAttribute("x1",Q.x(L)),J.setAttribute("x2",Q.x(L)),oe.setAttribute("cx",Q.x(L)),oe.setAttribute("cy",Q.yv(I)),J.setAttribute("visibility",ve),oe.setAttribute("visibility",ve)}function K(){const O=f(),v=Math.floor(O.clientWidth);if(!v||!a)return;c=v;const S=v<520?200:260;O.innerHTML=cu(a,x(),{width:v,height:S,focus:u}),O.setAttribute("aria-label",du(a,x(),u)),C(d)}function q(){const O=x(),v=a.series.some(S=>S.points.length);if(a.series.some(S=>S.key===u)||(u=(a.series.find(S=>S.points.length)??a.series[0])?.key??null,d=null),h("data-chart-h",eu(a,O,p.room?fe("data-room").selectedOptions[0]?.textContent:"")),h("data-meta",tu(a,p.range==="custom"?null:p.range)),fe("data-empty").hidden=v,fe("data-chart-wrap").hidden=!v,fe("data-downloads").hidden=!v,fe("data-table-toggle").hidden=!v,a.partial?b("Still indexing older readings, so part of this time may be missing for a few minutes.","cool"):b(""),!v){fe("data-stats").hidden=!0,fe("data-legend").hidden=!0;return}Z(),V(),ae(),r?K():c=0}function m(){const O=au(o?.export??null,Date.now()/1e3,o?.timezone??"UTC"),v=fe("data-export-badge");v.dataset.kind=O.kind,h("data-export-badge",O.badge),h("data-export-line",O.line),fe("data-export").dataset.kind=O.kind;const S=fe("data-export-list");S.hidden=!O.details.length,S.replaceChildren(...O.details.map(([M,j,Q])=>{const L=document.createElement("div");Q&&(L.dataset.kind=Q);const I=document.createElement("dt");I.textContent=M;const J=document.createElement("dd");return J.textContent=j,L.append(I,J),L}))}function P(){h("data-summary",Qd(o)),m();const O=!!o?.available;fe("data-body").hidden=!O,O&&(s=Object.fromEntries(o.metrics.map(v=>[v.metric,v])),w(),k(),R(),T(),ee())}async function F(){if(!o?.available||!p.metric)return;const O=++g;try{const v=await e.get(`data?${D()}`);if(O!==g)return;a=v,q()}catch(v){if(O!==g)return;if(t(v)){n();return}b(/HTTP 400/.test(String(v?.message))?`Not shown: ${String(v.message).replace(/^.*HTTP 400 /,"")}`:"Couldn't load the readings. Retrying…","warn")}}async function N(){if(!l){l=!0;try{o=await e.get("data/series"),P(),r&&await F()}catch(O){t(O)?n():r&&b("Couldn't load the readings. Retrying…","warn")}l=!1,W()}}function W(){clearTimeout(i),r&&(i=setTimeout(N,Kd))}function U(){d=null,p.range!=="custom"?N():F()}function ee(){const O=Zd(o,fe("data-search").value),v=fe("data-results"),S=fe("data-search").value.trim()!=="";if(v.hidden=!S,!!S){if(!O.length){const M=document.createElement("li");M.className="rd-none",M.textContent="No series match. Try a room name, or a word such as temperature, valve or burner.",v.replaceChildren(M);return}v.replaceChildren(...O.map(M=>{const j=document.createElement("li"),Q=document.createElement("button");return Q.type="button",Q.className="rd-result",Q.dataset.metric=M.metric,Q.dataset.room=M.room??"",Q.textContent=bn(M),j.append(Q),j}))}}function se(){fe("data-search").addEventListener("input",ee),fe("data-search").addEventListener("keydown",S=>{S.key==="Escape"&&(fe("data-search").value="",ee()),S.key==="Enter"&&(S.preventDefault(),fe("data-results").querySelector(".rd-result")?.click())}),fe("data-results").addEventListener("click",S=>{const M=S.target.closest?.(".rd-result");M&&(p.metric=M.dataset.metric,k(),p.room=M.dataset.room,fe("data-metric").value=p.metric,k(),u=null,fe("data-search").value="",ee(),fe("data-search").focus(),U())}),fe("data-metric").addEventListener("change",S=>{p.metric=S.target.value,k(),u=null,U()}),fe("data-room").addEventListener("change",S=>{p.room=S.target.value,u=null,U()}),fe("data-step").addEventListener("change",S=>{p.step=S.target.value,U()});for(const S of document.querySelectorAll("#data-range [data-range]"))S.addEventListener("click",()=>{p.range!==S.dataset.range&&(p.range=S.dataset.range,R(),T(),U())});for(const S of["data-from","data-to"])fe(S).addEventListener("change",()=>{p.range="custom",p.from=fe("data-from").value,p.to=fe("data-to").value,R(),U()});fe("data-legend").addEventListener("click",S=>{const M=S.target.closest?.(".rd-key");if(!(!M||M.dataset.key===u)){u=M.dataset.key,d=null;for(const j of fe("data-legend").querySelectorAll(".rd-key"))j.setAttribute("aria-pressed",String(j===M));Z(),K()}});const O=f();O.addEventListener("keydown",S=>{const j=a?.series.find(I=>I.key===u)?.points.length??0;if(!j)return;const Q=d??j-1,L={ArrowRight:Q+1,ArrowLeft:Q-1,Home:0,End:j-1,PageUp:Q-10,PageDown:Q+10}[S.key];L!=null&&(S.preventDefault(),d=Math.max(0,Math.min(j-1,L)),C(d))}),O.addEventListener("pointermove",S=>{const M=a?.series.find(oe=>oe.key===u),j=O.querySelector("svg");if(!M?.points.length||!j)return;const Q=La(a,x(),c,Number(j.getAttribute("height"))),L=S.clientX-j.getBoundingClientRect().left,I=a.from+(L-Q.left)/Q.w*(a.to-a.from);let J=0;for(let oe=1;oe<M.points.length;oe++)Math.abs(M.points[oe][0]-I)<Math.abs(M.points[J][0]-I)&&(J=oe);d=J,C(d)}),O.addEventListener("pointerleave",S=>{S.pointerType==="mouse"&&(d=null,C(null))}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&r&&Math.floor(O.clientWidth)!==c&&K()}).observe(O);const v=fe("data-table-toggle");v.addEventListener("click",()=>{const S=v.getAttribute("aria-pressed")!=="true";v.setAttribute("aria-pressed",String(S)),v.textContent=S?"Hide table":"Show as table",fe("data-table-wrap").hidden=!S}),fe("data-csv").addEventListener("click",()=>pe("csv")),fe("data-json").addEventListener("click",()=>pe("json"))}function de(O){const v=a?da(a.to,a.timezone).slice(0,10):"data";return`radiate-${p.metric}${p.room?`-${p.room}`:""}-${v}.${O}`}async function pe(O){const v=fe("data-dl-status");v.textContent="";try{let S;if(O==="json")S=new Blob([JSON.stringify(a,null,2)],{type:"application/json"});else{const j=D();j.set("format","csv"),S=new Blob([await e.text(`data?${j}`)],{type:"text/csv"})}const M=document.createElement("a");M.href=URL.createObjectURL(S),M.download=de(O),document.body.append(M),M.click(),M.remove(),setTimeout(()=>URL.revokeObjectURL(M.href),1e3),v.textContent=`Downloaded ${M.download}.`}catch(S){if(t(S)){n();return}v.textContent="Not downloaded. Check the connection and try again."}}return se(),{async available(){try{return o=await e.get("data/series"),P(),!!o.available}catch(O){return t(O)?null:/HTTP 404|not found/.test(String(O?.message))?!1:null}},show(){r=!0,N()},hide(){r&&(r=!1,clearTimeout(i))}}}const Re=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Bt=e=>e==null?"–":(Math.round(e*10)/10).toFixed(1),Gs=e=>`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ua=(e,t,n)=>`${e} ${e===1?t:n}`,Xs=new Set(["passive","unheated"]),et=.5,qt=14,It=10,Qs=/bed|bath|landing|en.?suite|nursery|study|loft|attic/i,Ma=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),Zs=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16));function Cn(e){const t=[12,15,17,19,22].map(o=>[o,Zs(Ma(`--t${o}`)||"#888888")]);if(e==null)return Zs(Ma("--hm-none")||"#cccccc");const n=Math.max(12,Math.min(22,e));for(let o=0;o<t.length-1;o++){const[a,s]=t[o],[r,i]=t[o+1];if(n<=r)return s.map((l,c)=>Math.round(l+(i[c]-l)*((n-a)/(r-a))))}return t.at(-1)[1]}const jt=(e,t=1)=>`rgb(${e.map(n=>Math.round(n*t)).join(",")})`,er=e=>jt(Cn(e)),ha=e=>{const t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},tr=e=>.2126*ha(e[0])+.7152*ha(e[1])+.0722*ha(e[2]),hu=[20,28,24];function li(e){const t=tr(e),n=(t+.05)/(tr(hu)+.05),o=1.05/(t+.05);return n>=o?"#141c18":"#ffffff"}function nr(e){const t=e.filter(r=>Qs.test(r.name)),n=e.filter(r=>!Qs.test(r.name)),o=t.length&&n.length?["Ground floor","First floor"]:["Ground floor"],a={},s=(r,i)=>r.forEach((l,c)=>{a[l.id]={floor:i,x:c%3*3,y:Math.floor(c/3)*3,w:3,d:3}});return o.length===2?(s(n,0),s(t,1)):s(e,0),{floors:o,rooms:a}}const pa=34,pu=Math.cos(Math.PI/6),ci=Math.sin(Math.PI/6),or=.34,fu=e=>Math.max(3.2,e*ci*.8),Ne=(e,t,n)=>[(e-t)*pu*pa,(e+t)*ci*pa-n*pa],lo=e=>e.map(t=>t.map(n=>n.toFixed(1)).join(",")).join(" ");function ar(e,t,{selected:n,interactive:o}){let a="",s="";const r=Ma("--hm-line");let i=0;for(const[c,d]of Object.entries(e.rooms))t.has(c)&&(i=Math.max(i,d.x+d.w+d.y+d.d));const l=fu(i);return e.floors.forEach((c,d)=>{const u=d*l,g=Object.entries(e.rooms).filter(([h,b])=>b.floor===d&&t.has(h)),p=Math.max(3,...g.map(([,h])=>h.x+h.w)),f=Math.max(3,...g.map(([,h])=>h.y+h.d));if(s+=`<polygon points="${lo([Ne(-.2,-.2,u),Ne(p+.2,-.2,u),Ne(p+.2,f+.2,u),Ne(-.2,f+.2,u)])}" fill="none" stroke="${r}" stroke-width="1.5"/>`,d>0)for(const[h,b]of[[-.2,-.2],[p+.2,-.2],[-.2,f+.2]]){const w=Ne(h,b,u),k=Ne(h,b,u-l+or);s+=`<line x1="${w[0]}" y1="${w[1]}" x2="${k[0]}" y2="${k[1]}" stroke="${r}" stroke-dasharray="2 4"/>`}const x=Ne(-.2,f+.2,u);s+=`<text class="hm-ftag" x="${x[0]-8}" y="${x[1]+4}" text-anchor="end">${Re(c)}</text>`,g.sort((h,b)=>h[1].x+h[1].y-(b[1].x+b[1].y)).forEach(([h,b])=>{const w=t.get(h),k=Cn(w.temperature),R=.05,T=b.x+R,D=b.y+R,Z=b.w-2*R,V=b.d-2*R,ae=u+or,C=[Ne(T,D,ae),Ne(T+Z,D,ae),Ne(T+Z,D+V,ae),Ne(T,D+V,ae)],K=[Ne(T+Z,D,u),Ne(T+Z,D+V,u),Ne(T+Z,D+V,ae),Ne(T+Z,D,ae)],q=[Ne(T,D+V,u),Ne(T+Z,D+V,u),Ne(T+Z,D+V,ae),Ne(T,D+V,ae)],m=Ne(T+Z/2,D+V/2,ae),P=li(k);let F="";if(w.calling||w.topup||w.role==="passive"){const U=Ne(T+.25,D+V-.15,ae),ee=Ne(T+Math.min(Z-.25,1.4),D+V-.15,ae);F=`<line class="hm-rad" x1="${U[0]}" y1="${U[1]}" x2="${ee[0]}" y2="${ee[1]}" stroke="${P}" stroke-width="3"/>`}const N=`${w.name}, ${w.temperature==null?"no reading":`${Bt(w.temperature)} degrees`}${w.calling?", heating":""}`,W=o?`tabindex="0" role="button" aria-pressed="${h===n}"`:"";a+=`<g class="hm-room" data-id="${Re(h)}" ${W} aria-label="${Re(N)}">
        <polygon points="${lo(K)}" fill="${jt(k,.62)}"/><polygon points="${lo(q)}" fill="${jt(k,.8)}"/>
        <polygon class="hm-top" points="${lo(C)}" fill="${jt(k)}"/>${F}
        <text class="hm-t" x="${m[0]}" y="${m[1]}" text-anchor="middle" fill="${P}">${Bt(w.temperature)}</text>
        ${Z>=1.4?`<text class="hm-n" x="${m[0]}" y="${m[1]+13}" text-anchor="middle" fill="${P}">${Re(w.name)}</text>`:""}</g>`})}),s+a}function sr(e){requestAnimationFrame(()=>{try{const t=e.getBBox();t.width&&e.setAttribute("viewBox",`${t.x-10} ${t.y-10} ${t.width+20} ${t.height+20}`)}catch{}})}function mu({modelEl:e,statusEl:t,planEl:n,transport:o,onSelect:a,onWeek:s,arrangeLock:r=()=>""}){let i=null,l=new Map,c=null,d=!1,u=!1,g=!1,p=0,f=null,x=null,h=0,b=null,w=null,k="";async function R(){try{const v=await o.call("GET","layout");v.status===200&&v.body?.layout?(c=v.body.layout,d=!0):v.status===404&&(u=!0)}catch{}ae()}function T(){clearTimeout(w),k="Saving…",D(),w=setTimeout(async()=>{if(u){k="This server can't keep a layout. Update Radiate to save it.",D();return}try{const v=await o.call("PUT","layout",c);d=v.status===200,k=d?"Saved.":`Not saved: ${typeof v.body=="string"?v.body:"the server refused it"}.`}catch{k="Not saved. Check the connection and move a room to try again."}D()},500)}function D(){const v=e.querySelector(".hm-save");v&&(v.textContent=k)}const Z=()=>Object.keys(c.rooms).filter(v=>l.has(v)),V=()=>[...l.keys()].filter(v=>!c.rooms[v]);function ae(){if(!c||!l.size)return;if(g){m();return}if(!e.querySelector(".hm-iso")){e.innerHTML=`
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
        </div>`,e.querySelector("[data-act=arrange]").addEventListener("click",()=>{g=!0,p=0,ae(),ee(),e.querySelector("#hm-model-h")?.focus()});const L=e.querySelector(".hm-iso");L.addEventListener("click",I=>{const J=I.target.closest(".hm-room");J&&C(J.dataset.id,J)}),L.addEventListener("keydown",I=>{const J=I.target.closest(".hm-room");J&&(I.key==="Enter"||I.key===" ")&&(I.preventDefault(),C(J.dataset.id,J))})}e.querySelector(".hm-ramp").style.background=`linear-gradient(90deg, ${[12,15,17,19,22].map(L=>jt(Cn(L))).join(", ")})`,e.querySelector(".hm-guess").hidden=d;const v=r(),S=e.querySelector("[data-act=arrange]");S.disabled=!!v,v?S.dataset.locked="":delete S.dataset.locked;const M=e.querySelector("#hm-arrange-lock");M.hidden=!v,M.textContent=v;const j=e.querySelector(".hm-iso"),Q=j.contains(document.activeElement)?document.activeElement.closest(".hm-room")?.dataset.id:null;j.innerHTML=ar(c,l,{selected:f,interactive:!0}),Q&&j.querySelector(`.hm-room[data-id="${CSS.escape(Q)}"]`)?.focus(),sr(j)}function C(v,S){a?.(v,S)}function K(){for(const v of e.querySelectorAll(".hm-room"))v.setAttribute("aria-pressed",String(v.dataset.id===f))}const q=40;function m(){const v=Z().filter(L=>c.rooms[L].floor===p);let S="";for(let L=0;L<=qt/et;L++)S+=`<line x1="${L*q*et}" y1="0" x2="${L*q*et}" y2="${It*q}" class="${L%2?"hm-g2":"hm-g1"}"/>`;for(let L=0;L<=It/et;L++)S+=`<line x1="0" y1="${L*q*et}" x2="${qt*q}" y2="${L*q*et}" class="${L%2?"hm-g2":"hm-g1"}"/>`;const M=v.map(L=>{const I=c.rooms[L],J=l.get(L),oe=Cn(J.temperature),ve=li(oe);return`<g class="hm-r2${L===f?" sel":""}" data-id="${Re(L)}" transform="translate(${I.x*q},${I.y*q})" tabindex="0" role="button"
          aria-label="${Re(J.name)}, ${I.w} by ${I.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${I.w*q}" height="${I.d*q}" fill="${jt(oe)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ve}">${Re(J.name)}</text>
        <text class="hm-r2s" x="7" y="${I.d*q-7}" fill="${ve}">${I.w} × ${I.d} m</text>
        <rect class="hm-handle" x="${I.w*q-14}" y="${I.d*q-14}" width="14" height="14"/></g>`}).join(""),j=V(),Q=f&&c.rooms[f]?.floor===p?l.get(f):null;e.innerHTML=`
      <div slot="header" class="wa-split wa-gap-s">
        <h2 class="wa-heading-m" id="hm-model-h" tabindex="-1">Arrange rooms</h2>
        <div class="wa-cluster wa-gap-xs">
          <wa-button size="s" appearance="outlined" data-act="reset">Start again</wa-button>
          <wa-button size="s" variant="brand" data-act="done">Done</wa-button>
        </div>
      </div>
      <div class="wa-stack wa-gap-s">
        <div class="wa-cluster wa-gap-2xs hm-floors" role="group" aria-label="Floor">
          ${c.floors.map((L,I)=>`<button type="button" class="wa-size-s ${I===p?"wa-brand":"wa-outlined"}" data-floor="${I}" aria-pressed="${I===p}">${Re(L)}</button>`).join("")}
          ${c.floors.length<6?'<button type="button" class="wa-size-s wa-plain" data-act="add-floor">Add floor</button>':""}
        </div>
        <div class="wa-cluster wa-gap-s wa-align-items-end">
          <wa-input size="s" label="Floor name" maxlength="40" value="${Re(c.floors[p])}" data-act="rename"></wa-input>
          ${c.floors.length>1&&!v.length?'<wa-button size="s" appearance="plain" data-act="remove-floor">Remove this floor</wa-button>':""}
        </div>
        <svg class="hm-plan2d" viewBox="0 0 ${qt*q} ${It*q}" aria-label="Plan of ${Re(c.floors[p])}">${S}${M}</svg>
        <div class="wa-cluster wa-gap-xs wa-align-items-center hm-tray">
          <span class="wa-caption-m wa-color-text-quiet">${j.length?"Not placed yet:":"Every room is placed."}</span>
          ${j.map(L=>`<button type="button" class="wa-size-s wa-outlined hm-chip" data-add="${Re(L)}">Place ${Re(l.get(L).name)}</button>`).join("")}
          ${Q?`<button type="button" class="wa-size-s wa-plain" data-act="unplace">Take ${Re(Q.name)} off the plan</button>`:""}
        </div>
        <p class="help-line">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
        <p class="hm-save wa-caption-m wa-color-text-quiet" role="status">${Re(k)}</p>
      </div>`,P()}function P(){const v=e;v.querySelector("[data-act=done]").addEventListener("click",()=>{g=!1,e.innerHTML="",ae(),ee(),e.querySelector("[data-act=arrange]")?.focus()}),v.querySelector("[data-act=reset]").addEventListener("click",()=>{c=nr([...l.values()]),p=0,T(),m(),ee()});for(const L of v.querySelectorAll("[data-floor]"))L.addEventListener("click",()=>{p=Number(L.dataset.floor),m()});v.querySelector("[data-act=add-floor]")?.addEventListener("click",()=>{c.floors.push(c.floors.length===1?"First floor":c.floors.length===2?"Second floor":`Floor ${c.floors.length+1}`),p=c.floors.length-1,T(),m(),ee()}),v.querySelector("[data-act=remove-floor]")?.addEventListener("click",()=>{c.floors.splice(p,1);for(const L of Object.values(c.rooms))L.floor>p&&(L.floor-=1);p=Math.max(0,p-1),T(),m(),ee()}),v.querySelector("[data-act=rename]").addEventListener("change",L=>{const I=String(L.target.value??"").trim();I&&(c.floors[p]=I,T(),m(),ee())});for(const L of v.querySelectorAll("[data-add]"))L.addEventListener("click",()=>{const I=L.dataset.add;c.rooms[I]={floor:p,...N(p)},f=I,T(),m(),ee(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus()});v.querySelector("[data-act=unplace]")?.addEventListener("click",()=>{delete c.rooms[f],T(),m(),ee()});const S=v.querySelector(".hm-plan2d"),M=L=>{const I=S.createSVGPoint();return I.x=L.clientX,I.y=L.clientY,I.matrixTransform(S.getScreenCTM().inverse())},j=L=>Math.round(L/et)*et;S.addEventListener("pointerdown",L=>{const I=L.target.closest(".hm-r2");if(!I||b)return;const J=I.dataset.id,oe=c.rooms[J],ve=M(L);f=J,b={id:J,pointer:L.pointerId,resize:L.target.classList.contains("hm-handle"),ox:ve.x/q-oe.x,oy:ve.y/q-oe.y,moved:!1},S.setPointerCapture(L.pointerId);for(const Le of S.querySelectorAll(".hm-r2"))Le.classList.toggle("sel",Le.dataset.id===J)}),S.addEventListener("pointermove",L=>{if(!b||L.pointerId!==b.pointer)return;const I=c.rooms[b.id],J=M(L);b.resize?(I.w=Math.min(qt-I.x,Math.max(1,j(J.x/q-I.x))),I.d=Math.min(It-I.y,Math.max(1,j(J.y/q-I.y)))):(I.x=Math.max(0,Math.min(qt-I.w,j(J.x/q-b.ox))),I.y=Math.max(0,Math.min(It-I.d,j(J.y/q-b.oy)))),b.moved=!0,F(S,b.id),W()});const Q=L=>{if(!b||L.pointerId!==b.pointer)return;const{id:I,moved:J}=b;b=null,J&&T(),m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus({preventScroll:!0})};S.addEventListener("pointerup",Q),S.addEventListener("pointercancel",Q),S.addEventListener("keydown",L=>{const I=L.target.closest(".hm-r2");if(!I)return;const J={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[L.key];if(L.key==="Enter"||L.key===" "){L.preventDefault(),f=I.dataset.id,m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(f)}"]`)?.focus();return}if(!J)return;L.preventDefault();const oe=c.rooms[I.dataset.id];L.shiftKey?(oe.w=Math.min(qt-oe.x,Math.max(1,oe.w+J[0]*et)),oe.d=Math.min(It-oe.y,Math.max(1,oe.d+J[1]*et))):(oe.x=Math.max(0,Math.min(qt-oe.w,oe.x+J[0]*et)),oe.y=Math.max(0,Math.min(It-oe.d,oe.y+J[1]*et))),f=I.dataset.id,F(S,I.dataset.id),I.setAttribute("aria-label",`${l.get(I.dataset.id).name}, ${oe.w} by ${oe.d} metres, at ${oe.x}, ${oe.y}.`),W(),T()})}function F(v,S){const M=c.rooms[S],j=v.querySelector(`.hm-r2[data-id="${CSS.escape(S)}"]`);if(!j)return;j.setAttribute("transform",`translate(${M.x*q},${M.y*q})`);const Q=j.querySelector(".hm-body");Q.setAttribute("width",M.w*q),Q.setAttribute("height",M.d*q);const L=j.querySelector(".hm-handle");L.setAttribute("x",M.w*q-14),L.setAttribute("y",M.d*q-14);const I=j.querySelector(".hm-r2s");I.setAttribute("y",M.d*q-7),I.textContent=`${M.w} × ${M.d} m`}function N(v){const S=Z().map(M=>c.rooms[M]).filter(M=>M.floor===v);for(let M=0;M<=It-2;M+=et)for(let j=0;j<=qt-2;j+=et)if(!S.some(Q=>j<Q.x+Q.w&&j+2>Q.x&&M<Q.y+Q.d&&M+2>Q.y))return{x:j,y:M,w:2,d:2};return{x:0,y:0,w:2,d:2}}function W(){const v=t.querySelector(".hm-preview");v&&(v.innerHTML=ar(c,l,{selected:f,interactive:!1}),sr(v))}function U(){let v=t.querySelector(".hm-live");return v||(t.innerHTML=`<h2 slot="header" class="wa-heading-m hm-status-h">The house now</h2>
        <div class="wa-stack wa-gap-m">
          <div class="hm-live wa-stack wa-gap-m"></div>
          <p class="help-line hm-help">The big number is rooms that want heat, out of the rooms Radiate controls. <a href="#guide/now">What the house now shows</a></p>
        </div>`,v=t.querySelector(".hm-live")),t.querySelector(".hm-help").hidden=g,t.querySelector(".hm-status-h").textContent=g?"Live model":"The house now",v}function ee(){if(!i)return;const v=U();if(g){v.innerHTML=`
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="help-line">${ua(c.floors.length,"floor","floors")}, ${Z().length} of ${ua(l.size,"room","rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`,W();return}const S=[...l.values()],M=S.filter(ge=>!Xs.has(ge.role)),j=M.filter(ge=>ge.calling),Q=S.filter(ge=>ge.temperature!=null),L=i.telemetry??{},I=L.simulated||L.boiler_linked!==!1,J=i.boiler;let oe;i.mode==="off"?oe="Heating is off.":i.mode==="frost"?oe="Frost protection only.":j.length?I?J.state==="firing"?oe=`${j.length===1?"room is":"rooms are"} heating. Burner on.`:oe=`${j.length===1?"room wants":"rooms want"} heat.`:oe=`${j.length===1?"room wants":"rooms want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:oe="No room needs heat right now.";const ve=M.map(ge=>ge.target).filter(ge=>ge!=null),Le=ve.length?gu(ve):null,Ke=ge=>(Math.max(12,Math.min(22,ge))-12)/10*100,Te=[...Q].sort((ge,lt)=>ge.temperature-lt.temperature),tn=Q.map(ge=>`<rect x="${Ke(ge.temperature)}%" y="14" width="4" height="26" rx="2" fill="${jt(Cn(ge.temperature))}" transform="translate(-2,0)"><title>${Re(ge.name)} ${Bt(ge.temperature)}°</title></rect>`).join(""),z=[12,14,16,18,20,22].map(ge=>`<text class="hm-axis" x="${Ke(ge)}%" y="58" text-anchor="middle">${ge}</text>`).join(""),ne=Le!=null?`<rect x="${Ke(Le)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>`:"",te=Te.length?`Coldest ${Te[0].name} ${Bt(Te[0].temperature)}°, warmest ${Te.at(-1).name} ${Bt(Te.at(-1).temperature)}°.${Le!=null?` Most heated rooms aim for ${Bt(Le)}°.`:""}`:"No readings yet.",ue=!L.simulated&&(i.alert_details??[]).some(ge=>ge.code==="driver.shelly"),ye=I?ue?se("fire","Boiler","Not reachable","Radiate can't see or switch the boiler right now.","warning","text"):se("fire","Boiler",{idle:"Idle",lead:"Opening valves",firing:"Firing",rest:"Resting"}[J.state]??"–",J.state==="firing"?`${Math.round(J.burn_elapsed_s/60)} min so far`:`${ua(J.starts_last_hour,"start","starts")} in the last hour`,J.state==="firing"?"brand":"neutral","text"):se("fire","Boiler","Not linked","Radiate can't switch it until the relay is set up.","neutral","text"),Ie=L.dry_run?se("eye","Dry run",String(L.intended_writes??0),"valve and boiler changes held back","warning"):se("sliders","Mode",{auto:"Auto",frost:"Frost",off:"Off"}[i.mode]??i.mode,i.settings?.demand_mode?`${wu(i.settings.demand_mode)} demand`:"","neutral","text"),Se=se("microchip","Devices",String(h),h?h===1?"needs attention":"need attention":"all reporting well",h>0?"warning":"neutral"),De=M.map(ge=>ge.model?.confidence).filter(ge=>ge!=null),qe=De.length?Math.round(De.reduce((ge,lt)=>ge+lt,0)/De.length*100):null,Me=se("graduation-cap","Learning",qe==null?"–":`${qe}%`,qe==null?"waiting for the first burns":qe<50?"how sure Radiate is of each room, on average":"average confidence in each room","neutral");v.innerHTML=`
      <div class="hm-hero">
        <div class="hm-big readout">${j.length}<small>/${M.length}</small></div>
        <p class="wa-heading-s">${Re(oe)}</p>
      </div>
      <div class="hm-spread wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">Where every room sits</span>
        <svg role="img" aria-label="${Re(te)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${ne}${tn}${z}</svg>
        <span class="wa-caption-m wa-color-text-quiet">${Re(te)}</span>
      </div>
      <div class="hm-cells">${ye}${Ie}${Se}${Me}</div>
      ${de()}`}function se(v,S,M,j,Q,L="readout"){const I=L==="readout"?`<span class="hm-value readout">${Re(M)}</span>`:`<span class="hm-value hm-word">${Re(M)}</span>`;return`<div class="hm-cell" data-variant="${Q}">
      <span class="wa-cluster wa-gap-xs wa-caption-m wa-color-text-quiet"><wa-icon name="${v}" class="hm-cell-icon"></wa-icon>${Re(S)}</span>
      ${I}<span class="wa-caption-s wa-color-text-quiet">${Re(j)}</span></div>`}function de(){const v=new Map;for(const j of l.values()){if(Xs.has(j.role)||j.next_setpoint==null||j.next_in_min==null)continue;const Q=j.next_in_min;v.has(Q)||v.set(Q,[]),v.get(Q).push(j)}const S=[...v.entries()].sort((j,Q)=>j[0]-Q[0]).slice(0,3);return S.length?`<div class="hm-next wa-stack wa-gap-2xs"><span class="wa-caption-m wa-color-text-quiet">Coming up</span><ul>${S.map(([j,Q])=>{const L=new Map;for(const J of Q)L.has(J.next_setpoint)||L.set(J.next_setpoint,[]),L.get(J.next_setpoint).push(J.name);const I=[...L.entries()].map(([J,oe])=>{const ve=oe.length<2?oe[0]:`${oe.slice(0,-1).join(", ")} and ${oe.at(-1)}`,Le=Q.find(Te=>Te.next_setpoint===J)?.target,Ke=Le!=null&&J<Le?"cools to":oe.length>1?"warm to":"warms to";return`${ve} ${oe.length>1&&Ke==="cools to"?"cool to":Ke} ${Bt(J)}°`}).join(". ");return`<li><time class="readout">${Gs((i.minute_of_day+j)%1440)}</time><span>${Re(I)}.</span></li>`}).join("")}</ul></div>`:""}function pe(){if(!x?.rooms?.length||!i){n.hidden=!0;return}n.hidden=!1;const v=x.now?.weekday??0,S=i.minute_of_day??x.now?.minute??0,M=x.rooms.map(j=>{const Q=[...j.days[v]?.transitions??[]].sort((J,oe)=>J.minute-oe.minute);if(!Q.length)return"";Q[0].minute>0&&Q.unshift({minute:0,setpoint:Q.at(-1).setpoint});const L=Q.map((J,oe)=>{const ve=oe+1<Q.length?Q[oe+1].minute:1440;return ve<=J.minute?"":`<span style="width:${(ve-J.minute)/1440*100}%;background:${jt(Cn(J.setpoint))}" title="${Bt(J.setpoint)}° from ${Gs(J.minute)}"></span>`}).join(""),I=j.days[v]?.text??"";return`<span class="hm-pname">${Re(j.name)}</span><div class="hm-strip" role="img" aria-label="${Re(`${j.name} today: ${I}`)}">${L}<i class="hm-now" style="left:${S/1440*100}%"></i></div>`}).join("");n.querySelector(".hm-tl")||(n.innerHTML=`<div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m">Today's plan</h2>
          <wa-button size="s" appearance="plain" data-act="week"><wa-icon slot="end" name="arrow-down"></wa-icon>Week schedules</wa-button>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each strip is a room's day, coloured by the temperature it aims for. The upright line is now. <a href="#guide/schedules">Change the weekly times</a></p>
          <div class="hm-tl"></div>
        </div>`,n.querySelector("[data-act=week]").addEventListener("click",()=>s?.())),n.querySelector(".hm-tl").innerHTML=`${M}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`}function O(v){i=v;const S=new Map;for(const j of v.rooms)S.set(j.id,j);const M=!l.size;l=S,c||(c=nr(v.rooms)),M&&R(),g?W():ae(),ee(),pe()}return{update:O,week(v){x=v,pe()},devices(v){h=v,ee()},select(v){f=v,g||K()},redraw(){!g&&e.querySelector(".hm-iso")&&ae(),ee(),pe()},get editing(){return g}}}function gu(e){const t=new Map;for(const n of e)t.set(n,(t.get(n)??0)+1);return[...t.entries()].sort((n,o)=>o[1]-n[1]||o[0]-n[0])[0][0]}const wu=e=>e.charAt(0).toUpperCase()+e.slice(1),rr="radiate.guideNote";function bu({root:e}){const t=n=>n?e.querySelector(`#g-${CSS.escape(n)} > h3`):null;return{show(){},hide(){},reveal(n){const o=t(n);return o?(o.focus({preventScroll:!0}),o.scrollIntoView({block:"start"}),!0):!1}}}function yu({note:e,tab:t}){let n=!1;try{n=localStorage.getItem(rr)==="dismissed"}catch{}e.hidden=n;const o=()=>{e.hidden=!0;try{localStorage.setItem(rr,"dismissed")}catch{}};e.querySelector("[data-act=open]").addEventListener("click",o),e.querySelector("[data-act=dismiss]").addEventListener("click",()=>{o(),t&&!t.hidden&&t.focus()})}const ct=e=>document.getElementById(e),ir=15e3,vu={zigbee:"Zigbee sensor",home_assistant:"Home Assistant",both:"Both, sensor first",eco:"Eco",comfort:"Comfort",normal:"Normal",internal_sensor_only:"Valve's own sensor",passive:"Bypass",unheated:"No radiator",episodic:"Open fire",continuous:"Range cooker",in_use:"In use",occasional:"Occasional",unused:"Unused"},ku={app:"Set here",house_file:"House file",default:"Default"},un=e=>vu[e]??String(e),Oa=(e,t,n)=>`${e} ${e===1?t:n}`,di=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,rn=e=>`st-${e.replace(/[^a-z0-9_]/gi,"-")}`;function Na(e,t){const n=Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));return t?t==="°C"?`${n}°`:t==="%"?`${n}%`:`${n} ${t}`:n}function Wt(e,t){if(t==null||t==="")return"–";switch(e.kind){case"number":case"integer":return Na(Number(t),e.unit);case"bool":return t?"On":"Off";case"list":return Array.isArray(t)&&t.length?t.join(", "):"–";case"use":return typeof t=="string"?un(t):`Weekdays ${un(t.weekdays).toLowerCase()}, weekend ${un(t.weekend).toLowerCase()}`;case"choice":return un(t);default:return String(t)}}function $u(e){const t=[e.help];return(e.kind==="number"||e.kind==="integer")&&e.min!=null&&e.max!=null&&t.push(`${Na(e.min,null)} to ${Na(e.max,e.unit)}.`),!e.secret&&e.default!=null&&e.default!==""&&t.push(`Default ${Wt(e,e.default)}.`),e.restart&&t.push("Used after a restart."),t.join(" ")}function xu(e){return e.secret?e.is_set?e.source==="house_file"&&e.env.length?`Set from ${e.env.join(", ")}`:e.source==="app"?"Set here":"Set in the house file":"Not set":e.source==="house_file"&&e.env.length?`House file, from ${e.env.join(", ")}`:ku[e.source]??e.source}function Su(e){return e.secret?e.house_file_set?"Use the house file's":"Clear it":e.house_file_set?`Use the house file's, ${Wt(e,e.house_file_value)}`:e.default!=null?`Use the default, ${Wt(e,e.default)}`:"Use the default"}function _u(e,t){const n=e.pending_restart.length;if(!n)return"";const o=e.pending_restart.map(t);return`Restart Radiate to use ${Oa(n,"changed setting","changed settings")}: ${di(o)}.`}function Cu(e,t){return e.length&&t.length?"Saved. Some changes are in use now; restart Radiate for the rest.":t.length?"Saved. Restart Radiate to use it.":e.length?"Saved. In use now.":"Saved."}function lr(e,t){switch(e.kind){case"number":case"integer":{const n=String(t).trim();if(!n)return null;const o=Number(n.replace(",","."));return Number.isFinite(o)?o:n}case"list":{const n=String(t).split(/[,\s]+/).map(o=>o.trim()).filter(Boolean);return n.length?n:null}case"secret":return t===""?void 0:t;case"text":case"choice":return String(t).trim()===""?null:String(t).trim();default:return t}}const Eu=(e,t)=>JSON.stringify(e??null)===JSON.stringify(t??null);function ui(e){if(!e.secret)return e.source==="default"?null:e.value}function le(e,t={},...n){const o=document.createElement(e);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="class"?o.className=s:a==="text"?o.textContent=s:a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n)a&&o.append(a);return o}function Tu(e,t,n,o){const a=le("div",{class:"seg",role:"radiogroup","aria-label":e});let s=n;const r=t.map(([l,c])=>{const d=le("button",{type:"button",role:"radio",text:c});return d.dataset.value=JSON.stringify(l),d.addEventListener("click",()=>{s=l,i(),o()}),d.addEventListener("keydown",u=>{const g=r.indexOf(d),p=u.key==="ArrowRight"||u.key==="ArrowDown"?1:u.key==="ArrowLeft"||u.key==="ArrowUp"?-1:0;if(!p)return;u.preventDefault();const f=r[(g+p+r.length)%r.length];f.click(),f.focus()}),a.append(d),d}),i=()=>{for(const l of r){const c=l.dataset.value===JSON.stringify(s);l.setAttribute("aria-checked",String(c)),l.tabIndex=c?0:-1}r.some(l=>l.tabIndex===0)||(r[0].tabIndex=0)};return i(),{node:a,get:()=>s,focus:()=>(r.find(l=>l.tabIndex===0)??r[0]).focus()}}function cr(e,t,n,o,a){const s=le("select",{id:e,"aria-describedby":a});for(const[r,i]of t)s.append(le("option",{value:r,text:i}));return n!=null&&!t.some(([r])=>r===n)&&s.append(le("option",{value:n,text:un(n)})),s.value=n??"",s.addEventListener("change",o),s}function Au(e,t,n,o){const a=ui(e);if(e.kind==="bool"){const i=[[!0,"On"],[!1,"Off"]];e.optional&&i.unshift([null,"Not set"]);const l=Tu(e.label,i,e.optional?a:a??e.default,o);return l.node.setAttribute("aria-describedby",n),l.node.id=t,{node:l.node,get:()=>l.get(),focus:l.focus}}if(e.kind==="choice"){const i=e.choices.map(c=>[c,un(c)]);(e.optional||a==null)&&i.unshift(["",e.optional?"Not set":`Default, ${Wt(e,e.default)}`]);const l=cr(t,i,a,o,n);return{node:l,get:()=>lr(e,l.value),focus:()=>l.focus()}}if(e.kind==="use"){const i=[["","Not set"],...e.choices.map(g=>[g,un(g)])],l=typeof a=="string"?[a,a]:a?[a.weekdays,a.weekend]:["",""],c=le("div",{class:"st-use",role:"group",id:t,"aria-describedby":n}),d=["Weekdays","Weekend"].map((g,p)=>{const f=`${t}-${p}`,x=cr(f,i,l[p]||"",o);return c.append(le("span",{class:"st-use-part"},le("label",{for:f,text:g}),x)),x});return{node:c,get:()=>{const[g,p]=d.map(f=>f.value);return!g&&!p?null:g===p?g:{weekdays:g||null,weekend:p||null}},focus:()=>d[0].focus()}}const s=le("input",{id:t,"aria-describedby":n,autocomplete:"off",spellcheck:"false"});return e.kind==="number"||e.kind==="integer"?(s.type="text",s.inputMode=e.kind==="integer"||(e.min??0)>=0?e.kind==="integer"?"numeric":"decimal":"text",s.className="num",s.value=a==null?"":String(a),a==null&&e.default!=null&&(s.placeholder=String(e.default))):e.kind==="secret"?(s.type="password",s.autocomplete="new-password",s.placeholder=e.is_set?"Set. Type to replace it":"Not set"):e.kind==="list"?(s.type="text",s.value=Array.isArray(a)?a.join(", "):"",!s.value&&Array.isArray(e.default)&&(s.placeholder=e.default.join(", "))):(s.type="text",s.value=a==null?"":String(a),!s.value&&e.default!=null&&(s.placeholder=String(e.default))),s.addEventListener("input",o),{node:e.unit&&(e.kind==="number"||e.kind==="integer")?le("span",{class:"unit"},s,le("span",{text:e.unit})):s,get:()=>lr(e,s.value),focus:()=>s.focus(),input:s}}function Ru({transport:e,isAuthError:t,onAuth:n,onOpenSetup:o,onShowSchedules:a,moreSections:s=()=>[]}){let r=null,i=!1,l=!1;const c=new Map,d=new Set;let u=null,g=!1;const p=new Map,f=async(m,P,F)=>{try{return await e.call(m,P,F)}catch(N){throw t(N)&&n(),N}};async function x(){if(!l){l=!0;try{const m=await f("GET","settings/config");m.status===200&&(r=m.body,b())}catch{ct("settings-summary").textContent="Couldn't load the settings. Try again in a moment."}finally{l=!1}}}function h(m){return p.get(m)??m}function b(){p.clear();for(const U of r.sections){for(const ee of U.fields??[])p.set(ee.path,ee.label);for(const ee of U.rooms??[])for(const se of ee.fields)p.set(se.path,`${ee.name} ${se.label.toLowerCase()}`)}const m=r.saved.length;ct("settings-summary").textContent=m?`${Oa(m,"setting is","settings are")} set here, over the house file.`:"Every setting comes from the house file or its default.",ct("settings-where").textContent=r.saved_at?`Changes are saved to ${r.saved_at}. The house file isn't changed.`:"In the demo, changes are not saved to a file and end when the demo does.";const P=ct("settings-restart");P.hidden=!r.pending_restart.length,ct("settings-restart-text").textContent=_u(r,h);const F=ct("settings-problems");if(F.hidden=!r.problems.length,ct("settings-problems-text").textContent=r.problems.length?`The settings saved here weren't used at the last start, so the house file's apply. ${r.problems.map(U=>`${U.path?`${h(U.path)}: `:""}${U.message}`).join(" ")} Change or reset them below.`:"",w(m),ct("settings-toc").replaceChildren(...[...r.sections,...s()].map(U=>le("li",{},le("a",{href:`#settings/${U.id}`,text:U.title})))),ct("settings-sections").replaceChildren(...r.sections.map(k)),u){const U=document.getElementById(u);u=null,U?.focus()}}function w(m){const P=ct("settings-all");if(P.hidden=!m,P.replaceChildren(),!m)return;if(!g){const W=le("button",{type:"button",class:"btn",id:"settings-all-btn",text:"Use the house file for every setting"});W.addEventListener("click",()=>{g=!0,u="settings-all-go",b()}),P.append(W);return}const F=le("button",{type:"button",class:"btn btn-primary",id:"settings-all-go",text:"Use the house file"}),N=le("button",{type:"button",class:"link",text:"Keep them"});F.addEventListener("click",()=>K(null,"all",F)),N.addEventListener("click",()=>{g=!1,u="settings-all-btn",b()}),P.append(le("p",{text:`The ${Oa(m,"setting","settings")} set here go back to the house file's values.`}),le("div",{class:"st-actions"},F,N))}function k(m){const P=le("section",{class:"st-sec",id:`s-${m.id}`,"aria-labelledby":`s-${m.id}-h`}),F=le("h3",{class:"section-h",id:`s-${m.id}-h`,tabindex:"-1",text:m.title});P.append(F);const N=le("p",{class:"help-line st-help",text:`${m.help} `});if(m.guide&&N.append(le("a",{class:"help-link",href:`#guide/${m.guide}`,text:`About ${m.title.toLowerCase()}`})),P.append(N),m.link)P.append(R(m));else if(m.per_room)for(const W of m.rooms)P.append(T(`rooms.${W.id}`,W.name,W.fields,!0));else P.append(T(m.id,m.title,m.fields,!1));return P}function R(m){const P=le("div",{class:"card st-plate st-linked"});if(m.link==="household"){const F=le("button",{type:"button",class:"btn btn-primary",text:"Open the household setup"});F.addEventListener("click",N=>o(N)),P.append(F)}else if(m.link==="schedules"){const F=le("button",{type:"button",class:"btn",text:"Show the schedules"});F.addEventListener("click",()=>a()),P.append(F)}return P}function T(m,P,F,N){const W=rn(m),U=F.filter(J=>J.source==="app").length,ee=N?le("details",{class:"card st-plate st-room",id:W}):le("div",{class:"card st-plate",id:W});if(N){const J=le("summary",{},le("span",{class:"st-room-name",text:P}));U&&J.append(le("span",{class:"badge","data-kind":"set",text:`${U} set here`})),F.some(oe=>oe.pending_restart)&&J.append(le("span",{class:"badge","data-kind":"restart",text:"Restart to use"})),ee.append(J),ee.open=d.has(m)||c.has(m),ee.addEventListener("toggle",()=>{ee.open?d.add(m):d.delete(m)})}const se=le("form",{class:"st-form",novalidate:!0,"aria-label":N?P:`${P} settings`}),de=new Map,pe=le("div",{class:"st-foot"}),O=le("button",{type:"submit",class:"btn btn-primary",id:`${W}-save`,text:"Save changes",hidden:!0}),v=le("button",{type:"button",class:"link",text:"Cancel changes",hidden:!0}),S=le("p",{class:"st-status",id:`${W}-status`,role:"status",tabindex:"-1"}),M=le("div",{class:"st-confirm",hidden:!0}),j=()=>F.filter(J=>{const oe=de.get(J.path);if(!oe)return!1;const ve=oe.get();return J.secret?ve!==void 0:!Eu(ve,ui(J))}),Q=()=>{const J=j().length;O.hidden=!J,O.disabled=!1,v.hidden=!J,O.textContent=J>1?`Save ${J} changes`:"Save changes",M.hidden=!0};for(const J of F)se.append(D(J,de,Q));v.addEventListener("click",()=>{c.delete(m),u=`${W}-status`,b()}),se.addEventListener("submit",async J=>{J.preventDefault();const oe=j();if(!oe.length)return;const ve=Object.fromEntries(oe.map(Te=>[Te.path,de.get(Te.path).get()])),Le=oe.filter(Te=>Te.hardware&&!Te.secret),Ke=Le.map(Te=>`${h(Te.path)}, ${Wt(Te,ve[Te.path])}`);Le.length?V(M,Ke,()=>C(m,ve,!0,O,se),O,!0):C(m,ve,!1,O,se)});const L=le("button",{type:"button",class:"link",text:N?`Use the house file for ${P}`:"Use the house file for this section",hidden:!U});L.addEventListener("click",()=>K(m,m,L,M));const I=c.get(m);return I&&I.until>Date.now()&&(S.textContent=I.text,S.dataset.kind=I.kind??""),pe.append(le("div",{class:"st-actions"},O,v,L),M,S),se.append(pe),ee.append(se),ee}function D(m,P,F){const N=rn(m.path),W=le("div",{class:"st-field","data-source":m.source}),U=le("div",{class:"st-head"}),ee=m.kind==="bool"||m.kind==="use"?le("span",{class:"st-label",id:`${N}-label`,text:m.label}):le("label",{class:"st-label",for:N,text:m.label});U.append(ee,le("span",{class:"st-src","data-source":m.source,text:xu(m)})),m.pending_restart&&U.append(le("span",{class:"tag",text:"Restart to use"})),W.append(U);const se=`${N}-help`,de=`${N}-err`;W.append(le("p",{class:"field-help",id:se,text:$u(m)}));const pe=le("div",{class:"st-control"});if(m.locked)pe.append(le("p",{class:"st-fixed",text:`${Wt(m,m.value)}. ${m.locked}`}));else if(!m.editable)pe.append(le("p",{class:"st-fixed"},le("code",{text:Wt(m,m.value)}),document.createTextNode(" Only the house file sets this.")));else{const O=Au(m,N,`${se} ${de}`,F);(m.kind==="bool"||m.kind==="use")&&O.node.setAttribute("aria-labelledby",`${N}-label`),P.set(m.path,O),pe.append(O.node)}if(W.append(pe),m.source==="app"&&!m.locked){const O=m.secret?null:m.house_file_set?`House file: ${Wt(m,m.house_file_value)}.`:null,v=le("button",{type:"button",class:"link",id:`${N}-revert`,text:Su(m)});v.addEventListener("click",()=>K(m.path,Z(m.path),v)),W.append(le("p",{class:"st-file"},O?document.createTextNode(`${O} `):null,v))}return W.append(le("p",{class:"field-error",id:de,hidden:!0})),W}const Z=m=>{const P=m.split(".");if(P[0]==="rooms"&&P.length===3)return`rooms.${P[1]}`;const F=r.sections.find(N=>(N.fields??[]).some(W=>W.path===m));return F?F.id:m};function V(m,P,F,N,W=!1){const U=W?P:P.map(h);m.replaceChildren(),m.hidden=!1;const ee=le("button",{type:"button",class:"btn btn-primary",text:"Save and allow it"}),se=le("button",{type:"button",class:"link",text:"Cancel"});ee.addEventListener("click",()=>{m.hidden=!0,F()}),se.addEventListener("click",()=>{m.hidden=!0,N?.focus()}),m.append(le("p",{class:"st-confirm-text",text:`This lets Radiate write to the boiler or the valves: ${di(U)}. Check the wiring and the valves before you go on.`}),le("div",{class:"st-actions"},ee,se)),ee.focus()}function ae(m,P,F,N){for(const pe of m.querySelectorAll(".field-error"))pe.hidden=!0,pe.textContent="";for(const pe of m.querySelectorAll("[aria-invalid]"))pe.removeAttribute("aria-invalid");const W=[],U=[];for(const pe of F??[]){const O=m.querySelector(`#${CSS.escape(rn(pe.path))}-err`);O?(O.textContent=pe.message,O.hidden=!1,m.querySelector(`#${CSS.escape(rn(pe.path))}`)?.setAttribute("aria-invalid","true"),W.push(pe)):U.push(pe)}const ee=m.querySelector(".st-status"),se=U.map(pe=>`${pe.path?`${h(pe.path)}: `:""}${pe.message}`).join(" ");ee.textContent=`${N??"Not saved."}${se?` ${se}`:""}`,ee.dataset.kind="error";const de=W[0]?m.querySelector(`#${CSS.escape(rn(W[0].path))}`):null;de&&de.tagName!=="DIV"?de.focus():ee.focus()}async function C(m,P,F,N,W){N.disabled=!0;try{const U=await f("PUT","settings/config",F?{values:P,confirm:!0}:{values:P});if(U.status===409){const ee=W.querySelector(".st-confirm");V(ee,U.body.confirm??[],()=>C(m,P,!0,N,W),N),N.disabled=!1;return}if(U.status!==200){const ee=typeof U.body=="object"&&U.body?U.body:{message:String(U.body)};ae(W,m,ee.errors,ee.message),N.disabled=!1;return}q(m,U.body,Cu(U.body.applied??[],U.body.restart??[]))}catch{const U=W.querySelector(".st-status");U.textContent="Not saved. Check the connection and try again.",U.dataset.kind="error",N.disabled=!1}}async function K(m,P,F,N){const W=m==null?"settings/config":`settings/config/${encodeURIComponent(m)}`,U=async ee=>{F.disabled=!0;try{const se=await f("DELETE",W,ee?{confirm:!0}:void 0);if(se.status===409){const de=N??F.closest("form")?.querySelector(".st-confirm")??ct("settings-all");F.disabled=!1,V(de,se.body.confirm??[],()=>U(!0),F);return}if(se.status!==200){const de=typeof se.body=="object"&&se.body?se.body:{message:String(se.body)},pe=F.closest("form");if(F.disabled=!1,pe)ae(pe,P,de.errors,de.message??"Not changed.");else{const O=(de.errors??[]).map(v=>`${h(v.path)}: ${v.message}`).join(" ");ct("settings-all").append(le("p",{class:"st-status","data-kind":"error",role:"alert",text:`${de.message??"Not changed."} ${O}`}))}return}g=!1,q(P,se.body,"Back to the house file.")}catch{F.disabled=!1}};U(!1)}function q(m,P,F){r=P,c.set(m,{text:F,until:Date.now()+ir}),setTimeout(()=>{const N=c.get(m);if(N&&N.until<=Date.now()){c.delete(m);const W=document.getElementById(`${rn(m)}-status`);W&&(W.textContent="")}},ir+50),u=m==="all"?"settings-h":`${rn(m)}-status`,b()}return{async available(){try{const m=await f("GET","settings/config");return m.status!==200?!1:(r=m.body,!0)}catch{return!1}},show(){i=!0,r&&b(),x()},hide(){i=!1},reveal(m){const P=m?document.getElementById(`s-${m}-h`):null;return P?(P.focus({preventScroll:!0}),P.scrollIntoView({block:"start"}),!0):!1},get open(){return i}}}const hi=5e3;function Ko({holdMs:e=hi,now:t=()=>Date.now()}={}){let n,o=!1,a=0,s=0,r=0,i="";const l=()=>{o=!1,n=void 0};return{press(c){return n=c,o=!0,i="",s+=1,a=s,s},done(c){c===s&&(a=0,r=t())},failed(c,d){c===s&&(a=0,l(),i=d)},shown(c){return o&&!a&&(c===n||t()-r>e)&&l(),o?n:c},get busy(){return a!==0},get error(){return i},clearError(){i=""}}}async function Lu(e,t,{send:n,paint:o,refresh:a,later:s=setTimeout}){const r=e.press(t);o();try{await n()}catch(i){return e.failed(r,no(i)),o(),!1}return e.done(r),o(),s(o,hi+50),await a(),!0}function no(e){const t=String(e?.message??"");return/HTTP 403/.test(t)&&/csrf/.test(t)?"Not saved: your sign-in has expired. Reload the page.":/HTTP 403/.test(t)?"Not saved: ask an admin.":"Not saved. Try again."}const pi=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Mu=10,fi=.4,Ou=.75,Nu=180,zu=["dry_burner","dry_relay"],co=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,At=e=>`${e.toFixed(1)}°`,dr=e=>e.toLocaleString("en-GB");function ur(e){if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`}function Ht(e){return e>=.095?e.toFixed(1):e.toFixed(2)}function Pu(e,t=new Date().getFullYear()){const[n,o,a]=e.split("-").map(Number);return`${a} ${pi[o-1]}${n===t?"":` ${n}`}`}const Du=e=>e===1?"once":e===2?"twice":`${e} times`;function hr(e){return e<fi?"still learning":e<Ou?"fairly sure of":"sure of"}function qu(e){const t=hr(e.confidence),n=hr(e.loss_confidence??e.confidence);return t===n?`Radiate is ${t} how fast this room warms and cools.`:`Radiate is ${t} how fast this room warms, and ${n} how fast it cools.`}const Iu=e=>e.samples===0||e.confidence<fi;function Hu(e,t={}){const n=e.model,o=[],a=(h,b,w)=>o.push({key:h,label:b,text:w}),s=e.temperature,r=t.outdoor,i=n.heating_kph;if(i){let h=`With the boiler on and the valve open, about ${Ht(i.with_house)}° an hour while most of the house is heating, or ${Ht(i.alone)}° an hour when it's the only room taking heat.`;if(s!=null&&r!=null){const b=i.with_house-n.b*(s-r)+n.d;h+=b>.05?` Now, with ${At(r)} outside, it would gain about ${Ht(b)}° an hour after the heat it loses.`:` Now, with ${At(r)} outside, it loses heat about as fast as the radiator adds it while the house heats.`}a("warms","Warms up",h)}else a("warms","Warms up",`The radiator can warm it by up to about ${Ht(n.a)}° an hour with the boiler on and the valve fully open.`);let l=`With the heating off, it cools by about ${Ht(n.b*Mu)}° an hour when it's 10° colder outside than in.`;s!=null&&r!=null&&s-r>=1&&(l+=` Now, at ${At(s)} inside and ${At(r)} outside, that's about ${Ht(n.b*(s-r))}° an hour.`),a("cools","Cools down",l),e.heat_source==="continuous"?a("steady","Other heat",`The range cooker adds about ${Ht(Math.max(0,n.d))}° an hour on its own, all day, so the radiator is needed less.`):n.d>=.15&&a("steady","Other heat",`Something other than the radiator adds about ${Ht(n.d)}° an hour, such as a warm room next door.`);const c=Math.round(n.arrival_lag_min);a("lag","Heat arrives",n.lag_measured?`About ${c} min after the boiler fires, timed over ${n.lag_measured===1?"its last warm-up":`its last ${n.lag_measured} warm-ups`}.`:`Not timed yet, so Radiate allows ${c} min for the hot water to reach the radiator.`);let d;if(n.samples===0)d="Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";else{d=qu(n);const h=n.learned?.since?` since ${Pu(n.learned.since,t.year)}`:"",b=n.samples>=120?`, about ${dr(Math.round(n.samples/60))} hours of learning`:"";d+=` From ${dr(n.samples)} ${n.samples===1?"reading":"readings"}${h}${b}.`}e.role==="internal_sensor_only"&&(d+=" This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.");const u=n.learned?.updates??{},g=Object.values(u).reduce((h,b)=>h+b,0),p=zu.reduce((h,b)=>h+(u[b]??0),0);g&&p===g&&(d+=" All of it was learned in dry run, while Radiate watched the heating without running it."),a("sure","How sure",d);let f="Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";const x=n.warm_up;if(x&&t.minute_of_day!=null){const h=x.min==null||x.min<60?x.min:Math.round(x.min/5)*5,b=co((t.minute_of_day+x.in_min)%1440),w=x.quiet_until_min??null,k=w==null?null:(w-t.minute_of_day+1440)%1440,R=w==null?"as early as it can":`as soon as quiet hours end at ${co(w)}`;if(x.min==null)f+=` It can't tell yet how long this room takes to reach ${At(x.to_c)} by ${b}, so it starts ${R}.`;else if(x.min>Nu)f+=` To get from ${At(x.from_c)} to ${At(x.to_c)} by ${b}, it reckons this room needs about ${ur(h)}, longer than it looks ahead, so it starts ${R}.`;else{const T=x.in_min-h,D=T<=0?"now":`at about ${co((t.minute_of_day+T)%1440)}`;if(f+=` To get from ${At(x.from_c)} to ${At(x.to_c)} by ${b}, it allows about ${ur(h)}, so it `,w!=null&&T<k){const Z=k+h>x.in_min?`, and may get there after ${b}`:"";f+=`would start ${D}. Quiet hours hold it until ${co(w)}, so it starts then${Z}.`}else f+=`starts warming ${D}.`}}n.lockshield!=null&&(f+=n.lockshield_learned===!1?` Between burns, the valve's opening limit rests at ${n.lockshield}% until Radiate has seen enough burns to set it.`:` Between burns, the valve's opening limit rests at ${n.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`),a("uses","Used for",f),n.relearns>0&&a("relearned","Relearned",`Radiate relearned this room ${Du(n.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);for(const h of t.notes??[]){const b=new Date(h.at*1e3),w=`${b.getDate()} ${pi[b.getMonth()]}`,k=h.code==="learning.reset"||h.code==="learning.invalidated"?"Started again":"Carried over";a(`note-${h.at}`,k,`${w}. ${h.message}`)}return o}function Bu(e){return`In the model's own terms: heating gain ${e.a.toFixed(2)} K/h, loss rate ${e.b.toFixed(3)} per hour per degree, other heat ${e.d.toFixed(2)} K/h, arrival lag ${Math.round(e.arrival_lag_min)} min, confidence ${Math.round(e.confidence*100)}%.`}const ot=e=>document.getElementById(e),mi="–",fa=50,Fu={"radiate.security.login":"Signed in","radiate.security.login.failed":"Sign-in refused","radiate.security.logout":"Signed out","radiate.security.session.ended":"Session ended","radiate.security.request.refused":"Request refused","radiate.security.access.denied":"Not allowed","radiate.security.lockout.started":"Sign-in locked","radiate.security.lockout.ended":"Sign-in unlocked","radiate.security.user.changed":"User changed","radiate.security.config.changed":"Changed","radiate.security.control.used":"Control used","radiate.security.login.config":"Started"},ju={password:"password",oidc:"single sign-on",saml:"SAML",token:"API token",ingress:"Home Assistant",cli:"command line",session:"signed in",open:"open server"},Wu=e=>Fu[e.event]??e.event;function Uu(e){const t=e.attributes??{};return e.user?e.user:ju[t["radiate.auth.method"]]??mi}function Vu(e,t){const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e*1e3))}function Ku(e,t){const n=e.events.length,o=t.outcome==="failure"?"refusals":t.outcome==="success"?"allowed events":"events",a=t.user?` for ${t.user}`:"",s=`Kept for ${e.retention_days} days.`;return n?`The latest ${n===1?"event":`${n} ${o}`}${a}, newest first. ${s}`:`No ${o}${a} yet. ${s}`}function Ju({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=!1,s=[],r=null,i=!1;const l={outcome:"",user:""},c=f=>{const x=new URLSearchParams({limit:String(fa)});return l.outcome&&x.set("outcome",l.outcome),l.user&&x.set("user",l.user),f&&x.set("before",String(f)),`audit?${x}`};function d(f){const x=document.createElement("tr");f.outcome==="failure"&&(x.dataset.kind="warn");const h=(k,R,T)=>{const D=document.createElement(k);return D.textContent=R,T&&(D.className=T),D},b=h("th",Vu(f.at));b.scope="row";const w=h("td",Wu(f));if(f.outcome==="failure"){const k=h("span","Refused","badge");k.dataset.kind="refused",w.append(" ",k)}return x.append(b,w,h("td",Uu(f)),h("td",f.source??mi),h("td",f.message,"sl-detail")),x}function u(f){const x=ot("security-user"),h=["",...f],b=[...x.options].map(w=>w.value);h.join(`
`)!==b.join(`
`)&&(x.replaceChildren(...h.map(w=>{const k=document.createElement("option");return k.value=w,k.textContent=w||"Everyone",k})),x.value=h.includes(l.user)?l.user:"")}function g(){r&&(u(r.users??[]),ot("security-summary").textContent=Ku({...r,events:s},l),ot("security-body").replaceChildren(...s.map(d)),ot("security-table").hidden=!s.length,ot("security-more").hidden=!i)}async function p(f=!1){const x=f&&s.length?s.at(-1).id:null;try{const h=await e.get(c(x));r=h,s=f?[...s,...h.events]:h.events,i=h.events.length===fa,ot("security-error").hidden=!0,g()}catch(h){if(t(h)){n();return}ot("security-error").hidden=!1}}for(const f of ot("security-outcome").querySelectorAll("button"))f.addEventListener("click",()=>{if(f.getAttribute("aria-checked")!=="true"){for(const x of ot("security-outcome").querySelectorAll("button"))x.setAttribute("aria-checked",String(x===f));l.outcome=f.dataset.outcome,p()}});return ot("security-user").addEventListener("change",f=>{l.user=f.target.value,p()}),ot("security-more").addEventListener("click",()=>p(!0)),ot("security-refresh").addEventListener("click",()=>p()),{async available(){try{r=await e.get(c()),s=r.events,i=s.length===fa,a=!0}catch{a=!1}return ot("s-security-log").hidden=!a,a&&g(),a},get offered(){return a},show(){o=!0,a&&p()},hide(){o=!1},get open(){return o}}}const fo=e=>new URL(`api/v1/${e}`,document.baseURI).toString(),_=e=>document.getElementById(e),Lt=e=>e==null?"–":`${e.toFixed(1)}°`,Eo=e=>`${Math.max(0,Math.round(e/60))} min`,Jo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ft=(e,t,n)=>`${e} ${e===1?t:n}`,ln=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,To=e=>{if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`},as=matchMedia("(prefers-reduced-motion: reduce)"),Ut=new Map;let be=null,za=null,mt=null;class Ue extends Error{}const Pa="radiate.token";function Yu(){try{return localStorage.getItem(Pa)||""}catch{return""}}function Gu(e){try{e?localStorage.setItem(Pa,e):localStorage.removeItem(Pa)}catch{}}function Xu(){let e=Yu(),t="",n=null,o=null,a=2e3,s=null,r=null;const i=(d={},u="GET")=>{const g=e?{...d,Authorization:`Bearer ${e}`}:{...d};return t&&u!=="GET"&&u!=="HEAD"&&(g["X-CSRF-Token"]=t),g},l=async(d,u={})=>{const g=await fetch(fo(d),{...u,headers:i(u.headers,u.method)});if(g.status===401)throw new Ue(d);if(!g.ok)throw new Error(`${d}: HTTP ${g.status} ${await g.text()}`);return g},c=()=>{o=null;const d=new URL(fo("stream"));d.protocol=d.protocol==="https:"?"wss:":"ws:";try{n=new WebSocket(d)}catch{n=null,r("lost"),o=setTimeout(c,a);return}const u=n;u.onopen=()=>{e&&u.send(JSON.stringify({token:e}))},u.onmessage=g=>{a=2e3,r("live"),s(JSON.parse(g.data))},u.onclose=g=>{if(n===u&&(n=null),g.code===4401){r("auth");return}r("lost"),o=setTimeout(c,a),a=Math.min(a*2,15e3)},u.onerror=()=>u.close()};return{hasToken:()=>!!e,setCsrf(d){t=d||""},setToken(d){e=d,Gu(d)},house:async()=>(await l("house")).json(),state:async()=>(await l("state")).json(),get:async d=>(await l(d)).json(),text:async d=>(await l(d)).text(),async post(d,u){await l(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)})},async call(d,u,g){const p={method:d,headers:i(g===void 0?{}:{"Content-Type":"application/json"},d)};g!==void 0&&(p.body=JSON.stringify(g));const f=await fetch(fo(u),p);if(f.status===401)throw new Ue(u);const x=await f.text();let h=x;try{h=JSON.parse(x)}catch{}return{status:f.status,body:h}},subscribe(d,u){s=d,r=u,!n&&!o&&c()}}}const Ce=document.documentElement.dataset.transport==="demo"?(await Ki(async()=>{const{createDemoTransport:e}=await import("./demo.js");return{createDemoTransport:e}},[],import.meta.url)).createDemoTransport():Xu();async function zn(e,t){try{await Ce.post(e,t)}catch(n){throw n instanceof Ue?it():console.error(n),n}}const Yo=(e,t,n,o,a)=>Lu(e,t,{send:()=>zn(n,o),paint:a,refresh:jn});function gi(e,t){e.hidden=!t,e.textContent=t}const Da={viewer:0,household:1,admin:2};let Ao="admin";const qa=e=>(Da[Ao]??-1)>=Da[e],Fn=e=>qa(e)?"":Ao==="household"?"Ask an admin":"Read only";function eo(e,t,n){const o=Fn(n);for(const a of e)a&&(a.disabled=!!o,o?a.dataset.locked="":delete a.dataset.locked);return t&&(t.hidden=!o,t.textContent=o),!!o}function Qu(){eo([_("mode"),_("demand")],_("controls-lock"),"household"),eo([_("boost")],_("boost-lock"),"household")}const ss=e=>e.reason_code==="demand.pooled";function wi(e){return e.role==="passive"?["Bypass, not controlled",""]:e.role==="unheated"?["No radiator",""]:e.fire?["Fire lit","fire"]:e.preheating?["Preheating","preheat"]:ss(e)?["Waiting for a burn","pooled"]:e.calling?["Heating","calling"]:e.topup&&e.extend===!0?["Topping up","extend"]:e.topup&&e.extend===!1?["Heat sink","sink"]:e.topup?["Topped up","sink"]:e.temperature!=null&&e.target!=null&&e.temperature>=e.target-.3?["Comfortable","ok"]:["Waiting",""]}const Zu={calling:"brand",fire:"brand",extend:"brand",preheat:"warning",pooled:"warning",back:"warning",stale:"warning",ok:"success",sink:"cool",away:"cool"};function Ro(e,t){const n=Zu[t]??"neutral";return n==="cool"?X`<wa-badge class="radiate-cool" appearance="filled-outlined">${e}</wa-badge>`:X`<wa-badge variant=${n} appearance=${n==="neutral"?"outlined":"filled-outlined"}>${e}</wa-badge>`}const bi={fire:"learning paused: fire",fire_holdoff:"learning paused: fire cooling",window:"learning paused: window",shower:"learning paused: shower",cooker_spike:"learning paused: cooking",unexplained_heat:"learning paused: extra heat (sun or guests?)",store_recovery:"learning paused: hot water",heat_unknown:"learning paused: no boiler reading",setpoint_change:"settling",no_data:"gathering data",trv_offline:"TRV offline"},ma=new Map;function yi(e){return ma.has(e)||ma.set(e,Ko()),ma.get(e)}const vi=e=>!!(e.fire_switch??e.fire);function eh(e){const t=yi(e.id),n=!t.shown(vi(Ut.get(e.id)??e));Yo(t,n,`rooms/${e.id}/fire`,{lit:n},is).then(o=>o&&Un(n?`${e.name}: fire lit. Its radiator is closed.`:`${e.name}: fire out.`))}const ki=5,$i=28,th=600,nh=5e3,ga=new Map;function Yt(e){return ga.has(e)||ga.set(e,{pending:null,timer:null,expiry:null,error:"",clearing:!1}),ga.get(e)}function Go(e){const t=Yt(e.id);return t.pending!=null?t.pending:e.override?.setpoint!=null&&!t.clearing?e.override.setpoint:e.setpoint??e.target??null}function oh(e,t){const n=Ut.get(e);if(!n||!Number.isFinite(t))return;const o=Yt(e),a=Go(n)??20,s=Math.min($i,Math.max(ki,Math.round(t*2)/2));if(s===a){is();return}o.pending=s,o.error="",o.clearing=!1,clearTimeout(o.timer),clearTimeout(o.expiry),o.timer=setTimeout(()=>ah(e),th),wt()}async function ah(e){const t=Yt(e);t.timer=null;const n=t.pending;try{await zn(`rooms/${e}/setpoint`,{setpoint:n})}catch(a){t.pending===n&&(t.pending=null,t.error=no(a)),wt();return}t.expiry=setTimeout(()=>{t.pending===n&&!t.timer&&(t.pending=null,wt())},nh);const o=Ut.get(e);o&&t.pending===n&&Un(`${o.name} held at ${Lt(n)}.`),jn()}async function sh(e){const t=Yt(e);clearTimeout(t.timer),t.timer=null,t.pending=null,t.error="",t.clearing=!0,wt();try{await zn(`rooms/${e}/setpoint`,{setpoint:null})}catch(o){t.clearing=!1,t.error=no(o),wt();return}const n=Ut.get(e);n&&Un(`${n.name} follows its schedule again.`),jn()}async function jn(){try{cs(await Ce.state())}catch{}}function rh(e){return e.until==="cleared"?"Held until cleared":e.expires_in_min==null?"Held until the next change":e.until==="duration"?`Held for ${To(e.expires_in_min)}`:be?`Held until ${Jo((be.minute_of_day+e.expires_in_min)%1440)}`:"Held until the next change"}const Wn=new Set(["passive","unheated"]);function xi(e){const t=mt?.rooms?.find(n=>n.id===e.id);return t?t.controllable:!Wn.has(e.role)}function ih(e){const t=Yt(e.id);t.pending!=null&&!t.timer&&e.override?.setpoint===t.pending&&(t.pending=null,clearTimeout(t.expiry)),t.clearing&&!e.override&&(t.clearing=!1)}function lh(e){let t=e.reason||"";if(ss(e)&&(t="Waiting to share a burn with other rooms."),!e.calling&&e.topup&&e.extend===!0&&(t="Topped up now so it does not need a second burn soon."),!e.calling&&e.topup&&e.extend===!1&&(t="Opened so the burner's heat has somewhere to go."),!t&&e.role==="passive"&&(t="Manual valve, always open: counted as the system's open path."),!t&&e.role==="unheated"&&(t="No radiator here. Temperature recorded, not controlled."),!t&&e.heat_source==="continuous"&&(t="Range cooker heat is learned as a steady background."),!t&&e.next_setpoint!=null&&e.next_in_min!=null&&be){const n=(be.minute_of_day+e.next_in_min)%1440;t=`Next ${e.next_setpoint.toFixed(1)}° at ${Jo(n)}.`}return t}function ch(e){if(e.model){const t=e.learning?bi[e.learning]||e.learning:"learning";return t[0].toUpperCase()+t.slice(1)}return e.humidity!=null?`${e.humidity}% RH`:""}function dh(e){return e.valve?.untrusted?e.valve.leaking?"Valve may not be closing: radiator warmed while shut.":e.valve.misses?`Valve may be stuck: radiator stayed cold for ${ft(e.valve.misses,"burn","burns")}.`:"Valve may be stuck: radiator not warming.":""}let Ge=null;const Gt=matchMedia("(min-width: 75rem)"),Xo=matchMedia("(max-width: 40rem)"),xt=_("room-drawer");let Ia=null,wa=null;const uh=_("toast"),hh={success:{icon:"circle-check"},neutral:{icon:"circle-info"},warning:{icon:"triangle-exclamation"}};function Un(e,t="success"){try{uh.create(e,{variant:t,duration:5e3,icon:hh[t]?.icon})}catch{}}function to(e,t=null){if(Ge=Ge===e?null:e,en.select(Ge),wt(),!Ge){Gt.matches&&wa?.focus?.(),wa=null;return}if(Gt.matches){wa=t,requestAnimationFrame(()=>_("room-panel").querySelector("h2")?.focus({preventScroll:!0}));const o=_("room-panel"),a=o.getBoundingClientRect().top;(a<0||a>innerHeight-120)&&o.scrollIntoView({block:"nearest",behavior:as.matches?"auto":"smooth"});return}Ia=t,xt.placement=Xo.matches?"bottom":"end",xt.open=!0}function Si(){Ge&&to(Ge)}xt.addEventListener("wa-after-hide",e=>{e.target===xt&&(Gt.matches||(Ge=null,en.select(null),wt(),Ia?.focus?.(),Ia=null))});Gt.addEventListener("change",()=>{Gt.matches?xt.open=!1:Ge&&(xt.placement=Xo.matches?"bottom":"end",xt.open=!0),wt()});Xo.addEventListener("change",()=>wt());document.addEventListener("keydown",e=>{e.key==="Escape"&&Ge&&Gt.matches&&!e.defaultPrevented&&_("room-panel").contains(document.activeElement)&&Si()});function rs(e){const t=new Map;for(const n of e.alert_details??[]){if(!n.room_id)continue;const o=e.rooms.find(s=>s.id===n.room_id);if(!o)continue;const a=n.message.startsWith(`${o.name}: `)?n.message.slice(o.name.length+2):n.message;t.has(o.id)||t.set(o.id,{room:o,texts:[]}),t.get(o.id).texts.push(a)}for(const n of e.rooms)n.temperature==null&&!t.has(n.id)&&t.set(n.id,{room:n,texts:["no reading"]});return[...t.values()]}function pr(e,t){const[n,o]=wi(e),a=xi(e),s=a?Go(e):null,r=Wn.has(e.role),i=e.id===Ge,l=a&&(Yt(e.id).pending!=null||e.override?.setpoint!=null&&!Yt(e.id).clearing),c=t.get(e.id);return{r:e,label:n,kind:o,sp:s,observed:r,on:i,held:l,need:c}}function ph(e){const t=new Map(rs(be).map(a=>[a.room.id,a.texts])),n=(a,s)=>to(s,a.currentTarget),o=a=>a.need?X`<wa-icon class="room-flag" name="triangle-exclamation" label="Needs attention: ${a.need.join(", ")}"></wa-icon>`:$e;return Xo.matches?X`<ul class="room-list" aria-labelledby="rooms-h">${e.map(a=>{const s=pr(a,t);return X`<li>
        <button type="button" class="room-item" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
          <span class="room-item-top">
            <span class="room-name"><span class="swatch" style="--swatch:${er(a.temperature)}" aria-hidden="true"></span><strong>${a.name}</strong>${o(s)}</span>
            ${Ro(s.label,s.kind)}
          </span>
          <span class="room-item-facts">
            <span><span class="fact-label">Now</span> <strong class="readout">${Lt(a.temperature)}</strong></span>
            ${s.sp!=null?X`<span><span class="fact-label">${s.held?"Held at":"Set to"}</span> <strong class="readout">${Lt(s.sp)}</strong></span>`:$e}
            ${!s.observed&&a.opening!=null?X`<span><span class="fact-label">Valve</span> <strong class="readout">${a.opening}%</strong></span>`:$e}
          </span>
        </button>
      </li>`})}</ul>`:X`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${e.map(a=>{const s=pr(a,t);return X`<tr class=${s.on?"selected":""} data-idle=${String(!(a.calling||a.topup))} @click=${r=>{r.target.closest("button")||to(a.id,r.currentTarget.querySelector("button"))}}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
            <span class="swatch" style="--swatch:${er(a.temperature)}" aria-hidden="true"></span><span class="room-btn-name">${a.name}</span>${o(s)}</button></th>
          <td class="num readout">${Lt(a.temperature)}</td>
          <td class="num readout">${s.sp==null?X`<span class="wa-color-text-quiet">–</span>`:X`${s.held?X`<wa-icon class="held-icon" name="hand" label="Held"></wa-icon> `:$e}${Lt(s.sp)}`}</td>
          <td>${s.observed||a.opening==null?X`<span class="wa-color-text-quiet">–</span>`:X`
            <span class="valve"><wa-progress-bar value=${a.opening} label="${a.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${a.opening}%</span></span>`}</td>
          <td>${Ro(s.label,s.kind)}</td>
        </tr>`})}</tbody>
    </table>
  </wa-scroller>`}function fr(e,t,n){const o=Go(t);if(oh(t.id,(o??20)+n),!(e.detail>0)||as.matches)return;e.currentTarget.parentElement.querySelector(".step-value")?.animate([{transform:`translateY(${n>0?6:-6}px)`,opacity:.4},{transform:"translateY(0)",opacity:1}],{duration:180,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}function fh(e,t,n){return X`<div class="stepper" role="group" aria-label="${e.name} setpoint">
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t<=ki} @click=${o=>fr(o,e,-.5)}>
      <wa-icon name="minus" label="Lower ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
    <output class="step-value readout" aria-live="polite" aria-atomic="true">${Lt(t)}</output>
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t>=$i} @click=${o=>fr(o,e,.5)}>
      <wa-icon name="plus" label="Raise ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
  </div>`}function mr(e,{inDrawer:t}){const[n,o]=wi(e),a=xi(e),s=Yt(e.id),r=Fn("household"),i=!!r,l=a?Go(e):null,c=a&&s.pending==null&&!s.clearing&&e.override?.setpoint!=null,d=a&&s.pending!=null,u=Wn.has(e.role),g=!(e.calling||e.topup),p=e.heat_source==="episodic",f=yi(e.id),x=(be?.learning_notes??[]).filter(V=>V.room_id===e.id),h=e.model?Hu(e,{outdoor:be?.outdoor,minute_of_day:be?.minute_of_day,notes:x}):[],b=e.model?Iu(e.model):!1,w=dh(e),k=lh(e),R=rs(be).find(V=>V.room.id===e.id)?.texts.filter(V=>V!=="no reading")??[],T=[];e.humidity!=null&&T.push(["Humidity",`${Math.round(e.humidity)}%`]),!a&&e.setpoint!=null&&!u&&T.push(["Setpoint",Lt(e.setpoint)]);const D=ch(e);if(e.model){const V=e.learning?bi[e.learning]||e.learning:"learning now";T.push(["Learning",(V[0].toUpperCase()+V.slice(1)).replace(/^Learning paused: /,"Paused: ")])}const Z=s.error?"":c?rh(e.override):d?"Sending…":"From the schedule";return X`
    <div class="room-detail" data-room=${e.id}>
      <div class="room-detail-head">
        <div class="wa-stack wa-gap-2xs">
          ${t?$e:X`<h2 class="wa-heading-l" id="room-panel-h" tabindex="-1">${e.name}</h2>`}
          <div class="wa-cluster wa-gap-xs">
            ${Ro(n,o)}
            ${c?X`<wa-tag size="s" class="radiate-cool">Held</wa-tag>`:$e}
          </div>
        </div>
        ${t?$e:X`<wa-button appearance="plain" size="s" class="panel-close" @click=${Si}><wa-icon name="xmark" label="Close ${e.name}"></wa-icon></wa-button>`}
      </div>

      ${k?X`<p class="reason">${k}</p>`:$e}

      <div class="readouts">
        <div class="readout-block"><span class="readout-label">Now</span><span class="readout readout-xl">${Lt(e.temperature)}</span></div>
        ${e.target!=null&&!u?X`<div class="readout-block"><span class="readout-label">Target</span><span class="readout readout-l">${Lt(e.target)}</span></div>`:$e}
        ${!u&&e.opening!=null?X`<div class="readout-block"><span class="readout-label">Opening limit</span><span class="readout readout-l">${e.opening}%</span></div>`:$e}
      </div>
      ${!u&&e.opening!=null?X`<wa-progress-bar class="opening" data-idle=${String(g)} value=${e.opening} label="${e.name} opening limit, ${e.opening}%"></wa-progress-bar>`:$e}

      ${R.length?X`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${R.map(V=>V[0].toUpperCase()+V.slice(1)).join(". ")}.</wa-callout>`:$e}
      ${w?X`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${w}</wa-callout>`:$e}

      ${a?X`
        <div class="setpoint" data-held=${String(c||d)}>
          <div class="setpoint-row">
            <div class="wa-stack wa-gap-3xs">
              <span class="setpoint-label">Setpoint</span>
              <span class="setpoint-hint" aria-live="polite">${s.error?X`<span class="error-line" role="alert">${s.error}</span>`:Z}</span>
            </div>
            ${fh(e,l,i)}
          </div>
          <div class="wa-cluster wa-gap-xs">
            ${c&&!i?X`<wa-button size="s" appearance="outlined" @click=${()=>sh(e.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>`:$e}
            ${r?X`<wa-tag size="s" class="lock-tag">${r}</wa-tag>`:$e}
          </div>
        </div>`:$e}

      ${p?X`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${!!f.shown(vi(e))} ?disabled=${i} aria-busy=${String(f.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${()=>eh(e)}>Fire lit</wa-switch>
          <p class="action-error fire-error" role="alert" ?hidden=${!f.error}>${f.error}</p>
        </div>`:$e}

      ${T.length?X`<dl class="facts">${T.map(([V,ae])=>X`<div><dt>${V}</dt><dd>${ae}</dd></div>`)}</dl>`:$e}
      ${!e.model&&D?X`<p class="wa-caption-m wa-color-text-quiet">${D}</p>`:$e}

      ${e.model?X`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${b?X`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>`:$e}</span>
          <div class="wa-stack wa-gap-s">
            ${b?X`<p class="learned-status">${e.model.samples===0?"Still learning. Nothing learned yet, so Radiate uses typical values for now.":"Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>`:$e}
            <dl class="learned-rows">${h.map(V=>X`<div><dt>${V.label}</dt><dd>${V.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${Bu(e.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>`:$e}
    </div>`}function mh(){be&&Mt(ph(be.rooms),_("rooms"))}function is(){const e=Ge?Ut.get(Ge):null,t=_("room-panel"),n=_("hm-status"),o=!!(e&&Gt.matches);if(t.hidden===o){t.hidden=!o,n.hidden=o;const a=o?t:n;as.matches||a.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:200,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}if(Mt(o?mr(e,{inDrawer:!1}):$e,t),Gt.matches){Mt($e,xt);return}xt.label=e?.name??"Room",Mt(e?mr(e,{inDrawer:!0}):$e,xt)}const _i={ok:{icon:"circle-check",tone:"success"},heat:{icon:"fire-flame-curved",tone:"brand"},attention:{icon:"triangle-exclamation",tone:"warning"},frost:{icon:"snowflake",tone:"cool"},off:{icon:"power-off",tone:"neutral"},quiet:{icon:"moon",tone:"cool"},stale:{icon:"plug-circle-xmark",tone:"warning"},wait:{icon:"hourglass-half",tone:"neutral"}};function gh(e){const n=e.rooms.filter(a=>!Wn.has(a.role)).filter(a=>a.calling).length,o=e.telemetry??{};return ls(e)?["attention","The boiler relay can't be reached"]:(e.alert_details??[]).some(a=>a.code?.startsWith("safe_mode"))?["attention","Safe mode: the boiler is stopping"]:e.mode==="off"?["off","Heating is off"]:e.mode==="frost"?["frost","Frost protection only"]:!o.simulated&&o.boiler_linked===!1?n?["wait",`${ft(n,"room wants","rooms want")} heat`]:["ok","Rooms are comfortable"]:e.boiler.state==="firing"?["heat",n?`Heating ${ft(n,"room","rooms")}`:"Burner on"]:e.boiler.state==="lead"?["heat","Opening valves"]:e.quiet?.active?["quiet",`Quiet hours until ${e.quiet.until}`]:n?["wait",`${ft(n,"room wants","rooms want")} heat`]:e.boiler.state==="rest"?["ok","Burner resting"]:["ok","Rooms are comfortable"]}function wh(e){let t=null;for(const n of e.rooms)Wn.has(n.role)||n.next_in_min==null||n.next_setpoint==null||(!t||n.next_in_min<t.next_in_min)&&(t=n);return t?Jo((e.minute_of_day+t.next_in_min)%1440):null}function Ci(e,t){const[n,o]=document.body.dataset.link==="stale"?["stale","Showing old data"]:gh(e),a=_i[n],s=_("hero");s.dataset.tone!==a.tone&&(s.dataset.tone=a.tone),_("hero-icon").name=a.icon,_("hero-title").textContent=o,_("hero-why").textContent=t;const r=[];e.outdoor!=null&&r.push(["temperature-half",`Outside ${e.outdoor.toFixed(1)}°`]),r.push(["faucet-drip",e.store?.boost?"Hot water boosted":e.store?.relay?"Hot water on":"Hot water off"]);const i=wh(e);i&&r.push(["clock",`Next change ${i}`]),Mt(X`${r.map(([g,p])=>X`<li><wa-icon name=${g}></wa-icon>${p}</li>`)}`,_("hero-facts"));const l=rs(e),c=new Map;for(const g of l)for(const p of g.texts)c.set(p,(c.get(p)??0)+1);const d=new Set([...c].filter(([,g])=>g>=3).map(([g])=>g)),u=[];for(const g of d)u.push(X`<li><a class="need-chip" href="#devices"><strong>${g[0].toUpperCase()+g.slice(1)}</strong><span>${ft(c.get(g),"room","rooms")}</span></a></li>`);for(const g of l){const p=g.texts.filter(f=>!d.has(f));p.length&&u.push(X`<li><button type="button" class="need-chip" @click=${f=>to(g.room.id,f.currentTarget)}>
      <strong>${g.room.name}</strong><span>${p.join(", ")}</span></button></li>`)}_("hero-needs").hidden=!u.length,Mt(X`${u}`,_("hero-needs-list"))}function wt(){mh(),is()}const gr=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],bh=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],mo=e=>Date.UTC(+e.slice(0,4),+e.slice(5,7)-1,+e.slice(8,10))/864e5;function Ei(e,t){const n=t?mo(e)-mo(t):null,o=new Date(mo(e)*864e5).getUTCDay();return n===0?"today":n===1?"tomorrow":n===-1?"yesterday":n!==null&&n>1&&n<7?gr[o]:`${gr[o].slice(0,3)} ${+e.slice(8,10)} ${bh[+e.slice(5,7)-1]}`}function Ha(e,t){const n=e.slice(11,16),o=Ei(e.slice(0,10),t);return n==="00:00"?o:o==="today"?n:`${o} ${n}`}function wr(e,t){return e.slice(0,10)===t?e.slice(11,16):Ha(e,t)}function yh(e,t){const n=e.slice(11,16),o=Ei(e.slice(0,10),t),a=o==="tomorrow"||o==="yesterday"?o:`on ${o}`;return o==="today"?`at ${n}`:n==="00:00"?a:`${a} at ${n}`}function vh(e,t){const n=t.today;if(e.away&&e.reason==="away_until")return[`Away until ${Ha(e.until,n)}.`,"Away","away"];if(e.away)return[`Away since ${wr(e.presence.since,n)}, from Home Assistant.`,"Away","away"];if(e.until){const o=Ha(e.until,n);return[`Due back ${/^\d/.test(o)?"at ":""}${o}. Warming up their rooms.`,"Due back","back"]}if(e.presence?.uncertain&&e.presence.why){const o=e.presence.uncertain==="evidence_old"?"No update":"Home";return[e.presence.why,o,e.presence.uncertain==="evidence_old"?"stale":""]}if(e.presence?.stale){const o=mt?.household?.away?.presence_stale_after_min;return[`Home Assistant hasn't reported${o?` for over ${To(o)}`:" lately"}, so Radiate treats them as home.`,"No update","stale"]}if(e.presence?.state==="not_home"){const o=t.presence_delay_min,a=o!=null?` Counts as away after ${To(o)}.`:"";return[`Out since ${wr(e.presence.since,n)}.${a}`,"Out",""]}return["Home.","Home",""]}const ba=new Map;function yn(e){return ba.has(e)||ba.set(e,{form:!1,clearing:!1,clearError:"",saving:!1,saveError:""}),ba.get(e)}const Ti=e=>_("people-list").querySelector(`[data-person="${CSS.escape(e)}"]`);function kh(e){yn(e.id).form=!0,yn(e.id).saveError="",Xt(be?.away);const n=Ti(e.id)?.querySelector("wa-input[name=date]"),o=be?.away?.today;n&&o&&(n.min=o,n.value||(n.value=new Date((mo(o)+1)*864e5).toISOString().slice(0,10))),requestAnimationFrame(()=>n?.focus())}function Ba(e){yn(e.id).form=!1,yn(e.id).saveError="",Xt(be?.away),requestAnimationFrame(()=>Ti(e.id)?.querySelector(".away-open")?.focus())}async function $h(e,t){e.preventDefault();const n=e.currentTarget,o=n.querySelector("wa-input[name=date]").value,a=n.querySelector("wa-input[name=time]").value;if(!o)return;const s=a?`${o}T${a}`:o,r=yn(t.id);r.saving=!0,r.saveError="",Xt(be?.away);try{await zn(`people/${t.id}/away`,{until:s})}catch(i){r.saving=!1;const l=String(i?.message??"");r.saveError=l.includes("in the future")?"Not saved: pick a time that has not passed.":l.includes("within")?"Not saved: pick a date in the next 60 days.":no(i),Xt(be?.away);return}r.saving=!1;for(const i of n.querySelectorAll("wa-input"))i.value="";Ba(t),jn()}async function xh(e){const t=yn(e.id);t.clearing=!0,t.clearError="",Xt(be?.away);try{await zn(`people/${e.id}/home`,{})}catch(n){try{if(!/HTTP 404/.test(String(n?.message)))throw n;await zn(`people/${e.id}/away`,{until:null})}catch(o){t.clearError=no(o)}}t.clearing=!1,Xt(be?.away),await jn()}function Sh(e,t){const n=yn(e.id),o=Fn("household");o&&(n.form=!1);const[a,s,r]=vh(e,t);return X`
    <wa-card class="person" data-person=${e.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${e.name}</h3>
        ${Ro(s,r)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${a}</p>
        ${n.form?X`
          <form class="away-form wa-stack wa-gap-s" @submit=${i=>$h(i,e)} @keydown=${i=>{i.key==="Escape"&&Ba(e)}}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${n.saving} ?disabled=${n.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${()=>Ba(e)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!n.saveError}>${n.saveError}</p>
          </form>`:X`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${!!o}
              aria-label=${e.until?`Change when ${e.name} is back`:`Set ${e.name} away`}
              @click=${()=>kh(e)}>${e.until?"Change":"Set away"}</wa-button>
            ${!o&&(e.until||e.away)?X`<wa-button size="s" appearance="plain" aria-label="${e.name} is back now"
              ?loading=${n.clearing} ?disabled=${n.clearing} @click=${()=>xh(e)}>Back now</wa-button>`:$e}
            ${o?X`<wa-tag size="s" class="lock-tag">${o}</wa-tag>`:$e}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!n.clearError}>${n.clearError}</p>
      </div>
    </wa-card>`}function Xt(e){const t=e?.people??[];_("people").hidden=!t.length,_("away-note").hidden=!e?.frost;const n=e?.return,o=_("return-note");if(o.hidden=!n,n){const a=t.filter(i=>i.until&&i.until.slice(0,16)===n.at.slice(0,16)),s=a.length?a:t.filter(i=>i.until),r=s.length?`${ln(s.map(i=>i.name))}'s return`:"a return";o.textContent=`Warming up for ${r} ${yh(n.at,e.today)}.`}Mt(X`${t.map(a=>Sh(a,e))}`,_("people-list")),document.body.dataset.view==="schedules"&&Fi.show()}const Ai=600*1e3,en=mu({modelEl:_("hm-model"),statusEl:_("hm-status"),planEl:_("hm-plan"),transport:Ce,arrangeLock:()=>Fn("admin"),onSelect:(e,t)=>to(e,t),onWeek:()=>{location.hash="#schedules"}});new MutationObserver(()=>en.redraw()).observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.fonts?.ready&&document.fonts.ready.then(()=>en.redraw());const Lo=ei({list:_("week-list"),legendEl:_("week-legend"),frostEl:_("week-frost"),hintEl:_("week-hint")}),ze={key:null,minute:null,at:0,loading:!1,again:!1,gone:!1,shown:!1};let br=!1;async function ya(e,t,n){try{return await Ce.call(e,t,n)}catch(o){throw o instanceof Ue&&it(),o}}const _h={async household(){const e=await ya("GET","household");if(e.status!==200)throw new Error(`household: HTTP ${e.status}`);return e.body},async preview(e){const t=await ya("POST","household/preview",{household:e});if(t.status!==200)throw new Error(`household/preview: HTTP ${t.status}`);return t.body},save:e=>ya("PUT","household",{household:e}),async saved(e){const t=_("week-saved");t.textContent=e,clearTimeout(t.timer),t.timer=setTimeout(()=>{t.textContent=""},15e3),ze.key=null,await Qo();try{mt=await Ce.house()}catch{}Zo()},time:cn};async function Qo(){if(!(ze.gone||!Ce.get)){if(ze.loading){ze.again=!0;return}ze.loading=!0,ze.again=!1,ze.at=Date.now();try{const e=await Ce.get("schedules");_("week").hidden=!e.rooms.length,Lo.update(e),en.week(e),ze.shown=!0,be&&Lo.tick(be.minute_of_day)}catch(e){/HTTP 404|not found/.test(String(e?.message))?ze.gone=!0:e instanceof Ue?it():ze.at=Date.now()-Ai+3e4}ze.loading=!1,ze.again&&await Qo()}}function Ch(e){const t=JSON.stringify([e.away?.everyone,(e.away?.people??[]).map(o=>[o.id,o.away])]),n=ze.minute!=null&&e.minute_of_day<ze.minute;ze.minute=e.minute_of_day,t!==ze.key||n||Date.now()-ze.at>Ai?(ze.key=t,Qo()):ze.shown&&Lo.tick(e.minute_of_day)}function yr(e,t,n){e.textContent="";for(const[o,a]of t){const s=Math.max(0,(o+n)/n)*100,r=Math.max(0,(a+n)/n)*100;if(r<=0)continue;const i=document.createElement("i");i.style.left=`${s}%`,i.style.width=`${Math.max(.3,r-s)}%`,e.appendChild(i)}}function ls(e){return!e.telemetry?.simulated&&(e.alert_details??[]).some(t=>t.code==="driver.shelly")}const Eh={idle:["Idle","neutral"],lead:["Opening valves","warning"],firing:["Firing","brand"],rest:["Resting","cool"]};function cs(e){be=e,delete document.body.dataset.link;const t=e.boiler,n=t.state==="firing",o=mt?.boiler.min_burn_s??480,a=t.min_off_s??mt?.boiler.min_off_s??600,s=Th(e,o);_("status").textContent=s,_("outdoor").textContent=e.outdoor!=null?`Outside ${e.outdoor.toFixed(1)}°`:"",Mi(e.mode),Ri(e.settings);const r=_("boiler-chip"),i=ls(e),[l,c]=i?["Not reachable","warning"]:Eh[t.state]??["–","neutral"];r.textContent=l,r.dataset.state=i?"lost":t.state,r.classList.toggle("radiate-cool",c==="cool"),c==="cool"?r.removeAttribute("variant"):r.variant=c;let d=0;n&&(d=Math.min(1,t.burn_elapsed_s/o)),t.state==="rest"&&(d=Math.min(1,t.state_elapsed_s/a));const u=_("guard");u.value=Math.round(d*100),u.dataset.kind=t.state,u.label=n?"Minimum burn":t.state==="rest"?"Minimum off":"Minimum burn or rest",_("guard-row").hidden=!(n||t.state==="rest"),_("boiler-detail").textContent=n?t.burn_elapsed_s<o?`Minimum burn: ${Eo(o-t.burn_elapsed_s)} to go`:"Minimum burn met":t.state==="rest"?`${Eo(Math.max(0,a-t.state_elapsed_s))} until it may start again`:"",Oi(e.store.boost),yr(document.querySelector(".lane.burns"),e.timeline.burns,e.timeline.window_s),yr(document.querySelector(".lane.store"),e.timeline.store,e.timeline.window_s),_("s-starts").textContent=`${t.starts_last_hour}`,_("s-pred").textContent=t.predicted_burn_min?`${t.predicted_burn_min} min`:"–",Ah(e),i&&(_("s-today-sub").textContent="Not counted while the relay can't be reached"),_("s-supply").textContent=t.supply!=null?t.supply.toFixed(2):"–",Rh(t);const g=_("banner");e.telemetry?.simulated&&(g.hidden=!1,_("banner-text").textContent=`Demo: simulated reference house, ${Jo(e.minute_of_day)} simulated time. Boiler water ${e.telemetry.boiler_water_c}°, store ${e.telemetry.store_c}°, stairs ${e.telemetry.stairs_c}°.`),Mh(e.telemetry),Lh(e.learning_notes),Xt(e.away),Ut.clear();for(const p of e.rooms)Ut.set(p.id,p),ih(p);Ge&&!Ut.has(Ge)&&(Ge=null),wt(),Ci(e,s),Nh(e.alert_details?e.alert_details.filter(p=>!p.room_id||!e.rooms.some(f=>f.id===p.room_id)).map(p=>p.message):e.alerts),Di(e.alert_details),en.update(e),Ch(e),za=new Date,mt||Dh()}function Th(e,t){const n=e.boiler,o=e.rooms.filter(u=>!Wn.has(u.role)),a=o.filter(u=>u.calling).map(u=>u.name),s=o.filter(u=>!u.calling&&u.topup&&u.extend===!0).map(u=>u.name),r=o.filter(u=>!u.calling&&u.topup&&u.extend!==!0).map(u=>u.name),i=o.filter(ss).map(u=>u.name),l=e.store?.relay?" Hot water on.":"";if(e.telemetry&&!e.telemetry.simulated&&e.telemetry.boiler_linked===!1)return a.length?`${ln(a)} ${a.length===1?"wants":"want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:"No room needs heat. The boiler switch isn't linked yet.";if(ls(e))return"Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";const c=`Burner on for ${Eo(n.burn_elapsed_s)}`,d=u=>`topping up ${ln(u)} to save a second burn soon`;switch(n.state){case"idle":if(i.length){const u=i.length===1?"is":"are";return`Boiler idle. ${ln(i)} ${u} waiting to share a burn with other rooms.${l}`}return e.quiet?.active?`Quiet hours until ${e.quiet.until}. Heating only to keep rooms above 12°.${l}`:l?`Heating idle.${l}`:"Boiler idle. Rooms are within comfort.";case"lead":return`Opening valves before calling the burner.${a.length?` Heating ${ln(a)}.`:""}${l}`;case"rest":return`Burner resting: minimum off time, ${Eo(n.state_elapsed_s)} so far.${l}`;case"firing":if(a.length){const u=s.length?` Also ${d(s)}.`:"";return`${c}. Heating ${ln(a)}.${u}${l}`}if(s.length)return`${c}, ${d(s)}.${l}`;if(n.burn_elapsed_s<t){const u=r.length?`, with the heat going to ${ln(r)}`:"";return`${c} to finish its minimum burn${u}.${l}`}return`${c}. Stopping now that rooms are warm.${l}`;default:return""}}function Ah(e){const t=e.accounting?.today,n=e.accounting?.yesterday,o=_("s-today-label");if(t){o.textContent="Burner today",_("s-today").textContent=t.burner_hours!=null?`${t.burner_hours.toFixed(1)} h`:"–";const r=[];t.starts!=null&&r.push(ft(t.starts,"start","starts")),t.litres!=null&&r.push(`${t.litres.toFixed(1)} L`),t.kwh!=null&&r.push(`${Math.round(t.kwh)} kWh`),_("s-today-sub").textContent=r.join(", ")}else{o.textContent="Burner hours";const r=e.telemetry?.burner_hours;_("s-today").textContent=r!=null?r.toFixed(1):"–",_("s-today-sub").textContent=""}const a=n?.balance;_("s-balance").textContent=a?.score!=null?`${Math.round(a.score)}/100`:"–";let s="No full day yet";n&&(s=a?.score!=null?"":"No burns with two or more rooms"),a?.arrival_spread_min!=null&&(s=`Last room ${Math.round(a.arrival_spread_min)} min after the first`),n?.partial&&(s="Not a full day of data"),_("s-balance-sub").textContent=s}function Rh(e){const t=e.short_cycle,n=_("short-cycle");if(n.hidden=!t,!t)return;const o=e.min_off_s!=null?`${Math.round(e.min_off_s/60)} min`:null,a=o?`Minimum off raised to ${o}`:`Minimum off raised by ${t.extra_off_min} min`,s=t.ends_in_h!=null?` for the next ${To(Math.max(1,Math.round(t.ends_in_h*60)))}`:"";_("short-cycle-text").textContent=`${a}${s}, so the burner starts less often.`}const vr={eco:"fewer, longer burns. Rooms might warm a bit later.",comfort:"every room held at its target, with more burns."},En=Ko();function Ri(e){const t=_("demand"),n=_("demand-note"),o=e&&vr[e.demand_mode];if(t.hidden=!o,!o)return;const a=En.shown(e.demand_mode);t.value!==a&&(t.value=a),t.setAttribute("aria-busy",String(En.busy));const s=vr[a];n.dataset.error=String(!!En.error),n.textContent=En.error||(a===e.demand_mode_default?`Default: ${s}`:s[0].toUpperCase()+s.slice(1))}_("demand").addEventListener("change",e=>{const t=be?.settings,n=e.target.value;!t||n===En.shown(t.demand_mode)||Yo(En,n,"settings",{demand_mode:n===t.demand_mode_default?null:n},()=>{be?.settings&&Ri(be.settings)}).then(o=>o&&Un(n==="eco"?"Eco: fewer, longer burns.":"Comfort: every room held at its target."))});let kr="";function Lh(e=[]){const t=JSON.stringify(e);if(t===kr)return;kr=t;const n=_("learning-notes");if(n.hidden=!e.length,n.hidden)return;const o=new Set(e.filter(a=>a.room_id).map(a=>a.room_id)).size;_("learning-notes-lead").textContent=o?`${ft(o,"room's learning was","rooms' learning was")} reset recently. Those rooms learn again from their next burns.`:"Radiate changed what it had learned when it last started.",Mt(X`${[...e].reverse().map(a=>X`<li><span class="payload">${new Date(a.at*1e3).toLocaleString(void 0,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span> <span>${a.message}</span></li>`)}`,n.querySelector("ul"))}let $r="";function Mh(e){const t=_("dryrun");if(t.hidden=!e?.dry_run,t.hidden)return;const n=e.intended_writes??0,o=e.shelly_intended,a=o!=null?`${ft(n,"valve write","valve writes")} and ${ft(o,"boiler command","boiler commands")}`:ft(n,"valve write","valve writes");_("dryrun-count").textContent=n||o?`Held back so far: ${a}.`:"Nothing held back yet.";const s=e.recent_intended??[],r=JSON.stringify(s);if(r===$r)return;$r=r;const i=_("dryrun-recent");i.hidden=!s.length,Mt(X`${[...s].reverse().map(l=>X`<li><code>${l.topic}</code> <code class="payload">${typeof l.payload=="string"?l.payload:JSON.stringify(l.payload)}</code></li>`)}`,i.querySelector("ul"))}const xr=2;let Sr="";function Oh(e){const t=new Map;for(const n of e){const o=n.indexOf(": "),a=o>0?n.slice(o+2):n,s=t.get(a)??{problem:a,first:n,rooms:[]};o>0&&s.rooms.push(n.slice(0,o)),t.set(a,s)}return[...t.values()].map(n=>n.rooms.length<2?n.first:`${n.problem[0].toUpperCase()+n.problem.slice(1)} (${ft(n.rooms.length,"room","rooms")}): ${n.rooms.join(", ")}`)}function Nh(e){const t=JSON.stringify(e);if(t===Sr)return;Sr=t;const n=_("alerts");n.hidden=!e.length;const o=Oh(e),a=_("alerts-list");a.textContent="",o.forEach((i,l)=>{const c=document.createElement("li");c.textContent=i,c.dataset.extra=String(l>=xr),a.appendChild(c)});const s=_("alerts-more"),r=o.length-xr;s.hidden=r<=0,s.dataset.extra=String(Math.max(0,r)),Li(s.getAttribute("aria-expanded")==="true")}function Li(e){const t=_("alerts-more");t.setAttribute("aria-expanded",String(e)),t.textContent=e?"Show fewer":`Show ${t.dataset.extra} more`,_("alerts-list").dataset.expanded=String(e)}_("alerts-more").addEventListener("click",()=>{Li(_("alerts-more").getAttribute("aria-expanded")!=="true")});const Jn=Ko();function Mi(e){const t=_("mode"),n=Jn.shown(e);t.value!==n&&(t.value=n),t.setAttribute("aria-busy",String(Jn.busy)),gi(_("mode-error"),Jn.error)}_("mode").addEventListener("change",e=>{const t=e.target.value;!be||t===Jn.shown(be.mode)||Yo(Jn,t,"mode",{mode:t},()=>be&&Mi(be.mode)).then(n=>n&&Un({auto:"Heating: Auto. Rooms follow their schedules.",frost:"Heating: Frost protection only.",off:"Heating off. Rooms are still kept above frost."}[t]))});const Yn=Ko();function Oi(e){const t=_("boost"),n=!!Yn.shown(e);t.checked!==n&&(t.checked=n),t.setAttribute("aria-busy",String(Yn.busy)),gi(_("boost-error"),Yn.error)}_("boost").addEventListener("change",()=>{if(!be)return;const e=!Yn.shown(be.store.boost);Yo(Yn,e,"store/boost",{minutes:e?60:0},()=>be&&Oi(be.store.boost)).then(t=>t&&Un(e?"Hot water on for 60 minutes.":"Hot water boost stopped."))});function zh(){if(!be){_("status").textContent="Cannot reach Radiate. Retrying…",_("hero-title").textContent="Cannot reach Radiate",_("hero-why").textContent="Retrying…",_("hero").dataset.tone="warning",_("hero-icon").name=_i.stale.icon;return}document.body.dataset.link="stale";const e=`${String(za.getHours()).padStart(2,"0")}:${String(za.getMinutes()).padStart(2,"0")}`;_("status").textContent=`Cannot reach Radiate. Retrying… Showing data from ${e}.`,Ci(be,_("status").textContent)}async function Ni(){try{return cs(await Ce.state()),!0}catch(e){return e instanceof Ue?it():zh(),!1}}function Ph(e){e==="lost"?Ni():e==="auth"&&it()}let va=!1;async function Dh(){if(!va){va=!0;try{mt=await Ce.house(),Zo()}catch{}va=!1}}let Gn=null,Kn=null;const zi=ad({transport:Ce,onOpen(){for(const e of document.querySelectorAll("main > .view, main > section[aria-labelledby]"))e.id!=="setup"&&(e.hidden=!0);document.body.dataset.setup="open",window.scrollTo(0,0)},onClose(){delete document.body.dataset.setup,vn(!1),Kn&&!Kn.closest("[hidden]")&&Kn.focus(),Kn=null},async onSaved(e){delete document.body.dataset.setup,vn(!1);const t=_("setup-saved");t.textContent=e,t.hidden=!1,t.focus(),clearTimeout(t.timer),t.timer=setTimeout(()=>{t.hidden=!0},15e3),ze.key=null;try{mt=await Ce.house()}catch{}Zo(),jn(),ds.refresh()}});async function Zo(){Gn??=zi.available();const e=await Gn;e===null&&(Gn=null);const t=!!mt?.household;_("setup-cta").hidden=!e||t,_("setup-change-row").hidden=!e||!t,eo([_("setup-start")],_("setup-start-lock"),"admin"),eo([_("setup-change")],_("setup-change-lock"),"admin");const n=_("week-lock");n.hidden=!e||qa("household"),n.textContent=Fn("household"),e&&!br&&qa("household")&&(br=!0,Lo.setEditor(_h),ze.key=null,Qo())}async function ea(e){Kn=e.currentTarget;try{await zi.open()}catch(t){if(t instanceof Ue){it();return}const n=_("setup-saved");n.textContent="Couldn't open the household setup. Try again in a moment.",n.hidden=!1}}_("setup-start").addEventListener("click",ea);_("setup-change").addEventListener("click",ea);const Pi=pd({transport:Ce,scanLock:()=>Fn("admin"),isAuthError:e=>e instanceof Ue,onAuth:()=>it()});let Mo=null;const qh=/^(device\.|driver\.trv_offline$|driver\.shelly$)/;function Di(e){const t=(e??[]).filter(a=>qh.test(a.code)).length;en.devices(t);const n=_("devices-count");n.hidden=!t,n.textContent=String(t);const o=document.querySelector('.view-tab[data-view="devices"]');t?o.setAttribute("aria-label",`Devices, ${t} ${t===1?"needs":"need"} attention`):o.removeAttribute("aria-label"),_("alerts-devices").hidden=!t||Mo!==!0}const qi=xd({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>it(),onCount:Ih});let Fa=null;function Ih(e){const t=_("suggestions-count");t.hidden=!e,t.textContent=String(e);const n=document.querySelector('.view-tab[data-view="suggestions"]');e?n.setAttribute("aria-label",`Suggestions, ${e} to act on`):n.removeAttribute("aria-label")}let Ii=null;const ds=Ud({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>it(),onView:e=>{const t=Id(e);_("savings-line").hidden=!t,_("savings-line-link").textContent!==t&&(_("savings-line-link").textContent=t),Ii=e.status==="unavailable"?e.why:null,Hh()}});let ja=null;async function Hh(){const e=Ii==="no household"&&Gn?await Gn:!1;_("savings-setup-row").hidden=!e,eo([_("savings-setup")],_("savings-setup-lock"),"admin")}_("savings-setup").addEventListener("click",e=>{history.replaceState(null,"","#"),vn(!1),ea(e)});const Hi=uu({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>it()});let Wa=null;const Oo=Ju({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>it()}),Bi=bu({root:_("guide")});yu({note:_("guide-note"),tab:document.querySelector('.view-tab[data-view="guide"]')});const No=Ru({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>it(),onOpenSetup:e=>{history.replaceState(null,"","#"),vn(!1),ea(e)},onShowSchedules:()=>{location.hash="#schedules"},moreSections:()=>Oo.offered?[{id:"security-log",title:"Security log"}]:[]}),Bh={show(){No.show(),Oo.show()},hide(){No.hide(),Oo.hide()}};let Ua=null;const Fi={show(){const e=_("week").hidden&&_("people").hidden&&_("setup-cta").hidden;_("schedules-empty").hidden=!e},hide(){}},Va={schedules:{offered:()=>!0,module:Fi},devices:{offered:()=>Mo===!0,module:Pi},suggestions:{offered:()=>Fa===!0,module:qi},savings:{offered:()=>ja===!0,module:ds},settings:{offered:()=>Ua===!0,module:Bh},data:{offered:()=>Wa===!0,module:Hi},guide:{offered:()=>!0,module:Bi}};function vn(e){if(document.body.dataset.setup==="open")return;const[t,n]=location.hash.slice(1).split("/"),o=Va[t]?.offered()?t:"house";for(const a of document.querySelectorAll(".view-tab"))a.dataset.view===o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");_("house").hidden=o!=="house";for(const[a,s]of Object.entries(Va))_(a).hidden=a!==o,a===o?s.module.show():s.module.hide();document.body.dataset.view=o,document.querySelector("wa-page").dataset.view=o,!(o==="guide"&&Bi.reveal(n))&&(o==="settings"&&No.reveal(n)||(!e&&o!=="house"&&window.scrollTo(0,0),e&&(window.scrollTo(0,0),_(`${o}-h`)?.focus())))}window.addEventListener("hashchange",()=>vn(!0));document.addEventListener("click",e=>{const t=e.target.closest?.('a[href^="#"]');!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.hash===location.hash&&(t.hash.startsWith("#guide")||t.hash.startsWith("#settings/"))&&(e.preventDefault(),vn(!0))});function Fh(){for(const[e,t]of Object.entries(Va))document.querySelector(`.view-tab[data-view="${e}"]`).hidden=!t.offered()}async function jh(){const[e,t,n,o,a]=await Promise.all([Mo===!0?!0:Pi.available(),Fa===!0?!0:qi.available(),ja===!0?!0:ds.available(),Ua===!0?!0:No.available(),Wa===!0?!0:Hi.available(),Oo.available()]);Mo=e,Fa=t,ja=n,Ua=o,Wa=a,Fh(),Di(be?.alert_details),vn(!1)}let go=!1;const us=()=>new URL("login",document.baseURI).toString();async function Wh(){if(document.documentElement.dataset.transport==="demo")return!0;try{const t=await fetch(fo("auth/config"));go=t.ok&&(await t.json()).login===!0}catch{go=!1}if(!go)return!0;let e;try{e=await Ce.get("auth/me")}catch(t){return t instanceof Ue?(window.location.assign(us()),!1):!0}return e.via==="session"&&Uh(e),!0}const _r={admin:"Admin: you can change anything here.",household:"Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",viewer:"Read only: you can see the house but not change it."};function Uh(e){Ce.setCsrf(e.csrf);const t=e.method==="local"?"a password":"single sign-on";_("account-name").textContent=e.user,_("account-who").textContent=`Signed in as ${e.user} with ${t}.`,_("account-role").textContent=_r[e.role]??_r.viewer,Ao=e.role in Da?e.role:"viewer",document.body.dataset.role=Ao,Qu(),en.redraw(),wt(),be&&Xt(be.away),_("account").hidden=!1}_("account").addEventListener("wa-select",async e=>{if(e.detail?.item?.value==="sign-out"){_("account-error").hidden=!0;try{await Ce.post("auth/logout",{})}catch(t){if(!(t instanceof Ue)){_("account-error").hidden=!1;return}}window.location.assign(us())}});async function ji(){if(jh(),!!await Wh()){try{mt=await Ce.house(),Zo()}catch(e){if(e instanceof Ue){it();return}}await Ni(),document.body.dataset.auth!=="needed"&&Ce.subscribe(cs,Ph)}}function it(){if(go){window.location.assign(us());return}if(document.body.dataset.auth==="needed")return;const e=Ce.hasToken();Ce.setToken(""),document.body.dataset.auth="needed",_("signin").hidden=!1,_("status").textContent="Sign in to see the house.";const t=_("signin-error");t.hidden=!e,t.textContent=e?"The saved token was not accepted. Enter it again.":"",requestAnimationFrame(()=>_("signin-token").focus())}_("signin-form").addEventListener("submit",async e=>{e.preventDefault();const t=_("signin-token"),n=_("signin-form").querySelector("wa-button[type=submit]"),o=_("signin-error"),a=String(t.value??"").trim();if(o.hidden=!0,!a)return;n.disabled=!0;const s=/^[\x21-\x7e]+$/.test(a);s&&Ce.setToken(a);try{if(!s)throw new Ue("token");mt=await Ce.house()}catch(r){n.disabled=!1,o.hidden=!1,r instanceof Ue?(Ce.setToken(""),o.textContent="That token was not accepted. Check it and try again."):o.textContent="Cannot reach Radiate. Try again in a moment.",t.select();return}n.disabled=!1,t.value="",_("signin").hidden=!0,delete document.body.dataset.auth,_("status").textContent="Connecting…",await ji()});await ji();
