/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Actionable upcoming task for quick-execution checklist.
 */
export type DashboardTaskItem = {
    id: string;
    title: string;
    category: string;
    week: number;
    order_index?: number;
    status: string;
    due_date?: (string | null);
};

