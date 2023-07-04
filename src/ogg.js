import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';

import installer from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(installer.path);

class OggConverter {
  toMp3Buffer(input) {
    return new Promise((resolve, reject) => {
      // Преобразование буфера в поток
      let bufferStream = new stream.PassThrough();
      bufferStream.end(Buffer.from(input, 'base64'));
  
      const mp3Data = [];
      let outStream = new stream.PassThrough();
  
      ffmpeg()
        .input(bufferStream)
        .inputFormat('ogg')
        .output(outStream)
        .outputFormat('mp3')
        .on('end', () => {
          const mp3Buffer = Buffer.concat(mp3Data);
          resolve(mp3Buffer);
        })
        .on('error', (err) => {
          reject(err.message);
        })
        .run();
  
      outStream.on('data', (chunk) => {
        mp3Data.push(chunk);
      });
    });
  }

  async createBase64(url) {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data, 'binary').toString('base64');
  }
}

export const ogg = new OggConverter();
