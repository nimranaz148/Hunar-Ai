/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Public user profile response.
 */
export type UserResponse = {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    language?: string;
    force_password_change?: boolean;
    program_id?: (string | null);
    created_at?: (string | null);
};

