/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LaunchPlanResponse } from './LaunchPlanResponse';
/**
 * Consolidated Plan Approval Gate (Human Gate 1 / Wireframe §30.2) response.
 */
export type Gate1OverviewResponse = {
    plan: LaunchPlanResponse;
    validation_snapshot?: Record<string, any>;
    pricing_snapshot?: Array<Record<string, any>>;
    /**
     * Current gate status (awaiting_approval, approved, revision_requested)
     */
    gate_status: string;
};

