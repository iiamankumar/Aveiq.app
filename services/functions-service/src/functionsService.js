import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

const HANDLERS = {
  echo: (payload) => payload,
  sum: (payload) => ({
    result: (payload?.numbers || []).reduce((acc, value) => acc + Number(value || 0), 0)
  }),
  uppercase: (payload) => ({
    result: String(payload?.text || '').toUpperCase()
  })
};

export class FunctionsService {
  #functions = new Map();
  #executions = [];

  register(input) {
    const name = String(input?.name || '').trim();
    const logicType = String(input?.logicType || '').trim();
    if (!name || !logicType || !HANDLERS[logicType]) {
      throw new AppError(
        'Function requires name and supported logicType',
        400,
        'FUNCTION_INPUT_INVALID'
      );
    }

    const fn = { name, logicType, updatedAt: nowIso() };
    this.#functions.set(name, fn);
    return fn;
  }

  execute(name, payload) {
    const fn = this.#functions.get(String(name));
    if (!fn) {
      throw new AppError('Function not found', 404, 'FUNCTION_NOT_FOUND');
    }

    const output = HANDLERS[fn.logicType](payload || {});
    const execution = {
      id: `${fn.name}-${this.#executions.length + 1}`,
      name: fn.name,
      logicType: fn.logicType,
      payload: payload || {},
      output,
      createdAt: nowIso()
    };
    this.#executions.push(execution);
    return execution;
  }

  listExecutions() {
    return [...this.#executions];
  }
}
