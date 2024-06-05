# Nextjs, Authjs, Keycloak and Authentik in Docker

This is a repo to debug Authjs v5 in Docker to see why it doesn't work with the Keycloak provider.

Prerequisites:

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Node](https://nodejs.org/en/download/package-manager)
- Edit your `/etc/hosts` file with the following entries:
  - `127.0.0.1 keycloak.local`
  - `127.0.0.1 webapp.local`
  - `127.0.0.1 authentik.local`

---

## The problem

Authjs does not work with the keycloak provider when running inside a docker container. If you run Keycloak in Docker and run the webapp locally using `npm run dev` everything works as intended.

---

## How to test in Docker

Run `docker-compose up` this will spin up 8 containers:

- authentik: runs the authentik instance
- keycloak: runs the keycloak instance
- postgres: runs the postgres database for keycloak
- postgresql: runs the postgres database for authentik
- redis: runs the redis instance for authentik
- traefik: runs the docker reverse proxy
- webapp: runs the authjs-docker-test app
- worker: runs the authentik worker

---

## Create an application and provider for the webapp in authentik

Once authentik is up and running navigate to `http://authentik.local/if/flow/initial-setup/` to create your admin account.

![admin account](./assets/authentik-admin.png)

Click create new application and close the modal window, we will be using the `Create with wizard option`.

![authentik wizard](./assets/authentik-wizard.png)

Click on the `Create with wizard` button and enter `webapp` in the name field and click `next`.

![authentik provider](./assets/authentik-provider.png)

In the `Provider type` select `OAuth2/OIDC (Open Authorization/OpenID Connect)` and click `next`.

![authentik oauth](./assets/authentik-oauth.png)

In the `Provider configuration` section enter the following:

- Authentication flow: `default-authentication-flow (Welcome to authentik!)`
- Authorization flow: `default-provider-authorization-explicit-consent (Authorize Application)`
- Client type: `confidential`
- Client ID: Copy whatever Authentik generated and paste it in the following line in [docker-compose](./docker-compose.yml#L153)
- Client Secret: Copy whatever Authentik generated and paste it in the following line in [docker-compose](./docker-compose.yml#L154)
- Redirect/URIs/Origin: `http://webapp.local/auth/callback/authentik`

> When running the webapp locally the value must be the following for: Redirect/URIs/Origin: `http://localhost:3000/auth/callback/authentik`

![authentik config](./assets/authentik-config.png)

![authentik config2](./assets/authentik-config-2.png)

Click `Submit` to finish creating your application and provider. You should get the following message:

![authentik success](./assets/authentik-success.png)

Now in your terminal where you ran `docker-compose up` press `ctrl + c` to stop the containers. Then run `docker-compose up` again to start the containers with the new changes.

---

## Log in to the webapp with Authentik

Now that you have created the `admin` user proceed to login to the webapp, open `http://webapp.local` in your browser and click on the `Sign In` button, this will forward you to the sing in page so you can select which provider you want to login with.

![providers](./assets/providers.png)

Click on `Sign in with Authentik` this will redirect you to the authentik login page.

![authentik login](./assets/authentik-login.png)

Enter your credentials and you should be forwarded to the webapp and you should be able to see the session information.

![authentik session](./assets/authentik-session.png)

---

## Create a user for the webapp in keycloak

Once keycloak is up and running proceed to login to the keycloak admin interface by visiting `http://keycloak.local` in your browser.

The credentials to login to keycloak are:

```bash
username: admin
password: admin
```

Once you login proceed to click on the `webapp` realm in the left navigation dropdown.

![webapp realm](./assets/webapp-realm.png)

Then click on `Users`, on the users page click on `Create new user`.

![create new user](./assets/create-new-user.png)

Enter the username you want to use to login to the `webapp` I'm using `admin` to keep it simple.

![username](./assets/username.png)

Once the user is created, click on the `Credentials` tab and click on `Set password`. Enter the `password` you want to use in the `password` and in the `password confirmation` input boxes, uncheck the temporary toggle switch and click `Save` then click on `Save password` to confirm.

![password](./assets/password.png)

This concludes our keycloak setup.

---

## Log in to the webapp with Keycoak

Enter the username and password you used for the user you created in keycloak and click `Sign In`.

![webapp login](./assets/login.png)

The first time you login to the webapp, keycloak will ask you to update your account information. Enter the information and click `Submit`

![update account](./assets/update-account.png)

Once you update your account info you will encounter the `ECONNREFUSED` error which prevents you from using the webapp.

![server error](./assets/server-error.png)

> I added a logger entry in [auth.ts](./webapp/auth.ts#L21) with some console logs so it's easier to debug the issue in docker.

---

## How to test running the keycloak in docker and the webapp locally

To run keycloak simply run `docker-compose -f docker-compose-keycloak.yml up` and follow the steps to [Create a user for the webapp in keycloak](#create-a-user-for-the-webapp-in-keycloak), open a second terminal window and make sure you `cd /nextjs-auth-example` and rename `.env.example` to `.env.local` then run `npm run dev` to start the webapp locally.

Use the credentials you used when you created the user in keycloak and you should be able to login without any issues.

![loggedin](./assets/loggedin.png)

## Notes

The docs specify you only need 3 env vars:

```bash
AUTH_KEYCLOAK_ID
AUTH_KEYCLOAK_SECRET
AUTH_KEYCLOAK_ISSUER
```

Using only these 3 values works fine when running it locally but when you try running it in Docker you will run into an error because authjs is not passing the authorization url and it fails with the same `ECONNREFUSED` error as soon as you click the sign-in button.

If you replace the keycloak provider in [`auth.ts`](./nextjs-auth-example/auth.ts#L72) with the following you will get further in the process to login but it still fails with the same error.

> Another thing to note when running the web app locally the keycloak client needs to be public otherwise it will not work with a confidential client in keycloak. When running keycloak in docker it simply does not work regardless if the client is public or confidential.

```javascript
Keycloak({
  clientId: process.env.AUTH_KEYCLOAK_ID,
  clientSecret: process.env.AUTH_SECRET,
  issuer: `${process.env.AUTH_KEYCLOAK_ISSUER}`,
  // these are needed in order to have authjs get further in the authorization process in docker
  authorization: `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/auth`,
  wellKnown: `${process.env.AUTH_KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
  token: `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
  userinfo: `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
});
```

![server error](./assets/server-error.png)

---

## How to test running authentik in docker and the webapp locally

To run authentik simply run `docker-compose -f docker-compose-authentik.yml up` and follow the steps to [Create an application and provider for the webapp in authentik](#create-an-application-and-provider-for-the-webapp-in-authentik), open a second terminal window and make sure you `cd /nextjs-auth-example` and rename `.env.example` to `.env.local`, make sure to replace the values for `AUTH_AUTHENTIK_CLIENT_ID` and `AUTH_AUTHENTIK_CLIENT_SECRET` in `.env.local` then run `npm run dev` to start the webapp locally.

Use the credentials you used when you created the application provider in authentik and you should be able to login without any issues.

![loggedin](./assets/authentik-loggedin.png)

---

## How to run authentik and keycloak in docker and the webapp locally

To run both authentik and keycloak in docker run `docker-compose -f docker-compose-local.yml up` and follow the steps to [Create a user for the webapp in keycloak](#create-a-user-for-the-webapp-in-keycloak), and the instructions for [Create an application and provider for the webapp in authentik](#create-an-application-and-provider-for-the-webapp-in-authentik).

Then open a second terminal window and make sure you `cd /nextjs-auth-example` and rename `.env.example` to `.env.local`, make sure to replace the values for `AUTH_AUTHENTIK_CLIENT_ID` and `AUTH_AUTHENTIK_CLIENT_SECRET` in `.env.local` then run `npm run dev` to start the webapp locally.

Here is a short video of authentication working when both authentik and keycloak are running in docker and running the webapp locally.

Thanks for helping me debug this problem and hopefully we can get Authjs to work in Docker as it should.
