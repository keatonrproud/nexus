#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Preparing Nexus app for Google Play Store...\n");

async function checkPrerequisites() {
  console.log("📋 Checking prerequisites...");

  // Check if Android project exists
  try {
    await fs.access(path.join(__dirname, "../android"));
    console.log("✅ Android project found");
  } catch (error) {
    console.log("❌ Android project not found. Run: npx cap add android");
    process.exit(1);
  }

  // Check if build.gradle has correct version
  try {
    const buildGradle = await fs.readFile(
      path.join(__dirname, "../android/app/build.gradle"),
      "utf8",
    );
    if (buildGradle.includes("versionCode 1")) {
      console.log("✅ Version code is set");
    } else {
      console.log("⚠️  Check version code in android/app/build.gradle");
    }
  } catch (error) {
    console.log("⚠️  Could not check build.gradle");
  }

  console.log("");
}

async function buildApp() {
  console.log("🏗️  Building app for production...");

  try {
    console.log("Building React app...");
    execSync("npm run build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    console.log("Syncing with Capacitor...");
    execSync("npx cap sync android", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    console.log("✅ App built and synced successfully\n");
  } catch (error) {
    console.log("❌ Build failed:", error.message);
    process.exit(1);
  }
}

async function generateChecklist() {
  console.log("📝 Google Play Store Submission Checklist:\n");

  const checklist = [
    "🏪 Google Play Console account created ($25 fee)",
    "📱 App tested on multiple Android devices/emulators",
    "🎨 App icon created (512x512 PNG)",
    "🖼️  Feature graphic created (1024x500 PNG)",
    "📸 Screenshots taken (phone and tablet sizes)",
    "📝 App description written (short + full)",
    "🔐 Privacy policy created and hosted",
    "⭐ Content rating completed",
    "🛡️  Data safety form filled out",
    "🔑 Keystore created and backed up securely",
    "📦 Signed AAB/APK built",
    "📋 Release notes written",
    "🎯 Target audience selected (13+)",
  ];

  checklist.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });

  console.log("\n📖 Full guide: See GOOGLE_PLAY_DEPLOYMENT.md\n");
}

async function showNextSteps() {
  console.log("🎯 Next Steps:\n");
  console.log("1. Open Android Studio:");
  console.log("   npm run mobile:android\n");
  console.log("2. Build signed AAB:");
  console.log("   Build → Generate Signed Bundle/APK → Android App Bundle\n");
  console.log("3. Upload to Google Play Console:");
  console.log("   https://play.google.com/console\n");
  console.log("4. Complete store listing with assets and descriptions\n");
  console.log("5. Submit for review\n");
  console.log("🎉 Your app will be live in 1-3 days after approval!");
}

async function main() {
  try {
    await checkPrerequisites();
    await buildApp();
    await generateChecklist();
    await showNextSteps();
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

main();
