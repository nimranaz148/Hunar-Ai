/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single notification record schema.
 */
export type NotificationItemResponse = {
    /**
     * Notification unique sequential ID
     */
    id: number;
    /**
     * Recipient user UUID
     */
    user_id: string;
    /**
     * Notification short title
     */
    title: string;
    /**
     * Notification descriptive content
     */
    message: string;
    /**
     * Semantic notification category
     */
    type?: string;
    /**
     * Optional relative URL path for in-app navigation
     */
    link?: (string | null);
    /**
     * Read state status flag
     */
    is_read?: boolean;
    /**
     * Timestamp notification was generated
     */
    created_at: string;
    /**
     * Timestamp notification was marked read
     */
    read_at?: (string | null);
};

