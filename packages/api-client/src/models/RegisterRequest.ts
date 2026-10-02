/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * F-001 Signup request payload.
 */
export type RegisterRequest = {
    /**
     * User full name
     */
    name: string;
    /**
     * Unique email address
     */
    email: string;
    /**
     * Password with min 8 chars, 1 uppercase, 1 digit
     */
    password: string;
    /**
     * Preferred interface and content language
     */
    language?: RegisterRequest.language;
    /**
     * Optional cohort invite code linking to a program
     */
    invite_code?: (string | null);
};
export namespace RegisterRequest {
    /**
     * Preferred interface and content language
     */
    export enum language {
        EN = 'en',
        UR = 'ur',
        ROMAN_UR = 'roman_ur',
    }
}

