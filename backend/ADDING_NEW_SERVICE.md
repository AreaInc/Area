# Adding a New Service

This guide shows you how to add a new service to the backend (like Gmail, Slack, etc).

## Overview

A service has three main parts:
1. Service class - defines what the service is
2. Actions - what the service can do
3. Credentials - how to authenticate with the service

## Step 1: Add the service provider to enums

Edit `backend/src/common/types/enums.ts` and add your service to the `ServiceProvider` enum:

```typescript
export enum ServiceProvider {
  GMAIL = "gmail",
  YOUR_SERVICE = "your_service", // Add this
}
```

If your service needs new action types, add them to `ActionType` enum too.

## Step 2: Update the database schema

Edit `backend/src/db/schema.ts` and add your service to the database enums:

```typescript
export const serviceProviderEnum = pgEnum("service_provider", [
  "gmail",
  "google",
  "slack",
  "discord",
  "github",
  "trello",
  "notion",
  "your_service", // Add this
]);
```

If you added new action types, update the `actionTypeEnum` too:

```typescript
export const actionTypeEnum = pgEnum("action_type", [
  "send_email",
  "read_email",
  // ... other types
  "your_new_action_type", // Add this if needed
]);
```

## Step 3: Generate and run the migration

Run these commands to create and apply the migration:

```bash
cd backend
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

This creates a new migration file in `backend/src/db/migrations/` and applies it to your database.

## Step 4: Create the service folder

Create a new folder: `backend/src/services/your-service/`

## Step 5: Create the credentials class

Create `backend/src/services/your-service/your-service-credentials.ts`:

```typescript
import { ICredentials } from "../../common/types/interfaces";
import { CredentialType } from "../../common/types/enums";

export class YourServiceCredentials implements ICredentials {
  id?: string;
  userId: string;
  name: string;
  type = CredentialType.OAUTH2; // or API_KEY, BEARER_TOKEN, etc
  data: any; // your auth data (tokens, keys, etc)

  constructor(userId: string, name: string, data: any) {
    this.userId = userId;
    this.name = name;
    this.data = data;
  }

  async isValid(): Promise<boolean> {
    // Check if credentials are still valid
    return true;
  }

  async refresh?(): Promise<void> {
    // Refresh credentials if needed
  }
}
```

## Step 6: Create the client

Create `backend/src/services/your-service/your-service-client.ts`:

```typescript
import { YourServiceCredentials } from "./your-service-credentials";

export class YourServiceClient {
  constructor(private credentials: YourServiceCredentials) {}

  async doSomething(params: any) {
    // Make API calls to your service here
    // Use this.credentials.data to get auth tokens/keys
  }
}
```

## Step 7: Create actions

Create `backend/src/services/your-service/actions/` folder.

For each action, create a file like `do-something-action.ts`:

```typescript
import {
  IAction,
  ActionParams,
  ActionResult,
  ICredentials,
} from "../../../common/types/interfaces";
import {
  ActionType,
  ServiceProvider,
  ExecutionStatus,
} from "../../../common/types/enums";
import { YourServiceCredentials } from "../your-service-credentials";
import { YourServiceClient } from "../your-service-client";

export class DoSomethingAction implements IAction {
  public readonly id = "your_service_do_something";
  public readonly name = "Do Something";
  public readonly description = "Does something with your service";
  public readonly type = ActionType.SEND_MESSAGE; // pick appropriate type
  public readonly serviceProvider = ServiceProvider.YOUR_SERVICE;

  public readonly inputSchema = {
    type: "object",
    required: ["field1", "field2"],
    properties: {
      field1: {
        type: "string",
        description: "First field",
      },
      field2: {
        type: "string",
        description: "Second field",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      result: {
        type: "string",
        description: "Result of the action",
      },
    },
  };

  async execute(
    params: ActionParams,
    credentials: ICredentials,
  ): Promise<ActionResult> {
    if (!(credentials instanceof YourServiceCredentials)) {
      return {
        success: false,
        error: "Invalid credentials type",
        status: ExecutionStatus.FAILED,
      };
    }

    try {
      const field1 = params.field1 as string;
      const field2 = params.field2 as string;

      const client = new YourServiceClient(credentials);
      const result = await client.doSomething({ field1, field2 });

      return {
        success: true,
        data: { result },
        status: ExecutionStatus.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Action failed",
        status: ExecutionStatus.FAILED,
      };
    }
  }
}
```

## Step 8: Create the service class

Create `backend/src/services/your-service/your-service.ts`:

```typescript
import { BaseService } from "../../common/base/base-service";
import { IServiceConfig } from "../../common/types/interfaces";
import {
  ServiceProvider,
  ActionType,
  CredentialType,
} from "../../common/types/enums";
import { DoSomethingAction } from "./actions/do-something-action";

export class YourService extends BaseService {
  constructor() {
    const config: IServiceConfig = {
      metadata: {
        provider: ServiceProvider.YOUR_SERVICE,
        name: "Your Service",
        description: "What your service does",
        imageUrl: "https://example.com/logo.png",
        version: "1.0.0",
        supportedActions: [ActionType.SEND_MESSAGE],
        credentialTypes: [CredentialType.OAUTH2],
      },
      actions: [new DoSomethingAction()],
    };

    super(config);
  }
}
```

## Step 9: Create index file

Create `backend/src/services/your-service/index.ts`:

```typescript
export { YourService } from "./your-service";
export { YourServiceCredentials } from "./your-service-credentials";
export { DoSomethingAction } from "./actions/do-something-action";
```

## Step 10: Register the service

Edit `backend/src/services/index.ts` and add:

```typescript
export * from "./your-service";
```

Edit `backend/src/services/services-module.ts`:

1. Import your service:
```typescript
import { YourService } from "./your-service";
```

2. In the `onModuleInit` method, add:
```typescript
const yourService = new YourService();
this.serviceRegistry.register(yourService);
await this.servicesService.saveService(yourService);

const yourServiceActions = yourService.getActions();
for (const action of yourServiceActions) {
  await this.actionsService.saveActionMetadata(
    action.serviceProvider,
    action.id,
    action.name,
    action.description,
    action.type,
    action.inputSchema,
    action.outputSchema,
  );
}
```

## Done

Your service is now registered and ready to use. The system will automatically:
- Register it in the service registry
- Save it to the database
- Register all its actions
- Make it available through the API

## File Structure Summary

```
backend/src/services/your-service/
├── actions/
│   └── do-something-action.ts
├── your-service-client.ts
├── your-service-credentials.ts
├── your-service.ts
└── index.ts
```
