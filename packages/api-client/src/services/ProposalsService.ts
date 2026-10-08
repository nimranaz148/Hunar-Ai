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
     * List agent proposals awaiting human gate decisions
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static getProposalsApiV1ProposalsGet({
        businessId,
        gateType,
        status,
    }: {
        businessId?: (string | null),
        gateType?: (string | null),
        status?: (string | null),
    } = {}): CancelablePromise<Array<ProposalDetailResponse>> {
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
     * Approve proposal at Human Gate 3 (F-017)
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
     * Reject proposal at Human Gate 3 (F-017)
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
     * @returns ProposalDetailResponse Successful Response
     * @throws ApiError
     */
    public static getLatestWeeklyReviewApiV1BusinessesBusinessIdWeeklyReviewLatestGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<ProposalDetailResponse | null> {
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
