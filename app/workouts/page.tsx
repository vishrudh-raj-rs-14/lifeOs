import { redirect } from "next/navigation";

// Workouts are now combined with Gym tracking at /gym
export default function WorkoutsPage() {
  redirect("/gym");
}
