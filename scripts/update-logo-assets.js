#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const mobileRequire = createRequire(path.resolve(__dirname, '..', 'mobile', 'package.json'));
const sharp = mobileRequire('sharp');

const projectRoot = path.resolve(__dirname, '..', 'mobile');
const assetsDir = path.join(projectRoot, 'assets');
const svgPath = path.join(assetsDir, 'kivo-logo-symbol-pulse.svg');

const outputs = [
  { filename: 'icon.png', size: 512, background: '#0C1A2A', scale: 0.76 },
  { filename: 'adaptive-icon.png', size: 512, background: '#0C1A2A', scale: 0.76 },
  { filename: 'splash-icon.png', size: 512, background: '#0C1A2A', scale: 0.7 },
  { filename: 'favicon.png', size: 192, background: '#0C1A2A', scale: 0.74 },
];

async function ensureSvg() {
  try {
    await fs.access(svgPath);
  } catch (error) {
    throw new Error(`Logo SVG not found at ${svgPath}`);
  }
}

async function createAsset({ filename, size, background, scale }) {
  const svgBuffer = await fs.readFile(svgPath);
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  });

  const logoBuffer = await sharp(svgBuffer)
    .resize(Math.floor(size * scale), Math.floor(size * scale), {
      fit: 'contain',
      withoutEnlargement: true,
    })
    .toBuffer();

  const outputPath = path.join(assetsDir, filename);
  await base
    .composite([
      {
        input: logoBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(outputPath);

  // eslint-disable-next-line no-console
  console.log(`Updated ${filename}`);
}

async function main() {
  await ensureSvg();
  await Promise.all(outputs.map(createAsset));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
