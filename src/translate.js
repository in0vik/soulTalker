import * as deepl from 'deepl-node';
const DEEPL_KEY = process.env.DEEPL_KEY;

class Translator {
  constructor(apiKey) {
    this.translator = new deepl.Translator(apiKey);
  }
  async translateToEnglish(text) {
    return await this.translator.translateText(text, null, 'en-US');
  }
}

export const translator = new Translator(DEEPL_KEY);
