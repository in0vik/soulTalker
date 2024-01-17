import { Configuration, OpenAIApi } from 'openai';
import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import tmp from 'tmp';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
globalThis.fetch = fetch;

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  };

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
        model: 'gpt-4-1106-preview',
        messages: messages,
      });
      return response.data.choices[0].message; // Return the assistant's response
    } catch (error) {
      console.log(`Error while using OpenAI chat: ${error}`);
    }
  }

  // Transcribe an audio file using the OpenAI Whisper ASR API
  async transcription(mp3Data) {
    try {
      const audioStream = new Readable();
      audioStream.push(mp3Data);
      audioStream.push(null);

      // make a temporary file
      const tmpFile = tmp.fileSync({ postfix: '.mp3' });
      const tmpFilePath = tmpFile.name;

      // write audioStream to temporary file
      const writeStream = createWriteStream(tmpFilePath);
      audioStream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // send temporary file
      const response = await this.openai.createTranscription(
        createReadStream(tmpFilePath),
        'whisper-1'
      );

      // delete temporary file
      tmpFile.removeCallback();

      return response.data.text; // return transcribed text
    } catch (err) {
      console.log(`Error while transcribing: ${err}`);
    }
  }

  async getImageDalle(prompt) {
    const response = await this.openai.createImage({
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });
    return [response.data.data[0].url];
  }
}

export const openai = new OpenAI(process.env.API_KEY);
