/**
 * Class containing all the methods to access the Oura API with an access token.
 *
 * @class Oura
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */
import {
    DailyActivity,
    DailyActivityDocuments,
    DailyReadiness,
    DailyReadinessDocuments,
    DailySession,
    DailySessionDocuments,
    DailySleep,
    DailySleepDocuments,
    DailySpo2,
    DailySpo2Documents,
    DailyStress,
    DailyStressDocuments,
    DateFormat,
    EnhancedTag,
    EnhancedTagDocuments,
    Heartrate,
    PersonalInfo,
    RestModePeriod,
    RestModePeriodDocuments,
    RingConfiguration,
    RingConfigurationDocuments,
    Sleep,
    SleepDocuments,
    SleepTime,
    SleepTimeDocuments,
    Tag,
    TagDocuments,
    Workout,
    WorkoutDocuments,
} from "./types/oura.ts";
export * from "./types/oura.ts";
import { APIError, isValidDate, MissingTokenError, ValidationError } from "./utils.ts";

/**
 * Base class for the Oura API.
 * Class containing all the methods to access the Oura API with an access token.
 */
class Oura {
    #accessToken: string;
    #baseUrlv2: string;

    /**
     * Creates a new Oura API client.
     *
     * @constructor
     * @param {string} accessToken - A personal access token generated at the Oura Cloud website.
     * @throws {Error} Throws an MissingTokenError-error if the access token is missing.
     */
    constructor(accessToken: string) {
        if (!accessToken) {
            throw new MissingTokenError();
        }
        this.#accessToken = accessToken;
        this.#baseUrlv2 = "https://api.ouraring.com/v2/usercollection/";
    }

    /**
     * Private method to make GET requests to the API endpoints.
     *
     * @private
     * @param {string} url - The API endpoint URL.
     * @param {Record<string, string>} [qs] - Optional querystring parameters.
     * @returns {Promise<object>} A JSON parsed fetch response.
     * @throws {Error} Throws an APIError-error if the response status is not OK or a ValidationError-error if querystring validation fails.
     */
    #get = async (url: string, qs?: Record<string, string>) => {
        //Validate certain with a simple date parser.
        for (const [key, value] of Object.entries(qs || {})) {
            if (["start_date", "end_date", "start_datetime", "end_datetime"].includes(key)) {
                if (!isValidDate(value)) {
                    throw new ValidationError(`Invalid date format for ${key}: ${value}`);
                }
            }
        }

        const params = new URLSearchParams(qs);

        const response = await fetch(this.#baseUrlv2 + encodeURI(url) + (qs ? "?" + params.toString() : ""), {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + this.#accessToken,
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            let detail = "";
            interface errorData {
                detail?: string;
            }
            try {
                const errorData: errorData = await response.json() as errorData;
                console.log(errorData);
                detail = errorData.detail || "";
            } catch (_err) {
                detail = "No details";
            }
            throw new APIError(
                "Problem fetching data.",
                response.status,
                response.statusText,
                detail,
                this.#baseUrlv2 + encodeURI(url),
                "GET",
            );
        }
    };

    /**
     * Retrieves daily activity documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailyActivityDocuments>} A DailyActivityDocuments typed object.
     */
    getDailyActivityDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailyActivityDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_activity", params) as Promise<DailyActivityDocuments>;
    }

    /**
     * Retrieves a single activity document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailyActivity>} A DailyActivity typed object.
     */
    getDailyActivity(documentId: string): Promise<DailyActivity> {
        return this.#get("daily_activity/" + documentId) as Promise<DailyActivity>;
    }

    /**
     * Retrieves daily readiness documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailyReadinessDocuments>} A DailyReadinessDocuments typed object.
     */
    getDailyReadinessDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailyReadinessDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_readiness", params) as Promise<DailyReadinessDocuments>;
    }

    /**
     * Retrieves a single readiness document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailyReadiness>} A DailyReadiness typed object.
     */
    getDailyReadiness(documentId: string): Promise<DailyReadiness> {
        return this.#get("daily_readiness/" + documentId) as Promise<DailyReadiness>;
    }

    /**
     * Retrieves daily sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailySleepDocuments>} A DailySleepDocuments typed object.
     */
    getDailySleepDocuments(startDate: DateFormat, endDate: DateFormat): Promise<DailySleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_sleep", params) as Promise<DailySleepDocuments>;
    }

    /**
     * Retrieves a single daily sleep document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailySleep>} A DailySleep typed object.
     */
    getDailySleep(documentId: string): Promise<DailySleep> {
        return this.#get("daily_sleep/" + documentId) as Promise<DailySleep>;
    }

    /**
     * Retrieves daily spO2 (blood oxygenation) averages for a specified date range.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailySpo2Documents>} A DailySpo2Documents typed object.
     */
    getDailySpo2Documents(startDate: DateFormat, endDate: DateFormat): Promise<DailySpo2Documents> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_spo2", params) as Promise<DailySpo2Documents>;
    }

    /**
     * Retrieves a single daily spO2 (blood oxygenation) average document by its ID.
     * Data will only be available for users with a Gen 3 Oura Ring
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailySpo2>} A DailySpo2 typed object.
     */
    getDailySpo2(documentId: string): Promise<DailySpo2> {
        return this.#get("daily_spo2/" + documentId) as Promise<DailySpo2>;
    }

    /**
     * Retrieves daily stress summary for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailyStressDocuments>} A DailyStressDocuments typed object.
     */
    getDailyStressDocuments(startDate: DateFormat, endDate: DateFormat): Promise<DailyStressDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_stress", params) as Promise<DailyStressDocuments>;
    }

    /**
     * Retrieves a single daily stress summary document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailyStress>} A DailyStress typed object.
     */
    getDailyStress(documentId: string): Promise<DailyStress> {
        return this.#get("daily_stress/" + documentId) as Promise<DailyStress>;
    }

    /**
     * Retrieves heart rate data for a specified date and time period.
     *
     * @param {string} startDateTime - Start date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @param {string} endDateTime - End date and time of the period in string format (e.g., 'YYYY-MM-DDTHH:mm:ss').
     * @returns {Promise<Heartrate>} A Heartrate typed object.
     */
    getHeartrate(startDateTime: string, endDateTime: string): Promise<Heartrate> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.#get("heartrate", params) as Promise<Heartrate>;
    }

    /**
     * Retrieves personal information about the user.
     *
     * @returns {Promise<PersonalInfo>} A PersonalInfo typed object.
     */
    getPersonalInfo(): Promise<PersonalInfo> {
        return this.#get("personal_info") as Promise<PersonalInfo>;
    }

    /**
     * Retrieves rest mode periods for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<RestModePeriodDocuments>} A RestModePeriodDocuments typed object.
     */
    getRestModePeriodDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<RestModePeriodDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("rest_mode_period", params) as Promise<RestModePeriodDocuments>;
    }

    /**
     * Retrieves a single rest mode period document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<RestModePeriod>} A RestModePeriod typed object.
     */
    getRestModePeriod(documentId: string): Promise<RestModePeriod> {
        return this.#get("rest_mode_period/" + documentId) as Promise<RestModePeriod>;
    }

    /**
     * Retrieves ring configuration information for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<RingConfigurationDocuments>} A RingConfigurationDocuments typed object.
     */
    getRingConfigurationDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<RingConfigurationDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("ring_configuration", params) as Promise<RingConfigurationDocuments>;
    }

    /**
     * Retrieves a single ring configuration document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<RingConfiguration>} A RingConfiguration typed object.
     */
    getRingConfiguration(documentId: string): Promise<RingConfiguration> {
        return this.#get("ring_configuration/" + documentId) as Promise<RingConfiguration>;
    }

    /**
     * Retrieves daily session documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<DailySessionDocuments>} A DailySessionDocuments typed object.
     */
    getDailySessionDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailySessionDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("session", params) as Promise<DailySessionDocuments>;
    }

    /**
     * Retrieves a single daily session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<DailySession>} A DailySession typed object.
     */
    getDailySession(documentId: string): Promise<DailySession> {
        return this.#get("session/" + documentId) as Promise<DailySession>;
    }

    /**
     * Retrieves sleep documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<SleepDocuments>} A SleepDocuments typed object.
     */
    getSleepDocuments(startDate: DateFormat, endDate: DateFormat): Promise<SleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("sleep", params) as Promise<SleepDocuments>;
    }

    /**
     * Retrieves a single sleep session document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<Sleep>} A Sleep typed object.
     */
    getSleep(documentId: string): Promise<Sleep> {
        return this.#get("sleep/" + documentId) as Promise<Sleep>;
    }

    /**
     * Retrieves recommended bedtime windows for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<SleepTimeDocuments>} A SleepTimeDocuments typed object.
     */
    getSleepTimeDocuments(startDate: DateFormat, endDate: DateFormat): Promise<SleepTimeDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("sleep_time", params) as Promise<SleepTimeDocuments>;
    }

    /**
     * Retrieves a single recommended bedtime window document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<SleepTime>} A SleepTime typed object.
     */
    getSleepTime(documentId: string): Promise<SleepTime> {
        return this.#get("sleep_time/" + documentId) as Promise<SleepTime>;
    }

    /**
     * Retrieves daily tags for a specified date range.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<TagDocuments>} A TagDocuments typed object.
     */
    getTagDocuments(startDate: DateFormat, endDate: DateFormat): Promise<TagDocuments> {
        console.log("Tag is deprecated. We recommend transitioning to Enhanced Tag.");
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("tag", params) as Promise<TagDocuments>;
    }

    /**
     * Retrieves a single tag document by its ID.
     *
     * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<Tag>} A Tag typed object.
     */
    getTag(documentId: string): Promise<Tag> {
        console.log("Tag is deprecated. We recommend transitioning to Enhanced Tag.");
        return this.#get("tag/" + documentId) as Promise<Tag>;
    }

    /**
     * Retrieves workout documents for a specified date range.
     *
     * @param {string} startDate - Start date of the period in string format (e.g., 'YYYY-MM-DD').
     * @param {string} endDate - End date of the period in string format (e.g., 'YYYY-MM-DD').
     * @returns {Promise<WorkoutDocuments>} A WorkoutDocuments typed object.
     */
    getWorkoutDocuments(startDate: DateFormat, endDate: DateFormat): Promise<WorkoutDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("workout", params) as Promise<WorkoutDocuments>;
    }

    /**
     * Retrieves a single workout document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<Workout>} A Workout typed object.
     */
    getWorkout(documentId: string): Promise<Workout> {
        return this.#get("workout/" + documentId) as Promise<Workout>;
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
     * @returns {Promise<TagDocuments>} A TagDocuments typed object.
     */
    getEnhancedTagDocuments(startDate: DateFormat, endDate: DateFormat): Promise<EnhancedTagDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("enhanced_tag", params) as Promise<EnhancedTagDocuments>;
    }

    /**
     * Retrieves a single enhanced tags document by its ID.
     *
     * @param {string} documentId - The document ID in string format.
     * @returns {Promise<Tag>} A Tag typed object.
     */
    getEnhancedTag(documentId: string): Promise<EnhancedTag> {
        return this.#get("enhanced_tag/" + documentId) as Promise<EnhancedTag>;
    }
}

export default Oura;
