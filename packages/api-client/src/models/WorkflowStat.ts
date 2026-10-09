export type WorkflowStat = {
    workflow: string;
    total_runs: number;
    avg_latency_seconds: number;
    failure_rate_pct: number;
};
