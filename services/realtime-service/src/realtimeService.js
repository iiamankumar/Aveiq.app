import { nowIso } from '../../../packages/core/src/utils.js';

export class RealtimeService {
  #channels = new Map();

  subscribe(channel, subscriberId) {
    const key = String(channel);
    if (!this.#channels.has(key)) {
      this.#channels.set(key, { subscribers: new Set(), events: [] });
    }

    const state = this.#channels.get(key);
    state.subscribers.add(String(subscriberId));
    return { channel: key, subscribers: Array.from(state.subscribers) };
  }

  publish(channel, type, payload) {
    const key = String(channel);
    if (!this.#channels.has(key)) {
      this.#channels.set(key, { subscribers: new Set(), events: [] });
    }

    const state = this.#channels.get(key);
    const event = {
      id: `${key}-${state.events.length + 1}`,
      type,
      payload,
      createdAt: nowIso()
    };
    state.events.push(event);
    return event;
  }

  getEvents(channel) {
    const state = this.#channels.get(String(channel));
    if (!state) return [];
    return [...state.events];
  }
}
