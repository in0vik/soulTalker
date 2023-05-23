import { Configuration, OpenAIApi } from 'openai';
import config from 'config';
import { createReadStream } from 'fs';

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  }
  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      })
      return response.data.choices[0].message; 
    } catch (error) {
      console.log(`Error while GPTchat: ${error}`);
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        'whisper-1'
      );
      return response.data.text;
    } catch (err) {
      console.log(`Error while transcribing: ${err}`);
    }
  }
}

export const openai = new OpenAI(config.get('OPENAI_KEY'));
