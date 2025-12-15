# MVP Roadmap: Action-Reaction Platform

This document outlines the current state of the project and the specific steps required to reach a functional Minimum Viable Product (MVP).

## 📊 Current State Overview

The project currently possesses a solid architectural foundation but lacks the connective logic to execute automated workflows.

### Backend (`backend/`)
- **Status:** Advanced.
- **Key Features:**
  - Modular `Service` architecture (Gmail service implemented).
  - robust Database Schema (Users, Credentials, Workflows, Executions).
  - Functional `about.json` endpoint.
  - `WorkflowExecutionService` capable of running node graphs.
- **Missing:**
  - **OAuth Implementation:** No way to generate/store valid tokens for services.
  - **Trigger Engine:** No mechanism to detect external events (Polling/Webhooks).

### Frontend (`frontend/`)
- **Status:** Intermediate.
- **Key Features:**
  - Dashboard layout, Profile management.
  - **Workflow Editor:** Drag-and-drop UI using React Flow is implemented.
  - Service Discovery UI.
- **Missing:**
  - **Connect Button:** UI to initiate OAuth flows.
  - **Credential Management:** UI to select which account to use for a service.

### Infrastructure
- **Status:** Production-Ready.
- **Features:** Docker Compose with Patroni (HA PostgreSQL), HAProxy, and Redis.

---

## 🛠 Implementation Plan

### Phase 1: Service Authentication (OAuth 2.0)
**Goal:** Allow users to securely connect their Gmail/Service accounts.

1.  **Backend Dependencies:** Install `google-auth-library` or `googleapis`.
2.  **API Endpoints:**
    -   `GET /api/auth/google/authorize`: Generates a Google OAuth URL with `access_type: offline` (for Refresh Tokens) and redirects the user.
    -   `GET /api/auth/google/callback`: Handles the redirect code, exchanges it for tokens, and creates a `Credential` record in the database.
3.  **Credential Refresh:** Implement logic in `CredentialsService` to check token expiration and refresh automatically using the stored `refreshToken`.

### Phase 2: The Trigger Engine (Polling System)
**Goal:** Automatically detect events (e.g., "New Email") to fire workflows.

1.  **Scheduler:** Install `@nestjs/schedule` to handle Cron jobs.
2.  **Polling Service:** Create a `PollingService` that:
    -   Runs every X seconds (e.g., 60s).
    -   Fetches all active Workflows with Triggers.
    -   Iterates through them and calls the Service's `poll()` method (to be implemented).
3.  **State Tracking:** Update the `ReceiveEmailTrigger` to accept a `lastChecked` timestamp to ensure only *new* emails trigger the workflow.

### Phase 3: Frontend Connectivity
**Goal:** Connect the UI to the new Backend capabilities.

1.  **Service Connection:** Update `ServiceDetails.tsx` to include a **"Connect"** button.
    -   Action: Redirects browser to `api/auth/{provider}/authorize`.
2.  **Workflow Configuration:**
    -   When adding a Node, allow selecting a specific Credential (if multiple exist).
    -   Ensure the "Save" button correctly maps the UI graph to the Backend `CreateWorkflowDto`.

### Phase 4: Verification (E2E)
**Test Scenario:**
1.  User logs in.
2.  User connects Gmail.
3.  User creates Workflow: `IF [New Email with Subject "MVP"] THEN [Send Email to self]`.
4.  User sends an email with subject "MVP".
5.  **Expected Result:** The Polling Service detects the email -> Workflow executes -> User receives the automated reply.
