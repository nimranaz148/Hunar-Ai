/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin summary of an agent workflow run.
 */
export type AdminAgentRunResponse = {
    id: string;
    trace_id?: (string | null);
    workflow: string;
    user_id?: (string | null);
    business_id?: (string | null);
    status: string;
    input_summary?: (string | null);
    output_summary?: (string | null);
    error?: (string | null);
    started_at?: (string | null);
    ended_at?: (string | null);
    created_at: string;
};

