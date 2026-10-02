/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single task item within the 30-day launch roadmap.
 */
export type PlanTaskResponse = {
    id: string;
    plan_id: string;
    title: string;
    description?: string;
    week: number;
    category?: string;
    due_date?: (string | null);
    status?: PlanTaskResponse.status;
    order_index?: number;
    created_at?: string;
    updated_at?: (string | null);
};
export namespace PlanTaskResponse {
    export enum status {
        PENDING = 'pending',
        IN_PROGRESS = 'in_progress',
        COMPLETED = 'completed',
        SKIPPED = 'skipped',
    }
}

