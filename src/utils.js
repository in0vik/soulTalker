import { unlink } from 'fs/promises';

// Remove a file at the specified filePath
export async function removeFile(filePath) {
  try {
    await unlink(filePath); // Use the unlink function from fs/promises to delete the file
  } catch (err) {
    console.log('Error while removing file: ', err); // Log any errors that occur during file removal
  }
}
