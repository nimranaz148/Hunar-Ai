export type NotificationItemResponse = {
    id: number;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
    read_at?: string | null;
};
