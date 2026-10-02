/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OnboardingMessageItem } from './OnboardingMessageItem';
/**
 * History of onboarding messages and current onboarding status.
 */
export type OnboardingMessagesResponse = {
    messages: Array<OnboardingMessageItem>;
    is_profile_complete?: boolean;
    business_id?: (string | null);
};

