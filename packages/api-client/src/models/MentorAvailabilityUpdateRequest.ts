/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailabilitySlotItem } from './AvailabilitySlotItem';
/**
 * Payload to update weekly recurring availability slots (PRD §5 F-023, §13.2).
 */
export type MentorAvailabilityUpdateRequest = {
    slots: Array<AvailabilitySlotItem>;
};

