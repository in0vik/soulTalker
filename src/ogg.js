import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
  constructor() {
    // Set the path to the installed ffmpeg binary
    ffmpeg.setFfmpegPath(installer.path);
  }

  // Convert OGG file to MP3 format
  toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);
      return new Promise((resolve, reject) => {
        ffmpeg(input)
          .inputOption('-t 30') // Set input duration to 30 seconds
          .output(outputPath) // Set the output path for the MP3 file
          .on('end', () => {
            // Remove the original OGG file after conversion is complete
            removeFile(input);
            resolve(outputPath); // Resolve with the output MP3 file path
          })
          .on('error', (err) => {
            reject(err.message); // Reject with the error message
          })
          .run();
      });
    } catch (e) {
      console.log(`Error while creating MP3: ${e.message}`);
    }
  }

  // Create an OGG file from the provided URL
  async create(url, filename) {
    try {
      const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`); // Set the output path for the OGG file
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
      });
      return new Promise((resolve) => {
        const stream = createWriteStream(oggPath);
        response.data.pipe(stream);
        stream.on('finish', () => {
          resolve(oggPath); // Resolve with the output OGG file path
        });
      });
    } catch (e) {
      console.log(`Error while creating OGG: ${e.message}`);
    }
  }
}

export const ogg = new OggConverter();
