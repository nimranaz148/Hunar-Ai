/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response representation of a metrics snapshot.
 */
export type MetricsSnapshotResponse = {
    id: string;
    business_id: string;
    content_item_id?: (string | null);
    content_item_title?: (string | null);
    platform: string;
    period_start: string;
    period_end: string;
    views: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    follower_delta: number;
    inquiries: number;
    orders: number;
    revenue_pkr: number;
    created_at: string;
    updated_at?: (string | null);
};

