import { Telegraf, session } from 'telegraf';
import { code } from 'telegraf/format';
import { message } from 'telegraf/filters';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf(config.get('BOT_TOKEN'));

bot.use(session());

// Command to reset the session and greet the user
bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('👋');
});

// Command to reset the session and greet the user
bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('👋');
});

// Handler for voice messages
bot.on(message('voice'), async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;
  try {   
    // Show typing status while processing the message 
   await ctx.persistentChatAction('typing', async () => {
      // Get the voice file link and user ID
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    
    // Convert voice file to OGG format
    const oggPath = await ogg.create(link.href, userId);
    
    // Convert OGG file to MP3 format
    const mp3path = await ogg.toMp3(oggPath, userId);

    // Transcribe the MP3 file using OpenAI
    const text = await openai.transcription(mp3path);
    
    // Reply with the transcribed text
    await ctx.reply(code('🗣️ ' + text));

    // Save user's message in the session
    ctx.session.messages.push({ role: openai.roles.USER, content: text });

    // Get the response from OpenAI chat model
    const response = await openai.chat(ctx.session.messages);
    
    // Save assistant's message in the session
    ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });
    
    // Reply with the assistant's response
    await ctx.reply(response.content);
   }, { intervalDuration: 10000 }); // Typing interval duration set to 10 seconds
  } catch (err) {
    console.log(`error while voice message: ${err}`);
  }
});

// Handler for text messages
bot.on(message('text'), async (ctx) => {
  ctx.session = ctx.session ?? INITIAL_SESSION;
  try {
    // Show typing status while processing the message
    await ctx.persistentChatAction('typing', async () => {
      
      // Save user's message in the session
      ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

      // Get the response from OpenAI chat model
      const response = await openai.chat(ctx.session.messages);

      // Save assistant's message in the session
      ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });
      
      // Reply with the assistant's response
      await ctx.reply(response.content);
    }, { intervalDuration: 10000 }); // Typing interval duration set to 10 seconds
  } catch (err) {
    console.log(`error while text message: ${err}`);
  }
});

// Launch the bot
bot.launch();

// Gracefully stop the bot on SIGINT signal
process.once('SIGINT', () => bot.stop('SIGINT'));

// Gracefully stop the bot on SIGTERM signal
process.once('SIGTERM', () => bot.stop('SIGTERM'));
