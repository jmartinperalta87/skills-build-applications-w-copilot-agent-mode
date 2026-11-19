import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path="/api/workouts/suggestions/mona%40example.com"
      emptyText="No workout suggestions yet."
      isEmpty={(data) => data.suggestions.length === 0}
      render={({ suggestions }) => (
        <ul className="list-group">
          {suggestions.map((workout, index) => (
            <li className="list-group-item" key={`${workout.title}-${index}`}>
              <strong>{workout.title}</strong>
              {workout.reason && <p className="mb-0">{workout.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
