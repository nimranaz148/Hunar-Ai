/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CohortFunnelStage } from './CohortFunnelStage';

export type CohortFunnelData = {
    signed_up: number;
    plan_approved: number;
    first_post: number;
    first_order: number;
    stages: Array<CohortFunnelStage>;
};
