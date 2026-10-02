/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminAgentRunResponse } from './AdminAgentRunResponse';
import type { AdminSpanResponse } from './AdminSpanResponse';
/**
 * Detailed view of an agent workflow run with all child spans.
 */
export type AdminAgentRunDetailResponse = {
    run: AdminAgentRunResponse;
    spans: Array<AdminSpanResponse>;
};

