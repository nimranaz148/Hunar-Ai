/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Full mentor profile view (PRD §5 F-021, §12.3).
 */
export type MentorProfileResponse = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    city: string;
    bio: string;
    niches: Array<string>;
    languages: Array<string>;
    avatar_url?: (string | null);
    rating: number;
    review_count: number;
    status: string;
    created_at: string;
    updated_at?: (string | null);
};

