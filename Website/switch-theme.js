#!/usr/bin/env node

/**
 * Theme Switcher Script
 * 
 * Usage:
 *   node switch-theme.js orange
 *   node switch-theme.js indigo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVAILABLE_THEMES = {
  monochrome: {
    name: 'Slate - Professional Minimalism (Default)',
    description: 'Clean black, white, and grey theme',
    primary: '#404040',
  },
  orange: {
    name: 'Ember - Warm & Energetic',
    description: 'Vibrant orange theme with warm tones',
    primary: '#FF914D',
  },
  indigo: {
    name: 'Cosmic - Futuristic AI',
    description: 'Modern purple/indigo theme inspired by AI products',
    primary: '#635bff',
  },
  green: {
    name: 'Forest - Fresh & Natural',
    description: 'Calm emerald green theme with natural tones',
    primary: '#10b981',
  },
};

const theme = process.argv[2];

if (!theme) {
  console.log('\n🎨 Theme Switcher for Cognivo\n');
  console.log('Available themes:');
  Object.entries(AVAILABLE_THEMES).forEach(([key, value]) => {
    console.log(`  • ${key.padEnd(10)} - ${value.name}`);
    console.log(`    ${value.description}`);
    console.log(`    Primary color: ${value.primary}\n`);
  });
  console.log('Usage:');
  console.log('  node switch-theme.js <theme-name>');
  console.log('\nExample:');
  console.log('  node switch-theme.js orange');
  console.log('  node switch-theme.js indigo\n');
  process.exit(0);
}

if (!AVAILABLE_THEMES[theme]) {
  console.error(`\n❌ Error: Unknown theme "${theme}"`);
  console.log(`\nAvailable themes: ${Object.keys(AVAILABLE_THEMES).join(', ')}\n`);
  process.exit(1);
}

// Read or create .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch (err) {
  // File doesn't exist, create it
  console.log('📝 Creating .env file...');
}

// Update or add VITE_THEME
const lines = envContent.split('\n');
let themeLineIndex = lines.findIndex(line => line.trim().startsWith('VITE_THEME='));

if (themeLineIndex >= 0) {
  lines[themeLineIndex] = `VITE_THEME=${theme}`;
} else {
  // Add theme configuration section
  if (envContent && !envContent.endsWith('\n')) {
    lines.push('');
  }
  lines.push('# Theme Configuration');
  lines.push(`VITE_THEME=${theme}`);
}

// Write back to .env
fs.writeFileSync(envPath, lines.join('\n'));

const selectedTheme = AVAILABLE_THEMES[theme];
console.log('\n✅ Theme updated successfully!\n');
console.log(`   Theme: ${selectedTheme.name}`);
console.log(`   Description: ${selectedTheme.description}`);
console.log(`   Primary Color: ${selectedTheme.primary}\n`);
console.log('⚠️  Important: You need to restart your development server for changes to take effect.\n');
console.log('   Run: npm run dev\n');

