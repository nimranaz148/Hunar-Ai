/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerateValidationReportRequest } from '../models/GenerateValidationReportRequest';
import type { ValidationReportResponse } from '../models/ValidationReportResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ValidationService {
    /**
     * Get business validation report
     * Retrieve existing validation report for the business.
     * @returns ValidationReportResponse Successful Response
     * @throws ApiError
     */
    public static getReportApiV1BusinessesBusinessIdValidationGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ValidationReportResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/validation',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate or refresh validation report
     * Trigger Idea Validator agent to produce or refresh market feasibility and competitor report.
     * @returns ValidationReportResponse Successful Response
     * @throws ApiError
     */
    public static generateReportApiV1BusinessesBusinessIdValidationGeneratePost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody?: GenerateValidationReportRequest,
    }): CancelablePromise<ValidationReportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/validation/generate',
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
