const sharp = require('c:/work/nithbyte/app/mbyte/admin-web/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/Nithesh/.gemini/antigravity/brain/a1900cef-433c-4faf-9124-cfd6ea22e6a8/.user_uploaded/media_1795248219120_eff59db5.jpg';
const artifactDir = 'C:/Users/Nithesh/.gemini/antigravity/brain/a1900cef-433c-4faf-9124-cfd6ea22e6a8';

const adminPublic = 'c:/work/nithbyte/app/mbyte/admin-web/public';
const adminBrand = 'c:/work/nithbyte/app/mbyte/admin-web/public/brand';
const mobileAssets = 'c:/work/nithbyte/app/mbyte/mobile/assets';
const mobileBrand = 'c:/work/nithbyte/app/mbyte/mobile/assets/brand';

[adminBrand, mobileBrand].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function run() {
  console.log('Reading source logo...');
  const img = sharp(inputPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  // 1. Generate clean transparent RGBA buffer for Light mode:
  // In source, background is pure white [255, 255, 255] or near-white.
  // We remove the white background using clean alpha un-multiplying:
  // For each pixel:
  // If r,g,b all >= 248 -> Alpha = 0.
  // If pixel is orange (r high, g med, b low):
  //   alpha = (255 - b) / 255.
  //   un-multiplied color = orange.
  // If pixel is navy (r low, g low, b med/low):
  //   alpha = (255 - r) / (255 - 11).
  //   un-multiplied color = navy.
  const rgbaLight = Buffer.alloc(w * h * 4);
  const rgbaDark = Buffer.alloc(w * h * 4);

  // Exact brand colors:
  const BRAND_ORANGE = [255, 107, 0];
  const BRAND_NAVY = [11, 27, 61];
  const BRAND_WHITE = [255, 255, 255]; // for dark mode replacement of navy

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const outIdx = (y * w + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Pure background check
      if (r >= 244 && g >= 244 && b >= 244) {
        rgbaLight[outIdx] = 0;
        rgbaLight[outIdx + 1] = 0;
        rgbaLight[outIdx + 2] = 0;
        rgbaLight[outIdx + 3] = 0;

        rgbaDark[outIdx] = 0;
        rgbaDark[outIdx + 1] = 0;
        rgbaDark[outIdx + 2] = 0;
        rgbaDark[outIdx + 3] = 0;
        continue;
      }

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      let isOrange = false;
      let alpha = 255;

      if (diff > 35 && r > g && g > b) {
        // Orange element
        isOrange = true;
        // Unmultiply alpha from white:
        // Blue channel is 0 in pure orange, so distance from 255 is proportional to alpha
        alpha = Math.min(255, Math.max(0, Math.round((255 - b) * (255 / 240))));
      } else {
        // Navy element (or dark edge)
        isOrange = false;
        // Red channel is ~11 in pure navy, so distance from 255 is proportional to alpha
        alpha = Math.min(255, Math.max(0, Math.round((255 - r) * (255 / 235))));
      }

      if (alpha <= 8) {
        // Clamp tiny residual noise
        rgbaLight[outIdx] = 0;
        rgbaLight[outIdx + 1] = 0;
        rgbaLight[outIdx + 2] = 0;
        rgbaLight[outIdx + 3] = 0;

        rgbaDark[outIdx] = 0;
        rgbaDark[outIdx + 1] = 0;
        rgbaDark[outIdx + 2] = 0;
        rgbaDark[outIdx + 3] = 0;
        continue;
      }

      // Recover un-multiplied RGB:
      // P = alpha * C + (1 - alpha) * 255
      // C = (P - 255 * (1 - a)) / a
      const aNorm = alpha / 255;
      let recR = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - aNorm)) / aNorm)));
      let recG = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - aNorm)) / aNorm)));
      let recB = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - aNorm)) / aNorm)));

      // Clamp to crisp brand gamut
      if (isOrange) {
        // Light mode orange
        rgbaLight[outIdx] = recR;
        rgbaLight[outIdx + 1] = recG;
        rgbaLight[outIdx + 2] = recB;
        rgbaLight[outIdx + 3] = alpha;

        // Dark mode orange (same vibrant orange)
        rgbaDark[outIdx] = recR;
        rgbaDark[outIdx + 1] = recG;
        rgbaDark[outIdx + 2] = recB;
        rgbaDark[outIdx + 3] = alpha;
      } else {
        // Light mode navy
        rgbaLight[outIdx] = recR;
        rgbaLight[outIdx + 1] = recG;
        rgbaLight[outIdx + 2] = recB;
        rgbaLight[outIdx + 3] = alpha;

        // Dark mode: convert navy to crisp bright white/silver for high contrast!
        rgbaDark[outIdx] = 255;
        rgbaDark[outIdx + 1] = 255;
        rgbaDark[outIdx + 2] = 255;
        rgbaDark[outIdx + 3] = alpha;
      }
    }
  }

  console.log('Alpha masks created successfully.');

  // Dimensions:
  // Full lockup: x: [181, 855], y: [122, 398]
  // Emblem: x: [181, 455], y: [135, 338]
  // Compact (Emblem + Byte+): x: [181, 855], y: [122, 338]
  const fullCrop = { left: 175, top: 118, width: 860 - 175, height: 402 - 118 };
  const compactCrop = { left: 175, top: 118, width: 860 - 175, height: 342 - 118 };
  const emblemCrop = { left: 177, top: 133, width: 457 - 177, height: 340 - 133 };

  console.log('Generating variants...');

  // 1. Full Lockup Light
  const fullLightImg = sharp(rgbaLight, { raw: { width: w, height: h, channels: 4 } })
    .extract(fullCrop);
  const fullLightBuf = await fullLightImg.png().toBuffer();

  // 2. Full Lockup Dark
  const fullDarkImg = sharp(rgbaDark, { raw: { width: w, height: h, channels: 4 } })
    .extract(fullCrop);
  const fullDarkBuf = await fullDarkImg.png().toBuffer();

  // 3. Compact Lockup Light
  const compactLightImg = sharp(rgbaLight, { raw: { width: w, height: h, channels: 4 } })
    .extract(compactCrop);
  const compactLightBuf = await compactLightImg.png().toBuffer();

  // 4. Compact Lockup Dark
  const compactDarkImg = sharp(rgbaDark, { raw: { width: w, height: h, channels: 4 } })
    .extract(compactCrop);
  const compactDarkBuf = await compactDarkImg.png().toBuffer();

  // 5. Emblem (Square canvas 512x512 with centered emblem)
  const emblemLightRaw = await sharp(rgbaLight, { raw: { width: w, height: h, channels: 4 } })
    .extract(emblemCrop)
    .png()
    .toBuffer();

  const emblemDarkRaw = await sharp(rgbaDark, { raw: { width: w, height: h, channels: 4 } })
    .extract(emblemCrop)
    .png()
    .toBuffer();

  // Create square 512x512 centered emblem:
  const emblemLightSquare = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{
      input: await sharp(emblemLightRaw).resize({ width: 420, height: 420, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  const emblemDarkSquare = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{
      input: await sharp(emblemDarkRaw).resize({ width: 420, height: 420, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  // 6. App Icon (1024x1024 on Brand Navy #011126)
  const appIcon1024 = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 1, g: 17, b: 38, alpha: 1 } }
  })
    .composite([{
      input: await sharp(emblemDarkRaw).resize({ width: 680, height: 680, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  // Light App Icon (1024x1024 on White)
  const appIconLight1024 = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{
      input: await sharp(emblemLightRaw).resize({ width: 680, height: 680, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  // 7. Android Adaptive Icon Foreground (1024x1024 transparent, centered within safe circle 66%)
  const adaptiveIcon1024 = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{
      input: await sharp(emblemDarkRaw).resize({ width: 580, height: 580, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  // 8. Mobile Splash Screen (1284x2778 on Brand Navy #011126)
  const splashImg = await sharp({
    create: { width: 1284, height: 2778, channels: 4, background: { r: 1, g: 17, b: 38, alpha: 1 } }
  })
    .composite([{
      input: await sharp(fullDarkBuf).resize({ width: 720, fit: 'inside' }).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toBuffer();

  // 9. Web Favicon (256x256 transparent)
  const favicon256 = await sharp(emblemLightSquare)
    .resize(256, 256)
    .png()
    .toBuffer();

  console.log('Writing files to target directories...');

  // Map of file paths and buffers:
  const filesToWrite = [
    // Artifacts
    { dest: path.join(artifactDir, 'mediqbyte-logo-full-light.png'), data: fullLightBuf },
    { dest: path.join(artifactDir, 'mediqbyte-logo-full-dark.png'), data: fullDarkBuf },
    { dest: path.join(artifactDir, 'mediqbyte-logo-compact-light.png'), data: compactLightBuf },
    { dest: path.join(artifactDir, 'mediqbyte-logo-compact-dark.png'), data: compactDarkBuf },
    { dest: path.join(artifactDir, 'mediqbyte-emblem.png'), data: emblemLightSquare },

    // admin-web/public
    { dest: path.join(adminPublic, 'logo.png'), data: fullLightBuf },
    { dest: path.join(adminPublic, 'logo-light.png'), data: fullLightBuf },
    { dest: path.join(adminPublic, 'logo-dark.png'), data: fullDarkBuf },
    { dest: path.join(adminPublic, 'logo-compact-light.png'), data: compactLightBuf },
    { dest: path.join(adminPublic, 'logo-compact-dark.png'), data: compactDarkBuf },
    { dest: path.join(adminPublic, 'mbyte-emblem.png'), data: emblemLightSquare },
    { dest: path.join(adminPublic, 'symbol-light.png'), data: emblemLightSquare },
    { dest: path.join(adminPublic, 'symbol-dark.png'), data: emblemDarkSquare },
    { dest: path.join(adminPublic, 'icon.png'), data: appIcon1024 },
    { dest: path.join(adminPublic, 'icon-light.png'), data: appIconLight1024 },
    { dest: path.join(adminPublic, 'icon-dark.png'), data: appIcon1024 },
    { dest: path.join(adminPublic, 'favicon.png'), data: favicon256 },

    // admin-web/public/brand
    { dest: path.join(adminBrand, 'mbyte-logo-light.png'), data: fullLightBuf },
    { dest: path.join(adminBrand, 'mbyte-logo-dark.png'), data: fullDarkBuf },
    { dest: path.join(adminBrand, 'mbyte-logo-compact-light.png'), data: compactLightBuf },
    { dest: path.join(adminBrand, 'mbyte-logo-compact-dark.png'), data: compactDarkBuf },
    { dest: path.join(adminBrand, 'mbyte-emblem.png'), data: emblemLightSquare },

    // mobile/assets
    { dest: path.join(mobileAssets, 'logo.png'), data: fullLightBuf },
    { dest: path.join(mobileAssets, 'logo-light.png'), data: fullLightBuf },
    { dest: path.join(mobileAssets, 'logo-dark.png'), data: fullDarkBuf },
    { dest: path.join(mobileAssets, 'logo-compact-light.png'), data: compactLightBuf },
    { dest: path.join(mobileAssets, 'logo-compact-dark.png'), data: compactDarkBuf },
    { dest: path.join(mobileAssets, 'symbol-light.png'), data: emblemLightSquare },
    { dest: path.join(mobileAssets, 'symbol-dark.png'), data: emblemDarkSquare },
    { dest: path.join(mobileAssets, 'icon.png'), data: appIcon1024 },
    { dest: path.join(mobileAssets, 'icon-light.png'), data: appIconLight1024 },
    { dest: path.join(mobileAssets, 'icon-dark.png'), data: appIcon1024 },
    { dest: path.join(mobileAssets, 'adaptive-icon.png'), data: adaptiveIcon1024 },
    { dest: path.join(mobileAssets, 'splash.png'), data: splashImg },

    // mobile/assets/brand
    { dest: path.join(mobileBrand, 'mbyte-logo-light.png'), data: fullLightBuf },
    { dest: path.join(mobileBrand, 'mbyte-logo-dark.png'), data: fullDarkBuf },
    { dest: path.join(mobileBrand, 'mbyte-logo-compact-light.png'), data: compactLightBuf },
    { dest: path.join(mobileBrand, 'mbyte-logo-compact-dark.png'), data: compactDarkBuf },
    { dest: path.join(mobileBrand, 'mbyte-emblem.png'), data: emblemLightSquare },
  ];

  for (const item of filesToWrite) {
    fs.writeFileSync(item.dest, item.data);
    console.log(`Saved: ${item.dest} (${item.data.length} bytes)`);
  }

  console.log('ALL BRAND ASSETS PROCESSED AND DEPLOYED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Error processing assets:', err);
  process.exit(1);
});
