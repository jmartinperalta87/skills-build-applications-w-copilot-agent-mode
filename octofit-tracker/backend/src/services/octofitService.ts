import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type JsonRecord = Record<string, unknown>;

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): JsonRecord {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw httpError(400, 'Request body must be an object');
  }
  return input as JsonRecord;
}

function requiredString(input: JsonRecord, field: string) {
  const value = input[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

function objectId(input: JsonRecord, field: string) {
  const value = input[field];
  if (typeof value !== 'string' || !/^[\da-f]{24}$/i.test(value)) {
    throw httpError(400, `${field} must be a valid ID`);
  }
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = objectId(body, 'userId');
  const teamId = objectId(body, 'teamId');
  const type = requiredString(body, 'type');
  const minutes = body.minutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw httpError(400, 'minutes must be a positive whole number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requiredString(body, 'name');
  const mascot = requiredString(body, 'mascot');
  const memberInputs = body.members ?? [];
  if (!Array.isArray(memberInputs)) throw httpError(400, 'members must be an array');

  const memberIds = memberInputs.map((member) => {
    if (typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member)) {
      throw httpError(400, 'members must contain valid IDs');
    }
    return new Types.ObjectId(member);
  });
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== new Set(memberIds.map(String)).size) throw httpError(404, 'One or more team members were not found');
  }
  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: pointsByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function activityFocus(type: string) {
  const normalized = type.toLowerCase();
  if (['run', 'cycle', 'walk'].includes(normalized)) return 'endurance';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = recentActivity ? activityFocus(recentActivity.type) : undefined;
  const matchingGoal = workouts.filter((workout) => workout.focus.toLowerCase() === goal);
  const recommendations = matchingGoal.length > 0
    ? matchingGoal
    : recentFocus
      ? workouts.filter((workout) => workout.focus.toLowerCase() === recentFocus)
      : [];
  const matchedGoal = matchingGoal.length > 0;

  return recommendations.map((workout) => ({
    ...workout,
    reason: matchedGoal
      ? recentActivity
        ? `Matches your ${goal} goal and recent ${recentActivity.type} activity.`
        : `Matches your ${goal} goal.`
      : `Matches your recent ${recentActivity?.type} activity.`,
  }));
}

export { User };
