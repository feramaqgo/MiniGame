import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:390,height:844} });
const page = await ctx.newPage();

// 1) Visita com rede pra o service worker instalar (como no uso real)
await page.goto('https://promocao.feramaq.com.br/', { waitUntil:'networkidle' });
await page.waitForTimeout(3000);
const sw = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
console.log('service workers registrados:', sw);

// 2) MODO AVIÃO
await ctx.setOffline(true);
console.log('\n--- modo aviao ligado ---');

// A página carrega offline?
try {
  await page.goto('https://promocao.feramaq.com.br/', { waitUntil:'domcontentloaded', timeout:15000 });
  const txt = await page.evaluate(() => document.body.innerText.slice(0,150).replace(/\n+/g,' | '));
  console.log('pagina carregou OFFLINE:', txt ? 'SIM' : 'NAO');
  console.log('  conteudo:', txt);
} catch (e) {
  console.log('pagina NAO carregou offline:', String(e).slice(0,80));
}

// 3) Avança até o formulário e tenta cadastrar
for (let i=0;i<6;i++){
  const b = page.locator('button', { hasText:/Próximo|Começar/i }).first();
  if (await b.count() && await b.isVisible()) { await b.click(); await page.waitForTimeout(200); } else break;
}
await page.waitForTimeout(800);
const temForm = await page.locator('input[placeholder*="Empresa"]').count();
console.log('\nformulario manual apareceu sozinho (offline):', temForm ? 'SIM' : 'NAO');

if (temForm) {
  await page.fill('input[placeholder*="nome completo"]', 'Teste Offline');
  await page.fill('input[placeholder*="Empresa"]', 'Construtora X');
  await page.fill('input[placeholder*="cargo"]', 'Engenheiro');
  await page.fill('input[placeholder*="WhatsApp"]', '(11) 91234-5678');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
  const erro = await page.evaluate(() => {
    const el = [...document.querySelectorAll('p')].find(p => /conex|erro|tente/i.test(p.textContent));
    return el ? el.textContent : null;
  });
  console.log('resultado do cadastro offline:', JSON.stringify(erro));
}
await browser.close();
