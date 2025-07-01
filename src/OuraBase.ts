/**
 * Class containing all the shared basemethods to access the Oura API.
 *
 * @class OuraBase
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */
import type {
    DailyActivity,
    DailyCardiovascularAge,
    DailyReadiness,
    DailyResilience,
    DailySession,
    DailySleep,
    DailySpo2,
    DailyStress,
    DateFormat,
    EnhancedTag,
    Heartrate,
    PersonalInfo,
    RestModePeriod,
    RingConfiguration,
    Sleep,
    SleepTime,
    Tag,
    VO2Max,
    Workout,
} from "./types/oura.ts";
export * from "./types/oura.ts";
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
     * @returns {Promise<DailyActivity[]>} A array of DailyActivity objects.
     */
    getDailyActivityDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyActivity[]> {
        return this.getDocuments<DailyActivity>("daily_activity", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single activity document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyActivity>} A DailyActivity typed object.
     */
    getDailyActivity(documentId: string, accessToken?: string): Promise<DailyActivity> {
        return this.getDocumentById<DailyActivity>("daily_activity", documentId, accessToken);
    }

    /**
     * Retrieves cardiovascular age documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyCardiovascularAge[]>} A array of DailyCardiovascularAge objects.
     */
    getDailyCardiovascularAgeDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyCardiovascularAge[]> {
        return this.getDocuments<DailyCardiovascularAge>("daily_cardiovascular_age", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a cardiovascular age document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyCardiovascularAge>} A DailyCardiovascularAge typed object.
     */
    getDailyCardiovascularAge(documentId: string, accessToken?: string): Promise<DailyCardiovascularAge> {
        return this.getDocumentById<DailyCardiovascularAge>("daily_cardiovascular_age", documentId, accessToken);
    }

    /**
     * Retrieves daily readiness documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyReadiness[]>} A array of DailyReadiness objects.
     */
    getDailyReadinessDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyReadiness[]> {
        return this.getDocuments<DailyReadiness>("daily_readiness", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single readiness document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyReadiness>} A DailyReadiness typed object.
     */
    getDailyReadiness(documentId: string, accessToken?: string): Promise<DailyReadiness> {
        return this.getDocumentById<DailyReadiness>("daily_readiness", documentId, accessToken);
    }

    /**
     * Retrieves daily resilience documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyResilience[]>} A array of DailyResilience objects.
     */
    getDailyResilienceDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyResilience[]> {
        return this.getDocuments<DailyResilience>("daily_resilience", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single resilience document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyResilience>} A DailyResilience typed object.
     */
    getDailyResilience(documentId: string, accessToken?: string): Promise<DailyResilience> {
        return this.getDocumentById<DailyResilience>("daily_resilience", documentId, accessToken);
    }

    /**
     * Retrieves daily sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySleep[]>} A array of DailySleep objects.
     */
    getDailySleepDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailySleep[]> {
        return this.getDocuments<DailySleep>("daily_sleep", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily sleep document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySleep>} A DailySleep typed object.
     */
    getDailySleep(documentId: string, accessToken?: string): Promise<DailySleep> {
        return this.getDocumentById<DailySleep>("daily_sleep", documentId, accessToken);
    }

    /**
     * Retrieves daily spO2 (blood oxygenation) averages for a specified date range.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySpo2[]>} A array of DailySpo2 objects.
     */
    getDailySpo2Documents(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailySpo2[]> {
        return this.getDocuments<DailySpo2>("daily_spo2", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily spO2 (blood oxygenation) average document by its ID.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySpo2>} A DailySpo2 typed object.
     */
    getDailySpo2(documentId: string, accessToken?: string): Promise<DailySpo2> {
        return this.getDocumentById<DailySpo2>("daily_spo2", documentId, accessToken);
    }

    /**
     * Retrieves daily stress summary for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyStress[]>} A array of DailyStress objects.
     */
    getDailyStressDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailyStress[]> {
        return this.getDocuments<DailyStress>("daily_stress", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily stress summary document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyStress>} A DailyStress typed object.
     */
    getDailyStress(documentId: string, accessToken?: string): Promise<DailyStress> {
        return this.getDocumentById<DailyStress>("daily_stress", documentId, accessToken);
    }

    /**
     * Retrieves heart rate data for a specified date and time period.
     *
     * @param {string} startDateTime - Start date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} endDateTime - End date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Heartrate[]>} A array of Heartrate objects.
     */
    getHeartrate(
        startDateTime: string,
        endDateTime: string,
        accessToken?: string,
    ): Promise<Heartrate[]> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.fetchData("heartrate", params, accessToken) as unknown as Promise<Heartrate[]>;
    }

    /**
     * Retrieves personal information about the user.
     *
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<PersonalInfo>} A PersonalInfo typed object.
     */
    getPersonalInfo(accessToken?: string): Promise<PersonalInfo> {
        return this.fetchData("personal_info", undefined, accessToken) as unknown as Promise<PersonalInfo>;
    }

    /**
     * Retrieves rest mode periods for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RestModePeriod[]>} A array of RestModePeriod objects.
     */
    getRestModePeriodDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<RestModePeriod[]> {
        return this.getDocuments<RestModePeriod>("rest_mode_period", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single rest mode period document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RestModePeriod>} A RestModePeriod typed object.
     */
    getRestModePeriod(documentId: string, accessToken?: string): Promise<RestModePeriod> {
        return this.getDocumentById<RestModePeriod>("rest_mode_period", documentId, accessToken);
    }

    /**
     * Retrieves ring configuration information for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RingConfiguration[]>} A array of RingConfiguration objects.
     */
    getRingConfigurationDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<RingConfiguration[]> {
        return this.getDocuments<RingConfiguration>("ring_configuration", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single ring configuration document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RingConfiguration>} A RingConfiguration typed object.
     */
    getRingConfiguration(documentId: string, accessToken?: string): Promise<RingConfiguration> {
        return this.getDocumentById<RingConfiguration>("ring_configuration", documentId, accessToken);
    }

    /**
     * Retrieves daily session documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySession[]>} A array of DailySession objects.
     */
    getDailySessionDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<DailySession[]> {
        return this.getDocuments<DailySession>("session", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single daily session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySession>} A DailySession typed object.
     */
    getDailySession(documentId: string, accessToken?: string): Promise<DailySession> {
        return this.getDocumentById<DailySession>("session", documentId, accessToken);
    }

    /**
     * Retrieves sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Sleep[]>} A array of SleepDocuments objects.
     */
    getSleepDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<Sleep[]> {
        return this.getDocuments<Sleep>("sleep", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single sleep session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Sleep>} A Sleep typed object.
     */
    getSleep(documentId: string, accessToken?: string): Promise<Sleep> {
        return this.getDocumentById<Sleep>("sleep", documentId, accessToken);
    }

    /**
     * Retrieves recommended bedtime windows for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<SleepTime[]>} A array of SleepTime objects.
     */
    getSleepTimeDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<SleepTime[]> {
        return this.getDocuments<SleepTime>("sleep_time", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single recommended bedtime window document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<SleepTime>} A SleepTime typed object.
     */
    getSleepTime(documentId: string, accessToken?: string): Promise<SleepTime> {
        return this.getDocumentById<SleepTime>("sleep_time", documentId, accessToken);
    }

    /**
     * Retrieves daily tags for a specified date range.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Tag[]>} A array of Tag objects.
     */
    getTagDocuments(startDate: DateFormat, endDate: DateFormat, accessToken?: string): Promise<Tag[]> {
        console.log(
            "Tag is deprecated. We recommend transitioning to Enhanced Tag.",
        );
        return this.getDocuments<Tag>("tag", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single tag document by its ID.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Tag>} A Tag typed object.
     */
    getTag(documentId: string, accessToken?: string): Promise<Tag> {
        console.log(
            "Tag is deprecated. We recommend transitioning to Enhanced Tag.",
        );
        return this.getDocumentById<Tag>("tag", documentId, accessToken);
    }

    /**
     * Retrieves VO2Max documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<VO2Max[]>} A array of VO2Max objects.
     */
    getVO2MaxDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<VO2Max[]> {
        return this.getDocuments<VO2Max>("vO2_max", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single VO2Max document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<VO2Max>} A VO2Max typed object.
     */
    getVO2Max(documentId: string, accessToken?: string): Promise<VO2Max> {
        return this.getDocumentById<VO2Max>("vO2_max", documentId, accessToken);
    }

    /**
     * Retrieves workout documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Workout[]>} A array of Workout objects.
     */
    getWorkoutDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<Workout[]> {
        return this.getDocuments<Workout>("workout", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single workout document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Workout>} A Workout typed object.
     */
    getWorkout(documentId: string, accessToken?: string): Promise<Workout> {
        return this.getDocumentById<Workout>("workout", documentId, accessToken);
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
     * @returns {Promise<EnhancedTag[]>} A array of EnhancedTag objects.
     */
    getEnhancedTagDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
        accessToken?: string,
    ): Promise<EnhancedTag[]> {
        return this.getDocuments<EnhancedTag>("enhanced_tag", startDate, endDate, accessToken);
    }

    /**
     * Retrieves a single enhanced tags document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<EnhancedTag>} A EnhancedTag typed object.
     */
    getEnhancedTag(documentId: string, accessToken?: string): Promise<EnhancedTag> {
        return this.getDocumentById<EnhancedTag>("enhanced_tag", documentId, accessToken);
    }
}

export default OuraBase;
