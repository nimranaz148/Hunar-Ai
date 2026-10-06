/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload for creating a new mentor coaching service (PRD §5 F-022).
 */
export type MentorServiceCreateRequest = {
    title: string;
    description: string;
    /**
     * Service niche: food, stitching_fashion, beauty, handmade, tutoring, digital
     */
    niche: string;
    /**
     * Service type: session, review, done_with_you, package
     */
    type: string;
    /**
     * Price in PKR
     */
    price_pkr: number;
    /**
     * Duration in minutes (15-180, step 15)
     */
    duration_min?: number;
    active?: boolean;
};

