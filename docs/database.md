# Database Schema

> **Entity Relationship Diagram (ERD) and Schema Reference.**

The project uses **PostgreSQL** with **Drizzle ORM**.

## 🧬 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Credentials : owns
    User ||--o{ Workflow : owns

    Credentials ||--o{ Workflow : "used by (Action)"
    Credentials ||--o{ ActionExecutions : "used in"
    
    Workflow ||--o{ WorkflowExecutions : "runs"
    
    User {
        string id PK
        string email
        string name
    }

    Account {
        string id PK
        string userId FK
        string providerId
    }

    Credentials {
        int id PK
        string userId FK
        enum serviceProvider
        string accessToken
        string refreshToken
    }

    Workflow {
        int id PK
        string userId FK
        string name
        enum triggerProvider
        string triggerId
        enum actionProvider
        string actionId
    }

    WorkflowExecutions {
        int id PK
        int workflowId FK
        string status
        timestamp startedAt
    }
    
    Services {
        int id PK
        string provider
        bool isActive
    }

    ServiceActions {
        int id PK
        string serviceProvider
        string actionId
        json inputSchema
    }
```

## 📋 Tables Overview

- **User**: Core user identity (NextAuth compatible).
- **Credentials**: Stores encrypted OAuth2 tokens for external services.
- **Services**: Registry of active services and their supported features.
- **ServiceActions**: Definitions of available actions (inputs, outputs).
- **Workflows**: User-defined automation rules (Trigger -> Action).
- **WorkflowExecutions**: Audit log of every workflow run.
