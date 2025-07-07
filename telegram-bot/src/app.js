import TelegramBot from "node-telegram-bot-api";
import { api } from "../lib/trpc.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

// Check for required environment variables
if (!token) {
  console.error(
    "ERROR: TELEGRAM_BOT_TOKEN is not set in environment variables",
  );
  process.exit(1);
}

if (!process.env.BACKEND_URL) {
  console.warn("WARNING: BACKEND_URL is not set, using default localhost URL");
}

// Flag to track backend connectivity status
let backendConnected = false;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message.
bot.on("my_chat_member", async (update) => {
  try {
    const chat = update.chat;

    const oldStatus = update.old_chat_member.status; // e.g. 'left', 'kicked', 'member', 'administrator'
    const newStatus = update.new_chat_member.status;

    // e.g. 'left', 'kicked', 'member', 'administrator'
    const inviter = update.from ? `${update.from.username}`.trim() : "unknown";

    // 4. Фильтруем только каналы и группы
    if (chat.type === "channel" || chat.type === "group") {
      console.log(update);
      // 5. Сценарий: бот только что добавлен (или приглашён) в канал
      const wasLeft = oldStatus === "left" || oldStatus === "kicked";
      const becameMember =
        newStatus === "administrator" || newStatus === "member";

      if (wasLeft && becameMember) {
        console.log(
          `Bot was added to channel "${chat.title}" (ID ${chat.id}). Invited by: ${inviter}.`,
        );

        // Log the channel join to backend and update status to "active"
        await api.telegramChannel
          .channelJoin(update)
          .then((result) => {
            console.log(
              `Channel "${chat.title}" status set to active in database:`,
              result,
            );
          })
          .catch((err) => {
            console.error("Error logging channel join to backend:", err);
          });

        bot.sendChatAction(chat.id, "typing");

        bot.sendMessage(chat.id, `Hello everyone!`).catch((err) => {
          console.error("Error while sending message:", err.message);
        });
      }

      // 6. Сценарий: бот удалён из канала
      const wasMember = oldStatus === "administrator" || oldStatus === "member";
      const becameLeft = newStatus === "left" || newStatus === "kicked";

      if (wasMember && becameLeft) {
        console.log(
          `Bot was removed from channel "${chat.title}" (ID ${chat.id}).`,
        );

        // Log the channel leave to backend and update status to "removed"
        api.telegramChannel
          .channelLeave({
            chatId: chat.id.toString(),
          })
          .then((result) => {
            console.log(
              `Channel "${chat.title}" status set to removed in database:`,
              result,
            );
          })
          .catch((err) => {
            console.error("Error logging channel leave to backend:", err);
          });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// Add message handler for commands
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;

    // Handle /start command
    if (msg.text === "/start") {
      bot.sendMessage(
        chatId,
        "Welcome to VisaRun Bot! I'll help you with visa information.",
      );
    }

    // Handle /debug command - detailed backend diagnostics
    if (msg.text === "/debug") {
      try {
        bot.sendMessage(chatId, "🔍 Running backend diagnostics...");

        // Test basic connection
        const connectionStatus = await api.testConnection();
        let debugMsg = `Backend Connection:\n${connectionStatus.connected ? "✅" : "❌"} ${process.env.BACKEND_URL}\n`;

        if (connectionStatus.serverTime) {
          debugMsg += `Server time: ${connectionStatus.serverTime}\n`;
        }

        if (connectionStatus.error) {
          debugMsg += `Error: ${connectionStatus.error}\n`;
          debugMsg += `Details: ${connectionStatus.details || "none"}\n`;
        }

        // Try to fetch exchange rates as a data test
        try {
          const exchangeRate = await api.exchangeRates.getLatest();
          if (exchangeRate) {
            debugMsg += "\n✅ Exchange rates API: Available";
            debugMsg += `\nLast updated: ${new Date(exchangeRate.createdAt).toLocaleString()}`;
          } else {
            debugMsg +=
              "\n⚠️ Exchange rates API: Responds but no data available";
          }
        } catch (err) {
          debugMsg += `\n❌ Exchange rates API: Error (${err.message})`;
        }

        // Environment information
        debugMsg += "\n\nEnvironment:";
        debugMsg += `\nNode: ${process.version}`;
        debugMsg += `\nEnvironment: ${process.env.NODE_ENV || "not set"}`;

        bot.sendMessage(chatId, debugMsg);
      } catch (error) {
        console.error("Error in debug command:", error);
        bot.sendMessage(chatId, `Error running diagnostics: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
});

bot.on("polling_error", (error) => {
  console.error("Error polling:", error.code, error.response?.body);
});

// Check backend connection status
async function checkBackendConnection() {
  try {
    // Use the test connection helper
    const result = await api.testConnection();

    // Update the global connection status
    backendConnected = result.connected;

    if (result.connected) {
      console.log(
        "✅ Successfully connected to backend at:",
        process.env.BACKEND_URL,
      );
    } else {
      console.error(
        `❌ Failed to connect to backend: ${result.error} (${result.details})`,
      );
      console.log(
        "The bot will continue running, but backend-dependent features may not work.",
      );
    }

    return result;
  } catch (error) {
    backendConnected = false;
    console.error("❌ Failed to connect to backend:", error.message);
    console.log(
      "The bot will continue running, but backend-dependent features may not work.",
    );
    return { connected: false, error: error.message };
  }
}

// Periodically check backend connection
function startConnectionMonitor() {
  // Check connection every 30 seconds
  const interval = 30 * 1000;

  setInterval(async () => {
    try {
      const status = await checkBackendConnection();

      // If connection was restored after being down, log it
      if (status.connected && !backendConnected) {
        console.log(
          "🔄 Backend connection restored at:",
          new Date().toISOString(),
        );
      }
      // If connection was lost after being up, log it
      else if (!status.connected && backendConnected) {
        console.error(
          "📴 Backend connection lost at:",
          new Date().toISOString(),
        );
      }

      backendConnected = status.connected;
    } catch (error) {
      backendConnected = false;
      console.error("📴 Backend connection check failed:", error.message);
    }
  }, interval);
}

// Log startup
console.log(
  "🤖 Telegram bot started. Connecting to backend at:",
  process.env.BACKEND_URL,
);
console.log("📋 Available commands:");
console.log("  /start - Welcome message");
console.log("  /debug - Show detailed backend diagnostics");

checkBackendConnection().then(() => {
  // Start the connection monitor
  startConnectionMonitor();
  console.log("🔄 Backend connection monitoring enabled");
});
