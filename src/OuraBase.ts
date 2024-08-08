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
    Workout,
} from "./types/oura.ts";
export * from "./types/oura.ts";
import { API_URLS, APIError, isValidDate, ValidationError } from "./utils.ts";

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
     * @throws {APIError} Throws if the response status is not OK.
     * @throws {ValidationError} Throws if querystring validation fails.
     */
    #get = async (accessToken: string | undefined, url: string, qs?: Record<string, string>) => {
        //Validate certain with a simple date parser.
        for (const [key, value] of Object.entries(qs || {})) {
            if (
                ["start_date", "end_date", "start_datetime", "end_datetime"].includes(
                    key,
                )
            ) {
                if (!isValidDate(value)) {
                    throw new ValidationError(`Invalid date format for ${key}: ${value}`);
                }
            }
        }

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

        if (response.ok) {
            return await response.json();
        } else {
            let detail = "";
            interface errorData {
                detail?: string;
            }
            try {
                const errorData: errorData = await response.json() as errorData;
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
            const response = await this.#get(accessToken, endpoint, params);
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_activity", params, accessToken) as unknown as Promise<DailyActivity[]>;
    }

    /**
     * Retrieves a single activity document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyActivity>} A DailyActivity typed object.
     */
    getDailyActivity(documentId: string, accessToken?: string): Promise<DailyActivity> {
        return this.fetchData("daily_activity/" + documentId, undefined, accessToken) as unknown as Promise<
            DailyActivity
        >;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_cardiovascular_age", params, accessToken) as unknown as Promise<
            DailyCardiovascularAge[]
        >;
    }

    /**
     * Retrieves a cardiovascular age document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyCardiovascularAge>} A DailyCardiovascularAge typed object.
     */
    getDailyCardiovascularAge(documentId: string, accessToken?: string): Promise<DailyCardiovascularAge> {
        return this.fetchData("daily_cardiovascular_age/" + documentId, undefined, accessToken) as unknown as Promise<
            DailyCardiovascularAge
        >;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_readiness", params, accessToken) as unknown as Promise<DailyReadiness[]>;
    }

    /**
     * Retrieves a single readiness document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyReadiness>} A DailyReadiness typed object.
     */
    getDailyReadiness(documentId: string, accessToken?: string): Promise<DailyReadiness> {
        return this.fetchData("daily_readiness/" + documentId, undefined, accessToken) as unknown as Promise<
            DailyReadiness
        >;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_resilience", params, accessToken) as unknown as Promise<DailyResilience[]>;
    }

    /**
     * Retrieves a single resilience document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyResilience>} A DailyResilience typed object.
     */
    getDailyResilience(documentId: string, accessToken?: string): Promise<DailyResilience> {
        return this.fetchData("daily_resilience/" + documentId, undefined, accessToken) as unknown as Promise<
            DailyResilience
        >;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_sleep", params, accessToken) as unknown as Promise<DailySleep[]>;
    }

    /**
     * Retrieves a single daily sleep document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySleep>} A DailySleep typed object.
     */
    getDailySleep(documentId: string, accessToken?: string): Promise<DailySleep> {
        return this.fetchData("daily_sleep/" + documentId, undefined, accessToken) as unknown as Promise<DailySleep>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_spo2", params, accessToken) as unknown as Promise<DailySpo2[]>;
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
        return this.fetchData("daily_spo2/" + documentId, undefined, accessToken) as unknown as Promise<DailySpo2>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("daily_stress", params, accessToken) as unknown as Promise<DailyStress[]>;
    }

    /**
     * Retrieves a single daily stress summary document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailyStress>} A DailyStress typed object.
     */
    getDailyStress(documentId: string, accessToken?: string): Promise<DailyStress> {
        return this.fetchData("daily_stress/" + documentId, undefined, accessToken) as unknown as Promise<DailyStress>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("rest_mode_period", params, accessToken) as unknown as Promise<RestModePeriod[]>;
    }

    /**
     * Retrieves a single rest mode period document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RestModePeriod>} A RestModePeriod typed object.
     */
    getRestModePeriod(documentId: string, accessToken?: string): Promise<RestModePeriod> {
        return this.fetchData("rest_mode_period/" + documentId, undefined, accessToken) as unknown as Promise<
            RestModePeriod
        >;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("ring_configuration", params, accessToken) as unknown as Promise<RingConfiguration[]>;
    }

    /**
     * Retrieves a single ring configuration document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<RingConfiguration>} A RingConfiguration typed object.
     */
    getRingConfiguration(documentId: string, accessToken?: string): Promise<RingConfiguration> {
        return this.fetchData(
            "ring_configuration/" + documentId,
            undefined,
            accessToken,
        ) as unknown as Promise<RingConfiguration>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("session", params, accessToken) as unknown as Promise<DailySession[]>;
    }

    /**
     * Retrieves a single daily session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<DailySession>} A DailySession typed object.
     */
    getDailySession(documentId: string, accessToken?: string): Promise<DailySession> {
        return this.fetchData("session/" + documentId, undefined, accessToken) as unknown as Promise<DailySession>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("sleep", params, accessToken) as unknown as Promise<Sleep[]>;
    }

    /**
     * Retrieves a single sleep session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Sleep>} A Sleep typed object.
     */
    getSleep(documentId: string, accessToken?: string): Promise<Sleep> {
        return this.fetchData("sleep/" + documentId, undefined, accessToken) as unknown as Promise<Sleep>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("sleep_time", params, accessToken) as unknown as Promise<SleepTime[]>;
    }

    /**
     * Retrieves a single recommended bedtime window document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<SleepTime>} A SleepTime typed object.
     */
    getSleepTime(documentId: string, accessToken?: string): Promise<SleepTime> {
        return this.fetchData("sleep_time/" + documentId, undefined, accessToken) as unknown as Promise<SleepTime>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("tag", params, accessToken) as unknown as Promise<Tag[]>;
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
        return this.fetchData("tag/" + documentId, undefined, accessToken) as unknown as Promise<Tag>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("workout", params, accessToken) as unknown as Promise<Workout[]>;
    }

    /**
     * Retrieves a single workout document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<Workout>} A Workout typed object.
     */
    getWorkout(documentId: string, accessToken?: string): Promise<Workout> {
        return this.fetchData("workout/" + documentId, undefined, accessToken) as unknown as Promise<Workout>;
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
        const params = { start_date: startDate, end_date: endDate };
        return this.fetchData("enhanced_tag", params, accessToken) as unknown as Promise<EnhancedTag[]>;
    }

    /**
     * Retrieves a single enhanced tags document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @param {string} [accessToken] - Optional access token for OAuth driven calls.
     * @returns {Promise<EnhancedTag>} A EnhancedTag typed object.
     */
    getEnhancedTag(documentId: string, accessToken?: string): Promise<EnhancedTag> {
        return this.fetchData("enhanced_tag/" + documentId, undefined, accessToken) as unknown as Promise<EnhancedTag>;
    }
}

export default OuraBase;
