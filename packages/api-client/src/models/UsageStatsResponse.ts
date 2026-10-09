import type { HourlyRunStat } from './HourlyRunStat';
import type { WorkflowStat } from './WorkflowStat';
import type { TopUserRunStat } from './TopUserRunStat';

export type UsageStatsResponse = {
    active_users_today: number;
    runs_today_total: number;
    runs_today_succeeded: number;
    runs_today_failed: number;
    avg_latency_seconds: number;
    error_rate_pct: number;
    runs_per_hour: Array<HourlyRunStat>;
    workflows: Array<WorkflowStat>;
    top_users: Array<TopUserRunStat>;
};
