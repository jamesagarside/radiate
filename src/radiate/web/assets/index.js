import{i as Ve,e as Tr,a as Rr,A as ve,t as Lr,E as Mr,_ as v,b as Ee,n as B,c as Ye,W as st,H as In,l as Or,o as vt,d as J,w as wt,L as At,f as kt,s as Hn,g as Xa,h as Bn,r as Zt,j as xn,v as Qa,M as Yi,D as $t}from"./app.js";const Gi="modulepreload",Xi=function(e,t){return new URL(e,t).href},fs={},Qi=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let r=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(b=>({status:"fulfilled",value:b}),b=>({status:"rejected",reason:b}))))};const i=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),l=c?.nonce||c?.getAttribute("nonce");a=r(n.map(d=>{if(d=Xi(d,o),d in fs)return;fs[d]=!0;const u=d.endsWith(".css"),b=u?'[rel="stylesheet"]':"";if(!!o)for(let y=i.length-1;y>=0;y--){const h=i[y];if(h.href===d&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${b}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":Gi,u||(f.as="script"),f.crossOrigin="",f.href=d,l&&f.setAttribute("nonce",l),document.head.appendChild(f),u)return new Promise((y,h)=>{f.addEventListener("load",y),f.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return a.then(r=>{for(const i of r||[])i.status==="rejected"&&s(i.reason);return t().catch(s)})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Zi=(e="768px")=>`
  @media screen and (width < ${e}) {
    [part~='navigation'] {
      display: none;
    }

    :host(:not([disable-navigation-toggle])) slot[name~='navigation-toggle'] {
      display: contents;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var el=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var tl=Ve`
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
 */function nl(e){return(t,n)=>{const o=typeof t=="function"?t:t[n];Object.assign(o,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let _a=class extends Rr{constructor(t){if(super(t),this.it=ve,t.type!==Lr.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===ve||t==null)return this._t=void 0,this.it=t;if(t===Mr)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}};_a.directiveName="unsafeHTML",_a.resultType=1;const ol=Tr(_a);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Cn(e,t,n){return e?t(e):n?.(e)}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function al(e,t=document.documentElement){if(!Number.isNaN(Number(e)))return Number(e);if(!window.CSS||!CSS.registerProperty)return typeof e=="string"&&e.endsWith("px")?parseFloat(e):Number(e)||0;const n="--wa-length-resolver";if(!CSS.registerProperty.toString().includes(n))try{CSS.registerProperty({name:n,syntax:"<length>",inherits:!1,initialValue:"0px"})}catch{}const o=t.style.getPropertyValue(n);t.style.setProperty(n,e);const a=getComputedStyle(t)?.getPropertyValue(n);return t.style.setProperty(n,o),a?.endsWith("px")?parseFloat(a):Number(a)||0}function sl(e){return Number.isNaN(Number(e))?e:`${e}px`}var je=class extends st{constructor(){super(),this.hasSlotController=new In(this,"navigation-footer","mobile-navigation-footer"),this.headerResizeObserver=this.slotResizeObserver("header"),this.subheaderResizeObserver=this.slotResizeObserver("subheader"),this.bannerResizeObserver=this.slotResizeObserver("banner"),this.footerResizeObserver=this.slotResizeObserver("footer"),this.hasExplicitNavigationToggleSetting=!1,this.handleNavigationToggle=e=>{if(this.view==="desktop"){this.hideNavigation();return}const t=e.composedPath(),n=this.navigationToggleSlot;t.find(o=>o.hasAttribute?.("data-toggle-nav")||o.assignedSlot===n||o===n)&&(e.preventDefault(),this.toggleNavigation())},this.view="desktop",this.navOpen=!1,this.mobileBreakpoint="768px",this.navigationPlacement="start",this.disableNavigationToggle=!1,this.pageResizeObserver=typeof ResizeObserver<"u"?new ResizeObserver(e=>{requestAnimationFrame(()=>{for(const t of e)if(t.contentBoxSize){const o=t.borderBoxSize[0].inlineSize,a=this.view;o>=al(this.mobileBreakpoint)?this.view="desktop":this.view="mobile",this.requestUpdate("view",a)}})}):null,this.updateNavigationToggleState=e=>{if(e){const o=e.target.name;if(!["navigation","navigation-header","navigation-footer"].includes(o))return}if(this.hasExplicitNavigationToggleSetting)return;const t=!!this.querySelector(":not([slot='navigation-toggle']) [data-toggle-nav]"),n=!!this.querySelector('[slot="navigation"]')||!!this.querySelector('[slot="navigation-header"]')||!!this.querySelector('[slot="navigation-footer"]');this.disableNavigationToggle=t||!n},this.addEventListener("click",this.handleNavigationToggle)}slotResizeObserver(e){return new ResizeObserver(t=>{requestAnimationFrame(()=>{for(const n of t)if(n.contentBoxSize){const o=n.borderBoxSize[0];this.style.setProperty(`--${e}-height`,`${Math.round(o.blockSize)}px`)}})})}updated(e){e.has("view")&&this.hideNavigation(),super.updated(e)}connectedCallback(){super.connectedCallback(),setTimeout(()=>{requestAnimationFrame(()=>{this.pageResizeObserver?.observe(this),this.headerResizeObserver?.observe(this.header),this.subheaderResizeObserver?.observe(this.subheader),this.bannerResizeObserver?.observe(this.banner),this.footerResizeObserver?.observe(this.footer)})})}visiblePixelsInViewport(e){if(!e)return null;const t=e.clientHeight,n=window.innerHeight,o=e.getBoundingClientRect?.();if(!o)return null;const{top:a,bottom:s}=o;return Math.max(0,a>0?Math.min(t,n-a):Math.min(s,n))}firstUpdated(e){if(!document.getElementById("main-content")){const t=document.createElement("div");t.id="main-content",t.slot="skip-to-content-target",this.prepend(t)}this.hasExplicitNavigationToggleSetting=this.disableNavigationToggle,this.shadowRoot.addEventListener("slotchange",this.updateNavigationToggleState),this.updateNavigationToggleState(),super.firstUpdated(e)}disconnectedCallback(){super.disconnectedCallback(),this.pageResizeObserver?.unobserve(this),this.headerResizeObserver?.unobserve(this.header),this.subheaderResizeObserver?.unobserve(this.subheader),this.footerResizeObserver?.unobserve(this.footer),this.bannerResizeObserver?.unobserve(this.banner)}showNavigation(){this.navOpen=!0}hideNavigation(){this.navOpen=!1}toggleNavigation(){this.navOpen=!this.navOpen}render(){const e=this.view==="mobile"&&(this.hasSlotController.test("navigation-footer")||this.hasSlotController.test("mobile-navigation-footer"));let t=this.nonce||globalThis.litNonce||null;return J`
      <a href="#main-content" part="skip-to-content" class="wa-visually-hidden">
        <slot name="skip-to-content">Skip to content</slot>
      </a>

      <!-- unsafeHTML needed for SSR until this is solved: https://github.com/lit/lit/issues/4696 -->
      ${ol(`
        <style
          ${t?`nonce="${t}"`:""}
          id="mobile-styles"
        >
          ${Zi(sl(this.mobileBreakpoint))}
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
                  ${Cn(this.view==="desktop",()=>J`<slot name="navigation-header"><div></div></slot>`,()=>J`<div></div>`)}
                </slot>
                <slot name="desktop-navigation">
                  ${Cn(this.view==="desktop",()=>J`<slot name="navigation"><div></div></slot>`,()=>J`<div></div>`)}
                </slot>
                <slot name="desktop-navigation-footer">
                  ${Cn(this.view==="desktop",()=>J`<slot name="navigation-footer"><div></div></slot>`,()=>J`<div></div>`)}
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
          ${Cn(this.view==="mobile",()=>J`<slot name="navigation-header"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>
        <slot name="mobile-navigation">
          ${Cn(this.view==="mobile",()=>J`<slot name="navigation"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>

        <slot
          slot=${vt(e?"footer":void 0)}
          name="mobile-navigation-footer"
          ?hidden=${!e}
        >
          ${Cn(this.view==="mobile",()=>J`<slot part="navigation-footer" name="navigation-footer"><div></div></slot>`,()=>J`<div></div>`)}
        </slot>
      </wa-drawer>
    `}};je.css=[tl,el];v([Ee("[part~='header']")],je.prototype,"header",2);v([Ee("[part~='menu']")],je.prototype,"menu",2);v([Ee("[part~='main']")],je.prototype,"main",2);v([Ee("[part~='aside']")],je.prototype,"aside",2);v([Ee("[part~='subheader']")],je.prototype,"subheader",2);v([Ee("[part~='footer']")],je.prototype,"footer",2);v([Ee("[part~='banner']")],je.prototype,"banner",2);v([Ee("[part~='drawer']")],je.prototype,"navigationDrawer",2);v([Ee("slot[name~='navigation-toggle']")],je.prototype,"navigationToggleSlot",2);v([B({attribute:"view",reflect:!0})],je.prototype,"view",2);v([B({reflect:!0})],je.prototype,"nonce",2);v([B({attribute:"nav-open",reflect:!0,type:Boolean})],je.prototype,"navOpen",2);v([B({attribute:"mobile-breakpoint",type:String})],je.prototype,"mobileBreakpoint",2);v([B({attribute:"navigation-placement",reflect:!0})],je.prototype,"navigationPlacement",2);v([B({attribute:"disable-navigation-toggle",reflect:!0,type:Boolean})],je.prototype,"disableNavigationToggle",2);je=v([Ye("wa-page")],je);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var rl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var il=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??(this.observer=new ResizeObserver(()=>this.check())),this.observer.observe(this.element);for(const t of e)this.observer.observe(t);this.initialCheckHandle??(this.initialCheckHandle=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()}))}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function ll(e,t){const n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var Ca=new Set;function cl(){const e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function dl(){const e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function sa(e){if(Ca.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){const t=cl()+dl();let n=getComputedStyle(document.documentElement).scrollbarGutter;(!n||n==="auto")&&(n="stable"),t<2&&(n=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",n),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function ra(e){Ca.delete(e),Ca.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function ul(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Po=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Do=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qo=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Io=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var fn=[];function Nr(e){wo(e),fn.push(e)}function wo(e){for(let t=fn.length-1;t>=0;t--)if(fn[t]===e){fn.splice(t,1);break}}function Ea(e){return fn.length>0&&fn[fn.length-1]===e}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */async function Aa(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function yt(e,t){return new Promise(n=>{const o=new AbortController,{signal:a}=o;if(e.classList.contains(t))return;e.classList.add(t);let s=!1,r=()=>{s||(s=!0,e.classList.remove(t),n(),o.abort())};e.addEventListener("animationend",r,{once:!0,signal:a}),e.addEventListener("animationcancel",r,{once:!0,signal:a}),requestAnimationFrame(()=>{!s&&e.getAnimations().length===0&&r()})})}function ms(e){return e=e.toString().toLowerCase(),e.indexOf("ms")>-1?parseFloat(e)||0:e.indexOf("s")>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}function hl(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ut=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.hasSlotController=new In(this,"footer","header-actions","label"),this.renderedWatcher=new il(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.withLabel=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&Ea(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.drawer.showModal(),sa(this),this.renderedWatcher.start(this.drawer))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),ra(this),this.removeOpenListeners()}async requestClose(e){const t=new Do({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,yt(this.drawer,"pulse");return}this.removeOpenListeners(),await yt(this.drawer,"hide"),this.open=!1,this.drawer.close(),ra(this),this.renderedWatcher.stop();const n=this.originalTrigger;typeof n?.focus=="function"&&setTimeout(()=>n.focus()),this.dispatchEvent(new qo)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),Nr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),wo(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&Ea(this)&&this.requestClose(this.drawer)}handleDialogClick(e){const n=e.target.closest('[data-drawer="close"]');n&&(e.stopPropagation(),this.requestClose(n))}async handleDialogPointerDown(e){e.target===this.drawer&&!ll(e,this.drawer)&&(this.lightDismiss?this.requestClose(this.drawer):await yt(this.drawer,"pulse"))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.drawer.open?(this.removeOpenListeners(),this.drawer.close(),ra(this)):e&&!this.drawer.open&&(this.addOpenListeners(),this.drawer.showModal(),sa(this))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open?(this.open=!0,this.requestClose(this.drawer)):this.open||this.renderedWatcher.stop()}async show(){const e=new Po;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),sa(this),this.renderedWatcher.start(this.drawer),requestAnimationFrame(()=>{const t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await yt(this.drawer,"show"),this.dispatchEvent(new Io)}render(){const e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter"),n=this.label.length>0||this.hasSlotController.test("label","withLabel");return J`
      <dialog
        part="dialog"
        aria-labelledby=${vt(e&&n?"title":void 0)}
        aria-label=${vt(!e&&this.label?this.label:void 0)}
        class=${kt({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
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
    `}};ut.css=rl;v([Ee(".drawer")],ut.prototype,"drawer",2);v([B({type:Boolean,reflect:!0})],ut.prototype,"open",2);v([B({reflect:!0})],ut.prototype,"label",2);v([B({reflect:!0})],ut.prototype,"placement",2);v([B({attribute:"without-header",type:Boolean,reflect:!0})],ut.prototype,"withoutHeader",2);v([B({attribute:"light-dismiss",type:Boolean})],ut.prototype,"lightDismiss",2);v([B({attribute:"with-footer",type:Boolean})],ut.prototype,"withFooter",2);v([B({attribute:"with-label",type:Boolean})],ut.prototype,"withLabel",2);v([wt("open",{waitUntilFirstUpdate:!0})],ut.prototype,"handleOpenChange",1);ut=v([Ye("wa-drawer")],ut);document.addEventListener("click",e=>{const t=e.target.closest("[data-drawer]");if(t instanceof Element){const[n,o]=ul(t.getAttribute("data-drawer")||"");if(n==="open"&&o?.length){const s=t.getRootNode().getElementById(o);s?.localName==="wa-drawer"?s.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var pl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var fl=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<"u"&&"createElement"in document&&(t=Object.assign(document.createElement("input"),{required:!0})),n||(n="value");const o={observedAttributes:["required"],message:t?.validationMessage,checkValidity(a){const s={message:"",isValid:!0,invalidKeys:[]};return(a.required??a.hasAttribute("required"))&&!a[n]&&(s.message=typeof o.message=="function"?o.message(a):o.message||"",s.isValid=!1,s.invalidKeys.push("valueMissing")),s}};return o};let ml="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",gl=(e=21)=>{let t="",n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=ml[n[e]&63];return t};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function gs(e,t,n){const o=a=>Object.is(a,-0)?0:a;return e<t?o(t):e>n?o(n):o(e)}function Za(e=""){return`${e}${gl()}`}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var We=class extends Bn{constructor(){super(),this.hasSlotController=new In(this,"hint","label"),this.label="",this.hint="",this.name=null,this.disabled=!1,this.orientation="vertical",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{const t=e.target.closest("wa-radio");if(!t||t.disabled||t.forceDisabled||this.disabled)return;const n=this.value;this.value=t.value,t.checked=!0;const o=this.getAllRadios();for(const a of o)t!==a&&(a.checked=!1,a.setAttribute("tabindex","-1"));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})},this.addEventListener("keydown",this.handleKeyDown),this.addEventListener("click",this.handleRadioClick)}static get validators(){const e=[fl({validationElement:Object.assign(document.createElement("input"),{required:!0,type:"radio",name:Za("__wa-radio")})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e=="number"&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){xn(this.localName,this.size)}get validationTarget(){const e=this.querySelector(":is(wa-radio):not([disabled])");if(e)return e}updated(e){(e.has("disabled")||e.has("size")||e.has("value")||e.has("defaultValue"))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll("wa-radio")]}handleLabelClick(){this.focus()}async syncRadioElements(){const e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute("size",this.size),t.toggleAttribute("data-wa-radio-horizontal",this.orientation!=="vertical"),t.toggleAttribute("data-wa-radio-vertical",this.orientation==="vertical"),t.toggleAttribute("data-wa-radio-first",n===0),t.toggleAttribute("data-wa-radio-inner",n!==0&&n!==e.length-1),t.toggleAttribute("data-wa-radio-last",n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async t=>{await t.updateComplete,!t.disabled&&t.value===this.value?t.checked=!0:t.checked=!1})),this.disabled)e.forEach(t=>{t.tabIndex=-1});else{const t=e.filter(o=>!o.disabled),n=t.find(o=>o.checked);t.length>0&&(n?t.forEach(o=>{o.tabIndex=o.checked?0:-1}):t.forEach((o,a)=>{o.tabIndex=a===0?0:-1})),e.filter(o=>o.disabled).forEach(o=>{o.tabIndex=-1})}}handleKeyDown(e){if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)||this.disabled)return;const t=this.getAllRadios().filter(i=>!i.disabled);if(t.length<=0)return;e.preventDefault();const n=this.value,o=t.find(i=>i.checked)??t[0],a=e.key===" "?0:["ArrowUp","ArrowLeft"].includes(e.key)?-1:1;let s=t.indexOf(o)+a;s||(s=0),s<0&&(s=t.length-1),s>t.length-1&&(s=0);const r=t.some(i=>i.tagName.toLowerCase()==="wa-radio-button");this.getAllRadios().forEach(i=>{i.checked=!1,r||i.setAttribute("tabindex","-1")}),this.value=t[s].value,t[s].checked=!0,r?t[s].shadowRoot.querySelector("button").focus():(t[s].setAttribute("tabindex","0"),t[s].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;const t=this.getAllRadios(),n=t.find(s=>s.checked),o=t.find(s=>!s.disabled),a=n||o;a&&a.focus(e)}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return J`
      <fieldset
        part="form-control"
        class=${kt({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":n})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${kt({label:!0,"has-label":n})}
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
          class=${kt({"has-slotted":o})}
          aria-hidden=${o?"false":"true"}
          >${this.hint}</slot
        >
      </fieldset>
    `}};We.css=[Hn,Xa,pl];We.shadowRootOptions={...Bn.shadowRootOptions,delegatesFocus:!0};v([Ee("slot:not([name])")],We.prototype,"defaultSlot",2);v([B()],We.prototype,"label",2);v([B({attribute:"hint"})],We.prototype,"hint",2);v([B({reflect:!0})],We.prototype,"name",2);v([B({type:Boolean,reflect:!0})],We.prototype,"disabled",2);v([B({reflect:!0})],We.prototype,"orientation",2);v([Zt()],We.prototype,"value",1);v([B({attribute:"value",reflect:!0})],We.prototype,"defaultValue",2);v([B({reflect:!0})],We.prototype,"size",2);v([wt("size")],We.prototype,"handleSizeChange",1);v([B({type:Boolean,reflect:!0})],We.prototype,"required",2);v([B({type:Boolean,attribute:"with-label"})],We.prototype,"withLabel",2);v([B({type:Boolean,attribute:"with-hint"})],We.prototype,"withHint",2);We=v([Ye("wa-radio-group")],We);We.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var mt=class extends Bn{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance="default",this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener("click",this.handleClick)}handleSizeChange(){xn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute("role","radio"),this.tabIndex=0,this.setAttribute("aria-disabled",this.disabled||this.forceDisabled?"true":"false")}updated(e){if(super.updated(e),e.has("checked")&&(this.customStates.set("checked",this.checked),this.setAttribute("aria-checked",this.checked?"true":"false"),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has("disabled")||e.has("forceDisabled")){const t=this.disabled||this.forceDisabled;this.customStates.set("disabled",t),this.setAttribute("aria-disabled",t?"true":"false"),t?this.tabIndex=-1:this.tabIndex=this.checked?0:-1}}setValue(){}render(){return J`
      <span part="control" class="control">
        ${this.checked?J`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:""}
      </span>

      <slot part="label" class="label"></slot>
    `}};mt.css=[Xa,Hn,wl];v([Zt()],mt.prototype,"checked",2);v([Zt()],mt.prototype,"forceDisabled",2);v([B({reflect:!0})],mt.prototype,"value",2);v([B({reflect:!0})],mt.prototype,"appearance",2);v([B({reflect:!0})],mt.prototype,"size",2);v([wt("size")],mt.prototype,"handleSizeChange",1);v([B({type:Boolean})],mt.prototype,"disabled",2);mt=v([Ye("wa-radio")],mt);mt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var bl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gn=class extends st{constructor(){super(...arguments),this.variant="brand",this.appearance="accent",this.pill=!1,this.attention="none"}render(){return J`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};gn.css=[Qa,bl];v([B({reflect:!0})],gn.prototype,"variant",2);v([B({reflect:!0})],gn.prototype,"appearance",2);v([B({type:Boolean,reflect:!0})],gn.prototype,"pill",2);v([B({reflect:!0})],gn.prototype,"attention",2);gn=v([Ye("wa-badge")],gn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var yl=class extends Event{constructor(){super("wa-remove",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var vl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var zt=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.variant="neutral",this.appearance="filled-outlined",this.size="m",this.pill=!1,this.withRemove=!1}handleSizeChange(){xn(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new yl)}render(){return J`
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
    `}};zt.css=[vl,Qa,Hn];v([B({reflect:!0})],zt.prototype,"variant",2);v([B({reflect:!0})],zt.prototype,"appearance",2);v([B({reflect:!0})],zt.prototype,"size",2);v([wt("size")],zt.prototype,"handleSizeChange",1);v([B({type:Boolean,reflect:!0})],zt.prototype,"pill",2);v([B({attribute:"with-remove",type:Boolean})],zt.prototype,"withRemove",2);zt=v([Ye("wa-tag")],zt);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var kl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xn=null,uo=0;function $l(){if(uo+=1,Xn||typeof document>"u")return;const e=document.createElement("div");e.id=Za("wa-toast-live-region-"),e.setAttribute("data-wa-toast-live-region",""),e.style.cssText=`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    pointer-events: none;
    top: 0;
    left: 0;
  `,document.body.append(e),Xn=e}function xl(){uo=Math.max(0,uo-1),!(uo>0)&&(Xn?.remove(),Xn=null)}function Sl(e,t){if(typeof document>"u")return;const n=Xn;if(!n)return;const o=e.trim();if(!o)return;const a=document.createElement("div");a.setAttribute("role",t==="danger"?"alert":"status"),a.setAttribute("aria-live",t==="danger"?"assertive":"polite"),a.setAttribute("aria-atomic","true"),n.append(a),requestAnimationFrame(()=>{requestAnimationFrame(()=>{a.textContent=o})}),setTimeout(()=>a.remove(),1e3)}var Qn=class extends st{constructor(){super(...arguments),this.activatedToastItems=new WeakSet,this.positionCache=new Map,this.placement="top-end",this.handleDocumentKeyDown=async e=>{if(await new Promise(t=>setTimeout(t)),e.key==="Escape"&&!e.defaultPrevented){const t=this.getToastItems();t.length>0&&(e.preventDefault(),t[t.length-1]?.hide())}},this.handleAfterHide=async e=>{const t=e.target;t.parentElement===this&&(this.capturePositions(),t.remove(),await this.animatePositions()),this.getToastItems().length===0&&this.hideStack()}}connectedCallback(){super.connectedCallback(),this.popover="manual",$l(),document.addEventListener("keydown",this.handleDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener?.("keydown",this.handleDocumentKeyDown),xl()}handleSlotChange(){const e=this.getToastItems(),t=[];e.forEach(n=>{this.activatedToastItems.has(n)||t.push(n)}),t.length>0&&(this.capturePositions(),t.forEach(n=>{this.activatedToastItems.add(n),this.showStack(),n.startTimer(),this.announceToastItem(n)}),requestAnimationFrame(()=>this.animatePositions()))}announceToastItem(e){Sl(e.textContent??"",e.variant)}getToastItems(){return[...this.querySelectorAll(":scope > wa-toast-item")]}capturePositions(){this.positionCache.clear();for(const e of this.getToastItems())this.positionCache.set(e,e.getBoundingClientRect())}async animatePositions(){if(hl()){this.positionCache.clear();return}const e=[];for(const t of this.getToastItems()){const n=this.positionCache.get(t);if(!n)continue;const o=t.getBoundingClientRect(),a=n.top-o.top;if(Math.abs(a)>1){const s=Aa(t,[{transform:`translateY(${a}px)`},{transform:"translateY(0)"}],{duration:200,easing:"cubic-bezier(0.2, 0, 0, 1)"});e.push(s)}}this.positionCache.clear(),await Promise.all(e)}showStack(){this.matches(":popover-open")||(this.showPopover(),this.customStates.set("visible",!0))}hideStack(){this.matches(":popover-open")&&(this.hidePopover(),this.customStates.set("visible",!1))}async create(e,t){const n={allowHtml:!1,duration:5e3,variant:"neutral",size:"m",...t},o=document.createElement("wa-toast-item");if(o.variant=n.variant,o.size=n.size,o.duration=n.duration,n.allowHtml?o.innerHTML=e:o.textContent=e,n.icon){const a=document.createElement("wa-icon");a.setAttribute("slot","icon"),typeof n.icon=="string"?a.setAttribute("name",n.icon):(a.setAttribute("name",n.icon.name),n.icon.library&&a.setAttribute("library",n.icon.library),n.icon.family&&a.setAttribute("family",n.icon.family),n.icon.variant&&a.setAttribute("variant",n.icon.variant)),o.prepend(a)}return this.activatedToastItems.add(o),this.capturePositions(),this.showStack(),this.prepend(o),await o.updateComplete,this.animatePositions(),o.startTimer(),this.announceToastItem(o),o}render(){return J`
      <div part="stack" class="stack" @wa-after-hide=${this.handleAfterHide}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Qn.css=kl;v([Ee(".stack")],Qn.prototype,"stack",2);v([B({reflect:!0})],Qn.prototype,"placement",2);Qn=v([Ye("wa-toast")],Qn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var _l=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var _t=class extends st{constructor(){super(...arguments),this.hasSlotController=new In(this,"icon"),this.localize=new At(this),this.animationFrame=null,this.startTime=null,this.isHovering=!1,this.isFocused=!1,this.timeLeft=100,this.variant="neutral",this.size="m",this.duration=5e3,this.withIcon=!1,this.tick=()=>{if(!this.startTime)return;const e=performance.now()-this.startTime,t=Math.min(e/this.duration,1);this.timeLeft=100*(1-t),t<1?this.animationFrame=requestAnimationFrame(this.tick):this.hide()},this.handlePointerEnter=e=>{(e.pointerType==="mouse"||e.pointerType==="pen")&&(this.isHovering=!0,this.pauseTimer())},this.handlePointerLeave=()=>{this.isHovering&&(this.isHovering=!1,this.resumeTimer())},this.handleFocusIn=()=>{this.isFocused=!0,this.pauseTimer()},this.handleFocusOut=()=>{this.isFocused=!1,this.resumeTimer()}}handleSizeChange(){xn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener("pointerenter",this.handlePointerEnter),this.addEventListener("pointerleave",this.handlePointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),this.removeEventListener("pointerenter",this.handlePointerEnter),this.removeEventListener("pointerleave",this.handlePointerLeave)}async startTimer(){const e=new Po;this.dispatchEvent(e),!e.defaultPrevented&&(await this.updateComplete,await yt(this.toastItemElement,"show"),this.dispatchEvent(new Io),this.duration>0&&Number.isFinite(this.duration)&&(this.startTime=performance.now(),this.timeLeft=100,this.tick()))}stopTimer(){this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null)}async hide(){this.stopTimer();const e=new Do;this.dispatchEvent(e),!e.defaultPrevented&&(await yt(this.toastItemElement,"hide"),this.dispatchEvent(new qo),this.remove())}handleCloseClick(){this.hide()}pauseTimer(){this.stopTimer(),this.timeLeft=100}resumeTimer(){!this.isHovering&&!this.isFocused&&this.duration>0&&(this.startTime=performance.now(),this.tick())}render(){const e=this.hasUpdated?this.hasSlotController.test("icon"):this.withIcon,t=this.duration>0;return J`
      <div
        part="toast-item"
        class=${kt({"toast-item":!0,"toast-item--has-icon":e,"toast-item--has-duration":t})}
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
    `}};_t.css=[_l,Qa,Hn];v([Ee(".toast-item")],_t.prototype,"toastItemElement",2);v([Zt()],_t.prototype,"timeLeft",2);v([B({reflect:!0})],_t.prototype,"variant",2);v([B({reflect:!0})],_t.prototype,"size",2);v([wt("size")],_t.prototype,"handleSizeChange",1);v([B({type:Number})],_t.prototype,"duration",2);v([B({attribute:"with-icon",type:Boolean})],_t.prototype,"withIcon",2);_t=v([Ye("wa-toast-item")],_t);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Cl=Ve`
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
 */const zr="important",El=" !"+zr,ws=Tr(class extends Rr{constructor(e){if(super(e),e.type!==Lr.ATTRIBUTE||e.name!=="style"||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{const o=e[n];return o==null?t:t+`${n=n.includes("-")?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${o};`},"")}update(e,[t]){const{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const o of this.ft)t[o]==null&&(this.ft.delete(o),o.includes("-")?n.removeProperty(o):n[o]=null);for(const o in t){const a=t[o];if(a!=null){this.ft.add(o);const s=typeof a=="string"&&a.endsWith(El);o.includes("-")||s?n.setProperty(o,s?a.slice(0,-11):a,s?zr:""):n[o]=a}}return Mr}});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Kt=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.value=0,this.label=""}updated(e){if(super.updated(e),e.has("value")){const t=parseFloat(getComputedStyle(this.indicator).getPropertyValue("r")),n=2*Math.PI*t,o=n-this.value/100*n;this.indicatorOffset=`${o}px`}}render(){return J`
      <div
        part="base progress-ring"
        class="progress-ring"
        role="progressbar"
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-describedby="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style=${ws({"--percentage":this.value/100})}
      >
        <svg class="image">
          <circle part="track" class="track"></circle>
          <circle
            part="indicator"
            class="indicator"
            style=${ws({"stroke-dashoffset":this.indicatorOffset})}
          ></circle>
        </svg>

        <slot id="label" part="label" class="label"></slot>
      </div>
    `}};Kt.css=Cl;v([Ee(".indicator")],Kt.prototype,"indicator",2);v([Zt()],Kt.prototype,"indicatorOffset",2);v([B({type:Number,reflect:!0})],Kt.prototype,"value",2);v([B()],Kt.prototype,"label",2);Kt=v([Ye("wa-progress-ring")],Kt);Kt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Al=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var He=class extends Bn{constructor(){super(...arguments),this.hasSlotController=new In(this,"hint"),this.localize=new At(this),this.title="",this.name=null,this._value=this.getAttribute("value")??null,this.size="m",this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute("checked"),this.required=!1,this.hint="",this.withHint=!1}static get validators(){return[...super.validators,Yi()]}get value(){return this._value??"on"}set value(e){this._value=e}handleSizeChange(){xn(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})}handleKeyDown(e){const t=this.localize.dir()==="rtl";e.key==="ArrowLeft"&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))})),e.key==="ArrowRight"&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has("value")||e.has("checked")||e.has("defaultChecked")||e.has("disabled"))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set("checked",this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??"on",t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){const e=this.hasSlotController.test("hint","withHint"),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:Or(this.checked);return J`
      <label
        part="base switch"
        class=${kt({checked:this.checked,disabled:this.disabled})}
      >
        <input
          class="input"
          type="checkbox"
          title=${this.title}
          name=${vt(this.name)}
          value=${vt(this.value)}
          .checked=${vt(o)}
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
        class=${kt({"has-slotted":t})}
        aria-hidden=${t?"false":"true"}
        >${this.hint}</slot
      >
    `}};He.shadowRootOptions={...Bn.shadowRootOptions,delegatesFocus:!0};He.css=[Xa,Hn,Al];v([Ee('input[type="checkbox"]')],He.prototype,"input",2);v([B()],He.prototype,"title",2);v([B({reflect:!0})],He.prototype,"name",2);v([B({reflect:!0})],He.prototype,"value",1);v([B({reflect:!0})],He.prototype,"size",2);v([wt("size")],He.prototype,"handleSizeChange",1);v([B({type:Boolean})],He.prototype,"disabled",2);v([B({type:Boolean,attribute:!1})],He.prototype,"checked",1);v([B({type:Boolean,attribute:"checked",reflect:!0})],He.prototype,"defaultChecked",2);v([B({type:Boolean,reflect:!0})],He.prototype,"required",2);v([B({attribute:"hint"})],He.prototype,"hint",2);v([B({attribute:"with-hint",type:Boolean})],He.prototype,"withHint",2);v([wt(["checked","defaultChecked"])],He.prototype,"handleStateChange",1);v([wt("disabled",{waitUntilFirstUpdate:!0})],He.prototype,"handleDisabledChange",1);He=v([Ye("wa-switch")],He);He.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Tl=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function bs(e,t){return new Promise(n=>{function o(a){a.target===e&&(e.removeEventListener(t,o),n())}e.addEventListener(t,o)})}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qe=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance="outlined",this.iconPlacement="end"}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?"auto":"0",this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(t=>{for(const n of t)n.type==="attributes"&&n.attributeName==="open"&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has("isAnimating")&&this.customStates.set("animating",this.isAnimating)}handleSummaryClick(e){e.composedPath().some(o=>{if(!(o instanceof HTMLElement))return!1;const a=o.tagName?.toLowerCase();return["a","button","input","textarea","select"].includes(a)?!0:o instanceof Bn?!("disabled"in o)||!o.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&(e.preventDefault(),this.hide()),(e.key==="ArrowDown"||e.key==="ArrowRight")&&(e.preventDefault(),this.show())}closeOthersWithSameName(){if(!this.name)return;this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(n=>{n!==this&&n.open&&(n.open=!1)})}async handleOpenChange(){this.animationGeneration++;const e=this.animationGeneration;if(this.open){this.details.open=!0;const t=new Po;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;const n=ms(getComputedStyle(this.body).getPropertyValue("--show-duration"));if(await Aa(this.body,[{height:"0",opacity:"0"},{height:`${this.body.scrollHeight}px`,opacity:"1"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="auto",this.isAnimating=!1,this.dispatchEvent(new Io)}else{const t=new Do;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;const n=ms(getComputedStyle(this.body).getPropertyValue("--hide-duration"));if(await Aa(this.body,[{height:`${this.body.scrollHeight}px`,opacity:"1"},{height:"0",opacity:"0"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="0",this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new qo)}}async show(){if(!(this.open||this.disabled))return this.open=!0,bs(this,"wa-after-show")}async hide(){if(!(!this.open||this.disabled))return this.open=!1,bs(this,"wa-after-hide")}render(){const e=this.hasUpdated?this.localize.dir()==="rtl":this.dir==="rtl";return J`
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
          class=${kt({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};Qe.css=Tl;v([Ee("details")],Qe.prototype,"details",2);v([Ee("summary")],Qe.prototype,"header",2);v([Ee(".body")],Qe.prototype,"body",2);v([Ee(".expand-icon-slot")],Qe.prototype,"expandIconSlot",2);v([Zt()],Qe.prototype,"isAnimating",2);v([B({type:Boolean,reflect:!0})],Qe.prototype,"open",2);v([B()],Qe.prototype,"summary",2);v([B({reflect:!0})],Qe.prototype,"name",2);v([B({type:Boolean,reflect:!0})],Qe.prototype,"disabled",2);v([B({reflect:!0})],Qe.prototype,"appearance",2);v([B({attribute:"icon-placement",reflect:!0})],Qe.prototype,"iconPlacement",2);v([wt("open",{waitUntilFirstUpdate:!0})],Qe.prototype,"handleOpenChange",1);Qe=v([Ye("wa-details")],Qe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Rl=class extends Event{constructor(e){super("wa-select",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function*Pr(e=document.activeElement){e!=null&&(yield e,"shadowRoot"in e&&e.shadowRoot&&e.shadowRoot.mode!=="closed"&&(yield*Pr(e.shadowRoot.activeElement)))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ll=Ve`
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
`;const Jt=Math.min,Ot=Math.max,bo=Math.round,ao=Math.floor,Nt=e=>({x:e,y:e}),Ml={left:"right",right:"left",bottom:"top",top:"bottom"};function Dr(e,t,n){return Ot(e,Jt(t,n))}function Fn(e,t){return typeof e=="function"?e(t):e}function wn(e){return e.split("-")[0]}function jn(e){return e.split("-")[1]}function qr(e){return e==="x"?"y":"x"}function es(e){return e==="y"?"height":"width"}function Lt(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function ts(e){return qr(Lt(e))}function Ol(e,t,n){n===void 0&&(n=!1);const o=jn(e),a=ts(e),s=es(a);let r=a==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(r=yo(r)),[r,yo(r)]}function Nl(e){const t=yo(e);return[Ta(e),t,Ta(t)]}function Ta(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const ys=["left","right"],vs=["right","left"],zl=["top","bottom"],Pl=["bottom","top"];function Dl(e,t,n){switch(e){case"top":case"bottom":return n?t?vs:ys:t?ys:vs;case"left":case"right":return t?zl:Pl;default:return[]}}function ql(e,t,n,o){const a=jn(e);let s=Dl(wn(e),n==="start",o);return a&&(s=s.map(r=>r+"-"+a),t&&(s=s.concat(s.map(Ta)))),s}function yo(e){const t=wn(e);return Ml[t]+e.slice(t.length)}function Il(e){var t,n,o,a;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(a=e.left)!=null?a:0}}function Ir(e){return typeof e!="number"?Il(e):{top:e,right:e,bottom:e,left:e}}function vo(e){const{x:t,y:n,width:o,height:a}=e;return{width:o,height:a,top:n,left:t,right:t+o,bottom:n+a,x:t,y:n}}function ks(e,t,n){let{reference:o,floating:a}=e;const s=Lt(t),r=ts(t),i=es(r),c=wn(t),l=s==="y",d=o.x+o.width/2-a.width/2,u=o.y+o.height/2-a.height/2,b=o[i]/2-a[i]/2;let p;switch(c){case"top":p={x:d,y:o.y-a.height};break;case"bottom":p={x:d,y:o.y+o.height};break;case"right":p={x:o.x+o.width,y:u};break;case"left":p={x:o.x-a.width,y:u};break;default:p={x:o.x,y:o.y}}const f=jn(t);return f&&(p[r]+=b*(f==="end"?1:-1)*(n&&l?-1:1)),p}async function Hl(e,t){var n;t===void 0&&(t={});const{x:o,y:a,platform:s,rects:r,elements:i,strategy:c}=e,{boundary:l="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:b=!1,padding:p=0}=Fn(t,e),f=Ir(p),h=i[b?u==="floating"?"reference":"floating":u],w=vo(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(h)))==null||n?h:h.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(i.floating)),boundary:l,rootBoundary:d,strategy:c})),g=u==="floating"?{x:o,y:a,width:r.floating.width,height:r.floating.height}:r.reference,$=await(s.getOffsetParent==null?void 0:s.getOffsetParent(i.floating)),R=await(s.isElement==null?void 0:s.isElement($))&&await(s.getScale==null?void 0:s.getScale($))||{x:1,y:1},E=vo(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:i,rect:g,offsetParent:$,strategy:c}):g);return{top:(w.top-E.top+f.top)/R.y,bottom:(E.bottom-w.bottom+f.bottom)/R.y,left:(w.left-E.left+f.left)/R.x,right:(E.right-w.right+f.right)/R.x}}const Bl=50,Fl=async(e,t,n)=>{const{placement:o="bottom",strategy:a="absolute",middleware:s=[],platform:r}=n,i=r.detectOverflow?r:{...r,detectOverflow:Hl},c=await(r.isRTL==null?void 0:r.isRTL(t));let l=await r.getElementRects({reference:e,floating:t,strategy:a}),{x:d,y:u}=ks(l,o,c),b=o,p=0;const f={};for(let y=0;y<s.length;y++){const h=s[y];if(!h)continue;const{name:w,fn:g}=h,{x:$,y:R,data:E,reset:P}=await g({x:d,y:u,initialPlacement:o,placement:b,strategy:a,middlewareData:f,rects:l,platform:i,elements:{reference:e,floating:t}});d=$??d,u=R??u,f[w]={...f[w],...E},P&&p<Bl&&(p++,typeof P=="object"&&(P.placement&&(b=P.placement),P.rects&&(l=P.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:a}):P.rects),{x:d,y:u}=ks(l,b,c)),y=-1)}return{x:d,y:u,placement:b,strategy:a,middlewareData:f}},jl=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:a,rects:s,platform:r,elements:i,middlewareData:c}=t,{element:l,padding:d=0}=Fn(e,t)||{};if(l==null)return{};const u=Ir(d),b={x:n,y:o},p=ts(a),f=es(p),y=await r.getDimensions(l),h=p==="y",w=h?"top":"left",g=h?"bottom":"right",$=h?"clientHeight":"clientWidth",R=s.reference[f]+s.reference[p]-b[p]-s.floating[f],E=b[p]-s.reference[p],P=await(r.getOffsetParent==null?void 0:r.getOffsetParent(l));let Z=P?P[$]:0;(!Z||!await(r.isElement==null?void 0:r.isElement(P)))&&(Z=i.floating[$]||s.floating[f]);const Q=R/2-E/2,ne=Z/2-y[f]/2-1,T=Jt(u[w],ne),V=Jt(u[g],ne),q=Z-y[f]-V,m=Z/2-y[f]/2+Q,D=Dr(T,m,q),F=!c.arrow&&jn(a)!=null&&m!==D&&s.reference[f]/2-(m<T?T:V)-y[f]/2<0,N=F?m<T?m-T:m-q:0;return{[p]:b[p]+N,data:{[p]:D,centerOffset:m-D-N,...F&&{alignmentOffset:N}},reset:F}}}),Wl=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:a,middlewareData:s,rects:r,initialPlacement:i,platform:c,elements:l}=t,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:b,fallbackStrategy:p="bestFit",fallbackAxisSideDirection:f="none",flipAlignment:y=!0,...h}=Fn(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const w=wn(a),g=Lt(i),$=wn(i)===i,R=await(c.isRTL==null?void 0:c.isRTL(l.floating)),E=b||($||!y?[yo(i)]:Nl(i)),P=f!=="none";!b&&P&&E.push(...ql(i,y,f,R));const Z=[i,...E],Q=await c.detectOverflow(t,h),ne=[];let T=((o=s.flip)==null?void 0:o.overflows)||[];if(d&&ne.push(Q[w]),u){const D=Ol(a,r,R);ne.push(Q[D[0]],Q[D[1]])}if(T=[...T,{placement:a,overflows:ne}],!ne.every(D=>D<=0)){var V,q;const D=(((V=s.flip)==null?void 0:V.index)||0)+1,F=Z[D];if(F&&(!(u==="alignment"?g!==Lt(F):!1)||T.every(U=>Lt(U.placement)===g?U.overflows[0]>0:!0)))return{data:{index:D,overflows:T},reset:{placement:F}};let N=(q=T.filter(W=>W.overflows[0]<=0).sort((W,U)=>W.overflows[1]-U.overflows[1])[0])==null?void 0:q.placement;if(!N)switch(p){case"bestFit":{var m;const W=(m=T.filter(U=>{if(P){const ee=Lt(U.placement);return ee===g||ee==="y"}return!0}).map(U=>[U.placement,U.overflows.filter(ee=>ee>0).reduce((ee,se)=>ee+se,0)]).sort((U,ee)=>U[1]-ee[1])[0])==null?void 0:m[0];W&&(N=W);break}case"initialPlacement":N=i;break}if(a!==N)return{reset:{placement:N}}}return{}}}},Ul=new Set(["left","top"]);async function Vl(e,t){const{placement:n,platform:o,elements:a}=e,s=await(o.isRTL==null?void 0:o.isRTL(a.floating)),r=wn(n),i=jn(n),c=Lt(n)==="y",l=Ul.has(r)?-1:1,d=s&&c?-1:1,u=Fn(t,e);let{mainAxis:b,crossAxis:p,alignmentAxis:f}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return i&&typeof f=="number"&&(p=i==="end"?f*-1:f),c?{x:p*d,y:b*l}:{x:b*l,y:p*d}}const Kl=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:a,y:s,placement:r,middlewareData:i}=t,c=await Vl(t,e);return r===((n=i.offset)==null?void 0:n.placement)&&(o=i.arrow)!=null&&o.alignmentOffset?{}:{x:a+c.x,y:s+c.y,data:{...c,placement:r}}}}},Jl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:a,platform:s}=t,{mainAxis:r=!0,crossAxis:i=!1,limiter:c={fn:g=>{let{x:$,y:R}=g;return{x:$,y:R}}},...l}=Fn(e,t),d={x:n,y:o},u=await s.detectOverflow(t,l),b=Lt(a),p=qr(b);let f=d[p],y=d[b];const h=(g,$)=>Dr($+u[g==="y"?"top":"left"],$,$-u[g==="y"?"bottom":"right"]);r&&(f=h(p,f)),i&&(y=h(b,y));const w=c.fn({...t,[p]:f,[b]:y});return{...w,data:{x:w.x-n,y:w.y-o,enabled:{[p]:r,[b]:i}}}}}},Yl=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:a,elements:s}=t,{apply:r=()=>{},...i}=Fn(e,t),c=await a.detectOverflow(t,i),l=wn(n),d=jn(n),u=Lt(n)==="y",{width:b,height:p}=o.floating;let f,y;l==="top"||l==="bottom"?(f=l,y=d===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(y=l,f=d==="end"?"top":"bottom");const h=p-c.top-c.bottom,w=b-c.left-c.right,g=Jt(p-c[f],h),$=Jt(b-c[y],w),R=t.middlewareData.shift,E=!R;let P=g,Z=$;R!=null&&R.enabled.x&&(Z=w),R!=null&&R.enabled.y&&(P=h),E&&!d&&(u?Z=b-2*Ot(c.left,c.right):P=p-2*Ot(c.top,c.bottom)),await r({...t,availableWidth:Z,availableHeight:P});const Q=await a.getDimensions(s.floating);return b!==Q.width||p!==Q.height?{reset:{rects:!0}}:{}}}};function Ho(){return typeof window<"u"}function Wn(e){return Hr(e)?(e.nodeName||"").toLowerCase():"#document"}function nt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Dt(e){var t;return(t=(Hr(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Hr(e){return Ho()?e instanceof Node||e instanceof nt(e).Node:!1}function Ct(e){return Ho()?e instanceof Element||e instanceof nt(e).Element:!1}function en(e){return Ho()?e instanceof HTMLElement||e instanceof nt(e).HTMLElement:!1}function $s(e){return!Ho()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof nt(e).ShadowRoot}function Bo(e){const{overflow:t,overflowX:n,overflowY:o,display:a}=Et(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&a!=="inline"&&a!=="contents"}function Gl(e){return/^(table|td|th)$/.test(Wn(e))}function Fo(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Xl=/transform|translate|scale|rotate|perspective|filter/,Ql=/paint|layout|strict|content/,sn=e=>!!e&&e!=="none";let ia;function jo(e){const t=Ct(e)?Et(e):e;return sn(t.transform)||sn(t.translate)||sn(t.scale)||sn(t.rotate)||sn(t.perspective)||!ns()&&(sn(t.backdropFilter)||sn(t.filter))||Xl.test(t.willChange||"")||Ql.test(t.contain||"")}function Zl(e){let t=bn(e);for(;en(t)&&!Zn(t);){if(jo(t))return t;if(Fo(t))return null;t=bn(t)}return null}function ns(){return ia==null&&(ia=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),ia}function Zn(e){return/^(html|body|#document)$/.test(Wn(e))}function Et(e){return nt(e).getComputedStyle(e)}function Wo(e){return Ct(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function bn(e){if(Wn(e)==="html")return e;const t=e.assignedSlot||e.parentNode||$s(e)&&e.host||Dt(e);return $s(t)?t.host:t}function Br(e){const t=bn(e);return Zn(t)?(e.ownerDocument||e).body:en(t)&&Bo(t)?t:Br(t)}function Mn(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const a=Br(e),s=a===((o=e.ownerDocument)==null?void 0:o.body),r=nt(a);if(s){const i=Ra(r);return t.concat(r,r.visualViewport||[],Bo(a)?a:[],i&&n?Mn(i):[])}else return t.concat(a,Mn(a,[],n))}function Ra(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Fr(e){const t=Et(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const a=en(e),s=a?e.offsetWidth:n,r=a?e.offsetHeight:o,i=bo(n)!==s||bo(o)!==r;return i&&(n=s,o=r),{width:n,height:o,$:i}}function os(e){return Ct(e)?e:e.contextElement}function Tn(e){const t=os(e);if(!en(t))return Nt(1);const n=t.getBoundingClientRect(),{width:o,height:a,$:s}=Fr(t);let r=(s?bo(n.width):n.width)/o,i=(s?bo(n.height):n.height)/a;return(!r||!Number.isFinite(r))&&(r=1),(!i||!Number.isFinite(i))&&(i=1),{x:r,y:i}}const ec=Nt(0);function jr(e){const t=nt(e);return!ns()||!t.visualViewport?ec:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function tc(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===nt(e)}function yn(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const a=e.getBoundingClientRect(),s=os(e);let r=Nt(1);t&&(o?Ct(o)&&(r=Tn(o)):r=Tn(e));const i=tc(s,n,o)?jr(s):Nt(0);let c=(a.left+i.x)/r.x,l=(a.top+i.y)/r.y,d=a.width/r.x,u=a.height/r.y;if(s&&o){const b=nt(s),p=Ct(o)?nt(o):o;let f=b,y=Ra(f);for(;y&&p!==f;){const h=Tn(y),w=y.getBoundingClientRect(),g=Et(y),$=w.left+(y.clientLeft+parseFloat(g.paddingLeft))*h.x,R=w.top+(y.clientTop+parseFloat(g.paddingTop))*h.y;c*=h.x,l*=h.y,d*=h.x,u*=h.y,c+=$,l+=R,f=nt(y),y=Ra(f)}}return vo({width:d,height:u,x:c,y:l})}function Uo(e,t){const n=Wo(e).scrollLeft;return t?t.left+n:yn(Dt(e)).left+n}function Wr(e,t){const n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-Uo(e,n),a=n.top+t.scrollTop;return{x:o,y:a}}function nc(e){let{elements:t,rect:n,offsetParent:o,strategy:a}=e;const s=a==="fixed",r=Dt(o),i=t?Fo(t.floating):!1;if(o===r||i&&s)return n;let c={scrollLeft:0,scrollTop:0},l=Nt(1);const d=Nt(0),u=en(o);if((u||!s)&&((Wn(o)!=="body"||Bo(r))&&(c=Wo(o)),u)){const p=yn(o);l=Tn(o),d.x=p.x+o.clientLeft,d.y=p.y+o.clientTop}const b=r&&!u&&!s?Wr(r,c):Nt(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+d.x+b.x,y:n.y*l.y-c.scrollTop*l.y+d.y+b.y}}function oc(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function ac(e){const t=Wo(e),n=e.ownerDocument.body,o=Ot(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),a=Ot(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+Uo(e);const r=-t.scrollTop;return Et(n).direction==="rtl"&&(s+=Ot(e.clientWidth,n.clientWidth)-o),{width:o,height:a,x:s,y:r}}const sc=25;function rc(e,t,n){n===void 0&&(n="viewport");const o=n==="layoutViewport",a=nt(e),s=Dt(e),r=a.visualViewport;let i=s.clientWidth,c=s.clientHeight,l=0,d=0;if(r){const b=!ns()||t==="fixed";o?b||(l=-r.offsetLeft,d=-r.offsetTop):(i=r.width,c=r.height,b&&(l=r.offsetLeft,d=r.offsetTop))}if(Uo(s)<=0){const b=s.ownerDocument,p=b.body,f=getComputedStyle(p),y=b.compatMode==="CSS1Compat"&&parseFloat(f.marginLeft)+parseFloat(f.marginRight)||0,h=Math.abs(s.clientWidth-p.clientWidth-y),w=getComputedStyle(s).scrollbarGutter==="stable both-edges"?h/2:h;w<=sc&&(i-=w)}return{width:i,height:c,x:l,y:d}}function ic(e,t){const n=yn(e,!0,t==="fixed"),o=n.top+e.clientTop,a=n.left+e.clientLeft,s=Tn(e),r=e.clientWidth*s.x,i=e.clientHeight*s.y,c=a*s.x,l=o*s.y;return{width:r,height:i,x:c,y:l}}function xs(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=rc(e,n,t);else if(t==="document")o=ac(Dt(e));else if(Ct(t))o=ic(t,n);else{const a=jr(e);o={x:t.x-a.x,y:t.y-a.y,width:t.width,height:t.height}}return vo(o)}function lc(e,t){const n=t.get(e);if(n)return n;let o=Mn(e,[],!1).filter(i=>Ct(i)&&Wn(i)!=="body"),a=null;const s=Et(e).position==="fixed";let r=s?bn(e):e;for(;Ct(r)&&!Zn(r);){const i=Et(r),c=jo(r),l=a?a.position:s?"fixed":"";!c&&(l==="fixed"||l==="absolute"&&i.position==="static")?o=o.filter(u=>u!==r):a=i,r=bn(r)}return t.set(e,o),o}function cc(e){let{element:t,boundary:n,rootBoundary:o,strategy:a}=e;const r=[...n==="clippingAncestors"?Fo(t)?[]:lc(t,this._c):[].concat(n),o],i=xs(t,r[0],a);let c=i.top,l=i.right,d=i.bottom,u=i.left;for(let b=1;b<r.length;b++){const p=xs(t,r[b],a);c=Ot(p.top,c),l=Jt(p.right,l),d=Jt(p.bottom,d),u=Ot(p.left,u)}return{width:l-u,height:d-c,x:u,y:c}}function dc(e){const{width:t,height:n}=Fr(e);return{width:t,height:n}}function uc(e,t,n){const o=en(t),a=Dt(t),s=n==="fixed",r=yn(e,!0,s,t);let i={scrollLeft:0,scrollTop:0};const c=Nt(0);if((o||!s)&&((Wn(t)!=="body"||Bo(a))&&(i=Wo(t)),o)){const b=yn(t,!0,s,t);c.x=b.x+t.clientLeft,c.y=b.y+t.clientTop}!o&&a&&(c.x=Uo(a));const l=a&&!o&&!s?Wr(a,i):Nt(0),d=r.left+i.scrollLeft-c.x-l.x,u=r.top+i.scrollTop-c.y-l.y;return{x:d,y:u,width:r.width,height:r.height}}function la(e){return Et(e).position==="static"}function Ss(e,t){if(!en(e)||Et(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return Dt(e)===n&&(n=n.ownerDocument.body),n}function Ur(e,t){const n=nt(e);if(Fo(e))return n;if(!en(e)){let a=bn(e);for(;a&&!Zn(a);){if(Ct(a)&&!la(a))return a;a=bn(a)}return n}let o=Ss(e,t);for(;o&&Gl(o)&&la(o);)o=Ss(o,t);return o&&Zn(o)&&la(o)&&!jo(o)?n:o||Zl(e)||n}const hc=async function(e){const t=this.getOffsetParent||Ur,n=this.getDimensions,o=await n(e.floating);return{reference:uc(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function pc(e){return Et(e).direction==="rtl"}const ho={convertOffsetParentRelativeRectToViewportRelativeRect:nc,getDocumentElement:Dt,getClippingRect:cc,getOffsetParent:Ur,getElementRects:hc,getClientRects:oc,getDimensions:dc,getScale:Tn,isElement:Ct,isRTL:pc};function Vr(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function fc(e,t,n){let o=null,a;const s=Dt(e);function r(){var d;clearTimeout(a),(d=o)==null||d.disconnect(),o=null}function i(d,u){d===void 0&&(d=!1),u===void 0&&(u=1),r();const b=e.getBoundingClientRect(),{left:p,top:f,width:y,height:h}=b;if(d||t(),!y||!h)return;const w=ao(f),g=ao(s.clientWidth-(p+y)),$=ao(s.clientHeight-(f+h)),R=ao(p),P={rootMargin:-w+"px "+-g+"px "+-$+"px "+-R+"px",threshold:Ot(0,Jt(1,u))||1};let Z=!0;function Q(ne){const T=ne[0].intersectionRatio;if(!Vr(b,e.getBoundingClientRect()))return i();if(T!==u){if(!Z)return i();T?i(!1,T):a=setTimeout(()=>{i(!1,1e-7)},1e3)}Z=!1}try{o=new IntersectionObserver(Q,{...P,root:s.ownerDocument})}catch{o=new IntersectionObserver(Q,P)}o.observe(e)}const c=nt(e),l=()=>i(n);return c.addEventListener("resize",l),i(!0),()=>{c.removeEventListener("resize",l),r()}}function Kr(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:a=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:i=typeof IntersectionObserver=="function",animationFrame:c=!1}=o,l=os(e),d=a||s?[...l?Mn(l):[],...t?Mn(t):[]]:[];d.forEach(w=>{a&&w.addEventListener("scroll",n),s&&w.addEventListener("resize",n)});const u=l&&i?fc(l,n,s):null;let b=-1,p=null;r&&(p=new ResizeObserver(w=>{let[g]=w;g&&g.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(b),b=requestAnimationFrame(()=>{var $;($=p)==null||$.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let f,y=c?yn(e):null;c&&h();function h(){const w=yn(e);y&&!Vr(y,w)&&n(),y=w,f=requestAnimationFrame(h)}return n(),()=>{var w;d.forEach(g=>{a&&g.removeEventListener("scroll",n),s&&g.removeEventListener("resize",n)}),u?.(),(w=p)==null||w.disconnect(),p=null,c&&cancelAnimationFrame(f)}}const Jr=Kl,Yr=Jl,Gr=Wl,_s=Yl,mc=jl,Xr=(e,t,n)=>{const o=new Map,a=n??{},s={...ho,...a.platform,_c:o};return Fl(e,t,{...a,platform:s})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ca=new Set,Xe=class extends st{constructor(){super(...arguments),this.submenuCleanups=new Map,this.localize=new At(this),this.userTypedQuery="",this.openSubmenuStack=[],this.open=!1,this.size="m",this.placement="bottom-start",this.distance=0,this.skidding=0,this.handleDocumentKeyDown=async e=>{const t=this.localize.dir()==="rtl";if(e.key==="Escape"&&this.open&&Ea(this)){const d=this.getTrigger();e.preventDefault(),e.stopPropagation(),this.open=!1,d?.focus({preventScroll:!0});return}const n=[...Pr()].find(d=>d.localName==="wa-dropdown-item"),o=n?.localName==="wa-dropdown-item",a=this.getCurrentSubmenuItem(),s=!!a;let r,i,c;s?(r=this.getSubmenuItems(a),i=r.find(d=>d.active||d===n),c=i?r.indexOf(i):-1):(r=this.getItems(),i=r.find(d=>d.active||d===n),c=i?r.indexOf(i):-1);let l;if(e.key==="ArrowUp"&&(e.preventDefault(),e.stopPropagation(),c>0?l=r[c-1]:l=r[r.length-1]),e.key==="ArrowDown"&&(e.preventDefault(),e.stopPropagation(),c!==-1&&c<r.length-1?l=r[c+1]:l=r[0]),e.key===(t?"ArrowLeft":"ArrowRight")&&o&&i&&i.hasSubmenu){e.preventDefault(),e.stopPropagation(),i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,b)=>u.active=b===0),d[0].focus({preventScroll:!0}))},0);return}if(e.key===(t?"ArrowRight":"ArrowLeft")&&s){e.preventDefault(),e.stopPropagation();const d=this.removeFromSubmenuStack();d&&(d.submenuOpen=!1,setTimeout(()=>{d.focus({preventScroll:!0}),d.active=!0,(d.slot==="submenu"?this.getSubmenuItems(d.parentElement):this.getItems()).forEach(b=>{b!==d&&(b.active=!1)})},0));return}if((e.key==="Home"||e.key==="End")&&(e.preventDefault(),e.stopPropagation(),l=e.key==="Home"?r[0]:r[r.length-1]),e.key==="Tab"&&await this.hideMenu(),e.key.length===1&&!(e.metaKey||e.ctrlKey||e.altKey)&&!(e.key===" "&&this.userTypedQuery==="")&&(clearTimeout(this.userTypedTimeout),this.userTypedTimeout=setTimeout(()=>{this.userTypedQuery=""},1e3),this.userTypedQuery+=e.key,r.some(d=>{const u=(d.textContent||"").trim().toLowerCase(),b=this.userTypedQuery.trim().toLowerCase();return u.startsWith(b)?(l=d,!0):!1})),l){e.preventDefault(),e.stopPropagation(),r.forEach(d=>d.active=d===l),l.focus({preventScroll:!0}),l.scrollIntoView({block:"nearest"});return}(e.key==="Enter"||e.key===" "&&this.userTypedQuery==="")&&o&&i&&(e.preventDefault(),e.stopPropagation(),i.hasSubmenu?(i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,b)=>u.active=b===0),d[0].focus({preventScroll:!0}))},0)):this.makeSelection(i,e))},this.handleDocumentPointerDown=e=>{e.composedPath().some(o=>o instanceof HTMLElement?o===this||o.closest('wa-dropdown, [part="submenu"]'):!1)||(this.open=!1)},this.handleGlobalMouseMove=e=>{const t=this.getCurrentSubmenuItem();if(!t?.submenuOpen||!t.submenuElement)return;const n=t.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl",a=o?n.right:n.left,s=o?Math.max(e.clientX,a):Math.min(e.clientX,a),r=Math.max(n.top,Math.min(e.clientY,n.bottom));t.submenuElement.style.setProperty("--safe-triangle-cursor-x",`${s}px`),t.submenuElement.style.setProperty("--safe-triangle-cursor-y",`${r}px`);const i=e.composedPath(),c=t.matches(":hover"),l=!!t.submenuElement?.matches(":hover"),d=c||!!i.find(b=>b===t),u=l||!!i.find(b=>b instanceof HTMLElement&&b.closest('[part="submenu"]')===t.submenuElement);!d&&!u&&setTimeout(()=>{!c&&!l&&(t.submenuOpen=!1)},100)}}handleSizeChange(){xn(this.localName,this.size)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.userTypedTimeout),this.closeAllSubmenus(),this.submenuCleanups.forEach(e=>e()),this.submenuCleanups.clear(),document.removeEventListener("mousemove",this.handleGlobalMouseMove),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),wo(this)}firstUpdated(e){super.firstUpdated(e),this.syncAriaAttributes()}async updated(e){if(e.has("open")){const t=e.get("open");if(t===this.open||t===void 0&&this.open===!1)return;this.customStates.set("open",this.open),this.open?await this.showMenu():(this.closeAllSubmenus(),await this.hideMenu())}e.has("size")&&this.syncItemSizes()}getItems(e=!1){const t=(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(n=>n.localName==="wa-dropdown-item");return e?t:t.filter(n=>!n.disabled)}getSubmenuItems(e,t=!1){const n=e.shadowRoot?.querySelector('slot[name="submenu"]')||e.querySelector('slot[name="submenu"]');if(!n)return[];const o=n.assignedElements({flatten:!0}).filter(a=>a.localName==="wa-dropdown-item");return t?o:o.filter(a=>!a.disabled)}syncItemSizes(){(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(t=>t.localName==="wa-dropdown-item").forEach(t=>t.size=this.size)}addToSubmenuStack(e){const t=this.openSubmenuStack.indexOf(e);t!==-1?this.openSubmenuStack=this.openSubmenuStack.slice(0,t+1):this.openSubmenuStack.push(e)}removeFromSubmenuStack(){return this.openSubmenuStack.pop()}getCurrentSubmenuItem(){return this.openSubmenuStack.length>0?this.openSubmenuStack[this.openSubmenuStack.length-1]:void 0}closeAllSubmenus(){this.getItems(!0).forEach(t=>{t.submenuOpen=!1}),this.openSubmenuStack=[]}closeSiblingSubmenus(e){const t=e.closest('wa-dropdown-item:not([slot="submenu"])');let n;t?n=this.getSubmenuItems(t,!0):n=this.getItems(!0),n.forEach(o=>{o!==e&&o.submenuOpen&&(o.submenuOpen=!1)}),this.openSubmenuStack.includes(e)||this.openSubmenuStack.push(e)}getTrigger(){return this.querySelector('[slot="trigger"]')}async showMenu(){if(!this.getTrigger()||!this.popup||!this.menu)return;const t=new Po;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1;return}if(this.popup.active)return;ca.forEach(o=>o.open=!1),this.popup.active=!0,this.open=!0,ca.add(this),Nr(this),this.syncAriaAttributes(),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("pointerdown",this.handleDocumentPointerDown),document.addEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("hide"),await yt(this.menu,"show");const n=this.getItems();n.length>0&&(n.forEach((o,a)=>o.active=a===0),n[0].focus({preventScroll:!0})),this.dispatchEvent(new Io)}async hideMenu(){if(!this.popup||!this.menu)return;const e=new Do({source:this});if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}this.open=!1,ca.delete(this),wo(this),this.syncAriaAttributes(),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),document.removeEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("show"),await yt(this.menu,"hide"),this.popup.active=this.open,this.dispatchEvent(new qo)}handleMenuClick(e){const t=e.target.closest("wa-dropdown-item");if(!(!t||t.disabled)){if(t.hasSubmenu){t.submenuOpen||(this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),t.submenuOpen=!0),e.stopPropagation();return}this.makeSelection(t,e)}}async handleMenuSlotChange(){const e=this.getItems(!0);await Promise.all(e.map(o=>o.updateComplete)),this.syncItemSizes();const t=e.some(o=>o.type==="checkbox"),n=e.some(o=>o.hasSubmenu);e.forEach((o,a)=>{o.setAttribute("aria-posinset",String(a+1)),o.setAttribute("aria-setsize",String(e.length)),o.active=a===0,o.checkboxAdjacent=t,o.submenuAdjacent=n})}handleTriggerClick(){this.open=!this.open}handleSubmenuOpening(e){const t=e.detail.item;this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),this.setupSubmenuPosition(t),this.processSubmenuItems(t)}setupSubmenuPosition(e){if(!e.submenuElement)return;this.cleanupSubmenuPosition(e);const t=Kr(e,e.submenuElement,()=>{this.positionSubmenu(e),this.updateSafeTriangleCoordinates(e)});this.submenuCleanups.set(e,t);const n=e.submenuElement.querySelector('slot[name="submenu"]');n&&(n.removeEventListener("slotchange",Xe.handleSubmenuSlotChange),n.addEventListener("slotchange",Xe.handleSubmenuSlotChange),Xe.handleSubmenuSlotChange({target:n}))}static handleSubmenuSlotChange(e){const t=e.target;if(!t)return;const n=t.assignedElements().filter(s=>s.localName==="wa-dropdown-item");if(n.length===0)return;const o=n.some(s=>s.hasSubmenu),a=n.some(s=>s.type==="checkbox");n.forEach(s=>{s.submenuAdjacent=o,s.checkboxAdjacent=a})}processSubmenuItems(e){if(!e.submenuElement)return;const t=this.getSubmenuItems(e,!0),n=t.some(o=>o.hasSubmenu);t.forEach(o=>{o.submenuAdjacent=n})}cleanupSubmenuPosition(e){const t=this.submenuCleanups.get(e);t&&(t(),this.submenuCleanups.delete(e))}positionSubmenu(e){if(!e.submenuElement)return;const n=this.localize.dir()==="rtl"?"left-start":"right-start";Xr(e,e.submenuElement,{placement:n,middleware:[Jr({mainAxis:0,crossAxis:-5}),Gr({fallbackStrategy:"bestFit"}),Yr({padding:8,crossAxis:!0})]}).then(({x:o,y:a,placement:s})=>{e.submenuElement.setAttribute("data-placement",s),Object.assign(e.submenuElement.style,{left:`${o}px`,top:`${a}px`})})}updateSafeTriangleCoordinates(e){if(!e.submenuElement||!e.submenuOpen)return;if(document.activeElement?.matches(":focus-visible")){e.submenuElement.style.setProperty("--safe-triangle-visible","none");return}e.submenuElement.style.setProperty("--safe-triangle-visible","block");const n=e.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl";e.submenuElement.style.setProperty("--safe-triangle-submenu-start-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-start-y",`${n.top}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-y",`${n.bottom}px`)}makeSelection(e,t){const n=this.getTrigger();if(e.disabled)return;e.type==="checkbox"&&(e.checked=!e.checked);const o=new Rl({item:e});this.dispatchEvent(o),o.defaultPrevented||(e.navigate(t),this.open=!1,n?.focus({preventScroll:!0}))}async syncAriaAttributes(){const e=this.getTrigger();let t;e&&(e.localName==="wa-button"?(await customElements.whenDefined("wa-button"),await e.updateComplete,t=e.shadowRoot.querySelector('[part~="base"]')):t=e,t.hasAttribute("id")||t.setAttribute("id",Za("wa-dropdown-trigger-")),t.setAttribute("aria-haspopup","menu"),t.setAttribute("aria-expanded",this.open?"true":"false"),this.menu?.setAttribute("aria-expanded","false"))}render(){let e=this.didSSR&&!this.hasUpdated?this.open:this.popup?.active;return J`
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
    `}};Xe.css=[Hn,Ll];v([Ee("slot:not([name])")],Xe.prototype,"defaultSlot",2);v([Ee("#menu")],Xe.prototype,"menu",2);v([Ee("wa-popup")],Xe.prototype,"popup",2);v([B({type:Boolean,reflect:!0})],Xe.prototype,"open",2);v([B({reflect:!0})],Xe.prototype,"size",2);v([wt("size")],Xe.prototype,"handleSizeChange",1);v([B({reflect:!0})],Xe.prototype,"placement",2);v([B({type:Number})],Xe.prototype,"distance",2);v([B({type:Number})],Xe.prototype,"skidding",2);Xe=v([Ye("wa-dropdown")],Xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var gc=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pe=class extends st{constructor(){super(...arguments),this.hasSlotController=new In(this,"[default]","start","end"),this.active=!1,this.variant="default",this.size="m",this.checkboxAdjacent=!1,this.submenuAdjacent=!1,this.type="normal",this.checked=!1,this.disabled=!1,this.submenuOpen=!1,this.hasSubmenu=!1,this.handleSlotChange=()=>{this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState(),this.hasSubmenu?(this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",this.submenuOpen?"true":"false")):(this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"))},this.handleHostClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handleClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handlePointerEnter=e=>{e.pointerType==="mouse"&&this.hasSubmenu&&!this.disabled&&(this.notifyParentOfOpening(),this.submenuOpen=!0)}}handleSizeChange(){xn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener?.("click",this.handleHostClick),this.addEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.addEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}disconnectedCallback(){super.disconnectedCallback(),this.closeSubmenu(),this.removeEventListener?.("click",this.handleHostClick),this.removeEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.removeEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}firstUpdated(e){super.firstUpdated(e),this.setAttribute("tabindex","-1"),this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState()}updated(e){e.has("active")&&(this.setAttribute("tabindex",this.active?"0":"-1"),this.customStates.set("active",this.active)),e.has("checked")&&(this.type==="checkbox"?this.setAttribute("aria-checked",this.checked?"true":"false"):this.removeAttribute("aria-checked"),this.customStates.set("checked",this.checked)),e.has("disabled")&&(this.setAttribute("aria-disabled",this.disabled?"true":"false"),this.customStates.set("disabled",this.disabled)),e.has("type")&&(this.type==="checkbox"?(this.setAttribute("role","menuitemcheckbox"),this.setAttribute("aria-checked",this.checked?"true":"false")):(this.setAttribute("role","menuitem"),this.removeAttribute("aria-checked"))),(e.has("href")||e.has("hasSubmenu"))&&this.customStates.set("link",this.isLink()),e.has("submenuOpen")&&(this.customStates.set("submenu-open",this.submenuOpen),this.submenuOpen?this.openSubmenu():this.closeSubmenu())}updateHasSubmenuState(){this.customStates.set("has-submenu",this.hasSubmenu)}async openSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||!this.isConnected||(this.notifyParentOfOpening(),e.showPopover?.(),e.hidden=!1,e.setAttribute("data-visible",""),this.submenuOpen=!0,this.setAttribute("aria-expanded","true"),await yt(e,"show"),setTimeout(()=>{const t=this.getSubmenuItems();t.length>0&&(t.forEach((n,o)=>n.active=o===0),t[0].focus({preventScroll:!0}))},0))}notifyParentOfOpening(){const e=new CustomEvent("submenu-opening",{bubbles:!0,composed:!0,detail:{item:this}});this.dispatchEvent(e);const t=this.parentElement;t&&[...t.children].filter(o=>o!==this&&o.localName==="wa-dropdown-item"&&o.getAttribute("slot")===this.getAttribute("slot")&&o.submenuOpen).forEach(o=>{o.submenuOpen=!1})}async closeSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||(this.submenuOpen=!1,this.setAttribute("aria-expanded","false"),e.hidden||(await yt(e,"hide"),e?.isConnected&&(e.hidden=!0,e.removeAttribute("data-visible"),e.hidePopover?.())))}isLink(){return!!this.href&&!this.hasSubmenu}navigate(e){const t=this.linkElement;!this.isLink()||this.disabled||!t||t.dispatchEvent(new MouseEvent("click",{bubbles:!1,cancelable:!0,composed:!1,altKey:e?.altKey??!1,ctrlKey:e?.ctrlKey??!1,metaKey:e?.metaKey??!1,shiftKey:e?.shiftKey??!1}))}getSubmenuItems(){return[...this.children].filter(e=>e.localName==="wa-dropdown-item"&&e.getAttribute("slot")==="submenu"&&!e.hasAttribute("disabled"))}render(){return J`
      ${this.href?J`
            <a
              id="link"
              href=${this.href}
              target=${vt(this.target)}
              rel=${vt(this.rel)}
              download=${vt(this.download)}
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
    `}};Pe.css=gc;v([Ee("#submenu")],Pe.prototype,"submenuElement",2);v([Ee("#link")],Pe.prototype,"linkElement",2);v([B({type:Boolean})],Pe.prototype,"active",2);v([B({reflect:!0})],Pe.prototype,"variant",2);v([B({reflect:!0})],Pe.prototype,"size",2);v([wt("size")],Pe.prototype,"handleSizeChange",1);v([B({attribute:"checkbox-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"checkboxAdjacent",2);v([B({attribute:"submenu-adjacent",type:Boolean,reflect:!0})],Pe.prototype,"submenuAdjacent",2);v([B()],Pe.prototype,"value",2);v([B({reflect:!0})],Pe.prototype,"type",2);v([B({type:Boolean})],Pe.prototype,"checked",2);v([B({type:Boolean,reflect:!0})],Pe.prototype,"disabled",2);v([B({type:Boolean,reflect:!0})],Pe.prototype,"submenuOpen",2);v([B({reflect:!0})],Pe.prototype,"href",2);v([B()],Pe.prototype,"target",2);v([B()],Pe.prototype,"rel",2);v([B()],Pe.prototype,"download",2);v([Zt()],Pe.prototype,"hasSubmenu",2);Pe=v([Ye("wa-dropdown-item")],Pe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wc=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var bc=Ve`
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
`;function yc(e){return vc(e)}function da(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function vc(e){for(let t=e;t;t=da(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=da(e);t;t=da(t)){if(!(t instanceof Element))continue;const n=getComputedStyle(t);if(n.display!=="contents"&&(n.position!=="static"||jo(n)||t.tagName==="BODY"))return t}return null}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Cs(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var kc=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),xe=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){const e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let o=0,a=0,s=0,r=0,i=0,c=0,l=0,d=0;n?e.top<t.top?(o=e.left,a=e.bottom,s=e.right,r=e.bottom,i=t.left,c=t.top,l=t.right,d=t.top):(o=t.left,a=t.bottom,s=t.right,r=t.bottom,i=e.left,c=e.top,l=e.right,d=e.top):e.left<t.left?(o=e.right,a=e.top,s=t.left,r=t.top,i=e.right,c=e.bottom,l=t.left,d=t.bottom):(o=t.right,a=t.top,s=e.left,r=e.top,i=t.right,c=t.bottom,l=e.left,d=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${a}px`),this.style.setProperty("--hover-bridge-top-right-x",`${s}px`),this.style.setProperty("--hover-bridge-top-right-y",`${r}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${i}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${d}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=kc,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||Cs(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Kr(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;const e=[Jr({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(_s({apply:({rects:o})=>{const a=this.sync==="width"||this.sync==="both",s=this.sync==="height"||this.sync==="both";this.popup.style.width=a?`${o.reference.width}px`:"",this.popup.style.height=s?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!Cs(this.anchor)&&this.boundary==="scroll"&&(t=Mn(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(Gr({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Yr({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(_s({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:a})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${a}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(mc({element:this.arrowEl,padding:this.arrowPadding}));const n=this.SUPPORTS_POPOVER?o=>ho.getOffsetParent(o,yc):ho.getOffsetParent;Xr(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...ho,getOffsetParent:n}}).then(({x:o,y:a,middlewareData:s,placement:r})=>{const i=this.localize.dir()==="rtl",c={top:"bottom",right:"left",bottom:"top",left:"right"}[r.split("-")[0]];if(this.setAttribute("data-current-placement",r),Object.assign(this.popup.style,{left:`${o}px`,top:`${a}px`}),this.arrow){const l=s.arrow.x,d=s.arrow.y;let u="",b="",p="",f="";if(this.arrowPlacement==="start"){const y=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",b=i?y:"",f=i?"":y}else if(this.arrowPlacement==="end"){const y=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";b=i?"":y,f=i?y:"",p=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(f=typeof l=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof d=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(f=typeof l=="number"?`${l}px`:"",u=typeof d=="number"?`${d}px`:"");Object.assign(this.arrowEl.style,{top:u,right:b,bottom:p,left:f,[c]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new wc)}render(){return J`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${kt({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${kt({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?J`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};xe.css=bc;v([Ee(".popup")],xe.prototype,"popup",2);v([Ee(".arrow")],xe.prototype,"arrowEl",2);v([B({attribute:!1,type:Boolean})],xe.prototype,"SUPPORTS_POPOVER",2);v([B()],xe.prototype,"anchor",2);v([B({type:Boolean,reflect:!0})],xe.prototype,"active",2);v([B({reflect:!0})],xe.prototype,"placement",2);v([B()],xe.prototype,"boundary",2);v([B({type:Number})],xe.prototype,"distance",2);v([B({type:Number})],xe.prototype,"skidding",2);v([B({type:Boolean})],xe.prototype,"arrow",2);v([B({attribute:"arrow-placement"})],xe.prototype,"arrowPlacement",2);v([B({attribute:"arrow-padding",type:Number})],xe.prototype,"arrowPadding",2);v([B({type:Boolean})],xe.prototype,"flip",2);v([B({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],xe.prototype,"flipFallbackPlacements",2);v([B({attribute:"flip-fallback-strategy"})],xe.prototype,"flipFallbackStrategy",2);v([B({type:Object})],xe.prototype,"flipBoundary",2);v([B({attribute:"flip-padding",type:Number})],xe.prototype,"flipPadding",2);v([B({type:Boolean})],xe.prototype,"shift",2);v([B({type:Object})],xe.prototype,"shiftBoundary",2);v([B({attribute:"shift-padding",type:Number})],xe.prototype,"shiftPadding",2);v([B({attribute:"auto-size"})],xe.prototype,"autoSize",2);v([B()],xe.prototype,"sync",2);v([B({type:Object})],xe.prototype,"autoSizeBoundary",2);v([B({attribute:"auto-size-padding",type:Number})],xe.prototype,"autoSizePadding",2);v([B({attribute:"hover-bridge",type:Boolean})],xe.prototype,"hoverBridge",2);xe=v([Ye("wa-popup")],xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var $c=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var On=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${gs(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${gs(this.value,0,100)}%`)}),super.updated(e)}render(){return J`
      <div
        part="base progress-bar"
        class="progress-bar"
        role="progressbar"
        title=${vt(this.title)}
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate?"0":this.value}
      >
        <div part="indicator" class="indicator">
          ${this.indeterminate?"":J` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};On.css=$c;v([B({type:Number,reflect:!0})],On.prototype,"value",2);v([B({type:Boolean,reflect:!0})],On.prototype,"indeterminate",2);v([B()],On.prototype,"label",2);On=v([Ye("wa-progress-bar")],On);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var xc=Ve`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pt=class extends st{constructor(){super(...arguments),this.localize=new At(this),this.resizeObserver=null,this.canScroll=!1,this.orientation="horizontal",this.withoutScrollbar=!1,this.withoutShadow=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.updateScroll()),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}handleKeyDown(e){e.key==="Home"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?0:void 0,top:this.orientation==="vertical"?0:void 0})),e.key==="End"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?this.content.scrollWidth:void 0,top:this.orientation==="vertical"?this.content.scrollHeight:void 0}))}handleSlotChange(){this.updateScroll()}updateScroll(){if(this.orientation==="horizontal"){const e=Math.ceil(this.content.clientWidth),t=Math.abs(Math.ceil(this.content.scrollLeft)),o=Math.ceil(this.content.scrollWidth)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}else{const e=Math.ceil(this.content.clientHeight),t=Math.abs(Math.ceil(this.content.scrollTop)),o=Math.ceil(this.content.scrollHeight)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}}render(){return J`
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
    `}};Pt.css=[xc];v([Ee("#content")],Pt.prototype,"content",2);v([Zt()],Pt.prototype,"canScroll",2);v([B({reflect:!0})],Pt.prototype,"orientation",2);v([B({attribute:"without-scrollbar",type:Boolean,reflect:!0})],Pt.prototype,"withoutScrollbar",2);v([B({attribute:"without-shadow",type:Boolean,reflect:!0})],Pt.prototype,"withoutShadow",2);v([nl({passive:!0})],Pt.prototype,"updateScroll",1);Pt=v([Ye("wa-scroller")],Pt);const so=["People","Routines","Rooms","Temperatures","Result"],ko=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],Sc=Object.fromEntries(ko.map(e=>[e.slice(0,3),e])),_c=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"]],Qr=[["shared","Shared","Warm while its people are up and at home, and first thing in the morning even if they then go out."],["bedroom","Bedroom","Warm when its people get up and in the run-up to bed."],["office","Office","Warm while its people work from home."],["while_home","While anyone is home","Warm whenever its people are up and at home, working or not."],["all_day","All day","Warm from the first of its people getting up to the last going to bed, home or not."]],Zr={weekdays:{up:"07:00",bed:"22:30",periods:[{type:"out",from:"08:30",to:"17:30"}]},weekend:{up:"08:30",bed:"23:00",periods:[]}},as=e=>JSON.parse(JSON.stringify(e));function dn(e,{end:t=!1}={}){const n=String(e??"").trim().replace(".",":");let o,a,s=n.match(/^(\d{1,2}):(\d{2})$/);if(s)[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})(\d{2})$/))[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})$/))[o,a]=[Number(s[1]),0];else return null;return a>59||o>24||o===24&&(a>0||!t)?null:`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function Cc(e,t){const n=String(e??"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,32)||"person",o=new Set(t);if(n!=="person"&&!o.has(n))return n;for(let a=1;;a++){const s=`${n}_${a}`;if(!o.has(s))return s}}function ei(e,t=""){const n=t||`Person ${e.people.length+1}`,o=Cc(n,e.people.map(a=>a.id));return e.people.push({id:o,name:n,...as(Zr),weekendSame:!1,getting_up_min:null,bedtime_min:null,weekend_days:null,ha_person:null}),o}const La=e=>e?.ha_persons?.persons??null;function ti(e,t,n=[]){const o=String(e??"").trim().toLocaleLowerCase();if(!o||!t)return null;const a=t.filter(s=>String(s.name??"").trim().toLocaleLowerCase()===o&&!n.includes(s.entity_id));return a.length===1?a[0].entity_id:null}function Ec(e,t){if(!(!t||e.people.some(n=>n.ha_person)))for(const n of e.people){const o=e.people.map(a=>a.ha_person).filter(Boolean);n.ha_person=ti(n.name,t,o)}}function Ac(e,t){const n=e.map(a=>a.name),o=[["","Not linked"]];for(const a of e){const s=n.indexOf(a.name)!==n.lastIndexOf(a.name);o.push([a.entity_id,s?`${a.name} (${a.entity_id})`:a.name])}return t&&!e.some(a=>a.entity_id===t)&&o.push([t,`${t}, not in Home Assistant now`]),o}const Es=e=>e?`Linked people count as away once Home Assistant has said they're out for ${Jn(e)}.`:"Linked people count as away as soon as Home Assistant says they're out.";function Tc(e,t){e.people=e.people.filter(n=>n.id!==t);for(const n of e.rooms)n.people&&(n.people=n.people.filter(o=>o!==t),n.people.length||(n.people=null,n.kind==="office"&&(n.kind="shared")))}const Rc=(e,t)=>e.rooms.find(n=>!n.own&&n.kind==="office"&&n.people?.includes(t))?.id??null;function Lc(e,t,n){for(const s of e.rooms)s.kind!=="office"||!s.people?.includes(t)||s.id===n||(s.people=s.people.filter(r=>r!==t),s.people.length||(s.people=null,s.kind="shared"));if(n==null)return;const o=e.rooms.find(s=>s.id===n);if(!o)return;o.own=!1;const a=o.kind==="office"?o.people??[]:[];o.kind="office",o.use==="unused"&&(o.use="in_use"),o.people=[...new Set([...a,t])]}const Mc=e=>[e.weekdays,...e.weekendSame?[]:[e.weekend]].some(t=>t.periods.some(n=>n.type==="work"));function As(e){const t=o=>o==null?[]:Array.isArray(o)?o:[o],n=[];for(const o of["out","work"])for(const a of t(e?.[o])){const[s,r]=String(a).split("-");n.push({type:o,from:s??"",to:r??""})}return n.sort((o,a)=>o.from.localeCompare(a.from)),{up:e?.up??"07:00",bed:e?.bed??"22:30",periods:n}}const Ts=e=>(e??[]).map(t=>Sc[String(t).toLowerCase().slice(0,3)]??t);function Rs(e){const t=e.household,n=e.defaults,o={people:[],rooms:[],temperatures:{...n.temperatures,...t?.temperatures??{}},timing:{...n.timing,...t?.timing??{}},away:{...n.away,...t?.away??{}},weekend_days:Ts(t?.weekend_days??n.weekend_days)};if(t)for(const[a,s]of Object.entries(t.people??{}))o.people.push({id:a,name:s.name??a.replace(/_/g," ").replace(/^./,r=>r.toUpperCase()),weekdays:As(s.weekdays),weekend:As(s.weekend??s.weekdays),weekendSame:s.weekend==null,getting_up_min:s.getting_up_min??null,bedtime_min:s.bedtime_min??null,weekend_days:s.weekend_days?Ts(s.weekend_days):null,ha_person:s.ha_person??null});else ei(o);Ec(o,La(e));for(const a of e.rooms){const s=t?.rooms?.[a.id],r={id:a.id,name:a.name,schedule:a.schedule,own:!1,use:"in_use",weekendUse:"in_use",weekendDifferent:!1,kind:"shared",people:null,temperature:null,night_temperature:null,unused_temperature:null,preheat_min:null,adjust:[]};if(s){const i=s.use;r.use=typeof i=="object"?i.weekdays:i,r.weekendUse=typeof i=="object"?i.weekend:i,r.weekendDifferent=typeof i=="object"&&i.weekdays!==i.weekend,r.kind=s.kind??"shared",r.people=s.people??null;for(const c of["temperature","night_temperature","unused_temperature","preheat_min"])r[c]=s[c]??null;r.adjust=as(s.adjust??[])}else t&&a.schedule?r.own=!0:!t&&/bed/i.test(a.name)&&(r.kind="bedroom");o.rooms.push(r)}return o}const $o=(e,t=!1)=>dn(e,{end:t})??String(e??""),Oc=e=>`${$o(e.from)}-${$o(e.to,!0)}`;function Ls(e){const t={up:$o(e.up)};for(const n of["out","work"]){const o=e.periods.filter(a=>a.type===n).map(Oc);o.length&&(t[n]=o)}return t.bed=$o(e.bed,!0),t}function Ms(e){const t=e.people.map(a=>a.id),n={};for(const a of e.people){const s={name:a.name,weekdays:Ls(a.weekdays)};a.weekendSame||(s.weekend=Ls(a.weekend)),a.getting_up_min!=null&&(s.getting_up_min=a.getting_up_min),a.bedtime_min!=null&&(s.bedtime_min=a.bedtime_min),a.weekend_days!=null&&(s.weekend_days=[...a.weekend_days]);const r=String(a.ha_person??"").trim();r&&(s.ha_person=r),n[a.id]=s}const o={};for(const a of e.rooms){if(a.own)continue;const s={use:a.weekendDifferent&&a.weekendUse!==a.use?{weekdays:a.use,weekend:a.weekendUse}:a.use};a.kind!=="shared"&&(s.kind=a.kind),a.people!=null?s.people=[...a.people]:(a.kind==="bedroom"||a.kind==="office")&&(s.people=[...t]);for(const r of["temperature","night_temperature","unused_temperature","preheat_min"])a[r]!=null&&(s[r]=a[r]);a.adjust?.length&&(s.adjust=as(a.adjust)),o[a.id]=s}return{weekend_days:[...e.weekend_days],timing:{...e.timing},away:{...e.away},temperatures:{...e.temperatures},people:n,rooms:o}}function po(e,t){const n={out:0,work:0};return t.map(o=>`${e}.${o.type}[${n[o.type]++}]`)}function Nc(e,t){let n=null;for(const o of e)t!==o&&!t.startsWith(`${o}.`)&&!t.startsWith(`${o}[`)||(!n||o.length>n.length)&&(n=o);return n}function Os(e,t){const n=t.split(".");if(n[0]!=="household")return{step:4,person:0};const o=(n[1]??"").replace(/\[.*$/,"");if(o==="people"){const a=Math.max(0,e.people.findIndex(s=>s.id===n[2]));return n.length<=3||n[3]==="name"||n[3]==="ha_person"?{step:0,person:a}:{step:1,person:a}}return o==="away"?{step:0,person:0}:o==="rooms"?{step:2,person:0}:o==="temperatures"||o==="timing"||o==="weekend_days"?{step:3,person:0}:{step:4,person:0}}function zc(e){const t=[];for(const n of e.people)for(const o of n.weekendSame?["weekdays"]:["weekdays","weekend"]){const a=n[o],s=`household.people.${n.id}.${o}`;dn(a.up)||t.push({path:`${s}.up`,message:"Enter a time such as 07:30"}),dn(a.bed,{end:!0})||t.push({path:`${s}.bed`,message:"Enter a time such as 22:30"}),po(s,a.periods).forEach((r,i)=>{const{from:c,to:l}=a.periods[i];(!dn(c)||!dn(l,{end:!0}))&&t.push({path:r,message:"Enter both times, such as 08:30 and 17:30"})})}return t}const Pc=e=>Qr.find(t=>t[0]===e)?.[2]??"",Dc=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ro=(e,t)=>typeof e=="number"&&e<t?`Below ${t}° walls and window frames can get damp, especially in older houses.`:"";function Jn(e,t=null){if(t!=null&&e===t)return"off";if(e<60)return`${e} min`;const n=e%60;return n?`${Math.floor(e/60)} h ${n} min`:`${e/60} h`}const qc=e=>e.length?Dc(ko.filter(t=>e.includes(t)).map(t=>t[0].toUpperCase()+t.slice(1))):"no days";function Ic(e){const t=e.reduce((o,a)=>o+(a.notes?.length??0),0);return t?`${t===1?"1 warm period is":`${t} warm periods are`} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`:""}const Yt=1440,Nn=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],Hc=34,un=15,Ma=Nn.map(e=>e.slice(0,3).toLowerCase()),Bc=["00:00","06:00","12:00","18:00","24:00"],ss=e=>`${Number.isInteger(e)?e:e.toFixed(1)}°`,at=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,dt=e=>`${e/Yt*100}%`,rs=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`;function Fc(e,t=null){const n=[];for(const o of e)for(const a of o.days)for(const s of a.transitions)n.push(s.setpoint);return t&&n.push(...Object.values(t).filter(o=>typeof o=="number")),n.length?{low:Math.min(...n),high:Math.max(...n)}:{low:0,high:0}}function jc(e){let t=1/0;for(const n of e.days)for(const o of n.transitions)t=Math.min(t,o.setpoint);return Number.isFinite(t)?t:0}function Wc(e,t,n=t.low){const o=[...e].filter(r=>r.minute>=0&&r.minute<Yt).sort((r,i)=>r.minute-i.minute);if(!o.length)return[];o[0].minute>0&&o.unshift({minute:0,setpoint:o.at(-1).setpoint});const a=[];o.forEach((r,i)=>{const c=i+1<o.length?o[i+1].minute:Yt;if(c<=r.minute)return;const l=a.at(-1);l&&l.setpoint===r.setpoint?l.end=c:a.push({start:r.minute,end:c,setpoint:r.setpoint})});const s=t.high-t.low;return a.map(r=>({...r,warm:r.setpoint>n,level:s>0?Math.min(1,Math.max(0,(r.setpoint-t.low)/s)):1}))}function Uc(e,t){const n=[];let o=0;for(const a of e){if(!a.warm)continue;const s=Math.min(Math.max(a.start,o),Yt-t);s<o||s>=a.end||(n.push({minute:s,text:ss(a.setpoint)}),o=s+t)}return n}const Vc=(e,t)=>t<e.minute?(e.weekday+1)%7:e.weekday;function Kc(e){if(!e)return[];const t=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"],["night","Night"]],n=new Map;for(const[o,a]of t){const s=e[o];typeof s=="number"&&n.set(s,[...n.get(s)??[],a])}return[...n.entries()].sort((o,a)=>a[0]-o[0]).map(([o,a])=>({label:rs(a.map((s,r)=>r?s.toLowerCase():s)),setpoint:o}))}const Jc=e=>`Usually ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`,Yc=(e,t=un)=>Math.round(e/t)*t,io=e=>Number(e.slice(0,2))*60+Number(e.slice(3,5)),Ns=(e,t)=>Math.min(t.max,Math.max(t.min,Yc(e)));function Gc(e,t,n){const o=e[t];return n==="start"?{min:t>0?e[t-1].end:0,max:o.end-un}:{min:o.start+un,max:t+1<e.length?e[t+1].start:Yt}}function Xc(e,t){const n=a=>JSON.stringify([a.transitions,a.periods??[]]),o=n(e.days[t]);return e.days.flatMap((a,s)=>n(a)===o?[s]:[])}function Qc(e){if(e.length===7)return"Every day";const t=a=>Nn[a].slice(0,3),n=[];for(const a of[...e].sort((s,r)=>s-r)){const s=n.at(-1);s&&a===s[1]+1?s[1]=a:n.push([a,a])}const o=[];for(const[a,s]of n)if(s-a>=2)o.push(`${t(a)} to ${t(s)}`);else for(let r=a;r<=s;r++)o.push(t(r));return rs(o)}function Zc(e,t=["saturday","sunday"]){const n=[...new Set(e)].sort((s,r)=>s-r),o=Nn.flatMap((s,r)=>t.includes(s.toLowerCase())?[r]:[]),a=s=>s.length===n.length&&s.every((r,i)=>r===n[i]);return n.length===7?"daily":a(o)?"weekend":a([0,1,2,3,4,5,6].filter(s=>!o.includes(s)))?"weekdays":n.length===1?Ma[n[0]]:n.map(s=>Ma[s])}function ed(e,t,n){if(n===t)return null;const o=n>t;return e==="end"?o?{keep:"warm",from:t,to:n}:{keep:"cold",from:n,to:t}:o?{keep:"cold",from:t,to:n}:{keep:"warm",from:n,to:t}}function zs(e,t){const n=i=>JSON.stringify([i.days].flat());let o=io(t.from),a=io(t.to);const s=[];let r=!1;for(const i of e??[]){if(n(i)!==n(t)){s.push(i);continue}const c=io(i.from),l=io(i.to);if(i.keep===t.keep){if(c<=a&&l>=o){o=Math.min(o,c),a=Math.max(a,l);continue}s.push(i)}else c<a&&l>o?(c===o&&l===a&&(r=!0),c<o&&s.push({...i,to:at(o)}),l>a&&s.push({...i,from:at(a)})):s.push(i)}return r?s:[...s,{...t,from:at(o),to:at(a)}]}function ua(e,t,n){const o=JSON.parse(JSON.stringify(e)),a=o?.rooms?.[t];if(!a)throw new Error(`${t} is not in the household`);const s=n(a.adjust??[]);return s.length?a.adjust=s:delete a.adjust,o}const td=(e,t,n,o)=>`${e}, ${t}, warm ${n==="end"?"until":"from"} ${at(o)}`,nd=(e,t,n,o)=>`${e}: warm ${t==="end"?"until":"from"} ${at(o)}, not ${at(n)}.`,od=e=>`Without adjustments: ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`;function Ps(e){return e?.saved_at?e.source==="house_file"?`Saving copies the household, with this change, to ${e.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`:"":"In the demo, changes last until you close the page."}const ad=[["daily","Every day"],["weekdays","Weekdays"],["weekend","Weekend"],...Nn.map((e,t)=>[Ma[t],e])];function sd(e,t=""){const n=` ${t} `;if(e==="button")return document.createElement("button");if(n.includes(" card "))return document.createElement("wa-card");if(n.includes(" badge ")){const o=document.createElement("wa-badge");return o.setAttribute("variant","neutral"),o.setAttribute("appearance","outlined"),o}return document.createElement(e)}const rd=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s",ce=(e,t,n)=>{const o=sd(e,t);return t&&(o.className=e==="button"&&/\b(btn|link)\b/.test(t)?`${t} ${rd(t)}`:t),n!=null&&(o.textContent=n),o};function id(e,t,n,o){const a=ce("li","week-day");a.append(ce("span","week-dname",Nn[t].slice(0,3)));const s=ce("div","week-lane"),r=ce("div","week-labels");r.setAttribute("aria-hidden","true");const i=ce("div","week-track");i.setAttribute("role","img"),a.day={name:Nn[t],text:e.text};for(const c of n){if(!c.warm)continue;const l=ce("i","week-block");l.style.left=dt(c.start),l.style.width=dt(c.end-c.start),l.style.setProperty("--level",c.level.toFixed(3)),l.title=`${ss(c.setpoint)} ${at(c.start)} to ${at(c.end)}`,l.dataset.start=String(c.start),l.dataset.end=String(c.end),i.append(l)}for(const c of e.adjusted??[]){const l=ce("i","week-adj");l.dataset.keep=c.keep,l.style.left=dt(c.start),l.style.width=dt(c.end-c.start),i.append(l)}return s.append(r,i),a.append(s),a.segments=n,ni(a,o),a}function ni(e,t){t?e.setAttribute("aria-current","date"):e.removeAttribute("aria-current");const n=`${e.day.name}${t?", today":""}: ${e.day.text}`;e.querySelector(".week-track").setAttribute("aria-label",n)}function Ds(e){const n=e.querySelector(".week-track")?.getBoundingClientRect().width??0;if(!n)return;const o=Math.ceil(Hc/n*Yt);if(e.dataset.labelMin!==String(o)){e.dataset.labelMin=String(o);for(const a of e.querySelectorAll(".week-day")){const s=a.querySelector(".week-labels");s.textContent="";for(const r of Uc(a.segments,o)){const i=ce("span",null,r.text);i.style.left=dt(r.minute),s.append(i)}}}}function ld(e,t,n){const o=ce("article","card week");o.dataset.away=String(!!e.away);const a=ce("header");a.append(ce("h3","name",e.name)),a.append(ce("span","badge",e.source==="household"?"Household":"Hand-written")),o.append(a),e.away&&(o.append(ce("p","week-away",e.away.text)),o.append(ce("p","week-usual",Jc(e.away.usual))));const s=jc(e),r=ce("ol","week-days");r.setAttribute("aria-label",`${e.name}, Monday to Sunday`),e.days.forEach((d,u)=>r.append(id(d,u,Wc(d.transitions,t,s),u===n))),o.append(r);const i=ce("div","week-ticks");i.setAttribute("aria-hidden","true");for(const d of Bc)i.append(ce("span",null,d));o.append(i);const c=ce("dl","week-summary");for(const d of e.summary){const u=ce("div");u.append(ce("dt",null,d.days),ce("dd",null,d.text)),c.append(u)}o.append(c);for(const d of e.notes)o.append(ce("p","flag",d));e.people.length&&o.append(ce("p","week-meta",`Depends on ${rs(e.people.map(d=>d.name))}.`));const l=ce("i","week-now");return l.setAttribute("aria-hidden","true"),o.append(l),o}const rn=(e,t,n="button")=>{const o=ce("button",e,t);return o.type=n,o},ha=e=>{const t=String(e??"").trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function cd(e,t,n){const{editor:o}=n,a=[...e.querySelectorAll(".week-day")],s=[];let r=null,i=null,c=!1,l=0,d=null;const u=ce("div","week-edit"),b=ce("div","week-pending");b.hidden=!0;const p=ce("p","week-pending-what");p.setAttribute("aria-live","polite");const f=ce("p","week-pending-then");f.setAttribute("aria-live","polite");const y=ce("p","week-source"),h=ce("p","week-error");h.setAttribute("role","alert"),h.hidden=!0;const w=rn("btn btn-primary","Save"),g=rn("btn","Cancel"),$=ce("div","week-buttons");$.append(w,g),b.append(p,f,y,h,$),u.append(b);function R(z,oe){if(z.value=oe,z.style.left=dt(oe),z.getAttribute("role")!=="slider")return;const{label:te,edge:ue}=z.edit;z.setAttribute("aria-valuenow",String(oe)),z.setAttribute("aria-valuetext",at(oe)),z.setAttribute("aria-label",td(t.name,te,ue,oe))}t.days.forEach((z,oe)=>{const te=z.periods??[];if(!te.length||t.away)return;const ue=Xc(t,oe),ye=Qc(ue),Ie=a[oe].querySelector(".week-track");te.forEach((Se,De)=>{for(const qe of["start","end"]){const Me=ce("span","week-edge");Me.dataset.edge=qe,Me.dataset.key=`${ue[0]}:${De}:${qe}`,Me.edit={row:oe,group:ue,label:ye,periods:te,index:De,edge:qe,was:Se[qe],bounds:Gc(te,De,qe)},ue[0]===oe?(Me.tabIndex=0,Me.setAttribute("role","slider"),Me.setAttribute("aria-valuemin",String(Me.edit.bounds.min)),Me.setAttribute("aria-valuemax",String(Me.edit.bounds.max))):Me.setAttribute("aria-hidden","true"),R(Me,Se[qe]),Q(Me),Ie.append(Me),s.push(Me)}})});const E=z=>s.find(oe=>oe.dataset.key===z&&oe.tabIndex===0);function P(z,oe){const{group:te,periods:ue,index:ye,edge:Ie,row:Se}=z.edit,De=ue[ye],[qe,Me]=Ie==="start"?[oe,De.end]:[De.start,oe];for(const Tt of s)Tt.dataset.key===z.dataset.key&&R(Tt,oe);for(const Tt of te){const Sn=a[Tt].querySelector(`.week-block[data-start="${De.start}"][data-end="${De.end}"]`);Sn&&(Sn.style.left=dt(qe),Sn.style.width=dt(Me-qe)),a[Tt].dataset.editing="true"}let ge=e.querySelector(".week-drag-label");ge||(ge=ce("span","week-drag-label"),ge.setAttribute("aria-hidden","true"));const it=a[Se].querySelector(".week-labels");ge.parentElement!==it&&it.append(ge),ge.textContent=at(oe);const on=Number(e.dataset.labelMin||120)*1.4;ge.style.left=dt(Math.min(Yt-on,Math.max(0,oe-on/2)))}function Z(){for(const z of s)R(z,z.edit.was);for(const z of e.querySelectorAll(".week-block"))z.style.left=dt(Number(z.dataset.start)),z.style.width=dt(Number(z.dataset.end)-Number(z.dataset.start));for(const z of a)delete z.dataset.editing;e.querySelector(".week-drag-label")?.remove()}function Q(z){z.addEventListener("pointerdown",te=>{i||c||te.pointerType==="mouse"&&te.button!==0||(r&&r.h.dataset.key!==z.dataset.key&&D(),te.preventDefault(),z.setPointerCapture?.(te.pointerId),i={id:te.pointerId,h:z,rect:z.parentElement.getBoundingClientRect()},e.dataset.dragging="true")}),z.addEventListener("pointermove",te=>{if(!i||te.pointerId!==i.id||!i.rect.width)return;const ue=Ns((te.clientX-i.rect.left)/i.rect.width*Yt,z.edit.bounds);ue!==z.value&&P(z,ue)});const oe=(te,ue)=>{!i||te.pointerId!==i.id||(i=null,delete e.dataset.dragging,ue?ne(z,z.value,!1):r?P(r.h,r.now):D())};z.addEventListener("pointerup",te=>oe(te,!0)),z.addEventListener("pointercancel",te=>oe(te,!1)),z.addEventListener("keydown",te=>{const ue={ArrowLeft:-un,ArrowDown:-un,ArrowRight:un,ArrowUp:un,PageDown:-60,PageUp:60};let ye;if(te.key in ue)ye=Ns(z.value+ue[te.key],z.edit.bounds);else if(te.key==="Home")ye=z.edit.bounds.min;else if(te.key==="End")ye=z.edit.bounds.max;else if(te.key==="Enter"){te.preventDefault(),r&&m();return}else if(te.key==="Escape"){r&&(te.preventDefault(),D());return}else return;te.preventDefault(),r&&r.h.dataset.key!==z.dataset.key&&D(),P(z,ye),ne(z,ye,!0)})}function ne(z,oe,te){if(oe===z.edit.was){D();return}const{label:ue,edge:ye,was:Ie}=z.edit,Se=r?.h.dataset.key===z.dataset.key;r={h:z,now:oe,keyboard:te,info:Se?r.info:null},b.hidden=!1,p.textContent=nd(ue,ye,Ie,oe),f.textContent="Checking…",h.hidden=!0,w.disabled=!0,clearTimeout(d),d=setTimeout(q,te?400:0)}async function T(z){z.info??=await o.household();const{edge:oe,was:te,group:ue}=z.h.edit,ye=ed(oe,te,z.now),Ie={days:Zc(ue,n.weekend),keep:ye.keep,from:at(ye.from),to:at(ye.to)};return ua(z.info.household,t.id,Se=>zs(Se,Ie))}function V(z){f.textContent="",h.textContent=z,h.hidden=!1,w.disabled=!0}async function q(){const z=++l,oe=r;if(!oe)return;let te;try{te=await o.preview(await T(oe))}catch{z===l&&V("Couldn't check the change. Check the connection and try again.");return}if(z!==l||oe!==r)return;if(y.textContent=Ps(oe.info),y.hidden=!y.textContent,te.errors?.length){V(ha(te.errors[0].message));return}const ue=te.rooms.find(Se=>Se.id===t.id),ye=ue?ue.summary.map(Se=>`${Se.days}: ${Se.text}`).join("; "):"",Ie=(ue?.notes??[]).filter(Se=>!t.notes.includes(Se));f.textContent=[ye&&`${ye}.`,...Ie].filter(Boolean).join(" "),w.disabled=!1}async function m(){const z=r;if(!z)return;clearTimeout(d);const oe=++l;w.disabled=!0,f.textContent="Saving…",h.hidden=!0;let te=null;try{te=await o.save(await T(z))}catch{}if(oe!==l||z!==r)return;if(te?.status===200){r=null,n.saved(`Saved. ${t.name} follows its new week.${F(z.info)}`,z.keyboard?z.h.dataset.key:null);return}const ue=te?.status===400?te.body?.errors?.[0]?.message:null;V(ue?`Not saved. ${ha(ue)}`:"Not saved. Check the connection and try again."),w.disabled=!1}function D(){clearTimeout(d),l++;const z=r?.h.dataset.key;return r=null,Z(),b.hidden=!0,z}w.addEventListener("click",m),g.addEventListener("click",()=>E(D())?.focus()),b.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),E(D())?.focus())});const F=z=>z?.source==="house_file"&&z.saved_at?` The household is now kept in ${z.saved_at}; the house file isn't changed.`:"",N=ce("p","week-error");N.setAttribute("role","alert"),N.hidden=!0;async function W(z,oe){N.hidden=!0;let te=null,ue=null;try{te=await o.household(),ue=await o.save(ua(te.household,t.id,z))}catch{}if(ue?.status===200){n.saved(`${oe}${F(te)}`,null);return}N.textContent="Not saved. Check the connection and try again.",N.hidden=!1}const U=ce("div","week-adjust");if(t.adjust?.length){U.append(ce("h4",null,"Adjustments"));const z=ce("ul");t.adjust.forEach((oe,te)=>{const ue=ce("li"),ye=rn("link","Remove");ye.setAttribute("aria-label",`Remove: ${oe.text}`),ye.addEventListener("click",()=>W(Ie=>Ie.filter((Se,De)=>De!==te),`Removed. ${t.name} follows its new week.`)),ue.append(ce("span",null,oe.text),ye),z.append(ue)}),U.append(z),t.routine&&U.append(ce("p","week-usual",od(t.routine)))}const ee=ce("div","week-actions"),se=rn("link","Adjust");if(se.setAttribute("aria-expanded","false"),se.setAttribute("aria-label",`Adjust ${t.name}`),ee.append(se),t.adjust?.length){const z=rn("link","Reset to routine");z.setAttribute("aria-label",`Reset ${t.name} to its routine`),z.addEventListener("click",()=>W(()=>[],`${t.name} is back to its routine.`)),ee.append(z)}U.append(ee,N);const de=ce("form","week-form");de.hidden=!0,de.noValidate=!0,de.id=`week-form-${t.id}`,se.setAttribute("aria-controls",de.id);const fe=(z,oe,te)=>{te.name=z,te.id=`${de.id}-${z}`;const ue=ce("div","week-field"),ye=ce("label",null,oe);return ye.htmlFor=te.id,ue.append(ye,te),ue},O=z=>{const oe=ce("select");for(const[te,ue]of z){const ye=ce("option",null,ue);ye.value=te,oe.append(ye)}return oe},k=z=>{const oe=ce("input","time");return Object.assign(oe,{type:"text",inputMode:"numeric",autocomplete:"off",spellcheck:!1,maxLength:5,placeholder:z}),oe.addEventListener("blur",()=>{const te=o.time?.(oe.value,{end:oe.name==="to"});te&&(oe.value=te)}),oe},S=O(ad),L=O([["warm","Warm"],["cold","Cold"]]),j=k("22:30"),X=k("23:00"),M=ce("div","week-fields");M.append(fe("days","Days",S),fe("keep","Keep it",L),fe("from","From",j),fe("to","To",X));const I=ce("p","week-source");I.hidden=!0;const K=ce("p","week-error");K.setAttribute("role","alert"),K.hidden=!0;const ae=ce("div","week-buttons"),ke=rn("btn btn-primary","Save","submit"),Le=rn("btn","Cancel");ae.append(ke,Le),de.append(M,I,K,ae);const Ke={days:S,keep:L,from:j,to:X};function Ae(z,oe){for(const te of Object.values(Ke))te.removeAttribute("aria-invalid");K.hidden=!oe,K.textContent=oe??"",z&&Ke[z]&&(Ke[z].setAttribute("aria-invalid","true"),Ke[z].setAttribute("aria-describedby",K.id||=`${de.id}-error`))}function nn(){de.hidden=!0,c=!1,se.setAttribute("aria-expanded","false"),Ae(null,null),se.focus()}return se.addEventListener("click",async()=>{if(c){nn();return}r&&D(),c=!0,de.hidden=!1,se.setAttribute("aria-expanded","true"),S.focus();try{I.textContent=Ps(await o.household())}catch{I.textContent=""}I.hidden=!I.textContent}),Le.addEventListener("click",nn),de.addEventListener("keydown",z=>{z.key==="Escape"&&(z.preventDefault(),nn())}),de.addEventListener("submit",async z=>{z.preventDefault();const oe=(ge,it)=>o.time?o.time(ge,it):ge.trim()||null,te=oe(j.value),ue=oe(X.value,{end:!0});if(!te){Ae("from","Enter a time such as 22:30."),j.focus();return}if(!ue){Ae("to","Enter a time such as 23:00."),X.focus();return}Ae(null,null),ke.disabled=!0;const ye={days:S.value,keep:L.value,from:te,to:ue};let Ie=null,Se=null,De=0;try{Ie=await o.household();const ge=ua(Ie.household,t.id,it=>{const on=zs(it,ye);return De=on.length-1,on});Se=await o.save(ge)}catch{}if(ke.disabled=!1,Se?.status===200){c=!1,n.saved(`Saved. ${t.name} follows its new week.${F(Ie)}`,null);return}const qe=Se?.status===400?Se.body?.errors?.[0]:null;if(!qe){Ae(null,"Not saved. Check the connection and try again.");return}const Me=qe.path.match(new RegExp(`\\.adjust\\[${De}\\]\\.(\\w+)$`));Ae(Me?.[1]??null,`Not saved. ${ha(qe.message)}`),Ke[Me?.[1]]?.focus()}),U.append(de),u.append(U),e.insertBefore(u,e.querySelector(".week-meta")??e.querySelector(".week-now")),{busy:()=>!!(r||i||c),focus(z){(z&&E(z)||se).focus()}}}function oi({list:e,legendEl:t,frostEl:n,hintEl:o=null}){const a=new Map;let s=null,r={low:0,high:0},i=null,c=["saturday","sunday"],l=null;const d=typeof ResizeObserver=="function"?new ResizeObserver(p=>{for(const f of p)Ds(f.target)}):null;function u(p){if(!s)return;const f=Vc(s,p);for(const{card:y}of a.values()){const h=y.querySelector(".week-now"),w=y.querySelectorAll(".week-day");w.forEach(($,R)=>{$.hasAttribute("aria-current")!==(R===f)&&ni($,R===f)});const g=w[f]?.querySelector(".week-track");g&&(h.parentElement!==g&&g.append(h),h.style.left=dt(p))}}function b(p){t.textContent="";const f=Kc(p.levels);for(const h of f){const w=ce("span","week-key"),g=ce("i","week-swatch");g.setAttribute("aria-hidden","true"),g.dataset.base=String(h.setpoint<=r.low),g.style.setProperty("--level",(r.high>r.low?(h.setpoint-r.low)/(r.high-r.low):1).toFixed(3)),w.append(g,`${h.label} ${ss(h.setpoint)}`),t.append(w)}const y=p.rooms.some(h=>h.days.some(w=>w.adjusted?.length));if(y){const h=ce("span","week-key"),w=ce("i","week-adj-swatch");w.setAttribute("aria-hidden","true"),h.append(w,"Adjusted"),t.append(h)}t.hidden=!f.length&&!y}return{update(p){s=p.now,c=p.weekend_days??c,r=Fc(p.rooms,p.levels),n.hidden=!p.frost,b(p);const f=new Set;let y=!1;p.rooms.forEach((h,w)=>{f.add(h.id);const g=!!i&&h.source==="household";y||=g&&!h.away&&h.days.some(Z=>Z.periods?.length);const $=JSON.stringify([h,r,g]),R=a.get(h.id);if(R?.key===$&&l?.room!==h.id||R?.edit?.busy())return;const E=ld(h,r,s.weekday);R?(d?.unobserve(R.card),R.card.replaceWith(E)):e.insertBefore(E,e.children[w]??null);const P={card:E,key:$,edit:null};g&&(P.edit=cd(E,h,{editor:i,weekend:c,saved(Z,Q){l={room:h.id,key:Q},i.saved(Z)}})),a.set(h.id,P),d?.observe(E),Ds(E),l?.room===h.id&&(P.edit?.focus(l.key),l=null)});for(const[h,{card:w}]of a)f.has(h)||(d?.unobserve(w),w.remove(),a.delete(h));o&&(o.hidden=!y),u(s.minute)},tick(p){u(p)},setEditor(p){i=p}}}const Oa="radiate.householdDraft",Be=e=>document.getElementById(e);function dd(e,t="",n=!1){const o=` ${t} `;if(e==="button"&&!n&&/\s(btn|link)\s/.test(o)){const a=document.createElement("wa-button");return o.includes(" btn-primary ")?a.setAttribute("variant","brand"):o.includes(" link ")?(a.setAttribute("appearance","plain"),a.setAttribute("size","s")):a.setAttribute("appearance","outlined"),o.includes(" link ")||a.setAttribute("size","s"),a}if(o.includes(" card "))return document.createElement("wa-card");if(o.includes(" badge ")){const a=document.createElement("wa-badge");return a.setAttribute("variant","neutral"),a.setAttribute("appearance","outlined"),a}return document.createElement(e)}const ud=e=>` ${e} `.includes(" btn-primary ")?"wa-brand wa-size-s":` ${e} `.includes(" link ")?"wa-plain wa-size-s":"wa-outlined wa-size-s";function Y(e,t={},...n){const o=Object.keys(t).some(s=>s.startsWith("aria-")),a=dd(e,t.class,o);a.localName==="button"&&/\b(btn|link)\b/.test(t.class??"")&&(t={...t,class:`${t.class} ${ud(t.class)}`});for(const[s,r]of Object.entries(t))r==null||r===!1||(s==="text"?a.textContent=r:s==="class"?a.className=r:s.startsWith("on")?a.addEventListener(s.slice(2),r):s in a&&typeof r!="string"?a[s]=r:a.setAttribute(s,r===!0?"":r));for(const s of n.flat())s!=null&&s!==!1&&a.append(s);return a}const $e=e=>`f-${e.replace(/[^a-z0-9]+/gi,"-")}`,qs=e=>{const t=String(e).trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function hd(){try{return JSON.parse(localStorage.getItem(Oa)||"null")}catch{return null}}function Is(e){try{e?localStorage.setItem(Oa,JSON.stringify(e)):localStorage.removeItem(Oa)}catch{}}function pd({transport:e,onSaved:t,onOpen:n,onClose:o}){const a=Be("setup"),s=Be("setup-body"),r=Be("setup-summary"),i=Be("setup-back"),c=Be("setup-next"),l=Be("setup-progress"),d=Be("setup-steps"),u=Be("setup-source"),b=Be("setup-resume");let p=null,f=null,y="",h=0,w=0,g=0,$=[],R=[],E=!1,P=!1;const Z=new Set,Q=new Set;let ne=null,T=null;const V=()=>{clearTimeout(T),T=setTimeout(()=>Is({v:1,base:y,step:h,person:w,reached:g,draft:f}),300)},q=()=>{clearTimeout(T),Is(null)};function m(x,_,A,H="",G=null){const re=A.matches("input, select")?A:A.querySelector("input, select");re.id||=$e(x);const ie=H?`${re.id}-help`:null;return ie&&re.setAttribute("aria-describedby",ie),Y("div",{class:"field","data-path":x},Y("label",{for:re.id,text:_}),A,H?Y("p",{class:"field-help",id:ie,text:H}):null,G)}function D(x,_,{end:A=!1,onChange:H}){const G=Y("input",{id:$e(x),type:"text",inputmode:"numeric",autocomplete:"off",spellcheck:"false",maxlength:"5",placeholder:A?"22:30":"07:30",class:"time",value:_});return G.addEventListener("input",()=>{H(G.value),V()}),G.addEventListener("blur",()=>{const re=dn(G.value,{end:A});re&&re!==G.value&&(G.value=re,H(re),V())}),G}function F(x,_,{limit:A,step:H=1,placeholder:G="",onChange:re}){const ie=Y("input",{id:$e(x),type:"number",inputmode:H<1?"decimal":"numeric",min:String(A.off===0?0:A.min),max:String(A.max),step:String(H),placeholder:G===""?"":String(G),class:"num",value:_==null?"":String(_)});return ie.addEventListener("input",()=>{const me=ie.value.trim();re(me===""?null:Number.isFinite(Number(me))?Number(me):me),V()}),ie}const N=(x,_)=>Y("span",{class:"unit"},x,Y("span",{"aria-hidden":"true",text:_}));function W(x,_,A,H){const G=Y("select",{id:$e(x)},A.map(([re,ie])=>Y("option",{value:re,text:ie})));return G.value=_,G.addEventListener("change",()=>{H(G.value),V()}),G}function U(x,_,A,H,G=""){const re=Y("input",{type:"checkbox",id:x,checked:A});return re.addEventListener("change",()=>{H(re.checked),V()}),Y("div",{class:"check"},re,Y("label",{for:x,text:_}),G?Y("p",{class:"field-help",text:G}):null)}function ee(x,_,A){const H=new Set(_);return Y("fieldset",{class:"days","data-path":x},Y("legend",{class:"sr-only",text:"Days"}),ko.map(G=>{const re=`${$e(x)}-${G}`,ie=Y("input",{type:"checkbox",id:re,checked:H.has(G)});return ie.addEventListener("change",()=>{ie.checked?H.add(G):H.delete(G),A(ko.filter(me=>H.has(me))),V()}),Y("span",{class:"day"},ie,Y("label",{for:re,text:G[0].toUpperCase()+G.slice(1,3)}))}))}function se(x,_,...A){const H=Y("details",{class:"setup-adv",open:Z.has(x)},Y("summary",{text:_}),Y("div",{class:"setup-adv-body"},...A));return H.addEventListener("toggle",()=>{H.open?Z.add(x):Z.delete(x)}),H}const de=x=>p.limits[x],fe=(x,_)=>p.defaults[x][_],O=(x,_=null)=>`Default ${Jn(x,_)}.`;function k(x,_){return[Y("h3",{class:"setup-title",id:"setup-step-h",tabindex:"-1",text:x}),_?Y("p",{class:"setup-intro",text:_}):null]}function S(x,_,A){const H=La(p);let G;return H?G=W(`${_}.ha_person`,x.ha_person??"",Ac(H,x.ha_person),re=>{x.ha_person=re||null,Q.add(x.id)}):(G=Y("input",{id:$e(`${_}.ha_person`),type:"text",class:"entity",value:x.ha_person??"",placeholder:"person.sam",autocomplete:"off",autocapitalize:"none",spellcheck:"false",maxlength:"107"}),G.addEventListener("input",()=>{x.ha_person=G.value.trim()||null,V()})),G.setAttribute("aria-describedby",A),Y("div",{class:"field","data-path":`${_}.ha_person`},Y("label",{for:G.id,text:"Home Assistant person"}),G)}function L(){const x=Y("div",{class:"setup-people"}),_=La(p),A=`${$e("household.people")}-ha-help`,H=()=>_?`${Es(f.away.presence_delay_min)} A link set in the integration's options takes priority.`:`Optional. Type the entity ID, such as person.sam. ${Es(f.away.presence_delay_min)}`,G=Y("p",{class:"field-help",id:A,text:H()});f.people.forEach((he,be)=>{const _e=`household.people.${he.id}`,Oe=Y("input",{id:$e(`${_e}.name`),type:"text",value:he.name,autocomplete:"off",maxlength:"40",required:!0});Oe.addEventListener("input",()=>{he.name=Oe.value,V()}),Oe.addEventListener("change",()=>{if(!_||he.ha_person||Q.has(he.id))return;const bt=f.people.map(an=>an.ha_person).filter(Boolean),_n=ti(he.name,_,bt);if(!_n)return;he.ha_person=_n;const oo=document.getElementById($e(`${_e}.ha_person`));oo&&(oo.value=_n),V()});const Ze=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${he.name||`person ${be+1}`}`,disabled:f.people.length<2,onclick:()=>{Tc(f,he.id),w=Math.min(w,f.people.length-1),oe(`${$e("household.people")}-add`),V()}});x.append(Y("div",{class:"setup-person",role:"group","aria-label":`Person ${be+1}`,"data-path":_e},m(`${_e}.name`,`Person ${be+1}`,Oe),S(he,_e,A),Ze))});const re=Y("button",{type:"button",class:"btn",id:`${$e("household.people")}-add`,text:"Add a person",onclick:()=>{const he=ei(f);oe($e(`household.people.${he}.name`),!0),V()}}),ie=f.away,me=de("away.presence_stale_after_min").off;return[...k("Who lives here?","Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),Y("div",{class:"field-group","data-path":"household.people"},x,G,re),se("away","Advanced: away and presence",m("household.away.presence_delay_min","Counts as away after",N(F("household.away.presence_delay_min",ie.presence_delay_min,{limit:de("away.presence_delay_min"),onChange:he=>{ie.presence_delay_min=he,typeof he=="number"&&(G.textContent=H())}}),"min"),`How long Home Assistant must say someone is out before Radiate counts them as away. ${O(fe("away","presence_delay_min"))}`),m("household.away.presence_stale_after_min","Presence goes stale after",N(F("household.away.presence_stale_after_min",ie.presence_stale_after_min,{limit:de("away.presence_stale_after_min"),onChange:he=>ie.presence_stale_after_min=he}),"min"),`If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${O(fe("away","presence_stale_after_min"),me)}`),m("household.away.return_warmup_min","Warm up for a return up to",N(F("household.away.return_warmup_min",ie.return_warmup_min,{limit:de("away.return_warmup_min"),onChange:he=>ie.return_warmup_min=he}),"min"),`How early Radiate may start warming rooms for someone due back. ${O(fe("away","return_warmup_min"))}`),m("household.away.presence_evidence_max_age_min","Trust not home for",N(F("household.away.presence_evidence_max_age_min",ie.presence_evidence_max_age_min,{limit:de("away.presence_evidence_max_age_min"),onChange:he=>ie.presence_evidence_max_age_min=he}),"min"),`If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${O(fe("away","presence_evidence_max_age_min"))}`),m("household.away.presence_weak_source_delay_min","Wifi or Bluetooth trackers count as away after",N(F("household.away.presence_weak_source_delay_min",ie.presence_weak_source_delay_min,{limit:de("away.presence_weak_source_delay_min"),onChange:he=>ie.presence_weak_source_delay_min=he}),"min"),`A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${O(fe("away","presence_weak_source_delay_min"))}`),m("household.away.everyone_away","When everyone has set an away until",W("household.away.everyone_away",ie.everyone_away,[["frost","Hold every room at frost protection"],["unused","Keep rooms at their unused temperature"]],he=>ie.everyone_away=he),"Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."))]}function j(x,_,A){const H=x[_],G=`household.people.${x.id}.${_}`,re=x.name||"this person",ie=Y("div",{class:"periods"}),me=po(G,H.periods);H.periods.forEach((be,_e)=>{const Oe=me[_e],Ze=W(`${Oe}.type`,be.type,[["out","Out of the house"],["work","Working from home"]],an=>{be.type=an,oe($e(`${po(G,H.periods)[_e]}.type`))}),bt=D(`${Oe}.from`,be.from,{onChange:an=>be.from=an}),_n=D(`${Oe}.to`,be.to,{end:!0,onChange:an=>be.to=an}),oo=Y("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${be.type==="work"?"working":"out"} ${be.from} to ${be.to}`,onclick:()=>{H.periods.splice(_e,1),oe(`${$e(G)}-add-out`),V()}});ie.append(Y("div",{class:"period",role:"group","aria-label":`${A}, time ${_e+1}`,"data-path":Oe},Y("div",{class:"field"},Y("label",{for:Ze.id,text:"What"}),Ze),Y("div",{class:"field"},Y("label",{for:bt.id,text:be.type==="work"?"Starts":"Leaves"}),bt),Y("div",{class:"field"},Y("label",{for:_n.id,text:be.type==="work"?"Finishes":"Back"}),_n),oo))}),H.periods.length||ie.append(Y("p",{class:"field-help",text:`${re} is at home all day.`}));const he=(be,_e,Oe)=>()=>{H.periods.push({type:be,from:_e,to:Oe});const Ze=po(G,H.periods).at(-1);oe($e(`${Ze}.from`)),V()};return Y("fieldset",{class:"routine","data-path":G},Y("legend",{text:A}),m(`${G}.up`,`When does ${re} get up?`,D(`${G}.up`,H.up,{onChange:be=>H.up=be})),Y("div",{class:"field-group"},Y("p",{class:"field-label",text:`Is ${re} out or working from home during the day?`}),ie,Y("div",{class:"row"},Y("button",{type:"button",class:"btn",id:`${$e(G)}-add-out`,text:"Add time out",onclick:he("out","08:30","17:30")}),Y("button",{type:"button",class:"btn",id:`${$e(G)}-add-work`,text:"Add time working from home",onclick:he("work","09:00","17:00")}))),m(`${G}.bed`,`When does ${re} go to bed?`,D(`${G}.bed`,H.bed,{end:!0,onChange:be=>H.bed=be})))}function X(){const x=f.people[w],_=x.name||`Person ${w+1}`,A=`household.people.${x.id}`,H=[...k(`${_}'s routine`,f.people.length>1?`Person ${w+1} of ${f.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.`:"Usual days are enough: Radiate handles one-off changes with away and overrides."),j(x,"weekdays",x.weekendSame?"Every day":"Weekdays"),U(`${$e(A)}-weekend`,"Weekends are different",!x.weekendSame,ie=>{x.weekendSame=!ie,ie&&JSON.stringify(x.weekend)===JSON.stringify(x.weekdays)&&(x.weekend=JSON.parse(JSON.stringify(Zr.weekend))),oe(`${$e(A)}-weekend`)})];if(x.weekendSame||H.push(j(x,"weekend","Weekends")),Mc(x)){const ie=f.rooms.map(me=>[me.id,me.name]);H.push(m(`${A}.office`,`Where does ${_} work?`,W(`${A}.office`,Rc(f,x.id)??"",[["","No particular room"],...ie],me=>Lc(f,x.id,me||null)),"That room is warm while they work. Shared rooms aren't heated while someone works."))}const G=f.timing,re=x.weekend_days==null;return H.push(se(`person-${x.id}`,`Advanced: timing for ${_}`,m(`${A}.getting_up_min`,"Getting ready",N(F(`${A}.getting_up_min`,x.getting_up_min,{limit:de("timing.getting_up_min"),placeholder:G.getting_up_min,onChange:ie=>x.getting_up_min=ie}),"min"),`How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${Jn(G.getting_up_min)}.`),m(`${A}.bedtime_min`,"Winding down",N(F(`${A}.bedtime_min`,x.bedtime_min,{limit:de("timing.bedtime_min"),placeholder:G.bedtime_min,onChange:ie=>x.bedtime_min=ie}),"min"),`How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${Jn(G.bedtime_min)}.`),Y("div",{class:"field","data-path":`${A}.weekend_days`},U(`${$e(A)}-own-weekend`,`Same weekend days as the house (${qc(f.weekend_days)})`,re,ie=>{x.weekend_days=ie?null:[...f.weekend_days],oe(`${$e(A)}-own-weekend`)},"Untick for someone who works weekends."),re?null:ee(`${A}.weekend_days`,x.weekend_days,ie=>x.weekend_days=ie)))),H}function M(x){const _=f.temperatures;return{in_use:`Kept at ${_.in_use}° while it's used.`,occasional:`Kept at ${_.occasional}° while it's used, for a bathroom or guest room.`,unused:`Kept at ${_.unused}° by day and ${_.night}° at night.`,own:"Follows its schedule from the house file. Radiate doesn't change it."}[x]}function I(){const x=Y("div",{class:"setup-rooms"}),_=_c;for(const A of f.rooms){const H=`household.rooms.${A.id}`,G=A.schedule?[..._,["own","Its own schedule"]]:_,re=W(`${H}.use`,A.own?"own":A.use,G,he=>{A.own=he==="own",A.own||(A.use=he),oe($e(`${H}.use`))}),ie=`${$e(H)}-h`,me=Y("div",{class:"card setup-room",role:"group","aria-labelledby":ie,"data-path":H},Y("h4",{id:ie,text:A.name}));if(me.append(m(`${H}.use`,"How is it used?",re,M(A.own?"own":A.use))),!A.own){if(me.append(U(`${$e(H)}-weekend`,"Different at weekends",A.weekendDifferent,be=>{A.weekendDifferent=be,be||(A.weekendUse=A.use),oe(`${$e(H)}-weekend`)})),A.weekendDifferent&&me.append(m(`${H}.use.weekend`,"At weekends",W(`${H}.use.weekend`,A.weekendUse,_,be=>{A.weekendUse=be}))),!(A.use==="unused"&&(!A.weekendDifferent||A.weekendUse==="unused"))){const be=W(`${H}.kind`,A.kind,Qr.map(([_e,Oe])=>[_e,Oe]),_e=>{A.kind=_e,oe($e(`${H}.kind`))});me.append(m(`${H}.kind`,"What kind of room?",be,Pc(A.kind))),f.people.length>1&&me.append(K(A,H))}me.append(ae(A,H))}x.append(me)}return[...k("How is each room used?","Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),x]}function K(x,_){const A=x.people==null,H=Y("fieldset",{class:"who","data-path":`${_}.people`},Y("legend",{class:"field-label",text:"Who uses it?"}));if(H.append(U(`${$e(_)}-everyone`,"Everyone",A,G=>{x.people=G?null:f.people.map(re=>re.id),oe(`${$e(_)}-everyone`)})),!A)for(const G of f.people)H.append(U(`${$e(_)}-${G.id}`,G.name||G.id,x.people.includes(G.id),re=>{const ie=new Set(x.people);re?ie.add(G.id):ie.delete(G.id),x.people=f.people.map(me=>me.id).filter(me=>ie.has(me))}));return H}function ae(x,_){const A=f.temperatures,H=de("temperatures"),G=(me,he)=>Y("p",{class:"field-note","aria-live":"polite",text:ro(x[me]??he,p.damp_below_c)}),re=(me,he,be,_e)=>{const Oe=me==="temperature"?null:G(me,be),Ze=F(`${_}.${me}`,x[me],{limit:H,step:.5,placeholder:be,onChange:bt=>{x[me]=bt,Oe&&(Oe.textContent=ro(bt??be,p.damp_below_c))}});return m(`${_}.${me}`,he,N(Ze,"°C"),_e,Oe)},ie=x.use==="unused"?x.weekendUse:x.use;return se(`room-${x.id}`,`Advanced: ${x.name}`,re("temperature","Its own warm temperature",A[ie]??A.in_use,"Replaces the use level's temperature in this room only. Leave empty to use the level's."),re("night_temperature","Its own night temperature",A.night,`For a warmer nursery, say. Leave empty for the house's, ${A.night}°.`),re("unused_temperature","Its own unused temperature",A.unused,`Leave empty for the house's, ${A.unused}°.`),m(`${_}.preheat_min`,"Valve starts early by",N(F(`${_}.preheat_min`,x.preheat_min,{limit:de("timing.preheat_min"),placeholder:f.timing.preheat_min,onChange:me=>x.preheat_min=me}),"min"),`For a slow room with a small radiator. Leave empty for the house setting, ${Jn(f.timing.preheat_min)}.`))}function ke(){const x=f.temperatures,_=de("temperatures"),A=(re,ie,me)=>{const he=`household.temperatures.${re}`,_e=re==="unused"||re==="night"?Y("p",{class:"field-note","aria-live":"polite",text:ro(x[re],p.damp_below_c)}):null,Oe=F(he,x[re],{limit:_,step:.5,onChange:Ze=>{x[re]=Ze,_e&&(_e.textContent=ro(Ze,p.damp_below_c))}});return m(he,ie,N(Oe,"°C"),`${me} Default ${fe("temperatures",re)}°.`,_e)},H=f.timing,G=(re,ie,me)=>{const he=`household.timing.${re}`;return m(he,ie,N(F(he,H[re],{limit:de(`timing.${re}`),onChange:be=>H[re]=be}),"min"),`${me} ${O(fe("timing",re))}`)};return[...k("How warm should rooms be?","One temperature for each way a room is used. Rooms change between them through the day."),Y("div",{class:"setup-grid"},A("in_use","In use","Rooms while they're being used."),A("occasional","Occasional","Rooms used now and then, such as a bathroom, while they're used."),A("unused","Unused","Every room by day when it isn't being used."),A("night","Night","Every room overnight, from the last person in bed to the first one up.")),se("timing","Advanced: timing",Y("div",{class:"field","data-path":"household.weekend_days"},Y("p",{class:"field-label",text:"Weekend days"}),ee("household.weekend_days",f.weekend_days,re=>f.weekend_days=re),Y("p",{class:"field-help",text:"The days that use weekend routines and weekend room use. Default Saturday and Sunday."})),G("getting_up_min","Getting ready","How long bedrooms and shared rooms stay warm after someone gets up."),G("bedtime_min","Winding down","How long a bedroom is warm before someone goes to bed."),G("preheat_min","Valves start early by","How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),m("household.timing.live_preheat","How Radiate starts early",W("household.timing.live_preheat",H.live_preheat,[["optimum_start","Learn how early each room needs"],["fixed","A fixed time early, as the valves do"]],re=>H.live_preheat=re),"Learning starts each room as late as it can and still be warm in time. Default learn."),G("merge_gap_min","Join warm periods closer than","Two warm periods this close together become one, so a room doesn't cool for a short gap."))]}function Le(){const x=Y("div",{class:"setup-result"}),_=Y("p",{class:"week-legend",hidden:!0}),A=Y("p",{class:"away-note",hidden:!0,text:"Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back."}),H=Y("div",{class:"weeks"}),G=Y("p",{class:"setup-status",id:"setup-result-status","aria-live":"polite",tabindex:"-1",text:"Building your week…"});return x.append(G,Y("div",{class:"setup-notes",id:"setup-notes"}),Y("div",{class:"week-head"},_),A,H),ne=oi({list:H,legendEl:_,frostEl:A}),[...k("Your heating week","Every room's week, built from your answers. Blocks are warm periods, darker when warmer."),x]}const Ke=[L,()=>X(),I,ke,Le];function Ae(){d.textContent="",so.forEach((x,_)=>{const A=_===h,H=Y("li",{"aria-current":A?"step":null,"data-done":String(_<h)}),G=`${_+1}. ${x}`;_<=g&&!A?H.append(Y("button",{type:"button",class:"link",text:G,onclick:re=>te(_,0,re.detail===0)})):H.append(Y("span",{text:G})),d.append(H)})}function nn(){u.textContent="";const x=p.saved_problems??[];if(x.length){u.hidden=!1,u.append(Y("p",{text:`Your saved setup couldn't be used, so the house file's setup applies: ${x.map(_=>qs(_.message)).join(" ")} Saving here replaces it.`}));return}if(p.source==="saved"){u.hidden=!1;const _=p.house_file?"the household section of the house file":"the schedules in the house file";u.append(Y("p",{text:p.saved_at?`This setup is saved by Radiate in ${p.saved_at}. It replaces ${_}, which is left as it is.`:"This setup replaces the schedules the house started with, until you go back to them."}));const A=Y("div",{class:"row",hidden:!0},Y("p",{text:`This deletes the saved setup. Rooms go back to ${_}.`}),Y("button",{type:"button",class:"btn",text:"Delete and use the house file",onclick:on}),Y("button",{type:"button",class:"link",text:"Keep this setup",onclick:()=>{A.hidden=!0,H.hidden=!1,H.focus()}})),H=Y("button",{type:"button",class:"link",text:"Use the house file's setup instead",onclick:()=>{A.hidden=!1,H.hidden=!0,A.querySelector(".btn").focus()}});u.append(H,A);return}if(p.source==="house_file"){u.hidden=!1,u.append(Y("p",{text:"These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed."}));return}u.hidden=!0}function z(x=null){a.dataset.instant=String(P||x!=null);const _=Y("div",{class:"setup-step"},...Ke[h]());s.replaceChildren(_),Ae(),i.hidden=h===0&&w===0,c.disabled=!1,c.textContent=h===4?"Save":h===3?"See the result":"Next";const A=h===1?`${so[1]}, ${f.people[w]?.name||`person ${w+1}`}`:so[h];l.textContent=`Step ${h+1} of 5: ${A}`,ue(!1),x&&document.getElementById(x)?document.getElementById(x).focus():Be("setup-step-h")?.focus(),h===4&&ge()}function oe(x,_=!0){const A=$;z(x),_&&($=A,ue(!1)),V()}function te(x,_=0,A=!1){P=A,h=x,w=Math.min(_,f.people.length-1),g=Math.max(g,h),$=[],R=[],z(),V()}function ue(x){for(const H of s.querySelectorAll(".field-error"))H.remove();for(const H of s.querySelectorAll("[aria-invalid]"))H.removeAttribute("aria-invalid"),H.dataset.describedby?H.setAttribute("aria-describedby",H.dataset.describedby):H.removeAttribute("aria-describedby"),delete H.dataset.describedby;if(r.textContent="",r.hidden=!$.length,!$.length)return;const _=[...s.querySelectorAll("[data-path]")].map(H=>H.dataset.path);r.append(Y("h3",{text:$.length===1?"Check this answer":`Check these ${$.length} answers`}));const A=Y("ul");$.forEach((H,G)=>{const re=Nc(_,H.path),ie=re?s.querySelector(`[data-path="${CSS.escape(re)}"]`):null,me=qs(H.message),he=ie?.matches("input, select")?ie:ie?.querySelector("input, select, button");if(ie){const _e=`setup-err-${G}`,Oe=Y("p",{class:"field-error",id:_e,text:me}),Ze=ie.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");if(Ze?Ze.after(Oe):ie.prepend(Oe),he){he.setAttribute("aria-invalid","true");const bt=he.getAttribute("aria-describedby")??"";he.dataset.describedby=bt,he.setAttribute("aria-describedby",`${_e} ${bt}`.trim())}}const be=ye(H.path);A.append(Y("li",{},he?Y("a",{href:`#${he.id}`,text:`${be}${me}`,onclick:_e=>{_e.preventDefault(),he.focus()}}):Ie(H.path,`${be}${me}`)))}),r.append(A),x&&r.focus()}function ye(x){const _=x.split(".");if(_[1]==="people"&&_[2]){const A=f.people.find(G=>G.id===_[2]),H=_[3]?.startsWith("weekend")&&_[3]!=="weekend_days"?", weekends":_[3]?.startsWith("weekdays")?", weekdays":"";return`${A?.name||_[2]}${H}: `}return _[1]==="rooms"&&_[2]?`${f.rooms.find(A=>A.id===_[2])?.name??_[2]}: `:""}function Ie(x,_){if(!x)return Y("span",{text:_});const{step:A,person:H}=Os(f,x);return A===h&&(A!==1||H===w)?Y("span",{text:_}):Y("button",{type:"button",class:"link",text:`${_} Change it in ${so[A]}.`,onclick:G=>te(A,H,G.detail===0)})}const Se=x=>x.filter(_=>{const A=Os(f,_.path);return A.step===h&&(h!==1||A.person===w)});async function De(){const x=zc(f);if(Se(x).length)return{errors:Se(x),notes:[]};const _=await e.call("POST","household/preview",{household:Ms(f)});if(_.status!==200)throw new Error(typeof _.body=="string"?_.body:`HTTP ${_.status}`);return _.body}async function qe(x){if(E)return;if(h===4){await it();return}E=!0,c.disabled=!0;let _;try{_=await De()}catch{E=!1,c.disabled=!1,$=[{path:"",message:"Couldn't check your answers. Check the connection and try again."}],ue(!0);return}if(E=!1,c.disabled=!1,$=Se(_.errors),$.length){ue(!0);return}h===1&&w<f.people.length-1?te(1,w+1,x):te(h+1,0,x)}function Me(x){h===1&&w>0?te(1,w-1,x):h===2?te(1,f.people.length-1,x):h>0&&te(h-1,0,x)}async function ge(){const x=Be("setup-result-status"),_=Be("setup-notes");let A;try{A=await De()}catch{x.textContent="Couldn't build the week. Check the connection, then go back and forward to try again.",c.disabled=!0;return}if(h!==4)return;if($=A.errors,R=A.notes??[],c.disabled=$.length>0,$.length){x.textContent="Some answers need changing before Radiate can build the week.",ue(!0);return}x.textContent="Save to start using it. Radiate then rebuilds every room's schedule from your answers.",_.textContent="";const H=Ic(A.rooms);for(const G of R)G.path.startsWith("household.temperatures")||G.path.includes("_temperature")||_.append(Y("p",{class:"flag",text:`${ye(G.path)||""}${G.message[0].toUpperCase()}${G.message.slice(1)}`}));H&&_.append(Y("p",{class:"field-help",text:H})),ne.update(A)}async function it(){E=!0,c.disabled=!0;const x=Be("setup-result-status");x.textContent="Saving…";let _;try{_=await e.call("PUT","household",{household:Ms(f)})}catch{_={status:0,body:null}}if(E=!1,c.disabled=!1,_.status===200){q(),Tt(!1),t("Household setup saved. Every room's schedule is rebuilt from it.");return}if(_.status===400&&_.body?.errors){$=_.body.errors,x.textContent="Not saved: some answers need changing.",ue(!0);return}x.textContent=_.body?.message?`Not saved. ${_.body.message}.`:"Not saved. Check the connection and try again.",x.focus?.()}async function on(){let x;try{x=await e.call("DELETE","household")}catch{x={status:0}}if(x.status!==200){$=[{path:"",message:"Couldn't go back to the house file's setup. Try again."}],ue(!0);return}q(),Tt(!1),t("Using the house file's setup again. The saved setup is deleted.")}function Tt(x=!0){x&&f&&V(),a.hidden=!0,o()}let Sn=!1;return c.addEventListener("click",x=>{Sn=x.detail===0}),Be("setup-form").addEventListener("submit",x=>{x.preventDefault(),qe(Sn)}),i.addEventListener("click",x=>Me(x.detail===0)),Be("setup-close").addEventListener("click",()=>Tt(!0)),Be("setup-restart").addEventListener("click",()=>{q(),f=Rs(p),Q.clear(),b.hidden=!0,g=0,te(0)}),{async open(){const x=await e.call("GET","household");if(x.status!==200)throw new Error(`household: HTTP ${x.status}`);p=x.body,y=JSON.stringify(p.household);const _=hd(),A=_?.v===1&&_.base===y&&_.draft?.people?.length;f=A?_.draft:Rs(p),h=A?Math.min(_.step,4):0,w=A?Math.min(_.person??0,f.people.length-1):0,g=A?Math.max(_.reached??0,h):0,b.hidden=!A,Be("setup-h").textContent=p.household?"Change household setup":"Set up your household",$=[],P=!1,Q.clear(),nn(),a.hidden=!1,n(),z(),Be("setup-h").focus()},async available(){try{return(await e.call("GET","household")).status===200}catch{return null}}}}const Fe=e=>document.getElementById(e),fd={ok:"success",attention:"warning",offline:"warning"};function md(e,t){const n=fd[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const gd=1e4,wd=2e3;function xo(e){return e==null?"–":e<60?"just now":e<3600?`${Math.floor(e/60)} min ago`:e<172800?`${Math.floor(e/3600)} h ago`:`${Math.floor(e/86400)} days ago`}function Hs(e){const t=Math.max(1,Math.ceil(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} h ${t%60} min`}const bd={strong:"Strong",fair:"Fair",weak:"Weak"},yd={weak:1,fair:2,strong:3},vd={auto:"auto",heat:"heat",off:"off"};function Bs(e,t){return t==="device.offline"?`Not reachable. Last heard ${xo(e.last_seen_s)}.`:t==="device.low_battery"?`Battery low at ${e.battery_pct}%. Replace the batteries soon.`:t==="device.weak_signal"?`Weak signal (LQI ${e.linkquality}). A router nearer to it would help.`:t==="device.stale"?`No temperature for ${xo(e.reading_age_s).replace(" ago","")}.`:"Needs attention."}function kd(e){return e.status==="offline"?["Offline","offline"]:e.status==="attention"?["Needs attention","attention"]:e.available==null?["No data yet",""]:["Online","ok"]}function $d(e){const t=[],n=e.temperature_c!=null?`${e.temperature_c.toFixed(1)}°`:null;if(e.kind==="trv"){const a=e.valve??{};n&&t.push(`${n} at the valve`),a.opening_pct!=null&&t.push(`opening limit ${Math.round(a.opening_pct)}%`),a.running_state&&t.push(a.running_state==="heat"?"heating":"idle"),a.mode&&t.push(`${vd[a.mode]??a.mode} mode`)}else if(e.kind==="relay"){const a=e.relay??{};a.heating!=null&&t.push(`heating ${a.heating?"on":"off"}`),a.store!=null&&t.push(`hot water ${a.store?"on":"off"}`),a.power_w!=null&&t.push(`${Math.round(a.power_w)} W`)}else e.kind==="window"?e.contact!=null&&t.push(e.contact?"window closed":"window open"):e.kind!=="router"&&(n&&t.push(n),e.humidity_pct!=null&&t.push(`${Math.round(e.humidity_pct)}% humidity`));if(!t.length)return e.kind==="router"?"Relays messages for nearby devices.":"–";const o=t.join(", ");return o[0].toUpperCase()+o.slice(1)}function xd(e,t){return e.kind==="relay"?"Wi-Fi":e.route?`Via ${e.route.via_kind==="coordinator"?"the coordinator":e.route.via}${e.route.lqi!=null?` (LQI ${Math.round(e.route.lqi)})`:""}`:t?"Not in the last scan":null}function Sd({transport:e,isAuthError:t,onAuth:n,scanLock:o=()=>""}){const a=new Map;let s=null,r=null,i=!1,c=!1,l="";function d(g,$){let R=a.get(g.id);return R||(R=Fe("device-tpl").content.firstElementChild.cloneNode(!0),R.id=`device-${g.id.replace(/[^\w-]/g,"_")}`,R.dataset.kind=g.kind,a.set(g.id,R)),R.parentElement!==$&&$.appendChild(R),R}function u(g,$,R){const E=d(g,$);E.querySelector(".name").textContent=g.label,E.dataset.status=g.status;const[P,Z]=kd(g),Q=E.querySelector(".badge");Q.textContent=P,md(Q,Z);const ne=E.querySelector(".device-flags"),T=g.problems.map(k=>Bs(g,k.code)),V=JSON.stringify(T);if(ne.dataset.key!==V){ne.dataset.key=V,ne.textContent="";for(const k of T){const S=document.createElement("li");S.className="flag",S.textContent=k,ne.appendChild(S)}}ne.hidden=!T.length;const q=E.querySelector(".ds-battery"),m=q.querySelector(".ds-val"),D=q.querySelector(".meter");g.battery_pct!=null?(m.textContent=`${g.battery_pct}%`,D.hidden=!1,D.dataset.low=String(g.battery_low),D.value=Math.max(0,Math.min(100,g.battery_pct))):(m.textContent=g.power==="mains"?"Mains":"–",D.hidden=!0),q.dataset.low=String(g.battery_low);const F=E.querySelector(".ds-signal"),N=F.querySelector(".ds-val"),W=F.querySelector(".ds-sub"),U=F.querySelector(".sig");W.textContent="",g.kind==="relay"?(N.textContent="Wi-Fi",U.hidden=!0):g.linkquality!=null&&g.available!==!1?(N.textContent=bd[g.signal],W.textContent=`LQI ${g.linkquality}`,U.hidden=!1,U.dataset.level=g.signal,U.dataset.bars=String(yd[g.signal])):(N.textContent="–",U.hidden=!0),F.dataset.weak=String(g.signal==="weak"&&g.available!==!1),E.querySelector(".ds-seen .ds-val").textContent=xo(g.last_seen_s),E.querySelector(".device-reading").textContent=$d(g);const ee=E.querySelector(".meta"),se=[];g.kind!=="relay"&&se.push(["code",g.id]);const de=[g.vendor,g.model].filter(Boolean).join(" ");de&&se.push(["",de]),g.firmware&&se.push(["",`Firmware ${g.firmware}`]);const fe=xd(g,R);fe&&se.push(["route",fe]);const O=JSON.stringify(se);if(ee.dataset.key!==O){ee.dataset.key=O,ee.textContent="";for(const[k,S]of se){const L=document.createElement(k==="code"?"code":"span");k==="route"&&(L.className="route"),L.textContent=S,ee.appendChild(L)}}}function b(g){const $=g.summary,R=[];$.offline&&R.push(`${$.offline} offline`),$.low_battery&&R.push(`${$.low_battery} low battery`),$.weak_signal&&R.push(`${$.weak_signal} weak signal`);const E=`${$.total} ${$.total===1?"device":"devices"}`;Fe("devices-summary").textContent=$.attention?`${E}. ${$.attention} ${$.attention===1?"needs":"need"} attention${R.length?`: ${R.join(", ")}`:""}.`:`${E}, all healthy.`;const P=g.network??{},Z=[];P.mqtt!=null&&Z.push(P.mqtt?"MQTT connected":"MQTT not connected"),P.zigbee2mqtt!=null&&Z.push(P.zigbee2mqtt?"Zigbee2MQTT online":"Zigbee2MQTT offline"),Fe("devices-network").textContent=Z.length?`${Z.join(". ")}.`:"";const Q=Fe("devices-attention"),ne=Fe("devices-attention-list"),T=g.devices.filter(q=>q.status!=="ok");Q.hidden=!T.length;const V=JSON.stringify(T.map(q=>q.id));if(ne.dataset.key!==V){ne.dataset.key=V,ne.textContent="";for(const q of T){const m=document.createElement("li");m.dataset.id=q.id;const D=document.createElement("a");D.href="#devices",D.className="attention-link",D.textContent=q.label,D.addEventListener("click",N=>{N.preventDefault();const W=a.get(q.id);W&&(W.scrollIntoView({block:"center"}),W.focus({preventScroll:!0}))});const F=document.createElement("span");m.append(D,F),ne.appendChild(m)}}for(const q of T){const m=ne.querySelector(`li[data-id="${CSS.escape(q.id)}"] span`);m&&(m.textContent=`: ${q.problems.map(D=>Bs(q,D.code)).join(" ")}`)}}function p(g){const $=Fe("mesh-tree"),R=g.devices.filter(T=>T.route);$.hidden=!R.length;const E=JSON.stringify(R.map(T=>[T.id,T.route.via,T.route.lqi]));if($.dataset.key===E)return;$.dataset.key=E,$.textContent="";const P=new Map;for(const T of R){const V=T.route.via_kind==="coordinator"?"Coordinator":T.route.via;P.has(V)||P.set(V,[]),P.get(V).push(T)}const Z=new Map(g.devices.map(T=>[T.id,T.label])),Q=new Set,ne=(T,V)=>{const q=document.createElement("li"),m=document.createElement("span");m.className="tree-node",m.textContent=V,q.appendChild(m);const D=(P.get(T)??[]).slice().sort((N,W)=>(N.kind==="router")-(W.kind==="router")||N.label.localeCompare(W.label));if(!D.length||Q.has(T))return q;Q.add(T);const F=document.createElement("ul");for(const N of D){const W=document.createElement("span");W.className="tree-lqi",W.textContent=N.route.lqi!=null?`LQI ${Math.round(N.route.lqi)}`:"",W.dataset.weak=String(N.route.lqi!=null&&N.route.lqi<g.limits.weak_signal_lqi);let U;if(N.kind==="router")U=ne(N.id,N.label),U.firstElementChild.after(W);else{U=document.createElement("li");const ee=document.createElement("span");ee.className="tree-node",ee.textContent=N.label,U.append(ee,W)}F.appendChild(U)}return q.appendChild(F),q};$.appendChild(ne("Coordinator","Coordinator"));for(const T of P.keys())!Q.has(T)&&T!=="Coordinator"&&$.appendChild(ne(T,Z.get(T)??T))}function f(g){const $=g.scan,R=Fe("mesh-scan"),E=Fe("mesh-status");Fe("devices-mesh-section").hidden=!$.available&&!g.devices.some(ne=>ne.kind==="router"),R.hidden=!$.available;const P=$.state==="scanning",Z=o();R.disabled=!!Z||P||$.retry_in_s>0,Z?R.dataset.locked="":delete R.dataset.locked,Fe("mesh-lock").hidden=!Z||!$.available,Fe("mesh-lock").textContent=Z,R.setAttribute("aria-busy",String(P)),R.loading=P,R.lastChild.textContent=P?"Scanning…":"Scan network",E.dataset.error=String($.state==="failed"||!!l);let Q;l?Q=l:P?Q="Scanning. This can take up to 2 minutes.":$.state==="failed"?Q=`The scan didn't finish: ${$.error}. Radiate will let you try again in ${Hs($.retry_in_s||60)}.`:$.scanned_s_ago!=null?Q=`Scanned ${xo($.scanned_s_ago)}.`:Q="Not scanned yet.",!P&&$.retry_in_s>0&&$.state!=="failed"&&!l&&(Q+=` You can scan again in ${Hs($.retry_in_s)}.`),E.textContent=Q}function y(g){s=g,b(g);const $=g.scan.scanned_s_ago!=null,R=Fe("devices-rooms"),E=Fe("devices-routers"),P=Fe("devices-boiler"),Z=new Set;for(const Q of g.devices){Z.add(Q.id);const ne=Q.kind==="router"?E:Q.kind==="relay"?P:R;u(Q,ne,$)}for(const[Q,ne]of a)Z.has(Q)||(ne.remove(),a.delete(Q));Fe("devices-boiler-section").hidden=!P.children.length,f(g),p(g)}async function h(){if(!c){c=!0;try{y(await e.get("devices"))}catch(g){t(g)?n():s||(Fe("devices-summary").textContent="Couldn't load the devices. Retrying…")}c=!1,w()}}function w(){clearTimeout(r),i&&(r=setTimeout(h,s?.scan.state==="scanning"?wd:gd))}return Fe("mesh-scan").addEventListener("click",async()=>{const g=Fe("mesh-scan");g.disabled=!0,l="";try{const $=await e.call("POST","devices/scan",{});$.status!==200&&(l=`Not started: ${typeof $.body=="object"?$.body.message:$.body}.`)}catch($){if(t($)){n();return}l="Not started. Check the connection and try again."}await h(),g.disabled||g.focus()}),{async available(){try{return y(await e.get("devices")),!0}catch(g){return t(g)?null:/HTTP 404|not found|reports no devices/.test(String(g?.message))?!1:null}},show(){i=!0,h()},hide(){i=!1,clearTimeout(r)}}}const ht=e=>document.getElementById(e),_d={act:"warning",ok:"success"};function Fs(e,t){const n=_d[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n),e.setAttribute("appearance",n==="neutral"?"outlined":"filled-outlined")}const Cd=3e4,Ed=3e5,Ad={act:["Act on this","act"],consider:["Worth considering","consider"],info:["For information","info"]},Td={ready:["Ready","ok"],learning:["Learning",""],not_judged:["Not judged",""]},Rd={low:"Low confidence",medium:"Medium confidence",high:"High confidence"},ai=(e,t,n)=>`${e} ${e===1?t:n}`;function Ld(e){const t=e.summary;if(t.total){const n=[];return t.act&&n.push(`${t.act} to act on`),t.consider&&n.push(`${t.consider} to consider`),t.info&&n.push(`${t.info} for information`),`${ai(t.total,"suggestion","suggestions")}: ${n.join(", ")}.`}return t.rooms_learning&&!t.rooms_ready?"Nothing to suggest yet. Radiate is still learning.":"Nothing to suggest."}function Md(e){const t=e.summary,n=Math.round(e.settings.min_learning_h);return t.rooms_learning&&!t.rooms_ready?`Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${n} h of learning; you can see how far each room has got below.`:t.rooms_learning?`The rooms Radiate can judge so far heat up and hold their warmth as expected. ${ai(t.rooms_learning,"room is","rooms are")} still learning.`:t.rooms_ready?"Every room Radiate can judge heats up and holds its warmth as expected.":"None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them."}function Od(e){return`${Rd[e.confidence]??"Confidence unknown"}. ${e.basis}`}function Nd(e){const t=e.summary;return t.rooms_compared>=t.min_rooms?"":`Rooms are compared with each other once ${t.min_rooms} have enough learning. ${t.rooms_compared?`${t.rooms_compared} so far.`:"None yet."}`}function zd({transport:e,isAuthError:t,onAuth:n,onCount:o}){const a=new Map,s=new Map;let r=null,i=null,c=!1,l=!1;function d(h){let w=a.get(h.id);w||(w=ht("suggestion-tpl").content.firstElementChild.cloneNode(!0),a.set(h.id,w));const[g,$]=Ad[h.severity]??["",""];w.dataset.severity=h.severity,w.querySelector(".name").textContent=h.title;const R=w.querySelector(".badge");return R.textContent=g,Fs(R,$),w.querySelector(".sg-evidence").textContent=h.evidence,w.querySelector(".sg-action").textContent=h.action,w.querySelector(".sg-basis").textContent=Od(h),w}function u(h,w){let g=s.get(h.room_id);g||(g=ht("learning-tpl").content.firstElementChild.cloneNode(!0),s.set(h.room_id,g)),g.querySelector(".lr-name").textContent=h.room_name;const[$,R]=Td[h.status]??[h.status,""],E=g.querySelector(".badge");E.textContent=$,Fs(E,R),g.querySelector(".lr-note").textContent=h.note;const P=g.querySelector(".lr-meter");return P.hidden=h.status!=="learning",P.value=Math.round(100*Math.max(0,Math.min(1,h.hours/Math.max(1,w)))),P.label=`${h.room_name}: ${Math.round(h.hours)} of ${Math.round(w)} h of learning`,g}function b(h,w){let g=h.firstElementChild;for(const $ of w)$===g?g=g.nextElementSibling:h.insertBefore($,g);for(;g;){const $=g.nextElementSibling;g.remove(),g=$}}function p(h){r=h,o?.(h.summary.act),ht("suggestions-summary").textContent=Ld(h);const w=ht("suggestions-list"),g=new Set(h.suggestions.map(Q=>Q.id));for(const Q of a.keys())g.has(Q)||a.delete(Q);b(w,h.suggestions.map(d));const $=ht("suggestions-empty"),R=h.summary.rooms_learning>0&&!h.summary.rooms_ready;$.hidden=h.suggestions.length>0&&!R,$.dataset.state=R?"learning":"clear",$.classList.toggle("radiate-cool",R),R?$.removeAttribute("variant"):$.setAttribute("variant","success"),ht("suggestions-empty-h").textContent=R?"Still learning":"Nothing to suggest",ht("suggestions-empty-text").textContent=Md(h);const E=ht("learning-list"),P=new Set(h.learning.map(Q=>Q.room_id));for(const Q of s.keys())P.has(Q)||s.delete(Q);b(E,h.learning.map(Q=>u(Q,h.settings.min_learning_h))),ht("learning-section").hidden=!h.learning.length;const Z=ht("learning-compare");Z.textContent=Nd(h),Z.hidden=!Z.textContent}async function f(){if(!l){l=!0;try{p(await e.get("suggestions"))}catch(h){t(h)?n():!r&&c&&(ht("suggestions-summary").textContent="Couldn't load the suggestions. Retrying…")}l=!1,y()}}function y(){clearTimeout(i),i=setTimeout(f,c?Cd:Ed)}return{async available(){try{return p(await e.get("suggestions")),y(),!0}catch(h){return t(h)?null:/HTTP 404|not found/.test(String(h?.message))?!1:null}},show(){c=!0,f()},hide(){c&&(c=!1,y())}}}const Te=e=>document.getElementById(e),Pd=6e4,Dd=6e5,qd="−",zn="–",si=["January","February","March","April","May","June","July","August","September","October","November","December"],Id=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Vo=e=>{const[t,n,o]=String(e).split("-").map(Number);return new Date(Date.UTC(t,n-1,o))},Hd=e=>{const t=Vo(e);return`${t.getUTCDate()} ${si[t.getUTCMonth()]}`},mn=e=>{const t=Vo(e);return`${t.getUTCDate()} ${si[t.getUTCMonth()].slice(0,3)}`},is=e=>{const t=Vo(e);return`${Id[t.getUTCDay()]} ${mn(e)}`};function pt(e){const t=Math.abs(e);return t<9.95?t.toFixed(1):String(Math.round(t))}const js=e=>`${pt(e)} ${pt(e)==="1.0"?"litre":"litres"}`;function ri(e,t=1){if(e==null)return zn;const n=Number(e.toFixed(t));return n<0?`${qd}${Math.abs(n).toFixed(t)}`:n.toFixed(t)}const pa=(e,t=1)=>e==null?zn:e.toFixed(t),Pn=e=>e==null?zn:`${Math.round(e*100)}%`;function Bd(e){return e==null?"with no room in use to keep warm":`with rooms in use warm ${Pn(e)} of the time`}function ii(e){if(e.status==="ready"&&e.totals){const t=e.totals,n=Hd(t.since),o=Bd(t.warm_share);return Math.abs(t.litres_saved)<.05?`About the same oil as the baseline since ${n}, ${o}.`:t.litres_saved<0?`About ${js(t.litres_saved)} more than the baseline since ${n}, ${o}.`:`About ${js(t.litres_saved)} of oil saved since ${n}, ${o}.`}return e.status==="learning"?Fd(e):Wd(e)}function Fd(e){return`Still learning how much oil this house uses: ${e.why??`${e.progress.eligible_days} of ${e.progress.needed_days} days`}.`}function jd(e){const t=e.progress,n=Math.max(0,t.needed_days-t.eligible_days);return`${n?`Figures start once ${t.needed_days} full days have counted, so at least ${n} more ${n===1?"day":"days"}`:`${t.eligible_days} days have counted`}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`}const li={"no household":["Savings need a household","The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare."],"no outdoor sensor":["Savings need an outdoor sensor","Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add a Zigbee outdoor sensor as house.outdoor_sensor in the house file, or set house.outdoor_source to home_assistant and pick an outdoor entity in the Radiate integration's options."],"no outdoor readings yet":["Savings need outdoor readings","Radiate takes the outdoor temperature from Home Assistant, and no fresh reading has arrived yet. Check the outdoor entity in the Radiate integration's options, and that it reports at least every few hours."],"no nozzle rating":["Savings need the nozzle rating","Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record."]};function Wd(e){return(li[e.why]??["Savings aren't measured yet"])[0]}function Ud(e){return(li[e.why]??["",`Radiate can't measure savings yet: ${e.why??"no reason given"}.`])[1]}function Vd(e){return[e.litres_upper_bound?"Litres are an upper bound until the burner itself is measured.":e.basis_text??"",e.outdoor?.text??""].filter(Boolean).join(" ")}const Kd=e=>{const t=Vo(e);return t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7),t.toISOString().slice(0,10)};function Ws(e,t="days"){const n=e.days??[];if(t!=="weeks")return n.map(a=>({key:a.date,label:is(a.date),tick:mn(a.date),counted:a.eligible?1:0,total:1,eligible:a.eligible,why:a.why,litres:a.eligible?a.litres:null,baseline:a.eligible?a.litres_baseline:null,saved:a.eligible?a.litres_saved:null,warm:a.warm_share,deficit:a.comfort_deficit_kh,outdoor:a.outdoor_mean_c}));const o=new Map;for(const a of n){const s=Kd(a.date);o.has(s)||o.set(s,[]),o.get(s).push(a)}return[...o].map(([a,s])=>{const r=s.filter(l=>l.eligible),i=l=>r.length&&r.every(d=>d[l]!=null)?r.reduce((d,u)=>d+u[l],0):null,c=s.filter(l=>l.comfort_deficit_kh!=null);return{key:a,week:!0,label:`Week of ${mn(a)}`,tick:mn(a),counted:r.length,total:s.length,eligible:r.length>0,why:r.length?null:[...new Set(s.map(l=>l.why).filter(Boolean))].join("; ")||"no day counted",litres:i("litres"),baseline:i("litres_baseline"),saved:i("litres_saved"),warm:null,deficit:c.length?c.reduce((l,d)=>l+d.comfort_deficit_kh,0):null,outdoor:null}})}function ci(e){if(!e.eligible)return`${e.label}: not counted, ${e.why}.`;const t=[];e.week&&t.push(`${e.counted} of ${e.total} ${e.total===1?"day":"days"} counted`),e.litres!=null&&t.push(`${e.litres.toFixed(1)} L used`),e.saved!=null&&(t.push(`baseline about ${e.baseline.toFixed(1)} L`),Math.abs(e.saved)<.05?t.push("about the same as the baseline"):e.saved<0?t.push(`about ${pt(e.saved)} L more than the baseline`):t.push(`about ${pt(e.saved)} L saved`));const n=[];e.warm!=null&&n.push(`rooms in use warm ${Pn(e.warm)} of the time`),e.deficit!=null&&n.push(`${e.deficit.toFixed(1)} degree-hours short`),e.outdoor!=null&&n.push(`${e.outdoor.toFixed(1)}° outside on average`);const o=`${e.label}: ${t.join(", ")}.`;return n.length?`${o} ${n.join(", ").replace(/^./,a=>a.toUpperCase())}.`:o}function Jd(e,t,n="days"){const o=n==="weeks"?"week":"day";if(!t.length)return`Oil used each ${o}: no full ${o} yet.`;const a=`${t.length} ${t.length===1?o:`${o}s`} from ${t[0].tick} to ${t.at(-1).tick}`,s=t.filter(d=>d.eligible),r=t.length-s.length,i=r?` ${r} not counted.`:"";if(e.status!=="ready")return`Bar chart of oil used each ${o}, ${a}. ${s.length} counted so far.${i}`;const c=s.filter(d=>d.saved!=null&&d.saved>=.05).length,l=s.filter(d=>d.saved!=null&&d.saved<=-.05).length;return`Bar chart of oil used each ${o} against the baseline, ${a}. Less than the baseline on ${c}, more on ${l}.${i}`}function Yd(e){return(e.days??[]).map(t=>[is(t.date),t.eligible?"Yes":`No, ${t.why}`,pa(t.litres),pa(t.litres_baseline),ri(t.litres_saved),t.outdoor_mean_c==null?zn:`${t.outdoor_mean_c.toFixed(1)}°`,Pn(t.warm_share),pa(t.comfort_deficit_kh)])}function Gd(e){if(e.status==="ready"&&e.totals){const a=e.totals,s=a.percent_saved,r=s==null?"":s<0?`${Math.abs(s).toFixed(1)}% more than the baseline`:`${s.toFixed(1)}% less than the baseline`;return[[a.litres_saved<0?"Oil over the baseline":"Oil saved",`About ${pt(a.litres_saved)} L`,r],["Oil used",`${pt(a.litres_used)} L`,`Baseline about ${pt(a.litres_baseline)} L`],["Rooms in use warm",Pn(a.warm_share),`${a.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],["Days counted",String(a.days),`Since ${mn(a.since)}`]]}const t=(e.days??[]).filter(a=>a.eligible&&a.litres!=null),n=t.reduce((a,s)=>a+s.litres,0),o=(e.days??[]).filter(a=>!a.partial&&a.warm_share!=null).at(-1);return[["Days counted",`${e.progress.eligible_days} of ${e.progress.needed_days}`,""],["Oil used on those days",t.length?`${pt(n)} L`:zn,t.length?`${pt(n/t.length)} L a day on average${e.litres_upper_bound?", an upper bound":""}`:""],["Rooms in use warm",o?Pn(o.warm_share):zn,o?`On ${mn(o.date)}`:""]]}function Xd(e){return e.status==="ready"?ii(e):""}const Us=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Je=e=>Math.round(e*10)/10;function Qd(e){if(!(e>0))return 1;const t=e/4,n=10**Math.floor(Math.log10(t));return[1,2,2.5,5,10].map(o=>o*n).find(o=>o>=t)}function Zd(e,{width:t,height:n,ready:o,active:a=e.length-1,labelEvery:s}){const d=Math.max(10,t-40-4),u=Math.max(10,n-10-22),b=Math.max(0,...e.flatMap(E=>[E.litres??0,o?E.baseline??0:0])),p=Qd(b),f=Math.max(p,Math.ceil(b/p)*p),y=E=>Je(10+u-E/f*u),h=d/Math.max(1,e.length),w=Math.max(3,Math.min(h*.78,40)),g=Math.max(2,w*(o?.56:1)),$=s??Math.max(1,Math.ceil(e.length/Math.max(1,Math.floor(d/56)))),R=[];R.push(`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="false">`),R.push('<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>');for(let E=0;E<=f+1e-9;E+=p){const P=y(E);R.push(`<line class="${E===0?"sv-zero":"sv-grid"}" x1="40" x2="${t-4}" y1="${P}" y2="${P}"/>`);const Z=E+p>f+1e-9?" L":"";R.push(`<text class="sv-ytick" x="34" y="${P+4}" text-anchor="end">${Number(E.toFixed(2))}${Z}</text>`)}return e.forEach((E,P)=>{const Z=40+h*(P+.5),Q=P===a?0:-1;R.push(`<g class="sv-slot" data-i="${P}" tabindex="${Q}" role="img" aria-label="${Us(ci(E))}" data-counted="${E.eligible}">`),R.push(`<rect class="sv-hit" x="${Je(40+h*P)}" y="10" width="${Je(h)}" height="${u}"/>`),!E.eligible||E.litres==null?R.push(`<rect class="sv-empty" x="${Je(Z-w/2)}" y="10" width="${Je(w)}" height="${u}"/>`):(R.push(`<rect class="sv-act" x="${Je(Z-g/2)}" y="${y(E.litres)}" width="${Je(g)}" height="${Je(y(0)-y(E.litres))}"/>`),o&&E.baseline!=null&&R.push(`<rect class="sv-base" x="${Je(Z-w/2)}" y="${y(E.baseline)}" width="${Je(w)}" height="${Je(y(0)-y(E.baseline))}"/>`)),R.push(`<rect class="sv-ring" x="${Je(Z-w/2-3)}" y="7" width="${Je(w+6)}" height="${u+6}"/>`),R.push("</g>"),P%$===0&&R.push(`<text class="sv-xtick" x="${Je(Z)}" y="${n-6}" text-anchor="middle">${Us(E.tick)}</text>`)}),R.push("</svg>"),R.join("")}function eu(e){if(e.status!=="ready"||!e.totals)return[];const t=(e.days??[]).filter(a=>a.eligible&&a.litres_saved!=null);let n=e.totals.litres_saved-t.reduce((a,s)=>a+s.litres_saved,0);const o=[];for(const a of t)n+=a.litres_saved,o.push([a.date,n]);return o}function tu(e,{width:t,height:n}){const i=e.map(f=>f[1]),c=Math.min(0,...i),d=Math.max(0,...i)-c||1,u=f=>Je(34+(e.length<2?0:f/(e.length-1)*(t-34-8))),b=f=>Je(8+(1-(f-c)/d)*(n-8-8)),p=e.map((f,y)=>`${y?"L":"M"}${u(y)} ${b(f[1])}`).join(" ");return[`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="true">`,`<line class="sv-zero" x1="34" x2="${t-8}" y1="${b(0)}" y2="${b(0)}"/>`,`<text class="sv-ytick" x="28" y="${b(0)+4}" text-anchor="end">0</text>`,`<path class="sv-line" d="${p}"/>`,e.length?`<rect class="sv-dot" x="${u(e.length-1)-3}" y="${b(i.at(-1))-3}" width="6" height="6"/>`:"","</svg>"].join("")}function nu(e,t){if(!t.length)return"";const n=t.at(-1)[1],o=mn(e.totals.since);return Math.abs(n)<.05?`About the same oil as the baseline in all since ${o}.`:n<0?`Running total: about ${pt(n)} L more than the baseline since ${o}.`:`Running total: about ${pt(n)} L saved since ${o}.`}function ou({transport:e,isAuthError:t,onAuth:n,onView:o}){let a=null,s=null,r=null,i=!1,c=!1,l="days",d=null,u=[],b=0;const p=()=>Te("savings-chart");function f(T,V){const q=Te(T);q.textContent!==V&&(q.textContent=V),q.hidden=!V}function y(T){Te("savings-stats").replaceChildren(...Gd(T).map(([q,m,D])=>{const F=document.createElement("div"),N=document.createElement("dt");N.textContent=q;const W=document.createElement("dd"),U=document.createElement("span");if(U.textContent=m,W.append(U),D){const ee=document.createElement("span");ee.className="sub",ee.textContent=D,W.append(ee)}return F.append(N,W),F}))}function h(T){const V=u[T];Te("savings-readout").textContent=V?ci(V):""}function w(){const T=p(),V=Math.floor(T.clientWidth);if(!V)return;b=V;const q=T.contains(document.activeElement)?document.activeElement.dataset.i:null;let m=u.findIndex(F=>F.key===d);m<0&&(m=u.length-1);const D=V<520;T.innerHTML=Zd(u,{width:V,height:D?180:220,ready:a.status==="ready",active:m}),T.setAttribute("aria-label",Jd(a,u,l)),h(m),q!=null&&T.querySelector(`.sv-slot[data-i="${m}"]`)?.focus()}function g(T){const V=p().querySelectorAll(".sv-slot");if(!V.length)return;const q=Math.max(0,Math.min(V.length-1,T));for(const m of V)m.setAttribute("tabindex","-1");V[q].setAttribute("tabindex","0"),V[q].focus(),d=u[q]?.key??null,h(q)}function $(){const T=p();T.addEventListener("keydown",V=>{const q=Number(document.activeElement?.dataset?.i);if(Number.isNaN(q))return;const m={ArrowRight:q+1,ArrowLeft:q-1,Home:0,End:u.length-1}[V.key];m!=null&&(V.preventDefault(),g(m))}),T.addEventListener("focusin",V=>{const q=Number(V.target?.dataset?.i);Number.isNaN(q)||(d=u[q]?.key??null,h(q))}),T.addEventListener("click",V=>{const q=V.target.closest?.(".sv-slot");q&&g(Number(q.dataset.i))}),T.addEventListener("pointerover",V=>{const q=V.target.closest?.(".sv-slot");q&&V.pointerType==="mouse"&&h(Number(q.dataset.i))}),T.addEventListener("pointerleave",()=>{const V=u.findIndex(q=>q.key===d);h(V<0?u.length-1:V)}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&i&&Math.floor(T.clientWidth)!==b&&w()}).observe(T)}function R(T){const V=T.rooms??[];if(Te("savings-rooms-section").hidden=!V.length,!V.length)return;const q=Math.max(...V.map(F=>Math.abs(F.litres_saved)),.01),m=V.some(F=>F.litres_saved<0),D=Te("savings-rooms");D.dataset.negative=String(m),D.replaceChildren(...V.map(F=>{const N=document.createElement("li");N.className="sv-room";const W=document.createElement("span");W.className="sv-room-name",W.textContent=F.name;const U=document.createElement("span");U.className="sv-room-track",U.setAttribute("aria-hidden","true");const ee=document.createElement("span");ee.className="sv-room-fill",ee.dataset.sign=F.litres_saved<0?"minus":"plus",ee.style.transform=`scaleX(${Math.abs(F.litres_saved)/q})`,U.append(ee);const se=document.createElement("span");se.className="sv-room-value",se.textContent=`${ri(F.litres_saved)} L`;const de=document.createElement("span");return de.className="sv-room-sub",de.textContent=F.warm_share==null?"Not in use in this time.":`Warm ${Pn(F.warm_share)} of the time in use, ${F.comfort_deficit_kh.toFixed(1)} degree-hours short.`,N.append(W,U,se,de),N}))}function E(T){Te("savings-table-body").replaceChildren(...Yd(T).map(q=>{const m=document.createElement("tr");return q.forEach((D,F)=>{const N=document.createElement(F===0?"th":"td");F===0&&(N.scope="row"),N.textContent=D,m.append(N)}),m})),Te("savings-table-empty").hidden=(T.days??[]).length>0}function P(T){a=T,o?.(T);const V=JSON.stringify(T);if(V===s)return;s=V;const q=T.status;if(Te("savings").dataset.state=q,f("savings-headline",ii(T)),Te("savings-missing").hidden=q!=="unavailable",f("savings-missing-text",q==="unavailable"?Ud(T):""),Te("savings-body").hidden=q==="unavailable",q==="unavailable")return;f("savings-baseline",T.baseline?.text??""),f("savings-basis",Vd(T));const m=q==="learning";if(Te("savings-progress").hidden=!m,m){const W=T.progress;Te("savings-meter").value=Math.round(100*Math.max(0,Math.min(1,W.eligible_days/Math.max(1,W.needed_days)))),f("savings-learning",jd(T))}y(T),Te("savings-chart-h").textContent=m?"Oil used each day so far":"Oil used against the baseline",Te("savings-legend-base").hidden=m,Te("savings-modes").hidden=(T.days??[]).length<8,u=Ws(T,l),Te("savings-chart-empty").hidden=u.length>0,Te("savings-chart-wrap").hidden=!u.length,i?w():b=0;const D=(T.days??[]).filter(W=>!W.eligible);Te("savings-skipped").replaceChildren(...D.map(W=>{const U=document.createElement("li");return U.textContent=`${is(W.date)}: ${W.why}.`,U})),Te("savings-skipped-section").hidden=!D.length;const N=eu(T);if(Te("savings-running").hidden=N.length<2,N.length>=2){const W=Te("savings-line-chart");W.innerHTML=tu(N,{width:Math.max(200,Math.floor(W.clientWidth)||320),height:90}),f("savings-running-text",nu(T,N))}R(T),E(T)}async function Z(){if(!c){c=!0;try{P(await e.get("savings"))}catch(T){t(T)?n():!a&&i&&(Te("savings-headline").textContent="Couldn't load the savings. Retrying…")}c=!1,Q()}}function Q(){clearTimeout(r),r=setTimeout(Z,i?Pd:Dd)}Te("savings-modes").addEventListener("change",T=>{const V=T.target.value;!V||V===l||(l=V,d=null,a&&(u=Ws(a,l),w()))});const ne=Te("savings-table-toggle");return ne.addEventListener("change",()=>{Te("savings-table-wrap").hidden=!ne.checked}),$(),{async available(){try{return P(await e.get("savings")),Q(),!0}catch(T){return t(T)?null:/HTTP 404|not found/.test(String(T?.message))?!1:null}},show(){i=!0,a&&(s=null,P(a)),Z()},hide(){i&&(i=!1,Q())},refresh:Z}}const pe=e=>document.getElementById(e),au={ok:"success",attention:"warning",warn:"warning",waiting:"cool",cool:"cool"};function Vs(e,t){const n=au[t]??"neutral";e.classList.toggle("radiate-cool",n==="cool"),n==="cool"?e.removeAttribute("variant"):e.setAttribute("variant",n)}const Na="–",su="−",ru=6e4,iu=500,Ks={"6h":6*3600,"24h":86400,"7d":7*86400,"30d":30*86400},Js={"6h":"the last 6 hours","24h":"the last 24 hours","7d":"the last 7 days","30d":"the last 30 days"},lu=e=>e&&e[0].toLowerCase()+e.slice(1),En=(e,t)=>{const n=Math.abs(e).toFixed(t);return e<0&&Number(n)!==0?`${su}${n}`:n},ot=(e,t,n)=>`${e.toLocaleString("en-GB")} ${e===1?t:n}`;function vn(e){return e.room?`${e.room_name??e.room} ${lu(e.label)}`:e.label}function So(e){return e>=86400?e===86400?"1 day":`${e/86400} days`:e>=3600?`${e/3600} h`:`${e/60} min`}function tt(e,t,n=60){if(e==null||Number.isNaN(e))return Na;const o=t?.kind??"gauge";if(o==="state")return n<=60||e===0||e===1?e>=.5?"On":"Off":`on ${Math.round(e*100)}% of the time`;if(o==="level")return(t.levels??[])[Math.round(e)]??String(e);switch(t?.unit){case"°C":return`${En(e,1)}°`;case"%":return`${En(e,0)}%`;case"W":return`${En(e,0)} W`;default:return Number.isInteger(e)?En(e,0):En(e,1)}}const cu=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],du=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ys=new Map;function Ko(e,t){let n=Ys.get(t);n||(n=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),Ys.set(t,n));const o=Object.fromEntries(n.formatToParts(new Date(e*1e3)).map(i=>[i.type,i.value])),a=Number(o.year),s=Number(o.month),r=Number(o.day);return{y:a,m:s,d:r,H:o.hour,M:o.minute,wd:new Date(Date.UTC(a,s-1,r)).getUTCDay()}}const _o=(e,t)=>{const n=Ko(e,t);return`${n.H}:${n.M}`},Co=(e,t)=>{const n=Ko(e,t);return`${cu[n.wd]} ${n.d} ${du[n.m-1]}`},Dn=(e,t)=>`${Co(e,t)} ${_o(e,t)}`;function fa(e,t){const n=Ko(e,t);return`${n.y}-${String(n.m).padStart(2,"0")}-${String(n.d).padStart(2,"0")}T${n.H}:${n.M}`}function Gs(e){return e<90?"just now":e<3600?`${Math.round(e/60)} min ago`:e<172800?`${Math.round(e/3600)} h ago`:`${Math.round(e/86400)} days ago`}function Xs(e){return e<60?`in ${Math.max(1,Math.round(e))} s`:e<5400?`in ${Math.round(e/60)} min`:`in ${Math.round(e/3600)} h`}function uu(e){if(!e?.available)return e?.why??"No raw data here.";const t=e.series?.length??0;if(!t)return"Nothing recorded yet. The first readings appear within a minute.";const n=e.retention_days?` Kept for ${ot(Math.round(e.retention_days),"day","days")}.`:"";return`${ot(t,"series","series")} from ${Dn(e.first,e.timezone)} to now.${n}`}function hu(e,t,n=8){const o=String(t??"").toLowerCase().split(/\s+/).filter(Boolean);if(!o.length||!e?.series)return[];const a=[];for(const s of e.series){const r=`${vn(s)} ${s.metric} ${s.room??""} ${s.room?"":"house"}`.toLowerCase();if(o.every(i=>r.includes(i))&&a.push(s),a.length>=n)break}return a}function pu(e,t,n){const o=e?.series??[];return o.length===1?vn(o[0]):t?.scope==="room"&&!n?`${t.label}, every room`:t?.label??"Raw data"}function fu(e,t){if(!e)return"";const n=e.series.length,o=e.series.reduce((r,i)=>r+i.points.length,0),a=t&&Js[t]?Js[t]:`${Dn(e.from,e.timezone)} to ${Dn(e.to,e.timezone)}`,s=e.step_raised?" (a finer step would be too many points)":"";return`Every ${So(e.step)}${s}, ${a}. ${ot(n,"series","series")}, ${ot(o,"point","points")}.`}function di(e,t,n){const o=e?.points??[];if(!o.length)return[];let a=1/0,s=-1/0,r=0;for(const[,l,d,u]of o)a=Math.min(a,d),s=Math.max(s,u),r+=l;const i=o.at(-1),c=r/o.length;return t?.kind==="state"?[["Latest",tt(i[1],t,n)],["On",`${Math.round(c*100)}%`,"of the time shown"]]:t?.kind==="level"?[["Latest",tt(i[1],t,n)]]:[["Latest",tt(i[1],t)],["Lowest",tt(a,t)],["Highest",tt(s,t)],["Average",tt(c,t)]]}function mu(e,t,n,o,a){const s=e?.points?.[o];if(!s)return"";const[r,i,c,l]=s,d=e.room?e.room_name??e.room:e.label;let u=`${Dn(r,a)}: ${d} ${tt(i,t,n)}`;return n>60&&t?.kind==="gauge"&&c!==l&&(u+=`, between ${tt(c,t)} and ${tt(l,t)} in these ${So(n)}`),n>60&&t?.kind==="level"&&c!==l&&(u=`${Dn(r,a)}: ${d} ${tt(c,t)} to ${tt(l,t)} in these ${So(n)}`),`${u}.`}function gu(e,t,n=iu){const o=[];for(const s of e?.series??[]){const r=t[s.metric];for(const[i,c,l,d]of s.points)o.push([i,vn(s),c,l,d,r])}o.sort((s,r)=>r[0]-s[0]||s[1].localeCompare(r[1]));const a=e?.step??60;return{total:o.length,rows:o.slice(0,n).map(([s,r,i,c,l,d])=>[Dn(s,e.timezone),r,tt(i,d,a),a>60&&d?.kind!=="state"?tt(c,d,60):Na,a>60&&d?.kind!=="state"?tt(l,d,60):Na])}}function wu(e,t,n){if(!e)return{kind:"none",badge:"Not set up",line:"Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",details:[]};const o=e.queued??{},a=[["Sends to",`${e.endpoint}, ${e.protocol==="http/json"?"JSON":"protobuf"} over HTTP`]],s=o.metrics??0,r=o.logs??0;if(a.push(["Waiting to send",s||r?`${ot(s,"minute","minutes")} of readings, ${ot(r,"log record","log records")}`:"Nothing"]),a.push(["Sent",`${ot(e.sent?.metrics??0,"data point","data points")}, ${ot(e.sent?.logs??0,"log record","log records")}`]),e.dropped&&a.push(["Dropped",`${ot(e.dropped,"item","items")}: the queue was full, so the oldest went first`,"warn"]),e.rejected&&a.push(["Rejected by the collector",ot(e.rejected,"item","items"),"warn"]),e.status==="off")return{kind:"off",badge:"Off",line:"Turned off in the house file (export.otlp.enabled).",details:a};if(e.status==="failing"){const i=e.next_attempt?` Trying again ${Xs(Math.max(0,e.next_attempt-t))}, and keeping the data until then.`:" Retrying, and keeping the data until then.",c=e.last_success?` Last sent at ${_o(e.last_success,n)}, ${Gs(t-e.last_success)}.`:"";return{kind:"attention",badge:"Failing",line:`Can't send: ${e.last_error??"no answer"}.${i}${c}`,details:a}}return e.status==="waiting"?{kind:"waiting",badge:"Waiting",line:`Nothing sent yet.${e.next_attempt?` The next send is due ${Xs(Math.max(0,e.next_attempt-t))}.`:" The first send is due within a minute."}`,details:a}:{kind:"ok",badge:"Sending",line:`Last sent at ${_o(e.last_success,n)}, ${Gs(t-e.last_success)}.`,details:a}}const Qs=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function bu(e,t=4){const n=e/t,o=10**Math.floor(Math.log10(n||1));for(const a of[1,2,2.5,5,10])if(a*o>=n)return a*o;return 10*o}function yu(e,t){const n=e.step;if(t?.kind==="state")return{lo:0,hi:1,ticks:n>60?[[0,"0%"],[.5,"50%"],[1,"100%"]]:[[0,"Off"],[1,"On"]]};if(t?.kind==="level"){const i=t.levels??[];return{lo:0,hi:Math.max(1,i.length-1),ticks:i.map((c,l)=>[l,c])}}let o=1/0,a=-1/0;for(const i of e.series)for(const[,,c,l]of i.points)o=Math.min(o,c),a=Math.max(a,l);Number.isFinite(o)||(o=0,a=1),a-o<1e-9&&(o-=1,a+=1);const s=bu(a-o);o=Math.floor(o/s)*s,a=Math.ceil(a/s)*s;const r=[];for(let i=o;i<=a+s/2;i+=s){const c=Math.round(i*1e3)/1e3,l=s<1?s<.1?2:1:0,d=t?.unit==="°C"?"°":t?.unit==="%"?"%":"";r.push([c,`${En(c,l)}${d}`])}return{lo:o,hi:a,ticks:r}}function vu(e,t,n,o){const a=t-e,s=Math.max(2,Math.floor(o/80)),i=[3600,3*3600,6*3600,12*3600,86400,2*86400,5*86400,7*86400].find(b=>a/b<=s)??14*86400,c=[],l=Ko(e,n),d=Date.UTC(l.y,l.m-1,l.d,Number(l.H),Number(l.M))/1e3-Math.floor(e/60)*60;let u=Math.ceil((e+d)/i)*i-d;for(;u<=t;u+=i)c.push([u,i>=86400?Co(u,n):_o(u,n)]);return c}const jt={left:46,right:14,top:12,bottom:26};function za(e,t,n,o){const a=t?.kind==="level"?58:jt.left,s=Math.max(10,n-a-jt.right),r=Math.max(10,o-jt.top-jt.bottom),i=yu(e,t),c=Math.max(1,e.to-e.from);return{left:a,w:s,h:r,y:i,x:l=>a+(l-e.from)/c*s,yv:l=>jt.top+r-(l-i.lo)/Math.max(1e-9,i.hi-i.lo)*r}}function Zs(e,t,n,o){let a="",s=null;const r=n*2.5;for(const[i,c]of e.points){const l=t.x(i).toFixed(1),d=t.yv(c).toFixed(1);s===null||i-s[0]>r?a+=`M${l} ${d}`:o?a+=`H${l}V${d}`:a+=`L${l} ${d}`,s=[i,c]}return a}function ku(e,t,n){const o=[];let a=[];for(const s of e.points)a.length&&s[0]-a.at(-1)[0]>n*2.5&&(o.push(a),a=[]),a.push(s);return a.length&&o.push(a),o.filter(s=>s.length>1).map(s=>{const r=s.map(([c,,,l])=>`${t.x(c).toFixed(1)} ${t.yv(l).toFixed(1)}`),i=s.slice().reverse().map(([c,,l])=>`${t.x(c).toFixed(1)} ${t.yv(l).toFixed(1)}`);return`M${r.join("L")}L${i.join("L")}Z`}).join("")}function $u(e,t,{width:n,height:o,focus:a}){const s=za(e,t,n,o),r=e.timezone,i=t?.kind!=="gauge",c=[`<svg width="${n}" height="${o}" viewBox="0 0 ${n} ${o}" aria-hidden="true" focusable="false">`];for(const[u,b]of s.y.ticks){const p=s.yv(u).toFixed(1);c.push(`<line class="rd-grid" x1="${s.left}" x2="${s.left+s.w}" y1="${p}" y2="${p}"/>`),c.push(`<text class="rd-ytick" x="${s.left-6}" y="${p}" dy="0.32em" text-anchor="end">${Qs(b)}</text>`)}const l=jt.top+s.h;c.push(`<line class="rd-axis" x1="${s.left}" x2="${s.left+s.w}" y1="${l}" y2="${l}"/>`);for(const[u,b]of vu(e.from,e.to,r,s.w)){const p=s.x(u).toFixed(1);c.push(`<line class="rd-xmark" x1="${p}" x2="${p}" y1="${l}" y2="${l+4}"/>`),c.push(`<text class="rd-xtick" x="${p}" y="${l+17}" text-anchor="middle">${Qs(b)}</text>`)}const d=e.series.find(u=>u.key===a)??e.series[0];if(d&&e.step>60&&t?.kind==="gauge"){const u=ku(d,s,e.step);u&&c.push(`<path class="rd-band" d="${u}"/>`)}for(const u of e.series)u!==d&&c.push(`<path class="rd-line rd-other" d="${Zs(u,s,e.step,i)}"/>`);return d&&c.push(`<path class="rd-line rd-ink" d="${Zs(d,s,e.step,i)}"/>`),c.push(`<line class="rd-cursor" x1="0" x2="0" y1="${jt.top}" y2="${l}" visibility="hidden"/>`),c.push('<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>'),c.push(`<rect class="rd-hit" x="${s.left}" y="${jt.top}" width="${s.w}" height="${s.h}"/>`),c.push("</svg>"),c.join("")}function xu(e,t,n){const o=e.series.find(c=>c.key===n)??e.series[0];if(!o)return"Chart with no data.";const a=o.points,s=e.series.length>1?` ${ot(e.series.length-1,"other series","other series")} shown thinner for comparison.`:"";if(!a.length)return`Line chart of ${vn(o)} with no data.${s}`;const i=di(o,t,e.step).map(([c,l])=>`${c.toLowerCase()} ${l}`).join(", ");return`Line chart of ${vn(o)}, ${Co(e.from,e.timezone)} to ${Co(e.to,e.timezone)}, every ${So(e.step)}: ${i}.${s} Use the arrow keys to read each point.`}function Su({transport:e,isAuthError:t,onAuth:n}){let o=null,a=null,s={},r=!1,i=null,c=!1,l=0,d=null,u=null,b=0;const p={metric:"room.temperature",room:"",range:"24h",from:"",to:"",step:"auto"},f=()=>pe("data-chart"),y=()=>s[p.metric];function h(O,k){const S=pe(O);S.textContent!==k&&(S.textContent=k)}function w(O,k=""){const S=pe("data-note");S.hidden=!O,Vs(S,k),h("data-note",O)}function g(){const O=new Set((o?.series??[]).map(L=>L.metric)),k=pe("data-metric"),S=[["room","Rooms"],["house","House"]].map(([L,j])=>{const X=document.createElement("optgroup");X.label=j;for(const M of o.metrics.filter(I=>I.scope===L&&O.has(I.metric))){const I=document.createElement("option");I.value=M.metric,I.textContent=M.label,X.append(I)}return X}).filter(L=>L.children.length);k.replaceChildren(...S),O.has(p.metric)||(p.metric=k.querySelector("option")?.value??""),k.value=p.metric}function $(){const O=y(),k=pe("data-room"),S=O?.scope!=="room",L=S?[]:(o?.rooms??[]).filter(X=>o.series.some(M=>M.metric===p.metric&&M.room===X.id)),j=document.createElement("option");j.value="",j.textContent=S?"Whole house":"Every room",k.replaceChildren(j,...L.map(X=>{const M=document.createElement("option");return M.value=X.id,M.textContent=X.name,M})),(S||!L.some(X=>X.id===p.room))&&(p.room=""),k.value=p.room,k.disabled=S}function R(){const O=pe("data-range"),k=p.range==="custom"?"":p.range;O.value!==k&&(O.value=k)}function E(){if(!o?.now||p.range==="custom")return;const O=Ks[p.range];pe("data-from").value=fa(o.now-O,o.timezone),pe("data-to").value=fa(o.now,o.timezone)}function P(){const O=new URLSearchParams;return p.metric&&O.set("metric",p.metric),p.room&&O.set("room",p.room),p.range==="custom"?(p.from&&O.set("from",p.from),p.to&&O.set("to",p.to)):(O.set("from",String(Math.floor(o.now-Ks[p.range]))),O.set("to",String(Math.ceil(o.now)))),O.set("step",p.step),O}function Z(){const O=a.series.find(j=>j.key===u),k=pe("data-stats"),S=O?di(O,y(),a.step):[];k.hidden=!S.length;const L=a.series.length>1&&O;pe("data-stats-for").hidden=!L,h("data-stats-for",L?`Figures for ${vn(O)}, the line in ink.`:""),k.replaceChildren(...S.map(([j,X,M])=>{const I=document.createElement("div"),K=document.createElement("dt");K.textContent=j;const ae=document.createElement("dd"),ke=document.createElement("span");if(ke.textContent=X,ae.append(ke),M){const Le=document.createElement("span");Le.className="sub",Le.textContent=M,ae.append(Le)}return I.append(K,ae),I}))}function Q(){const O=pe("data-legend");O.hidden=a.series.length<2,O.replaceChildren(...a.series.map(k=>{const S=document.createElement("li"),L=document.createElement("button");L.type="button",L.className="rd-key",L.dataset.key=k.key,L.setAttribute("aria-pressed",String(k.key===u));const j=document.createElement("span");return j.className="rd-swatch",j.setAttribute("aria-hidden","true"),L.append(j,document.createTextNode(k.room?k.room_name??k.room:k.label)),S.append(L),S}))}function ne(){const{total:O,rows:k}=gu(a,s);pe("data-table-body").replaceChildren(...k.map(L=>{const j=document.createElement("tr");return L.forEach((X,M)=>{const I=document.createElement(M===0?"th":"td");M===0&&(I.scope="row"),I.textContent=X,j.append(I)}),j}));const S=a.step>60;for(const L of document.querySelectorAll(".rd-table .rd-range-col"))L.hidden=!S;for(const L of pe("data-table-body").children)L.children[3].hidden=!S,L.children[4].hidden=!S;h("data-table-note",O>k.length?`The newest ${ot(k.length,"row","rows")} of ${O.toLocaleString("en-GB")}. Download the CSV for all of them.`:`${ot(O,"row","rows")}, newest first.`)}function T(O){const k=a?.series.find(Le=>Le.key===u),S=k?.points??[];if(!S.length){h("data-readout","");return}const L=O==null?S.length-1:Math.max(0,Math.min(S.length-1,O));h("data-readout",mu(k,y(),a.step,L,a.timezone));const j=f().querySelector("svg");if(!j)return;const X=za(a,y(),l,Number(j.getAttribute("height"))),[M,I]=S[L],K=j.querySelector(".rd-cursor"),ae=j.querySelector(".rd-dot"),ke=O==null?"hidden":"visible";K.setAttribute("x1",X.x(M)),K.setAttribute("x2",X.x(M)),ae.setAttribute("cx",X.x(M)),ae.setAttribute("cy",X.yv(I)),K.setAttribute("visibility",ke),ae.setAttribute("visibility",ke)}function V(){const O=f(),k=Math.floor(O.clientWidth);if(!k||!a)return;l=k;const S=k<520?200:260;O.innerHTML=$u(a,y(),{width:k,height:S,focus:u}),O.setAttribute("aria-label",xu(a,y(),u)),T(d)}function q(){const O=y(),k=a.series.some(S=>S.points.length);if(a.series.some(S=>S.key===u)||(u=(a.series.find(S=>S.points.length)??a.series[0])?.key??null,d=null),h("data-chart-h",pu(a,O,p.room?pe("data-room").selectedOptions[0]?.textContent:"")),h("data-meta",fu(a,p.range==="custom"?null:p.range)),pe("data-empty").hidden=k,pe("data-chart-wrap").hidden=!k,pe("data-downloads").hidden=!k,pe("data-table-toggle").hidden=!k,a.partial?w("Still indexing older readings, so part of this time may be missing for a few minutes.","cool"):w(""),!k){pe("data-stats").hidden=!0,pe("data-legend").hidden=!0;return}Z(),Q(),ne(),r?V():l=0}function m(){const O=wu(o?.export??null,Date.now()/1e3,o?.timezone??"UTC"),k=pe("data-export-badge");Vs(k,O.kind),k.setAttribute("appearance",["ok","attention","waiting"].includes(O.kind)?"filled-outlined":"outlined"),h("data-export-badge",O.badge),h("data-export-line",O.line),pe("data-export").dataset.kind=O.kind;const S=pe("data-export-list");S.hidden=!O.details.length,S.replaceChildren(...O.details.map(([L,j,X])=>{const M=document.createElement("div");X&&(M.dataset.kind=X);const I=document.createElement("dt");I.textContent=L;const K=document.createElement("dd");return K.textContent=j,M.append(I,K),M}))}function D(){h("data-summary",uu(o)),m();const O=!!o?.available;pe("data-body").hidden=!O,O&&(s=Object.fromEntries(o.metrics.map(k=>[k.metric,k])),g(),$(),R(),E(),ee())}async function F(){if(!o?.available||!p.metric)return;const O=++b;try{const k=await e.get(`data?${P()}`);if(O!==b)return;a=k,q()}catch(k){if(O!==b)return;if(t(k)){n();return}w(/HTTP 400/.test(String(k?.message))?`Not shown: ${String(k.message).replace(/^.*HTTP 400 /,"")}`:"Couldn't load the readings. Retrying…","warn")}}async function N(){if(!c){c=!0;try{o=await e.get("data/series"),D(),r&&await F()}catch(O){t(O)?n():r&&w("Couldn't load the readings. Retrying…","warn")}c=!1,W()}}function W(){clearTimeout(i),r&&(i=setTimeout(N,ru))}function U(){d=null,p.range!=="custom"?N():F()}function ee(){const O=hu(o,pe("data-search").value),k=pe("data-results"),S=pe("data-search").value.trim()!=="";if(k.hidden=!S,!!S){if(!O.length){const L=document.createElement("li");L.className="rd-none",L.textContent="No series match. Try a room name, or a word such as temperature, valve or burner.",k.replaceChildren(L);return}k.replaceChildren(...O.map(L=>{const j=document.createElement("li"),X=document.createElement("button");return X.type="button",X.className="rd-result",X.dataset.metric=L.metric,X.dataset.room=L.room??"",X.textContent=vn(L),j.append(X),j}))}}function se(){pe("data-search").addEventListener("input",ee),pe("data-search").addEventListener("keydown",S=>{S.key==="Escape"&&(pe("data-search").value="",ee()),S.key==="Enter"&&(S.preventDefault(),pe("data-results").querySelector(".rd-result")?.click())}),pe("data-results").addEventListener("click",S=>{const L=S.target.closest?.(".rd-result");L&&(p.metric=L.dataset.metric,$(),p.room=L.dataset.room,pe("data-metric").value=p.metric,$(),u=null,pe("data-search").value="",ee(),pe("data-search").focus(),U())}),pe("data-metric").addEventListener("change",S=>{p.metric=S.target.value,$(),u=null,U()}),pe("data-room").addEventListener("change",S=>{p.room=S.target.value,u=null,U()}),pe("data-step").addEventListener("change",S=>{p.step=S.target.value,U()}),pe("data-range").addEventListener("change",S=>{const L=S.target.value;!L||p.range===L||(p.range=L,R(),E(),U())});for(const S of["data-from","data-to"])pe(S).addEventListener("change",()=>{p.range="custom",p.from=pe("data-from").value,p.to=pe("data-to").value,R(),U()});pe("data-legend").addEventListener("click",S=>{const L=S.target.closest?.(".rd-key");if(!(!L||L.dataset.key===u)){u=L.dataset.key,d=null;for(const j of pe("data-legend").querySelectorAll(".rd-key"))j.setAttribute("aria-pressed",String(j===L));Z(),V()}});const O=f();O.addEventListener("keydown",S=>{const j=a?.series.find(I=>I.key===u)?.points.length??0;if(!j)return;const X=d??j-1,M={ArrowRight:X+1,ArrowLeft:X-1,Home:0,End:j-1,PageUp:X-10,PageDown:X+10}[S.key];M!=null&&(S.preventDefault(),d=Math.max(0,Math.min(j-1,M)),T(d))}),O.addEventListener("pointermove",S=>{const L=a?.series.find(ae=>ae.key===u),j=O.querySelector("svg");if(!L?.points.length||!j)return;const X=za(a,y(),l,Number(j.getAttribute("height"))),M=S.clientX-j.getBoundingClientRect().left,I=a.from+(M-X.left)/X.w*(a.to-a.from);let K=0;for(let ae=1;ae<L.points.length;ae++)Math.abs(L.points[ae][0]-I)<Math.abs(L.points[K][0]-I)&&(K=ae);d=K,T(d)}),O.addEventListener("pointerleave",S=>{S.pointerType==="mouse"&&(d=null,T(null))}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&r&&Math.floor(O.clientWidth)!==l&&V()}).observe(O);const k=pe("data-table-toggle");k.addEventListener("change",()=>{pe("data-table-wrap").hidden=!k.checked}),pe("data-csv").addEventListener("click",()=>fe("csv")),pe("data-json").addEventListener("click",()=>fe("json"))}function de(O){const k=a?fa(a.to,a.timezone).slice(0,10):"data";return`radiate-${p.metric}${p.room?`-${p.room}`:""}-${k}.${O}`}async function fe(O){const k=pe("data-dl-status");k.textContent="";try{let S;if(O==="json")S=new Blob([JSON.stringify(a,null,2)],{type:"application/json"});else{const j=P();j.set("format","csv"),S=new Blob([await e.text(`data?${j}`)],{type:"text/csv"})}const L=document.createElement("a");L.href=URL.createObjectURL(S),L.download=de(O),document.body.append(L),L.click(),L.remove(),setTimeout(()=>URL.revokeObjectURL(L.href),1e3),k.textContent=`Downloaded ${L.download}.`}catch(S){if(t(S)){n();return}k.textContent="Not downloaded. Check the connection and try again."}}return se(),{async available(){try{return o=await e.get("data/series"),D(),!!o.available}catch(O){return t(O)?null:/HTTP 404|not found/.test(String(O?.message))?!1:null}},show(){r=!0,N()},hide(){r&&(r=!1,clearTimeout(i))}}}const Re=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Ft=e=>e==null?"–":(Math.round(e*10)/10).toFixed(1),er=e=>`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ma=(e,t,n)=>`${e} ${e===1?t:n}`,tr=new Set(["passive","unheated"]),et=.5,It=14,Ht=10,nr=/bed|bath|landing|en.?suite|nursery|study|loft|attic/i,Pa=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),or=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16));function An(e){const t=[12,15,17,19,22].map(o=>[o,or(Pa(`--t${o}`)||"#888888")]);if(e==null)return or(Pa("--hm-none")||"#cccccc");const n=Math.max(12,Math.min(22,e));for(let o=0;o<t.length-1;o++){const[a,s]=t[o],[r,i]=t[o+1];if(n<=r)return s.map((c,l)=>Math.round(c+(i[l]-c)*((n-a)/(r-a))))}return t.at(-1)[1]}const Wt=(e,t=1)=>`rgb(${e.map(n=>Math.round(n*t)).join(",")})`,ar=e=>Wt(An(e)),ga=e=>{const t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},sr=e=>.2126*ga(e[0])+.7152*ga(e[1])+.0722*ga(e[2]),_u=[20,28,24];function ui(e){const t=sr(e),n=(t+.05)/(sr(_u)+.05),o=1.05/(t+.05);return n>=o?"#141c18":"#ffffff"}function rr(e){const t=e.filter(r=>nr.test(r.name)),n=e.filter(r=>!nr.test(r.name)),o=t.length&&n.length?["Ground floor","First floor"]:["Ground floor"],a={},s=(r,i)=>r.forEach((c,l)=>{a[c.id]={floor:i,x:l%3*3,y:Math.floor(l/3)*3,w:3,d:3}});return o.length===2?(s(n,0),s(t,1)):s(e,0),{floors:o,rooms:a}}const wa=34,Cu=Math.cos(Math.PI/6),hi=Math.sin(Math.PI/6),ir=.34,Eu=e=>Math.max(3.2,e*hi*.8),Ne=(e,t,n)=>[(e-t)*Cu*wa,(e+t)*hi*wa-n*wa],lo=e=>e.map(t=>t.map(n=>n.toFixed(1)).join(",")).join(" "),Au=(e,t)=>e.length<=t?e:`${e.slice(0,Math.max(1,t-1)).trimEnd()}…`;function lr(e,t,{selected:n,interactive:o}){let a="",s="";const r=Pa("--hm-line");let i=0;for(const[l,d]of Object.entries(e.rooms))t.has(l)&&(i=Math.max(i,d.x+d.w+d.y+d.d));const c=Eu(i);return e.floors.forEach((l,d)=>{const u=d*c,b=Object.entries(e.rooms).filter(([h,w])=>w.floor===d&&t.has(h)),p=Math.max(3,...b.map(([,h])=>h.x+h.w)),f=Math.max(3,...b.map(([,h])=>h.y+h.d));if(s+=`<polygon points="${lo([Ne(-.2,-.2,u),Ne(p+.2,-.2,u),Ne(p+.2,f+.2,u),Ne(-.2,f+.2,u)])}" fill="none" stroke="${r}" stroke-width="1.5"/>`,d>0)for(const[h,w]of[[-.2,-.2],[p+.2,-.2],[-.2,f+.2]]){const g=Ne(h,w,u),$=Ne(h,w,u-c+ir);s+=`<line x1="${g[0]}" y1="${g[1]}" x2="${$[0]}" y2="${$[1]}" stroke="${r}" stroke-dasharray="2 4"/>`}const y=Ne(-.2,f+.2,u);s+=`<text class="hm-ftag" x="${y[0]-8}" y="${y[1]+4}" text-anchor="end">${Re(l)}</text>`,b.sort((h,w)=>h[1].x+h[1].y-(w[1].x+w[1].y)).forEach(([h,w])=>{const g=t.get(h),$=An(g.temperature),R=.05,E=w.x+R,P=w.y+R,Z=w.w-2*R,Q=w.d-2*R,ne=u+ir,T=[Ne(E,P,ne),Ne(E+Z,P,ne),Ne(E+Z,P+Q,ne),Ne(E,P+Q,ne)],V=[Ne(E+Z,P,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,ne),Ne(E+Z,P,ne)],q=[Ne(E,P+Q,u),Ne(E+Z,P+Q,u),Ne(E+Z,P+Q,ne),Ne(E,P+Q,ne)],m=Ne(E+Z/2,P+Q/2,ne),D=ui($);let F="";if(g.calling||g.topup||g.role==="passive"){const U=Ne(E+.25,P+Q-.15,ne),ee=Ne(E+Math.min(Z-.25,1.4),P+Q-.15,ne);F=`<line class="hm-rad" x1="${U[0]}" y1="${U[1]}" x2="${ee[0]}" y2="${ee[1]}" stroke="${D}" stroke-width="3"/>`}const N=`${g.name}, ${g.temperature==null?"no reading":`${Ft(g.temperature)} degrees`}${g.calling?", heating":""}`,W=o?`tabindex="0" role="button" aria-pressed="${h===n}"`:"";a+=`<g class="hm-room" data-id="${Re(h)}" ${W} aria-label="${Re(N)}">
        <polygon points="${lo(V)}" fill="${Wt($,.62)}"/><polygon points="${lo(q)}" fill="${Wt($,.8)}"/>
        <polygon class="hm-top" points="${lo(T)}" fill="${Wt($)}"/>${F}
        <text class="hm-t" x="${m[0]}" y="${m[1]}" text-anchor="middle" fill="${D}">${Ft(g.temperature)}</text>
        ${Z>=1.4?`<text class="hm-n" x="${m[0]}" y="${m[1]+13}" text-anchor="middle" fill="${D}">${Re(Au(g.name,Math.floor(Z*5.5)))}</text>`:""}</g>`})}),s+a}function cr(e){requestAnimationFrame(()=>{try{const t=e.getBBox();t.width&&e.setAttribute("viewBox",`${t.x-10} ${t.y-10} ${t.width+20} ${t.height+20}`)}catch{}})}function Tu({modelEl:e,statusEl:t,planEl:n,transport:o,onSelect:a,onWeek:s,arrangeLock:r=()=>""}){let i=null,c=new Map,l=null,d=!1,u=!1,b=!1,p=0,f=null,y=null,h=0,w=null,g=null,$="";async function R(){try{const k=await o.call("GET","layout");k.status===200&&k.body?.layout?(l=k.body.layout,d=!0):k.status===404&&(u=!0)}catch{}ne()}function E(){clearTimeout(g),$="Saving…",P(),g=setTimeout(async()=>{if(u){$="This server can't keep a layout. Update Radiate to save it.",P();return}try{const k=await o.call("PUT","layout",l);d=k.status===200,$=d?"Saved.":`Not saved: ${typeof k.body=="string"?k.body:"the server refused it"}.`}catch{$="Not saved. Check the connection and move a room to try again."}P()},500)}function P(){const k=e.querySelector(".hm-save");k&&(k.textContent=$)}const Z=()=>Object.keys(l.rooms).filter(k=>c.has(k)),Q=()=>[...c.keys()].filter(k=>!l.rooms[k]);function ne(){if(!l||!c.size)return;if(b){m();return}if(!e.querySelector(".hm-iso")){e.innerHTML=`
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
        </div>`,e.querySelector("[data-act=arrange]").addEventListener("click",()=>{b=!0,p=0,ne(),ee(),e.querySelector("#hm-model-h")?.focus()});const M=e.querySelector(".hm-iso");M.addEventListener("click",I=>{const K=I.target.closest(".hm-room");K&&T(K.dataset.id,K)}),M.addEventListener("keydown",I=>{const K=I.target.closest(".hm-room");K&&(I.key==="Enter"||I.key===" ")&&(I.preventDefault(),T(K.dataset.id,K))})}e.querySelector(".hm-ramp").style.background=`linear-gradient(90deg, ${[12,15,17,19,22].map(M=>Wt(An(M))).join(", ")})`,e.querySelector(".hm-guess").hidden=d;const k=r(),S=e.querySelector("[data-act=arrange]");S.disabled=!!k,k?S.dataset.locked="":delete S.dataset.locked;const L=e.querySelector("#hm-arrange-lock");L.hidden=!k,L.textContent=k;const j=e.querySelector(".hm-iso"),X=j.contains(document.activeElement)?document.activeElement.closest(".hm-room")?.dataset.id:null;j.innerHTML=lr(l,c,{selected:f,interactive:!0}),X&&j.querySelector(`.hm-room[data-id="${CSS.escape(X)}"]`)?.focus(),cr(j)}function T(k,S){a?.(k,S)}function V(){for(const k of e.querySelectorAll(".hm-room"))k.setAttribute("aria-pressed",String(k.dataset.id===f))}const q=40;function m(){const k=Z().filter(M=>l.rooms[M].floor===p);let S="";for(let M=0;M<=It/et;M++)S+=`<line x1="${M*q*et}" y1="0" x2="${M*q*et}" y2="${Ht*q}" class="${M%2?"hm-g2":"hm-g1"}"/>`;for(let M=0;M<=Ht/et;M++)S+=`<line x1="0" y1="${M*q*et}" x2="${It*q}" y2="${M*q*et}" class="${M%2?"hm-g2":"hm-g1"}"/>`;const L=k.map(M=>{const I=l.rooms[M],K=c.get(M),ae=An(K.temperature),ke=ui(ae);return`<g class="hm-r2${M===f?" sel":""}" data-id="${Re(M)}" transform="translate(${I.x*q},${I.y*q})" tabindex="0" role="button"
          aria-label="${Re(K.name)}, ${I.w} by ${I.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${I.w*q}" height="${I.d*q}" fill="${Wt(ae)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ke}">${Re(K.name)}</text>
        <text class="hm-r2s" x="7" y="${I.d*q-7}" fill="${ke}">${I.w} × ${I.d} m</text>
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
          ${l.floors.length>1&&!k.length?'<wa-button size="s" appearance="plain" data-act="remove-floor">Remove this floor</wa-button>':""}
        </div>
        <svg class="hm-plan2d" viewBox="0 0 ${It*q} ${Ht*q}" aria-label="Plan of ${Re(l.floors[p])}">${S}${L}</svg>
        <div class="wa-cluster wa-gap-xs wa-align-items-center hm-tray">
          <span class="wa-caption-m wa-color-text-quiet">${j.length?"Not placed yet:":"Every room is placed."}</span>
          ${j.map(M=>`<button type="button" class="wa-size-s wa-outlined hm-chip" data-add="${Re(M)}">Place ${Re(c.get(M).name)}</button>`).join("")}
          ${X?`<button type="button" class="wa-size-s wa-plain" data-act="unplace">Take ${Re(X.name)} off the plan</button>`:""}
        </div>
        <p class="help-line">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
        <p class="hm-save wa-caption-m wa-color-text-quiet" role="status">${Re($)}</p>
      </div>`,D()}function D(){const k=e;k.querySelector("[data-act=done]").addEventListener("click",()=>{b=!1,e.innerHTML="",ne(),ee(),e.querySelector("[data-act=arrange]")?.focus()}),k.querySelector("[data-act=reset]").addEventListener("click",()=>{l=rr([...c.values()]),p=0,E(),m(),ee()});for(const M of k.querySelectorAll("[data-floor]"))M.addEventListener("click",()=>{p=Number(M.dataset.floor),m()});k.querySelector("[data-act=add-floor]")?.addEventListener("click",()=>{l.floors.push(l.floors.length===1?"First floor":l.floors.length===2?"Second floor":`Floor ${l.floors.length+1}`),p=l.floors.length-1,E(),m(),ee()}),k.querySelector("[data-act=remove-floor]")?.addEventListener("click",()=>{l.floors.splice(p,1);for(const M of Object.values(l.rooms))M.floor>p&&(M.floor-=1);p=Math.max(0,p-1),E(),m(),ee()}),k.querySelector("[data-act=rename]").addEventListener("change",M=>{const I=String(M.target.value??"").trim();I&&(l.floors[p]=I,E(),m(),ee())});for(const M of k.querySelectorAll("[data-add]"))M.addEventListener("click",()=>{const I=M.dataset.add;l.rooms[I]={floor:p,...N(p)},f=I,E(),m(),ee(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus()});k.querySelector("[data-act=unplace]")?.addEventListener("click",()=>{delete l.rooms[f],E(),m(),ee()});const S=k.querySelector(".hm-plan2d"),L=M=>{const I=S.createSVGPoint();return I.x=M.clientX,I.y=M.clientY,I.matrixTransform(S.getScreenCTM().inverse())},j=M=>Math.round(M/et)*et;S.addEventListener("pointerdown",M=>{const I=M.target.closest(".hm-r2");if(!I||w)return;const K=I.dataset.id,ae=l.rooms[K],ke=L(M);f=K,w={id:K,pointer:M.pointerId,resize:M.target.classList.contains("hm-handle"),ox:ke.x/q-ae.x,oy:ke.y/q-ae.y,moved:!1},S.setPointerCapture(M.pointerId);for(const Le of S.querySelectorAll(".hm-r2"))Le.classList.toggle("sel",Le.dataset.id===K)}),S.addEventListener("pointermove",M=>{if(!w||M.pointerId!==w.pointer)return;const I=l.rooms[w.id],K=L(M);w.resize?(I.w=Math.min(It-I.x,Math.max(1,j(K.x/q-I.x))),I.d=Math.min(Ht-I.y,Math.max(1,j(K.y/q-I.y)))):(I.x=Math.max(0,Math.min(It-I.w,j(K.x/q-w.ox))),I.y=Math.max(0,Math.min(Ht-I.d,j(K.y/q-w.oy)))),w.moved=!0,F(S,w.id),W()});const X=M=>{if(!w||M.pointerId!==w.pointer)return;const{id:I,moved:K}=w;w=null,K&&E(),m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus({preventScroll:!0})};S.addEventListener("pointerup",X),S.addEventListener("pointercancel",X),S.addEventListener("keydown",M=>{const I=M.target.closest(".hm-r2");if(!I)return;const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[M.key];if(M.key==="Enter"||M.key===" "){M.preventDefault(),f=I.dataset.id,m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(f)}"]`)?.focus();return}if(!K)return;M.preventDefault();const ae=l.rooms[I.dataset.id];M.shiftKey?(ae.w=Math.min(It-ae.x,Math.max(1,ae.w+K[0]*et)),ae.d=Math.min(Ht-ae.y,Math.max(1,ae.d+K[1]*et))):(ae.x=Math.max(0,Math.min(It-ae.w,ae.x+K[0]*et)),ae.y=Math.max(0,Math.min(Ht-ae.d,ae.y+K[1]*et))),f=I.dataset.id,F(S,I.dataset.id),I.setAttribute("aria-label",`${c.get(I.dataset.id).name}, ${ae.w} by ${ae.d} metres, at ${ae.x}, ${ae.y}.`),W(),E()})}function F(k,S){const L=l.rooms[S],j=k.querySelector(`.hm-r2[data-id="${CSS.escape(S)}"]`);if(!j)return;j.setAttribute("transform",`translate(${L.x*q},${L.y*q})`);const X=j.querySelector(".hm-body");X.setAttribute("width",L.w*q),X.setAttribute("height",L.d*q);const M=j.querySelector(".hm-handle");M.setAttribute("x",L.w*q-14),M.setAttribute("y",L.d*q-14);const I=j.querySelector(".hm-r2s");I.setAttribute("y",L.d*q-7),I.textContent=`${L.w} × ${L.d} m`}function N(k){const S=Z().map(L=>l.rooms[L]).filter(L=>L.floor===k);for(let L=0;L<=Ht-2;L+=et)for(let j=0;j<=It-2;j+=et)if(!S.some(X=>j<X.x+X.w&&j+2>X.x&&L<X.y+X.d&&L+2>X.y))return{x:j,y:L,w:2,d:2};return{x:0,y:0,w:2,d:2}}function W(){const k=t.querySelector(".hm-preview");k&&(k.innerHTML=lr(l,c,{selected:f,interactive:!1}),cr(k))}function U(){let k=t.querySelector(".hm-live");return k||(t.innerHTML=`<h2 slot="header" class="wa-heading-m hm-status-h">The house now</h2>
        <div class="wa-stack wa-gap-m">
          <div class="hm-live wa-stack wa-gap-m"></div>
          <p class="help-line hm-help">The big number is rooms that want heat, out of the rooms Radiate controls. <a href="#guide/now">What the house now shows</a></p>
        </div>`,k=t.querySelector(".hm-live")),t.querySelector(".hm-help").hidden=b,t.querySelector(".hm-status-h").textContent=b?"Live model":"The house now",k}function ee(){if(!i)return;const k=U();if(b){k.innerHTML=`
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="help-line">${ma(l.floors.length,"floor","floors")}, ${Z().length} of ${ma(c.size,"room","rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`,W();return}const S=[...c.values()],L=S.filter(ge=>!tr.has(ge.role)),j=L.filter(ge=>ge.calling),X=S.filter(ge=>ge.temperature!=null),M=i.telemetry??{},I=M.simulated||M.boiler_linked!==!1,K=i.boiler;let ae;i.mode==="off"?ae="Heating is off.":i.mode==="frost"?ae="Frost protection only.":j.length?I?K.state==="firing"?ae=`${j.length===1?"room is":"rooms are"} heating. Burner on.`:ae=`${j.length===1?"room wants":"rooms want"} heat.`:ae=`${j.length===1?"room wants":"rooms want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:ae="No room needs heat right now.";const ke=L.map(ge=>ge.target).filter(ge=>ge!=null),Le=ke.length?Ru(ke):null,Ke=ge=>(Math.max(12,Math.min(22,ge))-12)/10*100,Ae=[...X].sort((ge,it)=>ge.temperature-it.temperature),nn=X.map(ge=>`<rect x="${Ke(ge.temperature)}%" y="14" width="4" height="26" rx="2" fill="${Wt(An(ge.temperature))}" transform="translate(-2,0)"><title>${Re(ge.name)} ${Ft(ge.temperature)}°</title></rect>`).join(""),z=[12,14,16,18,20,22].map(ge=>`<text class="hm-axis" x="${Ke(ge)}%" y="58" text-anchor="middle">${ge}</text>`).join(""),oe=Le!=null?`<rect x="${Ke(Le)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>`:"",te=Ae.length?`Coldest ${Ae[0].name} ${Ft(Ae[0].temperature)}°, warmest ${Ae.at(-1).name} ${Ft(Ae.at(-1).temperature)}°.${Le!=null?` Most heated rooms aim for ${Ft(Le)}°.`:""}`:"No readings yet.",ue=!M.simulated&&(i.alert_details??[]).some(ge=>ge.code==="driver.shelly"),ye=I?ue?se("fire","Boiler","Not reachable","Radiate can't see or switch the boiler right now.","warning","text"):se("fire","Boiler",{idle:"Idle",lead:"Opening valves",firing:"Firing",rest:"Resting"}[K.state]??"–",K.state==="firing"?`${Math.round(K.burn_elapsed_s/60)} min so far`:`${ma(K.starts_last_hour,"start","starts")} in the last hour`,K.state==="firing"?"brand":"neutral","text"):se("fire","Boiler","Not linked","Radiate can't switch it until the relay is set up.","neutral","text"),Ie=M.dry_run?se("eye","Dry run",String(M.intended_writes??0),"valve and boiler changes held back","warning"):se("sliders","Mode",{auto:"Auto",frost:"Frost",off:"Off"}[i.mode]??i.mode,i.settings?.demand_mode?`${Lu(i.settings.demand_mode)} demand`:"","neutral","text"),Se=se("microchip","Devices",String(h),h?h===1?"needs attention":"need attention":"all reporting well",h>0?"warning":"neutral"),De=L.map(ge=>ge.model?.confidence).filter(ge=>ge!=null),qe=De.length?Math.round(De.reduce((ge,it)=>ge+it,0)/De.length*100):null,Me=se("graduation-cap","Learning",qe==null?"–":`${qe}%`,qe==null?"waiting for the first burns":qe<50?"how sure Radiate is of each room, on average":"average confidence in each room","neutral");k.innerHTML=`
      <div class="hm-hero">
        <div class="hm-big readout">${j.length}<small>/${L.length}</small></div>
        <p class="wa-heading-s">${Re(ae)}</p>
      </div>
      <div class="hm-spread wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">Where every room sits</span>
        <svg role="img" aria-label="${Re(te)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${oe}${nn}${z}</svg>
        <span class="wa-caption-m wa-color-text-quiet">${Re(te)}</span>
      </div>
      <div class="hm-cells">${ye}${Ie}${Se}${Me}</div>
      ${de()}`}function se(k,S,L,j,X,M="readout"){const I=M==="readout"?`<span class="hm-value readout">${Re(L)}</span>`:`<span class="hm-value hm-word">${Re(L)}</span>`;return`<div class="hm-cell" data-variant="${X}">
      <span class="wa-cluster wa-gap-xs wa-caption-m wa-color-text-quiet"><wa-icon name="${k}" class="hm-cell-icon"></wa-icon>${Re(S)}</span>
      ${I}<span class="wa-caption-s wa-color-text-quiet">${Re(j)}</span></div>`}function de(){const k=new Map;for(const j of c.values()){if(tr.has(j.role)||j.next_setpoint==null||j.next_in_min==null)continue;const X=j.next_in_min;k.has(X)||k.set(X,[]),k.get(X).push(j)}const S=[...k.entries()].sort((j,X)=>j[0]-X[0]).slice(0,3);return S.length?`<div class="hm-next wa-stack wa-gap-2xs"><span class="wa-caption-m wa-color-text-quiet">Coming up</span><ul>${S.map(([j,X])=>{const M=new Map;for(const K of X)M.has(K.next_setpoint)||M.set(K.next_setpoint,[]),M.get(K.next_setpoint).push(K.name);const I=[...M.entries()].map(([K,ae])=>{const ke=ae.length<2?ae[0]:`${ae.slice(0,-1).join(", ")} and ${ae.at(-1)}`,Le=X.find(Ae=>Ae.next_setpoint===K)?.target,Ke=Le!=null&&K<Le?"cools to":ae.length>1?"warm to":"warms to";return`${ke} ${ae.length>1&&Ke==="cools to"?"cool to":Ke} ${Ft(K)}°`}).join(". ");return`<li><time class="readout">${er((i.minute_of_day+j)%1440)}</time><span>${Re(I)}.</span></li>`}).join("")}</ul></div>`:""}function fe(){if(!y?.rooms?.length||!i){n.hidden=!0;return}n.hidden=!1;const k=y.now?.weekday??0,S=i.minute_of_day??y.now?.minute??0,L=y.rooms.map(j=>{const X=[...j.days[k]?.transitions??[]].sort((K,ae)=>K.minute-ae.minute);if(!X.length)return"";X[0].minute>0&&X.unshift({minute:0,setpoint:X.at(-1).setpoint});const M=X.map((K,ae)=>{const ke=ae+1<X.length?X[ae+1].minute:1440;return ke<=K.minute?"":`<span style="width:${(ke-K.minute)/1440*100}%;background:${Wt(An(K.setpoint))}" title="${Ft(K.setpoint)}° from ${er(K.minute)}"></span>`}).join(""),I=j.days[k]?.text??"";return`<span class="hm-pname">${Re(j.name)}</span><div class="hm-strip" role="img" aria-label="${Re(`${j.name} today: ${I}`)}">${M}<i class="hm-now" style="left:${S/1440*100}%"></i></div>`}).join("");n.querySelector(".hm-tl")||(n.innerHTML=`<div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m">Today's plan</h2>
          <wa-button size="s" appearance="plain" data-act="week"><wa-icon slot="end" name="arrow-down"></wa-icon>Week schedules</wa-button>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each strip is a room's day, coloured by the temperature it aims for. The upright line is now. <a href="#guide/schedules">Change the weekly times</a></p>
          <div class="hm-tl"></div>
        </div>`,n.querySelector("[data-act=week]").addEventListener("click",()=>s?.())),n.querySelector(".hm-tl").innerHTML=`${L}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`}function O(k){i=k;const S=new Map;for(const j of k.rooms)S.set(j.id,j);const L=!c.size;c=S,l||(l=rr(k.rooms)),L&&R(),b?W():ne(),ee(),fe()}return{update:O,week(k){y=k,fe()},devices(k){h=k,ee()},select(k){f=k,b||V()},redraw(){!b&&e.querySelector(".hm-iso")&&ne(),ee(),fe()},get editing(){return b}}}function Ru(e){const t=new Map;for(const n of e)t.set(n,(t.get(n)??0)+1);return[...t.entries()].sort((n,o)=>o[1]-n[1]||o[0]-n[0])[0][0]}const Lu=e=>e.charAt(0).toUpperCase()+e.slice(1),dr="radiate.guideNote";function Mu({root:e}){const t=n=>n?e.querySelector(`#g-${CSS.escape(n)} > h3`):null;return{show(){},hide(){},reveal(n){const o=t(n);return o?(o.focus({preventScroll:!0}),o.scrollIntoView({block:"start"}),!0):!1}}}function Ou({note:e,tab:t}){let n=!1;try{n=localStorage.getItem(dr)==="dismissed"}catch{}e.hidden=n;const o=()=>{e.hidden=!0;try{localStorage.setItem(dr,"dismissed")}catch{}};e.querySelector("[data-act=open]").addEventListener("click",o),e.querySelector("[data-act=dismiss]").addEventListener("click",()=>{o(),t&&!t.hidden&&t.focus()})}const lt=e=>document.getElementById(e),ur=15e3,Nu={zigbee:"Zigbee sensor",home_assistant:"Home Assistant",both:"Both, sensor first",eco:"Eco",comfort:"Comfort",normal:"Normal",internal_sensor_only:"Valve's own sensor",passive:"Bypass",unheated:"No radiator",episodic:"Open fire",continuous:"Range cooker",in_use:"In use",occasional:"Occasional",unused:"Unused"},zu={app:"Set here",house_file:"House file",default:"Default"},hn=e=>Nu[e]??String(e),Da=(e,t,n)=>`${e} ${e===1?t:n}`,pi=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ln=e=>`st-${e.replace(/[^a-z0-9_]/gi,"-")}`;function qa(e,t){const n=Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));return t?t==="°C"?`${n}°`:t==="%"?`${n}%`:`${n} ${t}`:n}function Ut(e,t){if(t==null||t==="")return"–";switch(e.kind){case"number":case"integer":return qa(Number(t),e.unit);case"bool":return t?"On":"Off";case"list":return Array.isArray(t)&&t.length?t.join(", "):"–";case"use":return typeof t=="string"?hn(t):`Weekdays ${hn(t.weekdays).toLowerCase()}, weekend ${hn(t.weekend).toLowerCase()}`;case"choice":return hn(t);default:return String(t)}}function Pu(e){const t=[e.help];return(e.kind==="number"||e.kind==="integer")&&e.min!=null&&e.max!=null&&t.push(`${qa(e.min,null)} to ${qa(e.max,e.unit)}.`),!e.secret&&e.default!=null&&e.default!==""&&t.push(`Default ${Ut(e,e.default)}.`),e.restart&&t.push("Used after a restart."),t.join(" ")}function Du(e){return e.secret?e.is_set?e.source==="house_file"&&e.env.length?`Set from ${e.env.join(", ")}`:e.source==="app"?"Set here":"Set in the house file":"Not set":e.source==="house_file"&&e.env.length?`House file, from ${e.env.join(", ")}`:zu[e.source]??e.source}function qu(e){return e.secret?e.house_file_set?"Use the house file's":"Clear it":e.house_file_set?`Use the house file's, ${Ut(e,e.house_file_value)}`:e.default!=null?`Use the default, ${Ut(e,e.default)}`:"Use the default"}function Iu(e,t){const n=e.pending_restart.length;if(!n)return"";const o=e.pending_restart.map(t);return`Restart Radiate to use ${Da(n,"changed setting","changed settings")}: ${pi(o)}.`}function Hu(e,t){return e.length&&t.length?"Saved. Some changes are in use now; restart Radiate for the rest.":t.length?"Saved. Restart Radiate to use it.":e.length?"Saved. In use now.":"Saved."}function hr(e,t){switch(e.kind){case"number":case"integer":{const n=String(t).trim();if(!n)return null;const o=Number(n.replace(",","."));return Number.isFinite(o)?o:n}case"list":{const n=String(t).split(/[,\s]+/).map(o=>o.trim()).filter(Boolean);return n.length?n:null}case"secret":return t===""?void 0:t;case"text":case"choice":return String(t).trim()===""?null:String(t).trim();default:return t}}const Bu=(e,t)=>JSON.stringify(e??null)===JSON.stringify(t??null);function fi(e){if(!e.secret)return e.source==="default"?null:e.value}const Fu={set:"cool",restart:"warning"};function ju(e,t=""){const n=` ${t} `;if(e==="button"&&/\s(btn|link)\s/.test(n)){const o=document.createElement("wa-button");return n.includes(" btn-primary ")?o.setAttribute("variant","brand"):n.includes(" link ")?(o.setAttribute("appearance","plain"),o.setAttribute("size","s")):o.setAttribute("appearance","outlined"),o}return n.includes(" card ")&&e!=="details"?document.createElement("wa-card"):n.includes(" badge ")?document.createElement("wa-badge"):document.createElement(e)}function le(e,t={},...n){const o=ju(e,t.class);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="class"?o.className=s:a==="text"?o.textContent=s:a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n)a&&o.append(a);if(o.localName==="wa-badge"){const a=Fu[t["data-kind"]]??"neutral";a==="cool"?o.classList.add("radiate-cool"):o.setAttribute("variant",a),o.setAttribute("appearance","filled-outlined")}return o}function Wu(e,t,n,o){const a=document.createElement("wa-radio-group");a.setAttribute("label",e),a.setAttribute("orientation","horizontal"),a.setAttribute("size","s"),a.classList.add("label-hidden");let s=n;t.forEach(([,i],c)=>{const l=document.createElement("wa-radio");l.setAttribute("appearance","button"),l.value=String(c),l.textContent=i,a.append(l)});const r=t.findIndex(([i])=>JSON.stringify(i)===JSON.stringify(s));return a.value=r<0?"":String(r),a.addEventListener("change",()=>{const i=Number(a.value);!Number.isInteger(i)||!t[i]||(s=t[i][0],o())}),{node:a,get:()=>s,focus:()=>a.focus()}}function pr(e,t,n,o,a){const s=le("select",{id:e,"aria-describedby":a});for(const[r,i]of t)s.append(le("option",{value:r,text:i}));return n!=null&&!t.some(([r])=>r===n)&&s.append(le("option",{value:n,text:hn(n)})),s.value=n??"",s.addEventListener("change",o),s}function Uu(e,t,n,o){const a=fi(e);if(e.kind==="bool"){const i=[[!0,"On"],[!1,"Off"]];e.optional&&i.unshift([null,"Not set"]);const c=Wu(e.label,i,e.optional?a:a??e.default,o);return c.node.setAttribute("aria-describedby",n),c.node.id=t,{node:c.node,get:()=>c.get(),focus:c.focus}}if(e.kind==="choice"){const i=e.choices.map(l=>[l,hn(l)]);(e.optional||a==null)&&i.unshift(["",e.optional?"Not set":`Default, ${Ut(e,e.default)}`]);const c=pr(t,i,a,o,n);return{node:c,get:()=>hr(e,c.value),focus:()=>c.focus()}}if(e.kind==="use"){const i=[["","Not set"],...e.choices.map(b=>[b,hn(b)])],c=typeof a=="string"?[a,a]:a?[a.weekdays,a.weekend]:["",""],l=le("div",{class:"st-use",role:"group",id:t,"aria-describedby":n}),d=["Weekdays","Weekend"].map((b,p)=>{const f=`${t}-${p}`,y=pr(f,i,c[p]||"",o);return l.append(le("span",{class:"st-use-part"},le("label",{for:f,text:b}),y)),y});return{node:l,get:()=>{const[b,p]=d.map(f=>f.value);return!b&&!p?null:b===p?b:{weekdays:b||null,weekend:p||null}},focus:()=>d[0].focus()}}const s=le("input",{id:t,"aria-describedby":n,autocomplete:"off",spellcheck:"false"});return e.kind==="number"||e.kind==="integer"?(s.type="text",s.inputMode=e.kind==="integer"||(e.min??0)>=0?e.kind==="integer"?"numeric":"decimal":"text",s.className="num",s.value=a==null?"":String(a),a==null&&e.default!=null&&(s.placeholder=String(e.default))):e.kind==="secret"?(s.type="password",s.autocomplete="new-password",s.placeholder=e.is_set?"Set. Type to replace it":"Not set"):e.kind==="list"?(s.type="text",s.value=Array.isArray(a)?a.join(", "):"",!s.value&&Array.isArray(e.default)&&(s.placeholder=e.default.join(", "))):(s.type="text",s.value=a==null?"":String(a),!s.value&&e.default!=null&&(s.placeholder=String(e.default))),s.addEventListener("input",o),{node:e.unit&&(e.kind==="number"||e.kind==="integer")?le("span",{class:"unit"},s,le("span",{text:e.unit})):s,get:()=>hr(e,s.value),focus:()=>s.focus(),input:s}}function Vu({transport:e,isAuthError:t,onAuth:n,onOpenSetup:o,onShowSchedules:a,moreSections:s=()=>[]}){let r=null,i=!1,c=!1;const l=new Map,d=new Set;let u=null,b=!1;const p=new Map,f=async(m,D,F)=>{try{return await e.call(m,D,F)}catch(N){throw t(N)&&n(),N}};async function y(){if(!c){c=!0;try{const m=await f("GET","settings/config");m.status===200&&(r=m.body,w())}catch{lt("settings-summary").textContent="Couldn't load the settings. Try again in a moment."}finally{c=!1}}}function h(m){return p.get(m)??m}function w(){p.clear();for(const U of r.sections){for(const ee of U.fields??[])p.set(ee.path,ee.label);for(const ee of U.rooms??[])for(const se of ee.fields)p.set(se.path,`${ee.name} ${se.label.toLowerCase()}`)}const m=r.saved.length;lt("settings-summary").textContent=m?`${Da(m,"setting is","settings are")} set here, over the house file.`:"Every setting comes from the house file or its default.",lt("settings-where").textContent=r.saved_at?`Changes are saved to ${r.saved_at}. The house file isn't changed.`:"In the demo, changes are not saved to a file and end when the demo does.";const D=lt("settings-restart");D.hidden=!r.pending_restart.length,lt("settings-restart-text").textContent=Iu(r,h);const F=lt("settings-problems");if(F.hidden=!r.problems.length,lt("settings-problems-text").textContent=r.problems.length?`The settings saved here weren't used at the last start, so the house file's apply. ${r.problems.map(U=>`${U.path?`${h(U.path)}: `:""}${U.message}`).join(" ")} Change or reset them below.`:"",g(m),lt("settings-toc").replaceChildren(...[...r.sections,...s()].map(U=>le("li",{},le("a",{href:`#settings/${U.id}`,text:U.title})))),lt("settings-sections").replaceChildren(...r.sections.map($)),u){const U=document.getElementById(u);u=null,U?.focus()}}function g(m){const D=lt("settings-all");if(D.hidden=!m,D.replaceChildren(),!m)return;if(!b){const W=le("button",{type:"button",class:"btn",id:"settings-all-btn",text:"Use the house file for every setting"});W.addEventListener("click",()=>{b=!0,u="settings-all-go",w()}),D.append(W);return}const F=le("button",{type:"button",class:"btn btn-primary",id:"settings-all-go",text:"Use the house file"}),N=le("button",{type:"button",class:"link",text:"Keep them"});F.addEventListener("click",()=>V(null,"all",F)),N.addEventListener("click",()=>{b=!1,u="settings-all-btn",w()}),D.append(le("p",{text:`The ${Da(m,"setting","settings")} set here go back to the house file's values.`}),le("div",{class:"st-actions"},F,N))}function $(m){const D=le("section",{class:"st-sec",id:`s-${m.id}`,"aria-labelledby":`s-${m.id}-h`}),F=le("h3",{class:"section-h",id:`s-${m.id}-h`,tabindex:"-1",text:m.title});D.append(F);const N=le("p",{class:"help-line st-help",text:`${m.help} `});if(m.guide&&N.append(le("a",{class:"help-link",href:`#guide/${m.guide}`,text:`About ${m.title.toLowerCase()}`})),D.append(N),m.link)D.append(R(m));else if(m.per_room)for(const W of m.rooms)D.append(E(`rooms.${W.id}`,W.name,W.fields,!0));else D.append(E(m.id,m.title,m.fields,!1));return D}function R(m){const D=le("div",{class:"card st-plate st-linked"});if(m.link==="household"){const F=le("button",{type:"button",class:"btn btn-primary",text:"Open the household setup"});F.addEventListener("click",N=>o(N)),D.append(F)}else if(m.link==="schedules"){const F=le("button",{type:"button",class:"btn",text:"Show the schedules"});F.addEventListener("click",()=>a()),D.append(F)}return D}function E(m,D,F,N){const W=ln(m),U=F.filter(K=>K.source==="app").length,ee=N?le("details",{class:"card st-plate st-room",id:W}):le("div",{class:"card st-plate",id:W});if(N){const K=le("summary",{},le("span",{class:"st-room-name",text:D}));U&&K.append(le("span",{class:"badge","data-kind":"set",text:`${U} set here`})),F.some(ae=>ae.pending_restart)&&K.append(le("span",{class:"badge","data-kind":"restart",text:"Restart to use"})),ee.append(K),ee.open=d.has(m)||l.has(m),ee.addEventListener("toggle",()=>{ee.open?d.add(m):d.delete(m)})}const se=le("form",{class:"st-form",novalidate:!0,"aria-label":N?D:`${D} settings`}),de=new Map,fe=le("div",{class:"st-foot"}),O=le("button",{type:"submit",class:"btn btn-primary",id:`${W}-save`,text:"Save changes",hidden:!0}),k=le("button",{type:"button",class:"link",text:"Cancel changes",hidden:!0}),S=le("p",{class:"st-status",id:`${W}-status`,role:"status",tabindex:"-1"}),L=le("div",{class:"st-confirm",hidden:!0}),j=()=>F.filter(K=>{const ae=de.get(K.path);if(!ae)return!1;const ke=ae.get();return K.secret?ke!==void 0:!Bu(ke,fi(K))}),X=()=>{const K=j().length;O.hidden=!K,O.disabled=!1,k.hidden=!K,O.textContent=K>1?`Save ${K} changes`:"Save changes",L.hidden=!0};for(const K of F)se.append(P(K,de,X));k.addEventListener("click",()=>{l.delete(m),u=`${W}-status`,w()}),se.addEventListener("submit",async K=>{K.preventDefault();const ae=j();if(!ae.length)return;const ke=Object.fromEntries(ae.map(Ae=>[Ae.path,de.get(Ae.path).get()])),Le=ae.filter(Ae=>Ae.hardware&&!Ae.secret),Ke=Le.map(Ae=>`${h(Ae.path)}, ${Ut(Ae,ke[Ae.path])}`);Le.length?Q(L,Ke,()=>T(m,ke,!0,O,se),O,!0):T(m,ke,!1,O,se)});const M=le("button",{type:"button",class:"link",text:N?`Use the house file for ${D}`:"Use the house file for this section",hidden:!U});M.addEventListener("click",()=>V(m,m,M,L));const I=l.get(m);return I&&I.until>Date.now()&&(S.textContent=I.text,S.dataset.kind=I.kind??""),fe.append(le("div",{class:"st-actions"},O,k,M),L,S),se.append(fe),ee.append(se),ee}function P(m,D,F){const N=ln(m.path),W=le("div",{class:"st-field","data-source":m.source}),U=le("div",{class:"st-head"}),ee=m.kind==="bool"||m.kind==="use"?le("span",{class:"st-label",id:`${N}-label`,text:m.label}):le("label",{class:"st-label",for:N,text:m.label});U.append(ee,le("span",{class:"st-src","data-source":m.source,text:Du(m)})),m.pending_restart&&U.append(le("span",{class:"tag",text:"Restart to use"})),W.append(U);const se=`${N}-help`,de=`${N}-err`;W.append(le("p",{class:"field-help",id:se,text:Pu(m)}));const fe=le("div",{class:"st-control"});if(m.locked)fe.append(le("p",{class:"st-fixed",text:`${Ut(m,m.value)}. ${m.locked}`}));else if(!m.editable)fe.append(le("p",{class:"st-fixed"},le("code",{text:Ut(m,m.value)}),document.createTextNode(" Only the house file sets this.")));else{const O=Uu(m,N,`${se} ${de}`,F);(m.kind==="bool"||m.kind==="use")&&O.node.setAttribute("aria-labelledby",`${N}-label`),D.set(m.path,O),fe.append(O.node)}if(W.append(fe),m.source==="app"&&!m.locked){const O=m.secret?null:m.house_file_set?`House file: ${Ut(m,m.house_file_value)}.`:null,k=le("button",{type:"button",class:"link",id:`${N}-revert`,text:qu(m)});k.addEventListener("click",()=>V(m.path,Z(m.path),k)),W.append(le("p",{class:"st-file"},O?document.createTextNode(`${O} `):null,k))}return W.append(le("p",{class:"field-error",id:de,hidden:!0})),W}const Z=m=>{const D=m.split(".");if(D[0]==="rooms"&&D.length===3)return`rooms.${D[1]}`;const F=r.sections.find(N=>(N.fields??[]).some(W=>W.path===m));return F?F.id:m};function Q(m,D,F,N,W=!1){const U=W?D:D.map(h);m.replaceChildren(),m.hidden=!1;const ee=le("button",{type:"button",class:"btn btn-primary",text:"Save and allow it"}),se=le("button",{type:"button",class:"link",text:"Cancel"});ee.addEventListener("click",()=>{m.hidden=!0,F()}),se.addEventListener("click",()=>{m.hidden=!0,N?.focus()}),m.append(le("p",{class:"st-confirm-text",text:`This lets Radiate write to the boiler or the valves: ${pi(U)}. Check the wiring and the valves before you go on.`}),le("div",{class:"st-actions"},ee,se)),ee.focus()}function ne(m,D,F,N){for(const fe of m.querySelectorAll(".field-error"))fe.hidden=!0,fe.textContent="";for(const fe of m.querySelectorAll("[aria-invalid]"))fe.removeAttribute("aria-invalid");const W=[],U=[];for(const fe of F??[]){const O=m.querySelector(`#${CSS.escape(ln(fe.path))}-err`);O?(O.textContent=fe.message,O.hidden=!1,m.querySelector(`#${CSS.escape(ln(fe.path))}`)?.setAttribute("aria-invalid","true"),W.push(fe)):U.push(fe)}const ee=m.querySelector(".st-status"),se=U.map(fe=>`${fe.path?`${h(fe.path)}: `:""}${fe.message}`).join(" ");ee.textContent=`${N??"Not saved."}${se?` ${se}`:""}`,ee.dataset.kind="error";const de=W[0]?m.querySelector(`#${CSS.escape(ln(W[0].path))}`):null;de&&de.tagName!=="DIV"?de.focus():ee.focus()}async function T(m,D,F,N,W){N.disabled=!0;try{const U=await f("PUT","settings/config",F?{values:D,confirm:!0}:{values:D});if(U.status===409){const ee=W.querySelector(".st-confirm");Q(ee,U.body.confirm??[],()=>T(m,D,!0,N,W),N),N.disabled=!1;return}if(U.status!==200){const ee=typeof U.body=="object"&&U.body?U.body:{message:String(U.body)};ne(W,m,ee.errors,ee.message),N.disabled=!1;return}q(m,U.body,Hu(U.body.applied??[],U.body.restart??[]))}catch{const U=W.querySelector(".st-status");U.textContent="Not saved. Check the connection and try again.",U.dataset.kind="error",N.disabled=!1}}async function V(m,D,F,N){const W=m==null?"settings/config":`settings/config/${encodeURIComponent(m)}`,U=async ee=>{F.disabled=!0;try{const se=await f("DELETE",W,ee?{confirm:!0}:void 0);if(se.status===409){const de=N??F.closest("form")?.querySelector(".st-confirm")??lt("settings-all");F.disabled=!1,Q(de,se.body.confirm??[],()=>U(!0),F);return}if(se.status!==200){const de=typeof se.body=="object"&&se.body?se.body:{message:String(se.body)},fe=F.closest("form");if(F.disabled=!1,fe)ne(fe,D,de.errors,de.message??"Not changed.");else{const O=(de.errors??[]).map(k=>`${h(k.path)}: ${k.message}`).join(" ");lt("settings-all").append(le("p",{class:"st-status","data-kind":"error",role:"alert",text:`${de.message??"Not changed."} ${O}`}))}return}b=!1,q(D,se.body,"Back to the house file.")}catch{F.disabled=!1}};U(!1)}function q(m,D,F){r=D,l.set(m,{text:F,until:Date.now()+ur}),setTimeout(()=>{const N=l.get(m);if(N&&N.until<=Date.now()){l.delete(m);const W=document.getElementById(`${ln(m)}-status`);W&&(W.textContent="")}},ur+50),u=m==="all"?"settings-h":`${ln(m)}-status`,w()}return{async available(){try{const m=await f("GET","settings/config");return m.status!==200?!1:(r=m.body,!0)}catch{return!1}},show(){i=!0,r&&w(),y()},hide(){i=!1},reveal(m){const D=m?document.getElementById(`s-${m}-h`):null;return D?(D.focus({preventScroll:!0}),D.scrollIntoView({block:"start"}),!0):!1},get open(){return i}}}const mi=5e3;function Jo({holdMs:e=mi,now:t=()=>Date.now()}={}){let n,o=!1,a=0,s=0,r=0,i="";const c=()=>{o=!1,n=void 0};return{press(l){return n=l,o=!0,i="",s+=1,a=s,s},done(l){l===s&&(a=0,r=t())},failed(l,d){l===s&&(a=0,c(),i=d)},shown(l){return o&&!a&&(l===n||t()-r>e)&&c(),o?n:l},get busy(){return a!==0},get error(){return i},clearError(){i=""}}}async function Ku(e,t,{send:n,paint:o,refresh:a,later:s=setTimeout}){const r=e.press(t);o();try{await n()}catch(i){return e.failed(r,no(i)),o(),!1}return e.done(r),o(),s(o,mi+50),await a(),!0}function no(e){const t=String(e?.message??"");return/HTTP 403/.test(t)&&/csrf/.test(t)?"Not saved: your sign-in has expired. Reload the page.":/HTTP 403/.test(t)?"Not saved: ask an admin.":"Not saved. Try again."}const gi=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ju=10,wi=.4,Yu=.75,Gu=180,Xu=["dry_burner","dry_relay"],co=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,Rt=e=>`${e.toFixed(1)}°`,fr=e=>e.toLocaleString("en-GB");function mr(e){if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`}function Bt(e){return e>=.095?e.toFixed(1):e.toFixed(2)}function Qu(e,t=new Date().getFullYear()){const[n,o,a]=e.split("-").map(Number);return`${a} ${gi[o-1]}${n===t?"":` ${n}`}`}const Zu=e=>e===1?"once":e===2?"twice":`${e} times`;function gr(e){return e<wi?"still learning":e<Yu?"fairly sure of":"sure of"}function eh(e){const t=gr(e.confidence),n=gr(e.loss_confidence??e.confidence);return t===n?`Radiate is ${t} how fast this room warms and cools.`:`Radiate is ${t} how fast this room warms, and ${n} how fast it cools.`}const bi=e=>e.samples===0||e.confidence<wi;function th(e,t={}){const n=e.model,o=[],a=(h,w,g)=>o.push({key:h,label:w,text:g}),s=e.temperature,r=t.outdoor,i=n.heating_kph;if(i){let h=`With the boiler on and the valve open, about ${Bt(i.with_house)}° an hour while most of the house is heating, or ${Bt(i.alone)}° an hour when it's the only room taking heat.`;if(s!=null&&r!=null){const w=i.with_house-n.b*(s-r)+n.d;h+=w>.05?` Now, with ${Rt(r)} outside, it would gain about ${Bt(w)}° an hour after the heat it loses.`:` Now, with ${Rt(r)} outside, it loses heat about as fast as the radiator adds it while the house heats.`}a("warms","Warms up",h)}else a("warms","Warms up",`The radiator can warm it by up to about ${Bt(n.a)}° an hour with the boiler on and the valve fully open.`);let c=`With the heating off, it cools by about ${Bt(n.b*Ju)}° an hour when it's 10° colder outside than in.`;s!=null&&r!=null&&s-r>=1&&(c+=` Now, at ${Rt(s)} inside and ${Rt(r)} outside, that's about ${Bt(n.b*(s-r))}° an hour.`),a("cools","Cools down",c),e.heat_source==="continuous"?a("steady","Other heat",`The range cooker adds about ${Bt(Math.max(0,n.d))}° an hour on its own, all day, so the radiator is needed less.`):n.d>=.15&&a("steady","Other heat",`Something other than the radiator adds about ${Bt(n.d)}° an hour, such as a warm room next door.`);const l=Math.round(n.arrival_lag_min);a("lag","Heat arrives",n.lag_measured?`About ${l} min after the boiler fires, timed over ${n.lag_measured===1?"its last warm-up":`its last ${n.lag_measured} warm-ups`}.`:`Not timed yet, so Radiate allows ${l} min for the hot water to reach the radiator.`);let d;if(n.samples===0)d="Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";else{d=eh(n);const h=n.learned?.since?` since ${Qu(n.learned.since,t.year)}`:"",w=n.samples>=120?`, about ${fr(Math.round(n.samples/60))} hours of learning`:"";d+=` From ${fr(n.samples)} ${n.samples===1?"reading":"readings"}${h}${w}.`}e.role==="internal_sensor_only"&&(d+=" This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.");const u=n.learned?.updates??{},b=Object.values(u).reduce((h,w)=>h+w,0),p=Xu.reduce((h,w)=>h+(u[w]??0),0);b&&p===b&&(d+=" All of it was learned in dry run, while Radiate watched the heating without running it."),a("sure","How sure",d);let f="Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";const y=n.warm_up;if(y&&t.minute_of_day!=null){const h=y.min==null||y.min<60?y.min:Math.round(y.min/5)*5,w=co((t.minute_of_day+y.in_min)%1440),g=y.quiet_until_min??null,$=g==null?null:(g-t.minute_of_day+1440)%1440,R=g==null?"as early as it can":`as soon as quiet hours end at ${co(g)}`;if(y.min==null)f+=` It can't tell yet how long this room takes to reach ${Rt(y.to_c)} by ${w}, so it starts ${R}.`;else if(y.min>Gu)f+=` To get from ${Rt(y.from_c)} to ${Rt(y.to_c)} by ${w}, it reckons this room needs about ${mr(h)}, longer than it looks ahead, so it starts ${R}.`;else{const E=y.in_min-h,P=E<=0?"now":`at about ${co((t.minute_of_day+E)%1440)}`;if(f+=` To get from ${Rt(y.from_c)} to ${Rt(y.to_c)} by ${w}, it allows about ${mr(h)}, so it `,g!=null&&E<$){const Z=$+h>y.in_min?`, and may get there after ${w}`:"";f+=`would start ${P}. Quiet hours hold it until ${co(g)}, so it starts then${Z}.`}else f+=`starts warming ${P}.`}}n.lockshield!=null&&(f+=n.lockshield_learned===!1?` Between burns, the valve's opening limit rests at ${n.lockshield}% until Radiate has seen enough burns to set it.`:` Between burns, the valve's opening limit rests at ${n.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`),a("uses","Used for",f),n.relearns>0&&a("relearned","Relearned",`Radiate relearned this room ${Zu(n.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);for(const h of t.notes??[]){const w=new Date(h.at*1e3),g=`${w.getDate()} ${gi[w.getMonth()]}`,$=h.code==="learning.reset"||h.code==="learning.invalidated"?"Started again":"Carried over";a(`note-${h.at}`,$,`${g}. ${h.message}`)}return o}function nh(e){return`In the model's own terms: heating gain ${e.a.toFixed(2)} K/h, loss rate ${e.b.toFixed(3)} per hour per degree, other heat ${e.d.toFixed(2)} K/h, arrival lag ${Math.round(e.arrival_lag_min)} min, confidence ${Math.round(e.confidence*100)}%.`}const ct=e=>document.getElementById(e),yi="–",ba=50,oh={"radiate.security.login":"Signed in","radiate.security.login.failed":"Sign-in refused","radiate.security.logout":"Signed out","radiate.security.session.ended":"Session ended","radiate.security.request.refused":"Request refused","radiate.security.access.denied":"Not allowed","radiate.security.lockout.started":"Sign-in locked","radiate.security.lockout.ended":"Sign-in unlocked","radiate.security.user.changed":"User changed","radiate.security.config.changed":"Changed","radiate.security.control.used":"Control used","radiate.security.login.config":"Started"},ah={password:"password",oidc:"single sign-on",saml:"SAML",token:"API token",ingress:"Home Assistant",cli:"command line",session:"signed in",open:"open server"},sh=e=>oh[e.event]??e.event;function rh(e){const t=e.attributes??{};return e.user?e.user:ah[t["radiate.auth.method"]]??yi}function ih(e,t){const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e*1e3))}function lh(e,t){const n=e.events.length,o=t.outcome==="failure"?"refusals":t.outcome==="success"?"allowed events":"events",a=t.user?` for ${t.user}`:"",s=`Kept for ${e.retention_days} days.`;return n?`The latest ${n===1?"event":`${n} ${o}`}${a}, newest first. ${s}`:`No ${o}${a} yet. ${s}`}function ch({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=!1,s=[],r=null,i=!1;const c={outcome:"",user:""},l=f=>{const y=new URLSearchParams({limit:String(ba)});return c.outcome&&y.set("outcome",c.outcome),c.user&&y.set("user",c.user),f&&y.set("before",String(f)),`audit?${y}`};function d(f){const y=document.createElement("tr");f.outcome==="failure"&&(y.dataset.kind="warn");const h=($,R,E)=>{const P=document.createElement($);return P.textContent=R,E&&(P.className=E),P},w=h("th",ih(f.at));w.scope="row";const g=h("td",sh(f));if(f.outcome==="failure"){const $=document.createElement("wa-badge");$.textContent="Refused",$.setAttribute("variant","warning"),$.setAttribute("appearance","filled-outlined"),g.append(" ",$)}return y.append(w,g,h("td",rh(f)),h("td",f.source??yi),h("td",f.message,"sl-detail")),y}function u(f){const y=ct("security-user"),h=["",...f],w=[...y.options].map(g=>g.value);h.join(`
`)!==w.join(`
`)&&(y.replaceChildren(...h.map(g=>{const $=document.createElement("option");return $.value=g,$.textContent=g||"Everyone",$})),y.value=h.includes(c.user)?c.user:"")}function b(){r&&(u(r.users??[]),ct("security-summary").textContent=lh({...r,events:s},c),ct("security-body").replaceChildren(...s.map(d)),ct("security-table").hidden=!s.length,ct("security-more").hidden=!i)}async function p(f=!1){const y=f&&s.length?s.at(-1).id:null;try{const h=await e.get(l(y));r=h,s=f?[...s,...h.events]:h.events,i=h.events.length===ba,ct("security-error").hidden=!0,b()}catch(h){if(t(h)){n();return}ct("security-error").hidden=!1}}return ct("security-outcome").addEventListener("change",f=>{const y=f.target.value==="all"?"":f.target.value;y!==c.outcome&&(c.outcome=y,p())}),ct("security-user").addEventListener("change",f=>{c.user=f.target.value,p()}),ct("security-more").addEventListener("click",()=>p(!0)),ct("security-refresh").addEventListener("click",()=>p()),{async available(){try{r=await e.get(l()),s=r.events,i=s.length===ba,a=!0}catch{a=!1}return ct("s-security-log").hidden=!a,a&&b(),a},get offered(){return a},show(){o=!0,a&&p()},hide(){o=!1},get open(){return o}}}const fo=e=>new URL(`api/v1/${e}`,document.baseURI).toString(),C=e=>document.getElementById(e),Mt=e=>e==null?"–":`${e.toFixed(1)}°`,Eo=e=>`${Math.max(0,Math.round(e/60))} min`,Yo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,xt=(e,t,n)=>`${e} ${e===1?t:n}`,cn=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,Ao=e=>{if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`},Go=matchMedia("(prefers-reduced-motion: reduce)"),Vt=new Map;let we=null,Ia=null,ft=null;class Ue extends Error{}const Ha="radiate.token";function dh(){try{return localStorage.getItem(Ha)||""}catch{return""}}function uh(e){try{e?localStorage.setItem(Ha,e):localStorage.removeItem(Ha)}catch{}}function hh(){let e=dh(),t="",n=null,o=null,a=2e3,s=null,r=null;const i=(d={},u="GET")=>{const b=e?{...d,Authorization:`Bearer ${e}`}:{...d};return t&&u!=="GET"&&u!=="HEAD"&&(b["X-CSRF-Token"]=t),b},c=async(d,u={})=>{const b=await fetch(fo(d),{...u,headers:i(u.headers,u.method)});if(b.status===401)throw new Ue(d);if(!b.ok)throw new Error(`${d}: HTTP ${b.status} ${await b.text()}`);return b},l=()=>{o=null;const d=new URL(fo("stream"));d.protocol=d.protocol==="https:"?"wss:":"ws:";try{n=new WebSocket(d)}catch{n=null,r("lost"),o=setTimeout(l,a);return}const u=n;u.onopen=()=>{e&&u.send(JSON.stringify({token:e}))},u.onmessage=b=>{a=2e3,r("live"),s(JSON.parse(b.data))},u.onclose=b=>{if(n===u&&(n=null),b.code===4401){r("auth");return}r("lost"),o=setTimeout(l,a),a=Math.min(a*2,15e3)},u.onerror=()=>u.close()};return{hasToken:()=>!!e,setCsrf(d){t=d||""},setToken(d){e=d,uh(d)},house:async()=>(await c("house")).json(),state:async()=>(await c("state")).json(),get:async d=>(await c(d)).json(),text:async d=>(await c(d)).text(),async post(d,u){await c(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)})},async call(d,u,b){const p={method:d,headers:i(b===void 0?{}:{"Content-Type":"application/json"},d)};b!==void 0&&(p.body=JSON.stringify(b));const f=await fetch(fo(u),p);if(f.status===401)throw new Ue(u);const y=await f.text();let h=y;try{h=JSON.parse(y)}catch{}return{status:f.status,body:h}},subscribe(d,u){s=d,r=u,!n&&!o&&l()}}}const Ce=document.documentElement.dataset.transport==="demo"?(await Qi(async()=>{const{createDemoTransport:e}=await import("./demo.js");return{createDemoTransport:e}},[],import.meta.url)).createDemoTransport():hh();async function qn(e,t){try{await Ce.post(e,t)}catch(n){throw n instanceof Ue?rt():console.error(n),n}}const Xo=(e,t,n,o,a)=>Ku(e,t,{send:()=>qn(n,o),paint:a,refresh:Vn});function vi(e,t){e.hidden=!t,e.textContent=t}const Ba={viewer:0,household:1,admin:2};let To="admin";const Fa=e=>(Ba[To]??-1)>=Ba[e],Un=e=>Fa(e)?"":To==="household"?"Ask an admin":"Read only";function eo(e,t,n){const o=Un(n);for(const a of e)a&&(a.disabled=!!o,o?a.dataset.locked="":delete a.dataset.locked);return t&&(t.hidden=!o,t.textContent=o),!!o}function ph(){eo([C("mode"),C("demand")],C("controls-lock"),"household"),eo([C("boost")],C("boost-lock"),"household")}const Qo=e=>e.reason_code==="demand.pooled";function ki(e){return e.role==="passive"?["Bypass, not controlled",""]:e.role==="unheated"?["No radiator",""]:e.fire?e.fire_switch===!1?["Fire detected","fire"]:["Fire lit","fire"]:e.preheating?["Preheating","preheat"]:Qo(e)?["Waiting for a burn","pooled"]:e.calling?["Heating","calling"]:e.topup&&e.extend===!0?["Topping up","extend"]:e.topup&&e.extend===!1?["Heat sink","sink"]:e.topup?["Topped up","sink"]:e.temperature!=null&&e.target!=null&&e.temperature>=e.target-.3?["Comfortable","ok"]:["Waiting",""]}const fh={calling:"brand",fire:"brand",extend:"brand",preheat:"warning",pooled:"warning",back:"warning",stale:"warning",ok:"success",sink:"cool",away:"cool"};function Ro(e,t){const n=fh[t]??"neutral";return n==="cool"?J`<wa-badge class="radiate-cool" appearance="filled-outlined">${e}</wa-badge>`:J`<wa-badge variant=${n} appearance=${n==="neutral"?"outlined":"filled-outlined"}>${e}</wa-badge>`}const mh={fire:"Paused while the fire warms the room",fire_holdoff:"Paused until the room cools after the fire",window:"Paused while a window is open",shower:"Paused after a shower",cooker_spike:"Paused while cooking warms the room",unexplained_heat:"Paused: extra heat from somewhere, the sun or guests perhaps",store_recovery:"Paused while the boiler heats the hot water",heat_unknown:"Paused until the boiler's state is known",setpoint_change:"Waiting for the room to settle at its new temperature",no_data:"Waiting for enough readings",trv_offline:"Waiting for the TRV to come back"};function $i(e){if(e.learning)return mh[e.learning]??`Paused: ${e.learning.replaceAll("_"," ")}`;const t=e.model;if(!t.samples)return"Just started, using typical values for now";const n=`${Math.round(t.confidence*100)}% sure`;return bi(t)?`Still learning this room, ${n}`:t.confidence<.75?`Fairly sure of this room, ${n}`:`Sure of this room, ${n}`}const ya=new Map;function xi(e){return ya.has(e)||ya.set(e,Jo()),ya.get(e)}const Si=e=>!!(e.fire_switch??e.fire);function gh(e){const t=xi(e.id),n=!t.shown(Si(Vt.get(e.id)??e));Xo(t,n,`rooms/${e.id}/fire`,{lit:n},cs).then(o=>o&&qt(n?`${e.name}: fire lit. Its radiator is closed.`:`${e.name}: fire out.`))}const _i=5,Ci=28,wh=600,bh=5e3,va=new Map;function Gt(e){return va.has(e)||va.set(e,{pending:null,timer:null,expiry:null,error:"",clearing:!1}),va.get(e)}function Zo(e){const t=Gt(e.id);return t.pending!=null?t.pending:e.override?.setpoint!=null&&!t.clearing?e.override.setpoint:e.setpoint??e.target??null}function yh(e,t){const n=Vt.get(e);if(!n||!Number.isFinite(t))return;const o=Gt(e),a=Zo(n)??20,s=Math.min(Ci,Math.max(_i,Math.round(t*2)/2));if(s===a){cs();return}o.pending=s,o.error="",o.clearing=!1,clearTimeout(o.timer),clearTimeout(o.expiry),o.timer=setTimeout(()=>vh(e),wh),gt()}async function vh(e){const t=Gt(e);t.timer=null;const n=t.pending;try{await qn(`rooms/${e}/setpoint`,{setpoint:n})}catch(a){t.pending===n&&(t.pending=null,t.error=no(a)),gt();return}t.expiry=setTimeout(()=>{t.pending===n&&!t.timer&&(t.pending=null,gt())},bh);const o=Vt.get(e);o&&t.pending===n&&qt(`${o.name} held at ${Mt(n)}.`),Vn()}async function kh(e){const t=Gt(e);clearTimeout(t.timer),t.timer=null,t.pending=null,t.error="",t.clearing=!0,gt();try{await qn(`rooms/${e}/setpoint`,{setpoint:null})}catch(o){t.clearing=!1,t.error=no(o),gt();return}const n=Vt.get(e);n&&qt(`${n.name} follows its schedule again.`),Vn()}async function Vn(){try{us(await Ce.state())}catch{}}function $h(e){return e.until==="cleared"?"Held until cleared":e.expires_in_min==null?"Held until the next change":e.until==="duration"?`Held for ${Ao(e.expires_in_min)}`:we?`Held until ${Yo((we.minute_of_day+e.expires_in_min)%1440)}`:"Held until the next change"}const Kn=new Set(["passive","unheated"]);function Ei(e){const t=ft?.rooms?.find(n=>n.id===e.id);return t?t.controllable:!Kn.has(e.role)}function xh(e){const t=Gt(e.id);t.pending!=null&&!t.timer&&e.override?.setpoint===t.pending&&(t.pending=null,clearTimeout(t.expiry)),t.clearing&&!e.override&&(t.clearing=!1)}function Sh(e){let t=e.reason||"";if(Qo(e)&&(t="Waiting to share a burn with other rooms."),!e.calling&&e.topup&&e.extend===!0&&(t="Topped up now so it does not need a second burn soon."),!e.calling&&e.topup&&e.extend===!1&&(t="Opened so the burner's heat has somewhere to go."),!t&&e.role==="passive"&&(t="Manual valve, always open: counted as the system's open path."),!t&&e.role==="unheated"&&(t="No radiator here. Temperature recorded, not controlled."),!t&&e.heat_source==="continuous"&&(t="Range cooker heat is learned as a steady background."),!t&&e.next_setpoint!=null&&e.next_in_min!=null&&we){const n=(we.minute_of_day+e.next_in_min)%1440;t=`Next ${e.next_setpoint.toFixed(1)}° at ${Yo(n)}.`}return t}function _h(e){return e.model?$i(e):e.humidity!=null?`${e.humidity}% RH`:""}function Ch(e){return e.valve?.untrusted?e.valve.leaking?"Valve may not be closing: radiator warmed while shut.":e.valve.misses?`Valve may be stuck: radiator stayed cold for ${xt(e.valve.misses,"burn","burns")}.`:"Valve may be stuck: radiator not warming.":""}let Ge=null;const Xt=matchMedia("(min-width: 75rem)"),ea=matchMedia("(max-width: 40rem)"),St=C("room-drawer");let ja=null,ka=null;const Eh=C("toast"),Ah={success:{icon:"circle-check"},neutral:{icon:"circle-info"},warning:{icon:"triangle-exclamation"}};function qt(e,t="success"){try{Eh.create(e,{variant:t,duration:5e3,icon:Ah[t]?.icon})}catch{}}function to(e,t=null){if(Ge=Ge===e?null:e,tn.select(Ge),gt(),!Ge){Xt.matches&&ka?.focus?.(),ka=null;return}if(Xt.matches){ka=t,requestAnimationFrame(()=>C("room-panel").querySelector("h2")?.focus({preventScroll:!0}));const o=C("room-panel"),a=o.getBoundingClientRect().top;(a<0||a>innerHeight-120)&&o.scrollIntoView({block:"nearest",behavior:Go.matches?"auto":"smooth"});return}ja=t,St.placement=ea.matches?"bottom":"end",St.open=!0}function Ai(){Ge&&to(Ge)}St.addEventListener("wa-after-hide",e=>{e.target===St&&(Xt.matches||(Ge=null,tn.select(null),gt(),ja?.focus?.(),ja=null))});Xt.addEventListener("change",()=>{Xt.matches?St.open=!1:Ge&&(St.placement=ea.matches?"bottom":"end",St.open=!0),gt()});ea.addEventListener("change",()=>gt());document.addEventListener("keydown",e=>{e.key==="Escape"&&Ge&&Xt.matches&&!e.defaultPrevented&&C("room-panel").contains(document.activeElement)&&Ai()});function ls(e){const t=new Map;for(const n of e.alert_details??[]){if(!n.room_id)continue;const o=e.rooms.find(s=>s.id===n.room_id);if(!o)continue;const a=n.message.startsWith(`${o.name}: `)?n.message.slice(o.name.length+2):n.message;t.has(o.id)||t.set(o.id,{room:o,texts:[]}),t.get(o.id).texts.push(a)}for(const n of e.rooms)n.temperature==null&&!t.has(n.id)&&t.set(n.id,{room:n,texts:["no reading"]});return[...t.values()]}function wr(e,t){const[n,o]=ki(e),a=Ei(e),s=a?Zo(e):null,r=Kn.has(e.role),i=e.id===Ge,c=a&&(Gt(e.id).pending!=null||e.override?.setpoint!=null&&!Gt(e.id).clearing),l=t.get(e.id);return{r:e,label:n,kind:o,sp:s,observed:r,on:i,held:c,need:l}}function Th(e){const t=new Map(ls(we).map(a=>[a.room.id,a.texts])),n=(a,s)=>to(s,a.currentTarget),o=a=>a.need?J`<wa-icon class="room-flag" name="triangle-exclamation" label="Needs attention: ${a.need.join(", ")}"></wa-icon>`:ve;return ea.matches?J`<ul class="room-list" aria-labelledby="rooms-h">${e.map(a=>{const s=wr(a,t);return J`<li>
        <button type="button" class="room-item" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
          <span class="room-item-top">
            <span class="room-name"><span class="swatch" style="--swatch:${ar(a.temperature)}" aria-hidden="true"></span><strong>${a.name}</strong>${o(s)}</span>
            ${Ro(s.label,s.kind)}
          </span>
          <span class="room-item-facts">
            <span><span class="fact-label">Now</span> <strong class="readout">${Mt(a.temperature)}</strong></span>
            ${s.sp!=null?J`<span><span class="fact-label">${s.held?"Held at":"Set to"}</span> <strong class="readout">${Mt(s.sp)}</strong></span>`:ve}
            ${!s.observed&&a.opening!=null?J`<span><span class="fact-label">Valve</span> <strong class="readout">${a.opening}%</strong></span>`:ve}
          </span>
        </button>
      </li>`})}</ul>`:J`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${e.map(a=>{const s=wr(a,t);return J`<tr class=${s.on?"selected":""} data-idle=${String(!(a.calling||a.topup))} @click=${r=>{r.target.closest("button")||to(a.id,r.currentTarget.querySelector("button"))}}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(s.on)} @click=${r=>n(r,a.id)}>
            <span class="swatch" style="--swatch:${ar(a.temperature)}" aria-hidden="true"></span><span class="room-btn-name">${a.name}</span>${o(s)}</button></th>
          <td class="num readout">${Mt(a.temperature)}</td>
          <td class="num readout">${s.sp==null?J`<span class="wa-color-text-quiet">–</span>`:J`${s.held?J`<wa-icon class="held-icon" name="hand" label="Held"></wa-icon> `:ve}${Mt(s.sp)}`}</td>
          <td>${s.observed||a.opening==null?J`<span class="wa-color-text-quiet">–</span>`:J`
            <span class="valve"><wa-progress-bar value=${a.opening} label="${a.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${a.opening}%</span></span>`}</td>
          <td>${Ro(s.label,s.kind)}</td>
        </tr>`})}</tbody>
    </table>
  </wa-scroller>`}function br(e,t,n){const o=Zo(t);if(yh(t.id,(o??20)+n),!(e.detail>0)||Go.matches)return;e.currentTarget.parentElement.querySelector(".step-value")?.animate([{transform:`translateY(${n>0?6:-6}px)`,opacity:.4},{transform:"translateY(0)",opacity:1}],{duration:180,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}function Rh(e,t,n){return J`<div class="stepper" role="group" aria-label="${e.name} setpoint">
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t<=_i} @click=${o=>br(o,e,-.5)}>
      <wa-icon name="minus" label="Lower ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
    <output class="step-value readout" aria-live="polite" aria-atomic="true">${Mt(t)}</output>
    <wa-button appearance="outlined" class="step" ?disabled=${n||t!=null&&t>=Ci} @click=${o=>br(o,e,.5)}>
      <wa-icon name="plus" label="Raise ${e.name} setpoint by 0.5°"></wa-icon></wa-button>
  </div>`}function yr(e,{inDrawer:t}){const[n,o]=ki(e),a=Ei(e),s=Gt(e.id),r=Un("household"),i=!!r,c=a?Zo(e):null,l=a&&s.pending==null&&!s.clearing&&e.override?.setpoint!=null,d=a&&s.pending!=null,u=Kn.has(e.role),b=!(e.calling||e.topup),p=e.heat_source==="episodic",f=xi(e.id),y=(we?.learning_notes??[]).filter(ne=>ne.room_id===e.id),h=e.model?th(e,{outdoor:we?.outdoor,minute_of_day:we?.minute_of_day,notes:y}):[],w=e.model?bi(e.model):!1,g=Ch(e),$=Sh(e),R=ls(we).find(ne=>ne.room.id===e.id)?.texts.filter(ne=>ne!=="no reading")??[],E=[];e.humidity!=null&&E.push(["Humidity",`${Math.round(e.humidity)}%`]),!a&&e.setpoint!=null&&!u&&E.push(["Setpoint",Mt(e.setpoint)]);const P=_h(e);e.model&&E.push(["Learning",$i(e)]);const Z=s.error?"":l?$h(e.override):d?"Sending…":"From the schedule",Q=a?J`
    <div class="setpoint" data-held=${String(l||d)}>
      <div class="setpoint-row">
        <div class="wa-stack wa-gap-3xs">
          <span class="setpoint-label">Setpoint</span>
          <span class="setpoint-hint" aria-live="polite">${s.error?J`<span class="error-line" role="alert">${s.error}</span>`:Z}</span>
        </div>
        ${Rh(e,c,i)}
      </div>
      <div class="wa-cluster wa-gap-xs">
        ${l&&!i?J`<wa-button size="s" appearance="outlined" @click=${()=>kh(e.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>`:ve}
        ${r?J`<wa-tag size="s" class="lock-tag">${r}</wa-tag>`:ve}
      </div>
    </div>`:ve;return J`
    <div class="room-detail" data-room=${e.id}>
      <div class="room-detail-head">
        <div class="wa-stack wa-gap-2xs">
          ${t?ve:J`<h2 class="wa-heading-l" id="room-panel-h" tabindex="-1">${e.name}</h2>`}
          <div class="wa-cluster wa-gap-xs">
            ${Ro(n,o)}
            ${l?J`<wa-tag size="s" class="radiate-cool">Held</wa-tag>`:ve}
          </div>
        </div>
        ${t?ve:J`<wa-button appearance="plain" size="s" class="panel-close" @click=${Ai}><wa-icon name="xmark" label="Close ${e.name}"></wa-icon></wa-button>`}
      </div>

      ${t?Q:ve}
      ${$?J`<p class="reason">${$}</p>`:ve}

      <div class="readouts">
        <div class="readout-block"><span class="readout-label">Now</span><span class="readout readout-xl">${Mt(e.temperature)}</span></div>
        ${e.target!=null&&!u?J`<div class="readout-block"><span class="readout-label">Target</span><span class="readout readout-l">${Mt(e.target)}</span></div>`:ve}
        ${!u&&e.opening!=null?J`<div class="readout-block"><span class="readout-label">Opening limit</span><span class="readout readout-l">${e.opening}%</span></div>`:ve}
      </div>
      ${!u&&e.opening!=null?J`<wa-progress-bar class="opening" data-idle=${String(b)} value=${e.opening} label="${e.name} opening limit, ${e.opening}%"></wa-progress-bar>`:ve}

      ${R.length?J`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${R.map(ne=>ne[0].toUpperCase()+ne.slice(1)).join(". ")}.</wa-callout>`:ve}
      ${g?J`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${g}</wa-callout>`:ve}

      ${t?ve:Q}

      ${p?J`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${!!f.shown(Si(e))} ?disabled=${i} aria-busy=${String(f.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${()=>gh(e)}>Fire lit</wa-switch>
          ${e.fire&&e.fire_switch===!1&&!f.busy?J`<p class="fire-spotted"><wa-icon name="eye"></wa-icon>Radiate spotted the fire. Switch on to confirm.</p>`:ve}
          <p class="action-error fire-error" role="alert" ?hidden=${!f.error}>${f.error}</p>
        </div>`:ve}

      ${E.length?J`<dl class="facts">${E.map(([ne,T])=>J`<div><dt>${ne}</dt><dd>${T}</dd></div>`)}</dl>`:ve}
      ${!e.model&&P?J`<p class="wa-caption-m wa-color-text-quiet">${P}</p>`:ve}

      ${e.model?J`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${w?J`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>`:ve}</span>
          <div class="wa-stack wa-gap-s">
            ${w?J`<p class="learned-status">${e.model.samples===0?"Still learning. Nothing learned yet, so Radiate uses typical values for now.":"Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>`:ve}
            <dl class="learned-rows">${h.map(ne=>J`<div><dt>${ne.label}</dt><dd>${ne.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${nh(e.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>`:ve}
    </div>`}let vr=!1;function Lh(){we&&(vr||(C("rooms").textContent="",vr=!0),$t(Th(we.rooms),C("rooms")))}function cs(){const e=Ge?Vt.get(Ge):null,t=C("room-panel"),n=C("hm-status"),o=!!(e&&Xt.matches);if(t.hidden===o){t.hidden=!o,n.hidden=o;const a=o?t:n;Go.matches||a.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:200,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}if($t(o?yr(e,{inDrawer:!1}):ve,t),Xt.matches){$t(ve,St);return}St.label=e?.name??"Room",$t(e?yr(e,{inDrawer:!0}):ve,St)}const Ti={ok:{icon:"circle-check",tone:"success"},heat:{icon:"fire-flame-curved",tone:"brand"},attention:{icon:"triangle-exclamation",tone:"warning"},frost:{icon:"snowflake",tone:"cool"},off:{icon:"power-off",tone:"neutral"},quiet:{icon:"moon",tone:"cool"},stale:{icon:"plug-circle-xmark",tone:"warning"},wait:{icon:"hourglass-half",tone:"neutral"}};function Mh(e){const t=e.rooms.filter(s=>!Kn.has(s.role)),n=t.filter(s=>s.calling).length,o=e.telemetry??{};if(ds(e))return["attention","The boiler relay can't be reached"];if((e.alert_details??[]).some(s=>s.code?.startsWith("safe_mode")))return["attention","Safe mode: the boiler is stopping"];if(e.mode==="off")return["off","Heating is off"];if(e.mode==="frost")return["frost","Frost protection only"];if(!o.simulated&&o.boiler_linked===!1)return n?["wait",`${xt(n,"room wants","rooms want")} heat`]:["ok","Rooms are comfortable"];if(e.boiler.state==="firing")return["heat",n?`Heating ${xt(n,"room","rooms")}`:"Burner on"];if(e.boiler.state==="lead")return["heat","Opening valves"];if(e.quiet?.active)return["quiet",`Quiet hours until ${e.quiet.until}`];if(e.boiler.state==="rest")return["ok","Burner resting"];const a=t.filter(Qo).length;return a?["wait",`${xt(a,"room is","rooms are")} waiting for a burn`]:["ok","Rooms are comfortable"]}function Oh(e){let t=null;for(const n of e.rooms)Kn.has(n.role)||n.next_in_min==null||n.next_setpoint==null||(!t||n.next_in_min<t.next_in_min)&&(t=n);return t?Yo((e.minute_of_day+t.next_in_min)%1440):null}function Ri(e,t){const[n,o]=document.body.dataset.link==="stale"?["stale","Showing old data"]:Mh(e),a=Ti[n],s=C("hero");if(s.dataset.tone!==a.tone){const y=s.dataset.tone;s.dataset.tone=a.tone,y&&!Go.matches&&s.querySelector(".hero-icon").animate([{transform:"scale(0.85)",opacity:.4},{transform:"scale(1)",opacity:1}],{duration:240,easing:"cubic-bezier(0.23, 1, 0.32, 1)"})}C("hero-icon").name=a.icon,C("hero-title").textContent=o,C("hero-why").textContent=t;const r=[];e.outdoor!=null&&r.push(["temperature-half",`Outside ${e.outdoor.toFixed(1)}°`]),r.push(["faucet-drip",e.store?.boost?"Hot water boosted":e.store?.relay?"Hot water on":"Hot water off"]);const i=Oh(e);i&&r.push(["clock",`Next change ${i}`]),$t(J`${r.map(([y,h])=>J`<li><wa-icon name=${y}></wa-icon>${h}</li>`)}`,C("hero-facts"));const c=ls(e),l=new Map;for(const y of c)for(const h of y.texts)l.set(h,(l.get(h)??0)+1);const d=new Set([...l].filter(([,y])=>y>=3).map(([y])=>y)),u=[];for(const y of d)u.push(J`<li><a class="need-chip" href="#devices"><strong>${y[0].toUpperCase()+y.slice(1)}</strong><span>${xt(l.get(y),"room","rooms")}</span></a></li>`);for(const y of c){const h=y.texts.filter(w=>!d.has(w));h.length&&u.push(J`<li><button type="button" class="need-chip" @click=${w=>to(y.room.id,w.currentTarget)}>
      <strong>${y.room.name}</strong><span>${h.join(", ")}</span></button></li>`)}const b=Nh(e),p=Oo===!0;for(const y of b.slice(0,kr)){const h=y.message.indexOf(": "),[w,g]=h>0?[y.message.slice(0,h),y.message.slice(h+2)]:[y.message,""],$=p&&(!y.code||Bi.test(y.code))?"#devices":"#guide/alerts";u.push(J`<li><a class="need-chip" href=${$}><strong>${w}</strong>${g?J`<span>${g}</span>`:ve}</a></li>`)}const f=b.length-kr;f>0&&u.push(J`<li><a class="need-chip need-more" href=${p?"#devices":"#guide/alerts"}><strong>${f} more ${f===1?"alert":"alerts"}</strong></a></li>`),C("hero-needs").hidden=!u.length,$t(J`${u}`,C("hero-needs-list")),ta(e)}function Nh(e){return e.alert_details?e.alert_details.filter(t=>!t.room_id||!e.rooms.some(n=>n.id===t.room_id)):(e.alerts??[]).map(t=>({code:null,message:t}))}const kr=2,zh={auto:"Auto",frost:"Frost",off:"Off"};function ta(e){const t=Rn.shown(e.mode),n=[zh[t]??t],o=e.settings?.demand_mode;Ua[o]&&n.push(pn.shown(o)==="comfort"?"Comfort":"Eco"),n.push(Ln.shown(e.store?.boost)?"hot water boosted":e.store?.relay?"hot water on":"hot water off"),C("hero-summary-text").textContent=n.join(", ")}function Li(e){C("hero-summary").setAttribute("aria-expanded",String(e)),C("hero-summary-act").textContent=e?"Done":"Change",C("hero").dataset.controls=e?"open":"closed"}C("hero-summary").addEventListener("click",()=>Li(C("hero-summary").getAttribute("aria-expanded")!=="true"));Li(!1);function gt(){Lh(),cs()}const $r=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],Ph=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],mo=e=>Date.UTC(+e.slice(0,4),+e.slice(5,7)-1,+e.slice(8,10))/864e5;function Mi(e,t){const n=t?mo(e)-mo(t):null,o=new Date(mo(e)*864e5).getUTCDay();return n===0?"today":n===1?"tomorrow":n===-1?"yesterday":n!==null&&n>1&&n<7?$r[o]:`${$r[o].slice(0,3)} ${+e.slice(8,10)} ${Ph[+e.slice(5,7)-1]}`}function Lo(e,t){const n=e.slice(11,16),o=Mi(e.slice(0,10),t);return n==="00:00"?o:o==="today"?n:`${o} ${n}`}function xr(e,t){return e.slice(0,10)===t?e.slice(11,16):Lo(e,t)}function Dh(e,t){const n=e.slice(11,16),o=Mi(e.slice(0,10),t),a=o==="tomorrow"||o==="yesterday"?o:`on ${o}`;return o==="today"?`at ${n}`:n==="00:00"?a:`${a} at ${n}`}function qh(e,t){const n=t.today;if(e.away&&e.reason==="away_until")return[`Away until ${Lo(e.until,n)}.`,"Away","away"];if(e.away)return[`Away since ${xr(e.presence.since,n)}, from Home Assistant.`,"Away","away"];if(e.until){const o=Lo(e.until,n);return[`Due back ${/^\d/.test(o)?"at ":""}${o}. Warming up their rooms.`,"Due back","back"]}if(e.presence?.uncertain&&e.presence.why){const o=e.presence.uncertain==="evidence_old"?"No update":"Home";return[e.presence.why,o,e.presence.uncertain==="evidence_old"?"stale":""]}if(e.presence?.stale){const o=ft?.household?.away?.presence_stale_after_min;return[`Home Assistant hasn't reported${o?` for over ${Ao(o)}`:" lately"}, so Radiate treats them as home.`,"No update","stale"]}if(e.presence?.state==="not_home"){const o=t.presence_delay_min,a=o!=null?` Counts as away after ${Ao(o)}.`:"";return[`Out since ${xr(e.presence.since,n)}.${a}`,"Out",""]}return["Home.","Home",""]}const $a=new Map;function kn(e){return $a.has(e)||$a.set(e,{form:!1,clearing:!1,clearError:"",saving:!1,saveError:""}),$a.get(e)}const Oi=e=>C("people-list").querySelector(`[data-person="${CSS.escape(e)}"]`);function Ih(e){kn(e.id).form=!0,kn(e.id).saveError="",Qt(we?.away);const n=Oi(e.id)?.querySelector("wa-input[name=date]"),o=we?.away?.today;n&&o&&(n.min=o,n.value||(n.value=new Date((mo(o)+1)*864e5).toISOString().slice(0,10))),requestAnimationFrame(()=>n?.focus())}function Wa(e){kn(e.id).form=!1,kn(e.id).saveError="",Qt(we?.away),requestAnimationFrame(()=>Oi(e.id)?.querySelector(".away-open")?.focus())}async function Hh(e,t){e.preventDefault();const n=e.currentTarget,o=n.querySelector("wa-input[name=date]").value,a=n.querySelector("wa-input[name=time]").value;if(!o)return;const s=a?`${o}T${a}`:o,r=kn(t.id);r.saving=!0,r.saveError="",Qt(we?.away);try{await qn(`people/${t.id}/away`,{until:s})}catch(i){r.saving=!1;const c=String(i?.message??"");r.saveError=c.includes("in the future")?"Not saved: pick a time that has not passed.":c.includes("within")?"Not saved: pick a date in the next 60 days.":no(i),Qt(we?.away);return}r.saving=!1;for(const i of n.querySelectorAll("wa-input"))i.value="";qt(`${t.name} is away until ${Lo(s.length>10?s:`${s}T00:00`,we?.away?.today)}.`),Wa(t),Vn()}async function Bh(e){const t=kn(e.id);t.clearing=!0,t.clearError="",Qt(we?.away);try{await qn(`people/${e.id}/home`,{})}catch(n){try{if(!/HTTP 404/.test(String(n?.message)))throw n;await qn(`people/${e.id}/away`,{until:null})}catch(o){t.clearError=no(o)}}t.clearError||qt(`${e.name} is home.`),t.clearing=!1,Qt(we?.away),await Vn()}function Fh(e,t){const n=kn(e.id),o=Un("household");o&&(n.form=!1);const[a,s,r]=qh(e,t);return J`
    <wa-card class="person" data-person=${e.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${e.name}</h3>
        ${Ro(s,r)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${a}</p>
        ${n.form?J`
          <form class="away-form wa-stack wa-gap-s" @submit=${i=>Hh(i,e)} @keydown=${i=>{i.key==="Escape"&&Wa(e)}}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${n.saving} ?disabled=${n.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${()=>Wa(e)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!n.saveError}>${n.saveError}</p>
          </form>`:J`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${!!o}
              aria-label=${e.until?`Change when ${e.name} is back`:`Set ${e.name} away`}
              @click=${()=>Ih(e)}>${e.until?"Change":"Set away"}</wa-button>
            ${!o&&(e.until||e.away)?J`<wa-button size="s" appearance="plain" aria-label="${e.name} is back now"
              ?loading=${n.clearing} ?disabled=${n.clearing} @click=${()=>Bh(e)}>Back now</wa-button>`:ve}
            ${o?J`<wa-tag size="s" class="lock-tag">${o}</wa-tag>`:ve}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!n.clearError}>${n.clearError}</p>
      </div>
    </wa-card>`}function Qt(e){const t=e?.people??[];C("people-empty").hidden=t.length>0,C("away-note").hidden=!e?.frost;const n=e?.return,o=C("return-note");if(o.hidden=!n,n){const a=t.filter(i=>i.until&&i.until.slice(0,16)===n.at.slice(0,16)),s=a.length?a:t.filter(i=>i.until),r=s.length?`${cn(s.map(i=>i.name))}'s return`:"a return";o.textContent=`Warming up for ${r} ${Dh(n.at,e.today)}.`}$t(J`${t.map(a=>Fh(a,e))}`,C("people-list")),document.body.dataset.view==="schedules"&&Ki.show()}const jh={show(){},hide(){}},Ni=600*1e3,tn=Tu({modelEl:C("hm-model"),statusEl:C("hm-status"),planEl:C("hm-plan"),transport:Ce,arrangeLock:()=>Un("admin"),onSelect:(e,t)=>to(e,t),onWeek:()=>{location.hash="#schedules"}});new MutationObserver(()=>tn.redraw()).observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.fonts?.ready&&document.fonts.ready.then(()=>tn.redraw());const Mo=oi({list:C("week-list"),legendEl:C("week-legend"),frostEl:C("week-frost"),hintEl:C("week-hint")}),ze={key:null,minute:null,at:0,loading:!1,again:!1,gone:!1,shown:!1};let Sr=!1;async function xa(e,t,n){try{return await Ce.call(e,t,n)}catch(o){throw o instanceof Ue&&rt(),o}}const Wh={async household(){const e=await xa("GET","household");if(e.status!==200)throw new Error(`household: HTTP ${e.status}`);return e.body},async preview(e){const t=await xa("POST","household/preview",{household:e});if(t.status!==200)throw new Error(`household/preview: HTTP ${t.status}`);return t.body},save:e=>xa("PUT","household",{household:e}),async saved(e){const t=C("week-saved");t.textContent=e,clearTimeout(t.timer),t.timer=setTimeout(()=>{t.textContent=""},15e3),ze.key=null,await na();try{ft=await Ce.house()}catch{}oa()},time:dn};async function na(){if(!(ze.gone||!Ce.get)){if(ze.loading){ze.again=!0;return}ze.loading=!0,ze.again=!1,ze.at=Date.now();try{const e=await Ce.get("schedules");C("week").hidden=!e.rooms.length,Mo.update(e),tn.week(e),ze.shown=!0,we&&Mo.tick(we.minute_of_day)}catch(e){/HTTP 404|not found/.test(String(e?.message))?ze.gone=!0:e instanceof Ue?rt():ze.at=Date.now()-Ni+3e4}ze.loading=!1,ze.again&&await na()}}function Uh(e){const t=JSON.stringify([e.away?.everyone,(e.away?.people??[]).map(o=>[o.id,o.away])]),n=ze.minute!=null&&e.minute_of_day<ze.minute;ze.minute=e.minute_of_day,t!==ze.key||n||Date.now()-ze.at>Ni?(ze.key=t,na()):ze.shown&&Mo.tick(e.minute_of_day)}function _r(e,t,n){e.textContent="";for(const[o,a]of t){const s=Math.max(0,(o+n)/n)*100,r=Math.max(0,(a+n)/n)*100;if(r<=0)continue;const i=document.createElement("i");i.style.left=`${s}%`,i.style.width=`${Math.max(.3,r-s)}%`,e.appendChild(i)}}function ds(e){return!e.telemetry?.simulated&&(e.alert_details??[]).some(t=>t.code==="driver.shelly")}const Vh={idle:["Idle","neutral"],lead:["Opening valves","warning"],firing:["Firing","brand"],rest:["Resting","cool"]};function us(e){we=e,document.body.dataset.link==="stale"&&qt("Connected to Radiate again."),delete document.body.dataset.link;const t=e.boiler,n=t.state==="firing",o=ft?.boiler.min_burn_s??480,a=t.min_off_s??ft?.boiler.min_off_s??600,s=Kh(e,o);C("status").textContent=s,C("outdoor").textContent=e.outdoor!=null?`Outside ${e.outdoor.toFixed(1)}°`:"",Pi(e.mode),zi(e.settings);const r=C("boiler-chip"),i=ds(e),[c,l]=i?["Not reachable","warning"]:Vh[t.state]??["–","neutral"];r.textContent=c,r.dataset.state=i?"lost":t.state,r.classList.toggle("radiate-cool",l==="cool"),l==="cool"?r.removeAttribute("variant"):r.variant=l;let d=0;n&&(d=Math.min(1,t.burn_elapsed_s/o)),t.state==="rest"&&(d=Math.min(1,t.state_elapsed_s/a));const u=C("guard");u.value=Math.round(d*100),u.dataset.kind=t.state,u.label=n?"Minimum burn":t.state==="rest"?"Minimum off":"Minimum burn or rest",C("guard-row").hidden=!(n||t.state==="rest"),C("boiler-detail").textContent=n?t.burn_elapsed_s<o?`Minimum burn: ${Eo(o-t.burn_elapsed_s)} to go`:"Minimum burn met":t.state==="rest"?`${Eo(Math.max(0,a-t.state_elapsed_s))} until it may start again`:"",Di(e.store.boost),_r(document.querySelector(".lane.burns"),e.timeline.burns,e.timeline.window_s),_r(document.querySelector(".lane.store"),e.timeline.store,e.timeline.window_s),C("s-starts").textContent=`${t.starts_last_hour}`,C("s-pred").textContent=t.predicted_burn_min?`${t.predicted_burn_min} min`:"–",Jh(e),i&&(C("s-today-sub").textContent="Not counted while the relay can't be reached"),C("s-supply").textContent=t.supply!=null?t.supply.toFixed(2):"–",Yh(t);const b=C("banner");e.telemetry?.simulated&&(b.hidden=!1,$t(J`Demo: simulated reference house, ${Yo(e.minute_of_day)} simulated time.<span class="note-long"> Boiler water ${e.telemetry.boiler_water_c}°, store ${e.telemetry.store_c}°, stairs ${e.telemetry.stairs_c}°.</span>`,C("banner-text"))),Xh(e.telemetry),Gh(e.learning_notes),Qt(e.away),Vt.clear();for(const p of e.rooms)Vt.set(p.id,p),xh(p);Ge&&!Vt.has(Ge)&&(Ge=null),gt(),Ri(e,s),Fi(e.alert_details),tn.update(e),Uh(e),Ia=new Date,ft||ep()}function Kh(e,t){const n=e.boiler,o=e.rooms.filter(u=>!Kn.has(u.role)),a=o.filter(u=>u.calling).map(u=>u.name),s=o.filter(u=>!u.calling&&u.topup&&u.extend===!0).map(u=>u.name),r=o.filter(u=>!u.calling&&u.topup&&u.extend!==!0).map(u=>u.name),i=o.filter(Qo).map(u=>u.name),c=e.store?.relay?" Hot water on.":"";if(e.telemetry&&!e.telemetry.simulated&&e.telemetry.boiler_linked===!1)return a.length?`${cn(a)} ${a.length===1?"wants":"want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:"No room needs heat. The boiler switch isn't linked yet.";if(ds(e))return"Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";const l=`Burner on for ${Eo(n.burn_elapsed_s)}`,d=u=>`topping up ${cn(u)} to save a second burn soon`;switch(n.state){case"idle":if(i.length){const u=i.length===1?"is":"are";return`Boiler idle. ${cn(i)} ${u} waiting to share a burn with other rooms.${c}`}return e.quiet?.active?`Quiet hours until ${e.quiet.until}. Heating only to keep rooms above 12°.${c}`:c?`Heating idle.${c}`:"Boiler idle. Rooms are within comfort.";case"lead":return`Opening valves before calling the burner.${a.length?` Heating ${cn(a)}.`:""}${c}`;case"rest":return`Burner resting: minimum off time, ${Eo(n.state_elapsed_s)} so far.${c}`;case"firing":if(a.length){const u=s.length?` Also ${d(s)}.`:"";return`${l}. Heating ${cn(a)}.${u}${c}`}if(s.length)return`${l}, ${d(s)}.${c}`;if(n.burn_elapsed_s<t){const u=r.length?`, with the heat going to ${cn(r)}`:"";return`${l} to finish its minimum burn${u}.${c}`}return`${l}. Stopping now that rooms are warm.${c}`;default:return""}}function Jh(e){const t=e.accounting?.today,n=e.accounting?.yesterday,o=C("s-today-label");if(t){o.textContent="Burner today",C("s-today").textContent=t.burner_hours!=null?`${t.burner_hours.toFixed(1)} h`:"–";const r=[];t.starts!=null&&r.push(xt(t.starts,"start","starts")),t.litres!=null&&r.push(`${t.litres.toFixed(1)} L`),t.kwh!=null&&r.push(`${Math.round(t.kwh)} kWh`),C("s-today-sub").textContent=r.join(", ")}else{o.textContent="Burner hours";const r=e.telemetry?.burner_hours;C("s-today").textContent=r!=null?r.toFixed(1):"–",C("s-today-sub").textContent=""}const a=n?.balance;C("s-balance").textContent=a?.score!=null?`${Math.round(a.score)}/100`:"–";let s="No full day yet";n&&(s=a?.score!=null?"":"No burns with two or more rooms"),a?.arrival_spread_min!=null&&(s=`Last room ${Math.round(a.arrival_spread_min)} min after the first`),n?.partial&&(s="Not a full day of data"),C("s-balance-sub").textContent=s}function Yh(e){const t=e.short_cycle,n=C("short-cycle");if(n.hidden=!t,!t)return;const o=e.min_off_s!=null?`${Math.round(e.min_off_s/60)} min`:null,a=o?`Minimum off raised to ${o}`:`Minimum off raised by ${t.extra_off_min} min`,s=t.ends_in_h!=null?` for the next ${Ao(Math.max(1,Math.round(t.ends_in_h*60)))}`:"";C("short-cycle-text").textContent=`${a}${s}, so the burner starts less often.`}const Ua={eco:"fewer, longer burns. Rooms might warm a bit later.",comfort:"every room held at its target, with more burns."},pn=Jo();function zi(e){const t=C("demand"),n=C("demand-note"),o=e&&Ua[e.demand_mode];if(t.hidden=!o,we&&ta(we),!o)return;const a=pn.shown(e.demand_mode);t.value!==a&&(t.value=a),t.setAttribute("aria-busy",String(pn.busy));const s=Ua[a];n.dataset.error=String(!!pn.error),n.textContent=pn.error||(a===e.demand_mode_default?`Default: ${s}`:s[0].toUpperCase()+s.slice(1))}C("demand").addEventListener("change",e=>{const t=we?.settings,n=e.target.value;!t||n===pn.shown(t.demand_mode)||Xo(pn,n,"settings",{demand_mode:n===t.demand_mode_default?null:n},()=>{we?.settings&&zi(we.settings)}).then(o=>o&&qt(n==="eco"?"Eco: fewer, longer burns.":"Comfort: every room held at its target."))});let Cr="";function Gh(e=[]){const t=JSON.stringify(e);if(t===Cr)return;Cr=t;const n=C("learning-notes");if(n.hidden=!e.length,n.hidden)return;const o=new Set(e.filter(a=>a.room_id).map(a=>a.room_id)).size;C("learning-notes-lead").textContent=o?`${xt(o,"room's learning was","rooms' learning was")} reset recently. Those rooms learn again from their next burns.`:"Radiate changed what it had learned when it last started.",$t(J`${[...e].reverse().map(a=>J`<li><span class="payload">${new Date(a.at*1e3).toLocaleString(void 0,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span> <span>${a.message}</span></li>`)}`,n.querySelector("ul"))}let Er="";function Xh(e){const t=C("dryrun");if(t.hidden=!e?.dry_run,t.hidden)return;const n=e.intended_writes??0,o=e.shelly_intended,a=o!=null?`${xt(n,"valve write","valve writes")} and ${xt(o,"boiler command","boiler commands")}`:xt(n,"valve write","valve writes");C("dryrun-count").textContent=n||o?`Held back so far: ${a}.`:"Nothing held back yet.";const s=e.recent_intended??[],r=JSON.stringify(s);if(r===Er)return;Er=r;const i=C("dryrun-recent");i.hidden=!s.length,$t(J`${[...s].reverse().map(c=>J`<li><code>${c.topic}</code> <code class="payload">${typeof c.payload=="string"?c.payload:JSON.stringify(c.payload)}</code></li>`)}`,i.querySelector("ul"))}const Rn=Jo();function Pi(e){const t=C("mode"),n=Rn.shown(e);t.value!==n&&(t.value=n),t.setAttribute("aria-busy",String(Rn.busy)),vi(C("mode-error"),Rn.error),we&&ta(we)}C("mode").addEventListener("change",e=>{const t=e.target.value;!we||t===Rn.shown(we.mode)||Xo(Rn,t,"mode",{mode:t},()=>we&&Pi(we.mode)).then(n=>n&&qt({auto:"Heating: Auto. Rooms follow their schedules.",frost:"Heating: Frost protection only.",off:"Heating off. Rooms are still kept above frost."}[t]))});const Ln=Jo();function Di(e){const t=C("boost"),n=!!Ln.shown(e);t.checked!==n&&(t.checked=n),t.setAttribute("aria-busy",String(Ln.busy)),vi(C("boost-error"),Ln.error),we&&ta(we)}C("boost").addEventListener("change",()=>{if(!we)return;const e=!Ln.shown(we.store.boost);Xo(Ln,e,"store/boost",{minutes:e?60:0},()=>we&&Di(we.store.boost)).then(t=>t&&qt(e?"Hot water on for 60 minutes.":"Hot water boost stopped."))});function Qh(){if(!we){C("status").textContent="Cannot reach Radiate. Retrying…",C("hero-title").textContent="Cannot reach Radiate",C("hero-why").textContent="Retrying…",C("hero").dataset.tone="warning",C("hero-icon").name=Ti.stale.icon;return}document.body.dataset.link="stale";const e=`${String(Ia.getHours()).padStart(2,"0")}:${String(Ia.getMinutes()).padStart(2,"0")}`;C("status").textContent=`Cannot reach Radiate. Retrying… Showing data from ${e}.`,Ri(we,C("status").textContent)}async function qi(){try{return us(await Ce.state()),!0}catch(e){return e instanceof Ue?rt():Qh(),!1}}function Zh(e){e==="lost"?qi():e==="auth"&&rt()}let Sa=!1;async function ep(){if(!Sa){Sa=!0;try{ft=await Ce.house(),oa()}catch{}Sa=!1}}let Gn=null,Yn=null;const Ii=pd({transport:Ce,onOpen(){for(const e of document.querySelectorAll("main > .view, main > section[aria-labelledby]"))e.id!=="setup"&&(e.hidden=!0);document.body.dataset.setup="open",window.scrollTo(0,0)},onClose(){delete document.body.dataset.setup,$n(!1),Yn&&!Yn.closest("[hidden]")&&Yn.focus(),Yn=null},async onSaved(e){delete document.body.dataset.setup,$n(!1);const t=C("setup-saved");t.textContent=e,t.hidden=!1,t.focus(),clearTimeout(t.timer),t.timer=setTimeout(()=>{t.hidden=!0},15e3),ze.key=null;try{ft=await Ce.house()}catch{}oa(),Vn(),hs.refresh()}});async function oa(){Gn??=Ii.available();const e=await Gn;e===null&&(Gn=null);const t=!!ft?.household;C("setup-cta").hidden=!e||t,C("setup-change-row").hidden=!e||!t,eo([C("setup-start")],C("setup-start-lock"),"admin"),eo([C("setup-change")],C("setup-change-lock"),"admin");const n=C("week-lock");n.hidden=!e||Fa("household"),n.textContent=Un("household"),e&&!Sr&&Fa("household")&&(Sr=!0,Mo.setEditor(Wh),ze.key=null,na())}async function aa(e){Yn=e.currentTarget;try{await Ii.open()}catch(t){if(t instanceof Ue){rt();return}const n=C("setup-saved");n.textContent="Couldn't open the household setup. Try again in a moment.",n.hidden=!1}}C("setup-start").addEventListener("click",aa);C("setup-change").addEventListener("click",aa);const Hi=Sd({transport:Ce,scanLock:()=>Un("admin"),isAuthError:e=>e instanceof Ue,onAuth:()=>rt()});let Oo=null;const Bi=/^(device\.|driver\.trv_offline$|driver\.shelly$)/;function Fi(e){const t=(e??[]).filter(a=>Bi.test(a.code)).length;tn.devices(t);const n=C("devices-count");n.hidden=!t,n.textContent=String(t);const o=document.querySelector('.view-tab[data-view="devices"]');t?o.setAttribute("aria-label",`Devices, ${t} ${t===1?"needs":"need"} attention`):o.removeAttribute("aria-label")}const ji=zd({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onCount:tp});let Va=null;function tp(e){const t=C("suggestions-count");t.hidden=!e,t.textContent=String(e);const n=document.querySelector('.view-tab[data-view="suggestions"]');e?n.setAttribute("aria-label",`Suggestions, ${e} to act on`):n.removeAttribute("aria-label")}let Wi=null;const hs=ou({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onView:e=>{const t=Xd(e);C("savings-line").hidden=!t,C("savings-line-link").textContent!==t&&(C("savings-line-link").textContent=t),Wi=e.status==="unavailable"?e.why:null,np()}});let Ka=null;async function np(){const e=Wi==="no household"&&Gn?await Gn:!1;C("savings-setup-row").hidden=!e,eo([C("savings-setup")],C("savings-setup-lock"),"admin")}C("savings-setup").addEventListener("click",e=>{history.replaceState(null,"","#"),$n(!1),aa(e)});const Ui=Su({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt()});let Ja=null;const No=ch({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt()}),Vi=Mu({root:C("guide")});Ou({note:C("guide-note"),tab:document.querySelector('.view-tab[data-view="guide"]')});const zo=Vu({transport:Ce,isAuthError:e=>e instanceof Ue,onAuth:()=>rt(),onOpenSetup:e=>{history.replaceState(null,"","#"),$n(!1),aa(e)},onShowSchedules:()=>{location.hash="#schedules"},moreSections:()=>No.offered?[{id:"security-log",title:"Security log"}]:[]}),op={show(){zo.show(),No.show()},hide(){zo.hide(),No.hide()}};let Ya=null;const Ki={show(){const e=C("week").hidden&&C("setup-cta").hidden;C("schedules-empty").hidden=!e},hide(){}},Ga={schedules:{offered:()=>!0,module:Ki},people:{offered:()=>!0,module:jh},devices:{offered:()=>Oo===!0,module:Hi},suggestions:{offered:()=>Va===!0,module:ji},savings:{offered:()=>Ka===!0,module:hs},settings:{offered:()=>Ya===!0,module:op},data:{offered:()=>Ja===!0,module:Ui},guide:{offered:()=>!0,module:Vi}};function $n(e){if(document.body.dataset.setup==="open")return;const[t,n]=location.hash.slice(1).split("/"),o=Ga[t]?.offered()?t:"house";for(const a of document.querySelectorAll(".view-tab"))a.dataset.view===o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");C("house").hidden=o!=="house";for(const[a,s]of Object.entries(Ga))C(a).hidden=a!==o,a===o?s.module.show():s.module.hide();document.body.dataset.view=o,document.querySelector("wa-page").dataset.view=o,!(o==="guide"&&Vi.reveal(n))&&(o==="settings"&&zo.reveal(n)||(!e&&o!=="house"&&window.scrollTo(0,0),e&&(window.scrollTo(0,0),C(`${o}-h`)?.focus())))}window.addEventListener("hashchange",()=>$n(!0));document.addEventListener("click",e=>{const t=e.target.closest?.('a[href^="#"]');!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.hash===location.hash&&(t.hash.startsWith("#guide")||t.hash.startsWith("#settings/"))&&(e.preventDefault(),$n(!0))});function ap(){for(const[e,t]of Object.entries(Ga))document.querySelector(`.view-tab[data-view="${e}"]`).hidden=!t.offered()}async function sp(){const[e,t,n,o,a]=await Promise.all([Oo===!0?!0:Hi.available(),Va===!0?!0:ji.available(),Ka===!0?!0:hs.available(),Ya===!0?!0:zo.available(),Ja===!0?!0:Ui.available(),No.available()]);Oo=e,Va=t,Ka=n,Ya=o,Ja=a,ap(),Fi(we?.alert_details),$n(!1)}let go=!1;const ps=()=>new URL("login",document.baseURI).toString();async function rp(){if(document.documentElement.dataset.transport==="demo")return!0;try{const t=await fetch(fo("auth/config"));go=t.ok&&(await t.json()).login===!0}catch{go=!1}if(!go)return!0;let e;try{e=await Ce.get("auth/me")}catch(t){return t instanceof Ue?(window.location.assign(ps()),!1):!0}return e.via==="session"&&ip(e),!0}const Ar={admin:"Admin: you can change anything here.",household:"Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",viewer:"Read only: you can see the house but not change it."};function ip(e){Ce.setCsrf(e.csrf);const t=e.method==="local"?"a password":"single sign-on";C("account-name").textContent=e.user,C("account-who").textContent=`Signed in as ${e.user} with ${t}.`,C("account-role").textContent=Ar[e.role]??Ar.viewer,To=e.role in Ba?e.role:"viewer",document.body.dataset.role=To,ph(),tn.redraw(),gt(),we&&Qt(we.away),C("account").hidden=!1}C("account").addEventListener("wa-select",async e=>{if(e.detail?.item?.value==="sign-out"){C("account-error").hidden=!0;try{await Ce.post("auth/logout",{})}catch(t){if(!(t instanceof Ue)){C("account-error").hidden=!1;return}}window.location.assign(ps())}});async function Ji(){if(sp(),!!await rp()){try{ft=await Ce.house(),oa()}catch(e){if(e instanceof Ue){rt();return}}await qi(),document.body.dataset.auth!=="needed"&&Ce.subscribe(us,Zh)}}function rt(){if(go){window.location.assign(ps());return}if(document.body.dataset.auth==="needed")return;const e=Ce.hasToken();Ce.setToken(""),document.body.dataset.auth="needed",C("signin").hidden=!1,C("status").textContent="Sign in to see the house.";const t=C("signin-error");t.hidden=!e,t.textContent=e?"The saved token was not accepted. Enter it again.":"",requestAnimationFrame(()=>C("signin-token").focus())}C("signin-form").addEventListener("submit",async e=>{e.preventDefault();const t=C("signin-token"),n=C("signin-form").querySelector("wa-button[type=submit]"),o=C("signin-error"),a=String(t.value??"").trim();if(o.hidden=!0,!a)return;n.disabled=!0;const s=/^[\x21-\x7e]+$/.test(a);s&&Ce.setToken(a);try{if(!s)throw new Ue("token");ft=await Ce.house()}catch(r){n.disabled=!1,o.hidden=!1,r instanceof Ue?(Ce.setToken(""),o.textContent="That token was not accepted. Check it and try again."):o.textContent="Cannot reach Radiate. Try again in a moment.",t.select();return}n.disabled=!1,t.value="",C("signin").hidden=!0,delete document.body.dataset.auth,C("status").textContent="Connecting…",await Ji()});await Ji();
