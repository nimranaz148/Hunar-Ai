/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApprovePlanRequest } from '../models/ApprovePlanRequest';
import type { Gate1OverviewResponse } from '../models/Gate1OverviewResponse';
import type { LaunchPlanResponse } from '../models/LaunchPlanResponse';
import type { PlanTaskResponse } from '../models/PlanTaskResponse';
import type { RejectPlanRequest } from '../models/RejectPlanRequest';
import type { UpdateTaskStatusRequest } from '../models/UpdateTaskStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PlanService {
    /**
     * Get 30-day launch plan
     * Retrieve 30-day launch plan with tasks for the business.
     * @returns LaunchPlanResponse Successful Response
     * @throws ApiError
     */
    public static getPlanApiV1BusinessesBusinessIdPlanGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<LaunchPlanResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/plan',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Human Gate 1 approval overview
     * Retrieve consolidated Plan Approval Gate (Wireframe §30.2) payload.
     * @returns Gate1OverviewResponse Successful Response
     * @throws ApiError
     */
    public static getGate1ApiV1BusinessesBusinessIdPlanGate1Get({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<Gate1OverviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/plan/gate1',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate or refresh 30-day launch plan
     * Trigger Launch Planner agent to construct or regenerate 30-day roadmap.
     * @returns LaunchPlanResponse Successful Response
     * @throws ApiError
     */
    public static generatePlanApiV1BusinessesBusinessIdPlanGeneratePost({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<LaunchPlanResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/plan/generate',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Approve launch plan at Human Gate 1
     * Approve the business launch plan and pricing, unlocking task execution.
     * @returns LaunchPlanResponse Successful Response
     * @throws ApiError
     */
    public static approvePlanApiV1BusinessesBusinessIdPlanApprovePost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody?: ApprovePlanRequest,
    }): CancelablePromise<LaunchPlanResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/plan/approve',
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
     * Request revisions on launch plan at Human Gate 1
     * Reject the plan with feedback to trigger revisions.
     * @returns LaunchPlanResponse Successful Response
     * @throws ApiError
     */
    public static rejectPlanApiV1BusinessesBusinessIdPlanRejectPost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody: RejectPlanRequest,
    }): CancelablePromise<LaunchPlanResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/plan/reject',
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
     * Update launch task status
     * Update status of an individual launch task (pending, in_progress, completed, skipped).
     * @returns PlanTaskResponse Successful Response
     * @throws ApiError
     */
    public static updateTaskApiV1BusinessesBusinessIdPlanTasksTaskIdPatch({
        businessId,
        taskId,
        requestBody,
    }: {
        businessId: string,
        taskId: string,
        requestBody: UpdateTaskStatusRequest,
    }): CancelablePromise<PlanTaskResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/businesses/{business_id}/plan/tasks/{task_id}',
            path: {
                'business_id': businessId,
                'task_id': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
