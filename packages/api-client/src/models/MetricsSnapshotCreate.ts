/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MetricsSnapshotCreate = {
    /**
     * Optional content item ID to link metrics directly to a scheduled/published post
     */
    content_item_id?: (string | null);
    /**
     * Social media platform for this metrics snapshot
     */
    platform: 'instagram' | 'facebook';
    /**
     * Start date of the reporting period
     */
    period_start: string;
    /**
     * End date of the reporting period (must be >= period_start)
     */
    period_end: string;
    /**
     * Video views / impressions (>= 0)
     */
    views?: number;
    /**
     * Unique accounts reached (>= 0)
     */
    reach?: number;
    /**
     * Post likes (>= 0)
     */
    likes?: number;
    /**
     * Comments received (>= 0)
     */
    comments?: number;
    /**
     * Post shares (>= 0)
     */
    shares?: number;
    /**
     * Post bookmarks/saves (>= 0)
     */
    saves?: number;
    /**
     * Net follower count change (can be positive, zero, or negative)
     */
    follower_delta?: number;
    /**
     * Customer inquiries via DMs / WhatsApp messages (>= 0)
     */
    inquiries?: number;
    /**
     * Confirmed orders received (>= 0)
     */
    orders?: number;
    /**
     * Revenue in PKR generated during the period (>= 0)
     */
    revenue_pkr?: number;
};
