/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A single chat message in the onboarding conversation.
 */
export type OnboardingMessageItem = {
    id: string;
    role: OnboardingMessageItem.role;
    content: string;
    meta?: Record<string, any>;
    created_at?: string;
};
export namespace OnboardingMessageItem {
    export enum role {
        USER = 'user',
        ASSISTANT = 'assistant',
        SYSTEM = 'system',
    }
}

