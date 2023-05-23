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

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('👋');
});

bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('👋');
});

bot.on(message('voice'), async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;
  try {
    // await ctx.reply(code('thinking...'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3path);
    await ctx.reply(code('🗣️ ' + text));

    ctx.session.messages.push({ role: openai.roles.USER, content: text });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });

    await ctx.reply(response.content);
  } catch (err) {
    console.log(`error while voice message: ${err}`);
  }
});

bot.on(message('text'), async (ctx) => {
  ctx.session = ctx.session ?? INITIAL_SESSION;
  try {
    ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });
    await ctx.reply(response.content);

  } catch (err) {
    console.log(`error while text message: ${err}`);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
