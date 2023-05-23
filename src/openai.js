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

  // Send a list of messages to the OpenAI chat model and retrieve the response
  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      return response.data.choices[0].message; // Return the assistant's response
    } catch (error) {
      console.log(`Error while using OpenAI chat: ${error}`);
    }
  }

  // Transcribe an audio file using the OpenAI Whisper ASR API
  async transcription(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        'whisper-1'
      );
      return response.data.text; // Return the transcribed text
    } catch (err) {
      console.log(`Error while transcribing: ${err}`);
    }
  }
}

export const openai = new OpenAI(config.get('OPENAI_KEY'));
