import { nowIso } from '../../../packages/core/src/utils.js';

export class AdminService {
  #maintenance = {
    enabled: false,
    reason: '',
    updatedAt: null
  };

  setMaintenance(input) {
    this.#maintenance = {
      enabled: Boolean(input?.enabled),
      reason: String(input?.reason || ''),
      updatedAt: nowIso()
    };
    return { ...this.#maintenance };
  }

  getMaintenance() {
    return { ...this.#maintenance };
  }
}
