/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserResponse } from './UserResponse';
/**
 * Login and refresh token response.
 */
export type TokenResponse = {
    access_token: string;
    token_type?: string;
    user: UserResponse;
};

