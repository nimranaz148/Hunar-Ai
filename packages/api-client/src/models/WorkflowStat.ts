/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Aggregated metrics per workflow type.
 */
export type WorkflowStat = {
    /**
     * Workflow identifier
     */
    workflow: string;
    /**
     * Total runs for this workflow
     */
    total_runs?: number;
    /**
     * Average runtime duration in seconds
     */
    avg_latency_seconds?: number;
    /**
     * Failure rate percentage (0-100)
     */
    failure_rate_pct?: number;
};

