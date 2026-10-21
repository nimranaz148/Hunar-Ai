/**
 * Single import point for the generated API client (`@hunar/api-client`).
 * Cookie auth: requests include credentials; the base URL comes from NEXT_PUBLIC_API_URL.
 */
import { OpenAPI } from "@hunar/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

OpenAPI.BASE = API_URL;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";

// Dynamically resolve access token from localStorage or cookie for all API calls
OpenAPI.TOKEN = async () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) return token;
    const match = document.cookie.match(/(^|; )access_token=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : "";
  }
  return "";
};

export * from "@hunar/api-client";
