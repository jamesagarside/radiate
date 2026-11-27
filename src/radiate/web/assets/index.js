import{i as Qe,e as _i,a as Ci,A as Ce,t as Ei,E as Ai,_ as b,b as Le,n as R,c as ot,W as xt,H as qn,l as Na,o as We,d as ee,w as ht,L as Lt,f as gt,s as Pn,g as Ao,h as Kt,r as wn,j as yn,v as fr,M as mr,k as Ti,D as Pt}from"./app.js";const Ri="modulepreload",Li=function(e,t){return new URL(e,t).href},ts={},Oi=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let r=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(w=>({status:"fulfilled",value:w}),w=>({status:"rejected",reason:w}))))};const i=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");a=r(n.map(d=>{if(d=Li(d,o),d in ts)return;ts[d]=!0;const u=d.endsWith(".css"),w=u?'[rel="stylesheet"]':"";if(!!o)for(let x=i.length-1;x>=0;x--){const h=i[x];if(h.href===d&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${w}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":Ri,u||(p.as="script"),p.crossOrigin="",p.href=d,c&&p.setAttribute("nonce",c),document.head.appendChild(p),u)return new Promise((x,h)=>{p.addEventListener("load",x),p.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return a.then(r=>{for(const i of r||[])i.status==="rejected"&&s(i.reason);return t().catch(s)})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Mi=(e="768px")=>`
  @media screen and (width < ${e}) {
    [part~='navigation'] {
      display: none;
    }

    :host(:not([disable-navigation-toggle])) slot[name~='navigation-toggle'] {
      display: contents;
    }
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ni=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var zi=Qe`
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
 */function Di(e){return(t,n)=>{const o=typeof t=="function"?t:t[n];Object.assign(o,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let la=class extends Ci{constructor(t){if(super(t),this.it=Ce,t.type!==Ei.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===Ce||t==null)return this._t=void 0,this.it=t;if(t===Ai)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}};la.directiveName="unsafeHTML",la.resultType=1;const qi=_i(la);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function $n(e,t,n){return e?t(e):n?.(e)}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Pi(e,t=document.documentElement){if(!Number.isNaN(Number(e)))return Number(e);if(!window.CSS||!CSS.registerProperty)return typeof e=="string"&&e.endsWith("px")?parseFloat(e):Number(e)||0;const n="--wa-length-resolver";if(!CSS.registerProperty.toString().includes(n))try{CSS.registerProperty({name:n,syntax:"<length>",inherits:!1,initialValue:"0px"})}catch{}const o=t.style.getPropertyValue(n);t.style.setProperty(n,e);const a=getComputedStyle(t)?.getPropertyValue(n);return t.style.setProperty(n,o),a?.endsWith("px")?parseFloat(a):Number(a)||0}function Bi(e){return Number.isNaN(Number(e))?e:`${e}px`}var Ue=class extends xt{constructor(){super(),this.hasSlotController=new qn(this,"navigation-footer","mobile-navigation-footer"),this.headerResizeObserver=this.slotResizeObserver("header"),this.subheaderResizeObserver=this.slotResizeObserver("subheader"),this.bannerResizeObserver=this.slotResizeObserver("banner"),this.footerResizeObserver=this.slotResizeObserver("footer"),this.hasExplicitNavigationToggleSetting=!1,this.handleNavigationToggle=e=>{if(this.view==="desktop"){this.hideNavigation();return}const t=e.composedPath(),n=this.navigationToggleSlot;t.find(o=>o.hasAttribute?.("data-toggle-nav")||o.assignedSlot===n||o===n)&&(e.preventDefault(),this.toggleNavigation())},this.view="desktop",this.navOpen=!1,this.mobileBreakpoint="768px",this.navigationPlacement="start",this.disableNavigationToggle=!1,this.pageResizeObserver=typeof ResizeObserver<"u"?new ResizeObserver(e=>{requestAnimationFrame(()=>{for(const t of e)if(t.contentBoxSize){const o=t.borderBoxSize[0].inlineSize,a=this.view;o>=Pi(this.mobileBreakpoint)?this.view="desktop":this.view="mobile",this.requestUpdate("view",a)}})}):null,this.updateNavigationToggleState=e=>{if(e){const o=e.target.name;if(!["navigation","navigation-header","navigation-footer"].includes(o))return}if(this.hasExplicitNavigationToggleSetting)return;const t=!!this.querySelector(":not([slot='navigation-toggle']) [data-toggle-nav]"),n=!!this.querySelector('[slot="navigation"]')||!!this.querySelector('[slot="navigation-header"]')||!!this.querySelector('[slot="navigation-footer"]');this.disableNavigationToggle=t||!n},this.addEventListener("click",this.handleNavigationToggle)}slotResizeObserver(e){return new ResizeObserver(t=>{requestAnimationFrame(()=>{for(const n of t)if(n.contentBoxSize){const o=n.borderBoxSize[0];this.style.setProperty(`--${e}-height`,`${Math.round(o.blockSize)}px`)}})})}updated(e){e.has("view")&&this.hideNavigation(),super.updated(e)}connectedCallback(){super.connectedCallback(),setTimeout(()=>{requestAnimationFrame(()=>{this.pageResizeObserver?.observe(this),this.headerResizeObserver?.observe(this.header),this.subheaderResizeObserver?.observe(this.subheader),this.bannerResizeObserver?.observe(this.banner),this.footerResizeObserver?.observe(this.footer)})})}visiblePixelsInViewport(e){if(!e)return null;const t=e.clientHeight,n=window.innerHeight,o=e.getBoundingClientRect?.();if(!o)return null;const{top:a,bottom:s}=o;return Math.max(0,a>0?Math.min(t,n-a):Math.min(s,n))}firstUpdated(e){if(!document.getElementById("main-content")){const t=document.createElement("div");t.id="main-content",t.slot="skip-to-content-target",this.prepend(t)}this.hasExplicitNavigationToggleSetting=this.disableNavigationToggle,this.shadowRoot.addEventListener("slotchange",this.updateNavigationToggleState),this.updateNavigationToggleState(),super.firstUpdated(e)}disconnectedCallback(){super.disconnectedCallback(),this.pageResizeObserver?.unobserve(this),this.headerResizeObserver?.unobserve(this.header),this.subheaderResizeObserver?.unobserve(this.subheader),this.footerResizeObserver?.unobserve(this.footer),this.bannerResizeObserver?.unobserve(this.banner)}showNavigation(){this.navOpen=!0}hideNavigation(){this.navOpen=!1}toggleNavigation(){this.navOpen=!this.navOpen}render(){const e=this.view==="mobile"&&(this.hasSlotController.test("navigation-footer")||this.hasSlotController.test("mobile-navigation-footer"));let t=this.nonce||globalThis.litNonce||null;return ee`
      <a href="#main-content" part="skip-to-content" class="wa-visually-hidden">
        <slot name="skip-to-content">Skip to content</slot>
      </a>

      <!-- unsafeHTML needed for SSR until this is solved: https://github.com/lit/lit/issues/4696 -->
      ${qi(`
        <style
          ${t?`nonce="${t}"`:""}
          id="mobile-styles"
        >
          ${Mi(Bi(this.mobileBreakpoint))}
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
                  ${$n(this.view==="desktop",()=>ee`<slot name="navigation-header"><div></div></slot>`,()=>ee`<div></div>`)}
                </slot>
                <slot name="desktop-navigation">
                  ${$n(this.view==="desktop",()=>ee`<slot name="navigation"><div></div></slot>`,()=>ee`<div></div>`)}
                </slot>
                <slot name="desktop-navigation-footer">
                  ${$n(this.view==="desktop",()=>ee`<slot name="navigation-footer"><div></div></slot>`,()=>ee`<div></div>`)}
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
        ?open=${Na(this.navOpen)}
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
          ${$n(this.view==="mobile",()=>ee`<slot name="navigation-header"><div></div></slot>`,()=>ee`<div></div>`)}
        </slot>
        <slot name="mobile-navigation">
          ${$n(this.view==="mobile",()=>ee`<slot name="navigation"><div></div></slot>`,()=>ee`<div></div>`)}
        </slot>

        <slot
          slot=${We(e?"footer":void 0)}
          name="mobile-navigation-footer"
          ?hidden=${!e}
        >
          ${$n(this.view==="mobile",()=>ee`<slot part="navigation-footer" name="navigation-footer"><div></div></slot>`,()=>ee`<div></div>`)}
        </slot>
      </wa-drawer>
    `}};Ue.css=[zi,Ni];b([Le("[part~='header']")],Ue.prototype,"header",2);b([Le("[part~='menu']")],Ue.prototype,"menu",2);b([Le("[part~='main']")],Ue.prototype,"main",2);b([Le("[part~='aside']")],Ue.prototype,"aside",2);b([Le("[part~='subheader']")],Ue.prototype,"subheader",2);b([Le("[part~='footer']")],Ue.prototype,"footer",2);b([Le("[part~='banner']")],Ue.prototype,"banner",2);b([Le("[part~='drawer']")],Ue.prototype,"navigationDrawer",2);b([Le("slot[name~='navigation-toggle']")],Ue.prototype,"navigationToggleSlot",2);b([R({attribute:"view",reflect:!0})],Ue.prototype,"view",2);b([R({reflect:!0})],Ue.prototype,"nonce",2);b([R({attribute:"nav-open",reflect:!0,type:Boolean})],Ue.prototype,"navOpen",2);b([R({attribute:"mobile-breakpoint",type:String})],Ue.prototype,"mobileBreakpoint",2);b([R({attribute:"navigation-placement",reflect:!0})],Ue.prototype,"navigationPlacement",2);b([R({attribute:"disable-navigation-toggle",reflect:!0,type:Boolean})],Ue.prototype,"disableNavigationToggle",2);Ue=b([ot("wa-page")],Ue);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ii=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Hi=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??(this.observer=new ResizeObserver(()=>this.check())),this.observer.observe(this.element);for(const t of e)this.observer.observe(t);this.initialCheckHandle??(this.initialCheckHandle=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()}))}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Fi(e,t){const n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var ca=new Set;function ji(){const e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function Wi(){const e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function jo(e){if(ca.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){const t=ji()+Wi();let n=getComputedStyle(document.documentElement).scrollbarGutter;(!n||n==="auto")&&(n="stable"),t<2&&(n=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",n),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function Wo(e){ca.delete(e),ca.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function Ui(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var za=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Da=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qa=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Pa=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ln=[];function gr(e){co(e),ln.push(e)}function co(e){for(let t=ln.length-1;t>=0;t--)if(ln[t]===e){ln.splice(t,1);break}}function da(e){return ln.length>0&&ln[ln.length-1]===e}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */async function ns(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function Bt(e,t){return new Promise(n=>{const o=new AbortController,{signal:a}=o;if(e.classList.contains(t))return;e.classList.add(t);let s=!1,r=()=>{s||(s=!0,e.classList.remove(t),n(),o.abort())};e.addEventListener("animationend",r,{once:!0,signal:a}),e.addEventListener("animationcancel",r,{once:!0,signal:a}),requestAnimationFrame(()=>{!s&&e.getAnimations().length===0&&r()})})}function os(e){return e=e.toString().toLowerCase(),e.indexOf("ms")>-1?parseFloat(e)||0:e.indexOf("s")>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ut=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.hasSlotController=new qn(this,"footer","header-actions","label"),this.renderedWatcher=new Hi(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.withLabel=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&da(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.drawer.showModal(),jo(this),this.renderedWatcher.start(this.drawer))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),Wo(this),this.removeOpenListeners()}async requestClose(e){const t=new Da({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,Bt(this.drawer,"pulse");return}this.removeOpenListeners(),await Bt(this.drawer,"hide"),this.open=!1,this.drawer.close(),Wo(this),this.renderedWatcher.stop();const n=this.originalTrigger;typeof n?.focus=="function"&&setTimeout(()=>n.focus()),this.dispatchEvent(new qa)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),gr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),co(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&da(this)&&this.requestClose(this.drawer)}handleDialogClick(e){const n=e.target.closest('[data-drawer="close"]');n&&(e.stopPropagation(),this.requestClose(n))}async handleDialogPointerDown(e){e.target===this.drawer&&!Fi(e,this.drawer)&&(this.lightDismiss?this.requestClose(this.drawer):await Bt(this.drawer,"pulse"))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.drawer.open?(this.removeOpenListeners(),this.drawer.close(),Wo(this)):e&&!this.drawer.open&&(this.addOpenListeners(),this.drawer.showModal(),jo(this))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open?(this.open=!0,this.requestClose(this.drawer)):this.open||this.renderedWatcher.stop()}async show(){const e=new za;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),jo(this),this.renderedWatcher.start(this.drawer),requestAnimationFrame(()=>{const t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await Bt(this.drawer,"show"),this.dispatchEvent(new Pa)}render(){const e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter"),n=this.label.length>0||this.hasSlotController.test("label","withLabel");return ee`
      <dialog
        part="dialog"
        aria-labelledby=${We(e&&n?"title":void 0)}
        aria-label=${We(!e&&this.label?this.label:void 0)}
        class=${gt({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?ee`
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
    `}};ut.css=Ii;b([Le(".drawer")],ut.prototype,"drawer",2);b([R({type:Boolean,reflect:!0})],ut.prototype,"open",2);b([R({reflect:!0})],ut.prototype,"label",2);b([R({reflect:!0})],ut.prototype,"placement",2);b([R({attribute:"without-header",type:Boolean,reflect:!0})],ut.prototype,"withoutHeader",2);b([R({attribute:"light-dismiss",type:Boolean})],ut.prototype,"lightDismiss",2);b([R({attribute:"with-footer",type:Boolean})],ut.prototype,"withFooter",2);b([R({attribute:"with-label",type:Boolean})],ut.prototype,"withLabel",2);b([ht("open",{waitUntilFirstUpdate:!0})],ut.prototype,"handleOpenChange",1);ut=b([ot("wa-drawer")],ut);document.addEventListener("click",e=>{const t=e.target.closest("[data-drawer]");if(t instanceof Element){const[n,o]=Ui(t.getAttribute("data-drawer")||"");if(n==="open"&&o?.length){const s=t.getRootNode().getElementById(o);s?.localName==="wa-drawer"?s.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Vi=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ki=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<"u"&&"createElement"in document&&(t=Object.assign(document.createElement("input"),{required:!0})),n||(n="value");const o={observedAttributes:["required"],message:t?.validationMessage,checkValidity(a){const s={message:"",isValid:!0,invalidKeys:[]};return(a.required??a.hasAttribute("required"))&&!a[n]&&(s.message=typeof o.message=="function"?o.message(a):o.message||"",s.isValid=!1,s.invalidKeys.push("valueMissing")),s}};return o};let Ji="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",Gi=(e=21)=>{let t="",n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=Ji[n[e]&63];return t};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function as(e,t,n){const o=a=>Object.is(a,-0)?0:a;return e<t?o(t):e>n?o(n):o(e)}function br(e=""){return`${e}${Gi()}`}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ve=class extends Kt{constructor(){super(),this.hasSlotController=new qn(this,"hint","label"),this.label="",this.hint="",this.name=null,this.disabled=!1,this.orientation="vertical",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{const t=e.target.closest("wa-radio");if(!t||t.disabled||t.forceDisabled||this.disabled)return;const n=this.value;this.value=t.value,t.checked=!0;const o=this.getAllRadios();for(const a of o)t!==a&&(a.checked=!1,a.setAttribute("tabindex","-1"));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})},this.addEventListener("keydown",this.handleKeyDown),this.addEventListener("click",this.handleRadioClick)}static get validators(){const e=[Ki({validationElement:Object.assign(document.createElement("input"),{required:!0,type:"radio",name:br("__wa-radio")})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e=="number"&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){yn(this.localName,this.size)}get validationTarget(){const e=this.querySelector(":is(wa-radio):not([disabled])");if(e)return e}updated(e){(e.has("disabled")||e.has("size")||e.has("value")||e.has("defaultValue"))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll("wa-radio")]}handleLabelClick(){this.focus()}async syncRadioElements(){const e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute("size",this.size),t.toggleAttribute("data-wa-radio-horizontal",this.orientation!=="vertical"),t.toggleAttribute("data-wa-radio-vertical",this.orientation==="vertical"),t.toggleAttribute("data-wa-radio-first",n===0),t.toggleAttribute("data-wa-radio-inner",n!==0&&n!==e.length-1),t.toggleAttribute("data-wa-radio-last",n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async t=>{await t.updateComplete,!t.disabled&&t.value===this.value?t.checked=!0:t.checked=!1})),this.disabled)e.forEach(t=>{t.tabIndex=-1});else{const t=e.filter(o=>!o.disabled),n=t.find(o=>o.checked);t.length>0&&(n?t.forEach(o=>{o.tabIndex=o.checked?0:-1}):t.forEach((o,a)=>{o.tabIndex=a===0?0:-1})),e.filter(o=>o.disabled).forEach(o=>{o.tabIndex=-1})}}handleKeyDown(e){if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)||this.disabled)return;const t=this.getAllRadios().filter(i=>!i.disabled);if(t.length<=0)return;e.preventDefault();const n=this.value,o=t.find(i=>i.checked)??t[0],a=e.key===" "?0:["ArrowUp","ArrowLeft"].includes(e.key)?-1:1;let s=t.indexOf(o)+a;s||(s=0),s<0&&(s=t.length-1),s>t.length-1&&(s=0);const r=t.some(i=>i.tagName.toLowerCase()==="wa-radio-button");this.getAllRadios().forEach(i=>{i.checked=!1,r||i.setAttribute("tabindex","-1")}),this.value=t[s].value,t[s].checked=!0,r?t[s].shadowRoot.querySelector("button").focus():(t[s].setAttribute("tabindex","0"),t[s].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;const t=this.getAllRadios(),n=t.find(s=>s.checked),o=t.find(s=>!s.disabled),a=n||o;a&&a.focus(e)}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return ee`
      <fieldset
        part="form-control"
        class=${gt({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":n})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${gt({label:!0,"has-label":n})}
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
          class=${gt({"has-slotted":o})}
          aria-hidden=${o?"false":"true"}
          >${this.hint}</slot
        >
      </fieldset>
    `}};Ve.css=[Pn,Ao,Vi];Ve.shadowRootOptions={...Kt.shadowRootOptions,delegatesFocus:!0};b([Le("slot:not([name])")],Ve.prototype,"defaultSlot",2);b([R()],Ve.prototype,"label",2);b([R({attribute:"hint"})],Ve.prototype,"hint",2);b([R({reflect:!0})],Ve.prototype,"name",2);b([R({type:Boolean,reflect:!0})],Ve.prototype,"disabled",2);b([R({reflect:!0})],Ve.prototype,"orientation",2);b([wn()],Ve.prototype,"value",1);b([R({attribute:"value",reflect:!0})],Ve.prototype,"defaultValue",2);b([R({reflect:!0})],Ve.prototype,"size",2);b([ht("size")],Ve.prototype,"handleSizeChange",1);b([R({type:Boolean,reflect:!0})],Ve.prototype,"required",2);b([R({type:Boolean,attribute:"with-label"})],Ve.prototype,"withLabel",2);b([R({type:Boolean,attribute:"with-hint"})],Ve.prototype,"withHint",2);Ve=b([ot("wa-radio-group")],Ve);Ve.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Yi=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var wt=class extends Kt{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance="default",this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener("click",this.handleClick)}handleSizeChange(){yn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute("role","radio"),this.tabIndex=0,this.setAttribute("aria-disabled",this.disabled||this.forceDisabled?"true":"false")}updated(e){if(super.updated(e),e.has("checked")&&(this.customStates.set("checked",this.checked),this.setAttribute("aria-checked",this.checked?"true":"false"),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has("disabled")||e.has("forceDisabled")){const t=this.disabled||this.forceDisabled;this.customStates.set("disabled",t),this.setAttribute("aria-disabled",t?"true":"false"),t?this.tabIndex=-1:this.tabIndex=this.checked?0:-1}}setValue(){}render(){return ee`
      <span part="control" class="control">
        ${this.checked?ee`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:""}
      </span>

      <slot part="label" class="label"></slot>
    `}};wt.css=[Ao,Pn,Yi];b([wn()],wt.prototype,"checked",2);b([wn()],wt.prototype,"forceDisabled",2);b([R({reflect:!0})],wt.prototype,"value",2);b([R({reflect:!0})],wt.prototype,"appearance",2);b([R({reflect:!0})],wt.prototype,"size",2);b([ht("size")],wt.prototype,"handleSizeChange",1);b([R({type:Boolean})],wt.prototype,"disabled",2);wt=b([ot("wa-radio")],wt);wt.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xi=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var un=class extends xt{constructor(){super(...arguments),this.variant="brand",this.appearance="accent",this.pill=!1,this.attention="none"}render(){return ee`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};un.css=[fr,Xi];b([R({reflect:!0})],un.prototype,"variant",2);b([R({reflect:!0})],un.prototype,"appearance",2);b([R({type:Boolean,reflect:!0})],un.prototype,"pill",2);b([R({reflect:!0})],un.prototype,"attention",2);un=b([ot("wa-badge")],un);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Qi=class extends Event{constructor(){super("wa-remove",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Zi=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Tt=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.variant="neutral",this.appearance="filled-outlined",this.size="m",this.pill=!1,this.withRemove=!1}handleSizeChange(){yn(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new Qi)}render(){return ee`
      <slot part="content" class="content"></slot>

      ${this.withRemove?ee`
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
    `}};Tt.css=[Zi,fr,Pn];b([R({reflect:!0})],Tt.prototype,"variant",2);b([R({reflect:!0})],Tt.prototype,"appearance",2);b([R({reflect:!0})],Tt.prototype,"size",2);b([ht("size")],Tt.prototype,"handleSizeChange",1);b([R({type:Boolean,reflect:!0})],Tt.prototype,"pill",2);b([R({attribute:"with-remove",type:Boolean})],Tt.prototype,"withRemove",2);Tt=b([ot("wa-tag")],Tt);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var el=Qe`
  :host(:focus) {
    outline: none;
  }

  .number-field {
    display: flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    height: var(--wa-form-control-height);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--wa-form-control-border-radius);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    cursor: text;
    color: var(--wa-form-control-value-color);
    font-size: inherit;
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    vertical-align: middle;
    width: 100%;
    transition:
      background-color var(--wa-transition-normal),
      border-color var(--wa-transition-normal),
      outline-color var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    background-color: var(--wa-form-control-background-color);
    padding: 0;
    outline: var(--wa-focus-ring-style) var(--wa-focus-ring-width) transparent;
    outline-offset: var(--wa-focus-ring-offset);

    &:focus-within {
      outline-color: var(--wa-color-focus);
    }

    /* Style disabled inputs */
    &:has(input:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) {
    .number-field {
      background-color: var(--wa-form-control-background-color);
      border-color: var(--wa-form-control-border-color);
    }

    .stepper {
      color: var(--wa-color-neutral-on-quiet);

      @media (hover: hover) {
        &:hover:not(:disabled) {
          color: var(--wa-color-neutral-on-quiet);
          background-color: var(--wa-color-neutral-fill-quiet);
        }
      }

      &:active:not(:disabled) {
        color: color-mix(in oklab, var(--wa-color-neutral-on-quiet), var(--wa-color-mix-active));
        background-color: color-mix(in oklab, var(--wa-color-neutral-fill-quiet), var(--wa-color-mix-active));
      }
    }
  }

  :host([appearance='filled']) {
    .number-field {
      background-color: var(--wa-color-neutral-fill-quiet);
      border-color: var(--wa-color-neutral-fill-quiet);
    }

    .stepper {
      color: var(--wa-color-neutral-on-quiet);

      @media (hover: hover) {
        &:hover:not(:disabled) {
          color: var(--wa-color-neutral-on-normal);
          background-color: var(--wa-color-neutral-fill-normal);
        }
      }

      &:active:not(:disabled) {
        color: color-mix(in oklab, var(--wa-color-neutral-on-normal), var(--wa-color-mix-active));
        background-color: color-mix(in oklab, var(--wa-color-neutral-fill-normal), var(--wa-color-mix-active));
      }
    }
  }

  :host([appearance='filled-outlined']) {
    .number-field {
      background-color: var(--wa-color-neutral-fill-quiet);
      border-color: var(--wa-form-control-border-color);
    }

    .stepper {
      color: var(--wa-color-neutral-on-quiet);

      @media (hover: hover) {
        &:hover:not(:disabled) {
          color: var(--wa-color-neutral-on-normal);
          background-color: var(--wa-color-neutral-fill-normal);
        }
      }

      &:active:not(:disabled) {
        color: color-mix(in oklab, var(--wa-color-neutral-on-normal), var(--wa-color-mix-active));
        background-color: color-mix(in oklab, var(--wa-color-neutral-fill-normal), var(--wa-color-mix-active));
      }
    }
  }

  :host([pill]) {
    .number-field,
    .stepper {
      border-radius: var(--wa-border-radius-pill);
    }
  }

  .number-field {
    /* Show autofill styles over the entire number field, not just the native <input> */
    &:has(:autofill),
    &:has(:-webkit-autofill) {
      background-color: var(--wa-color-brand-fill-quiet) !important;
    }

    input {
      flex: auto;
      height: 100%;
      width: auto;
      min-width: 0;
      margin: 0;
      padding: 0 var(--wa-form-control-padding-inline);
      outline: none;
      box-shadow: none;
      border: none;
      background-color: transparent;
      font: inherit;
      transition: inherit;
      cursor: inherit;
      -webkit-appearance: none;

      /* Center-align and use tabular numbers for better alignment */
      text-align: center;
      font-variant-numeric: tabular-nums;

      /* Hide the number spinners in Firefox */
      -moz-appearance: textfield;

      /* Hide the number spinners in Chrome/Safari */
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
        display: none;
      }

      /* Turn off Safari's autofill styles */
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-background-clip: text;
        background-color: transparent;
        -webkit-text-fill-color: inherit;
      }
    }

    &:autofill {
      &,
      &:hover,
      &:focus,
      &:active {
        box-shadow: none;
        caret-color: var(--wa-form-control-value-color);
      }
    }

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
      user-select: none;
      -webkit-user-select: none;
    }

    &:focus {
      outline: none;
    }
  }

  .start,
  .end {
    display: inline-flex;
    flex: 1;
    align-items: center;
    cursor: default;

    &::slotted(wa-icon) {
      color: var(--wa-color-neutral-on-quiet);
    }
  }

  .start {
    justify-content: start;
    margin-inline-start: var(--wa-form-control-padding-inline);
  }

  .end {
    justify-content: end;
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  /*
   * Steppers - horizontal layout with minus on start, plus on end
   */

  .stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    height: calc(100% - var(--wa-form-control-border-width) * 2);
    flex: 0 0 auto;
    border: none;
    border-radius: calc(var(--wa-form-control-border-radius) - var(--wa-form-control-border-width) * 2);
    background: transparent;
    cursor: pointer;
    margin: var(--wa-form-control-border-width);
    padding: 0;
    font-size: inherit;
    transition-property: background-color, color;
    transition-duration: var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus {
      outline: none;
    }
  }

  :host([without-steppers]) .stepper {
    display: none;
  }
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var $e=class extends Kt{constructor(){super(...arguments),this.assumeInteractionOn=["blur","input"],this.hasSlotController=new qn(this,"hint","label"),this.localize=new Lt(this),this.title="",this._value=null,this.defaultValue=this.getAttribute("value")||null,this.size="m",this.appearance="outlined",this.pill=!1,this.label="",this.hint="",this.placeholder="",this.readonly=!1,this.required=!1,this.step=1,this.withoutSteppers=!1,this.inputmode="numeric",this.withLabel=!1,this.withHint=!1}static get validators(){return[...super.validators,mr()]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){this._value!==e&&(this.valueHasChanged=!0,this._value=e)}handleSizeChange(){yn(this.localName,this.size)}updateFormValue(e){if(e==null){this.setValue("",null);return}super.updateFormValue(e)}get isAtMin(){if(this.min===void 0)return!1;const e=parseFloat(this.value||"");return!isNaN(e)&&e<=this.min}get isAtMax(){if(this.max===void 0)return!1;const e=parseFloat(this.value||"");return!isNaN(e)&&e>=this.max}handleChange(e){this.value=this.input.value,this.relayNativeEvent(e,{bubbles:!0,composed:!0})}handleInput(){this.value=this.input.value}handleKeyDown(e){Ti(e,this),(e.key==="ArrowUp"||e.key==="ArrowDown")&&requestAnimationFrame(()=>{this.value!==this.input.value&&(this.value=this.input.value)})}handleStepperPointerUp(e,t){if(this.disabled||this.readonly)return;const n=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,composed:!0});this.dispatchEvent(n),!n.defaultPrevented&&(e==="up"?this.input.stepUp():this.input.stepDown(),this.value!==this.input.value&&(this.value=this.input.value),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),t.pointerType!=="touch"&&this.input.focus())}handleStepperPointerDown(e){e.pointerType!=="touch"&&(e.preventDefault(),this.input.focus())}updated(e){super.updated(e),(e.has("value")||e.has("defaultValue"))&&(this.input&&this.value&&this.input.value!==this.value&&(this._value=this.input.value),this.customStates.set("blank",!this.value))}handleStepChange(){this.input.step=String(this.step),this.updateValidity()}focus(e){this.input.focus(e)}blur(){this.input.blur()}select(){this.input.select()}stepUp(){this.input.stepUp(),this.value!==this.input.value&&(this.value=this.input.value)}stepDown(){this.input.stepDown(),this.value!==this.input.value&&(this.value=this.input.value)}formResetCallback(){this.value=this.defaultValue,super.formResetCallback()}render(){const e=this.hasSlotController.test("label","withLabel"),t=this.hasSlotController.test("hint","withHint"),n=this.label?!0:!!e,o=this.hint?!0:!!t;return ee`
      <label
        part="form-control-label label"
        class=${gt({label:!0,"has-label":n})}
        for="input"
        aria-hidden=${n?"false":"true"}
      >
        <slot name="label">${this.label}</slot>
      </label>

      <div part="base number-input" class="number-field">
        ${this.withoutSteppers?"":ee`
              <button
                part="stepper stepper-decrement"
                class="stepper stepper-decrement"
                type="button"
                tabindex="-1"
                aria-label=${this.localize.term("decrement")}
                ?disabled=${this.disabled||this.readonly||this.isAtMin}
                @pointerdown=${this.handleStepperPointerDown}
                @pointerup=${a=>this.handleStepperPointerUp("down",a)}
              >
                <slot name="decrement-icon">
                  <wa-icon name="minus" library="system"></wa-icon>
                </slot>
              </button>
            `}

        <slot name="start" part="start" class="start"></slot>

        <input
          part="input"
          id="input"
          class="control"
          type="number"
          inputmode=${We(this.inputmode)}
          title=${this.title}
          name=${We(this.name)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          placeholder=${We(this.placeholder)}
          min=${We(this.min)}
          max=${We(this.max)}
          step=${We(this.step)}
          .value=${Na(this.value??"")}
          autocomplete=${We(this.autocomplete)}
          ?autofocus=${this.autofocus}
          enterkeyhint=${We(this.enterkeyhint)}
          aria-describedby="hint"
          @change=${this.handleChange}
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
        />

        <slot name="end" part="end" class="end"></slot>

        ${this.withoutSteppers?"":ee`
              <button
                part="stepper stepper-increment"
                class="stepper stepper-increment"
                type="button"
                tabindex="-1"
                aria-label=${this.localize.term("increment")}
                ?disabled=${this.disabled||this.readonly||this.isAtMax}
                @pointerdown=${this.handleStepperPointerDown}
                @pointerup=${a=>this.handleStepperPointerUp("up",a)}
              >
                <slot name="increment-icon">
                  <wa-icon name="plus" library="system"></wa-icon>
                </slot>
              </button>
            `}
      </div>

      <slot
        id="hint"
        part="hint"
        name="hint"
        class=${gt({"has-slotted":o})}
        aria-hidden=${o?"false":"true"}
        >${this.hint}</slot
      >
    `}};$e.css=[Pn,Ao,el];$e.shadowRootOptions={...Kt.shadowRootOptions,delegatesFocus:!0};b([Le("input")],$e.prototype,"input",2);b([R()],$e.prototype,"title",2);b([wn()],$e.prototype,"value",1);b([R({attribute:"value",reflect:!0})],$e.prototype,"defaultValue",2);b([R({reflect:!0})],$e.prototype,"size",2);b([ht("size")],$e.prototype,"handleSizeChange",1);b([R({reflect:!0})],$e.prototype,"appearance",2);b([R({type:Boolean,reflect:!0})],$e.prototype,"pill",2);b([R()],$e.prototype,"label",2);b([R({attribute:"hint"})],$e.prototype,"hint",2);b([R()],$e.prototype,"placeholder",2);b([R({type:Boolean,reflect:!0})],$e.prototype,"readonly",2);b([R({type:Boolean,reflect:!0})],$e.prototype,"required",2);b([R({type:Number})],$e.prototype,"min",2);b([R({type:Number})],$e.prototype,"max",2);b([R()],$e.prototype,"step",2);b([R({attribute:"without-steppers",type:Boolean})],$e.prototype,"withoutSteppers",2);b([R()],$e.prototype,"autocomplete",2);b([R({type:Boolean})],$e.prototype,"autofocus",2);b([R()],$e.prototype,"enterkeyhint",2);b([R()],$e.prototype,"inputmode",2);b([R({attribute:"with-label",type:Boolean})],$e.prototype,"withLabel",2);b([R({attribute:"with-hint",type:Boolean})],$e.prototype,"withHint",2);b([ht("step",{waitUntilFirstUpdate:!0})],$e.prototype,"handleStepChange",1);$e=b([ot("wa-number-input")],$e);$e.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var tl=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var He=class extends Kt{constructor(){super(...arguments),this.hasSlotController=new qn(this,"hint"),this.localize=new Lt(this),this.title="",this.name=null,this._value=this.getAttribute("value")??null,this.size="m",this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute("checked"),this.required=!1,this.hint="",this.withHint=!1}static get validators(){return[...super.validators,mr()]}get value(){return this._value??"on"}set value(e){this._value=e}handleSizeChange(){yn(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))})}handleKeyDown(e){const t=this.localize.dir()==="rtl";e.key==="ArrowLeft"&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))})),e.key==="ArrowRight"&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has("value")||e.has("checked")||e.has("defaultChecked")||e.has("disabled"))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set("checked",this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??"on",t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){const e=this.hasSlotController.test("hint","withHint"),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:Na(this.checked);return ee`
      <label
        part="base switch"
        class=${gt({checked:this.checked,disabled:this.disabled})}
      >
        <input
          class="input"
          type="checkbox"
          title=${this.title}
          name=${We(this.name)}
          value=${We(this.value)}
          .checked=${We(o)}
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
        class=${gt({"has-slotted":t})}
        aria-hidden=${t?"false":"true"}
        >${this.hint}</slot
      >
    `}};He.shadowRootOptions={...Kt.shadowRootOptions,delegatesFocus:!0};He.css=[Ao,Pn,tl];b([Le('input[type="checkbox"]')],He.prototype,"input",2);b([R()],He.prototype,"title",2);b([R({reflect:!0})],He.prototype,"name",2);b([R({reflect:!0})],He.prototype,"value",1);b([R({reflect:!0})],He.prototype,"size",2);b([ht("size")],He.prototype,"handleSizeChange",1);b([R({type:Boolean})],He.prototype,"disabled",2);b([R({type:Boolean,attribute:!1})],He.prototype,"checked",1);b([R({type:Boolean,attribute:"checked",reflect:!0})],He.prototype,"defaultChecked",2);b([R({type:Boolean,reflect:!0})],He.prototype,"required",2);b([R({attribute:"hint"})],He.prototype,"hint",2);b([R({attribute:"with-hint",type:Boolean})],He.prototype,"withHint",2);b([ht(["checked","defaultChecked"])],He.prototype,"handleStateChange",1);b([ht("disabled",{waitUntilFirstUpdate:!0})],He.prototype,"handleDisabledChange",1);He=b([ot("wa-switch")],He);He.disableWarning?.("change-in-update");/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var nl=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function ss(e,t){return new Promise(n=>{function o(a){a.target===e&&(e.removeEventListener(t,o),n())}e.addEventListener(t,o)})}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Xe=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance="outlined",this.iconPlacement="end"}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?"auto":"0",this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(t=>{for(const n of t)n.type==="attributes"&&n.attributeName==="open"&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has("isAnimating")&&this.customStates.set("animating",this.isAnimating)}handleSummaryClick(e){e.composedPath().some(o=>{if(!(o instanceof HTMLElement))return!1;const a=o.tagName?.toLowerCase();return["a","button","input","textarea","select"].includes(a)?!0:o instanceof Kt?!("disabled"in o)||!o.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&(e.preventDefault(),this.hide()),(e.key==="ArrowDown"||e.key==="ArrowRight")&&(e.preventDefault(),this.show())}closeOthersWithSameName(){if(!this.name)return;this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(n=>{n!==this&&n.open&&(n.open=!1)})}async handleOpenChange(){this.animationGeneration++;const e=this.animationGeneration;if(this.open){this.details.open=!0;const t=new za;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;const n=os(getComputedStyle(this.body).getPropertyValue("--show-duration"));if(await ns(this.body,[{height:"0",opacity:"0"},{height:`${this.body.scrollHeight}px`,opacity:"1"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="auto",this.isAnimating=!1,this.dispatchEvent(new Pa)}else{const t=new Da;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;const n=os(getComputedStyle(this.body).getPropertyValue("--hide-duration"));if(await ns(this.body,[{height:`${this.body.scrollHeight}px`,opacity:"1"},{height:"0",opacity:"0"}],{duration:n,easing:"linear"}),this.animationGeneration!==e)return;this.body.style.height="0",this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new qa)}}async show(){if(!(this.open||this.disabled))return this.open=!0,ss(this,"wa-after-show")}async hide(){if(!(!this.open||this.disabled))return this.open=!1,ss(this,"wa-after-hide")}render(){const e=this.hasUpdated?this.localize.dir()==="rtl":this.dir==="rtl";return ee`
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
          class=${gt({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};Xe.css=nl;b([Le("details")],Xe.prototype,"details",2);b([Le("summary")],Xe.prototype,"header",2);b([Le(".body")],Xe.prototype,"body",2);b([Le(".expand-icon-slot")],Xe.prototype,"expandIconSlot",2);b([wn()],Xe.prototype,"isAnimating",2);b([R({type:Boolean,reflect:!0})],Xe.prototype,"open",2);b([R()],Xe.prototype,"summary",2);b([R({reflect:!0})],Xe.prototype,"name",2);b([R({type:Boolean,reflect:!0})],Xe.prototype,"disabled",2);b([R({reflect:!0})],Xe.prototype,"appearance",2);b([R({attribute:"icon-placement",reflect:!0})],Xe.prototype,"iconPlacement",2);b([ht("open",{waitUntilFirstUpdate:!0})],Xe.prototype,"handleOpenChange",1);Xe=b([ot("wa-details")],Xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var ol=class extends Event{constructor(e){super("wa-select",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function*wr(e=document.activeElement){e!=null&&(yield e,"shadowRoot"in e&&e.shadowRoot&&e.shadowRoot.mode!=="closed"&&(yield*wr(e.shadowRoot.activeElement)))}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var al=Qe`
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
`;const jt=Math.min,Et=Math.max,uo=Math.round,Qn=Math.floor,At=e=>({x:e,y:e}),sl={left:"right",right:"left",bottom:"top",top:"bottom"};function yr(e,t,n){return Et(e,jt(t,n))}function Bn(e,t){return typeof e=="function"?e(t):e}function hn(e){return e.split("-")[0]}function In(e){return e.split("-")[1]}function vr(e){return e==="x"?"y":"x"}function Ba(e){return e==="y"?"height":"width"}function Ct(e){const t=e[0];return t==="t"||t==="b"?"y":"x"}function Ia(e){return vr(Ct(e))}function rl(e,t,n){n===void 0&&(n=!1);const o=In(e),a=Ia(e),s=Ba(a);let r=a==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[s]>t.floating[s]&&(r=ho(r)),[r,ho(r)]}function il(e){const t=ho(e);return[ua(e),t,ua(t)]}function ua(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}const rs=["left","right"],is=["right","left"],ll=["top","bottom"],cl=["bottom","top"];function dl(e,t,n){switch(e){case"top":case"bottom":return n?t?is:rs:t?rs:is;case"left":case"right":return t?ll:cl;default:return[]}}function ul(e,t,n,o){const a=In(e);let s=dl(hn(e),n==="start",o);return a&&(s=s.map(r=>r+"-"+a),t&&(s=s.concat(s.map(ua)))),s}function ho(e){const t=hn(e);return sl[t]+e.slice(t.length)}function hl(e){var t,n,o,a;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(a=e.left)!=null?a:0}}function kr(e){return typeof e!="number"?hl(e):{top:e,right:e,bottom:e,left:e}}function po(e){const{x:t,y:n,width:o,height:a}=e;return{width:o,height:a,top:n,left:t,right:t+o,bottom:n+a,x:t,y:n}}function ls(e,t,n){let{reference:o,floating:a}=e;const s=Ct(t),r=Ia(t),i=Ba(r),l=hn(t),c=s==="y",d=o.x+o.width/2-a.width/2,u=o.y+o.height/2-a.height/2,w=o[i]/2-a[i]/2;let f;switch(l){case"top":f={x:d,y:o.y-a.height};break;case"bottom":f={x:d,y:o.y+o.height};break;case"right":f={x:o.x+o.width,y:u};break;case"left":f={x:o.x-a.width,y:u};break;default:f={x:o.x,y:o.y}}const p=In(t);return p&&(f[r]+=w*(p==="end"?1:-1)*(n&&c?-1:1)),f}async function pl(e,t){var n;t===void 0&&(t={});const{x:o,y:a,platform:s,rects:r,elements:i,strategy:l}=e,{boundary:c="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:w=!1,padding:f=0}=Bn(t,e),p=kr(f),h=i[w?u==="floating"?"reference":"floating":u],y=po(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(h)))==null||n?h:h.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(i.floating)),boundary:c,rootBoundary:d,strategy:l})),g=u==="floating"?{x:o,y:a,width:r.floating.width,height:r.floating.height}:r.reference,k=await(s.getOffsetParent==null?void 0:s.getOffsetParent(i.floating)),T=await(s.isElement==null?void 0:s.isElement(k))&&await(s.getScale==null?void 0:s.getScale(k))||{x:1,y:1},A=po(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:i,rect:g,offsetParent:k,strategy:l}):g);return{top:(y.top-A.top+p.top)/T.y,bottom:(A.bottom-y.bottom+p.bottom)/T.y,left:(y.left-A.left+p.left)/T.x,right:(A.right-y.right+p.right)/T.x}}const fl=50,ml=async(e,t,n)=>{const{placement:o="bottom",strategy:a="absolute",middleware:s=[],platform:r}=n,i=r.detectOverflow?r:{...r,detectOverflow:pl},l=await(r.isRTL==null?void 0:r.isRTL(t));let c=await r.getElementRects({reference:e,floating:t,strategy:a}),{x:d,y:u}=ls(c,o,l),w=o,f=0;const p={};for(let x=0;x<s.length;x++){const h=s[x];if(!h)continue;const{name:y,fn:g}=h,{x:k,y:T,data:A,reset:N}=await g({x:d,y:u,initialPlacement:o,placement:w,strategy:a,middlewareData:p,rects:c,platform:i,elements:{reference:e,floating:t}});d=k??d,u=T??u,p[y]={...p[y],...A},N&&f<fl&&(f++,typeof N=="object"&&(N.placement&&(w=N.placement),N.rects&&(c=N.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:a}):N.rects),{x:d,y:u}=ls(c,w,l)),x=-1)}return{x:d,y:u,placement:w,strategy:a,middlewareData:p}},gl=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:a,rects:s,platform:r,elements:i,middlewareData:l}=t,{element:c,padding:d=0}=Bn(e,t)||{};if(c==null)return{};const u=kr(d),w={x:n,y:o},f=Ia(a),p=Ba(f),x=await r.getDimensions(c),h=f==="y",y=h?"top":"left",g=h?"bottom":"right",k=h?"clientHeight":"clientWidth",T=s.reference[p]+s.reference[f]-w[f]-s.floating[p],A=w[f]-s.reference[f],N=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c));let X=N?N[k]:0;(!X||!await(r.isElement==null?void 0:r.isElement(N)))&&(X=i.floating[k]||s.floating[p]);const Q=T/2-A/2,ae=X/2-x[p]/2-1,_=jt(u[y],ae),V=jt(u[g],ae),B=X-x[p]-V,m=X/2-x[p]/2+Q,P=yr(_,m,B),F=!l.arrow&&In(a)!=null&&m!==P&&s.reference[p]/2-(m<_?_:V)-x[p]/2<0,D=F?m<_?m-_:m-B:0;return{[f]:w[f]+D,data:{[f]:P,centerOffset:m-P-D,...F&&{alignmentOffset:D}},reset:F}}}),bl=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:a,middlewareData:s,rects:r,initialPlacement:i,platform:l,elements:c}=t,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:w,fallbackStrategy:f="bestFit",fallbackAxisSideDirection:p="none",flipAlignment:x=!0,...h}=Bn(e,t);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const y=hn(a),g=Ct(i),k=hn(i)===i,T=await(l.isRTL==null?void 0:l.isRTL(c.floating)),A=w||(k||!x?[ho(i)]:il(i)),N=p!=="none";!w&&N&&A.push(...ul(i,x,p,T));const X=[i,...A],Q=await l.detectOverflow(t,h),ae=[];let _=((o=s.flip)==null?void 0:o.overflows)||[];if(d&&ae.push(Q[y]),u){const P=rl(a,r,T);ae.push(Q[P[0]],Q[P[1]])}if(_=[..._,{placement:a,overflows:ae}],!ae.every(P=>P<=0)){var V,B;const P=(((V=s.flip)==null?void 0:V.index)||0)+1,F=X[P];if(F&&(!(u==="alignment"?g!==Ct(F):!1)||_.every(U=>Ct(U.placement)===g?U.overflows[0]>0:!0)))return{data:{index:P,overflows:_},reset:{placement:F}};let D=(B=_.filter(W=>W.overflows[0]<=0).sort((W,U)=>W.overflows[1]-U.overflows[1])[0])==null?void 0:B.placement;if(!D)switch(f){case"bestFit":{var m;const W=(m=_.filter(U=>{if(N){const Z=Ct(U.placement);return Z===g||Z==="y"}return!0}).map(U=>[U.placement,U.overflows.filter(Z=>Z>0).reduce((Z,se)=>Z+se,0)]).sort((U,Z)=>U[1]-Z[1])[0])==null?void 0:m[0];W&&(D=W);break}case"initialPlacement":D=i;break}if(a!==D)return{reset:{placement:D}}}return{}}}},wl=new Set(["left","top"]);async function yl(e,t){const{placement:n,platform:o,elements:a}=e,s=await(o.isRTL==null?void 0:o.isRTL(a.floating)),r=hn(n),i=In(n),l=Ct(n)==="y",c=wl.has(r)?-1:1,d=s&&l?-1:1,u=Bn(t,e);let{mainAxis:w,crossAxis:f,alignmentAxis:p}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return i&&typeof p=="number"&&(f=i==="end"?p*-1:p),l?{x:f*d,y:w*c}:{x:w*c,y:f*d}}const vl=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:a,y:s,placement:r,middlewareData:i}=t,l=await yl(t,e);return r===((n=i.offset)==null?void 0:n.placement)&&(o=i.arrow)!=null&&o.alignmentOffset?{}:{x:a+l.x,y:s+l.y,data:{...l,placement:r}}}}},kl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:a,platform:s}=t,{mainAxis:r=!0,crossAxis:i=!1,limiter:l={fn:g=>{let{x:k,y:T}=g;return{x:k,y:T}}},...c}=Bn(e,t),d={x:n,y:o},u=await s.detectOverflow(t,c),w=Ct(a),f=vr(w);let p=d[f],x=d[w];const h=(g,k)=>yr(k+u[g==="y"?"top":"left"],k,k-u[g==="y"?"bottom":"right"]);r&&(p=h(f,p)),i&&(x=h(w,x));const y=l.fn({...t,[f]:p,[w]:x});return{...y,data:{x:y.x-n,y:y.y-o,enabled:{[f]:r,[w]:i}}}}}},$l=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:a,elements:s}=t,{apply:r=()=>{},...i}=Bn(e,t),l=await a.detectOverflow(t,i),c=hn(n),d=In(n),u=Ct(n)==="y",{width:w,height:f}=o.floating;let p,x;c==="top"||c==="bottom"?(p=c,x=d===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(x=c,p=d==="end"?"top":"bottom");const h=f-l.top-l.bottom,y=w-l.left-l.right,g=jt(f-l[p],h),k=jt(w-l[x],y),T=t.middlewareData.shift,A=!T;let N=g,X=k;T!=null&&T.enabled.x&&(X=y),T!=null&&T.enabled.y&&(N=h),A&&!d&&(u?X=w-2*Et(l.left,l.right):N=f-2*Et(l.top,l.bottom)),await r({...t,availableWidth:X,availableHeight:N});const Q=await a.getDimensions(s.floating);return w!==Q.width||f!==Q.height?{reset:{rects:!0}}:{}}}};function To(){return typeof window<"u"}function Hn(e){return $r(e)?(e.nodeName||"").toLowerCase():"#document"}function nt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Ot(e){var t;return(t=($r(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function $r(e){return To()?e instanceof Node||e instanceof nt(e).Node:!1}function kt(e){return To()?e instanceof Element||e instanceof nt(e).Element:!1}function Jt(e){return To()?e instanceof HTMLElement||e instanceof nt(e).HTMLElement:!1}function cs(e){return!To()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof nt(e).ShadowRoot}function Ro(e){const{overflow:t,overflowX:n,overflowY:o,display:a}=$t(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&a!=="inline"&&a!=="contents"}function xl(e){return/^(table|td|th)$/.test(Hn(e))}function Lo(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}const Sl=/transform|translate|scale|rotate|perspective|filter/,_l=/paint|layout|strict|content/,Zt=e=>!!e&&e!=="none";let Uo;function Oo(e){const t=kt(e)?$t(e):e;return Zt(t.transform)||Zt(t.translate)||Zt(t.scale)||Zt(t.rotate)||Zt(t.perspective)||!Ha()&&(Zt(t.backdropFilter)||Zt(t.filter))||Sl.test(t.willChange||"")||_l.test(t.contain||"")}function Cl(e){let t=pn(e);for(;Jt(t)&&!Jn(t);){if(Oo(t))return t;if(Lo(t))return null;t=pn(t)}return null}function Ha(){return Uo==null&&(Uo=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),Uo}function Jn(e){return/^(html|body|#document)$/.test(Hn(e))}function $t(e){return nt(e).getComputedStyle(e)}function Mo(e){return kt(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function pn(e){if(Hn(e)==="html")return e;const t=e.assignedSlot||e.parentNode||cs(e)&&e.host||Ot(e);return cs(t)?t.host:t}function xr(e){const t=pn(e);return Jn(t)?(e.ownerDocument||e).body:Jt(t)&&Ro(t)?t:xr(t)}function An(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const a=xr(e),s=a===((o=e.ownerDocument)==null?void 0:o.body),r=nt(a);if(s){const i=ha(r);return t.concat(r,r.visualViewport||[],Ro(a)?a:[],i&&n?An(i):[])}else return t.concat(a,An(a,[],n))}function ha(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Sr(e){const t=$t(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const a=Jt(e),s=a?e.offsetWidth:n,r=a?e.offsetHeight:o,i=uo(n)!==s||uo(o)!==r;return i&&(n=s,o=r),{width:n,height:o,$:i}}function Fa(e){return kt(e)?e:e.contextElement}function Cn(e){const t=Fa(e);if(!Jt(t))return At(1);const n=t.getBoundingClientRect(),{width:o,height:a,$:s}=Sr(t);let r=(s?uo(n.width):n.width)/o,i=(s?uo(n.height):n.height)/a;return(!r||!Number.isFinite(r))&&(r=1),(!i||!Number.isFinite(i))&&(i=1),{x:r,y:i}}const El=At(0);function _r(e){const t=nt(e);return!Ha()||!t.visualViewport?El:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Al(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===nt(e)}function fn(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const a=e.getBoundingClientRect(),s=Fa(e);let r=At(1);t&&(o?kt(o)&&(r=Cn(o)):r=Cn(e));const i=Al(s,n,o)?_r(s):At(0);let l=(a.left+i.x)/r.x,c=(a.top+i.y)/r.y,d=a.width/r.x,u=a.height/r.y;if(s&&o){const w=nt(s),f=kt(o)?nt(o):o;let p=w,x=ha(p);for(;x&&f!==p;){const h=Cn(x),y=x.getBoundingClientRect(),g=$t(x),k=y.left+(x.clientLeft+parseFloat(g.paddingLeft))*h.x,T=y.top+(x.clientTop+parseFloat(g.paddingTop))*h.y;l*=h.x,c*=h.y,d*=h.x,u*=h.y,l+=k,c+=T,p=nt(x),x=ha(p)}}return po({width:d,height:u,x:l,y:c})}function No(e,t){const n=Mo(e).scrollLeft;return t?t.left+n:fn(Ot(e)).left+n}function Cr(e,t){const n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-No(e,n),a=n.top+t.scrollTop;return{x:o,y:a}}function Tl(e){let{elements:t,rect:n,offsetParent:o,strategy:a}=e;const s=a==="fixed",r=Ot(o),i=t?Lo(t.floating):!1;if(o===r||i&&s)return n;let l={scrollLeft:0,scrollTop:0},c=At(1);const d=At(0),u=Jt(o);if((u||!s)&&((Hn(o)!=="body"||Ro(r))&&(l=Mo(o)),u)){const f=fn(o);c=Cn(o),d.x=f.x+o.clientLeft,d.y=f.y+o.clientTop}const w=r&&!u&&!s?Cr(r,l):At(0);return{width:n.width*c.x,height:n.height*c.y,x:n.x*c.x-l.scrollLeft*c.x+d.x+w.x,y:n.y*c.y-l.scrollTop*c.y+d.y+w.y}}function Rl(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Ll(e){const t=Mo(e),n=e.ownerDocument.body,o=Et(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),a=Et(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight);let s=-t.scrollLeft+No(e);const r=-t.scrollTop;return $t(n).direction==="rtl"&&(s+=Et(e.clientWidth,n.clientWidth)-o),{width:o,height:a,x:s,y:r}}const Ol=25;function Ml(e,t,n){n===void 0&&(n="viewport");const o=n==="layoutViewport",a=nt(e),s=Ot(e),r=a.visualViewport;let i=s.clientWidth,l=s.clientHeight,c=0,d=0;if(r){const w=!Ha()||t==="fixed";o?w||(c=-r.offsetLeft,d=-r.offsetTop):(i=r.width,l=r.height,w&&(c=r.offsetLeft,d=r.offsetTop))}if(No(s)<=0){const w=s.ownerDocument,f=w.body,p=getComputedStyle(f),x=w.compatMode==="CSS1Compat"&&parseFloat(p.marginLeft)+parseFloat(p.marginRight)||0,h=Math.abs(s.clientWidth-f.clientWidth-x),y=getComputedStyle(s).scrollbarGutter==="stable both-edges"?h/2:h;y<=Ol&&(i-=y)}return{width:i,height:l,x:c,y:d}}function Nl(e,t){const n=fn(e,!0,t==="fixed"),o=n.top+e.clientTop,a=n.left+e.clientLeft,s=Cn(e),r=e.clientWidth*s.x,i=e.clientHeight*s.y,l=a*s.x,c=o*s.y;return{width:r,height:i,x:l,y:c}}function ds(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=Ml(e,n,t);else if(t==="document")o=Ll(Ot(e));else if(kt(t))o=Nl(t,n);else{const a=_r(e);o={x:t.x-a.x,y:t.y-a.y,width:t.width,height:t.height}}return po(o)}function zl(e,t){const n=t.get(e);if(n)return n;let o=An(e,[],!1).filter(i=>kt(i)&&Hn(i)!=="body"),a=null;const s=$t(e).position==="fixed";let r=s?pn(e):e;for(;kt(r)&&!Jn(r);){const i=$t(r),l=Oo(r),c=a?a.position:s?"fixed":"";!l&&(c==="fixed"||c==="absolute"&&i.position==="static")?o=o.filter(u=>u!==r):a=i,r=pn(r)}return t.set(e,o),o}function Dl(e){let{element:t,boundary:n,rootBoundary:o,strategy:a}=e;const r=[...n==="clippingAncestors"?Lo(t)?[]:zl(t,this._c):[].concat(n),o],i=ds(t,r[0],a);let l=i.top,c=i.right,d=i.bottom,u=i.left;for(let w=1;w<r.length;w++){const f=ds(t,r[w],a);l=Et(f.top,l),c=jt(f.right,c),d=jt(f.bottom,d),u=Et(f.left,u)}return{width:c-u,height:d-l,x:u,y:l}}function ql(e){const{width:t,height:n}=Sr(e);return{width:t,height:n}}function Pl(e,t,n){const o=Jt(t),a=Ot(t),s=n==="fixed",r=fn(e,!0,s,t);let i={scrollLeft:0,scrollTop:0};const l=At(0);if((o||!s)&&((Hn(t)!=="body"||Ro(a))&&(i=Mo(t)),o)){const w=fn(t,!0,s,t);l.x=w.x+t.clientLeft,l.y=w.y+t.clientTop}!o&&a&&(l.x=No(a));const c=a&&!o&&!s?Cr(a,i):At(0),d=r.left+i.scrollLeft-l.x-c.x,u=r.top+i.scrollTop-l.y-c.y;return{x:d,y:u,width:r.width,height:r.height}}function Vo(e){return $t(e).position==="static"}function us(e,t){if(!Jt(e)||$t(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return Ot(e)===n&&(n=n.ownerDocument.body),n}function Er(e,t){const n=nt(e);if(Lo(e))return n;if(!Jt(e)){let a=pn(e);for(;a&&!Jn(a);){if(kt(a)&&!Vo(a))return a;a=pn(a)}return n}let o=us(e,t);for(;o&&xl(o)&&Vo(o);)o=us(o,t);return o&&Jn(o)&&Vo(o)&&!Oo(o)?n:o||Cl(e)||n}const Bl=async function(e){const t=this.getOffsetParent||Er,n=this.getDimensions,o=await n(e.floating);return{reference:Pl(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function Il(e){return $t(e).direction==="rtl"}const ao={convertOffsetParentRelativeRectToViewportRelativeRect:Tl,getDocumentElement:Ot,getClippingRect:Dl,getOffsetParent:Er,getElementRects:Bl,getClientRects:Rl,getDimensions:ql,getScale:Cn,isElement:kt,isRTL:Il};function Ar(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function Hl(e,t,n){let o=null,a;const s=Ot(e);function r(){var d;clearTimeout(a),(d=o)==null||d.disconnect(),o=null}function i(d,u){d===void 0&&(d=!1),u===void 0&&(u=1),r();const w=e.getBoundingClientRect(),{left:f,top:p,width:x,height:h}=w;if(d||t(),!x||!h)return;const y=Qn(p),g=Qn(s.clientWidth-(f+x)),k=Qn(s.clientHeight-(p+h)),T=Qn(f),N={rootMargin:-y+"px "+-g+"px "+-k+"px "+-T+"px",threshold:Et(0,jt(1,u))||1};let X=!0;function Q(ae){const _=ae[0].intersectionRatio;if(!Ar(w,e.getBoundingClientRect()))return i();if(_!==u){if(!X)return i();_?i(!1,_):a=setTimeout(()=>{i(!1,1e-7)},1e3)}X=!1}try{o=new IntersectionObserver(Q,{...N,root:s.ownerDocument})}catch{o=new IntersectionObserver(Q,N)}o.observe(e)}const l=nt(e),c=()=>i(n);return l.addEventListener("resize",c),i(!0),()=>{l.removeEventListener("resize",c),r()}}function Tr(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:a=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:i=typeof IntersectionObserver=="function",animationFrame:l=!1}=o,c=Fa(e),d=a||s?[...c?An(c):[],...t?An(t):[]]:[];d.forEach(y=>{a&&y.addEventListener("scroll",n),s&&y.addEventListener("resize",n)});const u=c&&i?Hl(c,n,s):null;let w=-1,f=null;r&&(f=new ResizeObserver(y=>{let[g]=y;g&&g.target===c&&f&&t&&(f.unobserve(t),cancelAnimationFrame(w),w=requestAnimationFrame(()=>{var k;(k=f)==null||k.observe(t)})),n()}),c&&!l&&f.observe(c),t&&f.observe(t));let p,x=l?fn(e):null;l&&h();function h(){const y=fn(e);x&&!Ar(x,y)&&n(),x=y,p=requestAnimationFrame(h)}return n(),()=>{var y;d.forEach(g=>{a&&g.removeEventListener("scroll",n),s&&g.removeEventListener("resize",n)}),u?.(),(y=f)==null||y.disconnect(),f=null,l&&cancelAnimationFrame(p)}}const Rr=vl,Lr=kl,Or=bl,hs=$l,Fl=gl,Mr=(e,t,n)=>{const o=new Map,a=n??{},s={...ao,...a.platform,_c:o};return ml(e,t,{...a,platform:s})};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ko=new Set,Ye=class extends xt{constructor(){super(...arguments),this.submenuCleanups=new Map,this.localize=new Lt(this),this.userTypedQuery="",this.openSubmenuStack=[],this.open=!1,this.size="m",this.placement="bottom-start",this.distance=0,this.skidding=0,this.handleDocumentKeyDown=async e=>{const t=this.localize.dir()==="rtl";if(e.key==="Escape"&&this.open&&da(this)){const d=this.getTrigger();e.preventDefault(),e.stopPropagation(),this.open=!1,d?.focus({preventScroll:!0});return}const n=[...wr()].find(d=>d.localName==="wa-dropdown-item"),o=n?.localName==="wa-dropdown-item",a=this.getCurrentSubmenuItem(),s=!!a;let r,i,l;s?(r=this.getSubmenuItems(a),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1):(r=this.getItems(),i=r.find(d=>d.active||d===n),l=i?r.indexOf(i):-1);let c;if(e.key==="ArrowUp"&&(e.preventDefault(),e.stopPropagation(),l>0?c=r[l-1]:c=r[r.length-1]),e.key==="ArrowDown"&&(e.preventDefault(),e.stopPropagation(),l!==-1&&l<r.length-1?c=r[l+1]:c=r[0]),e.key===(t?"ArrowLeft":"ArrowRight")&&o&&i&&i.hasSubmenu){e.preventDefault(),e.stopPropagation(),i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,w)=>u.active=w===0),d[0].focus({preventScroll:!0}))},0);return}if(e.key===(t?"ArrowRight":"ArrowLeft")&&s){e.preventDefault(),e.stopPropagation();const d=this.removeFromSubmenuStack();d&&(d.submenuOpen=!1,setTimeout(()=>{d.focus({preventScroll:!0}),d.active=!0,(d.slot==="submenu"?this.getSubmenuItems(d.parentElement):this.getItems()).forEach(w=>{w!==d&&(w.active=!1)})},0));return}if((e.key==="Home"||e.key==="End")&&(e.preventDefault(),e.stopPropagation(),c=e.key==="Home"?r[0]:r[r.length-1]),e.key==="Tab"&&await this.hideMenu(),e.key.length===1&&!(e.metaKey||e.ctrlKey||e.altKey)&&!(e.key===" "&&this.userTypedQuery==="")&&(clearTimeout(this.userTypedTimeout),this.userTypedTimeout=setTimeout(()=>{this.userTypedQuery=""},1e3),this.userTypedQuery+=e.key,r.some(d=>{const u=(d.textContent||"").trim().toLowerCase(),w=this.userTypedQuery.trim().toLowerCase();return u.startsWith(w)?(c=d,!0):!1})),c){e.preventDefault(),e.stopPropagation(),r.forEach(d=>d.active=d===c),c.focus({preventScroll:!0}),c.scrollIntoView({block:"nearest"});return}(e.key==="Enter"||e.key===" "&&this.userTypedQuery==="")&&o&&i&&(e.preventDefault(),e.stopPropagation(),i.hasSubmenu?(i.submenuOpen=!0,this.addToSubmenuStack(i),setTimeout(()=>{const d=this.getSubmenuItems(i);d.length>0&&(d.forEach((u,w)=>u.active=w===0),d[0].focus({preventScroll:!0}))},0)):this.makeSelection(i,e))},this.handleDocumentPointerDown=e=>{e.composedPath().some(o=>o instanceof HTMLElement?o===this||o.closest('wa-dropdown, [part="submenu"]'):!1)||(this.open=!1)},this.handleGlobalMouseMove=e=>{const t=this.getCurrentSubmenuItem();if(!t?.submenuOpen||!t.submenuElement)return;const n=t.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl",a=o?n.right:n.left,s=o?Math.max(e.clientX,a):Math.min(e.clientX,a),r=Math.max(n.top,Math.min(e.clientY,n.bottom));t.submenuElement.style.setProperty("--safe-triangle-cursor-x",`${s}px`),t.submenuElement.style.setProperty("--safe-triangle-cursor-y",`${r}px`);const i=e.composedPath(),l=t.matches(":hover"),c=!!t.submenuElement?.matches(":hover"),d=l||!!i.find(w=>w===t),u=c||!!i.find(w=>w instanceof HTMLElement&&w.closest('[part="submenu"]')===t.submenuElement);!d&&!u&&setTimeout(()=>{!l&&!c&&(t.submenuOpen=!1)},100)}}handleSizeChange(){yn(this.localName,this.size)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.userTypedTimeout),this.closeAllSubmenus(),this.submenuCleanups.forEach(e=>e()),this.submenuCleanups.clear(),document.removeEventListener("mousemove",this.handleGlobalMouseMove),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),co(this)}firstUpdated(e){super.firstUpdated(e),this.syncAriaAttributes()}async updated(e){if(e.has("open")){const t=e.get("open");if(t===this.open||t===void 0&&this.open===!1)return;this.customStates.set("open",this.open),this.open?await this.showMenu():(this.closeAllSubmenus(),await this.hideMenu())}e.has("size")&&this.syncItemSizes()}getItems(e=!1){const t=(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(n=>n.localName==="wa-dropdown-item");return e?t:t.filter(n=>!n.disabled)}getSubmenuItems(e,t=!1){const n=e.shadowRoot?.querySelector('slot[name="submenu"]')||e.querySelector('slot[name="submenu"]');if(!n)return[];const o=n.assignedElements({flatten:!0}).filter(a=>a.localName==="wa-dropdown-item");return t?o:o.filter(a=>!a.disabled)}syncItemSizes(){(this.defaultSlot?.assignedElements({flatten:!0})??[]).filter(t=>t.localName==="wa-dropdown-item").forEach(t=>t.size=this.size)}addToSubmenuStack(e){const t=this.openSubmenuStack.indexOf(e);t!==-1?this.openSubmenuStack=this.openSubmenuStack.slice(0,t+1):this.openSubmenuStack.push(e)}removeFromSubmenuStack(){return this.openSubmenuStack.pop()}getCurrentSubmenuItem(){return this.openSubmenuStack.length>0?this.openSubmenuStack[this.openSubmenuStack.length-1]:void 0}closeAllSubmenus(){this.getItems(!0).forEach(t=>{t.submenuOpen=!1}),this.openSubmenuStack=[]}closeSiblingSubmenus(e){const t=e.closest('wa-dropdown-item:not([slot="submenu"])');let n;t?n=this.getSubmenuItems(t,!0):n=this.getItems(!0),n.forEach(o=>{o!==e&&o.submenuOpen&&(o.submenuOpen=!1)}),this.openSubmenuStack.includes(e)||this.openSubmenuStack.push(e)}getTrigger(){return this.querySelector('[slot="trigger"]')}async showMenu(){if(!this.getTrigger()||!this.popup||!this.menu)return;const t=new za;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1;return}if(this.popup.active)return;Ko.forEach(o=>o.open=!1),this.popup.active=!0,this.open=!0,Ko.add(this),gr(this),this.syncAriaAttributes(),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("pointerdown",this.handleDocumentPointerDown),document.addEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("hide"),await Bt(this.menu,"show");const n=this.getItems();n.length>0&&(n.forEach((o,a)=>o.active=a===0),n[0].focus({preventScroll:!0})),this.dispatchEvent(new Pa)}async hideMenu(){if(!this.popup||!this.menu)return;const e=new Da({source:this});if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}this.open=!1,Ko.delete(this),co(this),this.syncAriaAttributes(),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("pointerdown",this.handleDocumentPointerDown),document.removeEventListener("mousemove",this.handleGlobalMouseMove),this.menu.classList.remove("show"),await Bt(this.menu,"hide"),this.popup.active=this.open,this.dispatchEvent(new qa)}handleMenuClick(e){const t=e.target.closest("wa-dropdown-item");if(!(!t||t.disabled)){if(t.hasSubmenu){t.submenuOpen||(this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),t.submenuOpen=!0),e.stopPropagation();return}this.makeSelection(t,e)}}async handleMenuSlotChange(){const e=this.getItems(!0);await Promise.all(e.map(o=>o.updateComplete)),this.syncItemSizes();const t=e.some(o=>o.type==="checkbox"),n=e.some(o=>o.hasSubmenu);e.forEach((o,a)=>{o.setAttribute("aria-posinset",String(a+1)),o.setAttribute("aria-setsize",String(e.length)),o.active=a===0,o.checkboxAdjacent=t,o.submenuAdjacent=n})}handleTriggerClick(){this.open=!this.open}handleSubmenuOpening(e){const t=e.detail.item;this.closeSiblingSubmenus(t),this.addToSubmenuStack(t),this.setupSubmenuPosition(t),this.processSubmenuItems(t)}setupSubmenuPosition(e){if(!e.submenuElement)return;this.cleanupSubmenuPosition(e);const t=Tr(e,e.submenuElement,()=>{this.positionSubmenu(e),this.updateSafeTriangleCoordinates(e)});this.submenuCleanups.set(e,t);const n=e.submenuElement.querySelector('slot[name="submenu"]');n&&(n.removeEventListener("slotchange",Ye.handleSubmenuSlotChange),n.addEventListener("slotchange",Ye.handleSubmenuSlotChange),Ye.handleSubmenuSlotChange({target:n}))}static handleSubmenuSlotChange(e){const t=e.target;if(!t)return;const n=t.assignedElements().filter(s=>s.localName==="wa-dropdown-item");if(n.length===0)return;const o=n.some(s=>s.hasSubmenu),a=n.some(s=>s.type==="checkbox");n.forEach(s=>{s.submenuAdjacent=o,s.checkboxAdjacent=a})}processSubmenuItems(e){if(!e.submenuElement)return;const t=this.getSubmenuItems(e,!0),n=t.some(o=>o.hasSubmenu);t.forEach(o=>{o.submenuAdjacent=n})}cleanupSubmenuPosition(e){const t=this.submenuCleanups.get(e);t&&(t(),this.submenuCleanups.delete(e))}positionSubmenu(e){if(!e.submenuElement)return;const n=this.localize.dir()==="rtl"?"left-start":"right-start";Mr(e,e.submenuElement,{placement:n,middleware:[Rr({mainAxis:0,crossAxis:-5}),Or({fallbackStrategy:"bestFit"}),Lr({padding:8,crossAxis:!0})]}).then(({x:o,y:a,placement:s})=>{e.submenuElement.setAttribute("data-placement",s),Object.assign(e.submenuElement.style,{left:`${o}px`,top:`${a}px`})})}updateSafeTriangleCoordinates(e){if(!e.submenuElement||!e.submenuOpen)return;if(document.activeElement?.matches(":focus-visible")){e.submenuElement.style.setProperty("--safe-triangle-visible","none");return}e.submenuElement.style.setProperty("--safe-triangle-visible","block");const n=e.submenuElement.getBoundingClientRect(),o=this.localize.dir()==="rtl";e.submenuElement.style.setProperty("--safe-triangle-submenu-start-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-start-y",`${n.top}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-x",`${o?n.right:n.left}px`),e.submenuElement.style.setProperty("--safe-triangle-submenu-end-y",`${n.bottom}px`)}makeSelection(e,t){const n=this.getTrigger();if(e.disabled)return;e.type==="checkbox"&&(e.checked=!e.checked);const o=new ol({item:e});this.dispatchEvent(o),o.defaultPrevented||(e.navigate(t),this.open=!1,n?.focus({preventScroll:!0}))}async syncAriaAttributes(){const e=this.getTrigger();let t;e&&(e.localName==="wa-button"?(await customElements.whenDefined("wa-button"),await e.updateComplete,t=e.shadowRoot.querySelector('[part~="base"]')):t=e,t.hasAttribute("id")||t.setAttribute("id",br("wa-dropdown-trigger-")),t.setAttribute("aria-haspopup","menu"),t.setAttribute("aria-expanded",this.open?"true":"false"),this.menu?.setAttribute("aria-expanded","false"))}render(){let e=this.didSSR&&!this.hasUpdated?this.open:this.popup?.active;return ee`
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
    `}};Ye.css=[Pn,al];b([Le("slot:not([name])")],Ye.prototype,"defaultSlot",2);b([Le("#menu")],Ye.prototype,"menu",2);b([Le("wa-popup")],Ye.prototype,"popup",2);b([R({type:Boolean,reflect:!0})],Ye.prototype,"open",2);b([R({reflect:!0})],Ye.prototype,"size",2);b([ht("size")],Ye.prototype,"handleSizeChange",1);b([R({reflect:!0})],Ye.prototype,"placement",2);b([R({type:Number})],Ye.prototype,"distance",2);b([R({type:Number})],Ye.prototype,"skidding",2);Ye=b([ot("wa-dropdown")],Ye);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var jl=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var qe=class extends xt{constructor(){super(...arguments),this.hasSlotController=new qn(this,"[default]","start","end"),this.active=!1,this.variant="default",this.size="m",this.checkboxAdjacent=!1,this.submenuAdjacent=!1,this.type="normal",this.checked=!1,this.disabled=!1,this.submenuOpen=!1,this.hasSubmenu=!1,this.handleSlotChange=()=>{this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState(),this.hasSubmenu?(this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",this.submenuOpen?"true":"false")):(this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"))},this.handleHostClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handleClick=e=>{this.disabled&&(e.preventDefault(),e.stopImmediatePropagation())},this.handlePointerEnter=e=>{e.pointerType==="mouse"&&this.hasSubmenu&&!this.disabled&&(this.notifyParentOfOpening(),this.submenuOpen=!0)}}handleSizeChange(){yn(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener?.("click",this.handleHostClick),this.addEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.addEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.addEventListener?.("slotchange",this.handleSlotChange)}disconnectedCallback(){super.disconnectedCallback(),this.closeSubmenu(),this.removeEventListener?.("click",this.handleHostClick),this.removeEventListener?.("pointerenter",this.handlePointerEnter),this.shadowRoot?.removeEventListener?.("click",this.handleClick,{capture:!0}),this.shadowRoot?.removeEventListener?.("slotchange",this.handleSlotChange)}firstUpdated(e){super.firstUpdated(e),this.setAttribute("tabindex","-1"),this.hasSubmenu=this.hasSlotController.test("submenu"),this.updateHasSubmenuState()}updated(e){e.has("active")&&(this.setAttribute("tabindex",this.active?"0":"-1"),this.customStates.set("active",this.active)),e.has("checked")&&(this.type==="checkbox"?this.setAttribute("aria-checked",this.checked?"true":"false"):this.removeAttribute("aria-checked"),this.customStates.set("checked",this.checked)),e.has("disabled")&&(this.setAttribute("aria-disabled",this.disabled?"true":"false"),this.customStates.set("disabled",this.disabled)),e.has("type")&&(this.type==="checkbox"?(this.setAttribute("role","menuitemcheckbox"),this.setAttribute("aria-checked",this.checked?"true":"false")):(this.setAttribute("role","menuitem"),this.removeAttribute("aria-checked"))),(e.has("href")||e.has("hasSubmenu"))&&this.customStates.set("link",this.isLink()),e.has("submenuOpen")&&(this.customStates.set("submenu-open",this.submenuOpen),this.submenuOpen?this.openSubmenu():this.closeSubmenu())}updateHasSubmenuState(){this.customStates.set("has-submenu",this.hasSubmenu)}async openSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||!this.isConnected||(this.notifyParentOfOpening(),e.showPopover?.(),e.hidden=!1,e.setAttribute("data-visible",""),this.submenuOpen=!0,this.setAttribute("aria-expanded","true"),await Bt(e,"show"),setTimeout(()=>{const t=this.getSubmenuItems();t.length>0&&(t.forEach((n,o)=>n.active=o===0),t[0].focus({preventScroll:!0}))},0))}notifyParentOfOpening(){const e=new CustomEvent("submenu-opening",{bubbles:!0,composed:!0,detail:{item:this}});this.dispatchEvent(e);const t=this.parentElement;t&&[...t.children].filter(o=>o!==this&&o.localName==="wa-dropdown-item"&&o.getAttribute("slot")===this.getAttribute("slot")&&o.submenuOpen).forEach(o=>{o.submenuOpen=!1})}async closeSubmenu(){const e=this.submenuElement;!this.hasSubmenu||!e||(this.submenuOpen=!1,this.setAttribute("aria-expanded","false"),e.hidden||(await Bt(e,"hide"),e?.isConnected&&(e.hidden=!0,e.removeAttribute("data-visible"),e.hidePopover?.())))}isLink(){return!!this.href&&!this.hasSubmenu}navigate(e){const t=this.linkElement;!this.isLink()||this.disabled||!t||t.dispatchEvent(new MouseEvent("click",{bubbles:!1,cancelable:!0,composed:!1,altKey:e?.altKey??!1,ctrlKey:e?.ctrlKey??!1,metaKey:e?.metaKey??!1,shiftKey:e?.shiftKey??!1}))}getSubmenuItems(){return[...this.children].filter(e=>e.localName==="wa-dropdown-item"&&e.getAttribute("slot")==="submenu"&&!e.hasAttribute("disabled"))}render(){return ee`
      ${this.href?ee`
            <a
              id="link"
              href=${this.href}
              target=${We(this.target)}
              rel=${We(this.rel)}
              download=${We(this.download)}
              tabindex="-1"
              aria-hidden="true"
            ></a>
          `:""}
      ${this.type==="checkbox"?ee`
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

      ${this.hasSubmenu?ee`
            <wa-icon
              id="submenu-indicator"
              part="submenu-icon"
              exportparts="svg:submenu-icon__svg"
              library="system"
              name="chevron-right"
            ></wa-icon>
          `:""}
      ${this.hasSubmenu?ee`
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
    `}};qe.css=jl;b([Le("#submenu")],qe.prototype,"submenuElement",2);b([Le("#link")],qe.prototype,"linkElement",2);b([R({type:Boolean})],qe.prototype,"active",2);b([R({reflect:!0})],qe.prototype,"variant",2);b([R({reflect:!0})],qe.prototype,"size",2);b([ht("size")],qe.prototype,"handleSizeChange",1);b([R({attribute:"checkbox-adjacent",type:Boolean,reflect:!0})],qe.prototype,"checkboxAdjacent",2);b([R({attribute:"submenu-adjacent",type:Boolean,reflect:!0})],qe.prototype,"submenuAdjacent",2);b([R()],qe.prototype,"value",2);b([R({reflect:!0})],qe.prototype,"type",2);b([R({type:Boolean})],qe.prototype,"checked",2);b([R({type:Boolean,reflect:!0})],qe.prototype,"disabled",2);b([R({type:Boolean,reflect:!0})],qe.prototype,"submenuOpen",2);b([R({reflect:!0})],qe.prototype,"href",2);b([R()],qe.prototype,"target",2);b([R()],qe.prototype,"rel",2);b([R()],qe.prototype,"download",2);b([wn()],qe.prototype,"hasSubmenu",2);qe=b([ot("wa-dropdown-item")],qe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Wl=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Ul=Qe`
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
`;function Vl(e){return Kl(e)}function Jo(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function Kl(e){for(let t=e;t;t=Jo(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=Jo(e);t;t=Jo(t)){if(!(t instanceof Element))continue;const n=getComputedStyle(t);if(n.display!=="contents"&&(n.position!=="static"||Oo(n)||t.tagName==="BODY"))return t}return null}/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */function ps(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var Jl=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),xe=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){const e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let o=0,a=0,s=0,r=0,i=0,l=0,c=0,d=0;n?e.top<t.top?(o=e.left,a=e.bottom,s=e.right,r=e.bottom,i=t.left,l=t.top,c=t.right,d=t.top):(o=t.left,a=t.bottom,s=t.right,r=t.bottom,i=e.left,l=e.top,c=e.right,d=e.top):e.left<t.left?(o=e.right,a=e.top,s=t.left,r=t.top,i=e.right,l=e.bottom,c=t.left,d=t.bottom):(o=t.right,a=t.top,s=e.left,r=e.top,i=t.right,l=t.bottom,c=e.left,d=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${a}px`),this.style.setProperty("--hover-bridge-top-right-x",`${s}px`),this.style.setProperty("--hover-bridge-top-right-y",`${r}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${i}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${d}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=Jl,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||ps(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Tr(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;const e=[Rr({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(hs({apply:({rects:o})=>{const a=this.sync==="width"||this.sync==="both",s=this.sync==="height"||this.sync==="both";this.popup.style.width=a?`${o.reference.width}px`:"",this.popup.style.height=s?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!ps(this.anchor)&&this.boundary==="scroll"&&(t=An(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(Or({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Lr({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(hs({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:a})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${a}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(Fl({element:this.arrowEl,padding:this.arrowPadding}));const n=this.SUPPORTS_POPOVER?o=>ao.getOffsetParent(o,Vl):ao.getOffsetParent;Mr(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...ao,getOffsetParent:n}}).then(({x:o,y:a,middlewareData:s,placement:r})=>{const i=this.localize.dir()==="rtl",l={top:"bottom",right:"left",bottom:"top",left:"right"}[r.split("-")[0]];if(this.setAttribute("data-current-placement",r),Object.assign(this.popup.style,{left:`${o}px`,top:`${a}px`}),this.arrow){const c=s.arrow.x,d=s.arrow.y;let u="",w="",f="",p="";if(this.arrowPlacement==="start"){const x=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",w=i?x:"",p=i?"":x}else if(this.arrowPlacement==="end"){const x=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";w=i?"":x,p=i?x:"",f=typeof d=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(p=typeof c=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof d=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(p=typeof c=="number"?`${c}px`:"",u=typeof d=="number"?`${d}px`:"");Object.assign(this.arrowEl.style,{top:u,right:w,bottom:f,left:p,[l]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new Wl)}render(){return ee`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${gt({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${gt({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?ee`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};xe.css=Ul;b([Le(".popup")],xe.prototype,"popup",2);b([Le(".arrow")],xe.prototype,"arrowEl",2);b([R({attribute:!1,type:Boolean})],xe.prototype,"SUPPORTS_POPOVER",2);b([R()],xe.prototype,"anchor",2);b([R({type:Boolean,reflect:!0})],xe.prototype,"active",2);b([R({reflect:!0})],xe.prototype,"placement",2);b([R()],xe.prototype,"boundary",2);b([R({type:Number})],xe.prototype,"distance",2);b([R({type:Number})],xe.prototype,"skidding",2);b([R({type:Boolean})],xe.prototype,"arrow",2);b([R({attribute:"arrow-placement"})],xe.prototype,"arrowPlacement",2);b([R({attribute:"arrow-padding",type:Number})],xe.prototype,"arrowPadding",2);b([R({type:Boolean})],xe.prototype,"flip",2);b([R({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],xe.prototype,"flipFallbackPlacements",2);b([R({attribute:"flip-fallback-strategy"})],xe.prototype,"flipFallbackStrategy",2);b([R({type:Object})],xe.prototype,"flipBoundary",2);b([R({attribute:"flip-padding",type:Number})],xe.prototype,"flipPadding",2);b([R({type:Boolean})],xe.prototype,"shift",2);b([R({type:Object})],xe.prototype,"shiftBoundary",2);b([R({attribute:"shift-padding",type:Number})],xe.prototype,"shiftPadding",2);b([R({attribute:"auto-size"})],xe.prototype,"autoSize",2);b([R()],xe.prototype,"sync",2);b([R({type:Object})],xe.prototype,"autoSizeBoundary",2);b([R({attribute:"auto-size-padding",type:Number})],xe.prototype,"autoSizePadding",2);b([R({attribute:"hover-bridge",type:Boolean})],xe.prototype,"hoverBridge",2);xe=b([ot("wa-popup")],xe);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Gl=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Tn=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${as(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${as(this.value,0,100)}%`)}),super.updated(e)}render(){return ee`
      <div
        part="base progress-bar"
        class="progress-bar"
        role="progressbar"
        title=${We(this.title)}
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate?"0":this.value}
      >
        <div part="indicator" class="indicator">
          ${this.indeterminate?"":ee` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};Tn.css=Gl;b([R({type:Number,reflect:!0})],Tn.prototype,"value",2);b([R({type:Boolean,reflect:!0})],Tn.prototype,"indeterminate",2);b([R()],Tn.prototype,"label",2);Tn=b([ot("wa-progress-bar")],Tn);/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Yl=Qe`
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
`;/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */var Rt=class extends xt{constructor(){super(...arguments),this.localize=new Lt(this),this.resizeObserver=null,this.canScroll=!1,this.orientation="horizontal",this.withoutScrollbar=!1,this.withoutShadow=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.updateScroll()),this.resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}handleKeyDown(e){e.key==="Home"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?0:void 0,top:this.orientation==="vertical"?0:void 0})),e.key==="End"&&(e.preventDefault(),this.content.scrollTo({left:this.orientation==="horizontal"?this.content.scrollWidth:void 0,top:this.orientation==="vertical"?this.content.scrollHeight:void 0}))}handleSlotChange(){this.updateScroll()}updateScroll(){if(this.orientation==="horizontal"){const e=Math.ceil(this.content.clientWidth),t=Math.abs(Math.ceil(this.content.scrollLeft)),o=Math.ceil(this.content.scrollWidth)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}else{const e=Math.ceil(this.content.clientHeight),t=Math.abs(Math.ceil(this.content.scrollTop)),o=Math.ceil(this.content.scrollHeight)-e;this.canScroll=o>0;const a=Math.min(1,t/(o*.05)),s=Math.min(1,(o-t)/(o*.05));this.style.setProperty("--start-shadow-opacity",String(a||0)),this.style.setProperty("--end-shadow-opacity",String(s||0))}}render(){return ee`
      ${this.withoutShadow?"":ee`
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
    `}};Rt.css=[Yl];b([Le("#content")],Rt.prototype,"content",2);b([wn()],Rt.prototype,"canScroll",2);b([R({reflect:!0})],Rt.prototype,"orientation",2);b([R({attribute:"without-scrollbar",type:Boolean,reflect:!0})],Rt.prototype,"withoutScrollbar",2);b([R({attribute:"without-shadow",type:Boolean,reflect:!0})],Rt.prototype,"withoutShadow",2);b([Di({passive:!0})],Rt.prototype,"updateScroll",1);Rt=b([ot("wa-scroller")],Rt);const Zn=["People","Routines","Rooms","Temperatures","Result"],fo=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],Xl=Object.fromEntries(fo.map(e=>[e.slice(0,3),e])),Ql=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"]],Nr=[["shared","Shared","Warm while its people are up and at home, and first thing in the morning even if they then go out."],["bedroom","Bedroom","Warm when its people get up and in the run-up to bed."],["office","Office","Warm while its people work from home."],["while_home","While anyone is home","Warm whenever its people are up and at home, working or not."],["all_day","All day","Warm from the first of its people getting up to the last going to bed, home or not."]],zr={weekdays:{up:"07:00",bed:"22:30",periods:[{type:"out",from:"08:30",to:"17:30"}]},weekend:{up:"08:30",bed:"23:00",periods:[]}},ja=e=>JSON.parse(JSON.stringify(e));function on(e,{end:t=!1}={}){const n=String(e??"").trim().replace(".",":");let o,a,s=n.match(/^(\d{1,2}):(\d{2})$/);if(s)[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})(\d{2})$/))[o,a]=[Number(s[1]),Number(s[2])];else if(s=n.match(/^(\d{1,2})$/))[o,a]=[Number(s[1]),0];else return null;return a>59||o>24||o===24&&(a>0||!t)?null:`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function Zl(e,t){const n=String(e??"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,32)||"person",o=new Set(t);if(n!=="person"&&!o.has(n))return n;for(let a=1;;a++){const s=`${n}_${a}`;if(!o.has(s))return s}}function Dr(e,t=""){const n=t||`Person ${e.people.length+1}`,o=Zl(n,e.people.map(a=>a.id));return e.people.push({id:o,name:n,...ja(zr),weekendSame:!1,getting_up_min:null,bedtime_min:null,weekend_days:null,ha_person:null}),o}const pa=e=>e?.ha_persons?.persons??null;function qr(e,t,n=[]){const o=String(e??"").trim().toLocaleLowerCase();if(!o||!t)return null;const a=t.filter(s=>String(s.name??"").trim().toLocaleLowerCase()===o&&!n.includes(s.entity_id));return a.length===1?a[0].entity_id:null}function ec(e,t){if(!(!t||e.people.some(n=>n.ha_person)))for(const n of e.people){const o=e.people.map(a=>a.ha_person).filter(Boolean);n.ha_person=qr(n.name,t,o)}}function tc(e,t){const n=e.map(a=>a.name),o=[["","Not linked"]];for(const a of e){const s=n.indexOf(a.name)!==n.lastIndexOf(a.name);o.push([a.entity_id,s?`${a.name} (${a.entity_id})`:a.name])}return t&&!e.some(a=>a.entity_id===t)&&o.push([t,`${t}, not in Home Assistant now`]),o}const fs=e=>e?`Linked people count as away once Home Assistant has said they're out for ${jn(e)}.`:"Linked people count as away as soon as Home Assistant says they're out.";function nc(e,t){e.people=e.people.filter(n=>n.id!==t);for(const n of e.rooms)n.people&&(n.people=n.people.filter(o=>o!==t),n.people.length||(n.people=null,n.kind==="office"&&(n.kind="shared")))}const oc=(e,t)=>e.rooms.find(n=>!n.own&&n.kind==="office"&&n.people?.includes(t))?.id??null;function ac(e,t,n){for(const s of e.rooms)s.kind!=="office"||!s.people?.includes(t)||s.id===n||(s.people=s.people.filter(r=>r!==t),s.people.length||(s.people=null,s.kind="shared"));if(n==null)return;const o=e.rooms.find(s=>s.id===n);if(!o)return;o.own=!1;const a=o.kind==="office"?o.people??[]:[];o.kind="office",o.use==="unused"&&(o.use="in_use"),o.people=[...new Set([...a,t])]}const sc=e=>[e.weekdays,...e.weekendSame?[]:[e.weekend]].some(t=>t.periods.some(n=>n.type==="work"));function ms(e){const t=o=>o==null?[]:Array.isArray(o)?o:[o],n=[];for(const o of["out","work"])for(const a of t(e?.[o])){const[s,r]=String(a).split("-");n.push({type:o,from:s??"",to:r??""})}return n.sort((o,a)=>o.from.localeCompare(a.from)),{up:e?.up??"07:00",bed:e?.bed??"22:30",periods:n}}const gs=e=>(e??[]).map(t=>Xl[String(t).toLowerCase().slice(0,3)]??t);function bs(e){const t=e.household,n=e.defaults,o={people:[],rooms:[],temperatures:{...n.temperatures,...t?.temperatures??{}},timing:{...n.timing,...t?.timing??{}},away:{...n.away,...t?.away??{}},weekend_days:gs(t?.weekend_days??n.weekend_days)};if(t)for(const[a,s]of Object.entries(t.people??{}))o.people.push({id:a,name:s.name??a.replace(/_/g," ").replace(/^./,r=>r.toUpperCase()),weekdays:ms(s.weekdays),weekend:ms(s.weekend??s.weekdays),weekendSame:s.weekend==null,getting_up_min:s.getting_up_min??null,bedtime_min:s.bedtime_min??null,weekend_days:s.weekend_days?gs(s.weekend_days):null,ha_person:s.ha_person??null});else Dr(o);ec(o,pa(e));for(const a of e.rooms){const s=t?.rooms?.[a.id],r={id:a.id,name:a.name,schedule:a.schedule,own:!1,use:"in_use",weekendUse:"in_use",weekendDifferent:!1,kind:"shared",people:null,temperature:null,night_temperature:null,unused_temperature:null,preheat_min:null,adjust:[]};if(s){const i=s.use;r.use=typeof i=="object"?i.weekdays:i,r.weekendUse=typeof i=="object"?i.weekend:i,r.weekendDifferent=typeof i=="object"&&i.weekdays!==i.weekend,r.kind=s.kind??"shared",r.people=s.people??null;for(const l of["temperature","night_temperature","unused_temperature","preheat_min"])r[l]=s[l]??null;r.adjust=ja(s.adjust??[])}else t&&a.schedule?r.own=!0:!t&&/bed/i.test(a.name)&&(r.kind="bedroom");o.rooms.push(r)}return o}const mo=(e,t=!1)=>on(e,{end:t})??String(e??""),rc=e=>`${mo(e.from)}-${mo(e.to,!0)}`;function ws(e){const t={up:mo(e.up)};for(const n of["out","work"]){const o=e.periods.filter(a=>a.type===n).map(rc);o.length&&(t[n]=o)}return t.bed=mo(e.bed,!0),t}function ys(e){const t=e.people.map(a=>a.id),n={};for(const a of e.people){const s={name:a.name,weekdays:ws(a.weekdays)};a.weekendSame||(s.weekend=ws(a.weekend)),a.getting_up_min!=null&&(s.getting_up_min=a.getting_up_min),a.bedtime_min!=null&&(s.bedtime_min=a.bedtime_min),a.weekend_days!=null&&(s.weekend_days=[...a.weekend_days]);const r=String(a.ha_person??"").trim();r&&(s.ha_person=r),n[a.id]=s}const o={};for(const a of e.rooms){if(a.own)continue;const s={use:a.weekendDifferent&&a.weekendUse!==a.use?{weekdays:a.use,weekend:a.weekendUse}:a.use};a.kind!=="shared"&&(s.kind=a.kind),a.people!=null?s.people=[...a.people]:(a.kind==="bedroom"||a.kind==="office")&&(s.people=[...t]);for(const r of["temperature","night_temperature","unused_temperature","preheat_min"])a[r]!=null&&(s[r]=a[r]);a.adjust?.length&&(s.adjust=ja(a.adjust)),o[a.id]=s}return{weekend_days:[...e.weekend_days],timing:{...e.timing},away:{...e.away},temperatures:{...e.temperatures},people:n,rooms:o}}function so(e,t){const n={out:0,work:0};return t.map(o=>`${e}.${o.type}[${n[o.type]++}]`)}function ic(e,t){let n=null;for(const o of e)t!==o&&!t.startsWith(`${o}.`)&&!t.startsWith(`${o}[`)||(!n||o.length>n.length)&&(n=o);return n}function vs(e,t){const n=t.split(".");if(n[0]!=="household")return{step:4,person:0};const o=(n[1]??"").replace(/\[.*$/,"");if(o==="people"){const a=Math.max(0,e.people.findIndex(s=>s.id===n[2]));return n.length<=3||n[3]==="name"||n[3]==="ha_person"?{step:0,person:a}:{step:1,person:a}}return o==="away"?{step:0,person:0}:o==="rooms"?{step:2,person:0}:o==="temperatures"||o==="timing"||o==="weekend_days"?{step:3,person:0}:{step:4,person:0}}function lc(e){const t=[];for(const n of e.people)for(const o of n.weekendSame?["weekdays"]:["weekdays","weekend"]){const a=n[o],s=`household.people.${n.id}.${o}`;on(a.up)||t.push({path:`${s}.up`,message:"Enter a time such as 07:30"}),on(a.bed,{end:!0})||t.push({path:`${s}.bed`,message:"Enter a time such as 22:30"}),so(s,a.periods).forEach((r,i)=>{const{from:l,to:c}=a.periods[i];(!on(l)||!on(c,{end:!0}))&&t.push({path:r,message:"Enter both times, such as 08:30 and 17:30"})})}return t}const cc=e=>Nr.find(t=>t[0]===e)?.[2]??"",dc=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,eo=(e,t)=>typeof e=="number"&&e<t?`Below ${t}° walls and window frames can get damp, especially in older houses.`:"";function jn(e,t=null){if(t!=null&&e===t)return"off";if(e<60)return`${e} min`;const n=e%60;return n?`${Math.floor(e/60)} h ${n} min`:`${e/60} h`}const uc=e=>e.length?dc(fo.filter(t=>e.includes(t)).map(t=>t[0].toUpperCase()+t.slice(1))):"no days";function hc(e){const t=e.reduce((o,a)=>o+(a.notes?.length??0),0);return t?`${t===1?"1 warm period is":`${t} warm periods are`} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`:""}const Wt=1440,Rn=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],pc=34,an=15,fa=Rn.map(e=>e.slice(0,3).toLowerCase()),fc=["00:00","06:00","12:00","18:00","24:00"],Wa=e=>`${Number.isInteger(e)?e:e.toFixed(1)}°`,rt=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,dt=e=>`${e/Wt*100}%`,Ua=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`;function mc(e,t=null){const n=[];for(const o of e)for(const a of o.days)for(const s of a.transitions)n.push(s.setpoint);return t&&n.push(...Object.values(t).filter(o=>typeof o=="number")),n.length?{low:Math.min(...n),high:Math.max(...n)}:{low:0,high:0}}function gc(e){let t=1/0;for(const n of e.days)for(const o of n.transitions)t=Math.min(t,o.setpoint);return Number.isFinite(t)?t:0}function bc(e,t,n=t.low){const o=[...e].filter(r=>r.minute>=0&&r.minute<Wt).sort((r,i)=>r.minute-i.minute);if(!o.length)return[];o[0].minute>0&&o.unshift({minute:0,setpoint:o.at(-1).setpoint});const a=[];o.forEach((r,i)=>{const l=i+1<o.length?o[i+1].minute:Wt;if(l<=r.minute)return;const c=a.at(-1);c&&c.setpoint===r.setpoint?c.end=l:a.push({start:r.minute,end:l,setpoint:r.setpoint})});const s=t.high-t.low;return a.map(r=>({...r,warm:r.setpoint>n,level:s>0?Math.min(1,Math.max(0,(r.setpoint-t.low)/s)):1}))}function wc(e,t){const n=[];let o=0;for(const a of e){if(!a.warm)continue;const s=Math.min(Math.max(a.start,o),Wt-t);s<o||s>=a.end||(n.push({minute:s,text:Wa(a.setpoint)}),o=s+t)}return n}const yc=(e,t)=>t<e.minute?(e.weekday+1)%7:e.weekday;function vc(e){if(!e)return[];const t=[["in_use","In use"],["occasional","Occasional"],["unused","Unused"],["night","Night"]],n=new Map;for(const[o,a]of t){const s=e[o];typeof s=="number"&&n.set(s,[...n.get(s)??[],a])}return[...n.entries()].sort((o,a)=>a[0]-o[0]).map(([o,a])=>({label:Ua(a.map((s,r)=>r?s.toLowerCase():s)),setpoint:o}))}const kc=e=>`Usually ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`,$c=(e,t=an)=>Math.round(e/t)*t,to=e=>Number(e.slice(0,2))*60+Number(e.slice(3,5)),ks=(e,t)=>Math.min(t.max,Math.max(t.min,$c(e)));function xc(e,t,n){const o=e[t];return n==="start"?{min:t>0?e[t-1].end:0,max:o.end-an}:{min:o.start+an,max:t+1<e.length?e[t+1].start:Wt}}function Sc(e,t){const n=a=>JSON.stringify([a.transitions,a.periods??[]]),o=n(e.days[t]);return e.days.flatMap((a,s)=>n(a)===o?[s]:[])}function _c(e){if(e.length===7)return"Every day";const t=a=>Rn[a].slice(0,3),n=[];for(const a of[...e].sort((s,r)=>s-r)){const s=n.at(-1);s&&a===s[1]+1?s[1]=a:n.push([a,a])}const o=[];for(const[a,s]of n)if(s-a>=2)o.push(`${t(a)} to ${t(s)}`);else for(let r=a;r<=s;r++)o.push(t(r));return Ua(o)}function Cc(e,t=["saturday","sunday"]){const n=[...new Set(e)].sort((s,r)=>s-r),o=Rn.flatMap((s,r)=>t.includes(s.toLowerCase())?[r]:[]),a=s=>s.length===n.length&&s.every((r,i)=>r===n[i]);return n.length===7?"daily":a(o)?"weekend":a([0,1,2,3,4,5,6].filter(s=>!o.includes(s)))?"weekdays":n.length===1?fa[n[0]]:n.map(s=>fa[s])}function Ec(e,t,n){if(n===t)return null;const o=n>t;return e==="end"?o?{keep:"warm",from:t,to:n}:{keep:"cold",from:n,to:t}:o?{keep:"cold",from:t,to:n}:{keep:"warm",from:n,to:t}}function $s(e,t){const n=i=>JSON.stringify([i.days].flat());let o=to(t.from),a=to(t.to);const s=[];let r=!1;for(const i of e??[]){if(n(i)!==n(t)){s.push(i);continue}const l=to(i.from),c=to(i.to);if(i.keep===t.keep){if(l<=a&&c>=o){o=Math.min(o,l),a=Math.max(a,c);continue}s.push(i)}else l<a&&c>o?(l===o&&c===a&&(r=!0),l<o&&s.push({...i,to:rt(o)}),c>a&&s.push({...i,from:rt(a)})):s.push(i)}return r?s:[...s,{...t,from:rt(o),to:rt(a)}]}function Go(e,t,n){const o=JSON.parse(JSON.stringify(e)),a=o?.rooms?.[t];if(!a)throw new Error(`${t} is not in the household`);const s=n(a.adjust??[]);return s.length?a.adjust=s:delete a.adjust,o}const Ac=(e,t,n,o)=>`${e}, ${t}, warm ${n==="end"?"until":"from"} ${rt(o)}`,Tc=(e,t,n,o)=>`${e}: warm ${t==="end"?"until":"from"} ${rt(o)}, not ${rt(n)}.`,Rc=e=>`Without adjustments: ${e.map(t=>`${t.days}: ${t.text}`).join("; ")}.`;function xs(e){return e?.saved_at?e.source==="house_file"?`Saving copies the household, with this change, to ${e.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`:"":"In the demo, changes last until you close the page."}const Lc=[["daily","Every day"],["weekdays","Weekdays"],["weekend","Weekend"],...Rn.map((e,t)=>[fa[t],e])],ce=(e,t,n)=>{const o=document.createElement(e);return t&&(o.className=t),n!=null&&(o.textContent=n),o};function Oc(e,t,n,o){const a=ce("li","week-day");a.append(ce("span","week-dname",Rn[t].slice(0,3)));const s=ce("div","week-lane"),r=ce("div","week-labels");r.setAttribute("aria-hidden","true");const i=ce("div","week-track");i.setAttribute("role","img"),a.day={name:Rn[t],text:e.text};for(const l of n){if(!l.warm)continue;const c=ce("i","week-block");c.style.left=dt(l.start),c.style.width=dt(l.end-l.start),c.style.setProperty("--level",l.level.toFixed(3)),c.title=`${Wa(l.setpoint)} ${rt(l.start)} to ${rt(l.end)}`,c.dataset.start=String(l.start),c.dataset.end=String(l.end),i.append(c)}for(const l of e.adjusted??[]){const c=ce("i","week-adj");c.dataset.keep=l.keep,c.style.left=dt(l.start),c.style.width=dt(l.end-l.start),i.append(c)}return s.append(r,i),a.append(s),a.segments=n,Pr(a,o),a}function Pr(e,t){t?e.setAttribute("aria-current","date"):e.removeAttribute("aria-current");const n=`${e.day.name}${t?", today":""}: ${e.day.text}`;e.querySelector(".week-track").setAttribute("aria-label",n)}function Ss(e){const n=e.querySelector(".week-track")?.getBoundingClientRect().width??0;if(!n)return;const o=Math.ceil(pc/n*Wt);if(e.dataset.labelMin!==String(o)){e.dataset.labelMin=String(o);for(const a of e.querySelectorAll(".week-day")){const s=a.querySelector(".week-labels");s.textContent="";for(const r of wc(a.segments,o)){const i=ce("span",null,r.text);i.style.left=dt(r.minute),s.append(i)}}}}function Mc(e,t,n){const o=ce("article","card week");o.dataset.away=String(!!e.away);const a=ce("header");a.append(ce("h3","name",e.name)),a.append(ce("span","badge",e.source==="household"?"Household":"Hand-written")),o.append(a),e.away&&(o.append(ce("p","week-away",e.away.text)),o.append(ce("p","week-usual",kc(e.away.usual))));const s=gc(e),r=ce("ol","week-days");r.setAttribute("aria-label",`${e.name}, Monday to Sunday`),e.days.forEach((d,u)=>r.append(Oc(d,u,bc(d.transitions,t,s),u===n))),o.append(r);const i=ce("div","week-ticks");i.setAttribute("aria-hidden","true");for(const d of fc)i.append(ce("span",null,d));o.append(i);const l=ce("dl","week-summary");for(const d of e.summary){const u=ce("div");u.append(ce("dt",null,d.days),ce("dd",null,d.text)),l.append(u)}o.append(l);for(const d of e.notes)o.append(ce("p","flag",d));e.people.length&&o.append(ce("p","week-meta",`Depends on ${Ua(e.people.map(d=>d.name))}.`));const c=ce("i","week-now");return c.setAttribute("aria-hidden","true"),o.append(c),o}const en=(e,t,n="button")=>{const o=ce("button",e,t);return o.type=n,o},Yo=e=>{const t=String(e??"").trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function Nc(e,t,n){const{editor:o}=n,a=[...e.querySelectorAll(".week-day")],s=[];let r=null,i=null,l=!1,c=0,d=null;const u=ce("div","week-edit"),w=ce("div","week-pending");w.hidden=!0;const f=ce("p","week-pending-what");f.setAttribute("aria-live","polite");const p=ce("p","week-pending-then");p.setAttribute("aria-live","polite");const x=ce("p","week-source"),h=ce("p","week-error");h.setAttribute("role","alert"),h.hidden=!0;const y=en("btn btn-primary","Save"),g=en("btn","Cancel"),k=ce("div","week-buttons");k.append(y,g),w.append(f,p,x,h,k),u.append(w);function T(q,ne){if(q.value=ne,q.style.left=dt(ne),q.getAttribute("role")!=="slider")return;const{label:te,edge:ue}=q.edit;q.setAttribute("aria-valuenow",String(ne)),q.setAttribute("aria-valuetext",rt(ne)),q.setAttribute("aria-label",Ac(t.name,te,ue,ne))}t.days.forEach((q,ne)=>{const te=q.periods??[];if(!te.length||t.away)return;const ue=Sc(t,ne),we=_c(ue),Ie=a[ne].querySelector(".week-track");te.forEach((Se,Pe)=>{for(const Be of["start","end"]){const Me=ce("span","week-edge");Me.dataset.edge=Be,Me.dataset.key=`${ue[0]}:${Pe}:${Be}`,Me.edit={row:ne,group:ue,label:we,periods:te,index:Pe,edge:Be,was:Se[Be],bounds:xc(te,Pe,Be)},ue[0]===ne?(Me.tabIndex=0,Me.setAttribute("role","slider"),Me.setAttribute("aria-valuemin",String(Me.edit.bounds.min)),Me.setAttribute("aria-valuemax",String(Me.edit.bounds.max))):Me.setAttribute("aria-hidden","true"),T(Me,Se[Be]),Q(Me),Ie.append(Me),s.push(Me)}})});const A=q=>s.find(ne=>ne.dataset.key===q&&ne.tabIndex===0);function N(q,ne){const{group:te,periods:ue,index:we,edge:Ie,row:Se}=q.edit,Pe=ue[we],[Be,Me]=Ie==="start"?[ne,Pe.end]:[Pe.start,ne];for(const St of s)St.dataset.key===q.dataset.key&&T(St,ne);for(const St of te){const vn=a[St].querySelector(`.week-block[data-start="${Pe.start}"][data-end="${Pe.end}"]`);vn&&(vn.style.left=dt(Be),vn.style.width=dt(Me-Be)),a[St].dataset.editing="true"}let ge=e.querySelector(".week-drag-label");ge||(ge=ce("span","week-drag-label"),ge.setAttribute("aria-hidden","true"));const lt=a[Se].querySelector(".week-labels");ge.parentElement!==lt&&lt.append(ge),ge.textContent=rt(ne);const Xt=Number(e.dataset.labelMin||120)*1.4;ge.style.left=dt(Math.min(Wt-Xt,Math.max(0,ne-Xt/2)))}function X(){for(const q of s)T(q,q.edit.was);for(const q of e.querySelectorAll(".week-block"))q.style.left=dt(Number(q.dataset.start)),q.style.width=dt(Number(q.dataset.end)-Number(q.dataset.start));for(const q of a)delete q.dataset.editing;e.querySelector(".week-drag-label")?.remove()}function Q(q){q.addEventListener("pointerdown",te=>{i||l||te.pointerType==="mouse"&&te.button!==0||(r&&r.h.dataset.key!==q.dataset.key&&P(),te.preventDefault(),q.setPointerCapture?.(te.pointerId),i={id:te.pointerId,h:q,rect:q.parentElement.getBoundingClientRect()},e.dataset.dragging="true")}),q.addEventListener("pointermove",te=>{if(!i||te.pointerId!==i.id||!i.rect.width)return;const ue=ks((te.clientX-i.rect.left)/i.rect.width*Wt,q.edit.bounds);ue!==q.value&&N(q,ue)});const ne=(te,ue)=>{!i||te.pointerId!==i.id||(i=null,delete e.dataset.dragging,ue?ae(q,q.value,!1):r?N(r.h,r.now):P())};q.addEventListener("pointerup",te=>ne(te,!0)),q.addEventListener("pointercancel",te=>ne(te,!1)),q.addEventListener("keydown",te=>{const ue={ArrowLeft:-an,ArrowDown:-an,ArrowRight:an,ArrowUp:an,PageDown:-60,PageUp:60};let we;if(te.key in ue)we=ks(q.value+ue[te.key],q.edit.bounds);else if(te.key==="Home")we=q.edit.bounds.min;else if(te.key==="End")we=q.edit.bounds.max;else if(te.key==="Enter"){te.preventDefault(),r&&m();return}else if(te.key==="Escape"){r&&(te.preventDefault(),P());return}else return;te.preventDefault(),r&&r.h.dataset.key!==q.dataset.key&&P(),N(q,we),ae(q,we,!0)})}function ae(q,ne,te){if(ne===q.edit.was){P();return}const{label:ue,edge:we,was:Ie}=q.edit,Se=r?.h.dataset.key===q.dataset.key;r={h:q,now:ne,keyboard:te,info:Se?r.info:null},w.hidden=!1,f.textContent=Tc(ue,we,Ie,ne),p.textContent="Checking…",h.hidden=!0,y.disabled=!0,clearTimeout(d),d=setTimeout(B,te?400:0)}async function _(q){q.info??=await o.household();const{edge:ne,was:te,group:ue}=q.h.edit,we=Ec(ne,te,q.now),Ie={days:Cc(ue,n.weekend),keep:we.keep,from:rt(we.from),to:rt(we.to)};return Go(q.info.household,t.id,Se=>$s(Se,Ie))}function V(q){p.textContent="",h.textContent=q,h.hidden=!1,y.disabled=!0}async function B(){const q=++c,ne=r;if(!ne)return;let te;try{te=await o.preview(await _(ne))}catch{q===c&&V("Couldn't check the change. Check the connection and try again.");return}if(q!==c||ne!==r)return;if(x.textContent=xs(ne.info),x.hidden=!x.textContent,te.errors?.length){V(Yo(te.errors[0].message));return}const ue=te.rooms.find(Se=>Se.id===t.id),we=ue?ue.summary.map(Se=>`${Se.days}: ${Se.text}`).join("; "):"",Ie=(ue?.notes??[]).filter(Se=>!t.notes.includes(Se));p.textContent=[we&&`${we}.`,...Ie].filter(Boolean).join(" "),y.disabled=!1}async function m(){const q=r;if(!q)return;clearTimeout(d);const ne=++c;y.disabled=!0,p.textContent="Saving…",h.hidden=!0;let te=null;try{te=await o.save(await _(q))}catch{}if(ne!==c||q!==r)return;if(te?.status===200){r=null,n.saved(`Saved. ${t.name} follows its new week.${F(q.info)}`,q.keyboard?q.h.dataset.key:null);return}const ue=te?.status===400?te.body?.errors?.[0]?.message:null;V(ue?`Not saved. ${Yo(ue)}`:"Not saved. Check the connection and try again."),y.disabled=!1}function P(){clearTimeout(d),c++;const q=r?.h.dataset.key;return r=null,X(),w.hidden=!0,q}y.addEventListener("click",m),g.addEventListener("click",()=>A(P())?.focus()),w.addEventListener("keydown",q=>{q.key==="Escape"&&(q.preventDefault(),A(P())?.focus())});const F=q=>q?.source==="house_file"&&q.saved_at?` The household is now kept in ${q.saved_at}; the house file isn't changed.`:"",D=ce("p","week-error");D.setAttribute("role","alert"),D.hidden=!0;async function W(q,ne){D.hidden=!0;let te=null,ue=null;try{te=await o.household(),ue=await o.save(Go(te.household,t.id,q))}catch{}if(ue?.status===200){n.saved(`${ne}${F(te)}`,null);return}D.textContent="Not saved. Check the connection and try again.",D.hidden=!1}const U=ce("div","week-adjust");if(t.adjust?.length){U.append(ce("h4",null,"Adjustments"));const q=ce("ul");t.adjust.forEach((ne,te)=>{const ue=ce("li"),we=en("link","Remove");we.setAttribute("aria-label",`Remove: ${ne.text}`),we.addEventListener("click",()=>W(Ie=>Ie.filter((Se,Pe)=>Pe!==te),`Removed. ${t.name} follows its new week.`)),ue.append(ce("span",null,ne.text),we),q.append(ue)}),U.append(q),t.routine&&U.append(ce("p","week-usual",Rc(t.routine)))}const Z=ce("div","week-actions"),se=en("link","Adjust");if(se.setAttribute("aria-expanded","false"),se.setAttribute("aria-label",`Adjust ${t.name}`),Z.append(se),t.adjust?.length){const q=en("link","Reset to routine");q.setAttribute("aria-label",`Reset ${t.name} to its routine`),q.addEventListener("click",()=>W(()=>[],`${t.name} is back to its routine.`)),Z.append(q)}U.append(Z,D);const de=ce("form","week-form");de.hidden=!0,de.noValidate=!0,de.id=`week-form-${t.id}`,se.setAttribute("aria-controls",de.id);const pe=(q,ne,te)=>{te.name=q,te.id=`${de.id}-${q}`;const ue=ce("div","week-field"),we=ce("label",null,ne);return we.htmlFor=te.id,ue.append(we,te),ue},z=q=>{const ne=ce("select");for(const[te,ue]of q){const we=ce("option",null,ue);we.value=te,ne.append(we)}return ne},v=q=>{const ne=ce("input","time");return Object.assign(ne,{type:"text",inputMode:"numeric",autocomplete:"off",spellcheck:!1,maxLength:5,placeholder:q}),ne.addEventListener("blur",()=>{const te=o.time?.(ne.value,{end:ne.name==="to"});te&&(ne.value=te)}),ne},S=z(Lc),M=z([["warm","Warm"],["cold","Cold"]]),j=v("22:30"),Y=v("23:00"),L=ce("div","week-fields");L.append(pe("days","Days",S),pe("keep","Keep it",M),pe("from","From",j),pe("to","To",Y));const I=ce("p","week-source");I.hidden=!0;const K=ce("p","week-error");K.setAttribute("role","alert"),K.hidden=!0;const oe=ce("div","week-buttons"),ve=en("btn btn-primary","Save","submit"),Oe=en("btn","Cancel");oe.append(ve,Oe),de.append(L,I,K,oe);const Je={days:S,keep:M,from:j,to:Y};function Ae(q,ne){for(const te of Object.values(Je))te.removeAttribute("aria-invalid");K.hidden=!ne,K.textContent=ne??"",q&&Je[q]&&(Je[q].setAttribute("aria-invalid","true"),Je[q].setAttribute("aria-describedby",K.id||=`${de.id}-error`))}function Yt(){de.hidden=!0,l=!1,se.setAttribute("aria-expanded","false"),Ae(null,null),se.focus()}return se.addEventListener("click",async()=>{if(l){Yt();return}r&&P(),l=!0,de.hidden=!1,se.setAttribute("aria-expanded","true"),S.focus();try{I.textContent=xs(await o.household())}catch{I.textContent=""}I.hidden=!I.textContent}),Oe.addEventListener("click",Yt),de.addEventListener("keydown",q=>{q.key==="Escape"&&(q.preventDefault(),Yt())}),de.addEventListener("submit",async q=>{q.preventDefault();const ne=(ge,lt)=>o.time?o.time(ge,lt):ge.trim()||null,te=ne(j.value),ue=ne(Y.value,{end:!0});if(!te){Ae("from","Enter a time such as 22:30."),j.focus();return}if(!ue){Ae("to","Enter a time such as 23:00."),Y.focus();return}Ae(null,null),ve.disabled=!0;const we={days:S.value,keep:M.value,from:te,to:ue};let Ie=null,Se=null,Pe=0;try{Ie=await o.household();const ge=Go(Ie.household,t.id,lt=>{const Xt=$s(lt,we);return Pe=Xt.length-1,Xt});Se=await o.save(ge)}catch{}if(ve.disabled=!1,Se?.status===200){l=!1,n.saved(`Saved. ${t.name} follows its new week.${F(Ie)}`,null);return}const Be=Se?.status===400?Se.body?.errors?.[0]:null;if(!Be){Ae(null,"Not saved. Check the connection and try again.");return}const Me=Be.path.match(new RegExp(`\\.adjust\\[${Pe}\\]\\.(\\w+)$`));Ae(Me?.[1]??null,`Not saved. ${Yo(Be.message)}`),Je[Me?.[1]]?.focus()}),U.append(de),u.append(U),e.insertBefore(u,e.querySelector(".week-meta")??e.querySelector(".week-now")),{busy:()=>!!(r||i||l),focus(q){(q&&A(q)||se).focus()}}}function Br({list:e,legendEl:t,frostEl:n,hintEl:o=null}){const a=new Map;let s=null,r={low:0,high:0},i=null,l=["saturday","sunday"],c=null;const d=typeof ResizeObserver=="function"?new ResizeObserver(f=>{for(const p of f)Ss(p.target)}):null;function u(f){if(!s)return;const p=yc(s,f);for(const{card:x}of a.values()){const h=x.querySelector(".week-now"),y=x.querySelectorAll(".week-day");y.forEach((k,T)=>{k.hasAttribute("aria-current")!==(T===p)&&Pr(k,T===p)});const g=y[p]?.querySelector(".week-track");g&&(h.parentElement!==g&&g.append(h),h.style.left=dt(f))}}function w(f){t.textContent="";const p=vc(f.levels);for(const h of p){const y=ce("span","week-key"),g=ce("i","week-swatch");g.setAttribute("aria-hidden","true"),g.dataset.base=String(h.setpoint<=r.low),g.style.setProperty("--level",(r.high>r.low?(h.setpoint-r.low)/(r.high-r.low):1).toFixed(3)),y.append(g,`${h.label} ${Wa(h.setpoint)}`),t.append(y)}const x=f.rooms.some(h=>h.days.some(y=>y.adjusted?.length));if(x){const h=ce("span","week-key"),y=ce("i","week-adj-swatch");y.setAttribute("aria-hidden","true"),h.append(y,"Adjusted"),t.append(h)}t.hidden=!p.length&&!x}return{update(f){s=f.now,l=f.weekend_days??l,r=mc(f.rooms,f.levels),n.hidden=!f.frost,w(f);const p=new Set;let x=!1;f.rooms.forEach((h,y)=>{p.add(h.id);const g=!!i&&h.source==="household";x||=g&&!h.away&&h.days.some(X=>X.periods?.length);const k=JSON.stringify([h,r,g]),T=a.get(h.id);if(T?.key===k&&c?.room!==h.id||T?.edit?.busy())return;const A=Mc(h,r,s.weekday);T?(d?.unobserve(T.card),T.card.replaceWith(A)):e.insertBefore(A,e.children[y]??null);const N={card:A,key:k,edit:null};g&&(N.edit=Nc(A,h,{editor:i,weekend:l,saved(X,Q){c={room:h.id,key:Q},i.saved(X)}})),a.set(h.id,N),d?.observe(A),Ss(A),c?.room===h.id&&(N.edit?.focus(c.key),c=null)});for(const[h,{card:y}]of a)p.has(h)||(d?.unobserve(y),y.remove(),a.delete(h));o&&(o.hidden=!x),u(s.minute)},tick(f){u(f)},setEditor(f){i=f}}}const ma="radiate.householdDraft",Fe=e=>document.getElementById(e);function J(e,t={},...n){const o=document.createElement(e);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="text"?o.textContent=s:a==="class"?o.className=s:a.startsWith("on")?o.addEventListener(a.slice(2),s):a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n.flat())a!=null&&a!==!1&&o.append(a);return o}const ke=e=>`f-${e.replace(/[^a-z0-9]+/gi,"-")}`,_s=e=>{const t=String(e).trim();return t?`${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t)?"":"."}`:""};function zc(){try{return JSON.parse(localStorage.getItem(ma)||"null")}catch{return null}}function Cs(e){try{e?localStorage.setItem(ma,JSON.stringify(e)):localStorage.removeItem(ma)}catch{}}function Dc({transport:e,onSaved:t,onOpen:n,onClose:o}){const a=Fe("setup"),s=Fe("setup-body"),r=Fe("setup-summary"),i=Fe("setup-back"),l=Fe("setup-next"),c=Fe("setup-progress"),d=Fe("setup-steps"),u=Fe("setup-source"),w=Fe("setup-resume");let f=null,p=null,x="",h=0,y=0,g=0,k=[],T=[],A=!1,N=!1;const X=new Set,Q=new Set;let ae=null,_=null;const V=()=>{clearTimeout(_),_=setTimeout(()=>Cs({v:1,base:x,step:h,person:y,reached:g,draft:p}),300)},B=()=>{clearTimeout(_),Cs(null)};function m($,C,E,H="",G=null){const re=E.matches("input, select")?E:E.querySelector("input, select");re.id||=ke($);const ie=H?`${re.id}-help`:null;return ie&&re.setAttribute("aria-describedby",ie),J("div",{class:"field","data-path":$},J("label",{for:re.id,text:C}),E,H?J("p",{class:"field-help",id:ie,text:H}):null,G)}function P($,C,{end:E=!1,onChange:H}){const G=J("input",{id:ke($),type:"text",inputmode:"numeric",autocomplete:"off",spellcheck:"false",maxlength:"5",placeholder:E?"22:30":"07:30",class:"time",value:C});return G.addEventListener("input",()=>{H(G.value),V()}),G.addEventListener("blur",()=>{const re=on(G.value,{end:E});re&&re!==G.value&&(G.value=re,H(re),V())}),G}function F($,C,{limit:E,step:H=1,placeholder:G="",onChange:re}){const ie=J("input",{id:ke($),type:"number",inputmode:H<1?"decimal":"numeric",min:String(E.off===0?0:E.min),max:String(E.max),step:String(H),placeholder:G===""?"":String(G),class:"num",value:C==null?"":String(C)});return ie.addEventListener("input",()=>{const me=ie.value.trim();re(me===""?null:Number.isFinite(Number(me))?Number(me):me),V()}),ie}const D=($,C)=>J("span",{class:"unit"},$,J("span",{"aria-hidden":"true",text:C}));function W($,C,E,H){const G=J("select",{id:ke($)},E.map(([re,ie])=>J("option",{value:re,text:ie})));return G.value=C,G.addEventListener("change",()=>{H(G.value),V()}),G}function U($,C,E,H,G=""){const re=J("input",{type:"checkbox",id:$,checked:E});return re.addEventListener("change",()=>{H(re.checked),V()}),J("div",{class:"check"},re,J("label",{for:$,text:C}),G?J("p",{class:"field-help",text:G}):null)}function Z($,C,E){const H=new Set(C);return J("fieldset",{class:"days","data-path":$},J("legend",{class:"sr-only",text:"Days"}),fo.map(G=>{const re=`${ke($)}-${G}`,ie=J("input",{type:"checkbox",id:re,checked:H.has(G)});return ie.addEventListener("change",()=>{ie.checked?H.add(G):H.delete(G),E(fo.filter(me=>H.has(me))),V()}),J("span",{class:"day"},ie,J("label",{for:re,text:G[0].toUpperCase()+G.slice(1,3)}))}))}function se($,C,...E){const H=J("details",{class:"setup-adv",open:X.has($)},J("summary",{text:C}),J("div",{class:"setup-adv-body"},...E));return H.addEventListener("toggle",()=>{H.open?X.add($):X.delete($)}),H}const de=$=>f.limits[$],pe=($,C)=>f.defaults[$][C],z=($,C=null)=>`Default ${jn($,C)}.`;function v($,C){return[J("h3",{class:"setup-title",id:"setup-step-h",tabindex:"-1",text:$}),C?J("p",{class:"setup-intro",text:C}):null]}function S($,C,E){const H=pa(f);let G;return H?G=W(`${C}.ha_person`,$.ha_person??"",tc(H,$.ha_person),re=>{$.ha_person=re||null,Q.add($.id)}):(G=J("input",{id:ke(`${C}.ha_person`),type:"text",class:"entity",value:$.ha_person??"",placeholder:"person.sam",autocomplete:"off",autocapitalize:"none",spellcheck:"false",maxlength:"107"}),G.addEventListener("input",()=>{$.ha_person=G.value.trim()||null,V()})),G.setAttribute("aria-describedby",E),J("div",{class:"field","data-path":`${C}.ha_person`},J("label",{for:G.id,text:"Home Assistant person"}),G)}function M(){const $=J("div",{class:"setup-people"}),C=pa(f),E=`${ke("household.people")}-ha-help`,H=()=>C?`${fs(p.away.presence_delay_min)} A link set in the integration's options takes priority.`:`Optional. Type the entity ID, such as person.sam. ${fs(p.away.presence_delay_min)}`,G=J("p",{class:"field-help",id:E,text:H()});p.people.forEach((he,be)=>{const _e=`household.people.${he.id}`,Ne=J("input",{id:ke(`${_e}.name`),type:"text",value:he.name,autocomplete:"off",maxlength:"40",required:!0});Ne.addEventListener("input",()=>{he.name=Ne.value,V()}),Ne.addEventListener("change",()=>{if(!C||he.ha_person||Q.has(he.id))return;const vt=p.people.map(Qt=>Qt.ha_person).filter(Boolean),kn=qr(he.name,C,vt);if(!kn)return;he.ha_person=kn;const Xn=document.getElementById(ke(`${_e}.ha_person`));Xn&&(Xn.value=kn),V()});const Ze=J("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${he.name||`person ${be+1}`}`,disabled:p.people.length<2,onclick:()=>{nc(p,he.id),y=Math.min(y,p.people.length-1),ne(`${ke("household.people")}-add`),V()}});$.append(J("div",{class:"setup-person",role:"group","aria-label":`Person ${be+1}`,"data-path":_e},m(`${_e}.name`,`Person ${be+1}`,Ne),S(he,_e,E),Ze))});const re=J("button",{type:"button",class:"btn",id:`${ke("household.people")}-add`,text:"Add a person",onclick:()=>{const he=Dr(p);ne(ke(`household.people.${he}.name`),!0),V()}}),ie=p.away,me=de("away.presence_stale_after_min").off;return[...v("Who lives here?","Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),J("div",{class:"field-group","data-path":"household.people"},$,G,re),se("away","Advanced: away and presence",m("household.away.presence_delay_min","Counts as away after",D(F("household.away.presence_delay_min",ie.presence_delay_min,{limit:de("away.presence_delay_min"),onChange:he=>{ie.presence_delay_min=he,typeof he=="number"&&(G.textContent=H())}}),"min"),`How long Home Assistant must say someone is out before Radiate counts them as away. ${z(pe("away","presence_delay_min"))}`),m("household.away.presence_stale_after_min","Presence goes stale after",D(F("household.away.presence_stale_after_min",ie.presence_stale_after_min,{limit:de("away.presence_stale_after_min"),onChange:he=>ie.presence_stale_after_min=he}),"min"),`If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${z(pe("away","presence_stale_after_min"),me)}`),m("household.away.return_warmup_min","Warm up for a return up to",D(F("household.away.return_warmup_min",ie.return_warmup_min,{limit:de("away.return_warmup_min"),onChange:he=>ie.return_warmup_min=he}),"min"),`How early Radiate may start warming rooms for someone due back. ${z(pe("away","return_warmup_min"))}`),m("household.away.presence_evidence_max_age_min","Trust not home for",D(F("household.away.presence_evidence_max_age_min",ie.presence_evidence_max_age_min,{limit:de("away.presence_evidence_max_age_min"),onChange:he=>ie.presence_evidence_max_age_min=he}),"min"),`If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${z(pe("away","presence_evidence_max_age_min"))}`),m("household.away.presence_weak_source_delay_min","Wifi or Bluetooth trackers count as away after",D(F("household.away.presence_weak_source_delay_min",ie.presence_weak_source_delay_min,{limit:de("away.presence_weak_source_delay_min"),onChange:he=>ie.presence_weak_source_delay_min=he}),"min"),`A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${z(pe("away","presence_weak_source_delay_min"))}`),m("household.away.everyone_away","When everyone has set an away until",W("household.away.everyone_away",ie.everyone_away,[["frost","Hold every room at frost protection"],["unused","Keep rooms at their unused temperature"]],he=>ie.everyone_away=he),"Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."))]}function j($,C,E){const H=$[C],G=`household.people.${$.id}.${C}`,re=$.name||"this person",ie=J("div",{class:"periods"}),me=so(G,H.periods);H.periods.forEach((be,_e)=>{const Ne=me[_e],Ze=W(`${Ne}.type`,be.type,[["out","Out of the house"],["work","Working from home"]],Qt=>{be.type=Qt,ne(ke(`${so(G,H.periods)[_e]}.type`))}),vt=P(`${Ne}.from`,be.from,{onChange:Qt=>be.from=Qt}),kn=P(`${Ne}.to`,be.to,{end:!0,onChange:Qt=>be.to=Qt}),Xn=J("button",{type:"button",class:"link",text:"Remove","aria-label":`Remove ${be.type==="work"?"working":"out"} ${be.from} to ${be.to}`,onclick:()=>{H.periods.splice(_e,1),ne(`${ke(G)}-add-out`),V()}});ie.append(J("div",{class:"period",role:"group","aria-label":`${E}, time ${_e+1}`,"data-path":Ne},J("div",{class:"field"},J("label",{for:Ze.id,text:"What"}),Ze),J("div",{class:"field"},J("label",{for:vt.id,text:be.type==="work"?"Starts":"Leaves"}),vt),J("div",{class:"field"},J("label",{for:kn.id,text:be.type==="work"?"Finishes":"Back"}),kn),Xn))}),H.periods.length||ie.append(J("p",{class:"field-help",text:`${re} is at home all day.`}));const he=(be,_e,Ne)=>()=>{H.periods.push({type:be,from:_e,to:Ne});const Ze=so(G,H.periods).at(-1);ne(ke(`${Ze}.from`)),V()};return J("fieldset",{class:"routine","data-path":G},J("legend",{text:E}),m(`${G}.up`,`When does ${re} get up?`,P(`${G}.up`,H.up,{onChange:be=>H.up=be})),J("div",{class:"field-group"},J("p",{class:"field-label",text:`Is ${re} out or working from home during the day?`}),ie,J("div",{class:"row"},J("button",{type:"button",class:"btn",id:`${ke(G)}-add-out`,text:"Add time out",onclick:he("out","08:30","17:30")}),J("button",{type:"button",class:"btn",id:`${ke(G)}-add-work`,text:"Add time working from home",onclick:he("work","09:00","17:00")}))),m(`${G}.bed`,`When does ${re} go to bed?`,P(`${G}.bed`,H.bed,{end:!0,onChange:be=>H.bed=be})))}function Y(){const $=p.people[y],C=$.name||`Person ${y+1}`,E=`household.people.${$.id}`,H=[...v(`${C}'s routine`,p.people.length>1?`Person ${y+1} of ${p.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.`:"Usual days are enough: Radiate handles one-off changes with away and overrides."),j($,"weekdays",$.weekendSame?"Every day":"Weekdays"),U(`${ke(E)}-weekend`,"Weekends are different",!$.weekendSame,ie=>{$.weekendSame=!ie,ie&&JSON.stringify($.weekend)===JSON.stringify($.weekdays)&&($.weekend=JSON.parse(JSON.stringify(zr.weekend))),ne(`${ke(E)}-weekend`)})];if($.weekendSame||H.push(j($,"weekend","Weekends")),sc($)){const ie=p.rooms.map(me=>[me.id,me.name]);H.push(m(`${E}.office`,`Where does ${C} work?`,W(`${E}.office`,oc(p,$.id)??"",[["","No particular room"],...ie],me=>ac(p,$.id,me||null)),"That room is warm while they work. Shared rooms aren't heated while someone works."))}const G=p.timing,re=$.weekend_days==null;return H.push(se(`person-${$.id}`,`Advanced: timing for ${C}`,m(`${E}.getting_up_min`,"Getting ready",D(F(`${E}.getting_up_min`,$.getting_up_min,{limit:de("timing.getting_up_min"),placeholder:G.getting_up_min,onChange:ie=>$.getting_up_min=ie}),"min"),`How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${jn(G.getting_up_min)}.`),m(`${E}.bedtime_min`,"Winding down",D(F(`${E}.bedtime_min`,$.bedtime_min,{limit:de("timing.bedtime_min"),placeholder:G.bedtime_min,onChange:ie=>$.bedtime_min=ie}),"min"),`How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${jn(G.bedtime_min)}.`),J("div",{class:"field","data-path":`${E}.weekend_days`},U(`${ke(E)}-own-weekend`,`Same weekend days as the house (${uc(p.weekend_days)})`,re,ie=>{$.weekend_days=ie?null:[...p.weekend_days],ne(`${ke(E)}-own-weekend`)},"Untick for someone who works weekends."),re?null:Z(`${E}.weekend_days`,$.weekend_days,ie=>$.weekend_days=ie)))),H}function L($){const C=p.temperatures;return{in_use:`Kept at ${C.in_use}° while it's used.`,occasional:`Kept at ${C.occasional}° while it's used, for a bathroom or guest room.`,unused:`Kept at ${C.unused}° by day and ${C.night}° at night.`,own:"Follows its schedule from the house file. Radiate doesn't change it."}[$]}function I(){const $=J("div",{class:"setup-rooms"}),C=Ql;for(const E of p.rooms){const H=`household.rooms.${E.id}`,G=E.schedule?[...C,["own","Its own schedule"]]:C,re=W(`${H}.use`,E.own?"own":E.use,G,he=>{E.own=he==="own",E.own||(E.use=he),ne(ke(`${H}.use`))}),ie=`${ke(H)}-h`,me=J("div",{class:"card setup-room",role:"group","aria-labelledby":ie,"data-path":H},J("h4",{id:ie,text:E.name}));if(me.append(m(`${H}.use`,"How is it used?",re,L(E.own?"own":E.use))),!E.own){if(me.append(U(`${ke(H)}-weekend`,"Different at weekends",E.weekendDifferent,be=>{E.weekendDifferent=be,be||(E.weekendUse=E.use),ne(`${ke(H)}-weekend`)})),E.weekendDifferent&&me.append(m(`${H}.use.weekend`,"At weekends",W(`${H}.use.weekend`,E.weekendUse,C,be=>{E.weekendUse=be}))),!(E.use==="unused"&&(!E.weekendDifferent||E.weekendUse==="unused"))){const be=W(`${H}.kind`,E.kind,Nr.map(([_e,Ne])=>[_e,Ne]),_e=>{E.kind=_e,ne(ke(`${H}.kind`))});me.append(m(`${H}.kind`,"What kind of room?",be,cc(E.kind))),p.people.length>1&&me.append(K(E,H))}me.append(oe(E,H))}$.append(me)}return[...v("How is each room used?","Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),$]}function K($,C){const E=$.people==null,H=J("fieldset",{class:"who","data-path":`${C}.people`},J("legend",{class:"field-label",text:"Who uses it?"}));if(H.append(U(`${ke(C)}-everyone`,"Everyone",E,G=>{$.people=G?null:p.people.map(re=>re.id),ne(`${ke(C)}-everyone`)})),!E)for(const G of p.people)H.append(U(`${ke(C)}-${G.id}`,G.name||G.id,$.people.includes(G.id),re=>{const ie=new Set($.people);re?ie.add(G.id):ie.delete(G.id),$.people=p.people.map(me=>me.id).filter(me=>ie.has(me))}));return H}function oe($,C){const E=p.temperatures,H=de("temperatures"),G=(me,he)=>J("p",{class:"field-note","aria-live":"polite",text:eo($[me]??he,f.damp_below_c)}),re=(me,he,be,_e)=>{const Ne=me==="temperature"?null:G(me,be),Ze=F(`${C}.${me}`,$[me],{limit:H,step:.5,placeholder:be,onChange:vt=>{$[me]=vt,Ne&&(Ne.textContent=eo(vt??be,f.damp_below_c))}});return m(`${C}.${me}`,he,D(Ze,"°C"),_e,Ne)},ie=$.use==="unused"?$.weekendUse:$.use;return se(`room-${$.id}`,`Advanced: ${$.name}`,re("temperature","Its own warm temperature",E[ie]??E.in_use,"Replaces the use level's temperature in this room only. Leave empty to use the level's."),re("night_temperature","Its own night temperature",E.night,`For a warmer nursery, say. Leave empty for the house's, ${E.night}°.`),re("unused_temperature","Its own unused temperature",E.unused,`Leave empty for the house's, ${E.unused}°.`),m(`${C}.preheat_min`,"Valve starts early by",D(F(`${C}.preheat_min`,$.preheat_min,{limit:de("timing.preheat_min"),placeholder:p.timing.preheat_min,onChange:me=>$.preheat_min=me}),"min"),`For a slow room with a small radiator. Leave empty for the house setting, ${jn(p.timing.preheat_min)}.`))}function ve(){const $=p.temperatures,C=de("temperatures"),E=(re,ie,me)=>{const he=`household.temperatures.${re}`,_e=re==="unused"||re==="night"?J("p",{class:"field-note","aria-live":"polite",text:eo($[re],f.damp_below_c)}):null,Ne=F(he,$[re],{limit:C,step:.5,onChange:Ze=>{$[re]=Ze,_e&&(_e.textContent=eo(Ze,f.damp_below_c))}});return m(he,ie,D(Ne,"°C"),`${me} Default ${pe("temperatures",re)}°.`,_e)},H=p.timing,G=(re,ie,me)=>{const he=`household.timing.${re}`;return m(he,ie,D(F(he,H[re],{limit:de(`timing.${re}`),onChange:be=>H[re]=be}),"min"),`${me} ${z(pe("timing",re))}`)};return[...v("How warm should rooms be?","One temperature for each way a room is used. Rooms change between them through the day."),J("div",{class:"setup-grid"},E("in_use","In use","Rooms while they're being used."),E("occasional","Occasional","Rooms used now and then, such as a bathroom, while they're used."),E("unused","Unused","Every room by day when it isn't being used."),E("night","Night","Every room overnight, from the last person in bed to the first one up.")),se("timing","Advanced: timing",J("div",{class:"field","data-path":"household.weekend_days"},J("p",{class:"field-label",text:"Weekend days"}),Z("household.weekend_days",p.weekend_days,re=>p.weekend_days=re),J("p",{class:"field-help",text:"The days that use weekend routines and weekend room use. Default Saturday and Sunday."})),G("getting_up_min","Getting ready","How long bedrooms and shared rooms stay warm after someone gets up."),G("bedtime_min","Winding down","How long a bedroom is warm before someone goes to bed."),G("preheat_min","Valves start early by","How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),m("household.timing.live_preheat","How Radiate starts early",W("household.timing.live_preheat",H.live_preheat,[["optimum_start","Learn how early each room needs"],["fixed","A fixed time early, as the valves do"]],re=>H.live_preheat=re),"Learning starts each room as late as it can and still be warm in time. Default learn."),G("merge_gap_min","Join warm periods closer than","Two warm periods this close together become one, so a room doesn't cool for a short gap."))]}function Oe(){const $=J("div",{class:"setup-result"}),C=J("p",{class:"week-legend",hidden:!0}),E=J("p",{class:"away-note",hidden:!0,text:"Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back."}),H=J("div",{class:"weeks"}),G=J("p",{class:"setup-status",id:"setup-result-status","aria-live":"polite",tabindex:"-1",text:"Building your week…"});return $.append(G,J("div",{class:"setup-notes",id:"setup-notes"}),J("div",{class:"week-head"},C),E,H),ae=Br({list:H,legendEl:C,frostEl:E}),[...v("Your heating week","Every room's week, built from your answers. Blocks are warm periods, darker when warmer."),$]}const Je=[M,()=>Y(),I,ve,Oe];function Ae(){d.textContent="",Zn.forEach(($,C)=>{const E=C===h,H=J("li",{"aria-current":E?"step":null,"data-done":String(C<h)}),G=`${C+1}. ${$}`;C<=g&&!E?H.append(J("button",{type:"button",class:"link",text:G,onclick:re=>te(C,0,re.detail===0)})):H.append(J("span",{text:G})),d.append(H)})}function Yt(){u.textContent="";const $=f.saved_problems??[];if($.length){u.hidden=!1,u.append(J("p",{text:`Your saved setup couldn't be used, so the house file's setup applies: ${$.map(C=>_s(C.message)).join(" ")} Saving here replaces it.`}));return}if(f.source==="saved"){u.hidden=!1;const C=f.house_file?"the household section of the house file":"the schedules in the house file";u.append(J("p",{text:f.saved_at?`This setup is saved by Radiate in ${f.saved_at}. It replaces ${C}, which is left as it is.`:"This setup replaces the schedules the house started with, until you go back to them."}));const E=J("div",{class:"row",hidden:!0},J("p",{text:`This deletes the saved setup. Rooms go back to ${C}.`}),J("button",{type:"button",class:"btn",text:"Delete and use the house file",onclick:Xt}),J("button",{type:"button",class:"link",text:"Keep this setup",onclick:()=>{E.hidden=!0,H.hidden=!1,H.focus()}})),H=J("button",{type:"button",class:"link",text:"Use the house file's setup instead",onclick:()=>{E.hidden=!1,H.hidden=!0,E.querySelector(".btn").focus()}});u.append(H,E);return}if(f.source==="house_file"){u.hidden=!1,u.append(J("p",{text:"These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed."}));return}u.hidden=!0}function q($=null){a.dataset.instant=String(N||$!=null);const C=J("div",{class:"setup-step"},...Je[h]());s.replaceChildren(C),Ae(),i.hidden=h===0&&y===0,l.disabled=!1,l.textContent=h===4?"Save":h===3?"See the result":"Next";const E=h===1?`${Zn[1]}, ${p.people[y]?.name||`person ${y+1}`}`:Zn[h];c.textContent=`Step ${h+1} of 5: ${E}`,ue(!1),$&&document.getElementById($)?document.getElementById($).focus():Fe("setup-step-h")?.focus(),h===4&&ge()}function ne($,C=!0){const E=k;q($),C&&(k=E,ue(!1)),V()}function te($,C=0,E=!1){N=E,h=$,y=Math.min(C,p.people.length-1),g=Math.max(g,h),k=[],T=[],q(),V()}function ue($){for(const H of s.querySelectorAll(".field-error"))H.remove();for(const H of s.querySelectorAll("[aria-invalid]"))H.removeAttribute("aria-invalid"),H.dataset.describedby?H.setAttribute("aria-describedby",H.dataset.describedby):H.removeAttribute("aria-describedby"),delete H.dataset.describedby;if(r.textContent="",r.hidden=!k.length,!k.length)return;const C=[...s.querySelectorAll("[data-path]")].map(H=>H.dataset.path);r.append(J("h3",{text:k.length===1?"Check this answer":`Check these ${k.length} answers`}));const E=J("ul");k.forEach((H,G)=>{const re=ic(C,H.path),ie=re?s.querySelector(`[data-path="${CSS.escape(re)}"]`):null,me=_s(H.message),he=ie?.matches("input, select")?ie:ie?.querySelector("input, select, button");if(ie){const _e=`setup-err-${G}`,Ne=J("p",{class:"field-error",id:_e,text:me}),Ze=ie.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");if(Ze?Ze.after(Ne):ie.prepend(Ne),he){he.setAttribute("aria-invalid","true");const vt=he.getAttribute("aria-describedby")??"";he.dataset.describedby=vt,he.setAttribute("aria-describedby",`${_e} ${vt}`.trim())}}const be=we(H.path);E.append(J("li",{},he?J("a",{href:`#${he.id}`,text:`${be}${me}`,onclick:_e=>{_e.preventDefault(),he.focus()}}):Ie(H.path,`${be}${me}`)))}),r.append(E),$&&r.focus()}function we($){const C=$.split(".");if(C[1]==="people"&&C[2]){const E=p.people.find(G=>G.id===C[2]),H=C[3]?.startsWith("weekend")&&C[3]!=="weekend_days"?", weekends":C[3]?.startsWith("weekdays")?", weekdays":"";return`${E?.name||C[2]}${H}: `}return C[1]==="rooms"&&C[2]?`${p.rooms.find(E=>E.id===C[2])?.name??C[2]}: `:""}function Ie($,C){if(!$)return J("span",{text:C});const{step:E,person:H}=vs(p,$);return E===h&&(E!==1||H===y)?J("span",{text:C}):J("button",{type:"button",class:"link",text:`${C} Change it in ${Zn[E]}.`,onclick:G=>te(E,H,G.detail===0)})}const Se=$=>$.filter(C=>{const E=vs(p,C.path);return E.step===h&&(h!==1||E.person===y)});async function Pe(){const $=lc(p);if(Se($).length)return{errors:Se($),notes:[]};const C=await e.call("POST","household/preview",{household:ys(p)});if(C.status!==200)throw new Error(typeof C.body=="string"?C.body:`HTTP ${C.status}`);return C.body}async function Be($){if(A)return;if(h===4){await lt();return}A=!0,l.disabled=!0;let C;try{C=await Pe()}catch{A=!1,l.disabled=!1,k=[{path:"",message:"Couldn't check your answers. Check the connection and try again."}],ue(!0);return}if(A=!1,l.disabled=!1,k=Se(C.errors),k.length){ue(!0);return}h===1&&y<p.people.length-1?te(1,y+1,$):te(h+1,0,$)}function Me($){h===1&&y>0?te(1,y-1,$):h===2?te(1,p.people.length-1,$):h>0&&te(h-1,0,$)}async function ge(){const $=Fe("setup-result-status"),C=Fe("setup-notes");let E;try{E=await Pe()}catch{$.textContent="Couldn't build the week. Check the connection, then go back and forward to try again.",l.disabled=!0;return}if(h!==4)return;if(k=E.errors,T=E.notes??[],l.disabled=k.length>0,k.length){$.textContent="Some answers need changing before Radiate can build the week.",ue(!0);return}$.textContent="Save to start using it. Radiate then rebuilds every room's schedule from your answers.",C.textContent="";const H=hc(E.rooms);for(const G of T)G.path.startsWith("household.temperatures")||G.path.includes("_temperature")||C.append(J("p",{class:"flag",text:`${we(G.path)||""}${G.message[0].toUpperCase()}${G.message.slice(1)}`}));H&&C.append(J("p",{class:"field-help",text:H})),ae.update(E)}async function lt(){A=!0,l.disabled=!0;const $=Fe("setup-result-status");$.textContent="Saving…";let C;try{C=await e.call("PUT","household",{household:ys(p)})}catch{C={status:0,body:null}}if(A=!1,l.disabled=!1,C.status===200){B(),St(!1),t("Household setup saved. Every room's schedule is rebuilt from it.");return}if(C.status===400&&C.body?.errors){k=C.body.errors,$.textContent="Not saved: some answers need changing.",ue(!0);return}$.textContent=C.body?.message?`Not saved. ${C.body.message}.`:"Not saved. Check the connection and try again.",$.focus?.()}async function Xt(){let $;try{$=await e.call("DELETE","household")}catch{$={status:0}}if($.status!==200){k=[{path:"",message:"Couldn't go back to the house file's setup. Try again."}],ue(!0);return}B(),St(!1),t("Using the house file's setup again. The saved setup is deleted.")}function St($=!0){$&&p&&V(),a.hidden=!0,o()}let vn=!1;return l.addEventListener("click",$=>{vn=$.detail===0}),Fe("setup-form").addEventListener("submit",$=>{$.preventDefault(),Be(vn)}),i.addEventListener("click",$=>Me($.detail===0)),Fe("setup-close").addEventListener("click",()=>St(!0)),Fe("setup-restart").addEventListener("click",()=>{B(),p=bs(f),Q.clear(),w.hidden=!0,g=0,te(0)}),{async open(){const $=await e.call("GET","household");if($.status!==200)throw new Error(`household: HTTP ${$.status}`);f=$.body,x=JSON.stringify(f.household);const C=zc(),E=C?.v===1&&C.base===x&&C.draft?.people?.length;p=E?C.draft:bs(f),h=E?Math.min(C.step,4):0,y=E?Math.min(C.person??0,p.people.length-1):0,g=E?Math.max(C.reached??0,h):0,w.hidden=!E,Fe("setup-h").textContent=f.household?"Change household setup":"Set up your household",k=[],N=!1,Q.clear(),Yt(),a.hidden=!1,n(),q(),Fe("setup-h").focus()},async available(){try{return(await e.call("GET","household")).status===200}catch{return null}}}}const je=e=>document.getElementById(e),qc=1e4,Pc=2e3;function go(e){return e==null?"–":e<60?"just now":e<3600?`${Math.floor(e/60)} min ago`:e<172800?`${Math.floor(e/3600)} h ago`:`${Math.floor(e/86400)} days ago`}function Es(e){const t=Math.max(1,Math.ceil(e/60));return t<60?`${t} min`:`${Math.floor(t/60)} h ${t%60} min`}const Bc={strong:"Strong",fair:"Fair",weak:"Weak"},Ic={weak:1,fair:2,strong:3},Hc={auto:"auto",heat:"heat",off:"off"};function As(e,t){return t==="device.offline"?`Not reachable. Last heard ${go(e.last_seen_s)}.`:t==="device.low_battery"?`Battery low at ${e.battery_pct}%. Replace the batteries soon.`:t==="device.weak_signal"?`Weak signal (LQI ${e.linkquality}). A router nearer to it would help.`:t==="device.stale"?`No temperature for ${go(e.reading_age_s).replace(" ago","")}.`:"Needs attention."}function Fc(e){return e.status==="offline"?["Offline","offline"]:e.status==="attention"?["Needs attention","attention"]:e.available==null?["No data yet",""]:["Online","ok"]}function jc(e){const t=[],n=e.temperature_c!=null?`${e.temperature_c.toFixed(1)}°`:null;if(e.kind==="trv"){const a=e.valve??{};n&&t.push(`${n} at the valve`),a.opening_pct!=null&&t.push(`opening limit ${Math.round(a.opening_pct)}%`),a.running_state&&t.push(a.running_state==="heat"?"heating":"idle"),a.mode&&t.push(`${Hc[a.mode]??a.mode} mode`)}else if(e.kind==="relay"){const a=e.relay??{};a.heating!=null&&t.push(`heating ${a.heating?"on":"off"}`),a.store!=null&&t.push(`hot water ${a.store?"on":"off"}`),a.power_w!=null&&t.push(`${Math.round(a.power_w)} W`)}else e.kind==="window"?e.contact!=null&&t.push(e.contact?"window closed":"window open"):e.kind!=="router"&&(n&&t.push(n),e.humidity_pct!=null&&t.push(`${Math.round(e.humidity_pct)}% humidity`));if(!t.length)return e.kind==="router"?"Relays messages for nearby devices.":"–";const o=t.join(", ");return o[0].toUpperCase()+o.slice(1)}function Wc(e,t){return e.kind==="relay"?"Wi-Fi":e.route?`Via ${e.route.via_kind==="coordinator"?"the coordinator":e.route.via}${e.route.lqi!=null?` (LQI ${Math.round(e.route.lqi)})`:""}`:t?"Not in the last scan":null}function Uc({transport:e,isAuthError:t,onAuth:n,scanLock:o=()=>""}){const a=new Map;let s=null,r=null,i=!1,l=!1,c="";function d(g,k){let T=a.get(g.id);return T||(T=je("device-tpl").content.firstElementChild.cloneNode(!0),T.id=`device-${g.id.replace(/[^\w-]/g,"_")}`,T.dataset.kind=g.kind,a.set(g.id,T)),T.parentElement!==k&&k.appendChild(T),T}function u(g,k,T){const A=d(g,k);A.querySelector(".name").textContent=g.label,A.dataset.status=g.status;const[N,X]=Fc(g),Q=A.querySelector(".badge");Q.textContent=N,Q.dataset.kind=X;const ae=A.querySelector(".device-flags"),_=g.problems.map(v=>As(g,v.code)),V=JSON.stringify(_);if(ae.dataset.key!==V){ae.dataset.key=V,ae.textContent="";for(const v of _){const S=document.createElement("li");S.className="flag",S.textContent=v,ae.appendChild(S)}}ae.hidden=!_.length;const B=A.querySelector(".ds-battery"),m=B.querySelector(".ds-val"),P=B.querySelector(".meter");g.battery_pct!=null?(m.textContent=`${g.battery_pct}%`,P.hidden=!1,P.dataset.low=String(g.battery_low),P.firstElementChild.style.transform=`scaleX(${Math.max(0,Math.min(100,g.battery_pct))/100})`):(m.textContent=g.power==="mains"?"Mains":"–",P.hidden=!0),B.dataset.low=String(g.battery_low);const F=A.querySelector(".ds-signal"),D=F.querySelector(".ds-val"),W=F.querySelector(".ds-sub"),U=F.querySelector(".sig");W.textContent="",g.kind==="relay"?(D.textContent="Wi-Fi",U.hidden=!0):g.linkquality!=null&&g.available!==!1?(D.textContent=Bc[g.signal],W.textContent=`LQI ${g.linkquality}`,U.hidden=!1,U.dataset.level=g.signal,U.dataset.bars=String(Ic[g.signal])):(D.textContent="–",U.hidden=!0),F.dataset.weak=String(g.signal==="weak"&&g.available!==!1),A.querySelector(".ds-seen .ds-val").textContent=go(g.last_seen_s),A.querySelector(".device-reading").textContent=jc(g);const Z=A.querySelector(".meta"),se=[];g.kind!=="relay"&&se.push(["code",g.id]);const de=[g.vendor,g.model].filter(Boolean).join(" ");de&&se.push(["",de]),g.firmware&&se.push(["",`Firmware ${g.firmware}`]);const pe=Wc(g,T);pe&&se.push(["route",pe]);const z=JSON.stringify(se);if(Z.dataset.key!==z){Z.dataset.key=z,Z.textContent="";for(const[v,S]of se){const M=document.createElement(v==="code"?"code":"span");v==="route"&&(M.className="route"),M.textContent=S,Z.appendChild(M)}}}function w(g){const k=g.summary,T=[];k.offline&&T.push(`${k.offline} offline`),k.low_battery&&T.push(`${k.low_battery} low battery`),k.weak_signal&&T.push(`${k.weak_signal} weak signal`);const A=`${k.total} ${k.total===1?"device":"devices"}`;je("devices-summary").textContent=k.attention?`${A}. ${k.attention} ${k.attention===1?"needs":"need"} attention${T.length?`: ${T.join(", ")}`:""}.`:`${A}, all healthy.`;const N=g.network??{},X=[];N.mqtt!=null&&X.push(N.mqtt?"MQTT connected":"MQTT not connected"),N.zigbee2mqtt!=null&&X.push(N.zigbee2mqtt?"Zigbee2MQTT online":"Zigbee2MQTT offline"),je("devices-network").textContent=X.length?`${X.join(". ")}.`:"";const Q=je("devices-attention"),ae=je("devices-attention-list"),_=g.devices.filter(B=>B.status!=="ok");Q.hidden=!_.length;const V=JSON.stringify(_.map(B=>B.id));if(ae.dataset.key!==V){ae.dataset.key=V,ae.textContent="";for(const B of _){const m=document.createElement("li");m.dataset.id=B.id;const P=document.createElement("a");P.href="#devices",P.className="attention-link",P.textContent=B.label,P.addEventListener("click",D=>{D.preventDefault();const W=a.get(B.id);W&&(W.scrollIntoView({block:"center"}),W.focus({preventScroll:!0}))});const F=document.createElement("span");m.append(P,F),ae.appendChild(m)}}for(const B of _){const m=ae.querySelector(`li[data-id="${CSS.escape(B.id)}"] span`);m&&(m.textContent=`: ${B.problems.map(P=>As(B,P.code)).join(" ")}`)}}function f(g){const k=je("mesh-tree"),T=g.devices.filter(_=>_.route);k.hidden=!T.length;const A=JSON.stringify(T.map(_=>[_.id,_.route.via,_.route.lqi]));if(k.dataset.key===A)return;k.dataset.key=A,k.textContent="";const N=new Map;for(const _ of T){const V=_.route.via_kind==="coordinator"?"Coordinator":_.route.via;N.has(V)||N.set(V,[]),N.get(V).push(_)}const X=new Map(g.devices.map(_=>[_.id,_.label])),Q=new Set,ae=(_,V)=>{const B=document.createElement("li"),m=document.createElement("span");m.className="tree-node",m.textContent=V,B.appendChild(m);const P=(N.get(_)??[]).slice().sort((D,W)=>(D.kind==="router")-(W.kind==="router")||D.label.localeCompare(W.label));if(!P.length||Q.has(_))return B;Q.add(_);const F=document.createElement("ul");for(const D of P){const W=document.createElement("span");W.className="tree-lqi",W.textContent=D.route.lqi!=null?`LQI ${Math.round(D.route.lqi)}`:"",W.dataset.weak=String(D.route.lqi!=null&&D.route.lqi<g.limits.weak_signal_lqi);let U;if(D.kind==="router")U=ae(D.id,D.label),U.firstElementChild.after(W);else{U=document.createElement("li");const Z=document.createElement("span");Z.className="tree-node",Z.textContent=D.label,U.append(Z,W)}F.appendChild(U)}return B.appendChild(F),B};k.appendChild(ae("Coordinator","Coordinator"));for(const _ of N.keys())!Q.has(_)&&_!=="Coordinator"&&k.appendChild(ae(_,X.get(_)??_))}function p(g){const k=g.scan,T=je("mesh-scan"),A=je("mesh-status");je("devices-mesh-section").hidden=!k.available&&!g.devices.some(ae=>ae.kind==="router"),T.hidden=!k.available;const N=k.state==="scanning",X=o();T.disabled=!!X||N||k.retry_in_s>0,X?T.dataset.locked="":delete T.dataset.locked,je("mesh-lock").hidden=!X||!k.available,je("mesh-lock").textContent=X,T.setAttribute("aria-busy",String(N)),T.textContent=N?"Scanning…":"Scan network",A.dataset.error=String(k.state==="failed"||!!c);let Q;c?Q=c:N?Q="Scanning. This can take up to 2 minutes.":k.state==="failed"?Q=`The scan didn't finish: ${k.error}. Radiate will let you try again in ${Es(k.retry_in_s||60)}.`:k.scanned_s_ago!=null?Q=`Scanned ${go(k.scanned_s_ago)}.`:Q="Not scanned yet.",!N&&k.retry_in_s>0&&k.state!=="failed"&&!c&&(Q+=` You can scan again in ${Es(k.retry_in_s)}.`),A.textContent=Q}function x(g){s=g,w(g);const k=g.scan.scanned_s_ago!=null,T=je("devices-rooms"),A=je("devices-routers"),N=je("devices-boiler"),X=new Set;for(const Q of g.devices){X.add(Q.id);const ae=Q.kind==="router"?A:Q.kind==="relay"?N:T;u(Q,ae,k)}for(const[Q,ae]of a)X.has(Q)||(ae.remove(),a.delete(Q));je("devices-boiler-section").hidden=!N.children.length,p(g),f(g)}async function h(){if(!l){l=!0;try{x(await e.get("devices"))}catch(g){t(g)?n():s||(je("devices-summary").textContent="Couldn't load the devices. Retrying…")}l=!1,y()}}function y(){clearTimeout(r),i&&(r=setTimeout(h,s?.scan.state==="scanning"?Pc:qc))}return je("mesh-scan").addEventListener("click",async()=>{const g=je("mesh-scan");g.disabled=!0,c="";try{const k=await e.call("POST","devices/scan",{});k.status!==200&&(c=`Not started: ${typeof k.body=="object"?k.body.message:k.body}.`)}catch(k){if(t(k)){n();return}c="Not started. Check the connection and try again."}await h(),g.disabled||g.focus()}),{async available(){try{return x(await e.get("devices")),!0}catch(g){return t(g)?null:/HTTP 404|not found|reports no devices/.test(String(g?.message))?!1:null}},show(){i=!0,h()},hide(){i=!1,clearTimeout(r)}}}const pt=e=>document.getElementById(e),Vc=3e4,Kc=3e5,Jc={act:["Act on this","act"],consider:["Worth considering","consider"],info:["For information","info"]},Gc={ready:["Ready","ok"],learning:["Learning",""],not_judged:["Not judged",""]},Yc={low:"Low confidence",medium:"Medium confidence",high:"High confidence"},Ir=(e,t,n)=>`${e} ${e===1?t:n}`;function Xc(e){const t=e.summary;if(t.total){const n=[];return t.act&&n.push(`${t.act} to act on`),t.consider&&n.push(`${t.consider} to consider`),t.info&&n.push(`${t.info} for information`),`${Ir(t.total,"suggestion","suggestions")}: ${n.join(", ")}.`}return t.rooms_learning&&!t.rooms_ready?"Nothing to suggest yet. Radiate is still learning.":"Nothing to suggest."}function Qc(e){const t=e.summary,n=Math.round(e.settings.min_learning_h);return t.rooms_learning&&!t.rooms_ready?`Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${n} h of learning; you can see how far each room has got below.`:t.rooms_learning?`The rooms Radiate can judge so far heat up and hold their warmth as expected. ${Ir(t.rooms_learning,"room is","rooms are")} still learning.`:t.rooms_ready?"Every room Radiate can judge heats up and holds its warmth as expected.":"None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them."}function Zc(e){return`${Yc[e.confidence]??"Confidence unknown"}. ${e.basis}`}function ed(e){const t=e.summary;return t.rooms_compared>=t.min_rooms?"":`Rooms are compared with each other once ${t.min_rooms} have enough learning. ${t.rooms_compared?`${t.rooms_compared} so far.`:"None yet."}`}function td({transport:e,isAuthError:t,onAuth:n,onCount:o}){const a=new Map,s=new Map;let r=null,i=null,l=!1,c=!1;function d(h){let y=a.get(h.id);y||(y=pt("suggestion-tpl").content.firstElementChild.cloneNode(!0),a.set(h.id,y));const[g,k]=Jc[h.severity]??["",""];y.dataset.severity=h.severity,y.querySelector(".name").textContent=h.title;const T=y.querySelector(".badge");return T.textContent=g,T.dataset.kind=k,y.querySelector(".sg-evidence").textContent=h.evidence,y.querySelector(".sg-action").textContent=h.action,y.querySelector(".sg-basis").textContent=Zc(h),y}function u(h,y){let g=s.get(h.room_id);g||(g=pt("learning-tpl").content.firstElementChild.cloneNode(!0),s.set(h.room_id,g)),g.querySelector(".lr-name").textContent=h.room_name;const[k,T]=Gc[h.status]??[h.status,""],A=g.querySelector(".badge");A.textContent=k,A.dataset.kind=T,g.querySelector(".lr-note").textContent=h.note;const N=g.querySelector(".meter");N.hidden=h.status!=="learning";const X=Math.max(0,Math.min(1,h.hours/Math.max(1,y)));return N.firstElementChild.style.transform=`scaleX(${X})`,g}function w(h,y){let g=h.firstElementChild;for(const k of y)k===g?g=g.nextElementSibling:h.insertBefore(k,g);for(;g;){const k=g.nextElementSibling;g.remove(),g=k}}function f(h){r=h,o?.(h.summary.act),pt("suggestions-summary").textContent=Xc(h);const y=pt("suggestions-list"),g=new Set(h.suggestions.map(Q=>Q.id));for(const Q of a.keys())g.has(Q)||a.delete(Q);w(y,h.suggestions.map(d));const k=pt("suggestions-empty"),T=h.summary.rooms_learning>0&&!h.summary.rooms_ready;k.hidden=h.suggestions.length>0&&!T,k.dataset.state=T?"learning":"clear",pt("suggestions-empty-h").textContent=T?"Still learning":"Nothing to suggest",pt("suggestions-empty-text").textContent=Qc(h);const A=pt("learning-list"),N=new Set(h.learning.map(Q=>Q.room_id));for(const Q of s.keys())N.has(Q)||s.delete(Q);w(A,h.learning.map(Q=>u(Q,h.settings.min_learning_h))),pt("learning-section").hidden=!h.learning.length;const X=pt("learning-compare");X.textContent=ed(h),X.hidden=!X.textContent}async function p(){if(!c){c=!0;try{f(await e.get("suggestions"))}catch(h){t(h)?n():!r&&l&&(pt("suggestions-summary").textContent="Couldn't load the suggestions. Retrying…")}c=!1,x()}}function x(){clearTimeout(i),i=setTimeout(p,l?Vc:Kc)}return{async available(){try{return f(await e.get("suggestions")),x(),!0}catch(h){return t(h)?null:/HTTP 404|not found/.test(String(h?.message))?!1:null}},show(){l=!0,p()},hide(){l&&(l=!1,x())}}}const Te=e=>document.getElementById(e),nd=6e4,od=6e5,ad="−",Ln="–",Hr=["January","February","March","April","May","June","July","August","September","October","November","December"],sd=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],zo=e=>{const[t,n,o]=String(e).split("-").map(Number);return new Date(Date.UTC(t,n-1,o))},rd=e=>{const t=zo(e);return`${t.getUTCDate()} ${Hr[t.getUTCMonth()]}`},cn=e=>{const t=zo(e);return`${t.getUTCDate()} ${Hr[t.getUTCMonth()].slice(0,3)}`},Va=e=>{const t=zo(e);return`${sd[t.getUTCDay()]} ${cn(e)}`};function ft(e){const t=Math.abs(e);return t<9.95?t.toFixed(1):String(Math.round(t))}const Ts=e=>`${ft(e)} ${ft(e)==="1.0"?"litre":"litres"}`;function Fr(e,t=1){if(e==null)return Ln;const n=Number(e.toFixed(t));return n<0?`${ad}${Math.abs(n).toFixed(t)}`:n.toFixed(t)}const Xo=(e,t=1)=>e==null?Ln:e.toFixed(t),On=e=>e==null?Ln:`${Math.round(e*100)}%`;function id(e){return e==null?"with no room in use to keep warm":`with rooms in use warm ${On(e)} of the time`}function jr(e){if(e.status==="ready"&&e.totals){const t=e.totals,n=rd(t.since),o=id(t.warm_share);return Math.abs(t.litres_saved)<.05?`About the same oil as the baseline since ${n}, ${o}.`:t.litres_saved<0?`About ${Ts(t.litres_saved)} more than the baseline since ${n}, ${o}.`:`About ${Ts(t.litres_saved)} of oil saved since ${n}, ${o}.`}return e.status==="learning"?ld(e):dd(e)}function ld(e){return`Still learning how much oil this house uses: ${e.why??`${e.progress.eligible_days} of ${e.progress.needed_days} days`}.`}function cd(e){const t=e.progress,n=Math.max(0,t.needed_days-t.eligible_days);return`${n?`Figures start once ${t.needed_days} full days have counted, so at least ${n} more ${n===1?"day":"days"}`:`${t.eligible_days} days have counted`}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`}const Wr={"no household":["Savings need a household","The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare."],"no outdoor sensor":["Savings need an outdoor sensor","Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add a Zigbee outdoor sensor as house.outdoor_sensor in the house file, or set house.outdoor_source to home_assistant and pick an outdoor entity in the Radiate integration's options."],"no outdoor readings yet":["Savings need outdoor readings","Radiate takes the outdoor temperature from Home Assistant, and no fresh reading has arrived yet. Check the outdoor entity in the Radiate integration's options, and that it reports at least every few hours."],"no nozzle rating":["Savings need the nozzle rating","Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record."]};function dd(e){return(Wr[e.why]??["Savings aren't measured yet"])[0]}function ud(e){return(Wr[e.why]??["",`Radiate can't measure savings yet: ${e.why??"no reason given"}.`])[1]}function hd(e){return[e.litres_upper_bound?"Litres are an upper bound until the burner itself is measured.":e.basis_text??"",e.outdoor?.text??""].filter(Boolean).join(" ")}const pd=e=>{const t=zo(e);return t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7),t.toISOString().slice(0,10)};function Rs(e,t="days"){const n=e.days??[];if(t!=="weeks")return n.map(a=>({key:a.date,label:Va(a.date),tick:cn(a.date),counted:a.eligible?1:0,total:1,eligible:a.eligible,why:a.why,litres:a.eligible?a.litres:null,baseline:a.eligible?a.litres_baseline:null,saved:a.eligible?a.litres_saved:null,warm:a.warm_share,deficit:a.comfort_deficit_kh,outdoor:a.outdoor_mean_c}));const o=new Map;for(const a of n){const s=pd(a.date);o.has(s)||o.set(s,[]),o.get(s).push(a)}return[...o].map(([a,s])=>{const r=s.filter(c=>c.eligible),i=c=>r.length&&r.every(d=>d[c]!=null)?r.reduce((d,u)=>d+u[c],0):null,l=s.filter(c=>c.comfort_deficit_kh!=null);return{key:a,week:!0,label:`Week of ${cn(a)}`,tick:cn(a),counted:r.length,total:s.length,eligible:r.length>0,why:r.length?null:[...new Set(s.map(c=>c.why).filter(Boolean))].join("; ")||"no day counted",litres:i("litres"),baseline:i("litres_baseline"),saved:i("litres_saved"),warm:null,deficit:l.length?l.reduce((c,d)=>c+d.comfort_deficit_kh,0):null,outdoor:null}})}function Ur(e){if(!e.eligible)return`${e.label}: not counted, ${e.why}.`;const t=[];e.week&&t.push(`${e.counted} of ${e.total} ${e.total===1?"day":"days"} counted`),e.litres!=null&&t.push(`${e.litres.toFixed(1)} L used`),e.saved!=null&&(t.push(`baseline about ${e.baseline.toFixed(1)} L`),Math.abs(e.saved)<.05?t.push("about the same as the baseline"):e.saved<0?t.push(`about ${ft(e.saved)} L more than the baseline`):t.push(`about ${ft(e.saved)} L saved`));const n=[];e.warm!=null&&n.push(`rooms in use warm ${On(e.warm)} of the time`),e.deficit!=null&&n.push(`${e.deficit.toFixed(1)} degree-hours short`),e.outdoor!=null&&n.push(`${e.outdoor.toFixed(1)}° outside on average`);const o=`${e.label}: ${t.join(", ")}.`;return n.length?`${o} ${n.join(", ").replace(/^./,a=>a.toUpperCase())}.`:o}function fd(e,t,n="days"){const o=n==="weeks"?"week":"day";if(!t.length)return`Oil used each ${o}: no full ${o} yet.`;const a=`${t.length} ${t.length===1?o:`${o}s`} from ${t[0].tick} to ${t.at(-1).tick}`,s=t.filter(d=>d.eligible),r=t.length-s.length,i=r?` ${r} not counted.`:"";if(e.status!=="ready")return`Bar chart of oil used each ${o}, ${a}. ${s.length} counted so far.${i}`;const l=s.filter(d=>d.saved!=null&&d.saved>=.05).length,c=s.filter(d=>d.saved!=null&&d.saved<=-.05).length;return`Bar chart of oil used each ${o} against the baseline, ${a}. Less than the baseline on ${l}, more on ${c}.${i}`}function md(e){return(e.days??[]).map(t=>[Va(t.date),t.eligible?"Yes":`No, ${t.why}`,Xo(t.litres),Xo(t.litres_baseline),Fr(t.litres_saved),t.outdoor_mean_c==null?Ln:`${t.outdoor_mean_c.toFixed(1)}°`,On(t.warm_share),Xo(t.comfort_deficit_kh)])}function gd(e){if(e.status==="ready"&&e.totals){const a=e.totals,s=a.percent_saved,r=s==null?"":s<0?`${Math.abs(s).toFixed(1)}% more than the baseline`:`${s.toFixed(1)}% less than the baseline`;return[[a.litres_saved<0?"Oil over the baseline":"Oil saved",`About ${ft(a.litres_saved)} L`,r],["Oil used",`${ft(a.litres_used)} L`,`Baseline about ${ft(a.litres_baseline)} L`],["Rooms in use warm",On(a.warm_share),`${a.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],["Days counted",String(a.days),`Since ${cn(a.since)}`]]}const t=(e.days??[]).filter(a=>a.eligible&&a.litres!=null),n=t.reduce((a,s)=>a+s.litres,0),o=(e.days??[]).filter(a=>!a.partial&&a.warm_share!=null).at(-1);return[["Days counted",`${e.progress.eligible_days} of ${e.progress.needed_days}`,""],["Oil used on those days",t.length?`${ft(n)} L`:Ln,t.length?`${ft(n/t.length)} L a day on average${e.litres_upper_bound?", an upper bound":""}`:""],["Rooms in use warm",o?On(o.warm_share):Ln,o?`On ${cn(o.date)}`:""]]}function bd(e){return e.status==="ready"?jr(e):""}const Ls=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Ge=e=>Math.round(e*10)/10;function wd(e){if(!(e>0))return 1;const t=e/4,n=10**Math.floor(Math.log10(t));return[1,2,2.5,5,10].map(o=>o*n).find(o=>o>=t)}function yd(e,{width:t,height:n,ready:o,active:a=e.length-1,labelEvery:s}){const d=Math.max(10,t-40-4),u=Math.max(10,n-10-22),w=Math.max(0,...e.flatMap(A=>[A.litres??0,o?A.baseline??0:0])),f=wd(w),p=Math.max(f,Math.ceil(w/f)*f),x=A=>Ge(10+u-A/p*u),h=d/Math.max(1,e.length),y=Math.max(3,Math.min(h*.78,40)),g=Math.max(2,y*(o?.56:1)),k=s??Math.max(1,Math.ceil(e.length/Math.max(1,Math.floor(d/56)))),T=[];T.push(`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="false">`),T.push('<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>');for(let A=0;A<=p+1e-9;A+=f){const N=x(A);T.push(`<line class="${A===0?"sv-zero":"sv-grid"}" x1="40" x2="${t-4}" y1="${N}" y2="${N}"/>`);const X=A+f>p+1e-9?" L":"";T.push(`<text class="sv-ytick" x="34" y="${N+4}" text-anchor="end">${Number(A.toFixed(2))}${X}</text>`)}return e.forEach((A,N)=>{const X=40+h*(N+.5),Q=N===a?0:-1;T.push(`<g class="sv-slot" data-i="${N}" tabindex="${Q}" role="img" aria-label="${Ls(Ur(A))}" data-counted="${A.eligible}">`),T.push(`<rect class="sv-hit" x="${Ge(40+h*N)}" y="10" width="${Ge(h)}" height="${u}"/>`),!A.eligible||A.litres==null?T.push(`<rect class="sv-empty" x="${Ge(X-y/2)}" y="10" width="${Ge(y)}" height="${u}"/>`):(T.push(`<rect class="sv-act" x="${Ge(X-g/2)}" y="${x(A.litres)}" width="${Ge(g)}" height="${Ge(x(0)-x(A.litres))}"/>`),o&&A.baseline!=null&&T.push(`<rect class="sv-base" x="${Ge(X-y/2)}" y="${x(A.baseline)}" width="${Ge(y)}" height="${Ge(x(0)-x(A.baseline))}"/>`)),T.push(`<rect class="sv-ring" x="${Ge(X-y/2-3)}" y="7" width="${Ge(y+6)}" height="${u+6}"/>`),T.push("</g>"),N%k===0&&T.push(`<text class="sv-xtick" x="${Ge(X)}" y="${n-6}" text-anchor="middle">${Ls(A.tick)}</text>`)}),T.push("</svg>"),T.join("")}function vd(e){if(e.status!=="ready"||!e.totals)return[];const t=(e.days??[]).filter(a=>a.eligible&&a.litres_saved!=null);let n=e.totals.litres_saved-t.reduce((a,s)=>a+s.litres_saved,0);const o=[];for(const a of t)n+=a.litres_saved,o.push([a.date,n]);return o}function kd(e,{width:t,height:n}){const i=e.map(p=>p[1]),l=Math.min(0,...i),d=Math.max(0,...i)-l||1,u=p=>Ge(34+(e.length<2?0:p/(e.length-1)*(t-34-8))),w=p=>Ge(8+(1-(p-l)/d)*(n-8-8)),f=e.map((p,x)=>`${x?"L":"M"}${u(x)} ${w(p[1])}`).join(" ");return[`<svg class="sv-svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" aria-hidden="true">`,`<line class="sv-zero" x1="34" x2="${t-8}" y1="${w(0)}" y2="${w(0)}"/>`,`<text class="sv-ytick" x="28" y="${w(0)+4}" text-anchor="end">0</text>`,`<path class="sv-line" d="${f}"/>`,e.length?`<rect class="sv-dot" x="${u(e.length-1)-3}" y="${w(i.at(-1))-3}" width="6" height="6"/>`:"","</svg>"].join("")}function $d(e,t){if(!t.length)return"";const n=t.at(-1)[1],o=cn(e.totals.since);return Math.abs(n)<.05?`About the same oil as the baseline in all since ${o}.`:n<0?`Running total: about ${ft(n)} L more than the baseline since ${o}.`:`Running total: about ${ft(n)} L saved since ${o}.`}function xd({transport:e,isAuthError:t,onAuth:n,onView:o}){let a=null,s=null,r=null,i=!1,l=!1,c="days",d=null,u=[],w=0;const f=()=>Te("savings-chart");function p(_,V){const B=Te(_);B.textContent!==V&&(B.textContent=V),B.hidden=!V}function x(_){Te("savings-stats").replaceChildren(...gd(_).map(([B,m,P])=>{const F=document.createElement("div"),D=document.createElement("dt");D.textContent=B;const W=document.createElement("dd"),U=document.createElement("span");if(U.textContent=m,W.append(U),P){const Z=document.createElement("span");Z.className="sub",Z.textContent=P,W.append(Z)}return F.append(D,W),F}))}function h(_){const V=u[_];Te("savings-readout").textContent=V?Ur(V):""}function y(){const _=f(),V=Math.floor(_.clientWidth);if(!V)return;w=V;const B=_.contains(document.activeElement)?document.activeElement.dataset.i:null;let m=u.findIndex(F=>F.key===d);m<0&&(m=u.length-1);const P=V<520;_.innerHTML=yd(u,{width:V,height:P?180:220,ready:a.status==="ready",active:m}),_.setAttribute("aria-label",fd(a,u,c)),h(m),B!=null&&_.querySelector(`.sv-slot[data-i="${m}"]`)?.focus()}function g(_){const V=f().querySelectorAll(".sv-slot");if(!V.length)return;const B=Math.max(0,Math.min(V.length-1,_));for(const m of V)m.setAttribute("tabindex","-1");V[B].setAttribute("tabindex","0"),V[B].focus(),d=u[B]?.key??null,h(B)}function k(){const _=f();_.addEventListener("keydown",V=>{const B=Number(document.activeElement?.dataset?.i);if(Number.isNaN(B))return;const m={ArrowRight:B+1,ArrowLeft:B-1,Home:0,End:u.length-1}[V.key];m!=null&&(V.preventDefault(),g(m))}),_.addEventListener("focusin",V=>{const B=Number(V.target?.dataset?.i);Number.isNaN(B)||(d=u[B]?.key??null,h(B))}),_.addEventListener("click",V=>{const B=V.target.closest?.(".sv-slot");B&&g(Number(B.dataset.i))}),_.addEventListener("pointerover",V=>{const B=V.target.closest?.(".sv-slot");B&&V.pointerType==="mouse"&&h(Number(B.dataset.i))}),_.addEventListener("pointerleave",()=>{const V=u.findIndex(B=>B.key===d);h(V<0?u.length-1:V)}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&i&&Math.floor(_.clientWidth)!==w&&y()}).observe(_)}function T(_){const V=_.rooms??[];if(Te("savings-rooms-section").hidden=!V.length,!V.length)return;const B=Math.max(...V.map(F=>Math.abs(F.litres_saved)),.01),m=V.some(F=>F.litres_saved<0),P=Te("savings-rooms");P.dataset.negative=String(m),P.replaceChildren(...V.map(F=>{const D=document.createElement("li");D.className="sv-room";const W=document.createElement("span");W.className="sv-room-name",W.textContent=F.name;const U=document.createElement("span");U.className="sv-room-track",U.setAttribute("aria-hidden","true");const Z=document.createElement("span");Z.className="sv-room-fill",Z.dataset.sign=F.litres_saved<0?"minus":"plus",Z.style.transform=`scaleX(${Math.abs(F.litres_saved)/B})`,U.append(Z);const se=document.createElement("span");se.className="sv-room-value",se.textContent=`${Fr(F.litres_saved)} L`;const de=document.createElement("span");return de.className="sv-room-sub",de.textContent=F.warm_share==null?"Not in use in this time.":`Warm ${On(F.warm_share)} of the time in use, ${F.comfort_deficit_kh.toFixed(1)} degree-hours short.`,D.append(W,U,se,de),D}))}function A(_){Te("savings-table-body").replaceChildren(...md(_).map(B=>{const m=document.createElement("tr");return B.forEach((P,F)=>{const D=document.createElement(F===0?"th":"td");F===0&&(D.scope="row"),D.textContent=P,m.append(D)}),m})),Te("savings-table-empty").hidden=(_.days??[]).length>0}function N(_){a=_,o?.(_);const V=JSON.stringify(_);if(V===s)return;s=V;const B=_.status;if(Te("savings").dataset.state=B,p("savings-headline",jr(_)),Te("savings-missing").hidden=B!=="unavailable",p("savings-missing-text",B==="unavailable"?ud(_):""),Te("savings-body").hidden=B==="unavailable",B==="unavailable")return;p("savings-baseline",_.baseline?.text??""),p("savings-basis",hd(_));const m=B==="learning";if(Te("savings-progress").hidden=!m,m){const W=_.progress;Te("savings-meter").style.transform=`scaleX(${Math.max(0,Math.min(1,W.eligible_days/Math.max(1,W.needed_days)))})`,p("savings-learning",cd(_))}x(_),Te("savings-chart-h").textContent=m?"Oil used each day so far":"Oil used against the baseline",Te("savings-legend-base").hidden=m,Te("savings-modes").hidden=(_.days??[]).length<8,u=Rs(_,c),Te("savings-chart-empty").hidden=u.length>0,Te("savings-chart-wrap").hidden=!u.length,i?y():w=0;const P=(_.days??[]).filter(W=>!W.eligible);Te("savings-skipped").replaceChildren(...P.map(W=>{const U=document.createElement("li");return U.textContent=`${Va(W.date)}: ${W.why}.`,U})),Te("savings-skipped-section").hidden=!P.length;const D=vd(_);if(Te("savings-running").hidden=D.length<2,D.length>=2){const W=Te("savings-line-chart");W.innerHTML=kd(D,{width:Math.max(200,Math.floor(W.clientWidth)||320),height:90}),p("savings-running-text",$d(_,D))}T(_),A(_)}async function X(){if(!l){l=!0;try{N(await e.get("savings"))}catch(_){t(_)?n():!a&&i&&(Te("savings-headline").textContent="Couldn't load the savings. Retrying…")}l=!1,Q()}}function Q(){clearTimeout(r),r=setTimeout(X,i?nd:od)}for(const _ of document.querySelectorAll("#savings-modes [data-mode]"))_.addEventListener("click",()=>{if(_.dataset.mode!==c){c=_.dataset.mode;for(const V of document.querySelectorAll("#savings-modes [data-mode]"))V.setAttribute("aria-checked",String(V===_));d=null,a&&(u=Rs(a,c),y())}});const ae=Te("savings-table-toggle");return ae.addEventListener("click",()=>{const _=ae.getAttribute("aria-pressed")!=="true";ae.setAttribute("aria-pressed",String(_)),ae.textContent=_?"Hide table":"Show as table",Te("savings-table-wrap").hidden=!_}),k(),{async available(){try{return N(await e.get("savings")),Q(),!0}catch(_){return t(_)?null:/HTTP 404|not found/.test(String(_?.message))?!1:null}},show(){i=!0,a&&(s=null,N(a)),X()},hide(){i&&(i=!1,Q())},refresh:X}}const fe=e=>document.getElementById(e),ga="–",Sd="−",_d=6e4,Cd=500,Os={"6h":6*3600,"24h":86400,"7d":7*86400,"30d":30*86400},Ms={"6h":"the last 6 hours","24h":"the last 24 hours","7d":"the last 7 days","30d":"the last 30 days"},Ed=e=>e&&e[0].toLowerCase()+e.slice(1),xn=(e,t)=>{const n=Math.abs(e).toFixed(t);return e<0&&Number(n)!==0?`${Sd}${n}`:n},st=(e,t,n)=>`${e.toLocaleString("en-GB")} ${e===1?t:n}`;function mn(e){return e.room?`${e.room_name??e.room} ${Ed(e.label)}`:e.label}function bo(e){return e>=86400?e===86400?"1 day":`${e/86400} days`:e>=3600?`${e/3600} h`:`${e/60} min`}function tt(e,t,n=60){if(e==null||Number.isNaN(e))return ga;const o=t?.kind??"gauge";if(o==="state")return n<=60||e===0||e===1?e>=.5?"On":"Off":`on ${Math.round(e*100)}% of the time`;if(o==="level")return(t.levels??[])[Math.round(e)]??String(e);switch(t?.unit){case"°C":return`${xn(e,1)}°`;case"%":return`${xn(e,0)}%`;case"W":return`${xn(e,0)} W`;default:return Number.isInteger(e)?xn(e,0):xn(e,1)}}const Ad=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Td=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ns=new Map;function Do(e,t){let n=Ns.get(t);n||(n=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),Ns.set(t,n));const o=Object.fromEntries(n.formatToParts(new Date(e*1e3)).map(i=>[i.type,i.value])),a=Number(o.year),s=Number(o.month),r=Number(o.day);return{y:a,m:s,d:r,H:o.hour,M:o.minute,wd:new Date(Date.UTC(a,s-1,r)).getUTCDay()}}const wo=(e,t)=>{const n=Do(e,t);return`${n.H}:${n.M}`},yo=(e,t)=>{const n=Do(e,t);return`${Ad[n.wd]} ${n.d} ${Td[n.m-1]}`},Mn=(e,t)=>`${yo(e,t)} ${wo(e,t)}`;function Qo(e,t){const n=Do(e,t);return`${n.y}-${String(n.m).padStart(2,"0")}-${String(n.d).padStart(2,"0")}T${n.H}:${n.M}`}function zs(e){return e<90?"just now":e<3600?`${Math.round(e/60)} min ago`:e<172800?`${Math.round(e/3600)} h ago`:`${Math.round(e/86400)} days ago`}function Ds(e){return e<60?`in ${Math.max(1,Math.round(e))} s`:e<5400?`in ${Math.round(e/60)} min`:`in ${Math.round(e/3600)} h`}function Rd(e){if(!e?.available)return e?.why??"No raw data here.";const t=e.series?.length??0;if(!t)return"Nothing recorded yet. The first readings appear within a minute.";const n=e.retention_days?` Kept for ${st(Math.round(e.retention_days),"day","days")}.`:"";return`${st(t,"series","series")} from ${Mn(e.first,e.timezone)} to now.${n}`}function Ld(e,t,n=8){const o=String(t??"").toLowerCase().split(/\s+/).filter(Boolean);if(!o.length||!e?.series)return[];const a=[];for(const s of e.series){const r=`${mn(s)} ${s.metric} ${s.room??""} ${s.room?"":"house"}`.toLowerCase();if(o.every(i=>r.includes(i))&&a.push(s),a.length>=n)break}return a}function Od(e,t,n){const o=e?.series??[];return o.length===1?mn(o[0]):t?.scope==="room"&&!n?`${t.label}, every room`:t?.label??"Raw data"}function Md(e,t){if(!e)return"";const n=e.series.length,o=e.series.reduce((r,i)=>r+i.points.length,0),a=t&&Ms[t]?Ms[t]:`${Mn(e.from,e.timezone)} to ${Mn(e.to,e.timezone)}`,s=e.step_raised?" (a finer step would be too many points)":"";return`Every ${bo(e.step)}${s}, ${a}. ${st(n,"series","series")}, ${st(o,"point","points")}.`}function Vr(e,t,n){const o=e?.points??[];if(!o.length)return[];let a=1/0,s=-1/0,r=0;for(const[,c,d,u]of o)a=Math.min(a,d),s=Math.max(s,u),r+=c;const i=o.at(-1),l=r/o.length;return t?.kind==="state"?[["Latest",tt(i[1],t,n)],["On",`${Math.round(l*100)}%`,"of the time shown"]]:t?.kind==="level"?[["Latest",tt(i[1],t,n)]]:[["Latest",tt(i[1],t)],["Lowest",tt(a,t)],["Highest",tt(s,t)],["Average",tt(l,t)]]}function Nd(e,t,n,o,a){const s=e?.points?.[o];if(!s)return"";const[r,i,l,c]=s,d=e.room?e.room_name??e.room:e.label;let u=`${Mn(r,a)}: ${d} ${tt(i,t,n)}`;return n>60&&t?.kind==="gauge"&&l!==c&&(u+=`, between ${tt(l,t)} and ${tt(c,t)} in these ${bo(n)}`),n>60&&t?.kind==="level"&&l!==c&&(u=`${Mn(r,a)}: ${d} ${tt(l,t)} to ${tt(c,t)} in these ${bo(n)}`),`${u}.`}function zd(e,t,n=Cd){const o=[];for(const s of e?.series??[]){const r=t[s.metric];for(const[i,l,c,d]of s.points)o.push([i,mn(s),l,c,d,r])}o.sort((s,r)=>r[0]-s[0]||s[1].localeCompare(r[1]));const a=e?.step??60;return{total:o.length,rows:o.slice(0,n).map(([s,r,i,l,c,d])=>[Mn(s,e.timezone),r,tt(i,d,a),a>60&&d?.kind!=="state"?tt(l,d,60):ga,a>60&&d?.kind!=="state"?tt(c,d,60):ga])}}function Dd(e,t,n){if(!e)return{kind:"none",badge:"Not set up",line:"Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",details:[]};const o=e.queued??{},a=[["Sends to",`${e.endpoint}, ${e.protocol==="http/json"?"JSON":"protobuf"} over HTTP`]],s=o.metrics??0,r=o.logs??0;if(a.push(["Waiting to send",s||r?`${st(s,"minute","minutes")} of readings, ${st(r,"log record","log records")}`:"Nothing"]),a.push(["Sent",`${st(e.sent?.metrics??0,"data point","data points")}, ${st(e.sent?.logs??0,"log record","log records")}`]),e.dropped&&a.push(["Dropped",`${st(e.dropped,"item","items")}: the queue was full, so the oldest went first`,"warn"]),e.rejected&&a.push(["Rejected by the collector",st(e.rejected,"item","items"),"warn"]),e.status==="off")return{kind:"off",badge:"Off",line:"Turned off in the house file (export.otlp.enabled).",details:a};if(e.status==="failing"){const i=e.next_attempt?` Trying again ${Ds(Math.max(0,e.next_attempt-t))}, and keeping the data until then.`:" Retrying, and keeping the data until then.",l=e.last_success?` Last sent at ${wo(e.last_success,n)}, ${zs(t-e.last_success)}.`:"";return{kind:"attention",badge:"Failing",line:`Can't send: ${e.last_error??"no answer"}.${i}${l}`,details:a}}return e.status==="waiting"?{kind:"waiting",badge:"Waiting",line:`Nothing sent yet.${e.next_attempt?` The next send is due ${Ds(Math.max(0,e.next_attempt-t))}.`:" The first send is due within a minute."}`,details:a}:{kind:"ok",badge:"Sending",line:`Last sent at ${wo(e.last_success,n)}, ${zs(t-e.last_success)}.`,details:a}}const qs=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function qd(e,t=4){const n=e/t,o=10**Math.floor(Math.log10(n||1));for(const a of[1,2,2.5,5,10])if(a*o>=n)return a*o;return 10*o}function Pd(e,t){const n=e.step;if(t?.kind==="state")return{lo:0,hi:1,ticks:n>60?[[0,"0%"],[.5,"50%"],[1,"100%"]]:[[0,"Off"],[1,"On"]]};if(t?.kind==="level"){const i=t.levels??[];return{lo:0,hi:Math.max(1,i.length-1),ticks:i.map((l,c)=>[c,l])}}let o=1/0,a=-1/0;for(const i of e.series)for(const[,,l,c]of i.points)o=Math.min(o,l),a=Math.max(a,c);Number.isFinite(o)||(o=0,a=1),a-o<1e-9&&(o-=1,a+=1);const s=qd(a-o);o=Math.floor(o/s)*s,a=Math.ceil(a/s)*s;const r=[];for(let i=o;i<=a+s/2;i+=s){const l=Math.round(i*1e3)/1e3,c=s<1?s<.1?2:1:0,d=t?.unit==="°C"?"°":t?.unit==="%"?"%":"";r.push([l,`${xn(l,c)}${d}`])}return{lo:o,hi:a,ticks:r}}function Bd(e,t,n,o){const a=t-e,s=Math.max(2,Math.floor(o/80)),i=[3600,3*3600,6*3600,12*3600,86400,2*86400,5*86400,7*86400].find(w=>a/w<=s)??14*86400,l=[],c=Do(e,n),d=Date.UTC(c.y,c.m-1,c.d,Number(c.H),Number(c.M))/1e3-Math.floor(e/60)*60;let u=Math.ceil((e+d)/i)*i-d;for(;u<=t;u+=i)l.push([u,i>=86400?yo(u,n):wo(u,n)]);return l}const qt={left:46,right:14,top:12,bottom:26};function ba(e,t,n,o){const a=t?.kind==="level"?58:qt.left,s=Math.max(10,n-a-qt.right),r=Math.max(10,o-qt.top-qt.bottom),i=Pd(e,t),l=Math.max(1,e.to-e.from);return{left:a,w:s,h:r,y:i,x:c=>a+(c-e.from)/l*s,yv:c=>qt.top+r-(c-i.lo)/Math.max(1e-9,i.hi-i.lo)*r}}function Ps(e,t,n,o){let a="",s=null;const r=n*2.5;for(const[i,l]of e.points){const c=t.x(i).toFixed(1),d=t.yv(l).toFixed(1);s===null||i-s[0]>r?a+=`M${c} ${d}`:o?a+=`H${c}V${d}`:a+=`L${c} ${d}`,s=[i,l]}return a}function Id(e,t,n){const o=[];let a=[];for(const s of e.points)a.length&&s[0]-a.at(-1)[0]>n*2.5&&(o.push(a),a=[]),a.push(s);return a.length&&o.push(a),o.filter(s=>s.length>1).map(s=>{const r=s.map(([l,,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`),i=s.slice().reverse().map(([l,,c])=>`${t.x(l).toFixed(1)} ${t.yv(c).toFixed(1)}`);return`M${r.join("L")}L${i.join("L")}Z`}).join("")}function Hd(e,t,{width:n,height:o,focus:a}){const s=ba(e,t,n,o),r=e.timezone,i=t?.kind!=="gauge",l=[`<svg width="${n}" height="${o}" viewBox="0 0 ${n} ${o}" aria-hidden="true" focusable="false">`];for(const[u,w]of s.y.ticks){const f=s.yv(u).toFixed(1);l.push(`<line class="rd-grid" x1="${s.left}" x2="${s.left+s.w}" y1="${f}" y2="${f}"/>`),l.push(`<text class="rd-ytick" x="${s.left-6}" y="${f}" dy="0.32em" text-anchor="end">${qs(w)}</text>`)}const c=qt.top+s.h;l.push(`<line class="rd-axis" x1="${s.left}" x2="${s.left+s.w}" y1="${c}" y2="${c}"/>`);for(const[u,w]of Bd(e.from,e.to,r,s.w)){const f=s.x(u).toFixed(1);l.push(`<line class="rd-xmark" x1="${f}" x2="${f}" y1="${c}" y2="${c+4}"/>`),l.push(`<text class="rd-xtick" x="${f}" y="${c+17}" text-anchor="middle">${qs(w)}</text>`)}const d=e.series.find(u=>u.key===a)??e.series[0];if(d&&e.step>60&&t?.kind==="gauge"){const u=Id(d,s,e.step);u&&l.push(`<path class="rd-band" d="${u}"/>`)}for(const u of e.series)u!==d&&l.push(`<path class="rd-line rd-other" d="${Ps(u,s,e.step,i)}"/>`);return d&&l.push(`<path class="rd-line rd-ink" d="${Ps(d,s,e.step,i)}"/>`),l.push(`<line class="rd-cursor" x1="0" x2="0" y1="${qt.top}" y2="${c}" visibility="hidden"/>`),l.push('<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>'),l.push(`<rect class="rd-hit" x="${s.left}" y="${qt.top}" width="${s.w}" height="${s.h}"/>`),l.push("</svg>"),l.join("")}function Fd(e,t,n){const o=e.series.find(l=>l.key===n)??e.series[0];if(!o)return"Chart with no data.";const a=o.points,s=e.series.length>1?` ${st(e.series.length-1,"other series","other series")} shown thinner for comparison.`:"";if(!a.length)return`Line chart of ${mn(o)} with no data.${s}`;const i=Vr(o,t,e.step).map(([l,c])=>`${l.toLowerCase()} ${c}`).join(", ");return`Line chart of ${mn(o)}, ${yo(e.from,e.timezone)} to ${yo(e.to,e.timezone)}, every ${bo(e.step)}: ${i}.${s} Use the arrow keys to read each point.`}function jd({transport:e,isAuthError:t,onAuth:n}){let o=null,a=null,s={},r=!1,i=null,l=!1,c=0,d=null,u=null,w=0;const f={metric:"room.temperature",room:"",range:"24h",from:"",to:"",step:"auto"},p=()=>fe("data-chart"),x=()=>s[f.metric];function h(z,v){const S=fe(z);S.textContent!==v&&(S.textContent=v)}function y(z,v=""){const S=fe("data-note");S.hidden=!z,S.dataset.kind=v,h("data-note",z)}function g(){const z=new Set((o?.series??[]).map(M=>M.metric)),v=fe("data-metric"),S=[["room","Rooms"],["house","House"]].map(([M,j])=>{const Y=document.createElement("optgroup");Y.label=j;for(const L of o.metrics.filter(I=>I.scope===M&&z.has(I.metric))){const I=document.createElement("option");I.value=L.metric,I.textContent=L.label,Y.append(I)}return Y}).filter(M=>M.children.length);v.replaceChildren(...S),z.has(f.metric)||(f.metric=v.querySelector("option")?.value??""),v.value=f.metric}function k(){const z=x(),v=fe("data-room"),S=z?.scope!=="room",M=S?[]:(o?.rooms??[]).filter(Y=>o.series.some(L=>L.metric===f.metric&&L.room===Y.id)),j=document.createElement("option");j.value="",j.textContent=S?"Whole house":"Every room",v.replaceChildren(j,...M.map(Y=>{const L=document.createElement("option");return L.value=Y.id,L.textContent=Y.name,L})),(S||!M.some(Y=>Y.id===f.room))&&(f.room=""),v.value=f.room,v.disabled=S}function T(){for(const z of document.querySelectorAll("#data-range [data-range]"))z.setAttribute("aria-checked",String(z.dataset.range===f.range))}function A(){if(!o?.now||f.range==="custom")return;const z=Os[f.range];fe("data-from").value=Qo(o.now-z,o.timezone),fe("data-to").value=Qo(o.now,o.timezone)}function N(){const z=new URLSearchParams;return f.metric&&z.set("metric",f.metric),f.room&&z.set("room",f.room),f.range==="custom"?(f.from&&z.set("from",f.from),f.to&&z.set("to",f.to)):(z.set("from",String(Math.floor(o.now-Os[f.range]))),z.set("to",String(Math.ceil(o.now)))),z.set("step",f.step),z}function X(){const z=a.series.find(j=>j.key===u),v=fe("data-stats"),S=z?Vr(z,x(),a.step):[];v.hidden=!S.length;const M=a.series.length>1&&z;fe("data-stats-for").hidden=!M,h("data-stats-for",M?`Figures for ${mn(z)}, the line in ink.`:""),v.replaceChildren(...S.map(([j,Y,L])=>{const I=document.createElement("div"),K=document.createElement("dt");K.textContent=j;const oe=document.createElement("dd"),ve=document.createElement("span");if(ve.textContent=Y,oe.append(ve),L){const Oe=document.createElement("span");Oe.className="sub",Oe.textContent=L,oe.append(Oe)}return I.append(K,oe),I}))}function Q(){const z=fe("data-legend");z.hidden=a.series.length<2,z.replaceChildren(...a.series.map(v=>{const S=document.createElement("li"),M=document.createElement("button");M.type="button",M.className="rd-key",M.dataset.key=v.key,M.setAttribute("aria-pressed",String(v.key===u));const j=document.createElement("span");return j.className="rd-swatch",j.setAttribute("aria-hidden","true"),M.append(j,document.createTextNode(v.room?v.room_name??v.room:v.label)),S.append(M),S}))}function ae(){const{total:z,rows:v}=zd(a,s);fe("data-table-body").replaceChildren(...v.map(M=>{const j=document.createElement("tr");return M.forEach((Y,L)=>{const I=document.createElement(L===0?"th":"td");L===0&&(I.scope="row"),I.textContent=Y,j.append(I)}),j}));const S=a.step>60;for(const M of document.querySelectorAll(".rd-table .rd-range-col"))M.hidden=!S;for(const M of fe("data-table-body").children)M.children[3].hidden=!S,M.children[4].hidden=!S;h("data-table-note",z>v.length?`The newest ${st(v.length,"row","rows")} of ${z.toLocaleString("en-GB")}. Download the CSV for all of them.`:`${st(z,"row","rows")}, newest first.`)}function _(z){const v=a?.series.find(Oe=>Oe.key===u),S=v?.points??[];if(!S.length){h("data-readout","");return}const M=z==null?S.length-1:Math.max(0,Math.min(S.length-1,z));h("data-readout",Nd(v,x(),a.step,M,a.timezone));const j=p().querySelector("svg");if(!j)return;const Y=ba(a,x(),c,Number(j.getAttribute("height"))),[L,I]=S[M],K=j.querySelector(".rd-cursor"),oe=j.querySelector(".rd-dot"),ve=z==null?"hidden":"visible";K.setAttribute("x1",Y.x(L)),K.setAttribute("x2",Y.x(L)),oe.setAttribute("cx",Y.x(L)),oe.setAttribute("cy",Y.yv(I)),K.setAttribute("visibility",ve),oe.setAttribute("visibility",ve)}function V(){const z=p(),v=Math.floor(z.clientWidth);if(!v||!a)return;c=v;const S=v<520?200:260;z.innerHTML=Hd(a,x(),{width:v,height:S,focus:u}),z.setAttribute("aria-label",Fd(a,x(),u)),_(d)}function B(){const z=x(),v=a.series.some(S=>S.points.length);if(a.series.some(S=>S.key===u)||(u=(a.series.find(S=>S.points.length)??a.series[0])?.key??null,d=null),h("data-chart-h",Od(a,z,f.room?fe("data-room").selectedOptions[0]?.textContent:"")),h("data-meta",Md(a,f.range==="custom"?null:f.range)),fe("data-empty").hidden=v,fe("data-chart-wrap").hidden=!v,fe("data-downloads").hidden=!v,fe("data-table-toggle").hidden=!v,a.partial?y("Still indexing older readings, so part of this time may be missing for a few minutes.","cool"):y(""),!v){fe("data-stats").hidden=!0,fe("data-legend").hidden=!0;return}X(),Q(),ae(),r?V():c=0}function m(){const z=Dd(o?.export??null,Date.now()/1e3,o?.timezone??"UTC"),v=fe("data-export-badge");v.dataset.kind=z.kind,h("data-export-badge",z.badge),h("data-export-line",z.line),fe("data-export").dataset.kind=z.kind;const S=fe("data-export-list");S.hidden=!z.details.length,S.replaceChildren(...z.details.map(([M,j,Y])=>{const L=document.createElement("div");Y&&(L.dataset.kind=Y);const I=document.createElement("dt");I.textContent=M;const K=document.createElement("dd");return K.textContent=j,L.append(I,K),L}))}function P(){h("data-summary",Rd(o)),m();const z=!!o?.available;fe("data-body").hidden=!z,z&&(s=Object.fromEntries(o.metrics.map(v=>[v.metric,v])),g(),k(),T(),A(),Z())}async function F(){if(!o?.available||!f.metric)return;const z=++w;try{const v=await e.get(`data?${N()}`);if(z!==w)return;a=v,B()}catch(v){if(z!==w)return;if(t(v)){n();return}y(/HTTP 400/.test(String(v?.message))?`Not shown: ${String(v.message).replace(/^.*HTTP 400 /,"")}`:"Couldn't load the readings. Retrying…","warn")}}async function D(){if(!l){l=!0;try{o=await e.get("data/series"),P(),r&&await F()}catch(z){t(z)?n():r&&y("Couldn't load the readings. Retrying…","warn")}l=!1,W()}}function W(){clearTimeout(i),r&&(i=setTimeout(D,_d))}function U(){d=null,f.range!=="custom"?D():F()}function Z(){const z=Ld(o,fe("data-search").value),v=fe("data-results"),S=fe("data-search").value.trim()!=="";if(v.hidden=!S,!!S){if(!z.length){const M=document.createElement("li");M.className="rd-none",M.textContent="No series match. Try a room name, or a word such as temperature, valve or burner.",v.replaceChildren(M);return}v.replaceChildren(...z.map(M=>{const j=document.createElement("li"),Y=document.createElement("button");return Y.type="button",Y.className="rd-result",Y.dataset.metric=M.metric,Y.dataset.room=M.room??"",Y.textContent=mn(M),j.append(Y),j}))}}function se(){fe("data-search").addEventListener("input",Z),fe("data-search").addEventListener("keydown",S=>{S.key==="Escape"&&(fe("data-search").value="",Z()),S.key==="Enter"&&(S.preventDefault(),fe("data-results").querySelector(".rd-result")?.click())}),fe("data-results").addEventListener("click",S=>{const M=S.target.closest?.(".rd-result");M&&(f.metric=M.dataset.metric,k(),f.room=M.dataset.room,fe("data-metric").value=f.metric,k(),u=null,fe("data-search").value="",Z(),fe("data-search").focus(),U())}),fe("data-metric").addEventListener("change",S=>{f.metric=S.target.value,k(),u=null,U()}),fe("data-room").addEventListener("change",S=>{f.room=S.target.value,u=null,U()}),fe("data-step").addEventListener("change",S=>{f.step=S.target.value,U()});for(const S of document.querySelectorAll("#data-range [data-range]"))S.addEventListener("click",()=>{f.range!==S.dataset.range&&(f.range=S.dataset.range,T(),A(),U())});for(const S of["data-from","data-to"])fe(S).addEventListener("change",()=>{f.range="custom",f.from=fe("data-from").value,f.to=fe("data-to").value,T(),U()});fe("data-legend").addEventListener("click",S=>{const M=S.target.closest?.(".rd-key");if(!(!M||M.dataset.key===u)){u=M.dataset.key,d=null;for(const j of fe("data-legend").querySelectorAll(".rd-key"))j.setAttribute("aria-pressed",String(j===M));X(),V()}});const z=p();z.addEventListener("keydown",S=>{const j=a?.series.find(I=>I.key===u)?.points.length??0;if(!j)return;const Y=d??j-1,L={ArrowRight:Y+1,ArrowLeft:Y-1,Home:0,End:j-1,PageUp:Y-10,PageDown:Y+10}[S.key];L!=null&&(S.preventDefault(),d=Math.max(0,Math.min(j-1,L)),_(d))}),z.addEventListener("pointermove",S=>{const M=a?.series.find(oe=>oe.key===u),j=z.querySelector("svg");if(!M?.points.length||!j)return;const Y=ba(a,x(),c,Number(j.getAttribute("height"))),L=S.clientX-j.getBoundingClientRect().left,I=a.from+(L-Y.left)/Y.w*(a.to-a.from);let K=0;for(let oe=1;oe<M.points.length;oe++)Math.abs(M.points[oe][0]-I)<Math.abs(M.points[K][0]-I)&&(K=oe);d=K,_(d)}),z.addEventListener("pointerleave",S=>{S.pointerType==="mouse"&&(d=null,_(null))}),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{a&&r&&Math.floor(z.clientWidth)!==c&&V()}).observe(z);const v=fe("data-table-toggle");v.addEventListener("click",()=>{const S=v.getAttribute("aria-pressed")!=="true";v.setAttribute("aria-pressed",String(S)),v.textContent=S?"Hide table":"Show as table",fe("data-table-wrap").hidden=!S}),fe("data-csv").addEventListener("click",()=>pe("csv")),fe("data-json").addEventListener("click",()=>pe("json"))}function de(z){const v=a?Qo(a.to,a.timezone).slice(0,10):"data";return`radiate-${f.metric}${f.room?`-${f.room}`:""}-${v}.${z}`}async function pe(z){const v=fe("data-dl-status");v.textContent="";try{let S;if(z==="json")S=new Blob([JSON.stringify(a,null,2)],{type:"application/json"});else{const j=N();j.set("format","csv"),S=new Blob([await e.text(`data?${j}`)],{type:"text/csv"})}const M=document.createElement("a");M.href=URL.createObjectURL(S),M.download=de(z),document.body.append(M),M.click(),M.remove(),setTimeout(()=>URL.revokeObjectURL(M.href),1e3),v.textContent=`Downloaded ${M.download}.`}catch(S){if(t(S)){n();return}v.textContent="Not downloaded. Check the connection and try again."}}return se(),{async available(){try{return o=await e.get("data/series"),P(),!!o.available}catch(z){return t(z)?null:/HTTP 404|not found/.test(String(z?.message))?!1:null}},show(){r=!0,D()},hide(){r&&(r=!1,clearTimeout(i))}}}const Re=e=>String(e).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Dt=e=>e==null?"–":(Math.round(e*10)/10).toFixed(1),Bs=e=>`${String(Math.floor(e/60)%24).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,Zo=(e,t,n)=>`${e} ${e===1?t:n}`,Is=new Set(["passive","unheated"]),et=.5,Mt=14,Nt=10,Hs=/bed|bath|landing|en.?suite|nursery|study|loft|attic/i,wa=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),Fs=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16));function Sn(e){const t=[12,15,17,19,22].map(o=>[o,Fs(wa(`--t${o}`)||"#888888")]);if(e==null)return Fs(wa("--hm-none")||"#cccccc");const n=Math.max(12,Math.min(22,e));for(let o=0;o<t.length-1;o++){const[a,s]=t[o],[r,i]=t[o+1];if(n<=r)return s.map((l,c)=>Math.round(l+(i[c]-l)*((n-a)/(r-a))))}return t.at(-1)[1]}const It=(e,t=1)=>`rgb(${e.map(n=>Math.round(n*t)).join(",")})`,js=e=>It(Sn(e)),ea=e=>{const t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4},Ws=e=>.2126*ea(e[0])+.7152*ea(e[1])+.0722*ea(e[2]),Wd=[20,28,24];function Kr(e){const t=Ws(e),n=(t+.05)/(Ws(Wd)+.05),o=1.05/(t+.05);return n>=o?"#141c18":"#ffffff"}function Us(e){const t=e.filter(r=>Hs.test(r.name)),n=e.filter(r=>!Hs.test(r.name)),o=t.length&&n.length?["Ground floor","First floor"]:["Ground floor"],a={},s=(r,i)=>r.forEach((l,c)=>{a[l.id]={floor:i,x:c%3*3,y:Math.floor(c/3)*3,w:3,d:3}});return o.length===2?(s(n,0),s(t,1)):s(e,0),{floors:o,rooms:a}}const ta=34,Ud=Math.cos(Math.PI/6),Jr=Math.sin(Math.PI/6),Vs=.34,Vd=e=>Math.max(3.2,e*Jr*.8),ze=(e,t,n)=>[(e-t)*Ud*ta,(e+t)*Jr*ta-n*ta],no=e=>e.map(t=>t.map(n=>n.toFixed(1)).join(",")).join(" ");function Ks(e,t,{selected:n,interactive:o}){let a="",s="";const r=wa("--hm-line");let i=0;for(const[c,d]of Object.entries(e.rooms))t.has(c)&&(i=Math.max(i,d.x+d.w+d.y+d.d));const l=Vd(i);return e.floors.forEach((c,d)=>{const u=d*l,w=Object.entries(e.rooms).filter(([h,y])=>y.floor===d&&t.has(h)),f=Math.max(3,...w.map(([,h])=>h.x+h.w)),p=Math.max(3,...w.map(([,h])=>h.y+h.d));if(s+=`<polygon points="${no([ze(-.2,-.2,u),ze(f+.2,-.2,u),ze(f+.2,p+.2,u),ze(-.2,p+.2,u)])}" fill="none" stroke="${r}" stroke-width="1.5"/>`,d>0)for(const[h,y]of[[-.2,-.2],[f+.2,-.2],[-.2,p+.2]]){const g=ze(h,y,u),k=ze(h,y,u-l+Vs);s+=`<line x1="${g[0]}" y1="${g[1]}" x2="${k[0]}" y2="${k[1]}" stroke="${r}" stroke-dasharray="2 4"/>`}const x=ze(-.2,p+.2,u);s+=`<text class="hm-ftag" x="${x[0]-8}" y="${x[1]+4}" text-anchor="end">${Re(c)}</text>`,w.sort((h,y)=>h[1].x+h[1].y-(y[1].x+y[1].y)).forEach(([h,y])=>{const g=t.get(h),k=Sn(g.temperature),T=.05,A=y.x+T,N=y.y+T,X=y.w-2*T,Q=y.d-2*T,ae=u+Vs,_=[ze(A,N,ae),ze(A+X,N,ae),ze(A+X,N+Q,ae),ze(A,N+Q,ae)],V=[ze(A+X,N,u),ze(A+X,N+Q,u),ze(A+X,N+Q,ae),ze(A+X,N,ae)],B=[ze(A,N+Q,u),ze(A+X,N+Q,u),ze(A+X,N+Q,ae),ze(A,N+Q,ae)],m=ze(A+X/2,N+Q/2,ae),P=Kr(k);let F="";if(g.calling||g.topup||g.role==="passive"){const U=ze(A+.25,N+Q-.15,ae),Z=ze(A+Math.min(X-.25,1.4),N+Q-.15,ae);F=`<line class="hm-rad" x1="${U[0]}" y1="${U[1]}" x2="${Z[0]}" y2="${Z[1]}" stroke="${P}" stroke-width="3"/>`}const D=`${g.name}, ${g.temperature==null?"no reading":`${Dt(g.temperature)} degrees`}${g.calling?", heating":""}`,W=o?`tabindex="0" role="button" aria-pressed="${h===n}"`:"";a+=`<g class="hm-room" data-id="${Re(h)}" ${W} aria-label="${Re(D)}">
        <polygon points="${no(V)}" fill="${It(k,.62)}"/><polygon points="${no(B)}" fill="${It(k,.8)}"/>
        <polygon class="hm-top" points="${no(_)}" fill="${It(k)}"/>${F}
        <text class="hm-t" x="${m[0]}" y="${m[1]}" text-anchor="middle" fill="${P}">${Dt(g.temperature)}</text>
        ${X>=1.4?`<text class="hm-n" x="${m[0]}" y="${m[1]+13}" text-anchor="middle" fill="${P}">${Re(g.name)}</text>`:""}</g>`})}),s+a}function Js(e){requestAnimationFrame(()=>{try{const t=e.getBBox();t.width&&e.setAttribute("viewBox",`${t.x-10} ${t.y-10} ${t.width+20} ${t.height+20}`)}catch{}})}function Kd({modelEl:e,statusEl:t,planEl:n,transport:o,onSelect:a,onWeek:s,arrangeLock:r=()=>""}){let i=null,l=new Map,c=null,d=!1,u=!1,w=!1,f=0,p=null,x=null,h=0,y=null,g=null,k="";async function T(){try{const v=await o.call("GET","layout");v.status===200&&v.body?.layout?(c=v.body.layout,d=!0):v.status===404&&(u=!0)}catch{}ae()}function A(){clearTimeout(g),k="Saving…",N(),g=setTimeout(async()=>{if(u){k="This server can't keep a layout. Update Radiate to save it.",N();return}try{const v=await o.call("PUT","layout",c);d=v.status===200,k=d?"Saved.":`Not saved: ${typeof v.body=="string"?v.body:"the server refused it"}.`}catch{k="Not saved. Check the connection and move a room to try again."}N()},500)}function N(){const v=e.querySelector(".hm-save");v&&(v.textContent=k)}const X=()=>Object.keys(c.rooms).filter(v=>l.has(v)),Q=()=>[...l.keys()].filter(v=>!c.rooms[v]);function ae(){if(!c||!l.size)return;if(w){m();return}if(!e.querySelector(".hm-iso")){e.innerHTML=`
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
        </div>`,e.querySelector("[data-act=arrange]").addEventListener("click",()=>{w=!0,f=0,ae(),Z(),e.querySelector("#hm-model-h")?.focus()});const L=e.querySelector(".hm-iso");L.addEventListener("click",I=>{const K=I.target.closest(".hm-room");K&&_(K.dataset.id,K)}),L.addEventListener("keydown",I=>{const K=I.target.closest(".hm-room");K&&(I.key==="Enter"||I.key===" ")&&(I.preventDefault(),_(K.dataset.id,K))})}e.querySelector(".hm-ramp").style.background=`linear-gradient(90deg, ${[12,15,17,19,22].map(L=>It(Sn(L))).join(", ")})`,e.querySelector(".hm-guess").hidden=d;const v=r(),S=e.querySelector("[data-act=arrange]");S.disabled=!!v,v?S.dataset.locked="":delete S.dataset.locked;const M=e.querySelector("#hm-arrange-lock");M.hidden=!v,M.textContent=v;const j=e.querySelector(".hm-iso"),Y=j.contains(document.activeElement)?document.activeElement.closest(".hm-room")?.dataset.id:null;j.innerHTML=Ks(c,l,{selected:p,interactive:!0}),Y&&j.querySelector(`.hm-room[data-id="${CSS.escape(Y)}"]`)?.focus(),Js(j)}function _(v,S){a?.(v,S)}function V(){for(const v of e.querySelectorAll(".hm-room"))v.setAttribute("aria-pressed",String(v.dataset.id===p))}const B=40;function m(){const v=X().filter(L=>c.rooms[L].floor===f);let S="";for(let L=0;L<=Mt/et;L++)S+=`<line x1="${L*B*et}" y1="0" x2="${L*B*et}" y2="${Nt*B}" class="${L%2?"hm-g2":"hm-g1"}"/>`;for(let L=0;L<=Nt/et;L++)S+=`<line x1="0" y1="${L*B*et}" x2="${Mt*B}" y2="${L*B*et}" class="${L%2?"hm-g2":"hm-g1"}"/>`;const M=v.map(L=>{const I=c.rooms[L],K=l.get(L),oe=Sn(K.temperature),ve=Kr(oe);return`<g class="hm-r2${L===p?" sel":""}" data-id="${Re(L)}" transform="translate(${I.x*B},${I.y*B})" tabindex="0" role="button"
          aria-label="${Re(K.name)}, ${I.w} by ${I.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${I.w*B}" height="${I.d*B}" fill="${It(oe)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ve}">${Re(K.name)}</text>
        <text class="hm-r2s" x="7" y="${I.d*B-7}" fill="${ve}">${I.w} × ${I.d} m</text>
        <rect class="hm-handle" x="${I.w*B-14}" y="${I.d*B-14}" width="14" height="14"/></g>`}).join(""),j=Q(),Y=p&&c.rooms[p]?.floor===f?l.get(p):null;e.innerHTML=`
      <div slot="header" class="wa-split wa-gap-s">
        <h2 class="wa-heading-m" id="hm-model-h" tabindex="-1">Arrange rooms</h2>
        <div class="wa-cluster wa-gap-xs">
          <wa-button size="s" appearance="outlined" data-act="reset">Start again</wa-button>
          <wa-button size="s" variant="brand" data-act="done">Done</wa-button>
        </div>
      </div>
      <div class="wa-stack wa-gap-s">
        <div class="wa-cluster wa-gap-2xs hm-floors" role="group" aria-label="Floor">
          ${c.floors.map((L,I)=>`<button type="button" class="wa-size-s ${I===f?"wa-brand":"wa-outlined"}" data-floor="${I}" aria-pressed="${I===f}">${Re(L)}</button>`).join("")}
          ${c.floors.length<6?'<button type="button" class="wa-size-s wa-plain" data-act="add-floor">Add floor</button>':""}
        </div>
        <div class="wa-cluster wa-gap-s wa-align-items-end">
          <wa-input size="s" label="Floor name" maxlength="40" value="${Re(c.floors[f])}" data-act="rename"></wa-input>
          ${c.floors.length>1&&!v.length?'<wa-button size="s" appearance="plain" data-act="remove-floor">Remove this floor</wa-button>':""}
        </div>
        <svg class="hm-plan2d" viewBox="0 0 ${Mt*B} ${Nt*B}" aria-label="Plan of ${Re(c.floors[f])}">${S}${M}</svg>
        <div class="wa-cluster wa-gap-xs wa-align-items-center hm-tray">
          <span class="wa-caption-m wa-color-text-quiet">${j.length?"Not placed yet:":"Every room is placed."}</span>
          ${j.map(L=>`<button type="button" class="wa-size-s wa-outlined hm-chip" data-add="${Re(L)}">Place ${Re(l.get(L).name)}</button>`).join("")}
          ${Y?`<button type="button" class="wa-size-s wa-plain" data-act="unplace">Take ${Re(Y.name)} off the plan</button>`:""}
        </div>
        <p class="help-line">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
        <p class="hm-save wa-caption-m wa-color-text-quiet" role="status">${Re(k)}</p>
      </div>`,P()}function P(){const v=e;v.querySelector("[data-act=done]").addEventListener("click",()=>{w=!1,e.innerHTML="",ae(),Z(),e.querySelector("[data-act=arrange]")?.focus()}),v.querySelector("[data-act=reset]").addEventListener("click",()=>{c=Us([...l.values()]),f=0,A(),m(),Z()});for(const L of v.querySelectorAll("[data-floor]"))L.addEventListener("click",()=>{f=Number(L.dataset.floor),m()});v.querySelector("[data-act=add-floor]")?.addEventListener("click",()=>{c.floors.push(c.floors.length===1?"First floor":c.floors.length===2?"Second floor":`Floor ${c.floors.length+1}`),f=c.floors.length-1,A(),m(),Z()}),v.querySelector("[data-act=remove-floor]")?.addEventListener("click",()=>{c.floors.splice(f,1);for(const L of Object.values(c.rooms))L.floor>f&&(L.floor-=1);f=Math.max(0,f-1),A(),m(),Z()}),v.querySelector("[data-act=rename]").addEventListener("change",L=>{const I=String(L.target.value??"").trim();I&&(c.floors[f]=I,A(),m(),Z())});for(const L of v.querySelectorAll("[data-add]"))L.addEventListener("click",()=>{const I=L.dataset.add;c.rooms[I]={floor:f,...D(f)},p=I,A(),m(),Z(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus()});v.querySelector("[data-act=unplace]")?.addEventListener("click",()=>{delete c.rooms[p],A(),m(),Z()});const S=v.querySelector(".hm-plan2d"),M=L=>{const I=S.createSVGPoint();return I.x=L.clientX,I.y=L.clientY,I.matrixTransform(S.getScreenCTM().inverse())},j=L=>Math.round(L/et)*et;S.addEventListener("pointerdown",L=>{const I=L.target.closest(".hm-r2");if(!I||y)return;const K=I.dataset.id,oe=c.rooms[K],ve=M(L);p=K,y={id:K,pointer:L.pointerId,resize:L.target.classList.contains("hm-handle"),ox:ve.x/B-oe.x,oy:ve.y/B-oe.y,moved:!1},S.setPointerCapture(L.pointerId);for(const Oe of S.querySelectorAll(".hm-r2"))Oe.classList.toggle("sel",Oe.dataset.id===K)}),S.addEventListener("pointermove",L=>{if(!y||L.pointerId!==y.pointer)return;const I=c.rooms[y.id],K=M(L);y.resize?(I.w=Math.min(Mt-I.x,Math.max(1,j(K.x/B-I.x))),I.d=Math.min(Nt-I.y,Math.max(1,j(K.y/B-I.y)))):(I.x=Math.max(0,Math.min(Mt-I.w,j(K.x/B-y.ox))),I.y=Math.max(0,Math.min(Nt-I.d,j(K.y/B-y.oy)))),y.moved=!0,F(S,y.id),W()});const Y=L=>{if(!y||L.pointerId!==y.pointer)return;const{id:I,moved:K}=y;y=null,K&&A(),m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(I)}"]`)?.focus({preventScroll:!0})};S.addEventListener("pointerup",Y),S.addEventListener("pointercancel",Y),S.addEventListener("keydown",L=>{const I=L.target.closest(".hm-r2");if(!I)return;const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[L.key];if(L.key==="Enter"||L.key===" "){L.preventDefault(),p=I.dataset.id,m(),e.querySelector(`.hm-r2[data-id="${CSS.escape(p)}"]`)?.focus();return}if(!K)return;L.preventDefault();const oe=c.rooms[I.dataset.id];L.shiftKey?(oe.w=Math.min(Mt-oe.x,Math.max(1,oe.w+K[0]*et)),oe.d=Math.min(Nt-oe.y,Math.max(1,oe.d+K[1]*et))):(oe.x=Math.max(0,Math.min(Mt-oe.w,oe.x+K[0]*et)),oe.y=Math.max(0,Math.min(Nt-oe.d,oe.y+K[1]*et))),p=I.dataset.id,F(S,I.dataset.id),I.setAttribute("aria-label",`${l.get(I.dataset.id).name}, ${oe.w} by ${oe.d} metres, at ${oe.x}, ${oe.y}.`),W(),A()})}function F(v,S){const M=c.rooms[S],j=v.querySelector(`.hm-r2[data-id="${CSS.escape(S)}"]`);if(!j)return;j.setAttribute("transform",`translate(${M.x*B},${M.y*B})`);const Y=j.querySelector(".hm-body");Y.setAttribute("width",M.w*B),Y.setAttribute("height",M.d*B);const L=j.querySelector(".hm-handle");L.setAttribute("x",M.w*B-14),L.setAttribute("y",M.d*B-14);const I=j.querySelector(".hm-r2s");I.setAttribute("y",M.d*B-7),I.textContent=`${M.w} × ${M.d} m`}function D(v){const S=X().map(M=>c.rooms[M]).filter(M=>M.floor===v);for(let M=0;M<=Nt-2;M+=et)for(let j=0;j<=Mt-2;j+=et)if(!S.some(Y=>j<Y.x+Y.w&&j+2>Y.x&&M<Y.y+Y.d&&M+2>Y.y))return{x:j,y:M,w:2,d:2};return{x:0,y:0,w:2,d:2}}function W(){const v=t.querySelector(".hm-preview");v&&(v.innerHTML=Ks(c,l,{selected:p,interactive:!1}),Js(v))}function U(){let v=t.querySelector(".hm-live");return v||(t.innerHTML=`<h2 slot="header" class="wa-heading-m hm-status-h">The house now</h2>
        <div class="wa-stack wa-gap-m">
          <div class="hm-live wa-stack wa-gap-m"></div>
          <p class="help-line hm-help">The big number is rooms that want heat, out of the rooms Radiate controls. <a href="#guide/now">What the house now shows</a></p>
        </div>`,v=t.querySelector(".hm-live")),t.querySelector(".hm-help").hidden=w,t.querySelector(".hm-status-h").textContent=w?"Live model":"The house now",v}function Z(){if(!i)return;const v=U();if(w){v.innerHTML=`
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="help-line">${Zo(c.floors.length,"floor","floors")}, ${X().length} of ${Zo(l.size,"room","rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`,W();return}const S=[...l.values()],M=S.filter(ge=>!Is.has(ge.role)),j=M.filter(ge=>ge.calling),Y=S.filter(ge=>ge.temperature!=null),L=i.telemetry??{},I=L.simulated||L.boiler_linked!==!1,K=i.boiler;let oe;i.mode==="off"?oe="Heating is off.":i.mode==="frost"?oe="Frost protection only.":j.length?I?K.state==="firing"?oe=`${j.length===1?"room is":"rooms are"} heating. Burner on.`:oe=`${j.length===1?"room wants":"rooms want"} heat.`:oe=`${j.length===1?"room wants":"rooms want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:oe="No room needs heat right now.";const ve=M.map(ge=>ge.target).filter(ge=>ge!=null),Oe=ve.length?Jd(ve):null,Je=ge=>(Math.max(12,Math.min(22,ge))-12)/10*100,Ae=[...Y].sort((ge,lt)=>ge.temperature-lt.temperature),Yt=Y.map(ge=>`<rect x="${Je(ge.temperature)}%" y="14" width="4" height="26" rx="2" fill="${It(Sn(ge.temperature))}" transform="translate(-2,0)"><title>${Re(ge.name)} ${Dt(ge.temperature)}°</title></rect>`).join(""),q=[12,14,16,18,20,22].map(ge=>`<text class="hm-axis" x="${Je(ge)}%" y="58" text-anchor="middle">${ge}</text>`).join(""),ne=Oe!=null?`<rect x="${Je(Oe)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>`:"",te=Ae.length?`Coldest ${Ae[0].name} ${Dt(Ae[0].temperature)}°, warmest ${Ae.at(-1).name} ${Dt(Ae.at(-1).temperature)}°.${Oe!=null?` Most heated rooms aim for ${Dt(Oe)}°.`:""}`:"No readings yet.",ue=!L.simulated&&(i.alert_details??[]).some(ge=>ge.code==="driver.shelly"),we=I?ue?se("fire","Boiler","Not reachable","Radiate can't see or switch the boiler right now.","warning","text"):se("fire","Boiler",{idle:"Idle",lead:"Opening valves",firing:"Firing",rest:"Resting"}[K.state]??"–",K.state==="firing"?`${Math.round(K.burn_elapsed_s/60)} min so far`:`${Zo(K.starts_last_hour,"start","starts")} in the last hour`,K.state==="firing"?"brand":"neutral","text"):se("fire","Boiler","Not linked","Radiate can't switch it until the relay is set up.","neutral","text"),Ie=L.dry_run?se("eye","Dry run",String(L.intended_writes??0),"valve and boiler changes held back","warning"):se("sliders","Mode",{auto:"Auto",frost:"Frost",off:"Off"}[i.mode]??i.mode,i.settings?.demand_mode?`${Gd(i.settings.demand_mode)} demand`:"","neutral","text"),Se=se("microchip","Devices",String(h),h?h===1?"needs attention":"need attention":"all reporting well",h>0?"warning":"neutral"),Pe=M.map(ge=>ge.model?.confidence).filter(ge=>ge!=null),Be=Pe.length?Math.round(Pe.reduce((ge,lt)=>ge+lt,0)/Pe.length*100):null,Me=se("graduation-cap","Learning",Be==null?"–":`${Be}%`,Be==null?"waiting for the first burns":Be<50?"how sure Radiate is of each room, on average":"average confidence in each room","neutral");v.innerHTML=`
      <div class="hm-hero">
        <div class="hm-big readout">${j.length}<small>/${M.length}</small></div>
        <p class="wa-heading-s">${Re(oe)}</p>
      </div>
      <div class="hm-spread wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">Where every room sits</span>
        <svg role="img" aria-label="${Re(te)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${ne}${Yt}${q}</svg>
        <span class="wa-caption-m wa-color-text-quiet">${Re(te)}</span>
      </div>
      <div class="hm-cells">${we}${Ie}${Se}${Me}</div>
      ${de()}`}function se(v,S,M,j,Y,L="readout"){const I=L==="readout"?`<span class="hm-value readout">${Re(M)}</span>`:`<span class="hm-value hm-word">${Re(M)}</span>`;return`<div class="hm-cell" data-variant="${Y}">
      <span class="wa-cluster wa-gap-xs wa-caption-m wa-color-text-quiet"><wa-icon name="${v}" class="hm-cell-icon"></wa-icon>${Re(S)}</span>
      ${I}<span class="wa-caption-s wa-color-text-quiet">${Re(j)}</span></div>`}function de(){const v=new Map;for(const j of l.values()){if(Is.has(j.role)||j.next_setpoint==null||j.next_in_min==null)continue;const Y=j.next_in_min;v.has(Y)||v.set(Y,[]),v.get(Y).push(j)}const S=[...v.entries()].sort((j,Y)=>j[0]-Y[0]).slice(0,3);return S.length?`<div class="hm-next wa-stack wa-gap-2xs"><span class="wa-caption-m wa-color-text-quiet">Coming up</span><ul>${S.map(([j,Y])=>{const L=new Map;for(const K of Y)L.has(K.next_setpoint)||L.set(K.next_setpoint,[]),L.get(K.next_setpoint).push(K.name);const I=[...L.entries()].map(([K,oe])=>{const ve=oe.length<2?oe[0]:`${oe.slice(0,-1).join(", ")} and ${oe.at(-1)}`,Oe=Y.find(Ae=>Ae.next_setpoint===K)?.target,Je=Oe!=null&&K<Oe?"cools to":oe.length>1?"warm to":"warms to";return`${ve} ${oe.length>1&&Je==="cools to"?"cool to":Je} ${Dt(K)}°`}).join(". ");return`<li><time class="readout">${Bs((i.minute_of_day+j)%1440)}</time><span>${Re(I)}.</span></li>`}).join("")}</ul></div>`:""}function pe(){if(!x?.rooms?.length||!i){n.hidden=!0;return}n.hidden=!1;const v=x.now?.weekday??0,S=i.minute_of_day??x.now?.minute??0,M=x.rooms.map(j=>{const Y=[...j.days[v]?.transitions??[]].sort((K,oe)=>K.minute-oe.minute);if(!Y.length)return"";Y[0].minute>0&&Y.unshift({minute:0,setpoint:Y.at(-1).setpoint});const L=Y.map((K,oe)=>{const ve=oe+1<Y.length?Y[oe+1].minute:1440;return ve<=K.minute?"":`<span style="width:${(ve-K.minute)/1440*100}%;background:${It(Sn(K.setpoint))}" title="${Dt(K.setpoint)}° from ${Bs(K.minute)}"></span>`}).join(""),I=j.days[v]?.text??"";return`<span class="hm-pname">${Re(j.name)}</span><div class="hm-strip" role="img" aria-label="${Re(`${j.name} today: ${I}`)}">${L}<i class="hm-now" style="left:${S/1440*100}%"></i></div>`}).join("");n.querySelector(".hm-tl")||(n.innerHTML=`<div slot="header" class="wa-split wa-gap-s">
          <h2 class="wa-heading-m">Today's plan</h2>
          <wa-button size="s" appearance="plain" data-act="week"><wa-icon slot="end" name="arrow-down"></wa-icon>Week schedules</wa-button>
        </div>
        <div class="wa-stack wa-gap-s">
          <p class="help-line">Each strip is a room's day, coloured by the temperature it aims for. The upright line is now. <a href="#guide/schedules">Change the weekly times</a></p>
          <div class="hm-tl"></div>
        </div>`,n.querySelector("[data-act=week]").addEventListener("click",()=>s?.())),n.querySelector(".hm-tl").innerHTML=`${M}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`}function z(v){i=v;const S=new Map;for(const j of v.rooms)S.set(j.id,j);const M=!l.size;l=S,c||(c=Us(v.rooms)),M&&T(),w?W():ae(),Z(),pe()}return{update:z,week(v){x=v,pe()},devices(v){h=v,Z()},select(v){p=v,w||V()},redraw(){!w&&e.querySelector(".hm-iso")&&ae(),Z(),pe()},get editing(){return w}}}function Jd(e){const t=new Map;for(const n of e)t.set(n,(t.get(n)??0)+1);return[...t.entries()].sort((n,o)=>o[1]-n[1]||o[0]-n[0])[0][0]}const Gd=e=>e.charAt(0).toUpperCase()+e.slice(1),Gs="radiate.guideNote";function Yd({root:e}){const t=n=>n?e.querySelector(`#g-${CSS.escape(n)} > h3`):null;return{show(){},hide(){},reveal(n){const o=t(n);return o?(o.focus({preventScroll:!0}),o.scrollIntoView({block:"start"}),!0):!1}}}function Xd({note:e,tab:t}){let n=!1;try{n=localStorage.getItem(Gs)==="dismissed"}catch{}e.hidden=n;const o=()=>{e.hidden=!0;try{localStorage.setItem(Gs,"dismissed")}catch{}};e.querySelector("[data-act=open]").addEventListener("click",o),e.querySelector("[data-act=dismiss]").addEventListener("click",()=>{o(),t&&!t.hidden&&t.focus()})}const ct=e=>document.getElementById(e),Ys=15e3,Qd={zigbee:"Zigbee sensor",home_assistant:"Home Assistant",both:"Both, sensor first",eco:"Eco",comfort:"Comfort",normal:"Normal",internal_sensor_only:"Valve's own sensor",passive:"Bypass",unheated:"No radiator",episodic:"Open fire",continuous:"Range cooker",in_use:"In use",occasional:"Occasional",unused:"Unused"},Zd={app:"Set here",house_file:"House file",default:"Default"},sn=e=>Qd[e]??String(e),ya=(e,t,n)=>`${e} ${e===1?t:n}`,Gr=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,tn=e=>`st-${e.replace(/[^a-z0-9_]/gi,"-")}`;function va(e,t){const n=Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));return t?t==="°C"?`${n}°`:t==="%"?`${n}%`:`${n} ${t}`:n}function Ht(e,t){if(t==null||t==="")return"–";switch(e.kind){case"number":case"integer":return va(Number(t),e.unit);case"bool":return t?"On":"Off";case"list":return Array.isArray(t)&&t.length?t.join(", "):"–";case"use":return typeof t=="string"?sn(t):`Weekdays ${sn(t.weekdays).toLowerCase()}, weekend ${sn(t.weekend).toLowerCase()}`;case"choice":return sn(t);default:return String(t)}}function eu(e){const t=[e.help];return(e.kind==="number"||e.kind==="integer")&&e.min!=null&&e.max!=null&&t.push(`${va(e.min,null)} to ${va(e.max,e.unit)}.`),!e.secret&&e.default!=null&&e.default!==""&&t.push(`Default ${Ht(e,e.default)}.`),e.restart&&t.push("Used after a restart."),t.join(" ")}function tu(e){return e.secret?e.is_set?e.source==="house_file"&&e.env.length?`Set from ${e.env.join(", ")}`:e.source==="app"?"Set here":"Set in the house file":"Not set":e.source==="house_file"&&e.env.length?`House file, from ${e.env.join(", ")}`:Zd[e.source]??e.source}function nu(e){return e.secret?e.house_file_set?"Use the house file's":"Clear it":e.house_file_set?`Use the house file's, ${Ht(e,e.house_file_value)}`:e.default!=null?`Use the default, ${Ht(e,e.default)}`:"Use the default"}function ou(e,t){const n=e.pending_restart.length;if(!n)return"";const o=e.pending_restart.map(t);return`Restart Radiate to use ${ya(n,"changed setting","changed settings")}: ${Gr(o)}.`}function au(e,t){return e.length&&t.length?"Saved. Some changes are in use now; restart Radiate for the rest.":t.length?"Saved. Restart Radiate to use it.":e.length?"Saved. In use now.":"Saved."}function Xs(e,t){switch(e.kind){case"number":case"integer":{const n=String(t).trim();if(!n)return null;const o=Number(n.replace(",","."));return Number.isFinite(o)?o:n}case"list":{const n=String(t).split(/[,\s]+/).map(o=>o.trim()).filter(Boolean);return n.length?n:null}case"secret":return t===""?void 0:t;case"text":case"choice":return String(t).trim()===""?null:String(t).trim();default:return t}}const su=(e,t)=>JSON.stringify(e??null)===JSON.stringify(t??null);function Yr(e){if(!e.secret)return e.source==="default"?null:e.value}function le(e,t={},...n){const o=document.createElement(e);for(const[a,s]of Object.entries(t))s==null||s===!1||(a==="class"?o.className=s:a==="text"?o.textContent=s:a in o&&typeof s!="string"?o[a]=s:o.setAttribute(a,s===!0?"":s));for(const a of n)a&&o.append(a);return o}function ru(e,t,n,o){const a=le("div",{class:"seg",role:"radiogroup","aria-label":e});let s=n;const r=t.map(([l,c])=>{const d=le("button",{type:"button",role:"radio",text:c});return d.dataset.value=JSON.stringify(l),d.addEventListener("click",()=>{s=l,i(),o()}),d.addEventListener("keydown",u=>{const w=r.indexOf(d),f=u.key==="ArrowRight"||u.key==="ArrowDown"?1:u.key==="ArrowLeft"||u.key==="ArrowUp"?-1:0;if(!f)return;u.preventDefault();const p=r[(w+f+r.length)%r.length];p.click(),p.focus()}),a.append(d),d}),i=()=>{for(const l of r){const c=l.dataset.value===JSON.stringify(s);l.setAttribute("aria-checked",String(c)),l.tabIndex=c?0:-1}r.some(l=>l.tabIndex===0)||(r[0].tabIndex=0)};return i(),{node:a,get:()=>s,focus:()=>(r.find(l=>l.tabIndex===0)??r[0]).focus()}}function Qs(e,t,n,o,a){const s=le("select",{id:e,"aria-describedby":a});for(const[r,i]of t)s.append(le("option",{value:r,text:i}));return n!=null&&!t.some(([r])=>r===n)&&s.append(le("option",{value:n,text:sn(n)})),s.value=n??"",s.addEventListener("change",o),s}function iu(e,t,n,o){const a=Yr(e);if(e.kind==="bool"){const i=[[!0,"On"],[!1,"Off"]];e.optional&&i.unshift([null,"Not set"]);const l=ru(e.label,i,e.optional?a:a??e.default,o);return l.node.setAttribute("aria-describedby",n),l.node.id=t,{node:l.node,get:()=>l.get(),focus:l.focus}}if(e.kind==="choice"){const i=e.choices.map(c=>[c,sn(c)]);(e.optional||a==null)&&i.unshift(["",e.optional?"Not set":`Default, ${Ht(e,e.default)}`]);const l=Qs(t,i,a,o,n);return{node:l,get:()=>Xs(e,l.value),focus:()=>l.focus()}}if(e.kind==="use"){const i=[["","Not set"],...e.choices.map(w=>[w,sn(w)])],l=typeof a=="string"?[a,a]:a?[a.weekdays,a.weekend]:["",""],c=le("div",{class:"st-use",role:"group",id:t,"aria-describedby":n}),d=["Weekdays","Weekend"].map((w,f)=>{const p=`${t}-${f}`,x=Qs(p,i,l[f]||"",o);return c.append(le("span",{class:"st-use-part"},le("label",{for:p,text:w}),x)),x});return{node:c,get:()=>{const[w,f]=d.map(p=>p.value);return!w&&!f?null:w===f?w:{weekdays:w||null,weekend:f||null}},focus:()=>d[0].focus()}}const s=le("input",{id:t,"aria-describedby":n,autocomplete:"off",spellcheck:"false"});return e.kind==="number"||e.kind==="integer"?(s.type="text",s.inputMode=e.kind==="integer"||(e.min??0)>=0?e.kind==="integer"?"numeric":"decimal":"text",s.className="num",s.value=a==null?"":String(a),a==null&&e.default!=null&&(s.placeholder=String(e.default))):e.kind==="secret"?(s.type="password",s.autocomplete="new-password",s.placeholder=e.is_set?"Set. Type to replace it":"Not set"):e.kind==="list"?(s.type="text",s.value=Array.isArray(a)?a.join(", "):"",!s.value&&Array.isArray(e.default)&&(s.placeholder=e.default.join(", "))):(s.type="text",s.value=a==null?"":String(a),!s.value&&e.default!=null&&(s.placeholder=String(e.default))),s.addEventListener("input",o),{node:e.unit&&(e.kind==="number"||e.kind==="integer")?le("span",{class:"unit"},s,le("span",{text:e.unit})):s,get:()=>Xs(e,s.value),focus:()=>s.focus(),input:s}}function lu({transport:e,isAuthError:t,onAuth:n,onOpenSetup:o,onShowSchedules:a,moreSections:s=()=>[]}){let r=null,i=!1,l=!1;const c=new Map,d=new Set;let u=null,w=!1;const f=new Map,p=async(m,P,F)=>{try{return await e.call(m,P,F)}catch(D){throw t(D)&&n(),D}};async function x(){if(!l){l=!0;try{const m=await p("GET","settings/config");m.status===200&&(r=m.body,y())}catch{ct("settings-summary").textContent="Couldn't load the settings. Try again in a moment."}finally{l=!1}}}function h(m){return f.get(m)??m}function y(){f.clear();for(const U of r.sections){for(const Z of U.fields??[])f.set(Z.path,Z.label);for(const Z of U.rooms??[])for(const se of Z.fields)f.set(se.path,`${Z.name} ${se.label.toLowerCase()}`)}const m=r.saved.length;ct("settings-summary").textContent=m?`${ya(m,"setting is","settings are")} set here, over the house file.`:"Every setting comes from the house file or its default.",ct("settings-where").textContent=r.saved_at?`Changes are saved to ${r.saved_at}. The house file isn't changed.`:"In the demo, changes are not saved to a file and end when the demo does.";const P=ct("settings-restart");P.hidden=!r.pending_restart.length,ct("settings-restart-text").textContent=ou(r,h);const F=ct("settings-problems");if(F.hidden=!r.problems.length,ct("settings-problems-text").textContent=r.problems.length?`The settings saved here weren't used at the last start, so the house file's apply. ${r.problems.map(U=>`${U.path?`${h(U.path)}: `:""}${U.message}`).join(" ")} Change or reset them below.`:"",g(m),ct("settings-toc").replaceChildren(...[...r.sections,...s()].map(U=>le("li",{},le("a",{href:`#settings/${U.id}`,text:U.title})))),ct("settings-sections").replaceChildren(...r.sections.map(k)),u){const U=document.getElementById(u);u=null,U?.focus()}}function g(m){const P=ct("settings-all");if(P.hidden=!m,P.replaceChildren(),!m)return;if(!w){const W=le("button",{type:"button",class:"btn",id:"settings-all-btn",text:"Use the house file for every setting"});W.addEventListener("click",()=>{w=!0,u="settings-all-go",y()}),P.append(W);return}const F=le("button",{type:"button",class:"btn btn-primary",id:"settings-all-go",text:"Use the house file"}),D=le("button",{type:"button",class:"link",text:"Keep them"});F.addEventListener("click",()=>V(null,"all",F)),D.addEventListener("click",()=>{w=!1,u="settings-all-btn",y()}),P.append(le("p",{text:`The ${ya(m,"setting","settings")} set here go back to the house file's values.`}),le("div",{class:"st-actions"},F,D))}function k(m){const P=le("section",{class:"st-sec",id:`s-${m.id}`,"aria-labelledby":`s-${m.id}-h`}),F=le("h3",{class:"section-h",id:`s-${m.id}-h`,tabindex:"-1",text:m.title});P.append(F);const D=le("p",{class:"help-line st-help",text:`${m.help} `});if(m.guide&&D.append(le("a",{class:"help-link",href:`#guide/${m.guide}`,text:`About ${m.title.toLowerCase()}`})),P.append(D),m.link)P.append(T(m));else if(m.per_room)for(const W of m.rooms)P.append(A(`rooms.${W.id}`,W.name,W.fields,!0));else P.append(A(m.id,m.title,m.fields,!1));return P}function T(m){const P=le("div",{class:"card st-plate st-linked"});if(m.link==="household"){const F=le("button",{type:"button",class:"btn btn-primary",text:"Open the household setup"});F.addEventListener("click",D=>o(D)),P.append(F)}else if(m.link==="schedules"){const F=le("button",{type:"button",class:"btn",text:"Show the schedules"});F.addEventListener("click",()=>a()),P.append(F)}return P}function A(m,P,F,D){const W=tn(m),U=F.filter(K=>K.source==="app").length,Z=D?le("details",{class:"card st-plate st-room",id:W}):le("div",{class:"card st-plate",id:W});if(D){const K=le("summary",{},le("span",{class:"st-room-name",text:P}));U&&K.append(le("span",{class:"badge","data-kind":"set",text:`${U} set here`})),F.some(oe=>oe.pending_restart)&&K.append(le("span",{class:"badge","data-kind":"restart",text:"Restart to use"})),Z.append(K),Z.open=d.has(m)||c.has(m),Z.addEventListener("toggle",()=>{Z.open?d.add(m):d.delete(m)})}const se=le("form",{class:"st-form",novalidate:!0,"aria-label":D?P:`${P} settings`}),de=new Map,pe=le("div",{class:"st-foot"}),z=le("button",{type:"submit",class:"btn btn-primary",id:`${W}-save`,text:"Save changes",hidden:!0}),v=le("button",{type:"button",class:"link",text:"Cancel changes",hidden:!0}),S=le("p",{class:"st-status",id:`${W}-status`,role:"status",tabindex:"-1"}),M=le("div",{class:"st-confirm",hidden:!0}),j=()=>F.filter(K=>{const oe=de.get(K.path);if(!oe)return!1;const ve=oe.get();return K.secret?ve!==void 0:!su(ve,Yr(K))}),Y=()=>{const K=j().length;z.hidden=!K,z.disabled=!1,v.hidden=!K,z.textContent=K>1?`Save ${K} changes`:"Save changes",M.hidden=!0};for(const K of F)se.append(N(K,de,Y));v.addEventListener("click",()=>{c.delete(m),u=`${W}-status`,y()}),se.addEventListener("submit",async K=>{K.preventDefault();const oe=j();if(!oe.length)return;const ve=Object.fromEntries(oe.map(Ae=>[Ae.path,de.get(Ae.path).get()])),Oe=oe.filter(Ae=>Ae.hardware&&!Ae.secret),Je=Oe.map(Ae=>`${h(Ae.path)}, ${Ht(Ae,ve[Ae.path])}`);Oe.length?Q(M,Je,()=>_(m,ve,!0,z,se),z,!0):_(m,ve,!1,z,se)});const L=le("button",{type:"button",class:"link",text:D?`Use the house file for ${P}`:"Use the house file for this section",hidden:!U});L.addEventListener("click",()=>V(m,m,L,M));const I=c.get(m);return I&&I.until>Date.now()&&(S.textContent=I.text,S.dataset.kind=I.kind??""),pe.append(le("div",{class:"st-actions"},z,v,L),M,S),se.append(pe),Z.append(se),Z}function N(m,P,F){const D=tn(m.path),W=le("div",{class:"st-field","data-source":m.source}),U=le("div",{class:"st-head"}),Z=m.kind==="bool"||m.kind==="use"?le("span",{class:"st-label",id:`${D}-label`,text:m.label}):le("label",{class:"st-label",for:D,text:m.label});U.append(Z,le("span",{class:"st-src","data-source":m.source,text:tu(m)})),m.pending_restart&&U.append(le("span",{class:"tag",text:"Restart to use"})),W.append(U);const se=`${D}-help`,de=`${D}-err`;W.append(le("p",{class:"field-help",id:se,text:eu(m)}));const pe=le("div",{class:"st-control"});if(m.locked)pe.append(le("p",{class:"st-fixed",text:`${Ht(m,m.value)}. ${m.locked}`}));else if(!m.editable)pe.append(le("p",{class:"st-fixed"},le("code",{text:Ht(m,m.value)}),document.createTextNode(" Only the house file sets this.")));else{const z=iu(m,D,`${se} ${de}`,F);(m.kind==="bool"||m.kind==="use")&&z.node.setAttribute("aria-labelledby",`${D}-label`),P.set(m.path,z),pe.append(z.node)}if(W.append(pe),m.source==="app"&&!m.locked){const z=m.secret?null:m.house_file_set?`House file: ${Ht(m,m.house_file_value)}.`:null,v=le("button",{type:"button",class:"link",id:`${D}-revert`,text:nu(m)});v.addEventListener("click",()=>V(m.path,X(m.path),v)),W.append(le("p",{class:"st-file"},z?document.createTextNode(`${z} `):null,v))}return W.append(le("p",{class:"field-error",id:de,hidden:!0})),W}const X=m=>{const P=m.split(".");if(P[0]==="rooms"&&P.length===3)return`rooms.${P[1]}`;const F=r.sections.find(D=>(D.fields??[]).some(W=>W.path===m));return F?F.id:m};function Q(m,P,F,D,W=!1){const U=W?P:P.map(h);m.replaceChildren(),m.hidden=!1;const Z=le("button",{type:"button",class:"btn btn-primary",text:"Save and allow it"}),se=le("button",{type:"button",class:"link",text:"Cancel"});Z.addEventListener("click",()=>{m.hidden=!0,F()}),se.addEventListener("click",()=>{m.hidden=!0,D?.focus()}),m.append(le("p",{class:"st-confirm-text",text:`This lets Radiate write to the boiler or the valves: ${Gr(U)}. Check the wiring and the valves before you go on.`}),le("div",{class:"st-actions"},Z,se)),Z.focus()}function ae(m,P,F,D){for(const pe of m.querySelectorAll(".field-error"))pe.hidden=!0,pe.textContent="";for(const pe of m.querySelectorAll("[aria-invalid]"))pe.removeAttribute("aria-invalid");const W=[],U=[];for(const pe of F??[]){const z=m.querySelector(`#${CSS.escape(tn(pe.path))}-err`);z?(z.textContent=pe.message,z.hidden=!1,m.querySelector(`#${CSS.escape(tn(pe.path))}`)?.setAttribute("aria-invalid","true"),W.push(pe)):U.push(pe)}const Z=m.querySelector(".st-status"),se=U.map(pe=>`${pe.path?`${h(pe.path)}: `:""}${pe.message}`).join(" ");Z.textContent=`${D??"Not saved."}${se?` ${se}`:""}`,Z.dataset.kind="error";const de=W[0]?m.querySelector(`#${CSS.escape(tn(W[0].path))}`):null;de&&de.tagName!=="DIV"?de.focus():Z.focus()}async function _(m,P,F,D,W){D.disabled=!0;try{const U=await p("PUT","settings/config",F?{values:P,confirm:!0}:{values:P});if(U.status===409){const Z=W.querySelector(".st-confirm");Q(Z,U.body.confirm??[],()=>_(m,P,!0,D,W),D),D.disabled=!1;return}if(U.status!==200){const Z=typeof U.body=="object"&&U.body?U.body:{message:String(U.body)};ae(W,m,Z.errors,Z.message),D.disabled=!1;return}B(m,U.body,au(U.body.applied??[],U.body.restart??[]))}catch{const U=W.querySelector(".st-status");U.textContent="Not saved. Check the connection and try again.",U.dataset.kind="error",D.disabled=!1}}async function V(m,P,F,D){const W=m==null?"settings/config":`settings/config/${encodeURIComponent(m)}`,U=async Z=>{F.disabled=!0;try{const se=await p("DELETE",W,Z?{confirm:!0}:void 0);if(se.status===409){const de=D??F.closest("form")?.querySelector(".st-confirm")??ct("settings-all");F.disabled=!1,Q(de,se.body.confirm??[],()=>U(!0),F);return}if(se.status!==200){const de=typeof se.body=="object"&&se.body?se.body:{message:String(se.body)},pe=F.closest("form");if(F.disabled=!1,pe)ae(pe,P,de.errors,de.message??"Not changed.");else{const z=(de.errors??[]).map(v=>`${h(v.path)}: ${v.message}`).join(" ");ct("settings-all").append(le("p",{class:"st-status","data-kind":"error",role:"alert",text:`${de.message??"Not changed."} ${z}`}))}return}w=!1,B(P,se.body,"Back to the house file.")}catch{F.disabled=!1}};U(!1)}function B(m,P,F){r=P,c.set(m,{text:F,until:Date.now()+Ys}),setTimeout(()=>{const D=c.get(m);if(D&&D.until<=Date.now()){c.delete(m);const W=document.getElementById(`${tn(m)}-status`);W&&(W.textContent="")}},Ys+50),u=m==="all"?"settings-h":`${tn(m)}-status`,y()}return{async available(){try{const m=await p("GET","settings/config");return m.status!==200?!1:(r=m.body,!0)}catch{return!1}},show(){i=!0,r&&y(),x()},hide(){i=!1},reveal(m){const P=m?document.getElementById(`s-${m}-h`):null;return P?(P.focus({preventScroll:!0}),P.scrollIntoView({block:"start"}),!0):!1},get open(){return i}}}const Xr=5e3;function qo({holdMs:e=Xr,now:t=()=>Date.now()}={}){let n,o=!1,a=0,s=0,r=0,i="";const l=()=>{o=!1,n=void 0};return{press(c){return n=c,o=!0,i="",s+=1,a=s,s},done(c){c===s&&(a=0,r=t())},failed(c,d){c===s&&(a=0,l(),i=d)},shown(c){return o&&!a&&(c===n||t()-r>e)&&l(),o?n:c},get busy(){return a!==0},get error(){return i},clearError(){i=""}}}async function cu(e,t,{send:n,paint:o,refresh:a,later:s=setTimeout}){const r=e.press(t);o();try{await n()}catch(i){return e.failed(r,Yn(i)),o(),!1}return e.done(r),o(),s(o,Xr+50),await a(),!0}function Yn(e){const t=String(e?.message??"");return/HTTP 403/.test(t)&&/csrf/.test(t)?"Not saved: your sign-in has expired. Reload the page.":/HTTP 403/.test(t)?"Not saved: ask an admin.":"Not saved. Try again."}const Qr=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],du=10,Zr=.4,uu=.75,hu=180,pu=["dry_burner","dry_relay"],oo=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,_t=e=>`${e.toFixed(1)}°`,Zs=e=>e.toLocaleString("en-GB");function er(e){if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`}function zt(e){return e>=.095?e.toFixed(1):e.toFixed(2)}function fu(e,t=new Date().getFullYear()){const[n,o,a]=e.split("-").map(Number);return`${a} ${Qr[o-1]}${n===t?"":` ${n}`}`}const mu=e=>e===1?"once":e===2?"twice":`${e} times`;function tr(e){return e<Zr?"still learning":e<uu?"fairly sure of":"sure of"}function gu(e){const t=tr(e.confidence),n=tr(e.loss_confidence??e.confidence);return t===n?`Radiate is ${t} how fast this room warms and cools.`:`Radiate is ${t} how fast this room warms, and ${n} how fast it cools.`}const bu=e=>e.samples===0||e.confidence<Zr;function wu(e,t={}){const n=e.model,o=[],a=(h,y,g)=>o.push({key:h,label:y,text:g}),s=e.temperature,r=t.outdoor,i=n.heating_kph;if(i){let h=`With the boiler on and the valve open, about ${zt(i.with_house)}° an hour while most of the house is heating, or ${zt(i.alone)}° an hour when it's the only room taking heat.`;if(s!=null&&r!=null){const y=i.with_house-n.b*(s-r)+n.d;h+=y>.05?` Now, with ${_t(r)} outside, it would gain about ${zt(y)}° an hour after the heat it loses.`:` Now, with ${_t(r)} outside, it loses heat about as fast as the radiator adds it while the house heats.`}a("warms","Warms up",h)}else a("warms","Warms up",`The radiator can warm it by up to about ${zt(n.a)}° an hour with the boiler on and the valve fully open.`);let l=`With the heating off, it cools by about ${zt(n.b*du)}° an hour when it's 10° colder outside than in.`;s!=null&&r!=null&&s-r>=1&&(l+=` Now, at ${_t(s)} inside and ${_t(r)} outside, that's about ${zt(n.b*(s-r))}° an hour.`),a("cools","Cools down",l),e.heat_source==="continuous"?a("steady","Other heat",`The range cooker adds about ${zt(Math.max(0,n.d))}° an hour on its own, all day, so the radiator is needed less.`):n.d>=.15&&a("steady","Other heat",`Something other than the radiator adds about ${zt(n.d)}° an hour, such as a warm room next door.`);const c=Math.round(n.arrival_lag_min);a("lag","Heat arrives",n.lag_measured?`About ${c} min after the boiler fires, timed over ${n.lag_measured===1?"its last warm-up":`its last ${n.lag_measured} warm-ups`}.`:`Not timed yet, so Radiate allows ${c} min for the hot water to reach the radiator.`);let d;if(n.samples===0)d="Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";else{d=gu(n);const h=n.learned?.since?` since ${fu(n.learned.since,t.year)}`:"",y=n.samples>=120?`, about ${Zs(Math.round(n.samples/60))} hours of learning`:"";d+=` From ${Zs(n.samples)} ${n.samples===1?"reading":"readings"}${h}${y}.`}e.role==="internal_sensor_only"&&(d+=" This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.");const u=n.learned?.updates??{},w=Object.values(u).reduce((h,y)=>h+y,0),f=pu.reduce((h,y)=>h+(u[y]??0),0);w&&f===w&&(d+=" All of it was learned in dry run, while Radiate watched the heating without running it."),a("sure","How sure",d);let p="Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";const x=n.warm_up;if(x&&t.minute_of_day!=null){const h=x.min==null||x.min<60?x.min:Math.round(x.min/5)*5,y=oo((t.minute_of_day+x.in_min)%1440),g=x.quiet_until_min??null,k=g==null?null:(g-t.minute_of_day+1440)%1440,T=g==null?"as early as it can":`as soon as quiet hours end at ${oo(g)}`;if(x.min==null)p+=` It can't tell yet how long this room takes to reach ${_t(x.to_c)} by ${y}, so it starts ${T}.`;else if(x.min>hu)p+=` To get from ${_t(x.from_c)} to ${_t(x.to_c)} by ${y}, it reckons this room needs about ${er(h)}, longer than it looks ahead, so it starts ${T}.`;else{const A=x.in_min-h,N=A<=0?"now":`at about ${oo((t.minute_of_day+A)%1440)}`;if(p+=` To get from ${_t(x.from_c)} to ${_t(x.to_c)} by ${y}, it allows about ${er(h)}, so it `,g!=null&&A<k){const X=k+h>x.in_min?`, and may get there after ${y}`:"";p+=`would start ${N}. Quiet hours hold it until ${oo(g)}, so it starts then${X}.`}else p+=`starts warming ${N}.`}}n.lockshield!=null&&(p+=n.lockshield_learned===!1?` Between burns, the valve's opening limit rests at ${n.lockshield}% until Radiate has seen enough burns to set it.`:` Between burns, the valve's opening limit rests at ${n.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`),a("uses","Used for",p),n.relearns>0&&a("relearned","Relearned",`Radiate relearned this room ${mu(n.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);for(const h of t.notes??[]){const y=new Date(h.at*1e3),g=`${y.getDate()} ${Qr[y.getMonth()]}`,k=h.code==="learning.reset"||h.code==="learning.invalidated"?"Started again":"Carried over";a(`note-${h.at}`,k,`${g}. ${h.message}`)}return o}function yu(e){return`In the model's own terms: heating gain ${e.a.toFixed(2)} K/h, loss rate ${e.b.toFixed(3)} per hour per degree, other heat ${e.d.toFixed(2)} K/h, arrival lag ${Math.round(e.arrival_lag_min)} min, confidence ${Math.round(e.confidence*100)}%.`}const at=e=>document.getElementById(e),ei="–",na=50,vu={"radiate.security.login":"Signed in","radiate.security.login.failed":"Sign-in refused","radiate.security.logout":"Signed out","radiate.security.session.ended":"Session ended","radiate.security.request.refused":"Request refused","radiate.security.access.denied":"Not allowed","radiate.security.lockout.started":"Sign-in locked","radiate.security.lockout.ended":"Sign-in unlocked","radiate.security.user.changed":"User changed","radiate.security.config.changed":"Changed","radiate.security.control.used":"Control used","radiate.security.login.config":"Started"},ku={password:"password",oidc:"single sign-on",saml:"SAML",token:"API token",ingress:"Home Assistant",cli:"command line",session:"signed in",open:"open server"},$u=e=>vu[e.event]??e.event;function xu(e){const t=e.attributes??{};return e.user?e.user:ku[t["radiate.auth.method"]]??ei}function Su(e,t){const n={day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1};return new Intl.DateTimeFormat("en-GB",n).format(new Date(e*1e3))}function _u(e,t){const n=e.events.length,o=t.outcome==="failure"?"refusals":t.outcome==="success"?"allowed events":"events",a=t.user?` for ${t.user}`:"",s=`Kept for ${e.retention_days} days.`;return n?`The latest ${n===1?"event":`${n} ${o}`}${a}, newest first. ${s}`:`No ${o}${a} yet. ${s}`}function Cu({transport:e,isAuthError:t,onAuth:n}){let o=!1,a=!1,s=[],r=null,i=!1;const l={outcome:"",user:""},c=p=>{const x=new URLSearchParams({limit:String(na)});return l.outcome&&x.set("outcome",l.outcome),l.user&&x.set("user",l.user),p&&x.set("before",String(p)),`audit?${x}`};function d(p){const x=document.createElement("tr");p.outcome==="failure"&&(x.dataset.kind="warn");const h=(k,T,A)=>{const N=document.createElement(k);return N.textContent=T,A&&(N.className=A),N},y=h("th",Su(p.at));y.scope="row";const g=h("td",$u(p));if(p.outcome==="failure"){const k=h("span","Refused","badge");k.dataset.kind="refused",g.append(" ",k)}return x.append(y,g,h("td",xu(p)),h("td",p.source??ei),h("td",p.message,"sl-detail")),x}function u(p){const x=at("security-user"),h=["",...p],y=[...x.options].map(g=>g.value);h.join(`
`)!==y.join(`
`)&&(x.replaceChildren(...h.map(g=>{const k=document.createElement("option");return k.value=g,k.textContent=g||"Everyone",k})),x.value=h.includes(l.user)?l.user:"")}function w(){r&&(u(r.users??[]),at("security-summary").textContent=_u({...r,events:s},l),at("security-body").replaceChildren(...s.map(d)),at("security-table").hidden=!s.length,at("security-more").hidden=!i)}async function f(p=!1){const x=p&&s.length?s.at(-1).id:null;try{const h=await e.get(c(x));r=h,s=p?[...s,...h.events]:h.events,i=h.events.length===na,at("security-error").hidden=!0,w()}catch(h){if(t(h)){n();return}at("security-error").hidden=!1}}for(const p of at("security-outcome").querySelectorAll("button"))p.addEventListener("click",()=>{if(p.getAttribute("aria-checked")!=="true"){for(const x of at("security-outcome").querySelectorAll("button"))x.setAttribute("aria-checked",String(x===p));l.outcome=p.dataset.outcome,f()}});return at("security-user").addEventListener("change",p=>{l.user=p.target.value,f()}),at("security-more").addEventListener("click",()=>f(!0)),at("security-refresh").addEventListener("click",()=>f()),{async available(){try{r=await e.get(c()),s=r.events,i=s.length===na,a=!0}catch{a=!1}return at("s-security-log").hidden=!a,a&&w(),a},get offered(){return a},show(){o=!0,a&&f()},hide(){o=!1},get open(){return o}}}const ro=e=>new URL(`api/v1/${e}`,document.baseURI).toString(),O=e=>document.getElementById(e),rn=e=>e==null?"–":`${e.toFixed(1)}°`,vo=e=>`${Math.max(0,Math.round(e/60))} min`,Ka=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,dn=(e,t,n)=>`${e} ${e===1?t:n}`,nn=e=>e.length<2?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`,ko=e=>{if(e>=2880)return`${Math.round(e/1440)} days`;if(e<60)return`${e} min`;const t=e%60;return t?`${Math.floor(e/60)} h ${t} min`:`${e/60} h`},Eu=matchMedia("(prefers-reduced-motion: reduce)"),En=new Map;let ye=null,ka=null,bt=null;class Ke extends Error{}const $a="radiate.token";function Au(){try{return localStorage.getItem($a)||""}catch{return""}}function Tu(e){try{e?localStorage.setItem($a,e):localStorage.removeItem($a)}catch{}}function Ru(){let e=Au(),t="",n=null,o=null,a=2e3,s=null,r=null;const i=(d={},u="GET")=>{const w=e?{...d,Authorization:`Bearer ${e}`}:{...d};return t&&u!=="GET"&&u!=="HEAD"&&(w["X-CSRF-Token"]=t),w},l=async(d,u={})=>{const w=await fetch(ro(d),{...u,headers:i(u.headers,u.method)});if(w.status===401)throw new Ke(d);if(!w.ok)throw new Error(`${d}: HTTP ${w.status} ${await w.text()}`);return w},c=()=>{o=null;const d=new URL(ro("stream"));d.protocol=d.protocol==="https:"?"wss:":"ws:";try{n=new WebSocket(d)}catch{n=null,r("lost"),o=setTimeout(c,a);return}const u=n;u.onopen=()=>{e&&u.send(JSON.stringify({token:e}))},u.onmessage=w=>{a=2e3,r("live"),s(JSON.parse(w.data))},u.onclose=w=>{if(n===u&&(n=null),w.code===4401){r("auth");return}r("lost"),o=setTimeout(c,a),a=Math.min(a*2,15e3)},u.onerror=()=>u.close()};return{hasToken:()=>!!e,setCsrf(d){t=d||""},setToken(d){e=d,Tu(d)},house:async()=>(await l("house")).json(),state:async()=>(await l("state")).json(),get:async d=>(await l(d)).json(),text:async d=>(await l(d)).text(),async post(d,u){await l(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)})},async call(d,u,w){const f={method:d,headers:i(w===void 0?{}:{"Content-Type":"application/json"},d)};w!==void 0&&(f.body=JSON.stringify(w));const p=await fetch(ro(u),f);if(p.status===401)throw new Ke(u);const x=await p.text();let h=x;try{h=JSON.parse(x)}catch{}return{status:p.status,body:h}},subscribe(d,u){s=d,r=u,!n&&!o&&c()}}}const Ee=document.documentElement.dataset.transport==="demo"?(await Oi(async()=>{const{createDemoTransport:e}=await import("./demo.js");return{createDemoTransport:e}},[],import.meta.url)).createDemoTransport():Ru();async function Nn(e,t){try{await Ee.post(e,t)}catch(n){throw n instanceof Ke?it():console.error(n),n}}const Po=(e,t,n,o,a)=>cu(e,t,{send:()=>Nn(n,o),paint:a,refresh:Fn});function ti(e,t){e.hidden=!t,e.textContent=t}const xa={viewer:0,household:1,admin:2};let $o="admin";const Sa=e=>(xa[$o]??-1)>=xa[e],gn=e=>Sa(e)?"":$o==="household"?"Ask an admin":"Read only";function Gn(e,t,n){const o=gn(n);for(const a of e)a&&(a.disabled=!!o,o?a.dataset.locked="":delete a.dataset.locked);return t&&(t.hidden=!o,t.textContent=o),!!o}function Lu(){Gn([O("mode"),O("demand")],O("controls-lock"),"household"),Gn([O("boost")],O("boost-lock"),"household")}const Ja=e=>e.reason_code==="demand.pooled";function ni(e){return e.role==="passive"?["Bypass, not controlled",""]:e.role==="unheated"?["No radiator",""]:e.fire?["Fire lit","fire"]:e.preheating?["Preheating","preheat"]:Ja(e)?["Waiting for a burn","pooled"]:e.calling?["Heating","calling"]:e.topup&&e.extend===!0?["Topping up","extend"]:e.topup&&e.extend===!1?["Heat sink","sink"]:e.topup?["Topped up","sink"]:e.temperature!=null&&e.target!=null&&e.temperature>=e.target-.3?["Comfortable","ok"]:["Waiting",""]}const Ou={calling:"brand",fire:"brand",extend:"brand",preheat:"warning",pooled:"warning",back:"warning",stale:"warning",ok:"success",sink:"cool",away:"cool"};function xo(e,t){const n=Ou[t]??"neutral";return n==="cool"?ee`<wa-badge class="radiate-cool" appearance="filled-outlined">${e}</wa-badge>`:ee`<wa-badge variant=${n} appearance=${n==="neutral"?"outlined":"filled-outlined"}>${e}</wa-badge>`}const Mu={fire:"learning paused: fire",fire_holdoff:"learning paused: fire cooling",window:"learning paused: window",shower:"learning paused: shower",cooker_spike:"learning paused: cooking",unexplained_heat:"learning paused: extra heat (sun or guests?)",store_recovery:"learning paused: hot water",heat_unknown:"learning paused: no boiler reading",setpoint_change:"settling",no_data:"gathering data",trv_offline:"TRV offline"},oa=new Map;function oi(e){return oa.has(e)||oa.set(e,qo()),oa.get(e)}const ai=e=>!!(e.fire_switch??e.fire);function Nu(e){const t=oi(e.id),n=!t.shown(ai(En.get(e.id)??e));Po(t,n,`rooms/${e.id}/fire`,{lit:n},Xa)}const si=5,ri=28,zu=600,Du=5e3,aa=new Map;function Ut(e){return aa.has(e)||aa.set(e,{pending:null,timer:null,expiry:null,error:"",clearing:!1}),aa.get(e)}function Ga(e){const t=Ut(e.id);return t.pending!=null?t.pending:e.override?.setpoint!=null&&!t.clearing?e.override.setpoint:e.setpoint??e.target??null}function qu(e,t){const n=En.get(e);if(!n||!Number.isFinite(t))return;const o=Ut(e),a=Ga(n)??20,s=Math.min(ri,Math.max(si,Math.round(t*2)/2));if(s===a){Xa();return}o.pending=s,o.error="",o.clearing=!1,clearTimeout(o.timer),clearTimeout(o.expiry),o.timer=setTimeout(()=>Pu(e),zu),yt()}async function Pu(e){const t=Ut(e);t.timer=null;const n=t.pending;try{await Nn(`rooms/${e}/setpoint`,{setpoint:n})}catch(o){t.pending===n&&(t.pending=null,t.error=Yn(o)),yt();return}t.expiry=setTimeout(()=>{t.pending===n&&!t.timer&&(t.pending=null,yt())},Du),Fn()}async function Bu(e){const t=Ut(e);clearTimeout(t.timer),t.timer=null,t.pending=null,t.error="",t.clearing=!0,yt();try{await Nn(`rooms/${e}/setpoint`,{setpoint:null})}catch(n){t.clearing=!1,t.error=Yn(n),yt();return}Fn()}async function Fn(){try{Qa(await Ee.state())}catch{}}function Iu(e){return e.until==="cleared"?"Held until cleared":e.expires_in_min==null?"Held until the next change":e.until==="duration"?`Held for ${ko(e.expires_in_min)}`:ye?`Held until ${Ka((ye.minute_of_day+e.expires_in_min)%1440)}`:"Held until the next change"}const Bo=new Set(["passive","unheated"]);function ii(e){const t=bt?.rooms?.find(n=>n.id===e.id);return t?t.controllable:!Bo.has(e.role)}function Hu(e){const t=Ut(e.id);t.pending!=null&&!t.timer&&e.override?.setpoint===t.pending&&(t.pending=null,clearTimeout(t.expiry)),t.clearing&&!e.override&&(t.clearing=!1)}function Fu(e){let t=e.reason||"";if(Ja(e)&&(t="Waiting to share a burn with other rooms."),!e.calling&&e.topup&&e.extend===!0&&(t="Topped up now so it does not need a second burn soon."),!e.calling&&e.topup&&e.extend===!1&&(t="Opened so the burner's heat has somewhere to go."),!t&&e.role==="passive"&&(t="Manual valve, always open: counted as the system's open path."),!t&&e.role==="unheated"&&(t="No radiator here. Temperature recorded, not controlled."),!t&&e.heat_source==="continuous"&&(t="Range cooker heat is learned as a steady background."),!t&&e.next_setpoint!=null&&e.next_in_min!=null&&ye){const n=(ye.minute_of_day+e.next_in_min)%1440;t=`Next ${e.next_setpoint.toFixed(1)}° at ${Ka(n)}.`}return t}function nr(e){if(e.model){const t=e.learning?Mu[e.learning]||e.learning:"learning";return t[0].toUpperCase()+t.slice(1)}return e.humidity!=null?`${e.humidity}% RH`:""}function ju(e){return e.valve?.untrusted?e.valve.leaking?"Valve may not be closing: radiator warmed while shut.":e.valve.misses?`Valve may be stuck: radiator stayed cold for ${dn(e.valve.misses,"burn","burns")}.`:"Valve may be stuck: radiator not warming.":""}let mt=null;const zn=matchMedia("(min-width: 75rem)"),Ya=matchMedia("(max-width: 40rem)"),Ft=O("room-drawer");let _a=null;function Ca(e,t=null){if(mt=mt===e&&zn.matches?null:e,Gt.select(mt),yt(),!!mt){if(zn.matches){requestAnimationFrame(()=>O("room-aside").querySelector("h2")?.focus({preventScroll:!0}));return}_a=t,Ft.placement=Ya.matches?"bottom":"end",Ft.open=!0}}Ft.addEventListener("wa-after-hide",e=>{e.target===Ft&&(zn.matches||(mt=null,Gt.select(null),yt(),_a?.focus?.(),_a=null))});zn.addEventListener("change",()=>{zn.matches&&(Ft.open=!1),yt()});Ya.addEventListener("change",()=>yt());function Wu(e){const t=o=>{const[a,s]=ni(o),r=ii(o),i=r?Ga(o):null,l=Bo.has(o.role),c=o.id===mt,d=r&&(Ut(o.id).pending!=null||o.override?.setpoint!=null&&!Ut(o.id).clearing);return{r:o,label:a,kind:s,sp:i,observed:l,on:c,held:d}},n=(o,a)=>Ca(a,o.currentTarget);return Ya.matches?ee`<ul class="room-list" aria-labelledby="rooms-h">${e.map(o=>{const a=t(o);return ee`<li>
        <button type="button" class="room-item" aria-pressed=${String(a.on)} @click=${s=>n(s,o.id)}>
          <span class="wa-split wa-gap-xs">
            <span class="wa-cluster wa-gap-xs"><span class="swatch" style="--swatch:${js(o.temperature)}" aria-hidden="true"></span><strong>${o.name}</strong></span>
            ${xo(a.label,a.kind)}
          </span>
          <span class="wa-cluster wa-gap-m wa-caption-m wa-color-text-quiet">
            <span>Now <strong class="readout">${rn(o.temperature)}</strong></span>
            ${a.sp!=null?ee`<span>${a.held?"Held at":"Set to"} <strong class="readout">${rn(a.sp)}</strong></span>`:Ce}
            ${!a.observed&&o.opening!=null?ee`<span>Valve <strong class="readout">${o.opening}%</strong></span>`:Ce}
          </span>
        </button>
      </li>`})}</ul>`:ee`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${e.map(o=>{const a=t(o);return ee`<tr class=${a.on?"selected":""} data-idle=${String(!(o.calling||o.topup))} @click=${s=>{s.target.closest("button")||Ca(o.id,s.currentTarget.querySelector("button"))}}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(a.on)} @click=${s=>n(s,o.id)}>
            <span class="swatch" style="--swatch:${js(o.temperature)}" aria-hidden="true"></span>${o.name}</button></th>
          <td class="num readout">${rn(o.temperature)}</td>
          <td class="num readout">${a.sp==null?ee`<span class="wa-color-text-quiet">–</span>`:ee`${rn(a.sp)}${a.held?ee` <wa-icon name="hand" label="Held"></wa-icon>`:Ce}`}</td>
          <td>${a.observed||o.opening==null?ee`<span class="wa-color-text-quiet">–</span>`:ee`
            <span class="valve wa-cluster wa-gap-xs"><wa-progress-bar value=${o.opening} label="${o.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${o.opening}%</span></span>`}</td>
          <td>${xo(a.label,a.kind)}</td>
        </tr>`})}</tbody>
    </table>
  </wa-scroller>`}function or(e,{inDrawer:t}){const[n,o]=ni(e),a=ii(e),s=Ut(e.id),r=!!gn("household"),i=gn("household"),l=a?Ga(e):null,c=a&&s.pending==null&&!s.clearing&&e.override?.setpoint!=null,d=a&&s.pending!=null,u=Bo.has(e.role),w=!(e.calling||e.topup),f=e.heat_source==="episodic",p=oi(e.id),x=(ye?.learning_notes??[]).filter(N=>N.room_id===e.id),h=e.model?wu(e,{outdoor:ye?.outdoor,minute_of_day:ye?.minute_of_day,notes:x}):[],y=e.model?bu(e.model):!1,g=ju(e),k=Fu(e),T=[];e.humidity!=null&&T.push(["Humidity",`${Math.round(e.humidity)}%`]),!a&&e.setpoint!=null&&!u&&T.push(["Setpoint",rn(e.setpoint)]);const A=s.error?"":c?Iu(e.override):d?"Sending…":"From the schedule";return ee`
    <div class="room-detail wa-stack wa-gap-l">
      <div class="wa-stack wa-gap-xs">
        ${t?Ce:ee`<h2 class="wa-heading-l" tabindex="-1">${e.name}</h2>`}
        <div class="wa-cluster wa-gap-xs">
          ${xo(n,o)}
          ${c?ee`<wa-tag size="s" class="radiate-cool">Held</wa-tag>`:Ce}
        </div>
      </div>

      <div class="readouts wa-cluster wa-gap-xl">
        <div class="wa-stack wa-gap-3xs"><span class="wa-caption-m wa-color-text-quiet">Now</span><span class="readout readout-xl">${rn(e.temperature)}</span></div>
        ${e.target!=null&&!u?ee`<div class="wa-stack wa-gap-3xs"><span class="wa-caption-m wa-color-text-quiet">Target</span><span class="readout readout-l">${rn(e.target)}</span></div>`:Ce}
        ${!u&&e.opening!=null?ee`<div class="wa-stack wa-gap-3xs"><span class="wa-caption-m wa-color-text-quiet">Opening limit</span><span class="readout readout-l">${e.opening}%</span></div>`:Ce}
      </div>
      ${!u&&e.opening!=null?ee`<wa-progress-bar class="opening" data-idle=${String(w)} value=${e.opening} label="${e.name} opening limit, ${e.opening}%"></wa-progress-bar>`:Ce}

      ${a?ee`
        <div class="setpoint wa-stack wa-gap-xs" data-held=${String(c||d)}>
          <wa-number-input label="Setpoint, °C" min=${si} max=${ri} step="0.5" inputmode="decimal"
            aria-label="${e.name} setpoint"
            .value=${l==null?"":String(l)} ?disabled=${r} hint=${A}
            @change=${N=>qu(e.id,Number(N.target.value))}></wa-number-input>
          ${s.error?ee`<p class="error-line" role="alert">${s.error}</p>`:Ce}
          <div class="wa-cluster wa-gap-xs">
            ${c&&!r?ee`<wa-button size="s" appearance="outlined" @click=${()=>Bu(e.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>`:Ce}
            ${i?ee`<wa-tag size="s" class="lock-tag">${i}</wa-tag>`:Ce}
          </div>
        </div>`:Ce}

      ${f?ee`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${!!p.shown(ai(e))} ?disabled=${r} aria-busy=${String(p.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${()=>Nu(e)}>Fire lit</wa-switch>
          <p class="action-error fire-error" role="alert" ?hidden=${!p.error}>${p.error}</p>
        </div>`:Ce}

      ${g?ee`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${g}</wa-callout>`:Ce}
      ${k?ee`<p class="reason">${k}</p>`:Ce}
      ${T.length?ee`<dl class="facts">${T.map(([N,X])=>ee`<dt>${N}</dt><dd class="readout">${X}</dd>`)}</dl>`:Ce}
      ${nr(e)?ee`<p class="wa-caption-m wa-color-text-quiet">${nr(e)}</p>`:Ce}

      ${e.model?ee`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${y?ee`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>`:Ce}</span>
          <div class="wa-stack wa-gap-s">
            ${y?ee`<p class="learned-status">${e.model.samples===0?"Still learning. Nothing learned yet, so Radiate uses typical values for now.":"Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>`:Ce}
            <dl class="learned-rows">${h.map(N=>ee`<div><dt>${N.label}</dt><dd>${N.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${yu(e.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>`:Ce}
    </div>`}function Uu(){ye&&Pt(Wu(ye.rooms),O("rooms"))}function Xa(){const e=mt?En.get(mt):null,t=O("room-aside");if(zn.matches){Pt(e?or(e,{inDrawer:!1}):ee`
      <div class="aside-empty wa-stack wa-gap-s">
        <wa-icon name="hand-pointer" class="empty-icon"></wa-icon>
        <p class="wa-caption-m wa-color-text-quiet">Select a room in the house or the list to see what it is doing, change its temperature and read what Radiate has learned about it.</p>
      </div>`,t),Pt(Ce,Ft);return}Pt(Ce,t),Ft.label=e?.name??"Room",Pt(e?or(e,{inDrawer:!0}):Ce,Ft)}function yt(){Uu(),Xa()}const ar=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],Vu=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],io=e=>Date.UTC(+e.slice(0,4),+e.slice(5,7)-1,+e.slice(8,10))/864e5;function li(e,t){const n=t?io(e)-io(t):null,o=new Date(io(e)*864e5).getUTCDay();return n===0?"today":n===1?"tomorrow":n===-1?"yesterday":n!==null&&n>1&&n<7?ar[o]:`${ar[o].slice(0,3)} ${+e.slice(8,10)} ${Vu[+e.slice(5,7)-1]}`}function Ea(e,t){const n=e.slice(11,16),o=li(e.slice(0,10),t);return n==="00:00"?o:o==="today"?n:`${o} ${n}`}function sr(e,t){return e.slice(0,10)===t?e.slice(11,16):Ea(e,t)}function Ku(e,t){const n=e.slice(11,16),o=li(e.slice(0,10),t),a=o==="tomorrow"||o==="yesterday"?o:`on ${o}`;return o==="today"?`at ${n}`:n==="00:00"?a:`${a} at ${n}`}function Ju(e,t){const n=t.today;if(e.away&&e.reason==="away_until")return[`Away until ${Ea(e.until,n)}.`,"Away","away"];if(e.away)return[`Away since ${sr(e.presence.since,n)}, from Home Assistant.`,"Away","away"];if(e.until){const o=Ea(e.until,n);return[`Due back ${/^\d/.test(o)?"at ":""}${o}. Warming up their rooms.`,"Due back","back"]}if(e.presence?.uncertain&&e.presence.why){const o=e.presence.uncertain==="evidence_old"?"No update":"Home";return[e.presence.why,o,e.presence.uncertain==="evidence_old"?"stale":""]}if(e.presence?.stale){const o=bt?.household?.away?.presence_stale_after_min;return[`Home Assistant hasn't reported${o?` for over ${ko(o)}`:" lately"}, so Radiate treats them as home.`,"No update","stale"]}if(e.presence?.state==="not_home"){const o=t.presence_delay_min,a=o!=null?` Counts as away after ${ko(o)}.`:"";return[`Out since ${sr(e.presence.since,n)}.${a}`,"Out",""]}return["Home.","Home",""]}const sa=new Map;function bn(e){return sa.has(e)||sa.set(e,{form:!1,clearing:!1,clearError:"",saving:!1,saveError:""}),sa.get(e)}const ci=e=>O("people-list").querySelector(`[data-person="${CSS.escape(e)}"]`);function Gu(e){bn(e.id).form=!0,bn(e.id).saveError="",Vt(ye?.away);const n=ci(e.id)?.querySelector("wa-input[name=date]"),o=ye?.away?.today;n&&o&&(n.min=o,n.value||(n.value=new Date((io(o)+1)*864e5).toISOString().slice(0,10))),requestAnimationFrame(()=>n?.focus())}function Aa(e){bn(e.id).form=!1,bn(e.id).saveError="",Vt(ye?.away),requestAnimationFrame(()=>ci(e.id)?.querySelector(".away-open")?.focus())}async function Yu(e,t){e.preventDefault();const n=e.currentTarget,o=n.querySelector("wa-input[name=date]").value,a=n.querySelector("wa-input[name=time]").value;if(!o)return;const s=a?`${o}T${a}`:o,r=bn(t.id);r.saving=!0,r.saveError="",Vt(ye?.away);try{await Nn(`people/${t.id}/away`,{until:s})}catch(i){r.saving=!1;const l=String(i?.message??"");r.saveError=l.includes("in the future")?"Not saved: pick a time that has not passed.":l.includes("within")?"Not saved: pick a date in the next 60 days.":Yn(i),Vt(ye?.away);return}r.saving=!1;for(const i of n.querySelectorAll("wa-input"))i.value="";Aa(t),Fn()}async function Xu(e){const t=bn(e.id);t.clearing=!0,t.clearError="",Vt(ye?.away);try{await Nn(`people/${e.id}/home`,{})}catch(n){try{if(!/HTTP 404/.test(String(n?.message)))throw n;await Nn(`people/${e.id}/away`,{until:null})}catch(o){t.clearError=Yn(o)}}t.clearing=!1,Vt(ye?.away),await Fn()}function Qu(e,t){const n=bn(e.id),o=gn("household");o&&(n.form=!1);const[a,s,r]=Ju(e,t);return ee`
    <wa-card class="person" data-person=${e.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${e.name}</h3>
        ${xo(s,r)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${a}</p>
        ${n.form?ee`
          <form class="away-form wa-stack wa-gap-s" @submit=${i=>Yu(i,e)} @keydown=${i=>{i.key==="Escape"&&Aa(e)}}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${n.saving} ?disabled=${n.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${()=>Aa(e)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!n.saveError}>${n.saveError}</p>
          </form>`:ee`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${!!o}
              aria-label=${e.until?`Change when ${e.name} is back`:`Set ${e.name} away`}
              @click=${()=>Gu(e)}>${e.until?"Change":"Set away"}</wa-button>
            ${!o&&(e.until||e.away)?ee`<wa-button size="s" appearance="plain" aria-label="${e.name} is back now"
              ?loading=${n.clearing} ?disabled=${n.clearing} @click=${()=>Xu(e)}>Back now</wa-button>`:Ce}
            ${o?ee`<wa-tag size="s" class="lock-tag">${o}</wa-tag>`:Ce}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!n.clearError}>${n.clearError}</p>
      </div>
    </wa-card>`}function Vt(e){const t=e?.people??[];O("people").hidden=!t.length,O("away-note").hidden=!e?.frost;const n=e?.return,o=O("return-note");if(o.hidden=!n,n){const a=t.filter(i=>i.until&&i.until.slice(0,16)===n.at.slice(0,16)),s=a.length?a:t.filter(i=>i.until),r=s.length?`${nn(s.map(i=>i.name))}'s return`:"a return";o.textContent=`Warming up for ${r} ${Ku(n.at,e.today)}.`}Pt(ee`${t.map(a=>Qu(a,e))}`,O("people-list"))}const di=600*1e3,Gt=Kd({modelEl:O("hm-model"),statusEl:O("hm-status"),planEl:O("hm-plan"),transport:Ee,arrangeLock:()=>gn("admin"),onSelect:(e,t)=>Ca(e,t),onWeek:()=>{O("week").scrollIntoView({block:"start",behavior:Eu.matches?"auto":"smooth"}),O("week-h").setAttribute("tabindex","-1"),O("week-h").focus({preventScroll:!0})}});new MutationObserver(()=>Gt.redraw()).observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.fonts?.ready&&document.fonts.ready.then(()=>Gt.redraw());const So=Br({list:O("week-list"),legendEl:O("week-legend"),frostEl:O("week-frost"),hintEl:O("week-hint")}),De={key:null,minute:null,at:0,loading:!1,again:!1,gone:!1,shown:!1};let rr=!1;async function ra(e,t,n){try{return await Ee.call(e,t,n)}catch(o){throw o instanceof Ke&&it(),o}}const Zu={async household(){const e=await ra("GET","household");if(e.status!==200)throw new Error(`household: HTTP ${e.status}`);return e.body},async preview(e){const t=await ra("POST","household/preview",{household:e});if(t.status!==200)throw new Error(`household/preview: HTTP ${t.status}`);return t.body},save:e=>ra("PUT","household",{household:e}),async saved(e){const t=O("week-saved");t.textContent=e,clearTimeout(t.timer),t.timer=setTimeout(()=>{t.textContent=""},15e3),De.key=null,await Io();try{bt=await Ee.house()}catch{}Ho()},time:on};async function Io(){if(!(De.gone||!Ee.get)){if(De.loading){De.again=!0;return}De.loading=!0,De.again=!1,De.at=Date.now();try{const e=await Ee.get("schedules");O("week").hidden=!e.rooms.length,So.update(e),Gt.week(e),De.shown=!0,ye&&So.tick(ye.minute_of_day)}catch(e){/HTTP 404|not found/.test(String(e?.message))?De.gone=!0:e instanceof Ke?it():De.at=Date.now()-di+3e4}De.loading=!1,De.again&&await Io()}}function eh(e){const t=JSON.stringify([e.away?.everyone,(e.away?.people??[]).map(o=>[o.id,o.away])]),n=De.minute!=null&&e.minute_of_day<De.minute;De.minute=e.minute_of_day,t!==De.key||n||Date.now()-De.at>di?(De.key=t,Io()):De.shown&&So.tick(e.minute_of_day)}function ir(e,t,n){e.textContent="";for(const[o,a]of t){const s=Math.max(0,(o+n)/n)*100,r=Math.max(0,(a+n)/n)*100;if(r<=0)continue;const i=document.createElement("i");i.style.left=`${s}%`,i.style.width=`${Math.max(.3,r-s)}%`,e.appendChild(i)}}function ui(e){return!e.telemetry?.simulated&&(e.alert_details??[]).some(t=>t.code==="driver.shelly")}const th={idle:["Idle","neutral"],lead:["Opening valves","warning"],firing:["Firing","brand"],rest:["Resting","cool"]};function Qa(e){ye=e;const t=e.boiler,n=t.state==="firing",o=bt?.boiler.min_burn_s??480,a=t.min_off_s??bt?.boiler.min_off_s??600;O("status").textContent=nh(e,o),O("outdoor").textContent=e.outdoor!=null?`Outside ${e.outdoor.toFixed(1)}°`:"",fi(e.mode),hi(e.settings);const s=O("boiler-chip"),r=ui(e),[i,l]=r?["Not reachable","warning"]:th[t.state]??["–","neutral"];s.textContent=i,s.dataset.state=r?"lost":t.state,s.classList.toggle("radiate-cool",l==="cool"),l==="cool"?s.removeAttribute("variant"):s.variant=l;let c=0;n&&(c=Math.min(1,t.burn_elapsed_s/o)),t.state==="rest"&&(c=Math.min(1,t.state_elapsed_s/a));const d=O("guard");d.value=Math.round(c*100),d.dataset.kind=t.state,d.label=n?"Minimum burn":t.state==="rest"?"Minimum off":"Minimum burn or rest",O("guard-row").hidden=!(n||t.state==="rest"),O("boiler-detail").textContent=n?t.burn_elapsed_s<o?`Minimum burn: ${vo(o-t.burn_elapsed_s)} to go`:"Minimum burn met":t.state==="rest"?`${vo(Math.max(0,a-t.state_elapsed_s))} until it may start again`:"",mi(e.store.boost),ir(document.querySelector(".lane.burns"),e.timeline.burns,e.timeline.window_s),ir(document.querySelector(".lane.store"),e.timeline.store,e.timeline.window_s),O("s-starts").textContent=`${t.starts_last_hour}`,O("s-pred").textContent=t.predicted_burn_min?`${t.predicted_burn_min} min`:"–",oh(e),r&&(O("s-today-sub").textContent="Not counted while the relay can't be reached"),O("s-supply").textContent=t.supply!=null?t.supply.toFixed(2):"–",ah(t);const u=O("banner");e.telemetry?.simulated&&(u.hidden=!1,O("banner-text").textContent=`Demo: simulated reference house, ${Ka(e.minute_of_day)} simulated time. Boiler water ${e.telemetry.boiler_water_c}°, store ${e.telemetry.store_c}°, stairs ${e.telemetry.stairs_c}°.`),rh(e.telemetry),sh(e.learning_notes),Vt(e.away),En.clear();for(const w of e.rooms)En.set(w.id,w),Hu(w);mt&&!En.has(mt)&&(mt=null),yt(),lh(e.alerts),yi(e.alert_details),Gt.update(e),eh(e),ka=new Date,delete document.body.dataset.link,bt||uh()}function nh(e,t){const n=e.boiler,o=e.rooms.filter(u=>!Bo.has(u.role)),a=o.filter(u=>u.calling).map(u=>u.name),s=o.filter(u=>!u.calling&&u.topup&&u.extend===!0).map(u=>u.name),r=o.filter(u=>!u.calling&&u.topup&&u.extend!==!0).map(u=>u.name),i=o.filter(Ja).map(u=>u.name),l=e.store?.relay?" Hot water on.":"";if(e.telemetry&&!e.telemetry.simulated&&e.telemetry.boiler_linked===!1)return a.length?`${nn(a)} ${a.length===1?"wants":"want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`:"No room needs heat. The boiler switch isn't linked yet.";if(ui(e))return"Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";const c=`Burner on for ${vo(n.burn_elapsed_s)}`,d=u=>`topping up ${nn(u)} to save a second burn soon`;switch(n.state){case"idle":if(i.length){const u=i.length===1?"is":"are";return`Boiler idle. ${nn(i)} ${u} waiting to share a burn with other rooms.${l}`}return e.quiet?.active?`Quiet hours until ${e.quiet.until}. Heating only to keep rooms above 12°.${l}`:l?`Heating idle.${l}`:"Boiler idle. Rooms are within comfort.";case"lead":return`Opening valves before calling the burner.${a.length?` Heating ${nn(a)}.`:""}${l}`;case"rest":return`Burner resting: minimum off time, ${vo(n.state_elapsed_s)} so far.${l}`;case"firing":if(a.length){const u=s.length?` Also ${d(s)}.`:"";return`${c}. Heating ${nn(a)}.${u}${l}`}if(s.length)return`${c}, ${d(s)}.${l}`;if(n.burn_elapsed_s<t){const u=r.length?`, with the heat going to ${nn(r)}`:"";return`${c} to finish its minimum burn${u}.${l}`}return`${c}. Stopping now that rooms are warm.${l}`;default:return""}}function oh(e){const t=e.accounting?.today,n=e.accounting?.yesterday,o=O("s-today-label");if(t){o.textContent="Burner today",O("s-today").textContent=t.burner_hours!=null?`${t.burner_hours.toFixed(1)} h`:"–";const r=[];t.starts!=null&&r.push(dn(t.starts,"start","starts")),t.litres!=null&&r.push(`${t.litres.toFixed(1)} L`),t.kwh!=null&&r.push(`${Math.round(t.kwh)} kWh`),O("s-today-sub").textContent=r.join(", ")}else{o.textContent="Burner hours";const r=e.telemetry?.burner_hours;O("s-today").textContent=r!=null?r.toFixed(1):"–",O("s-today-sub").textContent=""}const a=n?.balance;O("s-balance").textContent=a?.score!=null?`${Math.round(a.score)}/100`:"–";let s="No full day yet";n&&(s=a?.score!=null?"":"No burns with two or more rooms"),a?.arrival_spread_min!=null&&(s=`Last room ${Math.round(a.arrival_spread_min)} min after the first`),n?.partial&&(s="Not a full day of data"),O("s-balance-sub").textContent=s}function ah(e){const t=e.short_cycle,n=O("short-cycle");if(n.hidden=!t,!t)return;const o=e.min_off_s!=null?`${Math.round(e.min_off_s/60)} min`:null,a=o?`Minimum off raised to ${o}`:`Minimum off raised by ${t.extra_off_min} min`,s=t.ends_in_h!=null?` for the next ${ko(Math.max(1,Math.round(t.ends_in_h*60)))}`:"";O("short-cycle-text").textContent=`${a}${s}, so the burner starts less often.`}const lr={eco:"fewer, longer burns. Rooms might warm a bit later.",comfort:"every room held at its target, with more burns."},_n=qo();function hi(e){const t=O("demand"),n=O("demand-note"),o=e&&lr[e.demand_mode];if(t.hidden=!o,!o)return;const a=_n.shown(e.demand_mode);t.value!==a&&(t.value=a),t.setAttribute("aria-busy",String(_n.busy));const s=lr[a];n.dataset.error=String(!!_n.error),n.textContent=_n.error||(a===e.demand_mode_default?`Default: ${s}`:s[0].toUpperCase()+s.slice(1))}O("demand").addEventListener("change",e=>{const t=ye?.settings,n=e.target.value;!t||n===_n.shown(t.demand_mode)||Po(_n,n,"settings",{demand_mode:n===t.demand_mode_default?null:n},()=>{ye?.settings&&hi(ye.settings)})});let cr="";function sh(e=[]){const t=JSON.stringify(e);if(t===cr)return;cr=t;const n=O("learning-notes");if(n.hidden=!e.length,n.hidden)return;const o=new Set(e.filter(a=>a.room_id).map(a=>a.room_id)).size;O("learning-notes-lead").textContent=o?`${dn(o,"room's learning was","rooms' learning was")} reset recently. Those rooms learn again from their next burns.`:"Radiate changed what it had learned when it last started.",Pt(ee`${[...e].reverse().map(a=>ee`<li><span class="payload">${new Date(a.at*1e3).toLocaleString(void 0,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span> <span>${a.message}</span></li>`)}`,n.querySelector("ul"))}let dr="";function rh(e){const t=O("dryrun");if(t.hidden=!e?.dry_run,t.hidden)return;const n=e.intended_writes??0,o=e.shelly_intended,a=o!=null?`${dn(n,"valve write","valve writes")} and ${dn(o,"boiler command","boiler commands")}`:dn(n,"valve write","valve writes");O("dryrun-count").textContent=n||o?`Held back so far: ${a}.`:"Nothing held back yet.";const s=e.recent_intended??[],r=JSON.stringify(s);if(r===dr)return;dr=r;const i=O("dryrun-recent");i.hidden=!s.length,Pt(ee`${[...s].reverse().map(l=>ee`<li><code>${l.topic}</code> <code class="payload">${typeof l.payload=="string"?l.payload:JSON.stringify(l.payload)}</code></li>`)}`,i.querySelector("ul"))}const ur=4;let hr="";function ih(e){const t=new Map;for(const n of e){const o=n.indexOf(": "),a=o>0?n.slice(o+2):n,s=t.get(a)??{problem:a,first:n,rooms:[]};o>0&&s.rooms.push(n.slice(0,o)),t.set(a,s)}return[...t.values()].map(n=>n.rooms.length<2?n.first:`${n.problem[0].toUpperCase()+n.problem.slice(1)} (${dn(n.rooms.length,"room","rooms")}): ${n.rooms.join(", ")}`)}function lh(e){const t=JSON.stringify(e);if(t===hr)return;hr=t;const n=O("alerts");n.hidden=!e.length;const o=ih(e),a=O("alerts-list");a.textContent="",o.forEach((i,l)=>{const c=document.createElement("li");c.textContent=i,c.dataset.extra=String(l>=ur),a.appendChild(c)});const s=O("alerts-more"),r=o.length-ur;s.hidden=r<=0,s.dataset.extra=String(Math.max(0,r)),pi(s.getAttribute("aria-expanded")==="true")}function pi(e){const t=O("alerts-more");t.setAttribute("aria-expanded",String(e)),t.textContent=e?"Show fewer":`Show ${t.dataset.extra} more`,O("alerts-list").dataset.expanded=String(e)}O("alerts-more").addEventListener("click",()=>{pi(O("alerts-more").getAttribute("aria-expanded")!=="true")});const Un=qo();function fi(e){const t=O("mode"),n=Un.shown(e);t.value!==n&&(t.value=n),t.setAttribute("aria-busy",String(Un.busy)),ti(O("mode-error"),Un.error)}O("mode").addEventListener("change",e=>{const t=e.target.value;!ye||t===Un.shown(ye.mode)||Po(Un,t,"mode",{mode:t},()=>ye&&fi(ye.mode))});const Vn=qo();function mi(e){const t=O("boost"),n=!!Vn.shown(e);t.checked!==n&&(t.checked=n),t.setAttribute("aria-busy",String(Vn.busy)),ti(O("boost-error"),Vn.error)}O("boost").addEventListener("change",()=>{if(!ye)return;const e=!Vn.shown(ye.store.boost);Po(Vn,e,"store/boost",{minutes:e?60:0},()=>ye&&mi(ye.store.boost))});function ch(){if(!ye){O("status").textContent="Cannot reach Radiate. Retrying…";return}document.body.dataset.link="stale";const e=`${String(ka.getHours()).padStart(2,"0")}:${String(ka.getMinutes()).padStart(2,"0")}`;O("status").textContent=`Cannot reach Radiate. Retrying… Showing data from ${e}.`}async function gi(){try{return Qa(await Ee.state()),!0}catch(e){return e instanceof Ke?it():ch(),!1}}function dh(e){e==="lost"?gi():e==="auth"&&it()}let ia=!1;async function uh(){if(!ia){ia=!0;try{bt=await Ee.house(),Ho()}catch{}ia=!1}}let Kn=null,Wn=null;const bi=Dc({transport:Ee,onOpen(){O("house").hidden=!0,document.body.dataset.setup="open",window.scrollTo(0,0)},onClose(){delete document.body.dataset.setup,O("house").hidden=!1,Wn&&!Wn.closest("[hidden]")&&Wn.focus(),Wn=null},async onSaved(e){delete document.body.dataset.setup,O("house").hidden=!1;const t=O("setup-saved");t.textContent=e,t.hidden=!1,t.focus(),clearTimeout(t.timer),t.timer=setTimeout(()=>{t.hidden=!0},15e3),De.key=null;try{bt=await Ee.house()}catch{}Ho(),Fn(),Za.refresh()}});async function Ho(){Kn??=bi.available();const e=await Kn;e===null&&(Kn=null);const t=!!bt?.household;O("setup-cta").hidden=!e||t,O("setup-change-row").hidden=!e||!t,Gn([O("setup-start")],O("setup-start-lock"),"admin"),Gn([O("setup-change")],O("setup-change-lock"),"admin");const n=O("week-lock");n.hidden=!e||Sa("household"),n.textContent=gn("household"),e&&!rr&&Sa("household")&&(rr=!0,So.setEditor(Zu),De.key=null,Io())}async function Fo(e){Wn=e.currentTarget;try{await bi.open()}catch(t){if(t instanceof Ke){it();return}const n=O("setup-saved");n.textContent="Couldn't open the household setup. Try again in a moment.",n.hidden=!1}}O("setup-start").addEventListener("click",Fo);O("setup-change").addEventListener("click",Fo);const wi=Uc({transport:Ee,scanLock:()=>gn("admin"),isAuthError:e=>e instanceof Ke,onAuth:()=>it()});let _o=null;const hh=/^(device\.|driver\.trv_offline$|driver\.shelly$)/;function yi(e){const t=(e??[]).filter(a=>hh.test(a.code)).length;Gt.devices(t);const n=O("devices-count");n.hidden=!t,n.textContent=String(t);const o=document.querySelector('.view-tab[data-view="devices"]');t?o.setAttribute("aria-label",`Devices, ${t} ${t===1?"needs":"need"} attention`):o.removeAttribute("aria-label"),O("alerts-devices").hidden=!t||_o!==!0}const vi=td({transport:Ee,isAuthError:e=>e instanceof Ke,onAuth:()=>it(),onCount:ph});let Ta=null;function ph(e){const t=O("suggestions-count");t.hidden=!e,t.textContent=String(e);const n=document.querySelector('.view-tab[data-view="suggestions"]');e?n.setAttribute("aria-label",`Suggestions, ${e} to act on`):n.removeAttribute("aria-label")}let ki=null;const Za=xd({transport:Ee,isAuthError:e=>e instanceof Ke,onAuth:()=>it(),onView:e=>{const t=bd(e);O("savings-line").hidden=!t,O("savings-line-link").textContent!==t&&(O("savings-line-link").textContent=t),ki=e.status==="unavailable"?e.why:null,fh()}});let Ra=null;async function fh(){const e=ki==="no household"&&Kn?await Kn:!1;O("savings-setup-row").hidden=!e,mh([O("savings-setup")],O("savings-setup-lock"),"admin")}O("savings-setup").addEventListener("click",e=>{history.replaceState(null,"","#"),Dn(!1),Fo(e)});function mh(e,t,n){const o=Gn(e,t,n);for(const a of e)a&&(a.disabled=o);return o}const $i=jd({transport:Ee,isAuthError:e=>e instanceof Ke,onAuth:()=>it()});let La=null;const Co=Cu({transport:Ee,isAuthError:e=>e instanceof Ke,onAuth:()=>it()}),xi=Yd({root:O("guide")});Xd({note:O("guide-note"),tab:document.querySelector('.view-tab[data-view="guide"]')});const Eo=lu({transport:Ee,isAuthError:e=>e instanceof Ke,onAuth:()=>it(),onOpenSetup:e=>{history.replaceState(null,"","#"),Dn(!1),Fo(e)},onShowSchedules:()=>{history.pushState(null,"","#"),Dn(!1);const e=O("week-h");O("week").hidden||(e.setAttribute("tabindex","-1"),e.focus({preventScroll:!0}),e.scrollIntoView({block:"start"}))},moreSections:()=>Co.offered?[{id:"security-log",title:"Security log"}]:[]}),gh={show(){Eo.show(),Co.show()},hide(){Eo.hide(),Co.hide()}};let Oa=null;const Ma={devices:{offered:()=>_o===!0,module:wi},suggestions:{offered:()=>Ta===!0,module:vi},savings:{offered:()=>Ra===!0,module:Za},settings:{offered:()=>Oa===!0,module:gh},data:{offered:()=>La===!0,module:$i},guide:{offered:()=>!0,module:xi}};function Dn(e){if(document.body.dataset.setup==="open")return;const[t,n]=location.hash.slice(1).split("/"),o=Ma[t]?.offered()?t:"house";for(const a of document.querySelectorAll(".view-tab"))a.dataset.view===o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");O("house").hidden=o!=="house";for(const[a,s]of Object.entries(Ma))O(a).hidden=a!==o,a===o?s.module.show():s.module.hide();document.body.dataset.view=o,document.querySelector("wa-page").dataset.view=o,!(o==="guide"&&xi.reveal(n))&&(o==="settings"&&Eo.reveal(n)||(!e&&o!=="house"&&window.scrollTo(0,0),e&&(window.scrollTo(0,0),O(`${o}-h`)?.focus())))}window.addEventListener("hashchange",()=>Dn(!0));document.addEventListener("click",e=>{const t=e.target.closest?.('a[href^="#"]');!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.hash===location.hash&&(t.hash.startsWith("#guide")||t.hash.startsWith("#settings/"))&&(e.preventDefault(),Dn(!0))});function bh(){for(const[e,t]of Object.entries(Ma))document.querySelector(`.view-tab[data-view="${e}"]`).hidden=!t.offered()}async function wh(){const[e,t,n,o,a]=await Promise.all([_o===!0?!0:wi.available(),Ta===!0?!0:vi.available(),Ra===!0?!0:Za.available(),Oa===!0?!0:Eo.available(),La===!0?!0:$i.available(),Co.available()]);_o=e,Ta=t,Ra=n,Oa=o,La=a,bh(),yi(ye?.alert_details),Dn(!1)}let lo=!1;const es=()=>new URL("login",document.baseURI).toString();async function yh(){if(document.documentElement.dataset.transport==="demo")return!0;try{const t=await fetch(ro("auth/config"));lo=t.ok&&(await t.json()).login===!0}catch{lo=!1}if(!lo)return!0;let e;try{e=await Ee.get("auth/me")}catch(t){return t instanceof Ke?(window.location.assign(es()),!1):!0}return e.via==="session"&&vh(e),!0}const pr={admin:"Admin: you can change anything here.",household:"Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",viewer:"Read only: you can see the house but not change it."};function vh(e){Ee.setCsrf(e.csrf);const t=e.method==="local"?"a password":"single sign-on";O("account-name").textContent=e.user,O("account-who").textContent=`Signed in as ${e.user} with ${t}.`,O("account-role").textContent=pr[e.role]??pr.viewer,$o=e.role in xa?e.role:"viewer",document.body.dataset.role=$o,Lu(),Gt.redraw(),yt(),ye&&Vt(ye.away),O("account").hidden=!1}O("account").addEventListener("wa-select",async e=>{if(e.detail?.item?.value==="sign-out"){O("account-error").hidden=!0;try{await Ee.post("auth/logout",{})}catch(t){if(!(t instanceof Ke)){O("account-error").hidden=!1;return}}window.location.assign(es())}});async function Si(){if(wh(),!!await yh()){try{bt=await Ee.house(),Ho()}catch(e){if(e instanceof Ke){it();return}}await gi(),document.body.dataset.auth!=="needed"&&Ee.subscribe(Qa,dh)}}function it(){if(lo){window.location.assign(es());return}if(document.body.dataset.auth==="needed")return;const e=Ee.hasToken();Ee.setToken(""),document.body.dataset.auth="needed",O("signin").hidden=!1,O("status").textContent="Sign in to see the house.";const t=O("signin-error");t.hidden=!e,t.textContent=e?"The saved token was not accepted. Enter it again.":"",requestAnimationFrame(()=>O("signin-token").focus())}O("signin-form").addEventListener("submit",async e=>{e.preventDefault();const t=O("signin-token"),n=O("signin-form").querySelector("wa-button[type=submit]"),o=O("signin-error"),a=String(t.value??"").trim();if(o.hidden=!0,!a)return;n.disabled=!0;const s=/^[\x21-\x7e]+$/.test(a);s&&Ee.setToken(a);try{if(!s)throw new Ke("token");bt=await Ee.house()}catch(r){n.disabled=!1,o.hidden=!1,r instanceof Ke?(Ee.setToken(""),o.textContent="That token was not accepted. Check it and try again."):o.textContent="Cannot reach Radiate. Try again in a moment.",t.select();return}n.disabled=!1,t.value="",O("signin").hidden=!0,delete document.body.dataset.auth,O("status").textContent="Connecting…",await Si()});await Si();
