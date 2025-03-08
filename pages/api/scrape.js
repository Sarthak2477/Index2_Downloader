import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import Tesseract from "tesseract.js";
import fs from "fs";

import { supabase } from "../../supabaseClient";
puppeteer.use(StealthPlugin());

const bucketName = "index2-documents";

async function uploadToSupabase(fileBuffer, fileName) {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(
      fileName,
      fileBuffer,
      {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
        fetch: (url, options) => fetch(url, { ...options, duplex: "half" }),
      }
    );

    if (error) {
      console.error("Supabase Upload Error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    console.log(`✅ Uploaded to Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { year, district, tahsil, village, propertyNo } = req.body;
  let downloadLinks = [];

  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log("Browser launched");

    // Load website
    await page.goto("https://freesearchigrservice.maharashtra.gov.in/", { waitUntil: "load", timeout: 100000 });
    console.log("Page loaded");
    await page.setViewport({ width: 1080, height: 1024 });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["reload", "navigate"].includes(request.resourceType())) {
        console.log("Blocked a reload/navigation request!");
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.evaluate(() => {
      window.onbeforeunload = null;
    });
    await page.waitForSelector("body", { timeout: 40000 });
    try {
      await page.waitForSelector(".btnclose", { timeout: 7000 });
      console.log("Popup found, closing");
      await page.click(".btnclose");
    } catch (err) {
      console.warn("No popup found");
    }

    console.log("Clicking Other District Search button");
    await page.click("#btnOtherdistrictSearch");

    console.log("Waiting for Year dropdown");
    await page.waitForSelector("#ddlFromYear1", { timeout: 40000 });

    const formData = { year, district, tahsil, village, propertyNo };

    console.log("Waiting for Captcha...");
    await page.waitForSelector("#imgCaptcha_new", { visible: true, timeout: 40000 });

    const captchaElement = await page.$("#imgCaptcha_new");
    if (!captchaElement) throw new Error("Captcha not found!");
    console.log("Captcha found, taking screenshot...");

    // Save CAPTCHA image
    const captchaPath = process.platform === "win32" ? "./captcha.png" : "/tmp/captcha.png";
    await captchaElement.screenshot({ path: captchaPath });

    const { data: { text } } = await Tesseract.recognize(captchaPath, "eng");
    const captchaText = text.replace(/\s/g, "").trim();
    console.log("Recognized Captcha:", captchaText);

    console.log("Filling in form after CAPTCHA...");
    await page.select("#ddlFromYear1", formData.year);
    await page.evaluate(() => {
      document.querySelector("#ddlDistrict1").style.display = "block"; // Ensure it's visible
    });
    const districtValue = await page.evaluate((districtName) => {
      const dropdown = document.querySelector("#ddlDistrict1");
      const option = Array.from(dropdown.options).find(opt => opt.innerText.includes(districtName));
      return option ? option.value : null;
    }, formData.district);

    if (!districtValue) {
      throw new Error(`District "${formData.district}" not found in the dropdown`);
    }

    console.log("Waiting for District dropdown...");
    await page.waitForSelector("#ddlDistrict1", { visible: true, timeout: 90000 });


    console.log("Selecting District...");
    await page.select("#ddlDistrict1", districtValue);
    console.log(`Selected District: ${districtValue}`)

    console.log("Waiting for Tahsil dropdown to be populated...");
    await page.waitForFunction(() => {
      const dropdown = document.querySelector("#ddltahsil");
      return dropdown && dropdown.options.length > 1; // Ensure options are loaded
    }, { timeout: 50000 });

    const tahsilValue = await page.evaluate((tahsilName) => {
      const dropdown = document.querySelector("#ddltahsil");
      if (!dropdown) return null;

      const option = Array.from(dropdown.options).find(opt =>
        opt.innerText.trim().replace(/\s+/g, " ") === tahsilName.trim().replace(/\s+/g, " ")
      );

      return option ? option.value : null;
    }, formData.tahsil);

    if (!tahsilValue) {
      console.error(`Tahsil "${formData.tahsil}" not found in the dropdown`);
      console.log("Available options:", await page.evaluate(() => {
        return Array.from(document.querySelector("#ddltahsil").options).map(opt => opt.innerText);
      }));
      throw new Error(`Tahsil "${formData.tahsil}" not found in the dropdown`);
    }

    console.log(`Selecting Tahsil: ${tahsilValue}`);
    await page.select("#ddltahsil", tahsilValue);

    console.log("Waiting for Village dropdown to be populated...");
    await page.waitForFunction(() => {
      const dropdown = document.querySelector("#ddlvillage");
      return dropdown && dropdown.options.length > 1; // Ensure options are loaded
    }, { timeout: 40000 });

    const villageValue = await page.evaluate((villageName) => {
      const dropdown = document.querySelector("#ddlvillage");
      if (!dropdown) return null;

      const option = Array.from(dropdown.options).find(opt =>
        opt.innerText.trim().replace(/\s+/g, " ") === villageName.trim().replace(/\s+/g, " ")
      );

      return option ? option.value : null;
    }, formData.village);

    if (!villageValue) {
      console.error(`Village "${formData.village}" not found in the dropdown`);
      console.log("Available options:", await page.evaluate(() => {
        return Array.from(document.querySelector("#ddlvillage").options).map(opt => opt.innerText);
      }));
      throw new Error(`Village "${formData.village}" not found in the dropdown`);
    }

    console.log(`Selecting Village: ${villageValue}`);
    await page.select("#ddlvillage", villageValue);

    console.log(`Entering Property Number: ${formData.propertyNo}`);
    await page.waitForSelector("#txtAttributeValue1", { visible: true, timeout: 10000 });

    await page.evaluate(() => {
      const input = document.querySelector("#txtAttributeValue1");
      input.removeAttribute("readonly");
      input.removeAttribute("disabled");
    });

    await page.type("#txtAttributeValue1", formData.propertyNo, { delay: 100 });

    await page.evaluate((propertyNo) => {
      const input = document.querySelector("#txtAttributeValue1");
      input.value = propertyNo;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, formData.propertyNo);

    console.log("Property Number entered successfully");

    console.log("Ensuring CAPTCHA input field is editable...");
    await page.evaluate(() => {
      const input = document.querySelector("#txtImg1");
      input.removeAttribute("readonly");
      input.removeAttribute("disabled");
    });

    console.log("Entering CAPTCHA...");
    await page.waitForSelector("#txtImg1", { visible: true, timeout: 10000 });

    await page.type("#txtImg1", captchaText, { delay: 100 });

    await page.evaluate((captchaText) => {
      const input = document.querySelector("#txtImg1");
      input.value = captchaText;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, captchaText);

    console.log("CAPTCHA entered successfully");

    console.log("Waiting for Search button");
    await page.waitForSelector("#btnSearch_RestMaha", { timeout: 90000 });
    console.log("Clicking Search button");
    await page.click("#btnSearch_RestMaha");


    await page.waitForSelector("#lblMsgCTS1", { visible: true, timeout: 90000 }).catch(() => {
      console.warn("Result element not found within timeout");
    });

    const results = await page.evaluate(() => {
      const element = document.querySelector("#lblMsgCTS1");
      return element ? element.innerText.trim() : "Fetching Index2 Files";
    });



    console.log("Waiting for table...");
    await page.waitForSelector("#RegistrationGrid", { visible: true, timeout: 120000 });

    console.log("Processing table rows...");
    let rows = await page.$$("#RegistrationGrid tbody tr");

    let processedIndexes = new Set();
    for (let i = 0; i < rows.length; i++) {
      if (processedIndexes.has(i)) continue;
      processedIndexes.add(i);
      try {
        const row = rows[i];
        const button = await row.$("td:last-child input[type='button']");

        if (button && await button.evaluate(el => el.isConnected)) {
          console.log("🔍 Clicking button in row...");

          const [newPage] = await Promise.all([
            new Promise(resolve => browser.once("targetcreated", async target => {
              const newTab = await target.page();
              resolve(newTab);
            })),
            button.click(),
          ]);

          if (!newPage) {
            console.error("❌ Failed to detect new tab.");
            continue;
          }


          console.log("📄 Converting page to PDF...");

          const pdfBuffer = await newPage.pdf({ format: "A4" });

          const fileName = `document_${Date.now()}.pdf`;
          if (!downloadLinks.includes(fileName)) {
            const uploadedUrl = await uploadToSupabase(pdfBuffer, fileName);
            if (uploadedUrl) {
              downloadLinks.push(uploadedUrl);
            }
          }


          await newPage.close();
          console.log("🔄 Returning to main page...");

          await page.bringToFront();
          console.log("🔄 Main page is now active, continuing with the next row...");

          await page.waitForSelector("#RegistrationGrid tbody tr", { visible: true, timeout: 30000 });

          const updatedRows = await page.$$("#RegistrationGrid tbody tr");
          rows = updatedRows;

        } else {
          console.error("❌ Button is detached from DOM, skipping row...");
        }
      } catch (error) {
        console.error("❌ Error processing row:", error);
      }
    }




    await browser.close();
    if (fs.existsSync(captchaPath)) fs.unlinkSync(captchaPath);

    return res.status(200).json(downloadLinks);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(200).json([]);
  }
}
