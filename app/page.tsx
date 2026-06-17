import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const authenticated = await getSession();
  if (!authenticated) redirect("/login");
  redirect("/dashboard");
}
