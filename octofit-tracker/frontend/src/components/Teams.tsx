import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members?: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<TeamResponse>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      emptyText="No teams yet."
      isEmpty={(data) => data.teams.length === 0}
      render={({ teams }) => (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li className="list-group-item" key={`${team.name}-${index}`}>
              {team.name} - {(team.members ?? []).length} members
            </li>
          ))}
        </ul>
      )}
    />
  );
}
