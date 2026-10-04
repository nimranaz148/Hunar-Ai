/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentItemResponse } from './ContentItemResponse';
import type { DashboardTaskItem } from './DashboardTaskItem';
import type { TrendPoint } from './TrendPoint';
/**
 * Consolidated KPI and status metrics for Entrepreneur Home Dashboard (D-001).
 */
export type EntrepreneurDashboardResponse = {
    business_id: string;
    business_name: string;
    niche: string;
    city: string;
    /**
     * Count of completed launch tasks
     */
    tasks_done_count: number;
    /**
     * Total count of launch roadmap tasks
     */
    total_tasks_count: number;
    /**
     * Count of posted content items
     */
    posts_published_count: number;
    /**
     * Total count of 30-day content items
     */
    total_posts_count: number;
    /**
     * 7-day engagement percentage trend (▲/▼)
     */
    engagement_change_pct: number;
    /**
     * Revenue achieved this week in PKR
     */
    revenue_this_week_pkr: number;
    /**
     * Spotlight post for today
     */
    today_post?: (ContentItemResponse | null);
    /**
     * 7-day engagement points for visual chart
     */
    trend_7d?: Array<TrendPoint>;
    /**
     * Top pending roadmap tasks
     */
    upcoming_tasks?: Array<DashboardTaskItem>;
};

