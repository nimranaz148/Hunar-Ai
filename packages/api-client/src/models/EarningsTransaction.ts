/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EarningsTransaction = {
    booking_id: string;
    mentee_name: string;
    service_title: string;
    service_type: string;
    amount_pkr: number;
    /** held | released | refunded */
    payment_status: string;
    /** requested | accepted | scheduled | completed | cancelled | reviewed | declined */
    booking_status: string;
    scheduled_at?: string | null;
    completed_at?: string | null;
    created_at: string;
};
