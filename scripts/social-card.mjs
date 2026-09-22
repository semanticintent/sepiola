// Renders brand/social-card.png (1280×640) for the GitHub social preview and the page's Open Graph image.
// The voxel Sepiola (brand/sepiola-voxel.png) appears only here: it is an illustration, not the mark (D44).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const png = 'data:image/png;base64,' + readFileSync('brand/sepiola-voxel.png').toString('base64');
const fonts = readFileSync('src/fonts.css', 'utf8').replace(/url\('\.\/fonts\/([^']+)'\)/g, (m, f) => 'url(data:font/woff2;base64,' + readFileSync('src/fonts/' + f).toString('base64') + ')');
const html = `<!doctype html><html><head><style>${fonts}
body{margin:0;width:1280px;height:640px;overflow:hidden;font-family:'Barlow',sans-serif;color:#2B2016;
  background:radial-gradient(900px 520px at 15% 10%, #FFF4DC 0%, rgba(255,244,220,0) 60%),radial-gradient(700px 460px at 90% 20%, #F9CF7A 0%, rgba(249,207,122,0) 60%),radial-gradient(900px 620px at 70% 100%, #D9781F 0%, rgba(217,120,31,0) 60%),linear-gradient(160deg,#FFE9BF 0%,#F6BF5C 45%,#E48A2A 100%)}
.card{position:absolute;inset:0;display:flex;align-items:center;gap:56px;padding:0 96px}
img{width:400px;height:400px;filter:drop-shadow(0 24px 40px rgba(120,60,10,.35))}
.t{display:flex;flex-direction:column;gap:12px}
h1{font-family:'Barlow Condensed';font-weight:800;font-size:136px;line-height:.9;margin:0;letter-spacing:.01em}
.sub{font-size:34px;color:#6B5842;margin:0}
.line{font-family:'Barlow Condensed';font-weight:700;font-size:30px;line-height:1.25;margin:10px 0 0}
.line b{color:#C8561E}
.url{margin-top:20px;font-size:24px;color:#6B5842;font-family:ui-monospace,Menlo,monospace}
</style></head><body><div class=card><img src="${png}"><div class=t><h1>Sepiola</h1><p class=sub>a WebMCP telestrator</p><p class=line>The analyst decides. The pen draws.<br><b>The screen has no opinions.</b></p><p class=url>sepiola.semanticintent.dev</p></div></div></body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 640 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
await p.screenshot({ path: 'brand/social-card.png' }); await b.close();
console.log('brand/social-card.png rendered');
