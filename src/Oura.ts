import * as types from './types/oura.ts';

class Oura {
    accessToken: string;
    baseUrlv2: string;

    constructor(accessToken: string) {
        if (!accessToken) {
            throw 'Missing access token';
        }
        this.accessToken = accessToken;
        this.baseUrlv2 = 'https://api.ouraring.com/v2/usercollection/';
    }

    #get = async (url: string, qs?: Record<string, string>) => {
        const params = new URLSearchParams(qs);

        console.log(this.baseUrlv2 + encodeURI(url) + (qs ? '?' + params.toString() : ''));
        const response = await fetch(this.baseUrlv2 + encodeURI(url) + (qs ? '?' + params.toString() : ''), {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken,
            },
        });

        if (response.ok) {
            return await response.json();
        }

        throw new Error(`Problem fetching data. ${response.status} - ${response.statusText}`);
    };

    getDailyActivityDocuments(startDate: string, endDate: string): Promise<types.DailyActivityDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('daily_activity', params) as Promise<types.DailyActivityDocuments>;
    }

    getDailyActivity(documentId: string): Promise<types.DailyActivity> {
        return this.#get('daily_activity/' + documentId) as Promise<types.DailyActivity>;
    }

    getDailyReadinessDocuments(startDate: string, endDate: string): Promise<types.DailyReadinessDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('daily_readiness', params) as Promise<types.DailyReadinessDocuments>;
    }

    getDailyReadiness(documentId: string): Promise<types.DailyReadiness> {
        return this.#get('daily_readiness/' + documentId) as Promise<types.DailyReadiness>;
    }

    getDailySleepDocuments(startDate: string, endDate: string): Promise<types.DailySleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('daily_sleep', params) as Promise<types.DailySleepDocuments>;
    }

    getDailySleep(documentId: string): Promise<types.DailySleep> {
        return this.#get('daily_sleep/' + documentId) as Promise<types.DailySleep>;
    }

    getHeartrate(startDateTime: string, endDateTime: string): Promise<types.Heartrate> {
        const params = { start_datetime: startDateTime, end_datetime: endDateTime };
        return this.#get('heartrate', params) as Promise<types.Heartrate>;
    }

    getPersonalInfo(): Promise<types.PersonalInfo> {
        return this.#get('personal_info') as Promise<types.PersonalInfo>;
    }

    getDailySessionDocuments(startDate: string, endDate: string): Promise<types.DailySessionDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('session', params) as Promise<types.DailySessionDocuments>;
    }

    getDailySession(documentId: string): Promise<types.DailySession> {
        return this.#get('session/' + documentId) as Promise<types.DailySession>;
    }

    getSleepDocuments(startDate: string, endDate: string): Promise<types.SleepDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('sleep', params) as Promise<types.SleepDocuments>;
    }

    getSleep(documentId: string): Promise<types.Sleep> {
        return this.#get('sleep/' + documentId) as Promise<types.Sleep>;
    }

    getTagDocuments(startDate: string, endDate: string): Promise<types.TagDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('tag', params) as Promise<types.TagDocuments>;
    }

    getTag(documentId: string): Promise<types.Tag> {
        return this.#get('tag/' + documentId) as Promise<types.Tag>;
    }

    getWorkoutDocuments(startDate: string, endDate: string): Promise<types.WorkoutDocuments> {
        const params = { start_date: startDate, end_date: endDate };
        return this.#get('workout', params) as Promise<types.WorkoutDocuments>;
    }

    getWorkout(documentId: string): Promise<types.Workout> {
        return this.#get('workout/' + documentId) as Promise<types.Workout>;
    }
}

export default Oura;
