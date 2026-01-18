import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class NewLikedVideoTrigger implements ITrigger {
    id = "new_liked_video";
    name = "New Liked Video";
    description = "Triggers when you like a new video";
    serviceProvider = "youtube";
    triggerType = TriggerType.POLLING;
    requiresCredentials = true;

    configSchema = { type: "object", properties: {} };
    outputSchema = { type: "object", properties: { videoId: { type: "string" }, title: { type: "string" } } };

    private workflowRegistrations = new Map<number, { config: Record<string, any>; credentialsId?: number }>();
    async register(workflowId: number, config: Record<string, any>, credentialsId?: number): Promise<void> { this.workflowRegistrations.set(workflowId, { config, credentialsId }); }
    async unregister(workflowId: number): Promise<void> { this.workflowRegistrations.delete(workflowId); }
    async validateConfig(config: Record<string, any>): Promise<boolean> { return true; }
    getRegistrations() { return this.workflowRegistrations; }
}

@Injectable()
export class NewVideoFromChannelTrigger implements ITrigger {
    id = "new_video_from_channel";
    name = "New Video From Channel";
    description = "Triggers when a specified channel uploads a new video";
    serviceProvider = "youtube";
    triggerType = TriggerType.POLLING;
    requiresCredentials = true;

    configSchema = {
        type: "object",
        required: ["channelId"],
        properties: { channelId: { type: "string", description: "Channel ID to monitor" } }
    };
    outputSchema = { type: "object", properties: { videoId: { type: "string" }, title: { type: "string" }, url: { type: "string" } } };

    private workflowRegistrations = new Map<number, { config: Record<string, any>; credentialsId?: number }>();
    async register(workflowId: number, config: Record<string, any>, credentialsId?: number): Promise<void> { this.workflowRegistrations.set(workflowId, { config, credentialsId }); }
    async unregister(workflowId: number): Promise<void> { this.workflowRegistrations.delete(workflowId); }
    async validateConfig(config: Record<string, any>): Promise<boolean> { return !!config.channelId; }
    getRegistrations() { return this.workflowRegistrations; }
}
