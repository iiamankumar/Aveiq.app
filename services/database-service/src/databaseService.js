import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

export class DatabaseService {
  #collections = new Map();

  #getCollection(name) {
    const key = String(name);
    if (!this.#collections.has(key)) {
      this.#collections.set(key, {
        records: new Map(),
        indexes: new Map()
      });
    }
    return this.#collections.get(key);
  }

  createIndex(collectionName, field) {
    const collection = this.#getCollection(collectionName);
    const fieldName = String(field || '').trim();
    if (!fieldName) {
      throw new AppError('Index field is required', 400, 'DB_INDEX_INVALID');
    }

    if (!collection.indexes.has(fieldName)) {
      collection.indexes.set(fieldName, new Map());
      for (const record of collection.records.values()) {
        this.#attachIndex(collection, fieldName, record);
      }
    }

    return { collection: String(collectionName), field: fieldName };
  }

  put(collectionName, input) {
    const collection = this.#getCollection(collectionName);
    const id = String(input?.id || '').trim();
    if (!id) {
      throw new AppError('Document requires id', 400, 'DB_DOC_INVALID');
    }

    const doc = {
      ...input,
      id,
      updatedAt: nowIso()
    };
    collection.records.set(id, doc);

    for (const fieldName of collection.indexes.keys()) {
      this.#attachIndex(collection, fieldName, doc);
    }

    return doc;
  }

  get(collectionName, id) {
    const collection = this.#getCollection(collectionName);
    return collection.records.get(String(id)) || null;
  }

  query(collectionName, field, value) {
    const collection = this.#getCollection(collectionName);
    const fieldName = String(field || '');
    const valueKey = String(value || '');
    const index = collection.indexes.get(fieldName);

    if (index) {
      const ids = index.get(valueKey) || new Set();
      return Array.from(ids).map((id) => collection.records.get(id)).filter(Boolean);
    }

    return Array.from(collection.records.values()).filter(
      (record) => String(record?.[fieldName] ?? '') === valueKey
    );
  }

  #attachIndex(collection, fieldName, doc) {
    const value = String(doc?.[fieldName] ?? '');
    const index = collection.indexes.get(fieldName);
    if (!index.has(value)) {
      index.set(value, new Set());
    }
    index.get(value).add(doc.id);
  }
}
