/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeatureFlagsService {
    /**
     * Get Runtime Feature Flags
     * Public runtime read for enabled feature flags.
     * @returns boolean Successful Response
     * @throws ApiError
     */
    public static getRuntimeFeatureFlagsApiV1FeatureFlagsGet(): CancelablePromise<Record<string, boolean>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/feature-flags',
        });
    }
}
