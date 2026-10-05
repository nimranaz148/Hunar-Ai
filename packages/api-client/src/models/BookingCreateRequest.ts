/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload for creating a mentor service booking request.
 */
export type BookingCreateRequest = {
    service_id: string;
    /**
     * Questions or goals for the session
     */
    notes?: (string | null);
    /**
     * Optional preferred session timestamp
     */
    scheduled_at?: (string | null);
};

