import { createUser } from '../../../packages/core/src/types.js';
import { nowIso } from '../../../packages/core/src/utils.js';

export class UserService {
  #records = new Map();

  upsert(userInput) {
    const user = createUser(userInput);
    const record = {
      ...user,
      updatedAt: nowIso()
    };

    this.#records.set(record.id, record);
    return record;
  }

  findById(id) {
    return this.#records.get(String(id)) || null;
  }
}
