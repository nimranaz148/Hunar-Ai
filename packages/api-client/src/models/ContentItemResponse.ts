/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single-day content item with post captions, visual prompts, and tracking (PRD §12.3, F-011, F-012, F-013).
 */
export type ContentItemResponse = {
    id: string;
    calendar_id: string;
    day: number;
    date: string;
    platform?: Array<string>;
    format: string;
    pillar: string;
    goal: string;
    hook: string;
    caption: string;
    cta?: (string | null);
    hashtags?: Array<string>;
    best_time_hint?: (string | null);
    image_prompt?: (Record<string, any> | null);
    video_prompt?: (Record<string, any> | null);
    alt_text?: (string | null);
    status: string;
    posted_at?: (string | null);
    post_url?: (string | null);
    created_at?: (string | null);
    updated_at?: (string | null);
};

