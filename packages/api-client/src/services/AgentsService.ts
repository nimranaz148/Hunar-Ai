/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentProgressEvent } from '../models/AgentProgressEvent';
import type { CancelRunResponse } from '../models/CancelRunResponse';
import type { StartAgentRunRequest } from '../models/StartAgentRunRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgentsService {
    /**
     * Start an agent workflow run
     * Start an agent run and return the initial tracking event.
     * @returns AgentProgressEvent Successful Response
     * @throws ApiError
     */
    public static startRunApiV1AgentsRunsPost({
        requestBody,
    }: {
        requestBody: StartAgentRunRequest,
    }): CancelablePromise<AgentProgressEvent> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/agents/runs',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stream real-time agent execution progress via SSE
     * Server-Sent Events endpoint streaming real-time step progress (PRD §648-669).
     * @returns any Successful Response
     * @throws ApiError
     */
    public static streamRunApiV1AgentsRunsRunIdStreamGet({
        runId,
    }: {
        runId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/agents/runs/{run_id}/stream',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get current agent run progress
     * Polling fallback and single-query progress check for an agent run.
     * @returns AgentProgressEvent Successful Response
     * @throws ApiError
     */
    public static getRunProgressApiV1AgentsRunsRunIdGet({
        runId,
    }: {
        runId: string,
    }): CancelablePromise<AgentProgressEvent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/agents/runs/{run_id}',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel an in-progress agent run
     * Cancel an active agent run (PRD §665).
     * @returns CancelRunResponse Successful Response
     * @throws ApiError
     */
    public static cancelRunApiV1AgentsRunsRunIdCancelPost({
        runId,
    }: {
        runId: string,
    }): CancelablePromise<CancelRunResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/agents/runs/{run_id}/cancel',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
