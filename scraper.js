const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

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

  const uniqueImages = [];
  const seen = new Set();

  for (const image of images) {
    if (!seen.has(image.src)) {
      seen.add(image.src);
      uniqueImages.push(image);
    }
  }

  console.log("================================");
  console.log("Images to download:", uniqueImages.length);
  console.log("================================");

  const outputDir = path.join(process.cwd(), "images");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < uniqueImages.length; i++) {
    const image = uniqueImages[i];

    try {
      const response = await page.request.get(image.src, {
        timeout: 30000
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}`);
      }

      const buffer = await response.body();

      const contentType =
        response.headers()["content-type"] || "";

      let extension = ".jpg";

      if (contentType.includes("png")) {
        extension = ".png";
      } else if (contentType.includes("webp")) {
        extension = ".webp";
      } else if (contentType.includes("gif")) {
        extension = ".gif";
      }

      const filename =
        `ad-${String(i + 1).padStart(3, "0")}${extension}`;

      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, buffer);

      downloaded++;

      console.log(
        `DOWNLOADED ${downloaded}: ${filename} | ${image.width}x${image.height}`
      );

    } catch (error) {
      failed++;

      console.log(
        `FAILED ${i + 1}: ${error.message}`
      );
    }
  }

  console.log("================================");
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log("================================");

  await page.screenshot({
    path: "facebook-ads-library.png",
    fullPage: false
  });

  await browser.close();

  console.log("Test completed.");
})();
