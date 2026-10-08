/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminAgentRunDetailResponse } from '../models/AdminAgentRunDetailResponse';
import type { AdminCreateUserRequest } from '../models/AdminCreateUserRequest';
import type { AdminCreateUserResponse } from '../models/AdminCreateUserResponse';
import type { AdminResetPasswordResponse } from '../models/AdminResetPasswordResponse';
import type { AdminUpdateUserRequest } from '../models/AdminUpdateUserRequest';
import type { AdminUserResponse } from '../models/AdminUserResponse';
import type { FeatureFlagResponse } from '../models/FeatureFlagResponse';
import type { KillSwitchResponse } from '../models/KillSwitchResponse';
import type { MentorApprovalActionResponse } from '../models/MentorApprovalActionResponse';
import type { PaginatedResponse_AdminAgentRunResponse_ } from '../models/PaginatedResponse_AdminAgentRunResponse_';
import type { PaginatedResponse_AdminUserResponse_ } from '../models/PaginatedResponse_AdminUserResponse_';
import type { PaginatedResponse_dict_str__object__ } from '../models/PaginatedResponse_dict_str__object__';
import type { PendingMentorApplicationItem } from '../models/PendingMentorApplicationItem';
import type { SettingsResponse } from '../models/SettingsResponse';
import type { UpdateFeatureFlagsRequest } from '../models/UpdateFeatureFlagsRequest';
import type { UpdateSettingsRequest } from '../models/UpdateSettingsRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Get Admin Users
     * List users with pagination and role/status filtering.
     * @returns PaginatedResponse_AdminUserResponse_ Successful Response
     * @throws ApiError
     */
    public static getAdminUsersApiV1AdminUsersGet({
        role,
        status,
        page = 1,
        pageSize = 20,
    }: {
        role?: (string | null),
        status?: (string | null),
        page?: number,
        pageSize?: number,
    }): CancelablePromise<PaginatedResponse_AdminUserResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users',
            query: {
                'role': role,
                'status': status,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create User
     * Create a user with an auto-generated temporary password.
     * @returns AdminCreateUserResponse Successful Response
     * @throws ApiError
     */
    public static createUserApiV1AdminUsersPost({
        requestBody,
    }: {
        requestBody: AdminCreateUserRequest,
    }): CancelablePromise<AdminCreateUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User
     * Modify user role, active status, or name.
     * @returns AdminUserResponse Successful Response
     * @throws ApiError
     */
    public static updateUserApiV1AdminUsersUserIdPatch({
        userId,
        requestBody,
    }: {
        userId: string,
        requestBody: AdminUpdateUserRequest,
    }): CancelablePromise<AdminUserResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/users/{user_id}',
            path: {
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset User Password
     * Reset user password and force change on next login.
     * @returns AdminResetPasswordResponse Successful Response
     * @throws ApiError
     */
    public static resetUserPasswordApiV1AdminUsersUserIdResetPasswordPost({
        userId,
    }: {
        userId: string,
    }): CancelablePromise<AdminResetPasswordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{user_id}/reset-password',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Audit Logs
     * Retrieve paginated audit entries with filtering.
     * @returns PaginatedResponse_dict_str__object__ Successful Response
     * @throws ApiError
     */
    public static getAuditLogsApiV1AdminAuditGet({
        actorId,
        action,
        from,
        to,
        page = 1,
        pageSize = 20,
    }: {
        actorId?: (string | null),
        action?: (string | null),
        from?: (string | null),
        to?: (string | null),
        page?: number,
        pageSize?: number,
    }): CancelablePromise<PaginatedResponse_dict_str__object__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/audit',
            query: {
                'actor_id': actorId,
                'action': action,
                'from': from,
                'to': to,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Audit Logs
     * Download filtered audit logs as CSV stream.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static exportAuditLogsApiV1AdminAuditExportGet({
        actorId,
        action,
        from,
        to,
    }: {
        actorId?: (string | null),
        action?: (string | null),
        from?: (string | null),
        to?: (string | null),
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/audit/export',
            query: {
                'actor_id': actorId,
                'action': action,
                'from': from,
                'to': to,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Agent Runs
     * Retrieve paginated agent runs for monitoring.
     * @returns PaginatedResponse_AdminAgentRunResponse_ Successful Response
     * @throws ApiError
     */
    public static getAgentRunsApiV1AdminRunsGet({
        workflow,
        status,
        userId,
        page = 1,
        pageSize = 20,
    }: {
        workflow?: (string | null),
        status?: (string | null),
        userId?: (string | null),
        page?: number,
        pageSize?: number,
    }): CancelablePromise<PaginatedResponse_AdminAgentRunResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/runs',
            query: {
                'workflow': workflow,
                'status': status,
                'user_id': userId,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Run Detail
     * Retrieve a single agent workflow run along with all child span steps.
     * @returns AdminAgentRunDetailResponse Successful Response
     * @throws ApiError
     */
    public static getRunDetailApiV1AdminRunsRunIdGet({
        runId,
    }: {
        runId: string,
    }): CancelablePromise<AdminAgentRunDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/runs/{run_id}',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read System Settings
     * Read all configuration settings.
     * @returns SettingsResponse Successful Response
     * @throws ApiError
     */
    public static readSystemSettingsApiV1AdminSettingsGet(): CancelablePromise<SettingsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/settings',
        });
    }
    /**
     * Modify System Settings
     * Modify operational settings with audit log.
     * @returns SettingsResponse Successful Response
     * @throws ApiError
     */
    public static modifySystemSettingsApiV1AdminSettingsPatch({
        requestBody,
    }: {
        requestBody: UpdateSettingsRequest,
    }): CancelablePromise<SettingsResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/settings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Toggle Agent Kill Switch
     * Toggle emergency kill switch.
     * @returns KillSwitchResponse Successful Response
     * @throws ApiError
     */
    public static toggleAgentKillSwitchApiV1AdminKillSwitchPost(): CancelablePromise<KillSwitchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/kill-switch',
        });
    }
    /**
     * Get Pending Mentor Applications
     * Retrieve all pending mentor applications awaiting review (F-030 / PRD §10 W-006).
     * @returns PendingMentorApplicationItem Successful Response
     * @throws ApiError
     */
    public static getPendingMentorApplicationsApiV1AdminMentorsPendingGet(): CancelablePromise<Array<PendingMentorApplicationItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/mentors/pending',
        });
    }
    /**
     * Approve Mentor Application
     * Approve a mentor application, unlock Pro panel, and record audit log (F-030).
     * @returns MentorApprovalActionResponse Successful Response
     * @throws ApiError
     */
    public static approveMentorApplicationApiV1AdminMentorsMentorIdApprovePost({
        mentorId,
    }: {
        mentorId: string,
    }): CancelablePromise<MentorApprovalActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/mentors/{mentor_id}/approve',
            path: {
                'mentor_id': mentorId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Decline Mentor Application
     * Decline a mentor application and record audit log (F-030).
     * @returns MentorApprovalActionResponse Successful Response
     * @throws ApiError
     */
    public static declineMentorApplicationApiV1AdminMentorsMentorIdDeclinePost({
        mentorId,
        reason,
    }: {
        mentorId: string,
        reason?: (string | null),
    }): CancelablePromise<MentorApprovalActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/mentors/{mentor_id}/decline',
            path: {
                'mentor_id': mentorId,
            },
            query: {
                'reason': reason,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Admin Feature Flags
     * Retrieve all system feature flags for super admin management (F-036).
     * @returns FeatureFlagResponse Successful Response
     * @throws ApiError
     */
    public static getAdminFeatureFlagsApiV1AdminFeatureFlagsGet(): CancelablePromise<Array<FeatureFlagResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/feature-flags',
        });
    }
    /**
     * Modify Admin Feature Flags
     * Update one or more feature flags, record feature_flag.changed audit log, and return list.
     * @returns FeatureFlagResponse Successful Response
     * @throws ApiError
     */
    public static modifyAdminFeatureFlagsApiV1AdminFeatureFlagsPatch({
        requestBody,
    }: {
        requestBody: UpdateFeatureFlagsRequest,
    }): CancelablePromise<Array<FeatureFlagResponse>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/admin/feature-flags',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Runtime Feature Flags
     * Public runtime read for enabled feature flags.
     * @returns boolean Successful Response
     * @throws ApiError
     */
    public static getRuntimeFeatureFlagsApiV1FeatureFlagsGet(): CancelablePromise<Record<string, boolean>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/feature-flags',
        });
    }
}


