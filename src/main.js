import { Telegraf, session } from 'telegraf';
import { code } from 'telegraf/format';
import { message } from 'telegraf/filters';
import { ogg } from './ogg.js';
import { openai } from './openai.js';

import { translator } from '../src/translate.js';
import { models } from '../src/models.js';
import { generateImage } from '../src/replicate.js';

import dotenv from 'dotenv';

import express from 'express';
const app = express();
const port = 8080;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const INITIAL_SESSION = {
  messages: [],
};
const MODES = { CHAT: 'chat', DRAW: 'draw' };
let currentMode = MODES.CHAT;
let currentModel = models.default;

async function handleSetModelCommand(ctx) {
  currentMode = MODES.DRAW;
  const modelName = ctx.message.text.slice(1);
  currentModel = models[modelName];
  ctx.reply(code(`🎨 art mode: ${modelName}`));
}

bot.use(session());

// Command to reset the session and greet the user
bot.command('newchat', async (ctx) => {
  if (currentMode !== MODES.CHAT) {
    currentMode = MODES.CHAT;
    ctx.session = INITIAL_SESSION;
    await ctx.reply(code('💬 chat mode: gpt-4'));
  } else {
    currentMode = MODES.CHAT;
    ctx.session = INITIAL_SESSION;
    await ctx.reply('👋');
  }
  
});

Object.keys(models).forEach(async (modelName) => {
  bot.command(modelName.toLowerCase(), handleSetModelCommand);
});

// Handler for voice messages
bot.on(message('voice'), async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;
  try {
    if (currentMode === MODES.CHAT) {
      // Show typing status while processing the message
      await ctx.persistentChatAction(
        'typing',
        async () => {
          // Get the voice file link and user ID
          const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
          const userId = String(ctx.message.from.id);

          // Convert voice file to OGG format in base64
          const oggBase64 = await ogg.createBase64(link.href, userId);

          // Convert OGG file to MP3 format buffer
          const mp3buffer = await ogg.toMp3Buffer(Buffer.from(oggBase64, 'base64'), userId);

          // Transcribe the MP3 file using OpenAI
          const text = await openai.transcription(mp3buffer);

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
        },
        { intervalDuration: 10000 }
      ); // Typing interval duration set to 10 seconds
    }
    if (currentMode === MODES.DRAW) {
      // Show typing status while processing the message
      await ctx.persistentChatAction(
        'upload_photo',
        async () => {
          bot.telegram.sendChatAction(ctx.chat.id, 'upload_photo');

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
          const translatedText = await translator.translateToEnglish(text);
          let imageUrl = [];
          if (currentModel === models.dalle) {
            imageUrl = await openai.getImageDalle(translatedText.text);
          } else {
            imageUrl = await generateImage(currentModel, translatedText.text);
          }
          await ctx.replyWithPhoto(imageUrl[0]);
        },
        { intervalDuration: 10000 }
      );
    }
  } catch (err) {
    console.log(`error while voice message: ${err}`);
  }
});

// Handler for text messages
bot.on(message('text'), async (ctx) => {
  ctx.session = ctx.session ?? INITIAL_SESSION;
  try {
    if (currentMode === MODES.CHAT) {
      // Show typing status while processing the message
      await ctx.persistentChatAction(
        'typing',
        async () => {
          // Save user's message in the session
          ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

          // Get the response from OpenAI chat model
          const response = await openai.chat(ctx.session.messages);

          // Save assistant's message in the session
          ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });

          // Escape reserved characters in the response content
          const escapedContent = response.content.replace(/[\.\,\;\:\!\?\'\"\-\_\=\+\/\\\|\(\)\[\]\{\}\<\>\*\&\^\%\$\#\@\~\`]/g, '\\$&');
          // Reply with the assistant's response in MarkdownV2 format
          await ctx.replyWithMarkdownV2(escapedContent);
        },
        { intervalDuration: 10000 }
      ); // Typing interval duration set to 10 seconds
    }
    if (currentMode === MODES.DRAW) {
      await ctx.persistentChatAction(
        'upload_photo',
        async () => {
          bot.telegram.sendChatAction(ctx.chat.id, 'upload_photo');
          const translatedText = await translator.translateToEnglish(ctx.message.text);
          let imageUrl = [];
          if (currentModel === models.dalle) {
            imageUrl = await openai.getImageDalle(translatedText.text);
          } else {
            imageUrl = await generateImage(currentModel, translatedText.text);
          }
          await ctx.replyWithPhoto(imageUrl[0]);
        },
        { intervalDuration: 10000 }
      );
    }
  } catch (err) {
    await ctx.reply(code('Model currently unavailable, please try again later'));
    console.log(`error while text message: ${err}`);
  }
});

// Launch the bot
bot.launch();

// Gracefully stop the bot on SIGINT signal
process.once('SIGINT', () => bot.stop('SIGINT'));

// Gracefully stop the bot on SIGTERM signal
process.once('SIGTERM', () => bot.stop('SIGTERM'));
