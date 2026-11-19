import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  return (
    <CapabilityCard<ActivityResponse>
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      emptyText="No activities yet."
      isEmpty={(data) => data.activities.length === 0}
      render={({ activities }) => (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={`${activity.type}-${index}`}>
              {activity.type} - {activity.minutes} min - {activity.points} points
            </li>
          ))}
        </ul>
      )}
    />
  );
}
