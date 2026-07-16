const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    console.log('✅ App loaded successfully');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Login page screenshot saved');
    
    // Check for login buttons
    const candidateBtn = await page.locator('text="Candidate Portal"').isVisible();
    const adminBtn = await page.locator('text="Admin Panel"').isVisible();
    
    console.log('👤 Candidate Portal visible:', candidateBtn);
    console.log('🔐 Admin Panel visible:', adminBtn);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
