/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin request to modify user role or status.
 */
export type AdminUpdateUserRequest = {
    role?: ('entrepreneur' | 'mentor' | 'super_admin' | null);
    status?: ('active' | 'suspended' | 'pending' | null);
    name?: (string | null);
};

