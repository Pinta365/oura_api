/**
 * oura_api
 *
 * @file Class containing all the methods to access the Oura API with a access token.
 *
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
    DateFormat,
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

class Oura {
    #accessToken: string;
    #baseUrlv2: string;

    /**
     * Takes the accessToken as a string parameter and stores it for use with the requests made by this class.
     * @param accessToken - A personal access token generated at the Oura Cloud website.
     */
    constructor(accessToken: string) {
        if (!accessToken) {
            throw new Error("Missing access token");
        }
        this.#accessToken = accessToken;
        this.#baseUrlv2 = "https://api.ouraring.com/v2/usercollection/";
    }

    /**
     * Private class method for doing the fetch requests to the API endpoints. Throws an error
     * if the response is not ok.
     * @param url - API endpoint url.
     * @param qs - optional parameter for including a querystring parameter to the endpoint.
     * @returns A JSON parsed fetch response.
     */
    #get = async (url: string, qs?: Record<string, string>) => {
        const params = new URLSearchParams(qs);

        const response = await fetch(this.#baseUrlv2 + encodeURI(url) + (qs ? "?" + params.toString() : ""), {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + this.#accessToken,
            },
        });

        if (response.ok) {
            return await response.json();
        }

        throw new Error(`Problem fetching data. ${response.status} - ${response.statusText}`);
    };

    /**
     * Retrieves daily activity documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailyActivityDocuments typed object.
     */
    getDailyActivityDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailyActivityDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_activity", params) as Promise<DailyActivityDocuments>;
    }

    /**
     * Retrieves a single activity document.
     * @param documentId - The document id in string format.
     * @returns A DailyActivity typed object.
     */
    getDailyActivity(documentId: string): Promise<DailyActivity> {
        return this.#get("daily_activity/" + documentId) as Promise<DailyActivity>;
    }

    /**
     * Retrieves daily readiness documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailyReadinessDocuments typed object.
     */
    getDailyReadinessDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailyReadinessDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_readiness", params) as Promise<DailyReadinessDocuments>;
    }

    /**
     * Retrieves a single readiness document.
     * @param documentId - The document id in string format.
     * @returns A DailyReadiness typed object.
     */
    getDailyReadiness(documentId: string): Promise<DailyReadiness> {
        return this.#get("daily_readiness/" + documentId) as Promise<DailyReadiness>;
    }

    /**
     * Retrieves daily sleep documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailySleepDocuments typed object.
     */
    getDailySleepDocuments(startDate: DateFormat, endDate: DateFormat): Promise<DailySleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_sleep", params) as Promise<DailySleepDocuments>;
    }

    /**
     * Retrieves a single daily sleep document.
     * @param documentId - The document id in string format.
     * @returns A DailySleep typed object.
     */
    getDailySleep(documentId: string): Promise<DailySleep> {
        return this.#get("daily_sleep/" + documentId) as Promise<DailySleep>;
    }

    /**
     * Retrieves daily spO2 (blood oxygenation) average for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailySpo2Documents typed object.
     */
    getDailySpo2Documents(startDate: DateFormat, endDate: DateFormat): Promise<DailySpo2Documents> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_spo2", params) as Promise<DailySpo2Documents>;
    }

    /**
     * Retrieves a single daily spO2 (blood oxygenation) average document.
     * @param documentId - The document id in string format.
     * @returns A DailySpo2 typed object.
     */
    getDailySpo2(documentId: string): Promise<DailySpo2> {
        return this.#get("daily_spo2/" + documentId) as Promise<DailySpo2>;
    }

    /**
     * Retrieves heartrate data for a startDateTime - endDateTime period. Includes day time
     * and night time heartrate in 5 minute increments.
     * @param startDateTime - Start date and time of the period in string format.
     * @param endDateTime - End date and time of the period in string format.
     * @returns A Heartrate typed object.
     */
    getHeartrate(startDateTime: string, endDateTime: string): Promise<Heartrate> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.#get("heartrate", params) as Promise<Heartrate>;
    }

    /**
     * Retrieves the personal information about the user.
     * @returns A PersonalInfo typed object.
     */
    getPersonalInfo(): Promise<PersonalInfo> {
        return this.#get("personal_info") as Promise<PersonalInfo>;
    }

    /**
     * Retrieves rest mode periods for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A RestModePeriodDocuments typed object.
     */
    getRestModePeriodDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<RestModePeriodDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("rest_mode_period", params) as Promise<RestModePeriodDocuments>;
    }

    /**
     * Retrieves a single rest mode period document.
     * @param documentId - The document id in string format.
     * @returns A RestModePeriod typed object.
     */
    getRestModePeriod(documentId: string): Promise<RestModePeriod> {
        return this.#get("rest_mode_period/" + documentId) as Promise<RestModePeriod>;
    }

    /**
     * Retrieves ring configuration information for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A RingConfigurationDocuments typed object.
     */
    getRingConfigurationDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<RingConfigurationDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("ring_configuration", params) as Promise<RingConfigurationDocuments>;
    }

    /**
     * Retrieves a single ring configuration document.
     * @param documentId - The document id in string format.
     * @returns A RingConfiguration typed object.
     */
    getRingConfiguration(documentId: string): Promise<RingConfiguration> {
        return this.#get("ring_configuration/" + documentId) as Promise<RingConfiguration>;
    }

    /**
     * Retrieves daily session documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailySessionDocuments typed object.
     */
    getDailySessionDocuments(
        startDate: DateFormat,
        endDate: DateFormat,
    ): Promise<DailySessionDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("session", params) as Promise<DailySessionDocuments>;
    }

    /**
     * Retrieves a single daily session document.
     * @param documentId - The document id in string format.
     * @returns A DailySession typed object.
     */
    getDailySession(documentId: string): Promise<DailySession> {
        return this.#get("session/" + documentId) as Promise<DailySession>;
    }

    /**
     * Retrieves sleep documents for a startDate - endDate period. Can be multiple sleep periods per day.
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A SleepDocuments typed object.
     */
    getSleepDocuments(startDate: DateFormat, endDate: DateFormat): Promise<SleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("sleep", params) as Promise<SleepDocuments>;
    }

    /**
     * Retrieves a single sleep session document.
     * @param documentId - The document id in string format.
     * @returns A Sleep typed object.
     */
    getSleep(documentId: string): Promise<Sleep> {
        return this.#get("sleep/" + documentId) as Promise<Sleep>;
    }

    /**
     * Retrieves recommendated bedtime window for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A SleepTimeDocuments typed object.
     */
    getSleepTimeDocuments(startDate: DateFormat, endDate: DateFormat): Promise<SleepTimeDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("sleep_time", params) as Promise<SleepTimeDocuments>;
    }

    /**
     * Retrieves a single recommendated bedtime window document.
     * @param documentId - The document id in string format.
     * @returns A SleepTime typed object.
     */
    getSleepTime(documentId: string): Promise<SleepTime> {
        return this.#get("sleep_time/" + documentId) as Promise<SleepTime>;
    }

    /**
     * Retrieves daily tags for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A TagDocuments typed object.
     */
    getTagDocuments(startDate: DateFormat, endDate: DateFormat): Promise<TagDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("tag", params) as Promise<TagDocuments>;
    }

    /**
     * Retrieves a single tag document.
     * @param documentId - The document id in string format.
     * @returns A Tag typed object.
     */
    getTag(documentId: string): Promise<Tag> {
        return this.#get("tag/" + documentId) as Promise<Tag>;
    }

    /**
     * Retrieves workout documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A WorkoutDocuments typed object.
     */
    getWorkoutDocuments(startDate: DateFormat, endDate: DateFormat): Promise<WorkoutDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("workout", params) as Promise<WorkoutDocuments>;
    }

    /**
     * Retrieves a single workout document.
     * @param documentId - The document id in string format.
     * @returns A Workout typed object.
     */
    getWorkout(documentId: string): Promise<Workout> {
        return this.#get("workout/" + documentId) as Promise<Workout>;
    }
}

export default Oura;
