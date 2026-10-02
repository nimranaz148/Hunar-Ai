/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateProductRequest } from '../models/CreateProductRequest';
import type { ProductResponse } from '../models/ProductResponse';
import type { UpdateProductRequest } from '../models/UpdateProductRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * List all products for a business
     * Retrieve all products/services offered by the business.
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static listProductsApiV1BusinessesBusinessIdProductsGet({
        businessId,
    }: {
        businessId: string,
    }): CancelablePromise<Array<ProductResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/products',
            path: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create a product or service for a business
     * Create a new product offering with itemized cost inputs and selling price.
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static createNewProductApiV1BusinessesBusinessIdProductsPost({
        businessId,
        requestBody,
    }: {
        businessId: string,
        requestBody: CreateProductRequest,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/businesses/{business_id}/products',
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
     * Get single product by ID
     * Retrieve a single product offering by ID.
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static getSingleProductApiV1BusinessesBusinessIdProductsProductIdGet({
        businessId,
        productId,
    }: {
        businessId: string,
        productId: string,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/businesses/{business_id}/products/{product_id}',
            path: {
                'business_id': businessId,
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update product details
     * Update product name, description, cost inputs, or selling price.
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static updateSingleProductApiV1BusinessesBusinessIdProductsProductIdPatch({
        businessId,
        productId,
        requestBody,
    }: {
        businessId: string,
        productId: string,
        requestBody: UpdateProductRequest,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/businesses/{business_id}/products/{product_id}',
            path: {
                'business_id': businessId,
                'product_id': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete a product
     * Delete a product offering.
     * @returns void
     * @throws ApiError
     */
    public static deleteSingleProductApiV1BusinessesBusinessIdProductsProductIdDelete({
        businessId,
        productId,
    }: {
        businessId: string,
        productId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/businesses/{business_id}/products/{product_id}',
            path: {
                'business_id': businessId,
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
