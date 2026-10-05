/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Public/Browse summary of a mentor profile.
 */
export type MentorSummaryResponse = {
    id: string;
    user_id: string;
    name: string;
    city: string;
    bio: string;
    niches: Array<string>;
    languages: Array<string>;
    avatar_url?: (string | null);
    rating: number;
    review_count: number;
    status: string;
};

