/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CostInput } from './CostInput';
/**
 * Payload to update an existing product offering (F-005).
 */
export type UpdateProductRequest = {
    name?: (string | null);
    description?: (string | null);
    cost_inputs?: (Array<CostInput> | null);
    price_pkr?: (number | null);
};

