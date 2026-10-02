/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminUserResponse } from './AdminUserResponse';
/**
 * Admin response including temporary password for onboarding.
 */
export type AdminCreateUserResponse = {
    user: AdminUserResponse;
    temporary_password: string;
};

