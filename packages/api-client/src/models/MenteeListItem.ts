/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary item for a mentee who has booked sessions with the mentor.
 */
export type MenteeListItem = {
    entrepreneur_id: string;
    name: string;
    email: string;
    business_name?: (string | null);
    business_niche?: (string | null);
    business_city?: (string | null);
    total_bookings: number;
    latest_booking_status: string;
    latest_booking_date?: (string | null);
    tasks_completed?: number;
    tasks_total?: number;
};

