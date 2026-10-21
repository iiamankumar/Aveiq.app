import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

export class StorageService {
  #files = new Map();

  upload(input) {
    const id = String(input?.id || '').trim();
    const name = String(input?.name || '').trim();
    const content = String(input?.content || '');
    const ownerId = String(input?.ownerId || '').trim();
    const visibility = input?.visibility === 'private' ? 'private' : 'public';

    if (!id || !name || !ownerId) {
      throw new AppError('File requires id, name and ownerId', 400, 'STORAGE_INPUT_INVALID');
    }

    const file = {
      id,
      name,
      content,
      ownerId,
      visibility,
      updatedAt: nowIso()
    };
    this.#files.set(id, file);
    return file;
  }

  get(fileId, requesterId, canReadPrivate = false) {
    const file = this.#files.get(String(fileId));
    if (!file) {
      throw new AppError('File not found', 404, 'STORAGE_NOT_FOUND');
    }

    if (
      file.visibility === 'private' &&
      file.ownerId !== String(requesterId || '') &&
      !canReadPrivate
    ) {
      throw new AppError('Access denied', 403, 'STORAGE_FORBIDDEN');
    }

    return file;
  }
}
