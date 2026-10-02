/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlanTaskResponse } from './PlanTaskResponse';
/**
 * 30-day launch plan schema with tasks.
 */
export type LaunchPlanResponse = {
    id: string;
    business_id: string;
    status: string;
    summary?: string;
    revision_notes?: (string | null);
    approved_at?: (string | null);
    tasks?: Array<PlanTaskResponse>;
    created_at?: string;
    updated_at?: (string | null);
};

