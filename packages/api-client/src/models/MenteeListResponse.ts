/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MenteeListItem } from './MenteeListItem';
/**
 * Response containing list of mentees booked with the mentor.
 */
export type MenteeListResponse = {
    mentees: Array<MenteeListItem>;
    total_count: number;
};

