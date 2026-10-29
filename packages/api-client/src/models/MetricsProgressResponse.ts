/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Tracking progress toward the 3-day Weekly Coach threshold (PRD §10 W-004).
 */
export type MetricsProgressResponse = {
    total_days_logged: number;
    target_days?: number;
    threshold_met: boolean;
    latest_snapshot_date?: (string | null);
};

