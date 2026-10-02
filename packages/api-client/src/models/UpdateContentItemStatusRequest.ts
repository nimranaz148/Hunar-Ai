/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request payload for updating content item status.
 */
export type UpdateContentItemStatusRequest = {
    /**
     * draft, approved, posted, skipped, needs_review
     */
    status: string;
    /**
     * Optional live post URL
     */
    post_url?: (string | null);
};

