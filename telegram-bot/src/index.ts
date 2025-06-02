import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { setupCommands } from './commands';
import { setupLogger } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = setupLogger();

// Bot token should be obtained from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN must be provided in the environment variables');
  process.exit(1);
}

// Create bot instance
const bot = new Telegraf(token);

// Setup commands and handlers
setupCommands(bot);

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}`, err);
  ctx.reply('An error occurred while processing your request.');
});

// Start the bot
bot.launch()
  .then(() => {
    logger.info('Bot started successfully');
  })
  .catch((err) => {
    logger.error('Failed to start bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));