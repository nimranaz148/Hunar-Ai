/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
}
