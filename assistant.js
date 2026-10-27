/* Assistant MINZOTO Lab : répond aux visiteurs avec les vraies informations du site (Gemini via Firebase AI Logic). */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

const CFG = {
  WHATSAPP: "243835263914",
  MPESA: "0835263914",
  ORANGE: "0848062761",
  SITE: "https://minzotolab.github.io/",
  MODELS: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"],
  MAX_MSGS: 20,
  MAX_CHARS: 500,
  COOLDOWN: 3000
};

const app = initializeApp({
  apiKey: "AIzaSyDLruZVIQKBQQS6fKW2ZNnCZReJEO5x04k",
  authDomain: "minzoto-lab.firebaseapp.com",
  projectId: "minzoto-lab",
  storageBucket: "minzoto-lab.firebasestorage.app",
  messagingSenderId: "591899158602",
  appId: "1:591899158602:web:01677073ff278ab21e9eb3"
}, "assistant");

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function md(t) {
  let h = esc(t);
  h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  h = h.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return h.replace(/^\s*[-*]\s+/gm, "• ").replace(/\n/g, "<br>");
}

const css = document.createElement("style");
css.textContent = `
#mzaFab{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:45;border:0;border-radius:999px;background:#171717;color:#ffdd12;font:inherit;font-weight:800;font-size:14px;padding:12px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}
#mzaFab span.st{font-size:18px;line-height:1}
#mzaBox{position:fixed;inset:auto 10px calc(10px + env(safe-area-inset-bottom,0px)) 10px;max-width:420px;height:min(78vh,620px);z-index:10002;background:#fff;color:#171717;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.4);display:flex;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif}
#mzaBox.hidden,#mzaFab.hidden{display:none!important}
#mzaHead{background:#171717;color:#ffdd12;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;font-weight:800}
#mzaHead small{display:block;color:#ccc;font-weight:400;font-size:12px}
#mzaX{border:0;background:none;color:#fff;font-size:26px;line-height:1;cursor:pointer}
#mzaMsgs{flex:1;overflow:auto;padding:12px;background:#faf9f6;display:flex;flex-direction:column;gap:9px}
.mzaM{max-width:88%;padding:10px 12px;border-radius:14px;font-size:15px;line-height:1.5;word-wrap:break-word}
.mzaM.b{background:#fff;border:1px solid #eee;align-self:flex-start}
.mzaM.u{background:#ffdd12;align-self:flex-end}
.mzaM a{color:#8a6a00}
#mzaChips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#faf9f6}
#mzaChips button{border:1px solid #ddd;background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;cursor:pointer}
#mzaForm{display:flex;gap:8px;padding:10px;border-top:1px solid #eee;background:#fff}
#mzaIn{flex:1;border:1px solid #ccc;border-radius:12px;padding:11px;font:inherit;font-size:16px;min-width:0}
#mzaSend{border:0;border-radius:12px;background:#171717;color:#ffdd12;font:inherit;font-weight:800;padding:0 16px;cursor:pointer}
#mzaSend:disabled{opacity:.5}
@media(min-width:600px){#mzaBox{left:14px;right:auto;width:400px}}
`;
document.head.appendChild(css);

const fab = document.createElement("button");
fab.id = "mzaFab"; fab.type = "button";
fab.innerHTML = '<span class="st">✦</span><span>Poser une question</span>';
const box = document.createElement("div");
box.id = "mzaBox"; box.className = "hidden";
box.innerHTML = '<div id="mzaHead"><div>Assistant MINZOTO Lab<small>Réponses sur nos services, tarifs et paiement</small></div><button id="mzaX" type="button" aria-label="Fermer">×</button></div>'
  + '<div id="mzaMsgs"></div><div id="mzaChips"></div>'
  + '<form id="mzaForm"><input id="mzaIn" type="text" maxlength="' + CFG.MAX_CHARS + '" placeholder="Écris ta question…" autocomplete="off"><button id="mzaSend" type="submit">Envoyer</button></form>';
document.body.appendChild(fab);
document.body.appendChild(box);
const $ = id => document.getElementById(id);

function add(role, html) {
  const d = document.createElement("div");
  d.className = "mzaM " + role; d.innerHTML = html;
  $("mzaMsgs").appendChild(d); $("mzaMsgs").scrollTop = $("mzaMsgs").scrollHeight;
  return d;
}

function siteKnowledge() {
  const cards = sel => Array.from(document.querySelectorAll(sel)).map(e => e.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);
  const services = cards("#serviceGrid .card");
  const promos = cards("#promoGrid .card");
  const projects = cards("#projectGrid .card").slice(0, 12);
  const main = document.querySelector("main");
  const page = main ? main.innerText.replace(/\n{2,}/g, "\n").slice(0, 3500) : "";
  return "SERVICES ET TARIFS AFFICHÉS SUR LE SITE :\n" + (services.join("\n") || "(non chargés)")
    + "\n\nOFFRES ET PROMOTIONS EN COURS :\n" + (promos.join("\n") || "Aucune promotion affichée pour le moment.")
    + "\n\nQUELQUES RÉALISATIONS :\n" + (projects.join("\n") || "(voir la section Travaux du site)")
    + "\n\nTEXTE DU SITE :\n" + page;
}
function systemPrompt() {
  return "Tu es l'assistant officiel de MINZOTO Lab, un studio créatif de RDC (logos, affiches, portraits numériques, retouche photo, identités visuelles). "
    + "Ta mission : renseigner les visiteurs de façon concrète, courte et exacte, en français par défaut (réponds dans la langue de la personne). "
    + "Base-toi UNIQUEMENT sur les informations ci-dessous. N'invente jamais un prix, un délai, une promotion, un contact ou une garantie : si l'information manque, dis-le et invite à écrire sur WhatsApp. "
    + "Contact WhatsApp : +" + CFG.WHATSAPP + " (lien : https://wa.me/" + CFG.WHATSAPP + "). Site : " + CFG.SITE + ". "
    + "Comment demander un devis : remplir le formulaire « Devis » sur la page d'accueil (nom, WhatsApp, service, message), la réponse arrive sur WhatsApp. "
    + "Comment commander une offre : toucher « Commander » sur l'offre, remplir son nom et son WhatsApp ; ensuite le site affiche comment payer. "
    + "Paiement Mobile Money : M-Pesa " + CFG.MPESA + " ou Orange Money " + CFG.ORANGE + ". Le client envoie le montant, puis touche « J'ai payé » pour envoyer la preuve (avec la référence de la transaction) sur WhatsApp. MINZOTO Lab confirme ensuite le paiement. Ne dis jamais qu'un paiement est confirmé automatiquement. "
    + "Devenir membre : gratuit, via la section « Membre » du site, pour être prévenu des nouveautés. "
    + "Si on te pose une question générale sans rapport avec MINZOTO Lab, réponds très brièvement puis ramène vers les services du studio ; refuse poliment ce qui est dangereux ou illégal. "
    + "Style : chaleureux, très concis (3 à 5 phrases maximum), listes courtes seulement si utile.\n\n"
    + siteKnowledge();
}

let aiMod = null, aiInst = null, modelName = null;
try { modelName = localStorage.getItem("mza_model") || null; } catch (e) {}
async function warm() {
  try {
    if (!aiMod) aiMod = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-ai.js");
    if (!aiInst) aiInst = aiMod.getAI(app, { backend: new aiMod.GoogleAIBackend() });
  } catch (e) {}
}
window.addEventListener("load", () => setTimeout(warm, 1200));
const history = [];
let sent = 0, last = 0, busy = false;

async function ask(question, el) {
  await warm();
  const names = modelName ? [modelName].concat(CFG.MODELS.filter(m => m !== modelName)) : CFG.MODELS;
  let lastErr = null;
  for (const name of names) {
    try {
      const model = aiMod.getGenerativeModel(aiInst, {
        model: name, systemInstruction: systemPrompt(),
        generationConfig: Object.assign({ temperature: 0.3, maxOutputTokens: 450 }, /2\.5/.test(name) ? { thinkingConfig: { thinkingBudget: 0 } } : {})
      });
      const res = await model.generateContentStream({ contents: history.concat([{ role: "user", parts: [{ text: question }] }]) });
      let acc = "";
      for await (const ch of res.stream) { acc += ch.text(); el.innerHTML = md(acc); $("mzaMsgs").scrollTop = $("mzaMsgs").scrollHeight; }
      modelName = name;
      try { localStorage.setItem("mza_model", name); } catch (e) {}
      return acc;
    } catch (e) {
      lastErr = e;
      if (modelName === name) { modelName = null; try { localStorage.removeItem("mza_model"); } catch (x) {} }
      if (!/not.?found|404|not supported|unsupported|invalid model/i.test(String((e && e.message) || e))) throw e;
    }
  }
  throw lastErr;
}
function friendly(e) {
  const m = String((e && (e.message || e.code)) || e || "");
  if (/\b429\b|quota|resource.?exhausted|rate.?limit|too many/i.test(m)) return "Je suis très sollicité en ce moment. Réessaie dans une minute, ou écris-nous sur WhatsApp.";
  if (/network|failed to fetch|offline/i.test(m)) return "Pas de connexion internet. Vérifie ton réseau puis réessaie.";
  return "Je ne peux pas répondre pour le moment. Écris-nous directement sur WhatsApp : https://wa.me/" + CFG.WHATSAPP;
}
async function send(text) {
  text = String(text || "").trim().slice(0, CFG.MAX_CHARS);
  if (!text || busy) return;
  if (sent >= CFG.MAX_MSGS) { add("b", md("Tu as atteint la limite de questions pour cette visite. Pour la suite, écris-nous sur WhatsApp : https://wa.me/" + CFG.WHATSAPP)); return; }
  if (Date.now() - last < CFG.COOLDOWN) { add("b", "Un instant, laisse-moi finir la réponse précédente."); return; }
  busy = true; last = Date.now(); sent++; $("mzaSend").disabled = true; $("mzaChips").style.display = "none";
  add("u", esc(text)); $("mzaIn").value = "";
  const el = add("b", "…");
  try {
    const out = await ask(text, el);
    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: out }] });
    if (history.length > 12) history.splice(0, 2);
  } catch (e) { el.innerHTML = md(friendly(e)); }
  busy = false; $("mzaSend").disabled = false;
}

fab.addEventListener("click", () => {
  box.classList.remove("hidden"); fab.classList.add("hidden");
  if (!$("mzaMsgs").children.length) {
    add("b", "Bonjour ! Je réponds à tes questions sur MINZOTO Lab : services, tarifs, promotions, devis et paiement. Que veux-tu savoir ?");
    ["Quels sont vos tarifs ?", "Comment commander ?", "Comment payer ?", "Quelles promotions ?"].forEach(q => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = q;
      b.addEventListener("click", () => send(q)); $("mzaChips").appendChild(b);
    });
  }
  setTimeout(() => $("mzaIn").focus(), 60);
});
$("mzaX").addEventListener("click", () => { box.classList.add("hidden"); fab.classList.remove("hidden"); });
$("mzaForm").addEventListener("submit", e => { e.preventDefault(); send($("mzaIn").value); });
