import { AppError } from '../../../packages/core/src/errors.js';
import { nowIso } from '../../../packages/core/src/utils.js';

const ROLE_WEIGHTS = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4
};

export class TeamService {
  #teams = new Map();

  createTeam(input) {
    const id = String(input?.id || '');
    const name = String(input?.name || '').trim();
    const ownerId = String(input?.ownerId || '').trim();

    if (!id || !name || !ownerId) {
      throw new AppError('Team requires id, name and ownerId', 400, 'TEAM_INPUT_INVALID');
    }

    if (this.#teams.has(id)) {
      throw new AppError('Team already exists', 409, 'TEAM_EXISTS');
    }

    const createdAt = nowIso();
    const team = {
      id,
      name,
      createdAt,
      members: new Map([[ownerId, 'owner']])
    };
    this.#teams.set(id, team);
    return this.#serializeTeam(team);
  }

  addMember(teamId, userId, role = 'member') {
    const team = this.#teams.get(String(teamId));
    if (!team) {
      throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
    }

    if (!ROLE_WEIGHTS[role]) {
      throw new AppError('Invalid role', 400, 'TEAM_ROLE_INVALID');
    }

    team.members.set(String(userId), role);
    return this.#serializeTeam(team);
  }

  getRole(teamId, userId) {
    const team = this.#teams.get(String(teamId));
    if (!team) return null;
    return team.members.get(String(userId)) || null;
  }

  hasMinimumRole(teamId, userId, minimumRole) {
    const role = this.getRole(teamId, userId);
    if (!role) return false;
    return ROLE_WEIGHTS[role] >= ROLE_WEIGHTS[minimumRole];
  }

  #serializeTeam(team) {
    return {
      id: team.id,
      name: team.name,
      createdAt: team.createdAt,
      members: Array.from(team.members.entries()).map(([userId, role]) => ({ userId, role }))
    };
  }
}
