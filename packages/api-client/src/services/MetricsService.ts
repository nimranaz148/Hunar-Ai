/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetricsChartsResponse } from '../models/MetricsChartsResponse';
import type { MetricsProgressResponse } from '../models/MetricsProgressResponse';
import type { MetricsSnapshotCreate } from '../models/MetricsSnapshotCreate';
import type { MetricsSnapshotResponse } from '../models/MetricsSnapshotResponse';
import type { PaginatedResponse_MetricsSnapshotResponse_ } from '../models/PaginatedResponse_MetricsSnapshotResponse_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class MetricsService {
    /**
     * Log manual performance metrics snapshot (F-015)
     * Record manual metrics snapshot (Instagram/Facebook, engagement, conversions, revenue).
     * @returns MetricsSnapshotResponse Successful Response
     * @throws ApiError
     */
    public static logMetricsSnapshotApiV1BusinessesBusinessIdMetricsPost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody: MetricsSnapshotCreate,
    }): CancelablePromise<MetricsSnapshotResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/metrics',
            path: {
                'business_id': businessId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * List metrics snapshots for a business (F-015)
     * Retrieve historical metrics snapshots with optional date range and platform filters.
     * @returns PaginatedResponse_MetricsSnapshotResponse_ Successful Response
     * @throws ApiError
     */
    public static listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet({
        businessId,
        page = 1,
        pageSize = 20,
        platform,
        startDate,
        endDate,
    }: {
        businessId: string,
        page?: number,
        pageSize?: number,
        platform?: (string | null),
        startDate?: (string | null),
        endDate?: (string | null),
    }): CancelablePromise<PaginatedResponse_MetricsSnapshotResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/metrics',
            path: {
                'business_id': businessId,
            },
            query: {
                'page': page,
                'page_size': pageSize,
                'platform': platform,
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get 3-day coaching progress indicator (PRD §10 W-004)
     * Check how many days of metrics have been logged toward the 3-day Weekly Coach threshold.
     * @returns MetricsProgressResponse Successful Response
     * @throws ApiError
     */
    public static getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<MetricsProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/metrics/progress',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get aggregated performance charts data (F-016)
     * Retrieve timeseries timeline, channel comparison, and summary metrics for visualization.
     * @returns MetricsChartsResponse Successful Response
     * @throws ApiError
     */
    public static getMetricsChartsApiV1BusinessesBusinessIdMetricsChartsGet({
        businessId,
        days = 30,
        platform,
    }: {
        businessId: string,
        days?: (number | null),
        platform?: (string | null),
    }): CancelablePromise<MetricsChartsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/metrics/charts',
            path: {
                'business_id': businessId,
            },
            query: {
                'days': days,
                'platform': platform,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get single metrics snapshot detail (F-015)
     * Retrieve specific metrics snapshot details.
     * @returns MetricsSnapshotResponse Successful Response
     * @throws ApiError
     */
    public static getSingleMetricSnapshotApiV1BusinessesBusinessIdMetricsSnapshotIdGet({
        businessId,
        snapshotId,
    }: {
        businessId: string,
        snapshotId: string,
    }): CancelablePromise<MetricsSnapshotResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/metrics/{snapshot_id}',
            path: {
                'business_id': businessId,
                'snapshot_id': snapshotId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
