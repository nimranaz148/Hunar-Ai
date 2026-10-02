/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Execution span item in the run timeline tree.
 */
export type AdminSpanResponse = {
    id: number;
    trace_id: string;
    span_id: string;
    parent_id?: (string | null);
    span_type: string;
    started_at?: (string | null);
    ended_at?: (string | null);
    data?: (Record<string, any> | null);
    error?: (Record<string, any> | null);
};

