# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# FacturasPrub
# FacturasPrub

## Running the Project Locally

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your local PostgreSQL database:**
    *   Ensure PostgreSQL is installed and running.
    *   Create a database for this project (e.g., `facturas_db`).
    *   Create a user and grant permissions if necessary.
    *   Copy the `.env.example` to `.env` (if `.env.example` exists, otherwise create `.env`).
    *   Update the `DATABASE_URL` in your `.env` file with your local PostgreSQL connection string.
        Example: `DATABASE_URL="postgresql://user:password@localhost:5432/facturas_db"`
4.  **Run Prisma migrations for local development:**
    ```bash
    npx prisma migrate dev --name init 
    ```
    (Replace `init` with a descriptive name if you're making subsequent migrations).
5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application should be available at `http://localhost:3000` (or the port specified in the terminal).

## Running Genkit Flows (Optional)

If your project uses Genkit for AI features:

1.  **Start the Genkit development server (in a separate terminal):**
    ```bash
    npm run genkit:dev
    ```
    Or for watching changes:
    ```bash
    npm run genkit:watch
    ```

## Deployment to Google Cloud with Firebase App Hosting and Cloud SQL

This section guides you on deploying your Next.js application (frontend and backend APIs) using Firebase App Hosting, with data stored in Cloud SQL for PostgreSQL.

### Prerequisites

*   A **Google Cloud Project**.
*   A **Firebase Project** linked to your Google Cloud Project.
*   **Firebase CLI** installed and authenticated: `npm install -g firebase-tools && firebase login`.
*   **gcloud CLI** installed and authenticated: [Install gcloud CLI](https://cloud.google.com/sdk/docs/install) and run `gcloud auth login && gcloud config set project YOUR_PROJECT_ID`.
*   Node.js and npm installed.
*   (Optional, for local migration testing against Cloud SQL) PostgreSQL client (`psql`) and [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy).

### Step 1: Set Up Cloud SQL for PostgreSQL

1.  **Enable APIs**: In the Google Cloud Console, ensure the following APIs are enabled for your project:
    *   `Service Networking API` (for private IP connections if used)
    *   `Cloud SQL Admin API`
    *   `Secret Manager API`

2.  **Create Cloud SQL Instance**:
    *   Go to the Google Cloud Console -> SQL.
    *   Click "Create instance" -> Choose "PostgreSQL".
    *   Provide an **Instance ID** (e.g., `facturas-db-instance`).
    *   Set a strong password for the default `postgres` user. **Store this securely.**
    *   Choose a **Region** (ideally the same region where you'll deploy Firebase App Hosting, e.g., `us-central1`).
    *   Select a PostgreSQL version.
    *   Under "Configuration options" -> "Connectivity":
        *   **Public IP**: You can disable this if your App Hosting backend will connect via the Cloud SQL Auth Proxy's Unix socket (common for App Hosting) or private IP. For initial setup or running migrations from your local machine, you might need it enabled (secure it with "Authorized networks").
        *   **Private IP**: Can be configured if your services are within the same VPC network.
    *   Click "Create instance".

3.  **Create a Database**:
    *   Once the instance is running, select it.
    *   Go to the "Databases" tab.
    *   Click "Create database" and name it (e.g., `facturas_prod_db`).

4.  **Get Instance Connection Name**:
    *   On the instance's "Overview" page, copy the **Instance connection name** (e.g., `YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID`). This is crucial for the `DATABASE_URL`.

### Step 2: Manage Database Password with Secret Manager

1.  **Create a Secret**:
    *   In Google Cloud Console -> Security -> Secret Manager.
    *   Click "Create secret".
    *   Name the secret (e.g., `facturas-db-password`).
    *   In "Secret value", enter the password for your Cloud SQL `postgres` user (or the specific user you created).
    *   Click "Create secret".

2.  **Grant Access to App Hosting Service Account**:
    *   Firebase App Hosting uses a service account to run your backend. By default, this is `PROJECT_NUMBER-compute@developer.gserviceaccount.com` (replace `PROJECT_NUMBER` with your project's number).
    *   Go to Secret Manager, select your secret.
    *   Go to "Permissions". Click "Grant access".
    *   In "New principals", add the App Hosting service account.
    *   Assign the role "Secret Manager Secret Accessor" (`roles/secretmanager.secretAccessor`).
    *   Save permissions.

### Step 3: Configure Your Next.js Application for Production

1.  **`package.json`**: The `build` script is already set to `prisma generate && next build`. This ensures Prisma Client is generated.

2.  **`apphosting.yaml`**: This file configures your Firebase App Hosting backend.
    *   It includes placeholders for `cpu`, `memoryMiB`, `minInstances`, `maxInstances`.
    *   Crucially, it shows how to set `environmentVariables` and `secretEnvironmentVariables`. You will set these up in the Firebase Console or via Firebase CLI after creating your backend in App Hosting.
    *   The `DATABASE_URL` will be constructed using these environment variables. A common pattern for App Hosting connecting via the Unix socket to Cloud SQL:
        `DATABASE_URL="postgresql://<USER>:<PASSWORD_FROM_SECRET>@localhost/<DB_NAME>?host=/cloudsql/<INSTANCE_CONNECTION_NAME>"`
        The `@localhost` part is correct when using the Unix socket provided by the Cloud SQL proxy environment.

3.  **`next.config.js`**: Ensure `output: 'standalone'` is present (already done).

### Step 4: Initialize Firebase and Deploy with App Hosting

1.  **Initialize Firebase Hosting (if not already done)**:
    *   In your project root, run `firebase init hosting`.
    *   Select "Use an existing project" and choose your Firebase project.
    *   When asked "What do you want to use as your public directory?", you can enter `public` or any placeholder, as App Hosting will manage the build.
    *   Choose "Configure as a single-page app (rewrite all urls to /index.html)?" **No**.
    *   "Set up automatic builds and deploys with GitHub?" Choose as per your preference.

2.  **Configure `firebase.json` for App Hosting**:
    Ensure your `firebase.json` looks similar to this, enabling the App Hosting backend:
    ```json
    {
      "hosting": {
        "source": ".", // Tells Firebase to look for apphosting.yaml
        "ignore": [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ],
        "frameworksBackend": {
          "region": "us-central1" // Match your Cloud SQL and preferred region
        }
      }
    }
    ```
    If you have multiple hosting sites, you might have a more complex `firebase.json`. The key is the `"source": "."` and `"frameworksBackend"` section for the site you want to use App Hosting with.

3.  **Set Environment Variables and Secrets in Firebase Console**:
    *   Go to your Firebase Project Console -> App Hosting.
    *   If you haven't deployed, it might prompt you to create/link a backend.
    *   Once your backend is recognized/created, find the section for managing environment variables.
    *   Define variables like:
        *   `NODE_ENV`: `production`
        *   `DB_USER`: `postgres` (or your specific DB user)
        *   `DB_NAME`: `facturas_prod_db` (your database name)
        *   `DB_HOST_PART`: `/cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID` (your instance connection name)
        *   `DB_PASSWORD_SECRET_NAME`: `projects/YOUR_PROJECT_ID/secrets/facturas-db-password/versions/latest` (path to your secret in Secret Manager)
    *   Then, construct `DATABASE_URL` using these, ensuring `DB_PASSWORD_SECRET_NAME` is referenced as a secret (App Hosting provides a way to link secret variables).
        Example `DATABASE_URL` (how you'd conceptually form it):
        `postgresql://${DB_USER}:${DB_PASSWORD_SECRET_NAME_ACTUAL_VALUE}@localhost/${DB_NAME}?host=${DB_HOST_PART}`
        Firebase App Hosting should provide UI to map the `DB_PASSWORD_SECRET_NAME` to an environment variable that gets populated with the secret's value. Refer to App Hosting documentation for the exact syntax of referencing secrets. The `apphosting.yaml` shows an example using `secretEnvironmentVariables`.

4.  **Deploy**:
    ```bash
    firebase deploy --only hosting 
    ```
    (If you have multiple hosting targets, specify yours: `firebase deploy --only hosting:your-site-name`)
    Firebase App Hosting will build your Next.js app (running `npm run build`) and deploy it.

### Step 5: Run Prisma Migrations in Production

After your first successful deployment and once Cloud SQL is set up, you need to apply database migrations.

1.  **Using Cloud SQL Auth Proxy (Recommended for secure local connection to Cloud SQL)**:
    *   Install the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) on your local machine or a CI/CD environment.
    *   Authenticate `gcloud` CLI.
    *   Run the proxy in a terminal, pointing to your Cloud SQL instance:
        ```bash
        ./cloud-sql-proxy YOUR_INSTANCE_CONNECTION_NAME
        ```
        This will typically make the Cloud SQL instance available on `localhost:5432`.
    *   In **another terminal**, ensure your local `.env` file's `DATABASE_URL` temporarily points to this proxied connection (e.g., `DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@127.0.0.1:5432/facturas_prod_db"`).
    *   Run the deploy migration command:
        ```bash
        npx prisma migrate deploy
        ```
    *   Stop the proxy and revert your local `.env` if needed.

    **Important**: `prisma migrate deploy` is non-interactive and applies all pending migrations. It's designed for production environments.

### Step 6: Test Your Deployed Application

Access the URL provided by Firebase Hosting. Test user creation, login, and invoice management to ensure data is being saved to and read from Cloud SQL. Check Cloud Logging for your App Hosting backend and Cloud SQL logs if you encounter issues.

This comprehensive guide should help you deploy your application. Remember that managing secrets and database connections securely is paramount in production.
