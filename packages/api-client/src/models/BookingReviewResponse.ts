/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Review and rating details for a completed session (PRD §5 F-041, §12.3).
 */
export type BookingReviewResponse = {
    id: string;
    booking_id: string;
    mentor_id: string;
    entrepreneur_id: string;
    rating: number;
    comment?: (string | null);
    created_at: string;
};

