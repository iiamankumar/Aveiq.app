import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

export class MessagingService {
  #channels = new Map();

  createChannel(input) {
    const id = String(input?.id || '').trim();
    const name = String(input?.name || '').trim();
    const ownerId = String(input?.ownerId || '').trim();
    if (!id || !name || !ownerId) {
      throw new AppError('Channel requires id, name and ownerId', 400, 'MESSAGE_CHANNEL_INVALID');
    }
    if (this.#channels.has(id)) {
      throw new AppError('Channel already exists', 409, 'MESSAGE_CHANNEL_EXISTS');
    }

    const channel = {
      id,
      name,
      ownerId,
      subscribers: new Set([ownerId]),
      messages: []
    };
    this.#channels.set(id, channel);
    return this.#serializeChannel(channel);
  }

  subscribe(channelId, subscriberId) {
    const channel = this.#channels.get(String(channelId));
    if (!channel) {
      throw new AppError('Channel not found', 404, 'MESSAGE_CHANNEL_NOT_FOUND');
    }

    const userId = String(subscriberId || '').trim();
    if (!userId) {
      throw new AppError('subscriberId is required', 400, 'MESSAGE_SUBSCRIBER_INVALID');
    }

    channel.subscribers.add(userId);
    return this.#serializeChannel(channel);
  }

  publish(channelId, input) {
    const channel = this.#channels.get(String(channelId));
    if (!channel) {
      throw new AppError('Channel not found', 404, 'MESSAGE_CHANNEL_NOT_FOUND');
    }

    const senderId = String(input?.senderId || '').trim();
    const content = String(input?.content || '').trim();
    if (!senderId || !content) {
      throw new AppError('Message requires senderId and content', 400, 'MESSAGE_PAYLOAD_INVALID');
    }

    if (!channel.subscribers.has(senderId)) {
      throw new AppError('Sender is not a channel subscriber', 403, 'MESSAGE_FORBIDDEN');
    }

    const message = {
      id: `${channel.id}-${channel.messages.length + 1}`,
      senderId,
      content,
      createdAt: nowIso()
    };
    channel.messages.push(message);
    return message;
  }

  listMessages(channelId) {
    const channel = this.#channels.get(String(channelId));
    if (!channel) {
      throw new AppError('Channel not found', 404, 'MESSAGE_CHANNEL_NOT_FOUND');
    }

    return [...channel.messages];
  }

  #serializeChannel(channel) {
    return {
      id: channel.id,
      name: channel.name,
      ownerId: channel.ownerId,
      subscribers: Array.from(channel.subscribers.values())
    };
  }
}
