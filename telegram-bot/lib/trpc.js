import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

// Define the backend URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Maximum number of retries for connecting to the backend
const MAX_RETRIES = 3;
// Delay between retries in milliseconds (starts at 1000ms and increases)
const INITIAL_RETRY_DELAY = 1000;

// Create the tRPC client
export const trpc = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: BACKEND_URL,
      fetch: async (url, options) => {
        let retries = 0;
        let lastError;

        while (retries < MAX_RETRIES) {
          try {
            return await fetch(url, options);
          } catch (err) {
            lastError = err;
            console.warn(
              `Connection attempt ${retries + 1}/${MAX_RETRIES} failed: ${err.message}`,
            );

            // Exponential backoff
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
          }
        }

        // If we've exhausted all retries, throw the last error
        console.error(
          `Failed to connect to backend after ${MAX_RETRIES} attempts`,
        );
        throw lastError;
      },
      // Add headers like authorization if needed
      headers: () => {
        return {
          // Identify this bot to the backend
          "X-Telegram-Bot-Id": process.env.TELEGRAM_BOT_USERNAME || "",
        };
      },
    }),
  ],
});

// Export helper functions for common API calls
export const api = {
  // Auth
  signin: async (email, password) => {
    try {
      return await trpc.signin.mutate({ email, password });
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      return await trpc.refreshToken.mutation({ refreshToken });
    } catch (error) {
      console.error("Refresh token error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      return await trpc.logout.mutation();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Users
  getAllUsers: async () => {
    try {
      return await trpc.getAllUsers.query();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getUser: async (userId) => {
    try {
      return await trpc.user.getOne.query({ id: userId });
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  // Exchange Rates
  exchangeRates: {
    getLatest: async () => {
      try {
        const response = await trpc.exchangeRates.getLatestExchangeRate.query();
        // The response has an exchangeRate property which contains the actual data
        console.log("Exchange rates response received:", response);

        // Check if the response and exchangeRate property exist
        if (!response) {
          console.warn("Received empty response from exchange rates endpoint");
          return null;
        }

        if (!response.exchangeRate) {
          console.warn(
            "Exchange rates data is null (no rates available in the system)",
          );
          return null;
        }

        return response.exchangeRate; // Return the inner exchangeRate object
      } catch (error) {
        // More user-friendly error message
        if (error.cause && error.cause.code === "ECONNREFUSED") {
          console.error(
            `Error connecting to backend at ${BACKEND_URL}. Is the server running?`,
          );
        } else {
          console.error("Error fetching latest exchange rates:", error);
        }
        throw error;
      }
    },
    broadcastExchangeRates: async (options = {}) => {
      try {
        const response =
          await trpc.exchangeRates.broadcastExchangeRates.mutate(options);
        console.log("Exchange rates broadcast response:", response);
        return response;
      } catch (error) {
        if (error.cause && error.cause.code === "ECONNREFUSED") {
          console.error(
            `Error connecting to backend at ${BACKEND_URL}. Is the server running?`,
          );
        } else {
          console.error("Error broadcasting exchange rates:", error);
        }
        throw error;
      }
    },
  },

  // Telegram Bot specific methods for channel management
  telegramChannel: {
    channelJoin: async (data) => {
      try {
        const chat = data.chat;
        const from = data.from;

        const result = await trpc.telegramChannel.channelJoin.mutate({
          chatId: chat.id.toString(),
          chatTitle: chat.title,
          chatUsername: chat.username || "",
          chatType: chat.type,
          chatStatus: "active",
          fromId: from.id.toString(),
          fromIsBot: from.is_bot,
          fromLastName: from.last_name,
          fromFirstName: from.first_name,
          fromUsername: from.username,
        });
        console.log("Channel join recorded in database:", result);
        return result;
      } catch (error) {
        // More descriptive error message
        if (error.cause && error.cause.code === "ECONNREFUSED") {
          console.error(
            `Backend connection failed. Channel join event not recorded.`,
          );
        } else {
          console.error("Error logging channel join:", error);
        }
        // Return a failure object instead of throwing
        return { success: false, error: error.message };
      }
    },

    channelLeave: async (data) => {
      try {
        // Call the backend endpoint to record a channel leave
        const result = await trpc.telegramChannel.channelLeave.mutate({
          chatId: data.chatId,
        });
        console.log("Channel leave recorded in database:", result);
        return result;
      } catch (error) {
        // More descriptive error message
        if (error.cause && error.cause.code === "ECONNREFUSED") {
          console.error(
            `Backend connection failed. Channel leave event not recorded.`,
          );
        } else {
          console.error("Error logging channel leave:", error);
        }
        // Return a failure object instead of throwing
        return { success: false, error: error.message };
      }
    },
  },

  // Helper method to test backend connection
  testConnection: async () => {
    try {
      // Simple ping to test connection
      const response = await fetch(
        BACKEND_URL.replace("/trpc", "/trpc/health"),
      );
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      const data = await response.json();
      return {
        connected: true,
        serverTime: data.timestamp,
      };
    } catch (error) {
      console.warn(`Backend connection test failed: ${error.message}`);
      return {
        connected: false,
        error: error.message,
        details: error.cause ? error.cause.code : "unknown error",
      };
    }
  },
};
