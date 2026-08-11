async function test() {
  try {
    console.log('Importing...');
    const { AutomationEngine } = await import('./src/lib/AutomationEngine.js');
    console.log('Import success!', !!AutomationEngine);
  } catch (e) {
    console.error('Import failed:', e);
  }
}
test();
