/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Session or request item on the mentor dashboard (PRD §5 F-024 / D-002).
 */
export type MentorDashboardSessionItem = {
    id: string;
    service_id: string;
    service_title: string;
    service_type: string;
    entrepreneur_id: string;
    entrepreneur_name: string;
    status: string;
    amount_pkr: number;
    duration_min: number;
    scheduled_at?: (string | null);
    notes?: (string | null);
    session_notes?: (string | null);
    payment_status?: string;
    created_at: string;
};

