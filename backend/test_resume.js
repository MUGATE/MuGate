const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Starting Playwright test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page error: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:5173/resume-enhancer', { waitUntil: 'networkidle' });
    console.log('Navigated to Resume Enhancer');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Check what mode we are in (WelcomeView has choices)
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on welcome view.`);
    
    // Try to click "AI Enhance" button
    // Let's just click the first recognizable button that says "Enhance" or "Start"
    const enhanceBtn = await page.$('text=Enhance existing resume');
    if (enhanceBtn) {
      await enhanceBtn.click();
      console.log('Clicked Enhance existing resume');
      await page.waitForTimeout(1000);
    }
    
    // Test the builder
    await page.goto('http://localhost:5173/resume-enhancer', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const buildLocalBtn = await page.$('text=Build CV for Lebanon');
    if (buildLocalBtn) {
      await buildLocalBtn.click();
      console.log('Clicked Build CV for Lebanon');
      await page.waitForTimeout(1000);
    }

    // Enter some text in inputs to see if it crashes
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      await inputs[0].fill('Test User');
      console.log('Filled an input.');
    }
    
    // Try sending a chat message
    const chatInput = await page.$('input[placeholder*="Type a message"]');
    if (chatInput) {
      await chatInput.fill('Hello');
      await chatInput.press('Enter');
      console.log('Sent chat message. Waiting for response...');
      await page.waitForTimeout(3000); // wait for bot reply
    }

    // Try downloading
    const downloadBtn = await page.$('text=Download');
    if (downloadBtn) {
      await downloadBtn.click();
      console.log('Clicked Download button.');
      await page.waitForTimeout(1000);
    }
    
  } catch (err) {
    errors.push(`Test execution error: ${err.message}`);
  }

  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n--- BUGS FOUND ---');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\n--- NO OBVIOUS ERRORS FOUND ---');
  }
})();
