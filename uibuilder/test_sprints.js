const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('/root/uibuilder/uibuilder.html', 'utf8');
const errors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',      // jalankan inline main script
  pretendToBeVisual: true,
  url: 'file:///root/uibuilder/uibuilder.html',
  beforeParse(window) {
    window.alert = () => {};
    window.navigator.clipboard = { writeText: async () => {} };
    // stub app global (di Android asli disediakan WebView)
    window.app = { ShowPopup: () => {}, Alert: () => {}, Start: () => {} };
    window.addEventListener('error', e => errors.push('error: ' + (e.error && e.error.stack || e.message)));
  }
});
const { window } = dom;

function runPatch(name) {
  const code = fs.readFileSync('/root/uibuilder/' + name, 'utf8');
  try { window.eval(code); } catch (e) { errors.push(name + ' threw: ' + e.message); }
}

setTimeout(() => {
  try {
    ['sprint1_patch.js','sprint2_patch.js','sprint3_patch.js'].forEach(runPatch);
    const R = [];
    const ok = (f, c) => R.push((c ? 'PASS' : 'FAIL') + ' :: ' + f);
    const ev = (s) => window.eval(s);

    ok('components defined', ev('typeof components') !== 'undefined');
    ok('canvas exists', !!window.document.getElementById('canvas'));
    ok('S1 startDragElement has guides', ev('startDragElement.toString()').includes('align-guide'));
    ok('S1 export has runtimeJS', ev('generatePureHTMLCode.toString()').includes('runtimeJS'));
    ok('S1 live preview btn', !!window.document.getElementById('livePrevBtn'));
    ok('S2 computed binding (new Function)', ev('parseExpressionBinding.toString()').includes('new Function'));
    ok('S2 undo wrapped', ev('saveHistory.toString()').includes('updateHistoryIndicator'));
    ok('S2 library sheet', !!window.document.getElementById('librarySheet'));
    ok('S3 registerPlugin', typeof window.registerPlugin === 'function');
    ok('S3 SaktiUI exported', typeof window.SaktiUI === 'object');
    ok('S3 theme apply', typeof window.applyTheme === 'function');
    ok('S3 a11y sheet', !!window.document.getElementById('a11ySheet'));

    // functional: create + reactive parse
    ev("appVariables['counter'] = 5;");
    const parsed = ev("parseExpressionBinding('Nilai {{counter * 2}}')");
    ok('computed binding -> "Nilai 10"', parsed === 'Nilai 10');

    // functional: theme
    ev("applyTheme('Light');");
    ok('theme Light sets --md-surface', window.document.documentElement.style.getPropertyValue('--md-surface') === '#ffffff');
    ev("applyTheme('Dark');");
    ok('theme Dark clears inline', window.document.documentElement.style.getPropertyValue('--md-surface') === '');

    // functional: a11y flags empty image
    ev("addElement('image');");
    ev("runA11yCheck();");
    const a11y = window.document.getElementById('a11yList').innerHTML;
    ok('a11y flags image w/o src', a11y.includes('gambar tanpa URL'));

    // functional: plugin registry + SaktiUI.createComponent
    ev("registerPlugin({id:'demo', label:'Demo', icon:'🔌', onCreate({SaktiUI}){ const c=SaktiUI.createComponent('text',{x:10,y:10}); c.props.text='hi'; }});");
    ok('plugin registered', ev("SaktiUI.pluginCreate('demo'); components.length") > 0);

    console.log('\n===== TEST RESULTS =====');
    R.forEach(r => console.log(r));
    console.log('\n===== JS ERRORS (' + errors.length + ') =====');
    errors.slice(0,15).forEach(e => console.log(e));
    const fails = R.filter(r => r.startsWith('FAIL')).length;
    console.log('\nSUMMARY: ' + (R.length - fails) + '/' + R.length + ' passed, ' + errors.length + ' js errors');
  } catch (e) { console.log('HARNESS ERROR:', e.stack); }
}, 500);
