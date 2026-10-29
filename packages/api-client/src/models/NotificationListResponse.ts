/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationItemResponse } from './NotificationItemResponse';
/**
 * Paginated notifications response including overall unread count.
 */
export type NotificationListResponse = {
    /**
     * List of notification items
     */
    items?: Array<NotificationItemResponse>;
    /**
     * Total notifications matching query
     */
    total?: number;
    /**
     * Total unread notifications for current user
     */
    unread_count?: number;
    /**
     * Current page number
     */
    page?: number;
    /**
     * Number of items per page
     */
    page_size?: number;
};

