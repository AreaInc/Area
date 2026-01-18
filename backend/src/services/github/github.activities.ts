import { db } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { GitHubClient } from "./github-client";

async function loadCredentials(credentialId: number, userId: string) {
  const [credential] = await db
    .select()
    .from(schema.credentials)
    .where(
      and(
        eq(schema.credentials.id, credentialId),
        eq(schema.credentials.userId, userId),
      ),
    );

  if (!credential) {
    throw new Error(`Credentials with ID ${credentialId} not found`);
  }

  if (credential.userId !== userId) {
    throw new Error("Unauthorized: Credentials do not belong to this user");
  }

  if (!credential.isValid) {
    throw new Error("Credentials are invalid or expired");
  }

  return credential;
}

async function getClient(credentialId: number, userId: string): Promise<GitHubClient> {
  const credential = await loadCredentials(credentialId, userId);

  if (!credential.accessToken) {
    throw new Error("Missing access token in credentials");
  }

  return new GitHubClient({
    data: {
      accessToken: credential.accessToken,
    },
  });
}

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  credentialId: number;
  userId: string;
}

export interface AddCommentInput {
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
  credentialId: number;
  userId: string;
}

export interface StarRepositoryInput {
  owner: string;
  repo: string;
  credentialId: number;
  userId: string;
}

export interface CreateRepositoryInput {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  credentialId: number;
  userId: string;
}

export interface AddLabelInput {
  owner: string;
  repo: string;
  issueNumber: number;
  labels: string[];
  credentialId: number;
  userId: string;
}

export interface CloseIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
  credentialId: number;
  userId: string;
}

export interface CreatePullRequestInput {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
  credentialId: number;
  userId: string;
}

export interface MergePullRequestInput {
  owner: string;
  repo: string;
  pullNumber: number;
  commitTitle?: string;
  commitMessage?: string;
  mergeMethod?: "merge" | "squash" | "rebase";
  credentialId: number;
  userId: string;
}

export async function createIssueActivity(input: CreateIssueInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.createIssue(
    input.owner,
    input.repo,
    input.title,
    {
      body: input.body,
      labels: input.labels,
      assignees: input.assignees,
    },
  );

  return {
    ...result,
    success: true,
  };
}

export async function addCommentActivity(input: AddCommentInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.addCommentToIssue(
    input.owner,
    input.repo,
    input.issueNumber,
    input.body,
  );

  return result;
}

export async function starRepositoryActivity(input: StarRepositoryInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.starRepository(input.owner, input.repo);

  return result;
}

export async function createRepositoryActivity(input: CreateRepositoryInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.createRepository(input.name, {
    description: input.description,
    private: input.private,
    autoInit: input.autoInit,
  });

  return {
    ...result,
    success: true,
  };
}

export async function addLabelActivity(input: AddLabelInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.addLabelToIssue(
    input.owner,
    input.repo,
    input.issueNumber,
    input.labels,
  );

  return result;
}

export async function closeIssueActivity(input: CloseIssueInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.closeIssue(
    input.owner,
    input.repo,
    input.issueNumber,
  );

  return result;
}

export async function createPullRequestActivity(input: CreatePullRequestInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.createPullRequest(
    input.owner,
    input.repo,
    input.title,
    input.head,
    input.base,
    {
      body: input.body,
      draft: input.draft,
    },
  );

  return {
    ...result,
    success: true,
  };
}

export async function mergePullRequestActivity(input: MergePullRequestInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.mergePullRequest(
    input.owner,
    input.repo,
    input.pullNumber,
    {
      commitTitle: input.commitTitle,
      commitMessage: input.commitMessage,
      mergeMethod: input.mergeMethod,
    },
  );

  return result;
}
