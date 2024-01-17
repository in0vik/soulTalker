import * as deepl from 'deepl-node';
import config from 'config';

const DEEPL_KEY = config.get('DEEPL_KEY');

class Translator {
  constructor(apiKey) {
    this.translator = new deepl.Translator(apiKey);
  }
  async translateToEnglish(text) {
    return await this.translator.translateText(text, null, 'en-US');
  }
}

export const translator = new Translator(DEEPL_KEY);
