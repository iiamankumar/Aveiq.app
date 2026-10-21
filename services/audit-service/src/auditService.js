import { nowIso } from '../../../packages/core/src/utils.js';

export class AuditService {
  #events = [];

  log(eventType, details = {}) {
    const record = {
      id: `${eventType}-${this.#events.length + 1}`,
      eventType,
      details,
      createdAt: nowIso()
    };
    this.#events.push(record);
    return record;
  }

  list() {
    return [...this.#events];
  }
}
