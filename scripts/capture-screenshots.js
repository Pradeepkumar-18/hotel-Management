import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, '../UI_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching Chrome for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('1. Capturing Login Page...');
    await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    await page.screenshot({ path: path.join(outputDir, '01_login_page.png') });

    // Perform Login
    console.log('Logging in as super admin...');
    await page.type('input[type="email"]', 'test12345@gmail.com');
    await page.type('input[type="password"]', 'TestPassword@12345');
    await page.click('button[type="submit"]');

    // Wait for redirect to Dashboard or Hotels
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);

    // 2. Dashboard Page
    console.log('2. Capturing Dashboard Page...');
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(outputDir, '02_dashboard_page.png') });

    // 3. Hotels Directory Page
    console.log('3. Capturing Hotels Directory Page...');
    await page.goto('http://localhost:5173/admin/hotels', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(outputDir, '03_hotels_directory.png') });

    // 4. Hotel Create Modal
    console.log('4. Capturing Hotel Create Modal...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('Add a hotel')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    await page.screenshot({ path: path.join(outputDir, '04_hotel_create_modal.png') });

    // Close modal by clicking escape
    await page.keyboard.press('Escape');
    await sleep(500);

    // 5. Hotel Workspace Page
    console.log('5. Capturing Hotel Workspace Page...');
    const rows = await page.$$('table tbody tr');
    let firstHotelId = '';
    if (rows.length > 0) {
      // Find "Manage" or row click
      await rows[0].click();
      await sleep(1500);
      await page.screenshot({ path: path.join(outputDir, '05_hotel_workspace.png') });

      // Close workspace modal
      await page.keyboard.press('Escape');
      await sleep(800);
    }

    // Fetch hotels and rooms to get sample IDs for deep URLs
    const hotelData = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/v1/admin/hotels?limit=5');
        const json = await res.json();
        const first = json.items?.[0] || json[0];
        if (!first) return null;
        const hotelId = first.id || first._id;
        const roomRes = await fetch(`/api/v1/admin/hotels/${hotelId}/room-types`);
        const roomJson = await roomRes.json();
        const firstRoom = roomJson?.[0];
        return {
          hotelId,
          roomId: firstRoom ? (firstRoom.id || firstRoom._id) : null,
        };
      } catch (e) {
        return null;
      }
    });

    console.log('Sample data for deep link screenshots:', hotelData);
    const hotelQuery = hotelData?.hotelId ? `?hotel=${hotelData.hotelId}` : '';
    const roomQuery = hotelData?.hotelId && hotelData?.roomId ? `?hotel=${hotelData.hotelId}&room=${hotelData.roomId}` : hotelQuery;

    // 6. Room Types Page
    console.log('6. Capturing Room Types Page...');
    await page.goto(`http://localhost:5173/admin/room-types${hotelQuery}`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(outputDir, '06_room_types_page.png') });

    // 7. Room Create Modal
    console.log('7. Capturing Room Create Modal...');
    const addRoomButtons = await page.$$('button');
    for (const btn of addRoomButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('Add room type')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);
    await page.screenshot({ path: path.join(outputDir, '07_room_create_modal.png') });

    // Close room modal
    await page.keyboard.press('Escape');
    await sleep(500);

    // 8. Base Rates Page
    console.log('8. Capturing Base Rates Page...');
    await page.goto(`http://localhost:5173/admin/rates${roomQuery}`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(outputDir, '08_base_rates_page.png') });

    // 9. Inventory Page
    console.log('9. Capturing Inventory Page...');
    await page.goto(`http://localhost:5173/admin/inventory${roomQuery}`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(outputDir, '09_inventory_calendar.png') });

    // 10. Inventory Adjust Modal
    console.log('10. Capturing Inventory Adjust Modal...');
    const adjustButtons = await page.$$('button');
    let adjustClicked = false;
    for (const btn of adjustButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes('Adjust') || text.includes('Block') || text.includes('Adjustment') || text.includes('Change'))) {
        await btn.click();
        adjustClicked = true;
        break;
      }
    }
    if (adjustClicked) {
      await sleep(1000);
      await page.screenshot({ path: path.join(outputDir, '10_inventory_adjust_modal.png') });
    }

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
