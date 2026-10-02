/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Full update payload for content item detail editor (F-012).
 */
export type UpdateContentItemRequest = {
    hook?: (string | null);
    caption?: (string | null);
    cta?: (string | null);
    hashtags?: (Array<string> | null);
    best_time_hint?: (string | null);
    image_prompt?: (Record<string, any> | null);
    video_prompt?: (Record<string, any> | null);
    alt_text?: (string | null);
    /**
     * draft, approved, posted, skipped, needs_review
     */
    status?: (string | null);
    date?: (string | null);
};

