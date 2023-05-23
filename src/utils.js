import { unlink } from 'fs/promises';

export async function removeFile(filePath) {
  try {
    await unlink(filePath);
  } catch (err) {
    console.log('Error while removing file: ', err);
  }
}