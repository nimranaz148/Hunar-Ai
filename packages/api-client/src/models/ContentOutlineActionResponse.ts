/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentCalendarResponse } from './ContentCalendarResponse';
/**
 * Response after approving or revising the content outline.
 */
export type ContentOutlineActionResponse = {
    status: string;
    message: string;
    calendar: ContentCalendarResponse;
};

