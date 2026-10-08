/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CohortDashboardResponse } from '../models/CohortDashboardResponse';
import type { StalledListResponse } from '../models/StalledListResponse';
import type { NudgeStalledBusinessResponse } from '../models/NudgeStalledBusinessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CohortService {
    /**
     * Get Cohort Dashboard
     * Retrieve aggregate cohort conversion funnel, KPIs, and stalled business alerts.
     * @returns CohortDashboardResponse Successful Response
     * @throws ApiError
     */
    public static getCohortDashboard({
        programId,
    }: {
        programId?: (string | null);
    } = {}): CancelablePromise<CohortDashboardResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/cohort/dashboard',
            query: {
                'program_id': programId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Program Not Found`,
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get Stalled Businesses List
     * Retrieve full paginated and filterable stalled businesses list (F-029).
     * @returns StalledListResponse Successful Response
     * @throws ApiError
     */
    public static getStalledBusinesses({
        programId,
        reasonFilter,
        search,
        page = 1,
        pageSize = 20,
    }: {
        programId?: (string | null);
        reasonFilter?: (string | null);
        search?: (string | null);
        page?: number;
        pageSize?: number;
    } = {}): CancelablePromise<StalledListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/cohort/stalled',
            query: {
                'program_id': programId,
                'reason_filter': reasonFilter,
                'search': search,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Program Not Found`,
                422: `Validation Error`,
            },
        });
    }

    /**
     * Trigger Stalled Business Nudge
     * Record an administrator outreach/nudge event and log to audit trail (F-029).
     * @returns NudgeStalledBusinessResponse Successful Response
     * @throws ApiError
     */
    public static triggerNudge({
        businessId,
    }: {
        businessId: string;
    }): CancelablePromise<NudgeStalledBusinessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/cohort/stalled/{business_id}/nudge',
            path: {
                'business_id': businessId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Business Not Found`,
                422: `Validation Error`,
            },
        });
    }
}
