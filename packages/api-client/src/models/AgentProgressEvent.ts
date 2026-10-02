/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentProgressStep } from './AgentProgressStep';
/**
 * Real-time SSE event payload pushed to the client.
 */
export type AgentProgressEvent = {
    run_id: string;
    workflow: string;
    status: AgentProgressEvent.status;
    steps?: Array<AgentProgressStep>;
    error?: (string | null);
};
export namespace AgentProgressEvent {
    export enum status {
        QUEUED = 'queued',
        RUNNING = 'running',
        AWAITING_APPROVAL = 'awaiting_approval',
        SUCCEEDED = 'succeeded',
        FAILED = 'failed',
        BLOCKED = 'blocked',
    }
}

