import Busboy from 'busboy';
import { RequestError } from './product-page.js';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function readMultipartImage(request) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = Busboy({
        headers: request.headers,
        limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0, parts: 2 },
      });
    } catch {
      reject(new RequestError(400, 'Expected a multipart image upload'));
      return;
    }

    let found = false;
    let failed = false;
    let mimeType = '';
    const chunks = [];

    const fail = (error) => {
      if (failed) return;
      failed = true;
      reject(error);
    };

    parser.on('file', (_fieldName, file, info) => {
      if (found) {
        file.resume();
        fail(new RequestError(400, 'Upload exactly one image'));
        return;
      }
      found = true;
      mimeType = info.mimeType.toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        file.resume();
        fail(new RequestError(415, 'Use a JPEG, PNG, or WebP image'));
        return;
      }
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => fail(new RequestError(413, 'Image must be 3 MB or smaller')));
      file.on('error', () => fail(new RequestError(400, 'Could not read the uploaded image')));
    });
    parser.on('filesLimit', () => fail(new RequestError(400, 'Upload exactly one image')));
    parser.on('partsLimit', () => fail(new RequestError(400, 'Upload exactly one image')));
    parser.on('error', () => fail(new RequestError(400, 'Invalid multipart image upload')));
    parser.on('finish', () => {
      if (failed) return;
      if (!found || !chunks.length) {
        fail(new RequestError(400, 'Image is required'));
        return;
      }
      resolve(`data:${mimeType};base64,${Buffer.concat(chunks).toString('base64')}`);
    });
    request.on('aborted', () => fail(new RequestError(400, 'Image upload was interrupted')));
    request.on('error', () => fail(new RequestError(400, 'Could not read the image upload')));
    request.pipe(parser);
  });
}
