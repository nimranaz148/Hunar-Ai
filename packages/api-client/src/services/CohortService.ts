/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CohortDashboardResponse } from '../models/CohortDashboardResponse';
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
}
