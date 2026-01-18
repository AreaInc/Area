import { Module, OnModuleInit } from "@nestjs/common";
import { WorkflowsModule } from "../workflows/workflows.module";
import { ActionRegistryService } from "../registries/action-registry.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

import { CreateIssueAction } from "./actions/create-issue.action";
import { AddCommentAction } from "./actions/add-comment.action";
import { StarRepositoryAction } from "./actions/star-repository.action";
import { CreateRepositoryAction } from "./actions/create-repository.action";
import { AddLabelAction } from "./actions/add-label.action";
import { CloseIssueAction } from "./actions/close-issue.action";
import { CreatePullRequestAction } from "./actions/create-pull-request.action";
import { MergePullRequestAction } from "./actions/merge-pull-request.action";

import {
  NewStarTrigger,
  NewIssueTrigger,
  PushTrigger,
  NewPullRequestTrigger,
  IssueLabeledTrigger,
  PullRequestReviewRequestedTrigger,
  ReleasePublishedTrigger,
} from "./triggers/github-triggers";

@Module({
  imports: [WorkflowsModule],
  providers: [
    CreateIssueAction,
    AddCommentAction,
    StarRepositoryAction,
    CreateRepositoryAction,
    AddLabelAction,
    CloseIssueAction,
    CreatePullRequestAction,
    MergePullRequestAction,
    NewStarTrigger,
    NewIssueTrigger,
    PushTrigger,
    NewPullRequestTrigger,
    IssueLabeledTrigger,
    PullRequestReviewRequestedTrigger,
    ReleasePublishedTrigger,
  ],
  exports: [
    CreateIssueAction,
    AddCommentAction,
    StarRepositoryAction,
    CreateRepositoryAction,
    AddLabelAction,
    CloseIssueAction,
    CreatePullRequestAction,
    MergePullRequestAction,
    NewStarTrigger,
    NewIssueTrigger,
    PushTrigger,
    NewPullRequestTrigger,
    IssueLabeledTrigger,
    PullRequestReviewRequestedTrigger,
    ReleasePublishedTrigger,
  ],
})
export class GitHubModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly createIssueAction: CreateIssueAction,
    private readonly addCommentAction: AddCommentAction,
    private readonly starRepositoryAction: StarRepositoryAction,
    private readonly createRepositoryAction: CreateRepositoryAction,
    private readonly addLabelAction: AddLabelAction,
    private readonly closeIssueAction: CloseIssueAction,
    private readonly createPullRequestAction: CreatePullRequestAction,
    private readonly mergePullRequestAction: MergePullRequestAction,
    private readonly newStarTrigger: NewStarTrigger,
    private readonly newIssueTrigger: NewIssueTrigger,
    private readonly pushTrigger: PushTrigger,
    private readonly newPullRequestTrigger: NewPullRequestTrigger,
    private readonly issueLabeledTrigger: IssueLabeledTrigger,
    private readonly pullRequestReviewRequestedTrigger: PullRequestReviewRequestedTrigger,
    private readonly releasePublishedTrigger: ReleasePublishedTrigger,
  ) {}

  onModuleInit() {
    console.log("[GitHubModule] Registering GitHub actions and triggers...");

    this.actionRegistry.register(this.createIssueAction);
    this.actionRegistry.register(this.addCommentAction);
    this.actionRegistry.register(this.starRepositoryAction);
    this.actionRegistry.register(this.createRepositoryAction);
    this.actionRegistry.register(this.addLabelAction);
    this.actionRegistry.register(this.closeIssueAction);
    this.actionRegistry.register(this.createPullRequestAction);
    this.actionRegistry.register(this.mergePullRequestAction);

    this.triggerRegistry.register(this.newStarTrigger);
    this.triggerRegistry.register(this.newIssueTrigger);
    this.triggerRegistry.register(this.pushTrigger);
    this.triggerRegistry.register(this.newPullRequestTrigger);
    this.triggerRegistry.register(this.issueLabeledTrigger);
    this.triggerRegistry.register(this.pullRequestReviewRequestedTrigger);
    this.triggerRegistry.register(this.releasePublishedTrigger);
  }
}
