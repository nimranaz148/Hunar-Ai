/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Step progress item rendered in the overlay (PRD §648-667).
 */
export type AgentProgressStep = {
    /**
     * Step label (e.g. Research, Strategy, Batch Writing)
     */
    name: string;
    /**
     * Current state of this sub-step
     */
    status?: AgentProgressStep.status;
    /**
     * Specific detail or count (e.g. 3 competitors found)
     */
    detail?: string;
};
export namespace AgentProgressStep {
    /**
     * Current state of this sub-step
     */
    export enum status {
        PENDING = 'pending',
        IN_PROGRESS = 'in_progress',
        COMPLETED = 'completed',
        FAILED = 'failed',
    }
}

