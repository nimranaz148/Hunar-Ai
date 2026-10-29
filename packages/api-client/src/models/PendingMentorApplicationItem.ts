/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin summary of a pending mentor application (F-030 / PRD §10 W-006).
 */
export type PendingMentorApplicationItem = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    city: string;
    bio: string;
    niches: Array<string>;
    languages: Array<string>;
    avatar_url?: (string | null);
    user_status: string;
    mentor_status: string;
    created_at: string;
};

