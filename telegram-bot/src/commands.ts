import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/types';
import { logger } from './utils/logger';

/**
 * Setup bot commands
 * @param bot Telegraf bot instance
 */
export function setupCommands(bot: Telegraf): void {
  // Register command handlers
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('status', handleStatus);
  
  // Set up middleware
  bot.use(loggerMiddleware);
  
  // Handle text messages
  bot.on('text', handleTextMessage);
}

/**
 * Logger middleware to log all updates
 */
async function loggerMiddleware(ctx: Context, next: () => Promise<void>): Promise<void> {
  const start = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username || 'unknown';
  
  logger.info(`Processing update from user ${userId} (@${username})`);
  
  await next();
  
  const ms = Date.now() - start;
  logger.info(`Response time: ${ms}ms`);
}

/**
 * Handle /start command
 */
async function handleStart(ctx: Context): Promise<void> {
  const name = ctx.from?.first_name || 'there';
  await ctx.reply(`Hello ${name}! Welcome to Visa Run Bot. Use /help to see available commands.`);
}

/**
 * Handle /help command
 */
async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(`
Available commands:
/start - Start the bot
/help - Show this help message
/status - Check visa run status
  `);
}

/**
 * Handle /status command
 */
async function handleStatus(ctx: Context): Promise<void> {
  // In a real application, you would fetch the actual status from your database
  await ctx.reply('Your visa status: Valid for 30 more days');
}

/**
 * Handle text messages
 */
async function handleTextMessage(ctx: Context): Promise<void> {
  // Check if message exists and is a text message
  if (!ctx.message || !('text' in ctx.message)) return;
  
  const text = (ctx.message as Message.TextMessage).text;
  
  if (text.toLowerCase().includes('visa')) {
    await ctx.reply('To check your visa status, use the /status command.');
  } else {
    await ctx.reply('I didn\'t understand that. Type /help to see available commands.');
  }
}