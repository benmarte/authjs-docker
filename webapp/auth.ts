import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
// const authUrl = `${process.env.AUTH_URL}` ?? "http://localhost:3000";

// console.log(`AUTH_URL = ${authUrl}`);

// console.log(`Env Vars = ${JSON.stringify(process.env)}`);

const kcConfig = {
  clientId: process.env.AUTH_KEYCLOAK_ID,
  clientSecret: process.env.AUTH_SECRET,
  issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
  // these are needed in order to have authjs get further in the authorization process in docker
  authorization: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
  wellKnown: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
  token: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
  userinfo: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak(kcConfig)],
  logger: {
    error(code, ...message) {
      console.error(code, message);
    },
    warn(code, ...message) {
      console.warn(code, message);
    },
    debug(code, ...message) {
      console.debug(code, message);
    },
  },
  debug: process.env.NODE_ENV !== "production" ? true : false,
});
