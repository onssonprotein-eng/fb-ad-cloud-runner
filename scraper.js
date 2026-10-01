const { chromium } = require("playwright");

const ADS_URL =
  "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MY&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=296717127062813";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  console.log("Opening Facebook Ads Library...");

  await page.goto(ADS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  await page.waitForTimeout(10000);

  console.log("Page title:", await page.title());
  console.log("Current URL:", page.url());

  // Scroll to load more ads
  console.log("Scrolling to load more ads...");

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "instant"
      });
    });

    await page.waitForTimeout(3000);

    console.log(`Scroll ${i + 1}/8 completed`);
  }

  console.log("Collecting images...");

  const images = await page.locator("img").evaluateAll(imgs =>
    imgs
      .map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight
      }))
      .filter(img =>
        img.src &&
        img.src.startsWith("http") &&
        img.width >= 300 &&
        img.height >= 300
      )
  );

  // Remove duplicate URLs
  const uniqueImages = [];
  const seen = new Set();

  for (const image of images) {
    if (!seen.has(image.src)) {
      seen.add(image.src);
      uniqueImages.push(image);
    }
  }

  console.log("================================");
  console.log("Large images found:", uniqueImages.length);
  console.log("================================");

  uniqueImages.forEach((image, i) => {
    console.log(
      `IMAGE ${i + 1} | ${image.width}x${image.height} | ${image.src}`
    );
  });

  // Save screenshot for inspection
  await page.screenshot({
    path: "facebook-ads-library.png",
    fullPage: false
  });

  await browser.close();

  console.log("================================");
  console.log("Test completed.");
  console.log("================================");
})();
