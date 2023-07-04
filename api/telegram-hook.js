import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { ogg } from '../src/ogg.js';
import { openai } from '../src/openai.js';

const { BOT_TOKEN } = process.env;
const { BASE_PATH } = process.env;

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const INITIAL_SESSION = {
  messages: [],
};

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
      
      // Escape reserved characters in the response content
      const escapedContent = response.content.replace(/[\(\)!#.\-|>]/g, '\\$&');
      
      // Reply with the assistant's response in MarkdownV2 format
      await ctx.replyWithMarkdownV2(escapedContent);
    }, { intervalDuration: 10000 }); // Typing interval duration set to 10 seconds
  } catch (err) {
    console.log(`error while text message: ${err}`);
  }
});

bot.on(message('voice'), async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;
  try {   
    // ctx.reply(`Temporary disabled`);
    // Show typing status while processing the message 
   await ctx.persistentChatAction('typing', async () => {
      // Get the voice file link and user ID
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    
    // Convert voice file to OGG format in base64
    const oggBase64 = await ogg.createBase64(link.href, userId);
    
    // Convert OGG file to MP3 format buffer
    const mp3buffer = await ogg.toMp3Buffer(Buffer.from(oggBase64, 'base64'), userId);
    // Transcribe the MP3 file using OpenAI
    const text = await openai.transcription(mp3buffer);
    
    // // Reply with the transcribed text
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

export default async (req, res) => {
  try {
    await bot.telegram.setWebhook(`${BASE_PATH}/api/telegram-hook`);
    await bot.handleUpdate(req.body);
  } catch (error) {
    console.error(`Error sending message: ${error.toString()}`);
  }

  res.status(200).send('OK');
};
