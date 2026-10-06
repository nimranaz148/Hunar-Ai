/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary item in bookings list (PRD §5 F-019, F-020).
 */
export type BookingItemResponse = {
    id: string;
    service_id: string;
    service_title: string;
    service_type: string;
    mentor_id: string;
    mentor_name: string;
    mentor_avatar_url?: (string | null);
    entrepreneur_id: string;
    entrepreneur_name: string;
    status: string;
    amount_pkr: number;
    duration_min: number;
    scheduled_at?: (string | null);
    created_at: string;
    payment_status?: string;
};

