import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      emptyText="No leaderboard rankings yet."
      isEmpty={(data) => data.leaderboard.length === 0}
      render={({ leaderboard }) => (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.rank}>
              {entry.teamName} - {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    />
  );
}
