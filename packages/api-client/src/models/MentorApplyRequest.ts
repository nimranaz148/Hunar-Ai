/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * F-040 Mentor application request payload.
 */
export type MentorApplyRequest = {
    /**
     * Mentor full name
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
     * City of residence
     */
    city: string;
    /**
     * Professional bio and experience
     */
    bio: string;
    /**
     * Industry and expertise niches
     */
    niches: Array<string>;
    /**
     * Languages spoken by the mentor
     */
    languages?: Array<string>;
    /**
     * Optional profile photo URL
     */
    avatar_url?: (string | null);
};

