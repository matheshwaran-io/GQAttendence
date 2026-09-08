import webpush from "web-push";
import fs from "fs";
import path from "path";

function main() {
  const keys = webpush.generateVAPIDKeys();
  console.log("Generated VAPID Keys:");
  console.log("Public Key:", keys.publicKey);
  console.log("Private Key:", keys.privateKey);

  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, "utf-8");
    let updated = false;

    if (!content.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY")) {
      content += `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`;
      updated = true;
    }
    if (!content.includes("VAPID_PRIVATE_KEY")) {
      content += `\nVAPID_PRIVATE_KEY="${keys.privateKey}"`;
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(envPath, content, "utf-8");
      console.log("Successfully appended keys to .env.local");
    } else {
      console.log("VAPID keys already exist in .env.local");
    }
  } else {
    console.log(".env.local file not found, failed to write keys to environment config");
  }
}

main();
