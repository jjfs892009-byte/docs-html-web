'use strict';
/* Docs HTML — app principal (corre dentro del WebView de Android). */

// ===================================================================== puente con Android
const Native = window.Android || {
  config: () => JSON.stringify(window.HD_CONFIG || window.HD_TEST_CONFIG || {}),
  setSelection: () => {},
  saveFile: (name, content) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    a.download = name; a.click();
  },
  shareText: (t) => { if (navigator.share) navigator.share({ text: t }).catch(() => {}); },
  copyText: (t) => { navigator.clipboard && navigator.clipboard.writeText(t); },
  openExternal: (u) => window.open(u, '_blank'),
  version: () => 'web',
};
const IS_WEB = !window.Android;
const CFG = (() => { try { return JSON.parse(Native.config() || '{}'); } catch (e) { return {}; } })();
if (IS_WEB && CFG.dark === undefined) CFG.dark = !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
const SB_URL = String(CFG.url || '').replace(/\/+$/, '');
const SB_KEY = String(CFG.key || '');
const BUCKET = 'hd-archivos';
const WEB_URL = String(CFG.web || 'https://jjfs892009-byte.github.io/docs-html-web/').replace(/\/?$/, '/');
const MAX_FILE = 50 * 1024 * 1024;
if (CFG.dark) document.documentElement.classList.add('dark');
// Cuentas que sí pueden tomar capturas de pantalla en la app
const ADMIN_EMAILS = ['jjfs892009@gmail.com'];
const Bridge = {
  sel(a) { try { if (window.Android) window.Android.setSelection(CFG.token || '', !!a); } catch (e) {} },
  secure(on) { try { if (window.Android && window.Android.setSecure) window.Android.setSecure(CFG.token || '', !!on); } catch (e) {} },
};

// ===================================================================== utilidades
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'hoy, ' + d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'ayer, ' + d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtFull(s) { return s ? new Date(s).toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' }) : ''; }
function initial(nameOrEmail) { return (String(nameOrEmail || '?').trim()[0] || '?').toUpperCase(); }
const AV_COLORS = ['#7b1fa2', '#1a73e8', '#188038', '#e8710a', '#c5221f', '#00897b', '#5e35b1', '#d81b60', '#3949ab', '#6d4c41'];
function avColor(s) { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV_COLORS[h % AV_COLORS.length]; }
function avatar(nameOrEmail, key, cls = '') { return `<div class="avatar ${cls}" style="background:${avColor(key || nameOrEmail)}">${esc(initial(nameOrEmail))}</div>`; }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function rid() { return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, ''); }

// ===================================================================== iconos (Material)
const P = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo: 'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  personAdd: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  grid: 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  list: 'M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  code: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  video: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  table: 'M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z',
  hr: 'M4 11h16v2H4z',
  bold: 'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
  italic: 'M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z',
  underline: 'M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z',
  strike: 'M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z',
  ul: 'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z',
  ol: 'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z',
  alignL: 'M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z',
  alignC: 'M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z',
  alignR: 'M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z',
  color: 'M2 20h20v4H2v-4zm3.49-3h2.42l1.27-3.58h5.65L16.09 17h2.42L13.25 3h-2.5L5.49 17zm4.42-5.61 2.03-5.79h.12l2.03 5.79H9.91z',
  fill: 'M16.56 8.94 7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10 10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5zM2 20h20v4H2v-4z',
  clear: 'M3.27 5 2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z',
  indentMore: 'M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z',
  indentLess: 'M11 17h10v-2H11v2zm-8-5 4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z',
  drop: 'M7 10l5 5 5-5z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  key: 'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  inbox: 'M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
  upload: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  rename: 'M18.41 5.8 17.2 4.59c-.78-.78-2.05-.78-2.83 0l-2.68 2.68L3 15.96V20h4.04l8.74-8.74 2.63-2.63c.79-.78.79-2.05 0-2.83zM6.21 18H5v-1.21l8.66-8.66 1.21 1.21L6.21 18zM11 20l4-4h6v4H11z',
  removeUser: 'M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm3 2v2h6v-2h-6zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4z',
  play: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  title: 'M5 4v3h5.5v12h3V7H19V4z',
  moon: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  sun: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
function docIcon() {
  return `<svg viewBox="0 0 30 36" aria-hidden="true"><path d="M3 0h17l10 10v23a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" fill="#4285f4"/><path d="M20 0l10 10h-7a3 3 0 0 1-3-3z" fill="#a1c2fa"/><path d="M11.6 16.4 8 20.5l3.6 4.1M18.4 16.4l3.6 4.1-3.6 4.1M16.2 15l-2.4 11" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ===================================================================== avisos
let snackTimer = 0;
function snack(msg, ms = 3200) {
  const s = $('#snack'); s.textContent = msg; s.classList.add('show');
  clearTimeout(snackTimer); snackTimer = setTimeout(() => s.classList.remove('show'), ms);
}

// ===================================================================== servidor (Supabase)
function errText(data, status) {
  let m = '';
  if (data && typeof data === 'object') m = data.msg || data.message || data.error_description || data.error || '';
  else if (typeof data === 'string') m = data;
  const map = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/already registered|already been registered|user already exists/i, 'Ese correo ya tiene una cuenta. Inicia sesión.'],
    [/password should be at least|weak password/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/unable to validate email|invalid format|email address .* is invalid/i, 'Escribe un correo válido.'],
    [/email not confirmed/i, 'Falta confirmar el correo de esta cuenta.'],
    [/rate limit|too many/i, 'Demasiados intentos. Espera un momento y vuelve a intentar.'],
    [/payload too large|maximum allowed size|exceeded the maximum/i, 'El archivo pasa de 50 MB.'],
    [/mime type .* is not supported|invalid_mime/i, 'Ese tipo de archivo no se puede subir.'],
    [/row-level security|permission denied|not allowed|unauthorized/i, 'No tienes permiso para hacer eso.'],
    [/jwt expired/i, 'La sesión venció. Vuelve a entrar.'],
    [/duplicate key/i, 'Ese correo ya estaba aprobado.'],
  ];
  for (const [re, t] of map) if (re.test(m)) return t;
  if (m && /[áéíóúñ¿¡]|^[A-ZÁÉÍÓÚ][a-záéíóú]+ /.test(m) && !/[a-z]+_[a-z]+/.test(m)) return m; // ya viene en español (funciones del servidor)
  return m ? `Error del servidor (${status}): ${m}` : `Error del servidor (${status}).`;
}

const Auth = {
  s: store.get('hd_session', null),
  refreshing: null,
  get user() { return this.s && this.s.user; },
  get email() { return ((this.user && this.user.email) || '').toLowerCase(); },
  get name() { const m = (this.user && this.user.user_metadata) || {}; return m.name || this.email.split('@')[0]; },
  get uid() { return this.user && this.user.id; },
  set(s) {
    this.s = {
      access_token: s.access_token, refresh_token: s.refresh_token,
      expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
      user: s.user || (this.s && this.s.user),
    };
    store.set('hd_session', this.s);
  },
  clear() { this.s = null; store.del('hd_session'); },
  async call(path, body) {
    let r;
    try {
      r = await fetch(`${SB_URL}/auth/v1/${path}`, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) { throw new Error('Sin conexión a Internet.'); }
    let data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) { const err = new Error(errText(data, r.status)); err.status = r.status; throw err; }
    return data;
  },
  async signIn(email, password) { this.set(await this.call('token?grant_type=password', { email, password })); },
  async signUp(email, password, name) {
    const d = await this.call('signup', { email, password, data: { name } });
    if (d && d.access_token) this.set(d);
    else await this.signIn(email, password);
  },
  async refresh() {
    if (!this.s) throw new Error('Inicia sesión.');
    if (!this.refreshing) {
      this.refreshing = this.call('token?grant_type=refresh_token', { refresh_token: this.s.refresh_token })
        .then((d) => this.set(d))
        .catch((e) => { if (e.status === 400 || e.status === 401 || e.status === 403) { this.clear(); setTimeout(() => go('login'), 0); } throw e; })
        .finally(() => { this.refreshing = null; });
    }
    return this.refreshing;
  },
  async token() {
    if (!this.s) throw new Error('Inicia sesión.');
    if (this.s.expires_at - 90 < Date.now() / 1000) await this.refresh();
    return this.s.access_token;
  },
  async signOut() {
    try { const t = this.s && this.s.access_token; if (t) await fetch(`${SB_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + t } }); } catch (e) {}
    this.clear();
  },
};

async function api(path, opt = {}, retry = true) {
  const t = await Auth.token();
  const h = Object.assign({ apikey: SB_KEY, Authorization: 'Bearer ' + t }, opt.headers || {});
  let body = opt.body;
  if (body !== undefined && !(body instanceof Blob)) { h['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  if (opt.prefer) h.Prefer = opt.prefer;
  let r;
  try { r = await fetch(SB_URL + path, { method: opt.method || 'GET', headers: h, body }); } catch (e) { throw new Error('Sin conexión a Internet.'); }
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if ((r.status === 401 || (data && /jwt expired/i.test(data.message || data.msg || ''))) && retry) { await Auth.refresh(); return api(path, opt, false); }
  if (!r.ok) { const err = new Error(errText(data, r.status)); err.status = r.status; throw err; }
  return data;
}
const db = {
  select: (table, q) => api(`/rest/v1/${table}?${q}`),
  insert: (table, row) => api(`/rest/v1/${table}`, { method: 'POST', body: row, prefer: 'return=representation' }),
  upsert: (table, row) => api(`/rest/v1/${table}`, { method: 'POST', body: row, prefer: 'return=representation,resolution=merge-duplicates' }),
  update: (table, q, patch) => api(`/rest/v1/${table}?${q}`, { method: 'PATCH', body: patch, prefer: 'return=representation' }),
  remove: (table, q) => api(`/rest/v1/${table}?${q}`, { method: 'DELETE' }),
  rpc: (fn, args) => api(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args || {} }),
};
const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');
const files = {
  cache: new Map(),
  async sign(paths) {
    const now = Date.now(), out = {}, need = [];
    for (const p of paths) { const c = this.cache.get(p); if (c && c.exp > now + 600000) out[p] = c.url; else need.push(p); }
    if (need.length) {
      const res = await api(`/storage/v1/object/sign/${BUCKET}`, { method: 'POST', body: { expiresIn: 21600, paths: need } });
      for (const r of res || []) {
        if (r && r.signedURL) {
          const url = SB_URL + '/storage/v1' + (r.signedURL.startsWith('/') ? '' : '/') + r.signedURL;
          this.cache.set(r.path, { url, exp: now + 21600000 }); out[r.path] = url;
        }
      }
    }
    return out;
  },
  async upload(path, file, onProgress) {
    const t = await Auth.token();
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', `${SB_URL}/storage/v1/object/${BUCKET}/${encPath(path)}`);
      x.setRequestHeader('apikey', SB_KEY);
      x.setRequestHeader('Authorization', 'Bearer ' + t);
      x.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      x.setRequestHeader('x-upsert', 'false');
      x.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      x.onload = () => {
        if (x.status >= 200 && x.status < 300) resolve(path);
        else { let d = null; try { d = JSON.parse(x.responseText); } catch (e) {} reject(new Error(errText(d, x.status))); }
      };
      x.onerror = () => reject(new Error('Sin conexión a Internet.'));
      x.send(file);
    });
  },
  async removeFolder(docId) {
    try {
      const list = await api(`/storage/v1/object/list/${BUCKET}`, { method: 'POST', body: { prefix: docId + '/', limit: 1000 } });
      const names = (list || []).filter((o) => o && o.name).map((o) => `${docId}/${o.name}`);
      if (names.length) await api(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: { prefixes: names } });
    } catch (e) { /* si falla, el documento igual se borra */ }
  },
};

// ===================================================================== HTML de los documentos
const BASE_STYLE = `body{font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#202124;background:#fff;margin:0 auto;padding:28px 22px 60px;max-width:820px;word-wrap:break-word}
h1{font-size:28px;font-weight:400;margin:.4em 0}h2{font-size:22px;font-weight:400;margin:.6em 0 .3em}h3{font-size:18px;margin:.6em 0 .3em}
img,video{max-width:100%;height:auto}video{display:block;width:100%;border-radius:8px;background:#000}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #dadce0;padding:6px 8px;vertical-align:top}
blockquote{border-left:3px solid #dadce0;margin:0;padding-left:14px;color:#5f6368}a{color:#1a73e8}hr{border:0;border-top:1px solid #dadce0;margin:18px 0}
.hd-title{font-size:34px;margin:.2em 0}.hd-subtitle{font-size:18px;color:#5f6368;margin:0 0 .8em}`;

function wrapDoc(title, body, extraStyle = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${BASE_STYLE}${extraStyle ? '\n' + extraStyle : ''}
</style>
</head>
<body>
${body}
</body>
</html>`;
}
const TEMPLATES = [
  { id: 'blank', name: 'En blanco', desc: 'Documento vacío', make: (t) => wrapDoc(t, '<p><br></p>') },
  {
    id: 'blank-dark', name: 'En blanco · fondo oscuro', desc: 'Todos lo verán con fondo oscuro',
    make: (t) => wrapDoc(t, '<p><br></p>', 'body{background:#1f1f1f;color:#e8eaed}a{color:#8ab4f8}h1,h2,h3{color:#fff}td,th,hr{border-color:#5f6368}blockquote{color:#bdc1c6;border-color:#5f6368}.hd-subtitle{color:#bdc1c6}'),
  },
  {
    id: 'video', name: 'Página con video', desc: 'Título, texto y espacio para un video',
    make: (t) => wrapDoc(t, `<h1 class="hd-title">${esc(t)}</h1>\n<p class="hd-subtitle">Escribe aquí una descripción corta.</p>\n<p>Toca <b>+</b> arriba y elige <b>Video de la galería</b> para agregar tu video aquí abajo.</p>\n<p><br></p>`),
  },
  {
    id: 'promo', name: 'Anuncio / promoción', desc: 'Página llamativa con encabezado de color',
    make: (t) => wrapDoc(t, `<div class="banner"><h1>${esc(t)}</h1><p>¡Oferta especial por tiempo limitado!</p></div>\n<h2>¿Qué incluye?</h2>\n<ul><li>Primer punto</li><li>Segundo punto</li><li>Tercer punto</li></ul>\n<p class="nota">Escríbenos para más información.</p>`,
      `.banner{background:linear-gradient(135deg,#1a73e8,#7b1fa2);color:#fff;border-radius:16px;padding:28px 22px;margin-bottom:20px}.banner h1{margin:0 0 6px;font-weight:700}.banner p{margin:0;font-size:18px}.nota{background:#fef7e0;border-radius:10px;padding:12px 14px}`),
  },
  {
    id: 'code', name: 'Código HTML', desc: 'Empieza escribiendo HTML a mano', code: true,
    make: (t) => wrapDoc(t, `<h1>${esc(t)}</h1>\n<p>Edita este código como quieras.</p>`),
  },
];

const tpl = (id) => TEMPLATES.find((t) => t.id === id);
const parseHtml = (html) => new DOMParser().parseFromString(html || '', 'text/html');
const serialize = (d) => '<!DOCTYPE html>\n' + d.documentElement.outerHTML;
function ensureDoc(html, title) {
  const s = String(html || '').trim();
  if (!s) return TEMPLATES[0].make(title || 'Documento sin título');
  if (/<html[\s>]/i.test(s)) return s;
  return wrapDoc(title || 'Documento sin título', s);
}
async function resolveMedia(d) {
  const nodes = $$('[data-hd-src]', d), posters = $$('[data-hd-poster]', d);
  if (!nodes.length && !posters.length) return;
  let urls = {};
  const paths = [...new Set(nodes.map((n) => n.getAttribute('data-hd-src')).concat(posters.map((n) => n.getAttribute('data-hd-poster'))))];
  try { for (let i = 0; i < paths.length; i += 100) Object.assign(urls, await files.sign(paths.slice(i, i + 100))); } catch (e) { snack('No se pudieron cargar los videos: ' + e.message); }
  for (const n of nodes) { const u = urls[n.getAttribute('data-hd-src')]; if (u) n.setAttribute('src', u); }
  for (const n of posters) { const u = urls[n.getAttribute('data-hd-poster')]; if (u) n.setAttribute('poster', u); }
}
function stripMedia(d) {
  for (const n of $$('[data-hd-src]', d)) n.removeAttribute('src');
  for (const n of $$('[data-hd-poster]', d)) n.removeAttribute('poster');
}

// ---- documentos grandes: si el HTML pasa de este tamaño se guarda como archivo en el almacenamiento
const BIG_HTML = 3 * 1024 * 1024;
const MAX_IMPORT = 40 * 1024 * 1024;
async function loadContent(row) {
  if (row.content_path) {
    const urls = await files.sign([row.content_path]);
    const u = urls[row.content_path];
    if (!u) throw new Error('No se pudo abrir el archivo del documento.');
    let r;
    try { r = await fetch(u); } catch (e) { throw new Error('Sin conexión a Internet.'); }
    if (!r.ok) throw new Error('No se pudo descargar el documento (' + r.status + ').');
    row.content = await r.text();
  }
  row.content = ensureDoc(row.content, row.title);
  return row;
}
// Guarda el HTML (en la base de datos o, si es grande, como archivo). q = filtro para la actualización.
async function persistContent(d, html, q, onProgress) {
  const old = d.content_path || null;
  let patch;
  if (html.length > BIG_HTML) {
    const path = `${d.id}/_documento-${rid()}.html`;
    await files.upload(path, new Blob([html], { type: 'text/html' }), onProgress);
    patch = { content: '', content_path: path };
  } else {
    patch = { content: html, content_path: null };
  }
  const rows = await db.update('hd_documents', q || `id=eq.${d.id}`, patch);
  if (rows && rows.length) {
    d.content_path = patch.content_path;
    if (old && old !== patch.content_path) api(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: { prefixes: [old] } }).catch(() => {});
  } else if (patch.content_path) {
    api(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: { prefixes: [patch.content_path] } }).catch(() => {});
  }
  return rows;
}
// Saca las imágenes/videos/audios incrustados (data:...) y los sube como archivos privados.
async function extractEmbedded(doc, docId, onProgress) {
  const pairs = [['img', 'src'], ['video', 'src'], ['video', 'poster'], ['source', 'src'], ['audio', 'src'], ['input', 'src'], ['embed', 'src']];
  const items = [];
  for (const [tag, at] of pairs) for (const n of $$(tag, doc)) {
    const v = n.getAttribute(at) || '';
    if (/^data:(image|video|audio)\//i.test(v) && v.length > 40000) items.push([n, at, v]);
  }
  let done = 0, skipped = 0;
  for (const [n, at, v] of items) {
    try {
      const blob = await (await fetch(v)).blob();
      if (blob.size > MAX_FILE) { skipped++; continue; }
      const type = blob.type || 'application/octet-stream';
      const ext = (type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
      const path = `${docId}/${rid()}.${ext}`;
      await files.upload(path, new Blob([blob], { type }), (p) => onProgress && onProgress((done + p) / items.length));
      if (at === 'poster') { n.setAttribute('data-hd-poster', path); n.removeAttribute('poster'); }
      else { n.setAttribute('data-hd-src', path); n.removeAttribute(at); }
    } catch (e) { skipped++; }
    done++;
    onProgress && onProgress(done / items.length);
  }
  return { total: items.length, skipped };
}
function setTitleTag(d, title) {
  let t = d.querySelector('head > title');
  if (!t) { t = d.createElement('title'); d.head.prepend(t); }
  t.textContent = title;
}

const PROTECT_STYLE = `*{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}input,textarea{-webkit-user-select:text!important;user-select:text!important}`;
const PROTECT_SCRIPT = `(function(){var s=function(e){var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;e.preventDefault();};['selectstart','contextmenu','copy','cut','dragstart'].forEach(function(n){document.addEventListener(n,s,true);});document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var h=a.getAttribute('href')||'';if(h.charAt(0)==='#')return;e.preventDefault();try{parent.postMessage({hdOpen:a.href},'*');}catch(x){}},true);})();`;

// Documento oscuro: solo cambia cómo lo ves tú en esta app (no cambia el HTML guardado).
// El marco completo se invierte con la GPU (clase .dark en el iframe); aquí solo se vuelven a invertir imágenes y videos.
const DARK_DOC_CSS = `html{background:#fff}img,video,picture,canvas,iframe,object,embed,[data-yt]>span,[style*="background-image"],[style*="background: url"],[style*="background:url"]{filter:invert(1) hue-rotate(180deg)!important}`;
const docDark = {
  // Por defecto cada documento se ve con sus colores originales; en oscuro solo si tú lo eliges
  // (o si es tu documento y tu teléfono está en modo oscuro).
  get on() {
    const v = store.get('hd_docdark', null);
    if (v !== null) return !!v;
    return !!CFG.dark && (Doc.role === 'propietario' || Doc.role === 'editor');
  },
  set on(v) { store.set('hd_docdark', !!v); },
  apply(d) {
    const old = d.getElementById('hd-dark-style'); if (old) old.remove();
    if (!this.on) return;
    const st = d.createElement('style'); st.id = 'hd-dark-style'; st.textContent = DARK_DOC_CSS;
    (d.head || d.documentElement).appendChild(st);
  },
  frame(f) { f.classList.toggle('dark', this.on); f.style.background = '#fff'; },
};

// Convierte en enlaces (azules) las direcciones escritas o pegadas como texto.
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
function linkify(d) {
  if (!d.body) return 0;
  const skip = new Set(['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'BUTTON', 'SELECT', 'OPTION', 'TITLE']);
  const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !/https?:\/\/|www\./i.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      for (let p = n.parentNode; p && p !== d.body; p = p.parentNode) if (skip.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  for (const n of nodes) {
    const text = n.nodeValue, frag = d.createDocumentFragment();
    let last = 0, found = 0; URL_RE.lastIndex = 0; let m;
    while ((m = URL_RE.exec(text))) {
      let url = m[0];
      const trail = url.match(/[.,;:!?)\]}»”]+$/); if (trail) url = url.slice(0, -trail[0].length);
      if (!url) continue;
      frag.appendChild(d.createTextNode(text.slice(last, m.index)));
      const a = d.createElement('a');
      a.href = /^www\./i.test(url) ? 'https://' + url : url;
      a.textContent = url;
      frag.appendChild(a);
      last = m.index + url.length; count++; found++;
    }
    if (!found) continue;
    frag.appendChild(d.createTextNode(text.slice(last)));
    n.parentNode.replaceChild(frag, n);
  }
  return count;
}

async function buildViewerHtml(html) {
  const d = parseHtml(html);
  linkify(d);
  await resolveMedia(d);
  docDark.apply(d);
  for (const im of $$('img', d)) { if (!im.hasAttribute('loading')) im.setAttribute('loading', 'lazy'); im.setAttribute('decoding', 'async'); }
  if (html.length > 400000) {
    const perf = d.createElement('style');
    perf.textContent = 'body>*{content-visibility:auto;contain-intrinsic-size:auto 120px}';
    d.head.appendChild(perf);
  }
  for (const v of $$('video', d)) { v.setAttribute('preload', 'metadata'); v.setAttribute('controlsList', 'nodownload'); v.setAttribute('disablePictureInPicture', ''); v.setAttribute('playsinline', ''); if (!v.hasAttribute('controls')) v.setAttribute('controls', ''); }
  const st = d.createElement('style'); st.textContent = PROTECT_STYLE; d.head.appendChild(st);
  const sc = d.createElement('script'); sc.textContent = PROTECT_SCRIPT; d.body.appendChild(sc);
  return serialize(d);
}

function watermarkBg(text) {
  const t = String(text).replace(/[<&>"']/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='170'><text x='150' y='95' text-anchor='middle' transform='rotate(-24 150 85)' font-family='Arial, sans-serif' font-size='15' fill='rgba(120,120,120,0.33)'>${t}</text></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

// ===================================================================== capas (hojas, diálogos) y botón atrás
const layers = [];
function pushLayer(node, onClose) {
  $('#layers').appendChild(node);
  const L = { node, onClose, close: () => closeLayer(L) };
  layers.push(L);
  return L;
}
function closeLayer(L) {
  const i = layers.indexOf(L); if (i < 0) return;
  layers.splice(i, 1); L.node.remove();
  if (L.onClose) L.onClose();
}
function closeAllLayers() { while (layers.length) closeLayer(layers[layers.length - 1]); }

function sheet({ title, sub, icon, items, body }) {
  const node = el(`<div class="layer"><div class="scrim"></div><div class="sheet"><div class="sheet-handle"></div></div></div>`);
  const sh = $('.sheet', node);
  if (title) sh.appendChild(el(`<div class="sheet-title">${icon || ''}<span>${esc(title)}</span></div>`));
  if (sub) sh.appendChild(el(`<div class="sheet-sub">${esc(sub)}</div>`));
  if (body) sh.appendChild(body);
  const L = pushLayer(node);
  for (const it of items || []) {
    if (it === '-') { sh.appendChild(el('<div class="sheet-div"></div>')); continue; }
    if (!it || it.hidden) continue;
    const b = el(`<button class="sheet-item ${it.danger ? 'danger' : ''}">${it.icon ? ic(it.icon) : ''}<div>${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div></button>`);
    b.addEventListener('click', () => { L.close(); it.onClick && it.onClick(); });
    sh.appendChild(b);
  }
  $('.scrim', node).addEventListener('click', () => L.close());
  return L;
}

function dialog({ title, text, body, actions, dismiss = true, onClose }) {
  const node = el(`<div class="layer center"><div class="scrim"></div><div class="dialog">${title ? `<h2>${esc(title)}</h2>` : ''}${text ? `<p>${esc(text)}</p>` : ''}</div></div>`);
  const dg = $('.dialog', node);
  if (body) dg.appendChild(body);
  const row = el('<div class="dialog-actions"></div>');
  const L = pushLayer(node, onClose);
  for (const a of actions || []) {
    const b = el(`<button class="${a.primary ? 'btn-filled' : 'btn-text'} ${a.danger ? 'danger' : ''}">${esc(a.label)}</button>`);
    b.addEventListener('click', async () => {
      if (a.onClick) { const r = await a.onClick(b); if (r === false) return; }
      L.close();
    });
    row.appendChild(b);
  }
  if ((actions || []).length) dg.appendChild(row);
  if (dismiss) $('.scrim', node).addEventListener('click', () => L.close());
  L.dismissable = dismiss;
  return L;
}
function confirmBox(title, text, okLabel = 'Aceptar', danger = false) {
  return new Promise((res) => {
    let v = false;
    dialog({ title, text, onClose: () => res(v), actions: [{ label: 'Cancelar' }, { label: okLabel, primary: !danger, danger, onClick: () => { v = true; } }] });
  });
}
function promptBox({ title, text, label, value = '', placeholder = '', ok = 'Aceptar', type = 'text', multiline = false, validate }) {
  return new Promise((res) => {
    let v = null;
    const body = el(`<div><label class="field">${label ? `<span>${esc(label)}</span>` : ''}${multiline ? '<textarea></textarea>' : `<input type="${type}" autocomplete="off" spellcheck="false">`}</label><p class="form-err" style="margin-top:-6px"></p></div>`);
    const inp = $('input,textarea', body); inp.value = value; inp.placeholder = placeholder;
    const err = $('.form-err', body);
    const submit = () => {
      const val = inp.value.trim();
      const m = validate ? validate(val) : '';
      if (m) { err.textContent = m; return false; }
      v = val; return true;
    };
    const L = dialog({ title, text, body, onClose: () => res(v), actions: [{ label: 'Cancelar' }, { label: ok, primary: true, onClick: () => submit() }] });
    if (!multiline) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (submit()) L.close(); } });
    setTimeout(() => { inp.focus(); if (!multiline) inp.select(); }, 60);
  });
}
function progressBox(title) {
  const body = el(`<div><div class="progress"><div></div></div><p class="pct" style="margin:4px 0 0">0%</p></div>`);
  const L = dialog({ title, body, dismiss: false });
  return {
    set(f) { $('.progress div', body).style.width = Math.round(f * 100) + '%'; $('.pct', body).textContent = Math.round(f * 100) + '%'; },
    close() { L.close(); },
  };
}
function busy(title) { const L = dialog({ title, body: el('<div class="spinner" style="margin:16px auto"></div>'), dismiss: false }); return () => L.close(); }

// Llamado desde Android al tocar "atrás". Devuelve true si la app lo manejó.
window.hdBack = function () {
  if (layers.length) {
    const L = layers[layers.length - 1];
    if (L.dismissable === false) return true;
    L.close(); return true;
  }
  if (state.screen === 'doc') { Doc.back(); return true; }
  if (state.screen === 'home' && $('#search').value) { $('#search').value = ''; renderList(); return true; }
  return false;
};
// Llamado desde Android cuando se abre un enlace docshtml://abrir?c=CODIGO
window.hdOpenCode = function (code) {
  const c = String(code || '').toUpperCase();
  if (!/^[0-9A-Z]{8}$/.test(c)) return;
  if (!Auth.s) { store.set('hd_pending_code', c); go('login'); snack('Inicia sesión o crea tu cuenta para abrir el documento.', 5000); return; }
  openCode(c);
};
if (IS_WEB) {
  window.addEventListener('popstate', () => {
    if (!layers.length && state.screen !== 'doc') return;
    window.hdBack();
    if (layers.length || state.screen === 'doc') history.pushState({ hd: 'doc' }, '');
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.hdResume(); });
}
window.hdResume = function () {
  if (state.screen === 'home') loadHome(true);
};

// ===================================================================== navegación
const state = { screen: 'login', docs: [], myShares: {}, sharedDocs: new Set(), requests: [], filter: 'all', layout: store.get('hd_layout', 'list') };
function go(screen) {
  closeAllLayers();
  Bridge.secure(!(Auth.s && ADMIN_EMAILS.includes(Auth.email)));
  state.screen = screen;
  for (const s of ['login', 'home', 'doc']) $('#scr-' + s).hidden = s !== screen;
  Bridge.sel(false);
  if (screen === 'home') {
    renderAvatar(); loadHome();
    const pc = store.get('hd_pending_code', null);
    if (pc) { store.del('hd_pending_code'); setTimeout(() => openCode(pc), 300); }
  }
  if (screen === 'login') {
    const t = $('.seg-btn[data-tab=in]'); if (t) t.click();
    const note = $('#login-note'), pc = store.get('hd_pending_code', null);
    if (note) {
      note.hidden = !pc;
      if (pc) note.innerHTML = `${ic('lock')}<div>Para ver el documento que te compartieron, <b>inicia sesión</b> o <b>crea tu cuenta</b> con tu correo y una contraseña.</div>`;
    }
  }
  if (IS_WEB) {
    if (screen === 'doc') history.pushState({ hd: 'doc' }, '');
  }
}

// ===================================================================== entrar / crear cuenta
let loginTab = 'in';
function initLogin() {
  $('#login-logo').innerHTML = docIcon();
  $$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
    loginTab = b.dataset.tab;
    $$('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    $('#f-name').hidden = loginTab !== 'up';
    $('#login-go').textContent = loginTab === 'up' ? 'Crear cuenta' : 'Iniciar sesión';
    $('#in-pass').autocomplete = loginTab === 'up' ? 'new-password' : 'current-password';
    $('#login-err').textContent = '';
  }));
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#in-email').value.trim().toLowerCase(), pass = $('#in-pass').value, name = $('#in-name').value.trim();
    const err = $('#login-err'); err.textContent = '';
    if (!SB_URL || !SB_KEY) { err.textContent = 'La app no tiene configurado el servidor.'; return; }
    if (!validEmail(email)) { err.textContent = 'Escribe un correo válido.'; return; }
    if (pass.length < 6) { err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    if (loginTab === 'up' && !name) { err.textContent = 'Escribe tu nombre.'; return; }
    const btn = $('#login-go'); btn.disabled = true; btn.textContent = 'Un momento…';
    try {
      if (loginTab === 'up') await Auth.signUp(email, pass, name); else await Auth.signIn(email, pass);
      $('#in-pass').value = '';
      go('home');
    } catch (ex) { err.textContent = ex.message; }
    finally { btn.disabled = false; btn.textContent = loginTab === 'up' ? 'Crear cuenta' : 'Iniciar sesión'; }
  });
}

// ===================================================================== lista de documentos
function renderAvatar() {
  const b = $('#btn-avatar'); b.textContent = initial(Auth.name); b.style.background = avColor(Auth.email);
}
function initHome() {
  $('#btn-menu').innerHTML = ic('menu');
  $('#fab-new').innerHTML = ic('add');
  $('#btn-menu').addEventListener('click', openDrawer);
  $('#btn-avatar').addEventListener('click', openAccount);
  $('#fab-new').addEventListener('click', openNewSheet);
  $('#search').addEventListener('input', renderList);
  $$('#chips .chip').forEach((c) => c.addEventListener('click', () => {
    state.filter = c.dataset.f; $$('#chips .chip').forEach((x) => x.classList.toggle('active', x === c)); renderList();
  }));
  $('#btn-layout').addEventListener('click', () => { state.layout = state.layout === 'list' ? 'grid' : 'list'; store.set('hd_layout', state.layout); renderList(); });
  $('#req-banner').addEventListener('click', openRequests);
  initPullToRefresh();
}
let homeLoading = false;
async function loadHome(quiet) {
  if (homeLoading) return;
  homeLoading = true;
  if (!state.docs.length && !quiet) $('#doc-list').innerHTML = '<div class="spinner"></div>';
  try {
    const [docs, shares, reqs] = await Promise.all([
      db.select('hd_documents', 'select=id,title,owner_id,owner_email,owner_name,updated_at,edited_by,code,created_at&order=updated_at.desc&limit=500'),
      db.select('hd_shares', 'select=doc_id,email,role'),
      db.select('hd_requests', 'select=id,doc_id,email,name,message,status,created_at&status=eq.pendiente&order=created_at.desc'),
    ]);
    state.docs = docs || [];
    const mine = new Set(state.docs.filter((d) => d.owner_id === Auth.uid).map((d) => d.id));
    state.myShares = {}; state.sharedDocs = new Set();
    for (const s of shares || []) {
      if (s.email === Auth.email && !mine.has(s.doc_id)) state.myShares[s.doc_id] = s.role;
      if (mine.has(s.doc_id)) state.sharedDocs.add(s.doc_id);
    }
    state.requests = (reqs || []).filter((r) => mine.has(r.doc_id));
    store.set('hd_cache_' + Auth.uid, { docs: state.docs, myShares: state.myShares, shared: [...state.sharedDocs] });
  } catch (e) {
    if (!state.docs.length) {
      const c = store.get('hd_cache_' + Auth.uid, null);
      if (c) { state.docs = c.docs || []; state.myShares = c.myShares || {}; state.sharedDocs = new Set(c.shared || []); }
    }
    if (state.screen === 'home') snack(e.message);
  } finally {
    homeLoading = false;
    if (state.screen === 'home') renderList();
  }
}
function docRole(d) { return d.owner_id === Auth.uid ? 'propietario' : (state.myShares[d.id] || 'lector'); }
function renderList() {
  const q = $('#search').value.trim().toLowerCase();
  let list = state.docs;
  if (state.filter === 'mine') list = list.filter((d) => d.owner_id === Auth.uid);
  if (state.filter === 'shared') list = list.filter((d) => d.owner_id !== Auth.uid);
  if (q) list = list.filter((d) => (d.title || '').toLowerCase().includes(q) || (d.owner_email || '').includes(q) || (d.owner_name || '').toLowerCase().includes(q));
  $('#list-title').textContent = q ? 'Resultados' : (state.filter === 'shared' ? 'Compartidos conmigo' : 'Recientes');
  $('#btn-layout').innerHTML = ic(state.layout === 'list' ? 'grid' : 'list');
  const box = $('#doc-list');
  box.className = 'doc-list' + (state.layout === 'grid' ? ' grid' : '');
  const n = state.requests.length;
  const rb = $('#req-banner'); rb.hidden = !n;
  if (n) rb.innerHTML = `${ic('inbox')}<div><b>${n === 1 ? '1 persona pide' : n + ' personas piden'} acceso</b> a tus documentos. Toca para revisar.</div>`;
  if (!list.length) {
    box.className = 'doc-list';
    box.innerHTML = q
      ? `<div class="empty"><h3>Sin resultados</h3>No hay documentos que coincidan con «${esc(q)}».</div>`
      : state.filter === 'shared'
        ? `<div class="empty">${emptyArt()}<h3>Nada compartido todavía</h3>Cuando alguien apruebe tu correo en un documento, aparecerá aquí.</div>`
        : `<div class="empty">${emptyArt()}<h3>Crea un documento</h3>Toca el botón + para crear tu primer documento HTML.</div>`;
    return;
  }
  box.innerHTML = '';
  for (const d of list) {
    const own = d.owner_id === Auth.uid;
    const sub = own
      ? `${state.sharedDocs.has(d.id) ? ic('people') : ''}<span>Modificado ${esc(fmtDate(d.updated_at))}</span>`
      : `${ic(state.myShares[d.id] === 'editor' ? 'edit' : 'eye')}<span>De ${esc(d.owner_name || d.owner_email)} · ${esc(fmtDate(d.updated_at))}</span>`;
    const row = el(`<div class="doc-row" role="button"><div class="doc-ico">${docIcon()}</div><div class="doc-meta"><div class="doc-txt"><div class="doc-name">${esc(d.title || 'Documento sin título')}</div><div class="doc-sub">${sub}</div></div><button class="icon-btn small" aria-label="Opciones">${ic('more')}</button></div></div>`);
    row.addEventListener('click', (e) => { if (e.target.closest('.icon-btn')) return; Doc.open(d.id); });
    $('.icon-btn', row).addEventListener('click', (e) => { e.stopPropagation(); docMenu(d); });
    box.appendChild(row);
  }
}
function emptyArt() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="var(--surface-2)"/><g transform="translate(37 26) scale(1.55)">${docIcon().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
}
function initPullToRefresh() {
  const main = $('#home-main'), ptr = $('#ptr');
  let y0 = null, dy = 0;
  main.addEventListener('touchstart', (e) => { y0 = main.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  main.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0) { ptr.style.transition = 'none'; ptr.style.height = Math.min(70, dy / 2.2) + 'px'; }
  }, { passive: true });
  main.addEventListener('touchend', async () => {
    if (y0 == null) return;
    ptr.style.transition = '';
    if (dy / 2.2 > 50) {
      ptr.style.height = '56px'; ptr.classList.add('loading');
      await loadHome(true);
      ptr.classList.remove('loading');
    }
    ptr.style.height = '0'; y0 = null;
  });
}

function docMenu(d) {
  const role = docRole(d), own = role === 'propietario';
  sheet({
    title: d.title || 'Documento sin título', icon: `<div class="doc-ico">${docIcon()}</div>`,
    sub: own ? `Código: ${d.code}` : `De ${d.owner_name || d.owner_email} · ${role === 'editor' ? 'Puedes editar' : 'Solo lectura'}`,
    items: [
      { icon: 'eye', label: 'Abrir', onClick: () => Doc.open(d.id) },
      own && { icon: 'personAdd', label: 'Compartir', onClick: () => openShare(d) },
      own && { icon: 'link', label: 'Copiar enlace', onClick: () => { Native.copyText(shareLink(d)); snack('Enlace copiado.'); } },
      (own || role === 'editor') && { icon: 'rename', label: 'Cambiar nombre', onClick: () => renameDoc(d) },
      own && { icon: 'download', label: 'Descargar archivo HTML', onClick: () => downloadDoc(d.id) },
      own && { icon: 'info', label: 'Detalles', onClick: () => openDetails(d) },
      '-',
      own && { icon: 'delete', label: 'Eliminar', danger: true, onClick: () => deleteDoc(d) },
      !own && { icon: 'removeUser', label: 'Quitar de mi lista', danger: true, onClick: () => leaveDoc(d) },
    ],
  });
}

async function createDoc(tpl, html, title) {
  title = title || 'Documento sin título';
  const stop = busy('Creando documento…');
  try {
    const content = html ? ensureDoc(html, title) : tpl.make(title);
    const [row] = await db.insert('hd_documents', { title, content: content.length > BIG_HTML ? '' : content });
    if (content.length > BIG_HTML) { await persistContent(row, content); row.content = content; }
    stop();
    state.docs.unshift(row);
    Doc.open(row.id, { edit: true, code: !!(tpl && tpl.code), fresh: row });
  } catch (e) { stop(); snack(e.message); }
}
function openNewSheet() {
  sheet({
    title: 'Nuevo',
    items: [
      { icon: 'doc', label: 'Nuevo documento', sub: 'En blanco', onClick: () => askTitleThen(tpl('blank')) },
      { icon: 'moon', label: 'Documento con fondo oscuro', sub: 'Todos lo verán oscuro', onClick: () => askTitleThen(tpl('blank-dark')) },
      { icon: 'video', label: 'Página con video', sub: 'Título, texto y video', onClick: () => askTitleThen(tpl('video')) },
      { icon: 'title', label: 'Anuncio / promoción', sub: 'Encabezado de color y lista', onClick: () => askTitleThen(tpl('promo')) },
      { icon: 'code', label: 'Escribir código HTML', sub: 'Editor de código', onClick: () => askTitleThen(tpl('code')) },
      '-',
      { icon: 'upload', label: 'Importar archivo HTML', sub: 'Desde tu teléfono', onClick: importHtml },
    ],
  });
}
async function askTitleThen(tpl) {
  const t = await promptBox({ title: 'Nombre del documento', value: '', placeholder: 'Documento sin título', ok: 'Crear' });
  if (t === null) return;
  createDoc(tpl, null, t || 'Documento sin título');
}
function pickFile(accept) {
  return new Promise((res) => {
    const old = $('#pick-file');
    const inp = old.cloneNode(); old.replaceWith(inp);
    inp.accept = accept;
    inp.addEventListener('change', () => res(inp.files && inp.files[0] ? inp.files[0] : null), { once: true });
    inp.click();
  });
}
async function importHtml() {
  const f = await pickFile('text/html,.html,.htm');
  if (!f) return;
  if (f.size > MAX_IMPORT) { dialog({ title: 'Archivo muy grande', text: `Pesa ${(f.size / 1048576).toFixed(1)} MB y el máximo es 40 MB.`, actions: [{ label: 'Aceptar', primary: true }] }); return; }
  const text = await f.text();
  const m = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = ((m && m[1].trim()) || f.name.replace(/\.html?$/i, '') || 'Documento importado').slice(0, 120);
  if (text.length < BIG_HTML && !/src\s*=\s*["']?data:(image|video|audio)\//i.test(text)) { createDoc(null, text, title); return; }
  // archivo grande: primero se crea el documento, luego se suben sus imágenes/videos y al final el HTML
  const pb = progressBox('Importando archivo…');
  let row = null;
  try {
    [row] = await db.insert('hd_documents', { title, content: '' });
    const doc = parseHtml(ensureDoc(text, title));
    const res = await extractEmbedded(doc, row.id, (p) => pb.set(p * 0.85));
    const html = serialize(doc);
    await persistContent(row, html, null, (p) => pb.set(0.85 + p * 0.15));
    pb.close();
    state.docs.unshift(row);
    if (res.skipped) snack(`${res.skipped} archivo(s) incrustado(s) no se pudieron subir (más de 50 MB o tipo no permitido).`, 5000);
    else if (res.total) snack(`Importado: ${res.total} imagen(es)/video(s) guardados aparte.`);
    Doc.open(row.id);
  } catch (e) {
    pb.close();
    if (row) { files.removeFolder(row.id); db.remove('hd_documents', `id=eq.${row.id}`).catch(() => {}); }
    snack(e.message, 5000);
  }
}
async function renameDoc(d, after) {
  const t = await promptBox({ title: 'Cambiar nombre', value: d.title, ok: 'Guardar', validate: (v) => (v ? '' : 'Escribe un nombre.') });
  if (!t || t === d.title) return;
  try {
    await db.update('hd_documents', `id=eq.${d.id}`, { title: t });
    d.title = t;
    const cached = state.docs.find((x) => x.id === d.id); if (cached) cached.title = t;
    if (state.screen === 'home') renderList();
    after && after(t);
    snack('Nombre cambiado.');
  } catch (e) { snack(e.message); }
}
async function deleteDoc(d, after) {
  if (!(await confirmBox('¿Eliminar documento?', `«${d.title}» se borrará para siempre, junto con sus videos. Las personas aprobadas ya no podrán abrirlo.`, 'Eliminar', true))) return;
  const stop = busy('Eliminando…');
  try {
    await files.removeFolder(d.id);
    await db.remove('hd_documents', `id=eq.${d.id}`);
    state.docs = state.docs.filter((x) => x.id !== d.id);
    stop(); snack('Documento eliminado.');
    if (after) after(); else renderList();
  } catch (e) { stop(); snack(e.message); }
}
async function leaveDoc(d, after) {
  if (!(await confirmBox('¿Quitar de tu lista?', `Ya no podrás abrir «${d.title}» a menos que el propietario te vuelva a aprobar.`, 'Quitar', true))) return;
  try {
    await db.remove('hd_shares', `doc_id=eq.${d.id}&email=eq.${encodeURIComponent(Auth.email)}`);
    state.docs = state.docs.filter((x) => x.id !== d.id);
    snack('Quitado de tu lista.');
    if (after) after(); else renderList();
  } catch (e) { snack(e.message); }
}
async function downloadDoc(id) {
  const stop = busy('Preparando archivo…');
  try {
    const [d] = await db.select('hd_documents', `id=eq.${id}&select=title,content,content_path`);
    await loadContent(d);
    const doc = parseHtml(d.content);
    await resolveMedia(doc);
    const name = (d.title || 'documento').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) + '.html';
    stop();
    Native.saveFile(name, serialize(doc));
  } catch (e) { stop(); snack(e.message); }
}
function openDetails(d) {
  const body = el(`<div>
    <div class="info-row"><small>Propietario</small><div>${esc(d.owner_name ? d.owner_name + ' · ' + d.owner_email : d.owner_email)}</div></div>
    <div class="info-row"><small>Código del documento</small><div>${esc(d.code)}</div></div>
    <div class="info-row"><small>Creado</small><div>${esc(fmtFull(d.created_at))}</div></div>
    <div class="info-row"><small>Última modificación</small><div>${esc(fmtFull(d.updated_at))}${d.edited_by ? ' · ' + esc(d.edited_by) : ''}</div></div>
  </div>`);
  sheet({ title: 'Detalles', icon: `<div class="doc-ico">${docIcon()}</div>`, body });
}

// ===================================================================== menú lateral y cuenta
function openDrawer() {
  const n = state.requests.length;
  const node = el(`<div class="layer"><div class="scrim"></div><nav class="drawer">
    <div class="drawer-head">${docIcon()}<span>Docs HTML</span></div>
    <button class="drawer-item active" data-a="docs">${ic('doc')}Documentos</button>
    <button class="drawer-item" data-a="code">${ic('key')}Abrir con código</button>
    <button class="drawer-item" data-a="req">${ic('inbox')}Solicitudes de acceso${n ? `<span class="badge">${n}</span>` : ''}</button>
    <button class="drawer-item" data-a="refresh">${ic('refresh')}Actualizar</button>
    <button class="drawer-item" data-a="sec">${ic('shield')}Seguridad</button>
    <button class="drawer-item" data-a="out">${ic('logout')}Cerrar sesión</button>
    <div class="drawer-foot">Docs HTML ${esc(Native.version())}<br>${esc(Auth.email)}</div>
  </nav></div>`);
  const L = pushLayer(node);
  $('.scrim', node).addEventListener('click', () => L.close());
  $$('.drawer-item', node).forEach((b) => b.addEventListener('click', () => {
    L.close();
    const a = b.dataset.a;
    if (a === 'code') openByCode();
    if (a === 'req') openRequests();
    if (a === 'refresh') loadHome();
    if (a === 'sec') openSecurity();
    if (a === 'out') signOut();
  }));
}
function openAccount() {
  const body = el(`<div style="text-align:center;padding:4px 24px 12px">${avatar(Auth.name, Auth.email, 'big')}<div style="font-size:18px">${esc(Auth.name)}</div><div style="color:var(--on-2);font-size:14px">${esc(Auth.email)}</div></div>`);
  sheet({ body, items: ['-', { icon: 'key', label: 'Abrir con código', onClick: openByCode }, { icon: 'shield', label: 'Seguridad', onClick: openSecurity }, { icon: 'logout', label: 'Cerrar sesión', onClick: signOut }] });
}
async function signOut() {
  if (!(await confirmBox('¿Cerrar sesión?', 'Tendrás que escribir tu correo y contraseña para volver a entrar.', 'Cerrar sesión'))) return;
  await Auth.signOut();
  state.docs = []; state.requests = [];
  go('login');
}
function openSecurity() {
  dialog({
    title: 'Cómo se protegen tus documentos',
    body: el(`<div style="font-size:14px;color:var(--on-2)">
      <p>• Solo pueden abrir un documento <b>tú</b> y los <b>correos que apruebes</b> en «Compartir». Nadie más lo ve, aunque tenga el código.</p>
      <p>• Con el código, otra persona solo puede <b>pedirte acceso</b>; tú decides si aprobar o rechazar.</p>
      <p>• En esta app <b>no se pueden tomar capturas</b> ni grabar la pantalla (sale negra), y el texto <b>no se puede seleccionar ni copiar</b> al leer.</p>
      <p>• Los videos se guardan en privado; los lectores no tienen botón de descarga.</p>
      <p style="margin:0">• Nada impide que alguien le tome foto a la pantalla con otro teléfono: comparte solo con personas de confianza.</p>
    </div>`),
    actions: [{ label: 'Entendido', primary: true }],
  });
}

// ===================================================================== abrir con código / pedir acceso
async function openByCode(prefill) {
  const code = await promptBox({
    title: 'Abrir con código', text: 'Escribe el código de 8 letras y números que te dio el propietario.', value: prefill || '',
    placeholder: 'Ej. 4F7A2C9B', ok: 'Buscar', validate: (v) => (/^[0-9a-zA-Z]{8}$/.test(v.replace(/\s/g, '')) ? '' : 'El código tiene 8 letras o números.'),
  });
  if (!code) return;
  openCode(code);
}
async function openCode(code) {
  const c = String(code).replace(/\s/g, '').toUpperCase();
  if (!/^[0-9A-Z]{8}$/.test(c)) { snack('Código no válido.'); return; }
  const stop = busy('Buscando…');
  let rows;
  try { rows = await db.rpc('hd_find_code', { p_code: c }); } catch (e) { stop(); snack(e.message); return; }
  stop();
  const r = rows && rows[0];
  if (!r) { dialog({ title: 'No encontrado', text: 'No existe ningún documento con ese código. Revisa que esté bien escrito.', actions: [{ label: 'Aceptar', primary: true }] }); return; }
  if (r.my_role) { Doc.open(r.id); return; }
  requestAccessPage(c, r);
}
function requestAccessPage(code, r) {
  const node = el(`<div class="full"><div class="full-top"><button class="icon-btn">${ic('close')}</button><h2></h2></div><div class="full-body"><div class="access-page">
    ${ic('lock', 'big')}
    <h2>Necesitas acceso</h2>
    <p>Este documento es de <b>${esc(r.owner_name || r.owner_email)}</b>${r.owner_name ? ` (${esc(r.owner_email)})` : ''}. Solo lo pueden abrir las personas que apruebe.</p>
    <div class="key-box">
      <div class="key-title">${ic('key')}¿Te enviaron una clave de acceso?</div>
      <input class="inp key-inp" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ej. K7P2QX">
      <p class="form-err key-err"></p>
      <button class="btn-filled wide key-go">Entrar con la clave</button>
    </div>
    <div class="or-sep"><span>o</span></div>
    <div class="st"></div>
    <label class="field" style="text-align:left"><span>Pedir acceso al propietario (mensaje opcional)</span><textarea maxlength="500" placeholder="Hola, soy… ¿me das acceso?"></textarea></label>
    <button class="btn-tonal wide req-go" style="height:44px">Solicitar acceso</button>
    <p style="margin-top:14px">Se usará tu correo <b>${esc(Auth.email)}</b>.</p>
  </div></div></div>`);
  const L = pushLayer(node);
  $('.full-top .icon-btn', node).addEventListener('click', () => L.close());
  const st = $('.st', node);
  if (r.request_status === 'pendiente') st.innerHTML = `<div class="note">${ic('info')}<div>Ya pediste acceso. Espera a que el propietario lo apruebe; luego aparecerá en «Compartidos conmigo».</div></div><br>`;
  if (r.request_status === 'rechazada') st.innerHTML = `<div class="note">${ic('info')}<div>El propietario rechazó tu solicitud anterior. Puedes volver a pedirla.</div></div><br>`;
  const kin = $('.key-inp', node), kerr = $('.key-err', node);
  kin.addEventListener('input', () => { kin.value = kin.value.toUpperCase().replace(/[^0-9A-Z]/g, ''); kerr.textContent = ''; });
  const redeem = async () => {
    const key = kin.value.trim();
    if (key.length < 6) { kerr.textContent = 'La clave tiene 6 letras o números.'; kin.focus(); return; }
    const b = $('.key-go', node); b.disabled = true; b.textContent = 'Comprobando…';
    try {
      const res = await db.rpc('hd_redeem_invite', { p_code: code, p_key: key });
      if (typeof res === 'string' && res.startsWith('ERR:')) { kerr.textContent = res.slice(4); return; }
      L.close();
      snack('¡Listo! Ya tienes acceso.');
      Doc.open(res);
    } catch (ex) { kerr.textContent = ex.message; }
    finally { b.disabled = false; b.textContent = 'Entrar con la clave'; }
  };
  $('.key-go', node).addEventListener('click', redeem);
  kin.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); redeem(); } });
  setTimeout(() => kin.focus(), 250);
  $('.req-go', node).addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try {
      const res = await db.rpc('hd_request_access', { p_code: code, p_message: $('textarea', node).value.trim() });
      L.close();
      if (res === 'ya_tienes_acceso') { Doc.open(r.id); return; }
      dialog({ title: 'Solicitud enviada', text: 'Cuando el propietario apruebe tu correo, el documento aparecerá en «Compartidos conmigo».', actions: [{ label: 'Aceptar', primary: true }] });
    } catch (ex) { b.disabled = false; snack(ex.message); }
  });
}

// ===================================================================== solicitudes (propietario)
function openRequests() {
  const node = el(`<div class="full"><div class="full-top"><button class="icon-btn">${ic('back')}</button><h2>Solicitudes de acceso</h2></div><div class="full-body"></div></div>`);
  const L = pushLayer(node, () => { if (state.screen === 'home') renderList(); });
  $('.full-top .icon-btn', node).addEventListener('click', () => L.close());
  const body = $('.full-body', node);
  const render = () => {
    if (!state.requests.length) { body.innerHTML = `<div class="empty">${ic('inbox')}<h3>Sin solicitudes</h3>Cuando alguien con el código de un documento pida acceso, aparecerá aquí.</div>`; $('.empty svg', body).style.cssText = 'width:72px;height:72px;color:var(--on-3)'; return; }
    body.innerHTML = '';
    for (const r of state.requests) {
      const d = state.docs.find((x) => x.id === r.doc_id) || { title: 'Documento' };
      body.appendChild(requestCard(r, d, () => { state.requests = state.requests.filter((x) => x.id !== r.id); render(); }));
    }
  };
  render();
}
function requestCard(r, d, done) {
  const card = el(`<div class="req-card">
    <div class="person">${avatar(r.name || r.email, r.email)}<div class="person-txt"><div>${esc(r.name || r.email)}</div><small>${esc(r.email)}</small><small>Pide ver «${esc(d.title)}» · ${esc(fmtDate(r.created_at))}</small></div></div>
    ${r.message ? `<p class="req-msg">“${esc(r.message)}”</p>` : ''}
    <div class="req-actions"><button class="btn-text danger" data-a="no">Rechazar</button><button class="btn-text" data-a="editor">Aprobar como editor</button><button class="btn-tonal" data-a="lector">Aprobar</button></div>
  </div>`);
  $$('button', card).forEach((b) => b.addEventListener('click', async () => {
    const a = b.dataset.a;
    $$('button', card).forEach((x) => { x.disabled = true; });
    try {
      await db.rpc('hd_answer_request', { p_id: r.id, p_approve: a !== 'no', p_role: a === 'editor' ? 'editor' : 'lector' });
      if (a !== 'no') state.sharedDocs.add(r.doc_id);
      snack(a === 'no' ? 'Solicitud rechazada.' : `${r.email} ya puede ${a === 'editor' ? 'editar' : 'ver'} el documento.`);
      done();
    } catch (e) { $$('button', card).forEach((x) => { x.disabled = false; }); snack(e.message); }
  }));
  return card;
}

// ===================================================================== compartir (propietario)
function shareLink(d) {
  return `${WEB_URL}?c=${encodeURIComponent(d.code)}&t=${encodeURIComponent((d.title || '').slice(0, 80))}&de=${encodeURIComponent(Auth.name)}`;
}
function inviteMessage(d, inv) {
  const uso = inv.max_uses === 1 ? 'sirve para una sola persona' : inv.max_uses > 1 ? `sirve para ${inv.max_uses} personas` : 'sirve para varias personas';
  return `Te compartí el documento «${d.title}».\n\n1️⃣ Ábrelo aquí 👇\n${shareLink(d)}\n\n2️⃣ Tu clave de acceso: *${inv.key}*\n\n(La clave ${uso}. Crea tu cuenta en la app, escribe la clave y listo.)`;
}
function shareMessage(d, emails) {
  const who = emails && emails.length === 1 ? `\n\nEntra con tu correo ${emails[0]} (es el que aprobé).` : '';
  return `Te compartí el documento «${d.title}».\n\nÁbrelo aquí 👇\n${shareLink(d)}${who}`;
}
function openShare(d, onChange) {
  const node = el(`<div class="full"><div class="full-top"><button class="icon-btn">${ic('back')}</button><h2></h2></div><div class="full-body">
    <div class="sec-title" style="padding-top:4px">Aprobar correos</div>
    <form class="share-add"><input class="inp" type="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="correo@ejemplo.com"><select class="inp"><option value="lector">Lector</option><option value="editor">Editor</option></select></form>
    <div style="padding:10px 20px 0;display:flex;justify-content:flex-end"><button class="btn-filled add-btn">Aprobar</button></div>
    <div class="sec-title">Claves de acceso</div>
    <div style="padding:0 20px 4px;font-size:13px;color:var(--on-2)">Para compartir por WhatsApp sin saber el correo: quien tenga la clave entra y su correo queda aprobado.</div>
    <div style="padding:8px 20px 0"><button class="btn-tonal new-key" style="display:flex;align-items:center;gap:8px">${ic('key')}Crear clave de acceso</button></div>
    <div class="keys"></div>
    <div class="reqs"></div>
    <div class="sec-title">Personas con acceso</div>
    <div class="people"></div>
    <div class="sec-title">Enlace del documento</div>
    <div class="code-box"><div class="code-txt link-txt"><small>Solo lo abren los correos aprobados. Los demás pueden pedirte acceso.</small><span></span></div><button class="icon-btn small cp">${ic('copy')}</button><button class="icon-btn small sh">${ic('share')}</button></div>
    <div style="padding:6px 24px 0;font-size:13px;color:var(--on-2)">Código: <b style="letter-spacing:1px">${esc(d.code)}</b></div>
    <div class="note">${ic('shield')}<div>Solo tú y los correos aprobados pueden abrir este documento. Los lectores no pueden editar, tomar capturas ni copiar el texto.</div></div>
  </div></div>`);
  $('h2', node).textContent = `Compartir «${d.title}»`;
  const L = pushLayer(node, () => { onChange && onChange(); if (state.screen === 'home') renderList(); });
  $('.full-top .icon-btn', node).addEventListener('click', () => L.close());
  $('.link-txt span', node).textContent = shareLink(d);
  $('.cp', node).addEventListener('click', () => { Native.copyText(shareLink(d)); snack('Enlace copiado.'); });
  $('.sh', node).addEventListener('click', () => Native.shareText(shareMessage(d)));
  const people = $('.people', node), reqBox = $('.reqs', node), keysBox = $('.keys', node);
  let shares = [], invites = [];
  const renderKeys = () => {
    keysBox.innerHTML = '';
    for (const inv of invites) {
      const used = inv.max_uses > 0 ? `${inv.uses}/${inv.max_uses} uso${inv.max_uses === 1 ? '' : 's'}` : `${inv.uses} usos`;
      const spent = inv.revoked || (inv.max_uses > 0 && inv.uses >= inv.max_uses);
      const row = el(`<div class="key-row ${spent ? 'spent' : ''}"><div class="key-code">${esc(inv.key)}</div><div class="person-txt"><div>${inv.role === 'editor' ? 'Editor' : 'Lector'} · ${used}${inv.revoked ? ' · anulada' : spent ? ' · ya usada' : ''}</div><small>${inv.used_by.length ? 'Usada por ' + esc(inv.used_by.join(', ')) : 'Creada ' + esc(fmtDate(inv.created_at))}</small></div>${spent ? '' : `<button class="icon-btn small" data-k="send">${ic('share')}</button>`}<button class="icon-btn small" data-k="more">${ic('more')}</button></div>`);
      const send = $('[data-k=send]', row); if (send) send.addEventListener('click', () => Native.shareText(inviteMessage(d, inv)));
      $('[data-k=more]', row).addEventListener('click', () => sheet({
        title: 'Clave ' + inv.key,
        items: [
          !spent && { icon: 'share', label: 'Enviar enlace y clave', onClick: () => Native.shareText(inviteMessage(d, inv)) },
          !spent && { icon: 'copy', label: 'Copiar clave', onClick: () => { Native.copyText(inv.key); snack('Clave copiada.'); } },
          !inv.revoked && { icon: 'close', label: 'Anular clave', sub: 'Ya no servirá (quienes la usaron siguen con acceso)', danger: true, onClick: () => revokeKey(inv) },
          { icon: 'delete', label: 'Borrar de la lista', danger: true, onClick: () => deleteKey(inv) },
        ],
      }));
      keysBox.appendChild(row);
    }
  };
  const revokeKey = async (inv) => {
    try { await db.update('hd_invites', `id=eq.${inv.id}`, { revoked: true }); inv.revoked = true; renderKeys(); snack('Clave anulada.'); } catch (e) { snack(e.message); }
  };
  const deleteKey = async (inv) => {
    try { await db.remove('hd_invites', `id=eq.${inv.id}`); invites = invites.filter((x) => x !== inv); renderKeys(); } catch (e) { snack(e.message); }
  };
  const createKey = (role, max) => async () => {
    const stop = busy('Creando clave…');
    try {
      const [inv] = await db.insert('hd_invites', { doc_id: d.id, role, max_uses: max });
      stop();
      invites.unshift(inv); renderKeys();
      const body = el(`<div style="text-align:center"><div class="key-big">${esc(inv.key)}</div><p>${role === 'editor' ? 'Podrá ver y editar.' : 'Solo podrá ver.'} ${max === 1 ? 'Sirve para <b>una sola persona</b>.' : max > 1 ? `Sirve para <b>${max} personas</b>.` : 'Sirve para <b>todas las personas</b> que la tengan.'}</p></div>`);
      dialog({ title: 'Clave de acceso', body, actions: [
        { label: 'Copiar', onClick: () => { Native.copyText(inv.key); snack('Clave copiada.'); return false; } },
        { label: 'Enviar enlace y clave', primary: true, onClick: () => Native.shareText(inviteMessage(d, inv)) },
      ] });
    } catch (e) { stop(); snack(e.message); }
  };
  $('.new-key', node).addEventListener('click', () => sheet({
    title: 'Nueva clave de acceso',
    sub: 'Elige quién y cuántos pueden usarla',
    items: [
      { icon: 'eye', label: 'Una persona · solo ver', sub: 'Recomendado: si reenvían el mensaje, no le sirve a nadie más', onClick: createKey('lector', 1) },
      { icon: 'edit', label: 'Una persona · ver y editar', onClick: createKey('editor', 1) },
      { icon: 'people', label: 'Hasta 10 personas · solo ver', onClick: createKey('lector', 10) },
      { icon: 'people', label: 'Sin límite · solo ver', sub: 'Cualquiera que tenga la clave', onClick: createKey('lector', 0) },
    ],
  }));
  const render = () => {
    people.innerHTML = '';
    people.appendChild(el(`<div class="person">${avatar(Auth.name, Auth.email)}<div class="person-txt"><div>${esc(Auth.name)} (tú)</div><small>${esc(Auth.email)}</small></div><span class="role-btn">Propietario</span></div>`));
    for (const s of shares) {
      const row = el(`<div class="person">${avatar(s.email, s.email)}<div class="person-txt"><div>${esc(s.email)}</div><small>Aprobado ${esc(fmtDate(s.created_at))}</small></div><button class="role-btn">${s.role === 'editor' ? 'Editor' : 'Lector'}${ic('drop')}</button></div>`);
      $('.role-btn', row).addEventListener('click', () => sheet({
        title: s.email,
        items: [
          { icon: 'eye', label: 'Lector', sub: 'Solo puede ver', onClick: () => setRole(s, 'lector') },
          { icon: 'edit', label: 'Editor', sub: 'Puede ver y modificar', onClick: () => setRole(s, 'editor') },
          '-',
          { icon: 'removeUser', label: 'Quitar acceso', danger: true, onClick: () => removeShare(s) },
        ],
      }));
      people.appendChild(row);
    }
    if (!shares.length) people.appendChild(el(`<div class="person" style="color:var(--on-2);font-size:14px;min-height:0">Todavía no apruebas ningún correo.</div>`));
    const reqs = state.requests.filter((r) => r.doc_id === d.id);
    reqBox.innerHTML = '';
    if (reqs.length) {
      reqBox.appendChild(el(`<div class="sec-title">Solicitudes pendientes</div>`));
      for (const r of reqs) reqBox.appendChild(requestCard(r, d, () => { state.requests = state.requests.filter((x) => x.id !== r.id); load(); }));
    }
  };
  const load = async () => {
    try {
      db.select('hd_invites', `doc_id=eq.${d.id}&select=*&order=created_at.desc`).then((x) => { invites = x || []; renderKeys(); }).catch(() => {});
      const [sh, rq] = await Promise.all([
        db.select('hd_shares', `doc_id=eq.${d.id}&select=email,role,created_at&order=created_at.asc`),
        db.select('hd_requests', `doc_id=eq.${d.id}&status=eq.pendiente&select=id,doc_id,email,name,message,status,created_at&order=created_at.desc`),
      ]);
      shares = sh || [];
      state.requests = state.requests.filter((r) => r.doc_id !== d.id).concat(rq || []);
      if (shares.length) state.sharedDocs.add(d.id); else state.sharedDocs.delete(d.id);
    } catch (e) { snack(e.message); }
    render();
  };
  const setRole = async (s, role) => {
    try { await db.update('hd_shares', `doc_id=eq.${d.id}&email=eq.${encodeURIComponent(s.email)}`, { role }); s.role = role; render(); snack(`${s.email} ahora es ${role}.`); } catch (e) { snack(e.message); }
  };
  const removeShare = async (s) => {
    if (!(await confirmBox('¿Quitar acceso?', `${s.email} ya no podrá abrir este documento.`, 'Quitar', true))) return;
    try { await db.remove('hd_shares', `doc_id=eq.${d.id}&email=eq.${encodeURIComponent(s.email)}`); shares = shares.filter((x) => x !== s); if (!shares.length) state.sharedDocs.delete(d.id); render(); snack('Acceso quitado.'); } catch (e) { snack(e.message); }
  };
  const add = async () => {
    const inp = $('.share-add input', node), role = $('.share-add select', node).value;
    const emails = inp.value.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!emails.length) { snack('Escribe un correo.'); inp.focus(); return; }
    const bad = emails.find((x) => !validEmail(x));
    if (bad) { snack(`«${bad}» no es un correo válido.`); return; }
    if (emails.includes(Auth.email)) { snack('No necesitas aprobar tu propio correo.'); return; }
    const btn = $('.add-btn', node); btn.disabled = true;
    try {
      await db.upsert('hd_shares', emails.map((email) => ({ doc_id: d.id, email, role })));
      inp.value = '';
      snack(emails.length === 1 ? `${emails[0]} aprobado como ${role}.` : `${emails.length} correos aprobados.`);
      await load();
      if (await confirmBox('¿Enviarle el enlace?', 'Mándale el enlace por WhatsApp, correo o mensaje. Debe entrar a Docs HTML con el correo que aprobaste.', 'Enviar enlace')) Native.shareText(shareMessage(d, emails));
    } catch (e) { snack(e.message); }
    finally { btn.disabled = false; }
  };
  $('.add-btn', node).addEventListener('click', add);
  $('.share-add', node).addEventListener('submit', (e) => { e.preventDefault(); add(); });
  people.innerHTML = '<div class="spinner"></div>';
  load();
}

// ===================================================================== documento: ver y editar
const Doc = {
  d: null, role: null, mode: 'view', frame: null, fdoc: null, lastHtml: '', dirty: false, dirtyAt: 0, saving: false,
  timer: 0, range: null, codeEl: null, failCount: 0, loadToken: 0,

  get canEdit() { return this.role === 'propietario' || this.role === 'editor'; },
  get isOwner() { return this.role === 'propietario'; },

  async open(id, opt = {}) {
    const token = ++this.loadToken;
    go('doc');
    this.d = null; this.role = null; this.mode = 'view'; this.dirty = false; this.range = null;
    this.renderTop();
    $('#doc-body').innerHTML = '<div class="spinner" style="margin-top:80px"></div>';
    $('#fab-edit').hidden = true; $('#fmt-bar').hidden = true;
    try {
      const [rows, role] = await Promise.all([
        opt.fresh ? Promise.resolve([opt.fresh]) : db.select('hd_documents', `id=eq.${id}&select=*`),
        opt.fresh ? Promise.resolve('propietario') : db.rpc('hd_role', { p_doc: id }),
      ]);
      if (token !== this.loadToken) return;
      if (!rows || !rows[0] || !role) {
        go('home');
        dialog({ title: 'Sin acceso', text: 'Este documento no existe o el propietario quitó tu acceso.', actions: [{ label: 'Aceptar', primary: true }] });
        return;
      }
      this.d = rows[0]; this.role = role;
      if (opt.fresh && opt.fresh.content) this.d.content = ensureDoc(this.d.content, this.d.title);
      else await loadContent(this.d);
      if (token !== this.loadToken) return;
      if (opt.edit && this.canEdit) await this.startEdit(opt.code); else await this.showView();
    } catch (e) {
      if (token !== this.loadToken) return;
      $('#doc-body').innerHTML = `<div class="empty"><h3>No se pudo abrir</h3>${esc(e.message)}<br><br><button class="btn-tonal retry">Reintentar</button></div>`;
      $('#doc-body .retry').addEventListener('click', () => this.open(id, opt));
    }
  },

  renderTop() {
    const top = $('#doc-top'), d = this.d;
    top.classList.toggle('editing', this.mode !== 'view');
    if (this.mode === 'view') {
      top.innerHTML = `<button class="icon-btn" data-a="back">${ic('back')}</button>
        <div class="doc-title">${d ? esc(d.title) : ''}${d && !this.isOwner ? `<small>${this.role === 'editor' ? 'Puedes editar' : 'Solo lectura'} · de ${esc(d.owner_name || d.owner_email)}</small>` : ''}</div>
        ${d ? `<button class="icon-btn" data-a="dark" aria-label="Documento claro u oscuro">${ic(docDark.on ? 'sun' : 'moon')}</button>` : ''}
        ${d && this.isOwner ? `<button class="icon-btn" data-a="share">${ic('personAdd')}</button>` : ''}
        ${d ? `<button class="icon-btn" data-a="more">${ic('more')}</button>` : ''}`;
    } else {
      top.innerHTML = `<button class="icon-btn" data-a="done">${ic('check')}</button>
        <span class="save-state" id="save-state"></span>
        ${this.mode === 'edit' ? `<button class="icon-btn" data-a="undo">${ic('undo')}</button><button class="icon-btn" data-a="redo">${ic('redo')}</button><button class="icon-btn" data-a="insert">${ic('add')}</button><button class="icon-btn" data-a="dark" aria-label="Documento claro u oscuro">${ic(docDark.on ? 'sun' : 'moon')}</button>` : ''}
        <button class="icon-btn" data-a="more">${ic('more')}</button>`;
    }
    $$('[data-a]', top).forEach((b) => {
      b.addEventListener('pointerdown', (e) => { if (this.mode === 'edit') e.preventDefault(); });
      b.addEventListener('click', () => this.action(b.dataset.a));
    });
  },

  action(a) {
    if (a === 'back') return this.back();
    if (a === 'done') return this.stopEdit();
    if (a === 'share') return openShare(this.d, () => {});
    if (a === 'more') return this.moreMenu();
    if (a === 'undo') return this.exec('undo');
    if (a === 'redo') return this.exec('redo');
    if (a === 'insert') return this.insertMenu();
    if (a === 'dark') return this.toggleDark();
  },

  async toggleDark() {
    docDark.on = !docDark.on;
    snack(docDark.on ? 'Documento en oscuro (solo en tu pantalla).' : 'Documento en claro.');
    this.renderTop();
    if (this.mode === 'view') { await this.showView(); return; }
    if (this.mode === 'edit' && this.fdoc) { docDark.apply(this.fdoc); docDark.frame(this.frame); }
  },

  back() {
    if (this.mode !== 'view') { this.stopEdit(); return; }
    this.loadToken++;
    go('home');
  },

  moreMenu() {
    const d = this.d;
    const items = this.mode === 'view' ? [
      this.canEdit && { icon: 'edit', label: 'Editar', onClick: () => this.startEdit(false) },
      this.canEdit && { icon: 'code', label: 'Editar código HTML', onClick: () => this.startEdit(true) },
      this.isOwner && { icon: 'personAdd', label: 'Compartir', onClick: () => openShare(d) },
      this.canEdit && { icon: 'rename', label: 'Cambiar nombre', onClick: () => renameDoc(d, () => this.renderTop()) },
      this.isOwner && { icon: 'link', label: 'Copiar enlace', onClick: () => { Native.copyText(shareLink(d)); snack('Enlace copiado.'); } },
      this.isOwner && { icon: 'download', label: 'Descargar archivo HTML', onClick: () => downloadDoc(d.id) },
      { icon: docDark.on ? 'sun' : 'moon', label: docDark.on ? 'Ver documento en claro' : 'Ver documento en oscuro', onClick: () => this.toggleDark() },
      { icon: 'refresh', label: 'Actualizar', onClick: () => this.open(d.id) },
      { icon: 'info', label: 'Detalles', onClick: () => openDetails(d) },
      '-',
      this.isOwner && { icon: 'delete', label: 'Eliminar', danger: true, onClick: () => deleteDoc(d, () => go('home')) },
      !this.isOwner && { icon: 'removeUser', label: 'Quitar de mi lista', danger: true, onClick: () => leaveDoc(d, () => go('home')) },
    ] : [
      this.mode === 'edit' ? { icon: 'code', label: 'Ver código HTML', onClick: () => this.switchMode('code') } : { icon: 'edit', label: 'Editor visual', onClick: () => this.switchMode('edit') },
      this.mode === 'edit' && { icon: docDark.on ? 'sun' : 'moon', label: docDark.on ? 'Ver documento en claro' : 'Ver documento en oscuro', onClick: () => this.toggleDark() },
      { icon: 'rename', label: 'Cambiar nombre', onClick: () => renameDoc(d, () => this.renderTop()) },
      this.isOwner && { icon: 'personAdd', label: 'Compartir', onClick: () => openShare(d) },
      this.isOwner && { icon: 'download', label: 'Descargar archivo HTML', onClick: async () => { await this.saveNow(); downloadDoc(d.id); } },
      { icon: 'info', label: 'Detalles', onClick: () => openDetails(d) },
    ];
    sheet({ title: d.title, icon: `<div class="doc-ico">${docIcon()}</div>`, items });
  },

  // ---------------------------------------------------------------- ver (protegido)
  async showView() {
    this.mode = 'view';
    clearInterval(this.timer);
    Bridge.sel(false);
    this.renderTop();
    $('#fmt-bar').hidden = true;
    const body = $('#doc-body');
    const html = await buildViewerHtml(this.d.content);
    body.innerHTML = '';
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts allow-forms allow-presentation');
    f.setAttribute('allow', 'fullscreen; autoplay');
    f.setAttribute('allowfullscreen', '');
    docDark.frame(f);
    f.srcdoc = html;
    body.appendChild(f);
    this.frame = f;
    if (!this.canEdit) {
      const chip = el(`<div class="ro-chip">${ic('lock')}Solo lectura · protegido</div>`);
      body.appendChild(chip);
      setTimeout(() => { chip.style.opacity = '0'; }, 2600);
    }
    const fab = $('#fab-edit'); fab.innerHTML = ic('edit'); fab.hidden = !this.canEdit;
  },

  // ---------------------------------------------------------------- editar
  async startEdit(code) {
    if (!this.canEdit) return;
    this.mode = code ? 'code' : 'edit';
    $('#fab-edit').hidden = true;
    Bridge.sel(true);
    this.lastSavedContent = this.d.content;
    this.renderTop();
    this.setState('');
    if (this.mode === 'code') this.mountCode(this.d.content); else await this.mountEditor(this.d.content);
    clearInterval(this.timer);
    this.big = (this.d.content || '').length > 1024 * 1024;
    this.timer = setInterval(() => this.tick(), this.big ? 2500 : 700);
  },

  async mountEditor(html) {
    const body = $('#doc-body');
    body.innerHTML = '';
    $('#fmt-bar').hidden = false;
    this.renderFmtBar();
    const d = parseHtml(html);
    await resolveMedia(d);
    const st = d.createElement('style'); st.id = 'hd-editor-style';
    st.textContent = 'body{min-height:calc(100vh - 2px);outline:none;caret-color:#1a73e8}body:empty::before{content:"Escribe aquí…";color:#9aa0a6}video,img{cursor:default}';
    d.head.appendChild(st);
    docDark.apply(d);
    d.body.setAttribute('contenteditable', 'true');
    d.body.setAttribute('spellcheck', 'true');
    const f = document.createElement('iframe');
    // sin allow-scripts: el código del documento no se ejecuta mientras se edita
    f.setAttribute('sandbox', 'allow-same-origin');
    docDark.frame(f);
    f.srcdoc = serialize(d);
    body.appendChild(f);
    this.frame = f; this.codeEl = null;
    await new Promise((r) => { f.addEventListener('load', r, { once: true }); setTimeout(r, 3000); });
    this.fdoc = f.contentDocument;
    try { this.fdoc.execCommand('styleWithCSS', false, false); } catch (e) {}
    this.lastHtml = this.serializeEditor();
    this.dirty = false;
  },

  mountCode(html) {
    const body = $('#doc-body');
    body.innerHTML = '';
    $('#fmt-bar').hidden = true;
    const ta = document.createElement('textarea');
    ta.className = 'code'; ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocorrect', 'off');
    ta.value = html;
    body.appendChild(ta);
    const tabs = el(`<div class="code-tabs"><button data-a="preview">${ic('eye')}Vista previa</button></div>`);
    body.appendChild(tabs);
    $('[data-a=preview]', tabs).addEventListener('click', () => this.preview());
    this.codeEl = ta; this.frame = null; this.fdoc = null;
    this.lastHtml = ta.value; this.dirty = false;
  },

  async preview() {
    const html = await buildViewerHtml(this.currentHtml());
    const node = el(`<div class="full"><div class="full-top"><button class="icon-btn">${ic('close')}</button><h2>Vista previa</h2></div><div class="doc-body" style="flex:1"></div></div>`);
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts allow-forms allow-presentation');
    f.setAttribute('allowfullscreen', '');
    docDark.frame(f);
    f.srcdoc = html;
    $('.doc-body', node).appendChild(f);
    const L = pushLayer(node);
    $('.icon-btn', node).addEventListener('click', () => L.close());
  },

  serializeEditor() {
    if (!this.fdoc || !this.fdoc.documentElement) return this.lastHtml;
    const clone = this.fdoc.documentElement.cloneNode(true);
    const st = clone.querySelector('#hd-editor-style'); if (st) st.remove();
    const ds = clone.querySelector('#hd-dark-style'); if (ds) ds.remove();
    const b = clone.querySelector('body'); if (b) { b.removeAttribute('contenteditable'); b.removeAttribute('spellcheck'); }
    for (const n of clone.querySelectorAll('[data-hd-src]')) n.removeAttribute('src');
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  },
  currentHtml() { return this.mode === 'code' ? (this.codeEl ? this.codeEl.value : this.lastHtml) : this.serializeEditor(); },

  tick() {
    if (this.mode === 'view' || !this.d) return;
    const html = this.currentHtml();
    if (html !== this.lastHtml) { this.lastHtml = html; this.dirty = true; this.dirtyAt = Date.now(); this.setState('Editando…'); }
    if (this.dirty && !this.saving && Date.now() - this.dirtyAt > (this.big ? 4000 : 1300) && Date.now() >= (this.retryAt || 0)) this.save();
    if (this.mode === 'edit') this.updateFmtState();
  },

  setState(t) { const s = $('#save-state'); if (s) s.textContent = t; },

  async save(force) {
    if (!this.d || this.saving) return;
    this.saving = true;
    const content = this.lastHtml, d = this.d;
    this.dirty = false;
    this.setState('Guardando…');
    try {
      const doc = parseHtml(content); setTitleTag(doc, d.title); stripMedia(doc);
      const clean = serialize(doc);
      const q = force ? `id=eq.${d.id}` : `id=eq.${d.id}&updated_at=eq.${encodeURIComponent(d.updated_at)}`;
      const rows = await persistContent(d, clean, q);
      if (!rows || !rows.length) { this.saving = false; return this.conflict(content); }
      d.updated_at = rows[0].updated_at; d.content = clean; d.edited_by = rows[0].edited_by;
      const cached = state.docs.find((x) => x.id === d.id); if (cached) cached.updated_at = d.updated_at;
      this.failCount = 0; this.retryAt = 0;
      if (!this.dirty) this.setState('Guardado');
    } catch (e) {
      this.dirty = true; this.failCount++;
      this.retryAt = Date.now() + Math.min(30000, 2000 * this.failCount);
      this.setState(/conexión/i.test(e.message) ? 'Sin conexión · reintentando' : 'No se guardó · reintentando');
      if (this.failCount === 1) snack(e.message);
    } finally { this.saving = false; }
  },

  async conflict(mine) {
    const d = this.d;
    let latest = null;
    try { [latest] = await db.select('hd_documents', `id=eq.${d.id}&select=*`); } catch (e) {}
    if (!latest) { this.dirty = true; this.retryAt = Date.now() + 5000; return; }
    this.dirty = false;
    dialog({
      title: 'Otra persona hizo cambios',
      text: `${latest.edited_by || 'Alguien'} modificó este documento mientras lo editabas. ¿Qué versión quieres conservar?`,
      dismiss: false,
      actions: [
        { label: 'Cargar la de ellos', onClick: async () => { this.d = await loadContent(latest); if (this.mode === 'code') this.mountCode(this.d.content); else await this.mountEditor(this.d.content); this.setState('Actualizado'); } },
        { label: 'Guardar la mía', primary: true, onClick: () => { this.d.updated_at = latest.updated_at; this.lastHtml = mine; this.dirty = true; this.dirtyAt = 0; this.save(true); } },
      ],
    });
  },

  async saveNow() {
    if (this.mode === 'view') return;
    const html = this.currentHtml();
    if (html !== this.lastHtml) { this.lastHtml = html; this.dirty = true; }
    for (let i = 0; i < 50 && this.saving; i++) await sleep(100);
    if (this.dirty) await this.save();
  },

  async stopEdit() {
    if (this.mode === 'edit' && this.fdoc) { try { linkify(this.fdoc); } catch (e) {} }
    await this.saveNow();
    if (this.dirty) {
      const leave = await confirmBox('Cambios sin guardar', 'No se pudieron guardar los últimos cambios (revisa tu conexión). Si sales ahora se perderán.', 'Salir igual', true);
      if (!leave) return;
    }
    clearInterval(this.timer);
    this.fdoc = null; this.codeEl = null; this.dirty = false;
    await this.showView();
  },

  async switchMode(m) {
    const html = this.currentHtml();
    this.lastHtml = html;
    this.mode = m;
    this.renderTop();
    if (m === 'code') this.mountCode(html); else await this.mountEditor(html);
    this.lastHtml = html;
    if (this.d && html !== this.d.content) { this.dirty = true; this.dirtyAt = 0; }
  },

  // ---------------------------------------------------------------- herramientas del editor
  exec(cmd, val) {
    if (!this.fdoc) return;
    this.restoreRange();
    try { this.fdoc.execCommand(cmd, false, val == null ? null : val); } catch (e) {}
    this.saveRange();
    this.updateFmtState();
  },
  saveRange() {
    try { const s = this.fdoc.getSelection(); if (s && s.rangeCount) this.range = s.getRangeAt(0).cloneRange(); } catch (e) {}
  },
  restoreRange() {
    if (!this.fdoc) return;
    try {
      this.frame.contentWindow.focus();
      const s = this.fdoc.getSelection();
      const inBody = s && s.rangeCount && this.fdoc.body.contains(s.getRangeAt(0).commonAncestorContainer);
      if (inBody) return;
      s.removeAllRanges();
      if (this.range && this.fdoc.body.contains(this.range.commonAncestorContainer)) s.addRange(this.range);
      else { const r = this.fdoc.createRange(); r.selectNodeContents(this.fdoc.body); r.collapse(false); s.addRange(r); }
    } catch (e) {}
  },
  insertHtml(html) {
    if (this.mode === 'code') {
      const ta = this.codeEl, a = ta.selectionStart, b = ta.selectionEnd;
      ta.value = ta.value.slice(0, a) + html + ta.value.slice(b);
      ta.selectionStart = ta.selectionEnd = a + html.length;
      return;
    }
    this.exec('insertHTML', html);
  },

  renderFmtBar() {
    const bar = $('#fmt-bar');
    const B = (cmd, icon, label) => `<button class="icon-btn" data-cmd="${cmd}" aria-label="${label}">${ic(icon)}</button>`;
    bar.innerHTML = `<button class="fmt-style" data-x="style"><span id="style-label">Normal</span>${ic('drop')}</button>
      ${B('bold', 'bold', 'Negrita')}${B('italic', 'italic', 'Cursiva')}${B('underline', 'underline', 'Subrayado')}${B('strikeThrough', 'strike', 'Tachado')}
      <button class="icon-btn" data-x="color" aria-label="Color de texto">${ic('color')}</button>
      <button class="icon-btn" data-x="fill" aria-label="Resaltado">${ic('fill')}</button>
      <span class="sep"></span>
      ${B('insertUnorderedList', 'ul', 'Viñetas')}${B('insertOrderedList', 'ol', 'Numeración')}
      ${B('justifyLeft', 'alignL', 'Izquierda')}${B('justifyCenter', 'alignC', 'Centro')}${B('justifyRight', 'alignR', 'Derecha')}
      ${B('outdent', 'indentLess', 'Menos sangría')}${B('indent', 'indentMore', 'Más sangría')}
      <span class="sep"></span>
      <button class="icon-btn" data-x="link" aria-label="Enlace">${ic('link')}</button>
      ${B('removeFormat', 'clear', 'Quitar formato')}`;
    $$('button', bar).forEach((b) => {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.saveRange(); });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        if (b.dataset.cmd) return this.exec(b.dataset.cmd);
        const x = b.dataset.x;
        if (x === 'style') this.styleSheet();
        if (x === 'color') this.colorSheet('foreColor', 'Color del texto');
        if (x === 'fill') this.colorSheet('hiliteColor', 'Color de resaltado');
        if (x === 'link') this.linkDialog();
      });
    });
  },
  updateFmtState() {
    if (!this.fdoc) return;
    for (const b of $$('#fmt-bar [data-cmd]')) {
      const c = b.dataset.cmd;
      if (['removeFormat', 'indent', 'outdent'].includes(c)) continue;
      let on = false; try { on = this.fdoc.queryCommandState(c); } catch (e) {}
      b.classList.toggle('on', !!on);
    }
    let block = ''; try { block = String(this.fdoc.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (e) {}
    const names = { h1: 'Título 1', h2: 'Título 2', h3: 'Título 3', h4: 'Título 4', blockquote: 'Cita', pre: 'Código' };
    const lbl = $('#style-label'); if (lbl) lbl.textContent = names[block] || 'Normal';
  },
  styleSheet() {
    const opts = [
      ['p', 'Texto normal', 'font-size:16px'], ['h1', 'Título 1', 'font-size:26px'], ['h2', 'Título 2', 'font-size:21px'],
      ['h3', 'Título 3', 'font-size:18px;font-weight:700'], ['blockquote', 'Cita', 'font-style:italic;border-left:3px solid var(--outline);padding-left:10px'], ['pre', 'Código', 'font-family:monospace'],
    ];
    const body = el('<div></div>');
    const L = sheet({ title: 'Estilo de párrafo', body });
    for (const [tag, label, css] of opts) {
      const b = el(`<button class="style-opt"><span style="${css}">${label}</span></button>`);
      b.addEventListener('click', () => { L.close(); this.exec('formatBlock', '<' + tag + '>'); });
      body.appendChild(b);
    }
  },
  colorSheet(cmd, title) {
    const colors = ['#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff', '#980000', '#ff0000',
      '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
      '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3',
      '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#8e7cc3'];
    const body = el('<div class="palette"></div>');
    const L = sheet({ title, body, items: cmd === 'hiliteColor' ? [{ icon: 'clear', label: 'Sin resaltado', onClick: () => this.exec('hiliteColor', 'transparent') }] : [] });
    for (const c of colors) {
      const s = el(`<button class="swatch" style="background:${c}" aria-label="${c}"></button>`);
      s.addEventListener('click', () => { L.close(); this.exec(cmd, c); });
      body.appendChild(s);
    }
  },
  async linkDialog() {
    this.saveRange();
    const url = await promptBox({ title: 'Insertar enlace', label: 'Dirección (https://…)', type: 'url', placeholder: 'https://', ok: 'Insertar', validate: (v) => (/^(https?:\/\/|mailto:|tel:|wa\.me|www\.)/i.test(v) ? '' : 'Escribe una dirección que empiece con https://') });
    if (!url) return;
    const href = /^www\.|^wa\.me/i.test(url) ? 'https://' + url : url;
    const sel = this.range && !this.range.collapsed;
    if (sel) this.exec('createLink', href);
    else this.insertHtml(`<a href="${esc(href)}">${esc(url)}</a>&nbsp;`);
  },

  insertMenu() {
    this.saveRange();
    sheet({
      title: 'Insertar',
      items: [
        { icon: 'video', label: 'Video de la galería', sub: 'Hasta 50 MB, se guarda en privado', onClick: () => this.insertUpload('video') },
        { icon: 'play', label: 'Video por enlace', sub: 'YouTube o un enlace .mp4', onClick: () => this.insertVideoLink() },
        { icon: 'image', label: 'Imagen de la galería', onClick: () => this.insertUpload('image') },
        { icon: 'link', label: 'Enlace', onClick: () => this.linkDialog() },
        { icon: 'table', label: 'Tabla', onClick: () => this.insertTable() },
        { icon: 'hr', label: 'Línea horizontal', onClick: () => this.insertHtml('<hr><p><br></p>') },
      ],
    });
  },
  async insertUpload(kind) {
    const f = await pickFile(kind === 'video' ? 'video/*' : 'image/*');
    if (!f) return;
    if (!(f.type || '').startsWith(kind + '/')) { snack(kind === 'video' ? 'Elige un archivo de video.' : 'Elige una imagen.'); return; }
    if (f.size > MAX_FILE) {
      dialog({ title: 'Archivo muy grande', text: `Pesa ${(f.size / 1048576).toFixed(0)} MB y el máximo es 50 MB. Grábalo en menor calidad o súbelo a YouTube y usa «Video por enlace».`, actions: [{ label: 'Aceptar', primary: true }] });
      return;
    }
    const ext = ((f.name.match(/\.([a-z0-9]{2,5})$/i) || [])[1] || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase();
    const path = `${this.d.id}/${rid()}.${ext}`;
    const pb = progressBox(kind === 'video' ? 'Subiendo video…' : 'Subiendo imagen…');
    try {
      await files.upload(path, f, (p) => pb.set(p));
      pb.close();
      const urls = await files.sign([path]);
      const src = urls[path] || '';
      const html = kind === 'video'
        ? `<video controls playsinline preload="metadata" data-hd-src="${path}" src="${src}"></video><p><br></p>`
        : `<img data-hd-src="${path}" src="${src}" alt=""><p><br></p>`;
      this.insertHtml(html);
      await this.saveNow();
      snack(kind === 'video' ? 'Video agregado.' : 'Imagen agregada.');
    } catch (e) { pb.close(); snack(e.message); }
  },
  async insertVideoLink() {
    const url = await promptBox({ title: 'Video por enlace', text: 'Pega un enlace de YouTube o de un archivo de video (.mp4).', label: 'Enlace', type: 'url', placeholder: 'https://youtu.be/…', ok: 'Insertar', validate: (v) => (/^https?:\/\//i.test(v) ? '' : 'El enlace debe empezar con https://') });
    if (!url) return;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
    if (yt) {
      const id = yt[1];
      this.insertHtml(`<a href="https://www.youtube.com/watch?v=${id}" data-yt="${id}" style="display:block;position:relative;max-width:640px;text-decoration:none"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="Video de YouTube" style="display:block;width:100%;border-radius:10px"><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:68px;height:48px;border-radius:12px;background:#ff0000;color:#fff;font:28px/48px Arial;text-align:center">&#9654;</span></a><p><br></p>`);
    } else {
      this.insertHtml(`<video controls playsinline preload="metadata" src="${esc(url)}"></video><p><br></p>`);
    }
  },
  async insertTable() {
    const v = await promptBox({ title: 'Insertar tabla', label: 'Filas x columnas', value: '3x3', ok: 'Insertar', validate: (s) => (/^\d{1,2}\s*[x×*]\s*\d{1,2}$/i.test(s) ? '' : 'Escribe algo como 3x3') });
    if (!v) return;
    const [r, c] = v.split(/[x×*]/i).map((n) => Math.max(1, Math.min(20, parseInt(n, 10))));
    let h = '<table><tbody>';
    for (let i = 0; i < r; i++) { h += '<tr>'; for (let j = 0; j < c; j++) h += '<td><br></td>'; h += '</tr>'; }
    this.insertHtml(h + '</tbody></table><p><br></p>');
  },
};

// ¿Es un enlace a otro documento de Docs HTML? Devuelve su código.
function internalCode(url) {
  try {
    const u = new URL(url);
    const isOurs = u.protocol === 'docshtml:' || url.startsWith(WEB_URL) || /docs-html-web/.test(u.pathname);
    const c = (u.searchParams.get('c') || '').toUpperCase();
    return isOurs && /^[0-9A-Z]{8}$/.test(c) ? c : '';
  } catch (e) { return ''; }
}
// enlaces tocados dentro de un documento (vista protegida)
window.addEventListener('message', async (e) => {
  const data = e.data;
  if (!data || typeof data.hdOpen !== 'string') return;
  const fromDoc = $$('iframe').some((f) => f.contentWindow === e.source);
  if (!fromDoc) return;
  const url = data.hdOpen;
  const own = internalCode(url);
  if (own) { openCode(own); return; }
  if (!/^(https?:|mailto:|tel:)/i.test(url)) return;
  if (await confirmBox('¿Abrir enlace?', url, 'Abrir')) Native.openExternal(url);
});

// ===================================================================== arranque
function init() {
  initLogin();
  initHome();
  $('#fab-edit').addEventListener('click', () => Doc.startEdit(false));
  const qc = IS_WEB ? new URLSearchParams(location.search).get('c') : null;
  if (qc) { store.set('hd_pending_code', qc.toUpperCase()); history.replaceState(null, '', location.pathname); }
  if (Auth.s && Auth.s.refresh_token) go('home'); else go('login');
  if (IS_WEB) {
    const dl = $('#web-app-link'); if (dl) dl.hidden = false;
  }
}
init();
