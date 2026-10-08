/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CohortFunnelStage = {
    stage: 'signed_up' | 'plan_approved' | 'first_post' | 'first_order';
    label: string;
    count: number;
    percentage: number;
    step_conversion_rate: number;
};
