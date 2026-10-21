import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

export class WebhookService {
  #registrations = new Map();
  #deliveries = [];

  register(input) {
    const id = String(input?.id || '');
    const eventType = String(input?.eventType || '').trim();
    const target = String(input?.target || '').trim();
    if (!id || !eventType || !target) {
      throw new AppError('Webhook requires id, eventType and target', 400, 'WEBHOOK_INPUT_INVALID');
    }

    const item = { id, eventType, target, createdAt: nowIso() };
    this.#registrations.set(id, item);
    return item;
  }

  trigger(eventType, payload) {
    const matches = Array.from(this.#registrations.values()).filter(
      (registration) => registration.eventType === eventType
    );

    const deliveries = matches.map((registration) => {
      const delivery = {
        id: `${registration.id}-${this.#deliveries.length + 1}`,
        webhookId: registration.id,
        eventType,
        payload,
        target: registration.target,
        status: 'queued',
        createdAt: nowIso()
      };
      this.#deliveries.push(delivery);
      return delivery;
    });

    return deliveries;
  }

  listDeliveries() {
    return [...this.#deliveries];
  }
}
