/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload for submitting a mentor rating and review post-session (PRD §5 F-041, §10 W-005, §13.2).
 */
export type BookingReviewRequest = {
    /**
     * Rating from 1 (lowest) to 5 (highest) stars
     */
    rating: number;
    /**
     * Optional feedback comment (up to 1000 characters)
     */
    comment?: (string | null);
};

