/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin view of a user record.
 */
export type AdminUserResponse = {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    language?: (string | null);
    force_password_change?: boolean;
    program_id?: (string | null);
    created_at?: (string | null);
};

