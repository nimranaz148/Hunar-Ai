/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookingItemResponse } from './BookingItemResponse';
export type PaginatedResponse_BookingItemResponse_ = {
    /**
     * Page items
     */
    items: Array<BookingItemResponse>;
    /**
     * Total count of matching items
     */
    total: number;
    /**
     * Current page number (1-indexed)
     */
    page: number;
    /**
     * Number of items per page
     */
    page_size: number;
};

