/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookingReviewResponse } from './BookingReviewResponse';
/**
 * Detailed booking view with full service context and payment state.
 */
export type BookingDetailResponse = {
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
    payment_status: string;
    notes?: (string | null);
    session_notes?: (string | null);
    service_description: string;
    review?: (BookingReviewResponse | null);
    updated_at?: (string | null);
};

