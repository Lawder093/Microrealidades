import { redirect } from "next/navigation";
import { microhubReturnPath } from "@/lib/microhub-auth";

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = microhubReturnPath(typeof params.next === "string" ? params.next : null);
  redirect(`/ingresar?${new URLSearchParams({ modo: "registro", next })}`);
}
