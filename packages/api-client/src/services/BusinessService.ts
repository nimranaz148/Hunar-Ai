/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessResponse } from '../models/BusinessResponse';
import type { UpdateBusinessRequest } from '../models/UpdateBusinessRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusinessService {
    /**
     * Get current entrepreneur's business profile
     * Retrieve the business profile owned by the authenticated entrepreneur.
     * @returns BusinessResponse Successful Response
     * @throws ApiError
     */
    public static getCurrentUserBusinessApiV1BusinessesGet(): CancelablePromise<BusinessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses',
        });
    }
    /**
     * Get business profile by ID
     * Retrieve business profile by ID (owner or super_admin only).
     * @returns BusinessResponse Successful Response
     * @throws ApiError
     */
    public static getBusinessApiV1BusinessesBusinessIdGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<BusinessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update business profile
     * Update business profile details (owner only).
     * @returns BusinessResponse Successful Response
     * @throws ApiError
     */
    public static updateBusinessApiV1BusinessesBusinessIdPatch({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody: UpdateBusinessRequest,
    }): CancelablePromise<BusinessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/businesses/{business_id}',
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
}
