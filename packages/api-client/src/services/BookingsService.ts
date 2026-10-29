/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookingCreateRequest } from '../models/BookingCreateRequest';
import type { BookingDetailResponse } from '../models/BookingDetailResponse';
import type { BookingReviewRequest } from '../models/BookingReviewRequest';
import type { BookingUpdateRequest } from '../models/BookingUpdateRequest';
import type { PaginatedResponse_BookingItemResponse_ } from '../models/PaginatedResponse_BookingItemResponse_';
import type { SessionNotesCreateRequest } from '../models/SessionNotesCreateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookingsService {
    /**
     * Book a mentor service (F-019)
     * Create a new booking and hold simulated payment in escrow.
     * @returns BookingDetailResponse Successful Response
     * @throws ApiError
     */
    public static bookMentorServiceApiV1BookingsPost({
        requestBody,
    }: {
        requestBody: BookingCreateRequest,
    }): CancelablePromise<BookingDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bookings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List bookings (F-019, F-020)
     * Retrieve bookings scoped by participant role.
     * @returns PaginatedResponse_BookingItemResponse_ Successful Response
     * @throws ApiError
     */
    public static listUserBookingsApiV1BookingsGet({
        page = 1,
        pageSize = 20,
        status,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        pageSize?: number,
        /**
         * Filter by booking status
         */
        status?: (string | null),
    }): CancelablePromise<PaginatedResponse_BookingItemResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bookings',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get booking detail (F-019)
     * Retrieve full detail of a booking if participant or super_admin.
     * @returns BookingDetailResponse Successful Response
     * @throws ApiError
     */
    public static getBookingDetailsApiV1BookingsBookingIdGet({
        bookingId,
    }: {
        bookingId: string,
    }): CancelablePromise<BookingDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bookings/{booking_id}',
            path: {
                'booking_id': bookingId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update booking status or details (F-019, F-020)
     * Update booking status (cancel, accept, complete) or notes.
     * @returns BookingDetailResponse Successful Response
     * @throws ApiError
     */
    public static updateBookingDetailsApiV1BookingsBookingIdPatch({
        bookingId,
        requestBody,
    }: {
        bookingId: string,
        requestBody: BookingUpdateRequest,
    }): CancelablePromise<BookingDetailResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bookings/{booking_id}',
            path: {
                'booking_id': bookingId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add mentor session notes and complete session (F-027 / PRD §10 W-005, §13.2)
     * Submit post-session advisory notes. Automatically marks booking as completed and releases escrow payment.
     * @returns BookingDetailResponse Successful Response
     * @throws ApiError
     */
    public static submitSessionNotesApiV1BookingsBookingIdNotesPost({
        bookingId,
        requestBody,
    }: {
        bookingId: string,
        requestBody: SessionNotesCreateRequest,
    }): CancelablePromise<BookingDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bookings/{booking_id}/notes',
            path: {
                'booking_id': bookingId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Rate and review a completed mentoring session (F-041 / PRD §5, §10 W-005, §13.2)
     * Submit a 1-5 star review and optional comment for a completed mentoring session.
     * @returns BookingDetailResponse Successful Response
     * @throws ApiError
     */
    public static submitBookingReviewApiV1BookingsBookingIdReviewPost({
        bookingId,
        requestBody,
    }: {
        bookingId: string,
        requestBody: BookingReviewRequest,
    }): CancelablePromise<BookingDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bookings/{booking_id}/review',
            path: {
                'booking_id': bookingId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
