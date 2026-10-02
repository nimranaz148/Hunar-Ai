/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangePasswordRequest } from '../models/ChangePasswordRequest';
import type { LoginRequest } from '../models/LoginRequest';
import type { RefreshTokenRequest } from '../models/RefreshTokenRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { TokenResponse } from '../models/TokenResponse';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Register a new entrepreneur account (F-001)
     * Register a new user account with entrepreneur role.
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static registerApiV1AuthRegisterPost({
        requestBody,
    }: {
        requestBody: RegisterRequest,
    }): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Authenticate user and receive token pair (F-002)
     * Authenticate with email and password.
     * @returns TokenResponse Successful Response
     * @throws ApiError
     */
    public static loginApiV1AuthLoginPost({
        requestBody,
    }: {
        requestBody: LoginRequest,
    }): CancelablePromise<TokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Rotate refresh token and get a new access token
     * Rotate an active refresh token.
     * @returns TokenResponse Successful Response
     * @throws ApiError
     */
    public static refreshApiV1AuthRefreshPost({
        refreshToken,
        requestBody,
    }: {
        refreshToken?: (string | null),
        requestBody?: (RefreshTokenRequest | null),
    }): CancelablePromise<TokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/refresh',
            cookies: {
                'refresh_token': refreshToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Revoke refresh token and clear authentication session
     * Revoke refresh token and log user out.
     * @returns string Successful Response
     * @throws ApiError
     */
    public static logoutApiV1AuthLogoutPost({
        refreshToken,
        requestBody,
    }: {
        refreshToken?: (string | null),
        requestBody?: (RefreshTokenRequest | null),
    }): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout',
            cookies: {
                'refresh_token': refreshToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get current authenticated user profile
     * Return profile for the currently logged-in user.
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static getMeApiV1AuthMeGet(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/me',
        });
    }
    /**
     * Change user password (F-039)
     * Change current authenticated user password and invalidate old sessions.
     * @returns string Successful Response
     * @throws ApiError
     */
    public static changePasswordApiV1AuthChangePasswordPost({
        requestBody,
    }: {
        requestBody: ChangePasswordRequest,
    }): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
