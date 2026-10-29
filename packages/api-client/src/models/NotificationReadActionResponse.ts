/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response after marking a single notification as read.
 */
export type NotificationReadActionResponse = {
    /**
     * Notification ID
     */
    id: number;
    /**
     * Updated read status flag
     */
    is_read?: boolean;
    /**
     * Timestamp read state was updated
     */
    read_at: string;
};

