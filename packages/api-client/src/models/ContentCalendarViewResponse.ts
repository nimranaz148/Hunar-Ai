/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CalendarStatsResponse } from './CalendarStatsResponse';
import type { ContentItemResponse } from './ContentItemResponse';
/**
 * Full 30-day Content Calendar view response (F-011).
 */
export type ContentCalendarViewResponse = {
    calendar_id: string;
    business_id: string;
    status: string;
    items?: Array<ContentItemResponse>;
    stats: CalendarStatsResponse;
};

