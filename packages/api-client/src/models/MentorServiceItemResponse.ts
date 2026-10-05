/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Item in the mentor services catalog/list view (PRD §5 F-018).
 */
export type MentorServiceItemResponse = {
    id: string;
    mentor_id: string;
    mentor_name: string;
    mentor_avatar_url?: (string | null);
    mentor_city: string;
    mentor_rating: number;
    mentor_review_count: number;
    title: string;
    description: string;
    niche: string;
    type: string;
    /**
     * Price in PKR
     */
    price_pkr: number;
    /**
     * Duration in minutes
     */
    duration_min: number;
    active: boolean;
    created_at: string;
};

