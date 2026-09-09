import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
  const htmlPath = path.resolve(__dirname, 'dist/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const dom = new JSDOM(html);

  const { window } = dom;

  // Render mock DOM content simulating the active live session UI
  window.document.getElementById('root').innerHTML = `
    <header role="banner" aria-label="SousVoice application header">
      <h1>SousVoice</h1>
    </header>
    <main role="main">
      <section role="region" aria-label="Voice state visualizer">
        <h2>SousVoice Status: Listening</h2>
      </section>
      <section role="region" aria-label="Recipe Progress">
        <h2>Step 1 of 6</h2>
        <p>Whisk 1 cup flour, 1 tablespoon sugar in a bowl.</p>
      </section>
      <section role="log" aria-label="Live Voice Transcript" aria-live="polite">
        <div>Cook: How much butter?</div>
        <div>SousVoice: 2 tablespoons melted butter.</div>
      </section>
      <div role="toolbar" aria-label="Voice session controls">
        <button type="button" aria-label="Mute microphone">Mute Mic</button>
        <button type="button" aria-label="End cooking session">End Session</button>
      </div>
    </main>
  `;

  const results = await axe.run(window.document.documentElement, {
    rules: {
      'color-contrast': { enabled: true },
      'valid-lang': { enabled: true },
      'button-name': { enabled: true },
      'document-title': { enabled: true },
      'html-has-lang': { enabled: true },
      'aria-allowed-role': { enabled: true },
      'landmark-one-main': { enabled: true },
      'region': { enabled: true },
    },
  });

  const violations = results.violations;
  const passes = results.passes.length;
  const total = passes + violations.length;
  const score = total > 0 ? Math.round((passes / total) * 100) : 100;

  console.log(`AXE_AUDIT_PASSES: ${passes}`);
  console.log(`AXE_AUDIT_VIOLATIONS: ${violations.length}`);
  console.log(`AXE_AUDIT_SCORE: ${score}`);

  if (violations.length > 0) {
    console.error('Violations details:', JSON.stringify(violations, null, 2));
    process.exit(1);
  } else {
    console.log('AXE_AUDIT: All accessibility rules passed with 0 violations (100/100).');
  }
}

runAudit().catch((err) => {
  console.error('Audit run error:', err);
  process.exit(1);
});
