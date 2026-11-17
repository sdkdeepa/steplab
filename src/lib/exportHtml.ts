import type { Copyright, Lab } from './parser'
import { linkedinText } from './parser'
import { wireDecks } from './deck'
import { STEPLAB_URL } from '../config'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const url = new URL(src, document.baseURI)
    if (url.protocol === 'data:') return null
    const res = await fetch(url.toString(), { mode: url.origin === location.origin ? 'same-origin' : 'cors' }).catch(() => fetch(url.toString()))
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.size > 5_000_000) return null
    return await new Promise((ok, bad) => {
      const r = new FileReader()
      r.onload = () => ok(String(r.result))
      r.onerror = bad
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Copies images into the HTML as data URIs so the downloaded file works offline. */
async function inlineImages(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html')
  const imgs = Array.from(doc.querySelectorAll('img[src]'))
  const cache = new Map<string, Promise<string | null>>()
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src')!
      // remember the original path so the lab can be reopened with its images
      if (!src.startsWith('data:') && !img.hasAttribute('data-src')) img.setAttribute('data-src', src)
      if (!cache.has(src)) cache.set(src, toDataUrl(src))
      const data = await cache.get(src)
      if (data) img.setAttribute('src', data)
    }),
  )
  return doc.getElementById('r')!.innerHTML
}

const copyrightHtml = (c: Copyright, where: string) =>
  `<p class="copyright copyright-${where}"><span>${esc(c.text)}</span>${
    c.linkedin
      ? `<a href="${esc(c.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(linkedinText(c.linkedin))}</a>`
      : ''
  }</p>`

/**
 * Builds one self-contained HTML file for a lab: no server, no dependencies.
 * `sanitize` is the same sanitizer the app uses.
 */
export async function exportLabHtml(lab: Lab, sanitize: (html: string) => string, source?: string): Promise<string> {
  const bodies = await Promise.all(lab.steps.map((s) => inlineImages(sanitize(s.html))))
  const c = lab.copyright
  const top = c && c.position !== 'bottom' ? copyrightHtml(c, 'top') : ''
  const bottom = c && c.position !== 'top' ? copyrightHtml(c, 'bottom') : ''
  const steps = lab.steps
    .map(
      (s, i) => `<section class="step" data-step="${i + 1}" data-title="${esc(s.title)}" data-badge="${esc(s.badge)}" data-label="${esc(s.label)}" data-min="${s.duration}"${i ? ' hidden' : ''}>
${top}<p class="kicker">${esc(s.label)} of ${esc(lab.steps[lab.steps.length - 1].badge)}${s.duration ? ` · ${s.duration} min` : ''}</p>
<h2>${esc(s.title)}</h2>
<div class="prose">${bodies[i]}</div>
${bottom}</section>`,
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0d0f">
<meta name="generator" content="StepLab">
<title>${esc(lab.title)}</title>
<script>try{var t=localStorage.getItem('steplab:theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${EXPORT_CSS}</style>
</head>
<body>
<header class="top"><a class="brand" href="${esc(STEPLAB_URL)}" target="_blank" rel="noopener noreferrer" aria-label="StepLab"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="20" width="10" height="9" rx="2" fill="currentColor" opacity=".35"/><rect x="11" y="12" width="10" height="17" rx="2" fill="currentColor" opacity=".65"/><rect x="19" y="3" width="10" height="26" rx="2" fill="#e8251a"/></svg><span>StepLab</span></a><h1>${esc(lab.title)}</h1><span id="left"></span><button id="theme" type="button" aria-label="Switch theme"></button></header>
<div class="meter"><i id="bar"></i></div>
<div class="wrap">
<nav class="rail"><ol id="rail"></ol></nav>
<main class="page">${steps}${lab.author && !c ? `<p class="by">Written by ${esc(lab.author)}</p>` : ''}</main>

</div>
<footer class="nav"><button id="prev">← Back</button><a class="made" href="${esc(STEPLAB_URL)}" target="_blank" rel="noopener noreferrer"><span class="made-by">Made with</span><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="20" width="10" height="9" rx="2" fill="currentColor" opacity=".35"/><rect x="11" y="12" width="10" height="17" rx="2" fill="currentColor" opacity=".65"/><rect x="19" y="3" width="10" height="26" rx="2" fill="#e8251a"/></svg><span class="made-name">StepLab</span></a><button id="next" class="next">Next →</button></footer>
<div class="scrim" id="done" role="dialog" aria-modal="true" aria-labelledby="dt"><div class="card">
<svg viewBox="0 0 88 88" width="88" height="88" aria-hidden="true"><circle cx="44" cy="44" r="42" fill="#e8251a"/><path d="M28 45l11 11 21-24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
<h2 id="dt">Congratulations!</h2><p>You've finished <strong>${esc(lab.title)}</strong>.</p>
<p class="mute">${lab.steps.length} steps${lab.totalMinutes ? ` · about ${lab.totalMinutes} minutes` : ''}</p>
<div class="acts"><button id="again">Start over</button><button id="close" class="next">Close</button></div></div></div>
<canvas id="fx"></canvas>
${source != null ? `<script type="application/json" id="steplab-source">${JSON.stringify(source).replace(/</g, '\\u003c')}</script>` : ''}
<script>(${wireDecks.toString()})(document);</script>
<script>${EXPORT_JS}</script>
</body>
</html>`
}

const EXPORT_CSS = `
:root{color-scheme:light dark;--bg:light-dark(#eef1f3,#111315);--page:light-dark(#fff,#1b1e21);--ink:light-dark(#0b0d0f,#eef1f3);--mute:light-dark(#56606a,#9aa5ae);--line:light-dark(#d5dbe0,#2b3035);--red:#e8251a;--code:light-dark(#f2f4f6,#24282c)}
:root[data-theme=light]{color-scheme:light}:root[data-theme=dark]{color-scheme:dark}
#theme{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:1px solid light-dark(#0b0d0f1f,#ffffff38);background:none;color:light-dark(#0b0d0f,#fff);cursor:pointer;flex:none}#theme.is-dark{color:#f5b301}#theme svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}#theme.is-dark circle{fill:currentColor}
*{box-sizing:border-box;min-width:0}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 Inter,system-ui,sans-serif}
h1,h2{font-family:"Inter Tight",Inter,sans-serif;line-height:1.1;text-wrap:balance}
.top{display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:14px max(4vw,16px);background:light-dark(#fff,#0b0d0f);color:light-dark(#0b0d0f,#fff);border-bottom:1px solid var(--line)}
.brand{display:inline-flex;align-items:center;gap:8px;font:800 19px "Inter Tight",Inter,sans-serif;color:inherit;text-decoration:none;letter-spacing:-.01em;flex:none}.brand .logo{width:26px;height:26px}.top h1{font-size:18px;margin:0;flex:1 1 200px}#left{font-size:14px;opacity:.75}
.meter{height:4px;background:var(--line)}.meter i{display:block;height:100%;width:0;background:var(--red);transition:width .3s}
.wrap{display:grid;grid-template-columns:minmax(0,270px) minmax(0,1fr);gap:32px;max-width:1200px;margin:0 auto;padding:32px max(4vw,16px) 120px}
.rail ol{list-style:none;margin:0;padding:0;position:sticky;top:20px}.rail button{display:flex;gap:12px;width:100%;text-align:left;padding:10px;border:0;border-radius:10px;background:none;color:var(--ink);font:500 15px Inter;cursor:pointer}
.rail .n{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;border:2px solid var(--line);color:var(--mute)}
.rail .on{background:var(--page)}.rail .on .n{background:var(--red);border-color:var(--red);color:#fff}.rail .ok .n{background:var(--ink);border-color:var(--ink);color:var(--page)}
.page{background:var(--page);border-radius:16px;padding:clamp(20px,4vw,48px);border:1px solid var(--line)}
.kicker{color:var(--red);font-weight:600;font-size:14px;margin:0}.page h2{font-size:clamp(28px,4vw,40px);margin:6px 0 20px}
.prose{max-width:72ch}.prose :not(pre)>code{font:14px "JetBrains Mono",monospace;background:var(--code);padding:2px 6px;border-radius:5px}
.prose a{color:var(--red)}.prose h1,.prose h2,.prose h3{font-size:20px;margin:28px 0 8px}
.code{margin:18px 0;border-radius:12px;overflow:hidden;background:#0d1117}.code-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 6px 14px;background:#161b22;color:#8b949e;font:12px "JetBrains Mono",monospace}
.copy{border:1px solid #30363d;background:#21262d;color:#e6edf3;border-radius:6px;padding:4px 10px;font:12px Inter;cursor:pointer}
.code pre{margin:0;padding:16px;overflow-x:auto;color:#e6edf3;font:14px/1.6 "JetBrains Mono",monospace}
.hljs-keyword,.hljs-built_in{color:#ff7b72}.hljs-string{color:#a5d6ff}.hljs-title,.hljs-title\\.function_{color:#d2a8ff}.hljs-comment{color:#8b949e}.hljs-number,.hljs-literal{color:#79c0ff}.hljs-meta,.hljs-attr{color:#ffa657}
.callout{display:block;margin:18px 0;padding:12px 16px;border-radius:10px;background:var(--code);border-left:4px solid var(--ink)}.callout-warning{border-color:var(--red)}.callout-tip{border-color:#1f9d55}.callout-label{display:block;font-size:13px}.callout p{margin:4px 0 0}
.by{color:var(--mute);font-size:14px;margin-top:32px}@media print{.nav,.rail{display:none}.page{-webkit-print-color-adjust:exact;print-color-adjust:exact}}.made{justify-self:center;display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-decoration:none;font-size:14px;white-space:nowrap}.made:hover{border-color:var(--ink)}.made .logo{width:22px;height:22px}.made-by{color:var(--mute)}.made-name{font:800 16px "Inter Tight",Inter,sans-serif}
.nav{position:fixed;inset:auto 0 0 0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:12px max(4vw,16px);background:var(--page);border-top:1px solid var(--line);z-index:5}#prev{justify-self:start;white-space:nowrap}#next{justify-self:end;white-space:nowrap}@media(max-width:360px){.made-name{display:none}.made{padding:9px}.nav button{font-size:14px;padding:0 10px}}
button{font:600 15px Inter;cursor:pointer}.nav button,.acts button{min-height:46px;padding:0 22px;border-radius:12px;border:2px solid var(--ink);background:none;color:var(--ink)}
.next{background:var(--ink)!important;color:var(--page)!important}.next.fin{background:var(--red)!important;border-color:var(--red)!important;color:#fff!important}button:disabled{opacity:.35}
.scrim{position:fixed;inset:0;display:none;place-items:center;padding:16px;background:#0b0d0fb3;z-index:9}.scrim.show{display:grid}
.card{width:min(440px,100%);background:var(--page);border-radius:20px;padding:32px;text-align:center}.card h2{font-size:32px;margin:12px 0 8px}.card p{margin:4px 0}.mute{color:var(--mute)}.acts{display:flex;gap:10px;justify-content:center;margin-top:20px}
#fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10}
.top{padding-top:max(14px,env(safe-area-inset-top))}.nav{padding-bottom:max(12px,env(safe-area-inset-bottom))}
.copyright{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:space-between;font-size:13px;color:var(--mute);margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid var(--line)}.copyright-bottom{margin:32px 0 0;padding:12px 0 0;border:0;border-top:1px solid var(--line)}.copyright a{color:var(--mute)}
.prose img{max-width:100%;height:auto;border-radius:10px}.figure{margin:20px 0}.figure figcaption,.embed figcaption,.deck-bar{font-size:13px;color:var(--mute)}
.prose table{border-collapse:collapse;display:block;overflow-x:auto;margin:0 0 16px}.prose th,.prose td{border:1px solid var(--line);padding:8px 12px;text-align:left}.prose th{background:var(--code)}
.embed{margin:20px 0}.embed .frame{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#0b0d0f}.embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.embed figcaption{display:flex;justify-content:space-between;gap:10px;margin-top:8px}.embed figcaption a{color:var(--red)}
.yt-thumb{display:block;max-width:720px;margin:20px 0;color:inherit;text-decoration:none;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--page)}.yt-frame{position:relative;display:block;aspect-ratio:16/9;background:#0b0d0f}.yt-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0}.yt-play{position:absolute;left:50%;top:50%;width:68px;height:48px;transform:translate(-50%,-50%);border-radius:14px;background:#e8251a;box-shadow:0 6px 20px #0008}.yt-play::after{content:'';position:absolute;left:27px;top:14px;border-left:19px solid #fff;border-top:10px solid transparent;border-bottom:10px solid transparent}.yt-cap{display:flex;justify-content:space-between;gap:6px 14px;flex-wrap:wrap;padding:10px 14px;font-size:14px}.yt-cap span{color:var(--red);font-weight:600}
.deck{margin:20px 0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--page);outline:none}.deck:focus-visible{box-shadow:0 0 0 3px var(--red)}.deck-stage{position:relative;aspect-ratio:16/9;background:#0b0d0f;display:grid;place-items:center}.deck-stage>img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;border-radius:0}
.deck-btn{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;border:0;background:#fffffff0;color:#0b0d0f;display:grid;place-items:center;box-shadow:0 4px 14px #0006;cursor:pointer}.deck-btn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.deck-prev{left:10px}.deck-next{right:10px}.deck-btn:disabled{opacity:0;pointer-events:none}
.deck-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;border-top:1px solid var(--line)}.deck-title{font-weight:600;color:var(--ink)}.deck-cap{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.deck-count{font-variant-numeric:tabular-nums}.deck-full{border:1px solid var(--line);background:none;color:var(--ink);border-radius:8px;min-width:36px;min-height:32px;cursor:pointer}
.deck-thumbs{display:flex;gap:6px;overflow-x:auto;padding:8px 12px 12px}.deck-thumb{flex:none;width:84px;aspect-ratio:16/9;padding:0;border:2px solid transparent;border-radius:6px;overflow:hidden;background:#0b0d0f;opacity:.55;cursor:pointer}.deck-thumb img{width:100%;height:100%;object-fit:cover;border-radius:0}.deck-thumb.on{border-color:var(--red);opacity:1}
.deck:fullscreen,.deck.deck-max{display:flex;flex-direction:column;border-radius:0;background:#0b0d0f}.deck.deck-max{position:fixed;inset:0;z-index:40;margin:0}.deck:fullscreen .deck-stage,.deck.deck-max .deck-stage{flex:1;aspect-ratio:auto}
@media(max-width:760px){.wrap{grid-template-columns:minmax(0,1fr);gap:12px;padding:14px 12px calc(100px + env(safe-area-inset-bottom))}.rail ol{position:static;display:flex;overflow-x:auto;gap:4px;scrollbar-width:none}.rail .t{display:none}.rail button{min-width:44px;min-height:44px;justify-content:center;padding:6px}.rail .on{background:none}}
@media(max-width:600px){.brand{font-size:17px}.brand .logo{width:22px;height:22px}.top{gap:2px 12px;padding-bottom:10px;position:relative;padding-right:68px}.top h1{font-size:16px;flex-basis:100%}#theme{position:absolute;right:12px;top:max(12px,env(safe-area-inset-top))}#left{font-size:12px}.page{padding:22px 18px}.page h2{font-size:28px}.code{margin:16px -6px}.code pre{font-size:13px;padding:14px}.nav{gap:8px;padding-left:12px;padding-right:12px}.nav button{min-height:50px;padding:0 14px;width:100%;white-space:nowrap}.made{padding:7px 12px;gap:6px;font-size:13px}.made-by{display:none}.made .logo{width:20px;height:20px}.made-name{font-size:15px}.acts button{flex:1}}`

const EXPORT_JS = `{
const S=[...document.querySelectorAll('.step')],$=id=>document.getElementById(id);let c=0;
const SUN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
function paintTheme(){const d=document.documentElement.dataset.theme==='dark';$('theme').innerHTML=d?SUN:MOON;$('theme').classList.toggle('is-dark',d);$('theme').setAttribute('aria-label','Switch to '+(d?'light':'dark')+' theme')}
$('theme').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;try{localStorage.setItem('steplab:theme',t)}catch(e){}paintTheme()};paintTheme();
$('rail').innerHTML=S.map((s,i)=>'<li><button data-i="'+i+'"><span class="n">'+s.dataset.badge+'</span><span class="t">'+s.dataset.title.replace(/</g,'&lt;')+'</span></button></li>').join('');
function show(i){c=Math.max(0,Math.min(i,S.length-1));S.forEach((s,j)=>s.hidden=j!==c);
[...$('rail').querySelectorAll('button')].forEach((b,j)=>{b.className=j===c?'on':j<c?'ok':'';b.firstChild.textContent=j<c?'✓':S[j].dataset.badge});
const left=S.slice(c).reduce((a,s)=>a+ +s.dataset.min,0);$('left').textContent=S[c].dataset.label+' of '+S[S.length-1].dataset.badge+(left?' · '+left+' min left':'');
$('bar').style.width=(c+1)/S.length*100+'%';$('prev').disabled=c===0;const last=c===S.length-1;$('next').textContent=last?'Finish ✓':'Next →';$('next').classList.toggle('fin',last);
history.replaceState(null,'','#step-'+(c+1));scrollTo(0,0)}
function finish(){$('done').classList.add('show');$('close').focus();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const cv=$('fx'),x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,col=['#e8251a','#0b0d0f','#d5dbe0','#ffb000','#fff'];
const P=Array.from({length:180},()=>({x:W/2,y:H*.4,vx:(Math.random()-.5)*16,vy:-Math.random()*15-4,r:Math.random()*7+4,a:Math.random()*6,c:col[Math.random()*5|0]}));let t=0;
(function f(){x.clearRect(0,0,W,H);for(const p of P){p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.a+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);x.restore()}if(++t<200)requestAnimationFrame(f);else x.clearRect(0,0,W,H)})()}
$('rail').onclick=e=>{const b=e.target.closest('button');if(b)show(+b.dataset.i)};
$('prev').onclick=()=>show(c-1);$('next').onclick=()=>c===S.length-1?finish():show(c+1);
$('close').onclick=()=>$('done').classList.remove('show');$('again').onclick=()=>{$('done').classList.remove('show');show(0)};
document.addEventListener('keydown',e=>{if($('done').classList.contains('show')){if(e.key==='Escape')$('close').click();return}if(e.target.closest&&e.target.closest('[data-deck]'))return;if(e.key==='ArrowRight')$('next').click();if(e.key==='ArrowLeft'&&c>0)show(c-1)});
document.addEventListener('click',e=>{const b=e.target.closest('.copy');if(!b)return;navigator.clipboard.writeText(b.closest('.code').querySelector('pre').innerText).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500)})});
let sx=null;document.querySelector('.page').addEventListener('touchstart',e=>{sx=e.target.closest('.code,.deck,.embed')?null:[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});
document.querySelector('.page').addEventListener('touchend',e=>{if(!sx||$('done').classList.contains('show'))return;const dx=e.changedTouches[0].clientX-sx[0],dy=e.changedTouches[0].clientY-sx[1];sx=null;if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*.6)return;if(dx<0)$('next').click();else if(c>0)show(c-1)});
const fromHash=()=>{const m=location.hash.match(/^#step-(\\d+)$/);return m?m[1]-1:null};addEventListener('hashchange',()=>{const n=fromHash();if(n!==null&&n!==c)show(n)});show(fromHash()??0);
}`
