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
3.  **Set up your PostgreSQL database:**
    *   Ensure PostgreSQL is installed and running.
    *   Create a database for this project.
    *   Copy the `.env.example` to `.env` (if `.env.example` exists, otherwise create `.env`).
    *   Update the `DATABASE_URL` in your `.env` file with your PostgreSQL connection string.
        Example: `DATABASE_URL="postgresql://user:password@localhost:5432/mydb"`
4.  **Run Prisma migrations:**
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

## Deployment to Google Cloud

This project can be deployed to Google Cloud services like Firebase App Hosting or Google Cloud Run.

### Database (Cloud SQL for PostgreSQL)

1.  **Create a Cloud SQL for PostgreSQL instance** in your Google Cloud project.
2.  **Configure `DATABASE_URL` Environment Variable:**
    *   In your Google Cloud deployment environment (e.g., Firebase App Hosting environment variables, Cloud Run service configuration, Secret Manager), set the `DATABASE_URL` environment variable to connect to your Cloud SQL instance.
    *   **Do not commit your production `DATABASE_URL` or sensitive credentials to your repository.** Use secret management services.
    *   Refer to the comments in the `.env` file for example `DATABASE_URL` formats for Cloud SQL.
3.  **Run Prisma Migrations in Production:**
    *   After deploying your application code but before it serves traffic (or as part of your CI/CD pipeline), apply database migrations using:
        ```bash
        npx prisma migrate deploy
        ```

### Application Hosting

*   **Firebase App Hosting:** The `apphosting.yaml` file is configured for deploying to Firebase App Hosting. Use the Firebase CLI to deploy:
    ```bash
    firebase deploy --only hosting
    ```
    (Ensure you have Firebase CLI installed and configured for your project).
*   **Google Cloud Run:** You would typically build a Docker container (Next.js can output a standalone build suitable for this) and deploy it to Cloud Run. Refer to Google Cloud Run documentation for specifics.

### Building for Production

To create a production build locally, you can run:
```bash
npm run build
```
This uses `next build`.
