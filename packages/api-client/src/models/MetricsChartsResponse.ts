/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChannelMetricTotals } from './ChannelMetricTotals';
import type { MetricsChartPoint } from './MetricsChartPoint';
import type { MetricsSummaryTotals } from './MetricsSummaryTotals';
import type { TopPerformingContent } from './TopPerformingContent';

export type MetricsChartsResponse = {
    business_id: string;
    timeframe_days?: (number | null);
    start_date?: (string | null);
    end_date?: (string | null);
    summary: MetricsSummaryTotals;
    timeline: Array<MetricsChartPoint>;
    channels: Array<ChannelMetricTotals>;
    top_content: Array<TopPerformingContent>;
};
