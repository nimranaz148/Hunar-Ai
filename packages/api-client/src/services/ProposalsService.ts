/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApproveProposalRequest } from '../models/ApproveProposalRequest';
import type { ProposalDetailResponse } from '../models/ProposalDetailResponse';
import type { RejectProposalRequest } from '../models/RejectProposalRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProposalsService {
    /**
     * List agent proposals awaiting human gate decisions (PRD §13.2 line 1044)
     * Retrieve proposals with owner scoping and optional gate_type/status filtering.
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static getProposalsListApiV1ProposalsGet({
        businessId,
        gateType,
        status,
    }: {
        /**
         * Filter by business ID
         */
        businessId?: (string | null),
        /**
         * Filter by gate type (plan_approval, content_outline, weekly_review)
         */
        gateType?: (string | null),
        /**
         * Filter by status (pending, approved, rejected)
         */
        status?: (string | null),
    }): CancelablePromise<Array<ProposalDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proposals',
            query: {
                'business_id': businessId,
                'gate_type': gateType,
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get single proposal detail
     * Retrieve details for a specific proposal.
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static getSingleProposalApiV1ProposalsProposalIdGet({
        proposalId,
    }: {
        proposalId: string,
    }): CancelablePromise<ProposalDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proposals/{proposal_id}',
            path: {
                'proposal_id': proposalId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Approve proposal at Human Gate 3 (PRD §13.2 line 1045)
     * Approve an agent proposal, update status, apply adjustments to upcoming content, and record audit log.
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static approveSingleProposalApiV1ProposalsProposalIdApprovePost({
        proposalId,
        requestBody,
    }: {
        proposalId: string,
        requestBody?: ApproveProposalRequest,
    }): CancelablePromise<ProposalDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proposals/{proposal_id}/approve',
            path: {
                'proposal_id': proposalId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reject proposal at Human Gate 3 (PRD §13.2 line 1046)
     * Reject an agent proposal with feedback reason and record audit log.
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static rejectSingleProposalApiV1ProposalsProposalIdRejectPost({
        proposalId,
        requestBody,
    }: {
        proposalId: string,
        requestBody: RejectProposalRequest,
    }): CancelablePromise<ProposalDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proposals/{proposal_id}/reject',
            path: {
                'proposal_id': proposalId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Trigger Weekly Coach Review (PRD §10 W-004, F-017)
     * Analyze logged performance metrics and trigger Weekly Coach agent to draft Gate 3 proposals.
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static triggerWeeklyReviewApiV1BusinessesBusinessIdWeeklyReviewTriggerPost({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ProposalDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/weekly-review/trigger',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get latest weekly review proposal for business
     * Retrieve the most recent weekly review proposal for this business.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLatestWeeklyReviewApiV1BusinessesBusinessIdWeeklyReviewLatestGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<(ProposalDetailResponse | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/weekly-review/latest',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
