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
  console.log("URL:", page.url());

  await page.screenshot({
    path: "facebook-ads-library.png",
    fullPage: false
  });

  await browser.close();

  console.log("Test completed.");
})();
