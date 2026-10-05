/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
}
