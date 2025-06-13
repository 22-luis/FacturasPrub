
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
        For production with Cloud SQL, the `DATABASE_URL` will be configured in your hosting environment.
        Example for Cloud SQL via Unix socket (common for Cloud Run/App Hosting):
        `DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost/<DB_NAME>?host=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE_ID>"`
        The password should be managed via secrets.
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

## Running with Docker Compose (Local Multi-container Setup)

This project includes a `docker-compose.yml` file to run the Next.js application and a PostgreSQL database in separate containers. This is useful for a consistent development/testing environment that mirrors a multi-service setup.

1.  **Prerequisites:**
    *   Docker and Docker Compose installed.

2.  **Build and Start Containers:**
    ```bash
    docker-compose up --build
    ```
    *   The `--build` flag ensures that your Next.js application image is built (or rebuilt if there are changes to the `Dockerfile` or application code).
    *   This will start both the `app` (Next.js) and `db` (PostgreSQL) services.
    *   The Next.js app will be available at `http://localhost:3000`.
    *   The PostgreSQL database will be accessible on host port `5433` (mapped from container port `5432`).

3.  **Running Prisma Migrations with Docker Compose:**
    Once the containers are up and the database is healthy (the `app` service waits for the `db` healthcheck), you'll need to apply Prisma migrations. Open a new terminal and run:
    ```bash
    docker-compose run --rm app npx prisma migrate deploy
    ```
    *   This command executes `npx prisma migrate deploy` inside a temporary `app` container instance, which connects to the `db` service.
    *   You only need to do this the first time, or whenever you have new migrations to apply.

4.  **Viewing Logs:**
    ```bash
    docker-compose logs -f 
    ```
    Or for a specific service:
    ```bash
    docker-compose logs -f app
    docker-compose logs -f db
    ```

5.  **Stopping Containers:**
    ```bash
    docker-compose down
    ```
    To stop and remove volumes (like the database data):
    ```bash
    docker-compose down -v
    ```

6.  **Accessing the Database:**
    *   You can connect to the PostgreSQL database running in Docker using any SQL client.
    *   Host: `localhost`
    *   Port: `5433`
    *   User: `facturas_user` (from `docker-compose.yml`)
    *   Password: `facturas_password` (from `docker-compose.yml`)
    *   Database: `facturas_dev_db` (from `docker-compose.yml`)

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

## Guía de Despliegue a Google Cloud con Firebase App Hosting y Cloud SQL

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
    *   Set a strong password for the default `postgres` user. **Store this securely.** This password will be stored in Secret Manager.
    *   Choose a **Region** (ideally the same region where you'll deploy Firebase App Hosting, e.g., `us-central1`).
    *   Select a PostgreSQL version (e.g., PostgreSQL 15).
    *   Under "Configuration options" -> "Connectivity":
        *   **Public IP**: You can disable this if your App Hosting backend will connect via the Cloud SQL Auth Proxy's Unix socket (common for App Hosting) or private IP. For initial setup or running migrations from your local machine, you might need it enabled (secure it with "Authorized networks").
        *   **Private IP**: Can be configured if your services are within the same VPC network.
    *   Click "Create instance". This might take a few minutes.

3.  **Create a Database**:
    *   Once the instance is running, select it.
    *   Go to the "Databases" tab.
    *   Click "Create database" and name it (e.g., `facturas_prod_db`).

4.  **Create a Database User (Optional but Recommended)**:
    *   Instead of using the default `postgres` user, it's good practice to create a specific user for your application.
    *   Go to the "Users" tab for your instance.
    *   Click "Create user account", provide a username (e.g., `facturas_app_user`) and a strong password. Store this password securely (it will go into Secret Manager).

5.  **Get Instance Connection Name**:
    *   On the instance's "Overview" page, copy the **Instance connection name** (e.g., `YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID`). This is crucial for the `DATABASE_URL` when connecting via the Cloud SQL Auth Proxy.

### Step 2: Manage Database Password with Secret Manager

1.  **Create a Secret**:
    *   In Google Cloud Console -> Security -> Secret Manager.
    *   Click "Create secret".
    *   Name the secret (e.g., `facturas-db-password`).
    *   In "Secret value", enter the password for your Cloud SQL user (e.g., `facturas_app_user` or `postgres`).
    *   Click "Create secret".

2.  **Grant Access to App Hosting Service Account**:
    *   Firebase App Hosting uses a service account to run your backend. This is typically `PROJECT_NUMBER-compute@developer.gserviceaccount.com` (replace `PROJECT_NUMBER` with your project's number, visible on the Google Cloud Console homepage).
    *   Go to Secret Manager, select your secret.
    *   Go to "Permissions". Click "Grant access".
    *   In "New principals", add the App Hosting service account.
    *   Assign the role "Secret Manager Secret Accessor" (`roles/secretmanager.secretAccessor`).
    *   Save permissions.

### Step 3: Configure Your Next.js Application for Production

1.  **`package.json`**:
    *   The `build` script should be `prisma generate && next build`. This ensures Prisma Client is generated before Next.js builds. (Already configured).

2.  **`next.config.ts`**:
    *   Ensure `output: 'standalone'` is present. (Already configured).

3.  **`apphosting.yaml`**:
    *   This file configures your Firebase App Hosting backend.
    *   Update it with CPU, memory, and instance settings as needed.
    *   Define `environmentVariables` and `secretEnvironmentVariables`.
    *   The `DATABASE_URL` will be constructed using these environment variables. Example:
        ```yaml
        # apphosting.yaml
        # ... other settings
        environmentVariables:
          NODE_ENV: production
          DB_USER: your_db_user # e.g., facturas_app_user
          DB_NAME: your_db_name # e.g., facturas_prod_db
          DB_HOST_PART: /cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID
          # DATABASE_URL is constructed in App Hosting settings using these,
          # or you can define it fully if the password secret is directly usable.
        secretEnvironmentVariables:
          - key: DB_PASSWORD # App Hosting will populate this with the secret value
            secret: projects/YOUR_PROJECT_ID/secrets/facturas-db-password/versions/latest # Path to your secret
        # ...
        ```
    *   Firebase App Hosting will then allow you to construct the full `DATABASE_URL` in its environment settings using these parts, like:
        `postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=${DB_HOST_PART}`
        (The `@localhost` is correct when connecting via the Unix socket provided by the Cloud SQL proxy environment that App Hosting sets up).

### Step 4: Initialize Firebase and Deploy with App Hosting

1.  **Initialize Firebase Hosting (if not already done)**:
    *   In your project root, run `firebase init hosting`.
    *   Select "Use an existing project" and choose your Firebase project.
    *   When asked "What do you want to use as your public directory?", you can enter `public` or any placeholder, as App Hosting will manage the build.
    *   Choose "Configure as a single-page app (rewrite all urls to /index.html)?" **No**.
    *   "Set up automatic builds and deploys with GitHub?" Choose as per your preference.

2.  **Configure `firebase.json` for App Hosting**:
    Ensure your `firebase.json` enables the App Hosting backend:
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
    If you have multiple hosting sites, ensure this configuration is for the correct target.

3.  **Set Environment Variables and Secrets in Firebase Console (or CLI)**:
    *   Go to your Firebase Project Console -> App Hosting.
    *   Create or select your backend.
    *   Go to the "Backend settings" or "Environment variables" section.
    *   Define the plain text environment variables from your `apphosting.yaml` (e.g., `NODE_ENV`, `DB_USER`, `DB_NAME`, `DB_HOST_PART`).
    *   For `DB_PASSWORD`, link it to the Secret Manager secret you created (e.g., `facturas-db-password`). Firebase App Hosting UI will guide you on how to reference secrets listed in `secretEnvironmentVariables`.
    *   Construct the final `DATABASE_URL` using these variables.

4.  **Deploy**:
    ```bash
    firebase deploy --only hosting
    ```
    (If you have multiple hosting targets, specify yours: `firebase deploy --only hosting:your-site-name`)
    Firebase App Hosting will build your Next.js app (running `npm run build`, which includes `prisma generate`) and deploy it.

### Step 5: Run Prisma Migrations in Production

After your first successful deployment and once Cloud SQL is set up and your app is configured to connect to it, you need to apply database migrations.

**Methods to Run Migrations:**

*   **Locally using Cloud SQL Auth Proxy (Recommended for controlled execution)**:
    1.  Install the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) on your local machine.
    2.  Authenticate `gcloud` CLI.
    3.  Run the proxy in a terminal:
        ```bash
        ./cloud-sql-proxy YOUR_INSTANCE_CONNECTION_NAME
        ```
        This makes your Cloud SQL instance available on `localhost:5432` (or another port if specified).
    4.  In **another terminal**, temporarily update your local `.env` file's `DATABASE_URL` to point to this proxied Cloud SQL connection:
        `DATABASE_URL="postgresql://<USER_FROM_STEP_1.4>:<PASSWORD_FROM_SECRET_MANAGER>@127.0.0.1:5432/<DB_NAME_FROM_STEP_1.3>"`
    5.  Run the deploy migration command:
        ```bash
        npx prisma migrate deploy
        ```
    6.  Stop the proxy and revert your local `.env` if needed.

*   **Via a CI/CD Pipeline (e.g., Cloud Build)**:
    1.  Set up a Cloud Build trigger for your repository.
    2.  Add a build step to your `cloudbuild.yaml` to run migrations after your application is built and before it's deployed or traffic is shifted.
    3.  This step would need `gcloud`, `psql` (or Node.js with Prisma), and the Cloud SQL Auth Proxy, along with permissions to connect to Cloud SQL and access secrets.
    4.  Example `cloudbuild.yaml` step:
        ```yaml
        # ... (build steps)
        - name: 'gcr.io/google-appengine/exec-wrapper' # Or a custom image with psql/proxy
          args:
            - '-i'
            - 'gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest'
            - '-project_id=${PROJECT_ID}'
            - '-instance_connection_name=${_DB_INSTANCE_CONNECTION_NAME}' # Substitute with your instance
            - '-credential_file=/secrets/db-credentials/service-account.json' # If using a service account for proxy
            - '--'
            - 'npx'
            - 'prisma'
            - 'migrate'
            - 'deploy'
          env:
            - 'DATABASE_URL=postgresql://<USER>:<PASSWORD_FROM_SECRET>@localhost:5432/<DB_NAME>?host=/cloudsql/${_DB_INSTANCE_CONNECTION_NAME}' # Needs correct setup
          secretEnv: ['DB_PASSWORD'] # If Cloud Build supports direct secret mapping to env
        # ... (deploy steps)
        ```
        (This Cloud Build step is illustrative and needs careful setup of service accounts, proxy, and `DATABASE_URL` construction with secrets.)

**Important**: `prisma migrate deploy` is non-interactive and applies all pending migrations. It's designed for production. Always test migrations in a staging environment first.

### Step 6: Test Your Deployed Application

Access the URL provided by Firebase Hosting. Test user creation, login, and invoice management to ensure data is being saved to and read from Cloud SQL. Check Cloud Logging for your App Hosting backend and Cloud SQL logs if you encounter issues.

This comprehensive guide should help you deploy your application. Remember that managing secrets and database connections securely is paramount in production.

```
