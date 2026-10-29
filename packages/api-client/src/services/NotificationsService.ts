/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationListResponse } from '../models/NotificationListResponse';
import type { NotificationReadActionResponse } from '../models/NotificationReadActionResponse';
import type { NotificationReadAllResponse } from '../models/NotificationReadAllResponse';
import type { UnreadCountResponse } from '../models/UnreadCountResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * List Notifications
     * List paginated notifications for current authenticated user (F-038).
     * @returns NotificationListResponse Successful Response
     * @throws ApiError
     */
    public static listNotificationsApiV1NotificationsGet({
        unreadOnly = false,
        page = 1,
        pageSize = 20,
    }: {
        /**
         * Filter for unread notifications only
         */
        unreadOnly?: boolean,
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        pageSize?: number,
    }): CancelablePromise<NotificationListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications',
            query: {
                'unread_only': unreadOnly,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Notifications Unread Count
     * Retrieve total count of unread notifications for current authenticated user.
     * @returns UnreadCountResponse Successful Response
     * @throws ApiError
     */
    public static getNotificationsUnreadCountApiV1NotificationsUnreadCountGet(): CancelablePromise<UnreadCountResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications/unread-count',
        });
    }
    /**
     * Mark Single Notification Read
     * Mark a single user notification as read.
     * @returns NotificationReadActionResponse Successful Response
     * @throws ApiError
     */
    public static markSingleNotificationReadApiV1NotificationsNotificationIdReadPatch({
        notificationId,
    }: {
        notificationId: number,
    }): CancelablePromise<NotificationReadActionResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/notifications/{notification_id}/read',
            path: {
                'notification_id': notificationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Mark All Notifications Read
     * Mark all unread notifications for current user as read.
     * @returns NotificationReadAllResponse Successful Response
     * @throws ApiError
     */
    public static markAllNotificationsReadApiV1NotificationsReadAllPost(): CancelablePromise<NotificationReadAllResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/read-all',
        });
    }
}
