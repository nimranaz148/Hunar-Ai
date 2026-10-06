/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Recurring weekly availability time window (PRD §5 F-023, §13.2).
 */
export type AvailabilitySlotItem = {
    id?: (string | null);
    /**
     * Day of week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
     */
    weekday: number;
    /**
     * Start time in HH:MM format, e.g. 09:00
     */
    start_time: string;
    /**
     * End time in HH:MM format, e.g. 17:00
     */
    end_time: string;
    is_available?: boolean;
};

