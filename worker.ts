/**
 * SOZOFITNESS Reminder Worker
 * Processes appointment reminders using pg-boss
 *
 * Run with: npm run worker
 */

import { NotificationService } from "./lib/services/notification-service";

async function main() {
  console.log("🚀 Starting SOZOFITNESS reminder worker...");

  // Process due notifications every 60 seconds
  setInterval(async () => {
    try {
      await NotificationService.processDueNotifications();
    } catch (error) {
      console.error("Error processing notifications:", error);
    }
  }, 60 * 1000);

  // Also process immediately on startup
  try {
    await NotificationService.processDueNotifications();
  } catch (error) {
    console.error("Error processing notifications:", error);
  }

  console.log("✅ Worker started successfully");
  console.log("📬 Processing reminders every 60 seconds...");
  console.log("⏸️  Press Ctrl+C to stop");
}

main().catch((error) => {
  console.error("❌ Worker failed to start:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down worker...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down worker...");
  process.exit(0);
});
