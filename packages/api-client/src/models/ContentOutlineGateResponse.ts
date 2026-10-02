/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentCalendarResponse } from './ContentCalendarResponse';
import type { ResearchReportResponse } from './ResearchReportResponse';
/**
 * Human Gate 2 composite overview response.
 */
export type ContentOutlineGateResponse = {
    calendar: ContentCalendarResponse;
    research?: (ResearchReportResponse | null);
};

