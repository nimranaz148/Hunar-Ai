/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageRequest } from '../models/ChatMessageRequest';
import type { OnboardingMessagesResponse } from '../models/OnboardingMessagesResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OnboardingService {
    /**
     * Get onboarding chat history
     * Retrieve chat history and current business creation status
     * for the authenticated entrepreneur.
     * @returns OnboardingMessagesResponse Successful Response
     * @throws ApiError
     */
    public static getMessagesApiV1OnboardingMessagesGet(): CancelablePromise<OnboardingMessagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/onboarding/messages',
        });
    }
    /**
     * Send chat message and stream Intake Agent response via SSE
     * Send a message to Hunar Intake Agent and stream response chunks via Server-Sent Events.
     * @returns any Real-time SSE stream with status, tokens, and completion events.
     * @throws ApiError
     */
    public static postChatStreamApiV1OnboardingChatPost({
        requestBody,
    }: {
        requestBody: ChatMessageRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/onboarding/chat',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
