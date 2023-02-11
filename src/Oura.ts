/**
 * oura_api
 *
 * @file Class containing all the methods to access the Oura API with a access token.
 *
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */
import * as types from "./types/oura.ts";

class Oura {
    #accessToken: string;
    #baseUrlv2: string;

    /**
     * Takes the accessToken as a string parameter and stores it for use with the requests made by this class.
     * @param accessToken - A personal access token generated at the Oura Cloud website.
     */
    constructor(accessToken: string) {
        if (!accessToken) {
            throw "Missing access token";
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
    getDailyActivityDocuments(startDate: string, endDate: string): Promise<types.DailyActivityDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_activity", params) as Promise<types.DailyActivityDocuments>;
    }

    /**
     * Retrieves a single activity document.
     * @param documentId - The document id in string format.
     * @returns A DailyActivity typed object.
     */
    getDailyActivity(documentId: string): Promise<types.DailyActivity> {
        return this.#get("daily_activity/" + documentId) as Promise<types.DailyActivity>;
    }

    /**
     * Retrieves daily readiness documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailyReadinessDocuments typed object.
     */
    getDailyReadinessDocuments(startDate: string, endDate: string): Promise<types.DailyReadinessDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_readiness", params) as Promise<types.DailyReadinessDocuments>;
    }

    /**
     * Retrieves a single readiness document.
     * @param documentId - The document id in string format.
     * @returns A DailyReadiness typed object.
     */
    getDailyReadiness(documentId: string): Promise<types.DailyReadiness> {
        return this.#get("daily_readiness/" + documentId) as Promise<types.DailyReadiness>;
    }

    /**
     * Retrieves daily sleep documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailySleepDocuments typed object.
     */
    getDailySleepDocuments(startDate: string, endDate: string): Promise<types.DailySleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("daily_sleep", params) as Promise<types.DailySleepDocuments>;
    }

    /**
     * Retrieves a single daily sleep document.
     * @param documentId - The document id in string format.
     * @returns A DailySleep typed object.
     */
    getDailySleep(documentId: string): Promise<types.DailySleep> {
        return this.#get("daily_sleep/" + documentId) as Promise<types.DailySleep>;
    }

    /**
     * Retrieves heartrate data for a startDateTime - endDateTime period. Includes day time
     * and night time heartrate in 5 minute increments.
     * @param startDateTime - Start date and time of the period in string format.
     * @param endDateTime - End date and time of the period in string format.
     * @returns A Heartrate typed object.
     */
    getHeartrate(startDateTime: string, endDateTime: string): Promise<types.Heartrate> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.#get("heartrate", params) as Promise<types.Heartrate>;
    }

    /**
     * Retrieves the personal information about the user.
     * @returns A PersonalInfo typed object.
     */
    getPersonalInfo(): Promise<types.PersonalInfo> {
        return this.#get("personal_info") as Promise<types.PersonalInfo>;
    }

    /**
     * Retrieves daily session documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A DailySessionDocuments typed object.
     */
    getDailySessionDocuments(startDate: string, endDate: string): Promise<types.DailySessionDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("session", params) as Promise<types.DailySessionDocuments>;
    }

    /**
     * Retrieves a single daily session document.
     * @param documentId - The document id in string format.
     * @returns A DailySession typed object.
     */
    getDailySession(documentId: string): Promise<types.DailySession> {
        return this.#get("session/" + documentId) as Promise<types.DailySession>;
    }

    /**
     * Retrieves sleep documents for a startDate - endDate period. Can be multiple sleep periods per day.
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A SleepDocuments typed object.
     */
    getSleepDocuments(startDate: string, endDate: string): Promise<types.SleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("sleep", params) as Promise<types.SleepDocuments>;
    }

    /**
     * Retrieves a single sleep session document.
     * @param documentId - The document id in string format.
     * @returns A Sleep typed object.
     */
    getSleep(documentId: string): Promise<types.Sleep> {
        return this.#get("sleep/" + documentId) as Promise<types.Sleep>;
    }

    /**
     * Retrieves daily tags for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A TagDocuments typed object.
     */
    getTagDocuments(startDate: string, endDate: string): Promise<types.TagDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("tag", params) as Promise<types.TagDocuments>;
    }

    /**
     * Retrieves a single tag document.
     * @param documentId - The document id in string format.
     * @returns A Tag typed object.
     */
    getTag(documentId: string): Promise<types.Tag> {
        return this.#get("tag/" + documentId) as Promise<types.Tag>;
    }

    /**
     * Retrieves workout documents for a startDate - endDate period
     * @param startDate - Start date of the period in string format.
     * @param endDate - End date of the period in string format.
     * @returns A WorkoutDocuments typed object.
     */
    getWorkoutDocuments(startDate: string, endDate: string): Promise<types.WorkoutDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get("workout", params) as Promise<types.WorkoutDocuments>;
    }

    /**
     * Retrieves a single workout document.
     * @param documentId - The document id in string format.
     * @returns A Workout typed object.
     */
    getWorkout(documentId: string): Promise<types.Workout> {
        return this.#get("workout/" + documentId) as Promise<types.Workout>;
    }
}

export default Oura;
