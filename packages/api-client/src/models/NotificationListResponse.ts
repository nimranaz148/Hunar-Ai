import type { NotificationItemResponse } from './NotificationItemResponse';

export type NotificationListResponse = {
    items: Array<NotificationItemResponse>;
    total: number;
    unread_count: number;
    page: number;
    page_size: number;
};
