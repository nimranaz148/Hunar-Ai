/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload for updating booking status or scheduling details (PRD §10 W-005, §13.2).
 */
export type BookingUpdateRequest = {
    /**
     * New status (e.g. cancelled, accepted, completed, declined)
     */
    status?: (string | null);
    /**
     * Updated notes
     */
    notes?: (string | null);
    /**
     * Notes from the completed session
     */
    session_notes?: (string | null);
    /**
     * Scheduled session timestamp
     */
    scheduled_at?: (string | null);
};

