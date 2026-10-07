/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MonthlyEarningSummary = {
    year: number;
    /** 1-12 */
    month: number;
    /** e.g. "Oct 2026" */
    month_label: string;
    sessions_completed: number;
    earned_pkr: number;
    refunded_pkr: number;
};
