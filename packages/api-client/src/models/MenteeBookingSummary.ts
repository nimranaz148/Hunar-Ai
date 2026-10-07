/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Session booking history between this mentor and mentee.
 */
export type MenteeBookingSummary = {
    id: string;
    service_title: string;
    service_type: string;
    scheduled_at?: (string | null);
    status: string;
    amount_pkr: number;
    duration_min: number;
    notes?: (string | null);
    session_notes?: (string | null);
    created_at: string;
};

