import SessionData from "@/components/session-data";
import { auth } from "@/auth";
import { SignIn, SignOut } from "@/components/auth-components";

export default async function Page() {
  const session = await auth();
  console.log(process.env.HOSTNAME);
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">React Server Component Usage</h1>

      <SessionData session={session} />
      {!session?.user && <SignIn />}
      {session?.user && <SignOut />}
    </div>
  );
}
