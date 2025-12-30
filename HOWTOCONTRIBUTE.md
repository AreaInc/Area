# How to Contribute

This document outlines the process for extending the ACTION-REACTION platform by adding new services, actions, and reactions. The architecture is designed to be modular, making it straightforward to integrate new functionalities.

## Project Structure Overview

-   **`backend/`**: Contains the NestJS application server, database interactions, authentication, and core business logic for services, actions, reactions, and workflows.
-   **`frontend/`**: Contains the React/Vite web client, providing the user interface for interacting with the backend API.
-   **`database/`**: Contains Docker-related configurations for the database (PostgreSQL) and other infrastructure services (ETCD, HAProxy).

## Adding a New Service

To add a new service (e.g., GitHub, Trello, another Google service):

1.  **Define the Service Provider Enum**:
    *   Open `backend/src/common/types/enums.ts`.
    *   Add a new entry to the `ServiceProvider` enum (e.g., `GITHUB = 'github'`).
    *   Open `backend/src/db/schema.ts`.
    *   Add the new provider to the `serviceProviderEnum` list.
    *   Run a Drizzle migration (see `backend/README.md` for details) if this enum is used in a table schema.

2.  **Create Service Directory and Files**:
    *   In `backend/src/services/`, create a new directory for your service (e.g., `github/`).
    *   Inside this directory, create:
        *   `github-credentials.ts`: Defines interfaces for storing credentials specific to this service. These should extend `BaseCredentials`.
        *   `github-service.ts`: This will be your main service class. It must:
            *   Extend `BaseService` from `backend/src/common/base/base-service.ts`.
            *   Implement `getProvider()` to return your new `ServiceProvider` enum.
            *   Implement `getActions()` to return an array of `IAction` and `ITrigger` objects that your service supports.
            *   Implement a constructor that takes necessary dependencies (e.g., `DrizzleOrm`, `CredentialsService`, `ConfigService`).
        *   `index.ts`: Exports all components from your service directory.
        *   `actions/`: A subdirectory to hold individual Action and Reaction implementations.

3.  **Implement Actions and Reactions**:
    *   For each Action or Reaction your service offers:
        *   Create a file in `backend/src/services/your_service/actions/` (e.g., `send-issue-action.ts`).
        *   Implement a class for the Action/Reaction. It should:
            *   Extend `BaseAction` or `BaseTrigger` from `backend/src/common/base/base-action.ts` / `backend/src/common/base/base-trigger.ts`.
            *   Define `id`, `name`, `description`, `type`, `inputSchema`, `outputSchema`.
            *   Implement the `execute` method for Actions or `evaluate` method for Triggers.
        *   Export the class from your service's `index.ts` file.

4.  **Register the Service**:
    *   Open `backend/src/services/services-module.ts`.
    *   Import your new `YourService` (e.g., `GitHubService`).
    *   Add your `YourService` to the `providers` array in the `@Module` decorator.
    *   In the `onModuleInit` method, `this.serviceRegistry.register(this.yourService)`.

5.  **Frontend Integration**:
    *   Update `frontend/src/types/service.ts` if needed (e.g., for icons or specific display properties).
    *   Update `frontend/src/routes/dashboard/services/index.tsx` (ServiceGrid) to display your new service, potentially adding an icon.
    *   Implement connection/credential management for your new service in the frontend.

6.  **Environment Variables**:
    *   If your service requires API keys or OAuth credentials, add them to your `backend/.env` file.

## Adding New Actions or Reactions to an Existing Service

1.  **Implement the Action/Reaction Class**:
    *   In the relevant service's `backend/src/services/your_service/actions/` directory, create a new file (e.g., `new-email-action.ts`).
    *   Implement the class as described in step 3 of "Adding a New Service".

2.  **Add to Service's `getActions()` Method**:
    *   Open `backend/src/services/your_service/your_service.ts`.
    *   Import your new Action/Reaction class.
    *   Add an instance of your new Action/Reaction to the array returned by the `getActions()` method.

3.  **Frontend Updates**:
    *   If the new Action/Reaction has specific UI requirements, update the relevant frontend components (e.g., the workflow editor) to support it.

## Database Migrations (Drizzle ORM)

If you modify the Drizzle schema (`backend/src/db/schema.ts`), you'll need to run a migration:

1.  **Generate Migration**:
    ```bash
    cd backend
    npm run db:generate # or pnpm run db:generate
    ```
    This will create a new `.sql` file in `backend/src/db/migrations/`.

2.  **Apply Migration**:
    ```bash
    npm run db:push # or pnpm run db:push
    ```
    This applies the pending migrations to your database. Make sure your database is running.

## Local Development Setup

Refer to the main `README.md` for instructions on setting up Docker Compose and running the backend/frontend locally.

By following these guidelines, you can effectively contribute to expanding the functionality of the ACTION-REACTION platform.
