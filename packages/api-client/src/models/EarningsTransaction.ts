/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single mentoring session transaction entry in the earnings ledger (F-026).
 */
export type EarningsTransaction = {
    booking_id: string;
    mentee_name: string;
    service_title: string;
    service_type: string;
    amount_pkr: number;
    payment_status: string;
    booking_status: string;
    scheduled_at?: (string | null);
    completed_at?: (string | null);
    created_at: string;
};

