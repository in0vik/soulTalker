import { Telegraf } from  'telegraf'
import { message } from 'telegraf/filters'
import config from 'config'

const bot = new Telegraf(config.get('BOT_TOKEN'));

bot.on(message('voice'), async (ctx) => {
  try {
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id) 
    await ctx.reply(JSON.stringify(link, null, 2))
  } catch (err) {
    console.log(`error while voice message: ${err}`);
  }
  
})

bot.command('start', async (ctx) => {
  await ctx.reply(JSON.stringify(ctx.message, null, 2))
})

bot.launch()

 process.once("SIGINT", () => bot.stop("SIGINT"));
 process.once("SIGTERM", () => bot.stop("SIGTERM"));
