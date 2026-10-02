/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompetitorItem } from './CompetitorItem';
/**
 * Validation report response schema.
 */
export type ValidationReportResponse = {
    id: string;
    business_id: string;
    competitors?: Array<CompetitorItem>;
    how_to_be_better?: Array<string>;
    confidence?: ValidationReportResponse.confidence;
    demand_summary?: string;
    pricing_insight?: string;
    reasoning?: string;
    created_at?: string;
    updated_at?: (string | null);
};
export namespace ValidationReportResponse {
    export enum confidence {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
    }
}

