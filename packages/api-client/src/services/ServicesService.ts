/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MentorServiceDetailResponse } from '../models/MentorServiceDetailResponse';
import type { PaginatedResponse_MentorServiceItemResponse_ } from '../models/PaginatedResponse_MentorServiceItemResponse_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServicesService {
    /**
     * Browse active mentor services (F-018)
     * Retrieve paginated active mentor services with filters.
     * @returns PaginatedResponse_MentorServiceItemResponse_ Successful Response
     * @throws ApiError
     */
    public static browseServicesApiV1ServicesGet({
        niche,
        type,
        maxPrice,
        city,
        search,
        page = 1,
        pageSize = 20,
    }: {
        /**
         * Filter by niche
         */
        niche?: (string | null),
        /**
         * Filter by service type
         */
        type?: (string | null),
        /**
         * Filter by max PKR price
         */
        maxPrice?: (number | null),
        /**
         * Filter by mentor city
         */
        city?: (string | null),
        /**
         * Search keyword in title, description, mentor name
         */
        search?: (string | null),
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedResponse_MentorServiceItemResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services',
            query: {
                'niche': niche,
                'type': type,
                'max_price': maxPrice,
                'city': city,
                'search': search,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get mentor service detail by ID
     * Retrieve full detail for a mentor service by ID.
     * @returns MentorServiceDetailResponse Successful Response
     * @throws ApiError
     */
    public static getServiceApiV1ServicesServiceIdGet({
        serviceId,
    }: {
        serviceId: string,
    }): CancelablePromise<MentorServiceDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/{service_id}',
            path: {
                'service_id': serviceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
