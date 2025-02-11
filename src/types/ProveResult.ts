/**
 * ProveResult
 * A type that gets returned from an API call to the prove endpoint.
 */
export type ProveResult = {
    success: boolean;
    results: string[];
    message?: string;
}