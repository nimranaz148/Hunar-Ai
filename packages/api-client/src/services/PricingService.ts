/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PricingCalculateRequest } from '../models/PricingCalculateRequest';
import type { PricingResultResponse } from '../models/PricingResultResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PricingService {
    /**
     * Get business pricing results
     * Retrieve all calculated pricing results for the business.
     * @returns PricingResultResponse Successful Response
     * @throws ApiError
     */
    public static getPricingApiV1BusinessesBusinessIdPricingGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<Array<PricingResultResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/pricing',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Calculate or recalculate pricing economics
     * Run Pricing Agent to calculate cost-based pricing, unit margins, and break-even.
     * @returns PricingResultResponse Successful Response
     * @throws ApiError
     */
    public static calculatePricingApiV1BusinessesBusinessIdPricingCalculatePost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody?: PricingCalculateRequest,
    }): CancelablePromise<Array<PricingResultResponse>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/pricing/calculate',
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
     * Approve pricing result
     * Approve a specific product pricing calculation.
     * @returns PricingResultResponse Successful Response
     * @throws ApiError
     */
    public static approvePricingApiV1BusinessesBusinessIdPricingPricingIdApprovePost({
        businessId,
        pricingId,
    }: {
        businessId: string,
        pricingId: string,
    }): CancelablePromise<PricingResultResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/pricing/{pricing_id}/approve',
            path: {
                'business_id': businessId,
                'pricing_id': pricingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
