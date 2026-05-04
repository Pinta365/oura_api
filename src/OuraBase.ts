/**
 * Class containing all the shared basemethods to access the Oura API.
 *
 * @class OuraBase
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */

/** Date string format for API date params (e.g. YYYY-MM-DD). */
export type DateFormat = string;

import type {
    DailyResilienceModel,
    EnhancedTagModel,
    PersonalInfoResponse,
    PublicDailyActivity,
    PublicDailyCardiovascularAge,
    PublicDailyReadiness,
    PublicDailySleep,
    PublicDailySpO2,
    PublicDailyStress,
    PublicHeartRateRow,
    PublicInterbeatIntervalRow,
    PublicModifiedSleepModel,
    PublicRestModePeriod,
    PublicRingBatteryLevelRow,
    PublicRingConfiguration,
    PublicSession,
    PublicSleepTime,
    PublicVO2Max,
    PublicWorkout,
    TagModel,
} from "./types/generated.ts";
export type {
    DailyResilienceModel,
    EnhancedTagModel,
    ExtApiV2DataType,
    PersonalInfoResponse,
    PublicDailyActivity,
    PublicDailyCardiovascularAge,
    PublicDailyReadiness,
    PublicDailySleep,
    PublicDailySpO2,
    PublicDailyStress,
    PublicHeartRateRow,
    PublicInterbeatIntervalRow,
    PublicModifiedSleepModel,
    PublicRestModePeriod,
    PublicRingBatteryLevelRow,
    PublicRingConfiguration,
    PublicSession,
    PublicSleepTime,
    PublicVO2Max,
    PublicWorkout,
    TagModel,
    WebhookOperation,
    WebhookSubscriptionModel,
} from "./types/generated.ts";
import { API_URLS, APIError, RateLimitExceeded, ValidationError } from "./utils.ts";

/**
 * Options for configuring the Oura API client.
 */
export interface ApiOptionsBase {
    /**
     * Set to `true` to use the Oura sandbox environment. accessToken will be ignored.
     * The sandbox provides a simulated environment for testing your API integration.
     */
    useSandbox?: boolean;
}
interface OuraPaginatedResponse {
    data: unknown[];
    next_token: string | null;
}
/**
 * Base class for the Oura API.
 * Class containing all the methods to access the Oura API with an access token.
 */
class OuraBase {
    #useSandbox: boolean = false;

    /**
     * Creates a new Oura API client.
     *
     * @constructor
     * @param {ApiOptionsBase} options - options object containing the configuration settings.
     */
    constructor(options: ApiOptionsBase) {
        if (options.useSandbox) {
            this.#useSandbox = true;
        }
    }

    /**
     * Private method to make GET requests to the API endpoints.
     *
     * @private
     * @param {string} url - The API endpoint URL.
     * @param {Record<string, string>} [qs] - Optional querystring parameters.
     * @returns {Promise<object>} A JSON parsed fetch response.
     * @throws {ValidationError} Throws if querystring validation fails.
     * @throws {RateLimitExceeded} Throws if the request rate limit is exceeded.
     * @throws {APIError} Throws if the response status is not OK for other reasons.
     */
    #get = async (accessToken: string | undefined, url: string, qs?: Record<string, string>) => {
        const params = new URLSearchParams(qs);
        const baseUrl = this.#useSandbox ? API_URLS.basev2Sandbox : API_URLS.baseV2;
        const response = await fetch(
            baseUrl + encodeURI(url) + (qs ? "?" + params.toString() : ""),
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + accessToken,
                },
            },
        );

        interface ErrorData {
            detail?: string;
        }

        if (response.status === 400) {
            let detail = "";
            try {
                const errorData: ErrorData = await response.json() as ErrorData;
                detail = errorData.detail || "";
            } catch (_err) {
                detail = "No details";
            }
            throw new ValidationError(
                "Query Parameter Validation Error",
                response.status,
                response.statusText,
                detail,
                baseUrl + encodeURI(url),
                "GET",
            );
        } else if (response.status === 429) {
            let detail = "";
            try {
                const errorData: ErrorData = await response.json() as ErrorData;
                detail = errorData.detail || "";
            } catch (_err) {
                detail = "No details";
            }
            throw new RateLimitExceeded(
                "Request Rate Limit Exceeded",
                response.status,
                response.statusText,
                detail,
                baseUrl + encodeURI(url),
                "GET",
            );
        } else if (response.ok) {
            return await response.json();
        } else {
            let detail = "";
            try {
                const errorData: ErrorData = await response.json() as ErrorData;
                detail = errorData.detail || "";
            } catch (_err) {
                detail = "No details";
            }
            throw new APIError(
                "Problem fetching data.",
                response.status,
                response.statusText,
                detail,
                baseUrl + encodeURI(url),
                "GET",
            );
        }
    };

    /**
     * Generic method to fetch data from Oura API with pagination support.
     *
     * @param {string} endpoint - The API endpoint URL.
     * @param {Record<string, string>} [initialParams] - Initial query parameters.
     * @returns {Promise<unknown[]>} A promise that resolves with an array containing all fetched data.
     */
    async getAll(
        accessToken: string | undefined,
        endpoint: string,
        initialParams?: Record<string, string>,
    ): Promise<unknown[] | unknown> {
        const allData: unknown[] = [];
        let nextToken: string | null = null;
        let params: Record<string, string> | undefined = initialParams;

        do {
            const response = await this.#get(accessToken, endpoint, params) as OuraPaginatedResponse;
            if (response.data) {
                allData.push(...response.data);
                nextToken = response.next_token;
            } else {
                // If there's no data array, it's a single document
                return response; // Return the single object directly
            }
            params = nextToken ? { next_token: nextToken } : undefined;
        } while (nextToken);

        return allData; // Return the array of objects for paginated results
    }

    /**
     * Protected method to fetch data from the Oura API.
     *
     * @protected
     * @param {string} endpoint - The API endpoint URL.
     * @param {Record<string, string>} [params] - Optional query parameters.
     * @param {string} [accessToken] - Optional access token for OAuth-driven calls (used by `OuraOAuth`).
     * @returns {Promise<unknown>} A promise that resolves with the fetched data (either an array or a single object).
     * @throws {Error} If the method is not overridden in a subclass.
     */
    protected fetchData(
        _endpoint: string,
        _params?: Record<string, string>,
        _accessToken?: string,
    ): Promise<unknown> {
        // This method is meant to be overridden in subclasses
        throw new Error("Not implemented");
    }

    /**
     * Generic helper to fetch a list of documents for a given endpoint and date range.
     */
    private getDocuments<T>(
        endpoint: string,
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<T[]> {
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData(endpoint, params, accessToken) as unknown as Promise<T[]>;
    }

    /**
     * Generic helper to fetch a single document by ID for a given endpoint.
     */
    private getDocumentById<T>(
        endpoint: string,
        documentId: string,
        accessToken?: string,
    ): Promise<T> {
        return this.fetchData(`${endpoint}/${documentId}`, undefined, accessToken) as unknown as Promise<T>;
    }

    /**
     * Retrieves daily activity documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyActivity[]>} A array of PublicDailyActivity objects.
     */
    getDailyActivityDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailyActivity[]> {
        return this.getDocuments<PublicDailyActivity>("daily_activity", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single activity document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyActivity>} A PublicDailyActivity typed object.
     */
    getDailyActivity(documentId: string, accessToken?: string): Promise<PublicDailyActivity> {
        return this.getDocumentById<PublicDailyActivity>("daily_activity", documentId, accessToken);
    }

    /**
     * Retrieves cardiovascular age documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyCardiovascularAge[]>} A array of PublicDailyCardiovascularAge objects.
     */
    getDailyCardiovascularAgeDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailyCardiovascularAge[]> {
        return this.getDocuments<PublicDailyCardiovascularAge>(
            "daily_cardiovascular_age",
            startDate,
            endDate,
            accessToken,
        );
    }

    /**
     * Retrieves a cardiovascular age document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyCardiovascularAge>} A PublicDailyCardiovascularAge typed object.
     */
    getDailyCardiovascularAge(documentId: string, accessToken?: string): Promise<PublicDailyCardiovascularAge> {
        return this.getDocumentById<PublicDailyCardiovascularAge>("daily_cardiovascular_age", documentId, accessToken);
    }

    /**
     * Retrieves daily readiness documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyReadiness[]>} A array of PublicDailyReadiness objects.
     */
    getDailyReadinessDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailyReadiness[]> {
        return this.getDocuments<PublicDailyReadiness>("daily_readiness", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single readiness document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyReadiness>} A PublicDailyReadiness typed object.
     */
    getDailyReadiness(documentId: string, accessToken?: string): Promise<PublicDailyReadiness> {
        return this.getDocumentById<PublicDailyReadiness>("daily_readiness", documentId, accessToken);
    }

    /**
     * Retrieves daily resilience documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyResilienceModel[]>} A array of DailyResilienceModel objects.
     */
    getDailyResilienceDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyResilienceModel[]> {
        return this.getDocuments<DailyResilienceModel>("daily_resilience", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single resilience document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyResilienceModel>} A DailyResilienceModel typed object.
     */
    getDailyResilience(documentId: string, accessToken?: string): Promise<DailyResilienceModel> {
        return this.getDocumentById<DailyResilienceModel>("daily_resilience", documentId, accessToken);
    }

    /**
     * Retrieves daily sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailySleep[]>} A array of PublicDailySleep objects.
     */
    getDailySleepDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailySleep[]> {
        return this.getDocuments<PublicDailySleep>("daily_sleep", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily sleep document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailySleep>} A PublicDailySleep typed object.
     */
    getDailySleep(documentId: string, accessToken?: string): Promise<PublicDailySleep> {
        return this.getDocumentById<PublicDailySleep>("daily_sleep", documentId, accessToken);
    }

    /**
     * Retrieves daily spO2 (blood oxygenation) averages for a specified date range.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailySpO2[]>} A array of PublicDailySpO2 objects.
     */
    getDailySpo2Documents(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailySpO2[]> {
        return this.getDocuments<PublicDailySpO2>("daily_spo2", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily spO2 (blood oxygenation) average document by its ID.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailySpO2>} A PublicDailySpO2 typed object.
     */
    getDailySpo2(documentId: string, accessToken?: string): Promise<PublicDailySpO2> {
        return this.getDocumentById<PublicDailySpO2>("daily_spo2", documentId, accessToken);
    }

    /**
     * Retrieves daily stress summary for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyStress[]>} A array of PublicDailyStress objects.
     */
    getDailyStressDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicDailyStress[]> {
        return this.getDocuments<PublicDailyStress>("daily_stress", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily stress summary document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicDailyStress>} A PublicDailyStress typed object.
     */
    getDailyStress(documentId: string, accessToken?: string): Promise<PublicDailyStress> {
        return this.getDocumentById<PublicDailyStress>("daily_stress", documentId, accessToken);
    }

    /**
     * Retrieves heart rate data for a specified date and time period.
     *
     * @param {string} startDateTime - Start date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} endDateTime - End date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicHeartRateRow[]>} A array of PublicHeartRateRow objects.
     */
    getHeartrate(
        startDateTime: string,
        endDateTime: string,
        accessToken?: string,
    ): Promise<PublicHeartRateRow[]> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.fetchData("heartrate", params, accessToken) as unknown as Promise<PublicHeartRateRow[]>;
    }

    /**
     * Retrieves ring battery level data for a specified date and time period.
     *
     * @param {string} startDateTime - Start date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} endDateTime - End date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicRingBatteryLevelRow[]>} A array of PublicRingBatteryLevelRow objects.
     */
    getRingBatteryLevel(
        startDateTime: string,
        endDateTime: string,
        accessToken?: string,
    ): Promise<PublicRingBatteryLevelRow[]> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.fetchData("ring_battery_level", params, accessToken) as unknown as Promise<
            PublicRingBatteryLevelRow[]
        >;
    }

    /**
     * Retrieves interbeat interval data for a specified date and time period.
     *
     * @param {string} startDateTime - Start date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} endDateTime - End date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicInterbeatIntervalRow[]>} A array of PublicInterbeatIntervalRow objects.
     */
    getInterbeatInterval(
        startDateTime: string,
        endDateTime: string,
        accessToken?: string,
    ): Promise<PublicInterbeatIntervalRow[]> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.fetchData("interbeat_interval", params, accessToken) as unknown as Promise<
            PublicInterbeatIntervalRow[]
        >;
    }

    /**
     * Retrieves personal information about the user.
     *
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PersonalInfoResponse>} A PersonalInfoResponse typed object.
     */
    getPersonalInfo(accessToken?: string): Promise<PersonalInfoResponse> {
        return this.fetchData("personal_info", undefined, accessToken) as unknown as Promise<PersonalInfoResponse>;
    }

    /**
     * Retrieves rest mode periods for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicRestModePeriod[]>} A array of PublicRestModePeriod objects.
     */
    getRestModePeriodDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicRestModePeriod[]> {
        return this.getDocuments<PublicRestModePeriod>("rest_mode_period", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single rest mode period document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicRestModePeriod>} A PublicRestModePeriod typed object.
     */
    getRestModePeriod(documentId: string, accessToken?: string): Promise<PublicRestModePeriod> {
        return this.getDocumentById<PublicRestModePeriod>("rest_mode_period", documentId, accessToken);
    }

    /**
     * Retrieves ring configuration information.
     *
     * This endpoint does not support start/end date filtering.
     *
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicRingConfiguration[]>} A array of PublicRingConfiguration objects.
     */
    getRingConfigurationDocuments(accessToken?: string): Promise<PublicRingConfiguration[]>;

    /**
     * @deprecated Date-range arguments are ignored for this endpoint and are kept for backward compatibility.
     */
    getRingConfigurationDocuments(
        _startDate: DateFormat,
        _endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicRingConfiguration[]>;

    getRingConfigurationDocuments(
        startDateOrAccessToken?: DateFormat,
        _endDate?: DateFormat,
        accessToken?: string,
    ): Promise<PublicRingConfiguration[]> {
        const token = accessToken ?? (startDateOrAccessToken && !_endDate ? startDateOrAccessToken : undefined);
        return this.fetchData("ring_configuration", undefined, token) as unknown as Promise<PublicRingConfiguration[]>;
    }

    /**
     * Retrieves a single ring configuration document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicRingConfiguration>} A PublicRingConfiguration typed object.
     */
    getRingConfiguration(documentId: string, accessToken?: string): Promise<PublicRingConfiguration> {
        return this.getDocumentById<PublicRingConfiguration>("ring_configuration", documentId, accessToken);
    }

    /**
     * Retrieves daily session documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicSession[]>} A array of PublicSession objects.
     */
    getDailySessionDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicSession[]> {
        return this.getDocuments<PublicSession>("session", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicSession>} A PublicSession typed object.
     */
    getDailySession(documentId: string, accessToken?: string): Promise<PublicSession> {
        return this.getDocumentById<PublicSession>("session", documentId, accessToken);
    }

    /**
     * Retrieves sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicModifiedSleepModel[]>} A array of PublicModifiedSleepModel objects.
     */
    getSleepDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicModifiedSleepModel[]> {
        return this.getDocuments<PublicModifiedSleepModel>("sleep", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single sleep session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicModifiedSleepModel>} A Sleep typed object.
     */
    getSleep(documentId: string, accessToken?: string): Promise<PublicModifiedSleepModel> {
        return this.getDocumentById<PublicModifiedSleepModel>("sleep", documentId, accessToken);
    }

    /**
     * Retrieves recommended bedtime windows for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicSleepTime[]>} A array of PublicSleepTime objects.
     */
    getSleepTimeDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicSleepTime[]> {
        return this.getDocuments<PublicSleepTime>("sleep_time", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single recommended bedtime window document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicSleepTime>} A PublicSleepTime typed object.
     */
    getSleepTime(documentId: string, accessToken?: string): Promise<PublicSleepTime> {
        return this.getDocumentById<PublicSleepTime>("sleep_time", documentId, accessToken);
    }

    /**
     * Retrieves daily tags for a specified date range.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<TagModel[]>} A array of TagModel objects.
     */
    getTagDocuments(startDate: DateFormat, endDate: DateFormat, accessToken?: string): Promise<TagModel[]> {
        console.log(
            "Tag is deprecated. We recommend transitioning to Enhanced Tag.",
        );
        return this.getDocuments<TagModel>("tag", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single tag document by its ID.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<TagModel>} A Tag typed object.
     */
    getTag(documentId: string, accessToken?: string): Promise<TagModel> {
        console.log(
            "Tag is deprecated. We recommend transitioning to Enhanced Tag.",
        );
        return this.getDocumentById<TagModel>("tag", documentId, accessToken);
    }

    /**
     * Retrieves PublicVO2Max documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicVO2Max[]>} A array of PublicVO2Max objects.
     */
    getVO2MaxDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicVO2Max[]> {
        return this.getDocuments<PublicVO2Max>("vO2_max", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single PublicVO2Max document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicVO2Max>} A PublicVO2Max typed object.
     */
    getVO2Max(documentId: string, accessToken?: string): Promise<PublicVO2Max> {
        return this.getDocumentById<PublicVO2Max>("vO2_max", documentId, accessToken);
    }

    /**
     * Retrieves workout documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicWorkout[]>} A array of PublicWorkout objects.
     */
    getWorkoutDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<PublicWorkout[]> {
        return this.getDocuments<PublicWorkout>("workout", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single workout document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PublicWorkout>} A PublicWorkout typed object.
     */
    getWorkout(documentId: string, accessToken?: string): Promise<PublicWorkout> {
        return this.getDocumentById<PublicWorkout>("workout", documentId, accessToken);
    }

    /**
     * Retrieves enhanced tags for a specified date range.
     * The Enhanced Tags data scope includes tags that Oura users enter within the Oura mobile app.
     * Enhanced Tags can be added for any lifestyle choice, habit, mood change, or environmental
     * factor an Oura user wants to monitor the effects of. Enhanced Tags also contain context on
     * a tag's start and end time, whether a tag repeats daily, and comments.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<EnhancedTagModel[]>} A array of EnhancedTagModel objects.
     */
    getEnhancedTagDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<EnhancedTagModel[]> {
        return this.getDocuments<EnhancedTagModel>("enhanced_tag", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single enhanced tags document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<EnhancedTagModel>} A EnhancedTagModel typed object.
     */
    getEnhancedTag(documentId: string, accessToken?: string): Promise<EnhancedTagModel> {
        return this.getDocumentById<EnhancedTagModel>("enhanced_tag", documentId, accessToken);
    }
}

export default OuraBase;
