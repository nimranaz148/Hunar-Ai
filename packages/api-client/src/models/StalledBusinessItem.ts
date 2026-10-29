/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Item representing a business flagged as stalled.
 */
export type StalledBusinessItem = {
    business_id: string;
    business_name: string;
    owner_id: string;
    owner_name: string;
    owner_email: string;
    program_id?: (string | null);
    program_name?: (string | null);
    reason: string;
    days_since_last_post?: (number | null);
    days_since_last_metric?: (number | null);
    overdue_task_count?: number;
    last_activity_at?: (string | null);
};

