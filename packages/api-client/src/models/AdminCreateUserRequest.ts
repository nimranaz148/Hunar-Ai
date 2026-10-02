/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin request to create a user with a generated temporary password.
 */
export type AdminCreateUserRequest = {
    name: string;
    email: string;
    role: AdminCreateUserRequest.role;
    language?: AdminCreateUserRequest.language;
    program_id?: (string | null);
};
export namespace AdminCreateUserRequest {
    export enum role {
        ENTREPRENEUR = 'entrepreneur',
        MENTOR = 'mentor',
        SUPER_ADMIN = 'super_admin',
    }
    export enum language {
        EN = 'en',
        UR = 'ur',
        ROMAN_UR = 'roman_ur',
    }
}

