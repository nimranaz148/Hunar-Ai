/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Detailed breakdown for a single funnel milestone.
 */
export type CohortFunnelStage = {
    stage: CohortFunnelStage.stage;
    label: string;
    count: number;
    /**
     * Percentage of total enrolled entrepreneurs
     */
    percentage: number;
    /**
     * Conversion rate from previous step
     */
    step_conversion_rate: number;
};
export namespace CohortFunnelStage {
    export enum stage {
        SIGNED_UP = 'signed_up',
        PLAN_APPROVED = 'plan_approved',
        FIRST_POST = 'first_post',
        FIRST_ORDER = 'first_order',
    }
}

