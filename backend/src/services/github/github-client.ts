import { Octokit } from "@octokit/rest";

export interface GitHubCredentials {
  data: {
    accessToken: string;
  };
}

export interface Repository {
  owner: string;
  repo: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(credentials: GitHubCredentials) {
    this.octokit = new Octokit({
      auth: credentials.data.accessToken,
    });
  }

  async createRepository(
    name: string,
    options?: {
      description?: string;
      private?: boolean;
      autoInit?: boolean;
    },
  ) {
    const response = await this.octokit.repos.createForAuthenticatedUser({
      name,
      description: options?.description,
      private: options?.private ?? false,
      auto_init: options?.autoInit ?? false,
    });

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      url: response.data.html_url,
      private: response.data.private,
    };
  }

  async starRepository(owner: string, repo: string) {
    await this.octokit.activity.starRepoForAuthenticatedUser({
      owner,
      repo,
    });

    return {
      success: true,
      message: `Successfully starred ${owner}/${repo}`,
    };
  }

  async getRepository(owner: string, repo: string) {
    const response = await this.octokit.repos.get({
      owner,
      repo,
    });

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      url: response.data.html_url,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
    };
  }

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    options?: {
      body?: string;
      labels?: string[];
      assignees?: string[];
    },
  ) {
    const response = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body: options?.body,
      labels: options?.labels,
      assignees: options?.assignees,
    });

    return {
      number: response.data.number,
      id: response.data.id,
      title: response.data.title,
      url: response.data.html_url,
      state: response.data.state,
    };
  }

  async addCommentToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ) {
    const response = await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });

    return {
      id: response.data.id,
      url: response.data.html_url,
      body: response.data.body,
      success: true,
    };
  }

  async closeIssue(owner: string, repo: string, issueNumber: number) {
    const response = await this.octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: "closed",
    });

    return {
      number: response.data.number,
      state: response.data.state,
      url: response.data.html_url,
      success: true,
    };
  }

  async addLabelToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[],
  ) {
    const response = await this.octokit.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels,
    });

    return {
      success: true,
      labels: response.data.map((label) => label.name),
    };
  }

  async getIssue(owner: string, repo: string, issueNumber: number) {
    const response = await this.octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      labels: response.data.labels.map((label) =>
        typeof label === "string" ? label : label.name,
      ),
    };
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    options?: {
      body?: string;
      draft?: boolean;
    },
  ) {
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body: options?.body,
      draft: options?.draft,
    });

    return {
      number: response.data.number,
      id: response.data.id,
      title: response.data.title,
      url: response.data.html_url,
      state: response.data.state,
      draft: response.data.draft,
    };
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    options?: {
      commitTitle?: string;
      commitMessage?: string;
      mergeMethod?: "merge" | "squash" | "rebase";
    },
  ) {
    const response = await this.octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      commit_title: options?.commitTitle,
      commit_message: options?.commitMessage,
      merge_method: options?.mergeMethod ?? "merge",
    });

    return {
      merged: response.data.merged,
      message: response.data.message,
      sha: response.data.sha,
      success: true,
    };
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number) {
    const response = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      merged: response.data.merged,
      draft: response.data.draft,
    };
  }

  async createRelease(
    owner: string,
    repo: string,
    tagName: string,
    options?: {
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
    },
  ) {
    const response = await this.octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name: options?.name,
      body: options?.body,
      draft: options?.draft ?? false,
      prerelease: options?.prerelease ?? false,
    });

    return {
      id: response.data.id,
      tagName: response.data.tag_name,
      name: response.data.name,
      url: response.data.html_url,
      draft: response.data.draft,
      prerelease: response.data.prerelease,
    };
  }

  async getAuthenticatedUser() {
    const response = await this.octokit.users.getAuthenticated();
    return {
      login: response.data.login,
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
    };
  }
}
