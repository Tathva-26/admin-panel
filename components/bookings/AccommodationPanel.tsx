import { formatDate } from "@/lib/format";
import type { Accommodation } from "@/types";

/** The three fest days the backend counts meals against, in order. */
const MEAL_DAYS = [
  { day: 24, veg: "foodDay24Veg", nonVeg: "foodDay24NonVeg" },
  { day: 25, veg: "foodDay25Veg", nonVeg: "foodDay25NonVeg" },
  { day: 26, veg: "foodDay26Veg", nonVeg: "foodDay26NonVeg" },
] as const;

/**
 * Stay and meal details for a booking of kind ACCOMMODATION.
 *
 * These were on the wire all along and never shown, so "which room is this
 * person in, and did they pay for food?" had no answer in the panel — which is
 * the question that gets asked at a registration desk.
 */
export default function AccommodationPanel({
  accommodation,
}: {
  accommodation: Accommodation;
}) {
  const meals = MEAL_DAYS.map((entry) => ({
    day: entry.day,
    veg: accommodation[entry.veg],
    nonVeg: accommodation[entry.nonVeg],
  }));

  const totalMeals = meals.reduce(
    (sum, meal) => sum + meal.veg + meal.nonVeg,
    0,
  );

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Accommodation
      </h3>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border bg-muted px-3 py-2.5 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Room</dt>
          <dd className="font-medium text-foreground">{accommodation.room}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Gender</dt>
          <dd className="text-foreground">{accommodation.gender}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Check in</dt>
          {/* Plain date strings, not instants — no timezone conversion. */}
          <dd className="numeric text-foreground">
            {formatDate(accommodation.startDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Check out</dt>
          <dd className="numeric text-foreground">
            {formatDate(accommodation.endDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Nights</dt>
          <dd className="numeric text-foreground">{accommodation.nights}</dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">
                Meals
              </th>
              <th className="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground">
                Veg
              </th>
              <th className="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground">
                Non-veg
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {meals.map((meal) => (
              <tr key={meal.day}>
                <td className="px-3 py-1.5 text-muted-foreground">Day {meal.day}</td>
                <td className="numeric px-3 py-1.5 text-right text-foreground">
                  {meal.veg}
                </td>
                <td className="numeric px-3 py-1.5 text-right text-foreground">
                  {meal.nonVeg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalMeals === 0 ? (
          <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
            No meals booked.
          </p>
        ) : null}
      </div>
    </section>
  );
}
