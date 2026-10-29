/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HourlyRunStat } from './HourlyRunStat';
import type { TopUserRunStat } from './TopUserRunStat';
import type { WorkflowStat } from './WorkflowStat';
/**
 * Super Admin system usage and telemetry response (D-004 / PRD §29.4).
 */
export type UsageStatsResponse = {
    /**
     * Distinct users active today
     */
    active_users_today?: number;
    /**
     * Total workflow runs today
     */
    runs_today_total?: number;
    /**
     * Succeeded runs today
     */
    runs_today_succeeded?: number;
    /**
     * Failed/blocked runs today
     */
    runs_today_failed?: number;
    /**
     * Average agent runtime in seconds
     */
    avg_latency_seconds?: number;
    /**
     * Agent workflow error rate percentage
     */
    error_rate_pct?: number;
    /**
     * 24-hour activity trend
     */
    runs_per_hour?: Array<HourlyRunStat>;
    /**
     * Breakdown by workflow type
     */
    workflows?: Array<WorkflowStat>;
    /**
     * Top users by workflow execution volume
     */
    top_users?: Array<TopUserRunStat>;
};

