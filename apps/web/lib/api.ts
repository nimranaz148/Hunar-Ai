/**
 * Single import point for the generated API client (`@hunar/api-client`).
 * Cookie auth: requests include credentials; the base URL comes from NEXT_PUBLIC_API_URL.
 */
import { OpenAPI } from "@hunar/api-client";

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";

export * from "@hunar/api-client";
