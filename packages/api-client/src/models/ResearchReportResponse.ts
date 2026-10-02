/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Competitor & trend research report response.
 */
export type ResearchReportResponse = {
    id: string;
    business_id: string;
    competitors?: Array<Record<string, any>>;
    how_to_be_better?: Array<string>;
    hashtags?: Record<string, any>;
    confidence: number;
    source_urls?: Array<string>;
    researched_at?: (string | null);
    created_at?: (string | null);
};

