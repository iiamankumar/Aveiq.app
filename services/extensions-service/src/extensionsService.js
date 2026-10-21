import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

const BUILTIN_ACTIONS = {
  passthrough: (payload) => payload,
  annotate: (payload, extension) => ({
    extension: extension.name,
    payload
  })
};

export class ExtensionsService {
  #extensions = new Map();
  #invocations = [];

  register(input) {
    const id = String(input?.id || '').trim();
    const name = String(input?.name || '').trim();
    const action = String(input?.action || '').trim();
    if (!id || !name || !BUILTIN_ACTIONS[action]) {
      throw new AppError('Extension requires id, name and supported action', 400, 'EXTENSION_INVALID');
    }

    const extension = { id, name, action, updatedAt: nowIso() };
    this.#extensions.set(id, extension);
    return extension;
  }

  invoke(id, payload) {
    const extension = this.#extensions.get(String(id));
    if (!extension) {
      throw new AppError('Extension not found', 404, 'EXTENSION_NOT_FOUND');
    }

    const output = BUILTIN_ACTIONS[extension.action](payload || {}, extension);
    const invocation = {
      id: `${extension.id}-${this.#invocations.length + 1}`,
      extensionId: extension.id,
      output,
      createdAt: nowIso()
    };
    this.#invocations.push(invocation);
    return invocation;
  }

  list() {
    return Array.from(this.#extensions.values());
  }
}
