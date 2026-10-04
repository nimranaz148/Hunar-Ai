/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentCalendarViewResponse } from '../models/ContentCalendarViewResponse';
import type { ContentItemResponse } from '../models/ContentItemResponse';
import type { ContentOutlineActionResponse } from '../models/ContentOutlineActionResponse';
import type { ContentOutlineGateResponse } from '../models/ContentOutlineGateResponse';
import type { MarkPostAsPostedRequest } from '../models/MarkPostAsPostedRequest';
import type { ResearchReportResponse } from '../models/ResearchReportResponse';
import type { ReviseContentOutlineRequest } from '../models/ReviseContentOutlineRequest';
import type { UpdateContentItemRequest } from '../models/UpdateContentItemRequest';
import type { UpdateContentItemStatusRequest } from '../models/UpdateContentItemStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContentService {
    /**
     * Get Gate 2 Content Outline and Research Rationale
     * Retrieve 30-day content outline briefs and competitor research for Gate 2 review.
     * @returns ContentOutlineGateResponse Successful Response
     * @throws ApiError
     */
    public static getOutlineGateApiV1BusinessesBusinessIdContentOutlineGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ContentOutlineGateResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/content/outline',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Approve Gate 2 Content Outline
     * Approve the 30-day content outline and trigger Content Writer & Visual Prompt agents.
     * @returns ContentOutlineActionResponse Successful Response
     * @throws ApiError
     */
    public static approveOutlineApiV1BusinessesBusinessIdContentOutlineApprovePost({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ContentOutlineActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/content/outline/approve',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Request Revisions on Gate 2 Content Outline
     * Request changes to the content outline with specific feedback notes.
     * @returns ContentOutlineActionResponse Successful Response
     * @throws ApiError
     */
    public static reviseOutlineApiV1BusinessesBusinessIdContentOutlineRevisePost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody: ReviseContentOutlineRequest,
    }): CancelablePromise<ContentOutlineActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/content/outline/revise',
            path: {
                'business_id': businessId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Competitor and Hashtag Research Report
     * Retrieve competitor research, strategic advantages, and hashtag clusters (F-014).
     * @returns ResearchReportResponse Successful Response
     * @throws ApiError
     */
    public static getResearchApiV1BusinessesBusinessIdContentResearchGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ResearchReportResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/content/research',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get 30-Day Content Calendar View
     * Retrieve 30-day content calendar items with progress statistics and optional filtering.
     * @returns ContentCalendarViewResponse Successful Response
     * @throws ApiError
     */
    public static getCalendarApiV1BusinessesBusinessIdContentCalendarGet({
        businessId,
        status,
        format,
        pillar,
    }: {
        businessId: string,
        status?: (string | null),
        format?: (string | null),
        pillar?: (string | null),
    }): CancelablePromise<ContentCalendarViewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/content/calendar',
            path: {
                'business_id': businessId,
            },
            query: {
                'status': status,
                'format': format,
                'pillar': pillar,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Content Item Status
     * Update status of a content item (draft, approved, posted, skipped) with audit recording.
     * @returns ContentItemResponse Successful Response
     * @throws ApiError
     */
    public static updateItemStatusApiV1BusinessesBusinessIdContentItemsItemIdStatusPatch({
        businessId,
        itemId,
        requestBody,
    }: {
        businessId: string,
        itemId: string,
        requestBody: UpdateContentItemStatusRequest,
    }): CancelablePromise<ContentItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/businesses/{business_id}/content/items/{item_id}/status',
            path: {
                'business_id': businessId,
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Single Content Item Detail
     * Retrieve details for a single content item (F-012).
     * @returns ContentItemResponse Successful Response
     * @throws ApiError
     */
    public static getItemApiV1BusinessesBusinessIdContentItemsItemIdGet({
        businessId,
        itemId,
    }: {
        businessId: string,
        itemId: string,
    }): CancelablePromise<ContentItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/content/items/{item_id}',
            path: {
                'business_id': businessId,
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Content Item Details
     * Full update for content item captions, hashtags, prompts and status (F-012).
     * @returns ContentItemResponse Successful Response
     * @throws ApiError
     */
    public static updateItemApiV1BusinessesBusinessIdContentItemsItemIdPut({
        businessId,
        itemId,
        requestBody,
    }: {
        businessId: string,
        itemId: string,
        requestBody: UpdateContentItemRequest,
    }): CancelablePromise<ContentItemResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/businesses/{business_id}/content/items/{item_id}',
            path: {
                'business_id': businessId,
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Today Content Item
     * Retrieve post scheduled for today, or next upcoming approved post (F-013).
     * @returns ContentItemResponse Successful Response
     * @throws ApiError
     */
    public static getTodayItemApiV1BusinessesBusinessIdContentTodayGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ContentItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/content/today',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Mark Content Item as Posted
     * Mark a content item as published on social media with audit record (F-013, W-003).
     * @returns ContentItemResponse Successful Response
     * @throws ApiError
     */
    public static postItemApiV1BusinessesBusinessIdContentItemsItemIdPostPost({
        businessId,
        itemId,
        requestBody,
    }: {
        businessId: string,
        itemId: string,
        requestBody: MarkPostAsPostedRequest,
    }): CancelablePromise<ContentItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/content/items/{item_id}/post',
            path: {
                'business_id': businessId,
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
