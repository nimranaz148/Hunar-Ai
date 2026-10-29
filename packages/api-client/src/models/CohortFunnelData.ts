/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CohortFunnelStage } from './CohortFunnelStage';
/**
 * Cumulative counts and stage-by-stage conversion metrics for cohort funnel.
 */
export type CohortFunnelData = {
    signed_up: number;
    plan_approved: number;
    first_post: number;
    first_order: number;
    stages?: Array<CohortFunnelStage>;
};

