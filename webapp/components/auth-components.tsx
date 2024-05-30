import React from "react";
import { auth, signIn, signOut } from "@/auth";

interface SignInProps extends React.ComponentProps<"button"> {
  provider?: string;
}

export const SignIn: React.FC<SignInProps> = ({ provider, ...props }) => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("keycloak");
      }}
    >
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
        {...props}
      >
        Sign In
      </button>
    </form>
  );
};

export const SignOut: React.FC<React.ComponentProps<"button">> = (props) => {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className="w-full"
    >
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
        {...props}
      >
        Sign Out
      </button>
    </form>
  );
};
