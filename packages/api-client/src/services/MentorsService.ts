/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MenteeDetailResponse } from '../models/MenteeDetailResponse';
import type { MenteeListResponse } from '../models/MenteeListResponse';
import type { MentorAvailabilityResponse } from '../models/MentorAvailabilityResponse';
import type { MentorAvailabilityUpdateRequest } from '../models/MentorAvailabilityUpdateRequest';
import type { MentorDashboardResponse } from '../models/MentorDashboardResponse';
import type { MentorEarningsResponse } from '../models/MentorEarningsResponse';
import type { MentorProfileResponse } from '../models/MentorProfileResponse';
import type { MentorProfileUpdateRequest } from '../models/MentorProfileUpdateRequest';
import type { MentorServiceCreateRequest } from '../models/MentorServiceCreateRequest';
import type { MentorServiceResponse } from '../models/MentorServiceResponse';
import type { MentorServiceUpdateRequest } from '../models/MentorServiceUpdateRequest';
import type { PaginatedResponse_MentorSummaryResponse_ } from '../models/PaginatedResponse_MentorSummaryResponse_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MentorsService {
    /**
     * Browse active mentors
     * Retrieve paginated active mentors.
     * @returns PaginatedResponse_MentorSummaryResponse_ Successful Response
     * @throws ApiError
     */
    public static browseMentorsApiV1MentorsGet({
        page = 1,
        pageSize = 20,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedResponse_MentorSummaryResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors',
            query: {
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get current mentor profile (F-021)
     * Retrieve authenticated mentor's own profile for viewing or editing.
     * @returns MentorProfileResponse Successful Response
     * @throws ApiError
     */
    public static getOwnMentorProfileApiV1MentorsMeGet(): CancelablePromise<MentorProfileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me',
        });
    }
    /**
     * Update current mentor profile (F-021)
     * Update profile bio, city, niches, languages, or avatar.
     * @returns MentorProfileResponse Successful Response
     * @throws ApiError
     */
    public static updateOwnMentorProfileApiV1MentorsMePatch({
        requestBody,
    }: {
        requestBody: MentorProfileUpdateRequest,
    }): CancelablePromise<MentorProfileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/mentors/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List mentor's own services (F-022)
     * Retrieve all coaching and consultation services created by the current mentor.
     * @returns MentorServiceResponse Successful Response
     * @throws ApiError
     */
    public static listOwnMentorServicesApiV1MentorsMeServicesGet(): CancelablePromise<Array<MentorServiceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/services',
        });
    }
    /**
     * Create new mentor service (F-022)
     * Create a new service offering with title, description, niche, type, duration, and price.
     * @returns MentorServiceResponse Successful Response
     * @throws ApiError
     */
    public static createOwnMentorServiceApiV1MentorsMeServicesPost({
        requestBody,
    }: {
        requestBody: MentorServiceCreateRequest,
    }): CancelablePromise<MentorServiceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/mentors/me/services',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update mentor service (F-022)
     * Update title, description, niche, type, duration, price, or active status.
     * @returns MentorServiceResponse Successful Response
     * @throws ApiError
     */
    public static updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch({
        serviceId,
        requestBody,
    }: {
        serviceId: string,
        requestBody: MentorServiceUpdateRequest,
    }): CancelablePromise<MentorServiceResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/mentors/me/services/{service_id}',
            path: {
                'service_id': serviceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete mentor service (F-022)
     * Delete a service offering if no active bookings exist.
     * @returns void
     * @throws ApiError
     */
    public static deleteOwnMentorServiceApiV1MentorsMeServicesServiceIdDelete({
        serviceId,
    }: {
        serviceId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/mentors/me/services/{service_id}',
            path: {
                'service_id': serviceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get mentor availability schedule (F-023)
     * Retrieve current mentor's recurring weekly availability time slots.
     * @returns MentorAvailabilityResponse Successful Response
     * @throws ApiError
     */
    public static getOwnAvailabilityApiV1MentorsMeAvailabilityGet(): CancelablePromise<MentorAvailabilityResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/availability',
        });
    }
    /**
     * Update mentor availability schedule (F-023)
     * Replace recurring weekly availability time windows with audit logging.
     * @returns MentorAvailabilityResponse Successful Response
     * @throws ApiError
     */
    public static updateOwnAvailabilityApiV1MentorsMeAvailabilityPut({
        requestBody,
    }: {
        requestBody: MentorAvailabilityUpdateRequest,
    }): CancelablePromise<MentorAvailabilityResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/mentors/me/availability',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get mentor dashboard overview (F-024 / D-002)
     * Retrieve mentor dashboard with KPIs, pending requests, and upcoming sessions.
     * @returns MentorDashboardResponse Successful Response
     * @throws ApiError
     */
    public static getOwnDashboardApiV1MentorsMeDashboardGet(): CancelablePromise<MentorDashboardResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/dashboard',
        });
    }
    /**
     * List mentees booked with the mentor (F-025)
     * Retrieve all entrepreneurs who have booked sessions with the authenticated mentor.
     * @returns MenteeListResponse Successful Response
     * @throws ApiError
     */
    public static listOwnMenteesApiV1MentorsMeMenteesGet(): CancelablePromise<MenteeListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/mentees',
        });
    }
    /**
     * Get detailed mentee report and one-page brief (F-025)
     * Retrieve detailed mentee business profile, launch plan progress, and AI-generated session brief.
     * @returns MenteeDetailResponse Successful Response
     * @throws ApiError
     */
    public static getOwnMenteeDetailApiV1MentorsMeMenteesMenteeIdGet({
        menteeId,
    }: {
        menteeId: string,
    }): CancelablePromise<MenteeDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/mentees/{mentee_id}',
            path: {
                'mentee_id': menteeId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get mentor earnings report (F-026 / R-006)
     * Retrieve earnings report with KPIs, monthly trend, and transaction ledger for the authenticated mentor.
     * @returns MentorEarningsResponse Successful Response
     * @throws ApiError
     */
    public static getOwnEarningsApiV1MentorsMeEarningsGet({
        period = 'all',
    }: {
        /**
         * Time period filter: all | this_month | last_month | this_year
         */
        period?: string,
    }): CancelablePromise<MentorEarningsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mentors/me/earnings',
            query: {
                'period': period,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
