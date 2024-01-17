import Replicate from "node-replicate";
import fetch from "node-fetch";
globalThis.fetch = fetch

function generateImage(currentModel, prompt) {
  return Replicate.run(currentModel, {
    prompt,
  });
}

export {
  generateImage,
};