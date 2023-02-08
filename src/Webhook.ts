/**
 * oura_api
 *
 * @file Class containing all the methods to access the Oura Webhook Subscription API with a client id and client secret.
 *
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */
import * as types from './types/webhook.ts';

class Webhook {
    #clientId: string;
    #clientSecret: string;
    #baseUrlv2: string;

    /**
     * Takes the cliend id and secret as string parameters and stores it for use with the requests made by this class.
     * @param clientId - A client id generated at the Oura Cloud website.
     * @param clientSecret - A client secret generated at the Oura Cloud website.
     */
    constructor(clientId: string, clientSecret: string) {
        if (!clientId) {
            throw 'Missing client id.';
        }
        if (!clientSecret) {
            throw 'Missing client secret.';
        }

        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#baseUrlv2 = 'https://api.ouraring.com/v2/webhook/';
    }

    /**
     * Private class method for doing the fetch requests to the API endpoints. Throws an error
     * if the response is not ok.
     * @param method - Fetch method
     * @param url - API endpoint url.
     * @param body - optional parameter for supplying a POST/PUT body.
     * @returns A JSON or Text parsed fetch response.
     */
    #request = async (method: string, url: string, body?: Record<string, string | number | symbol | undefined>) => {
        let options = {};
        if (method === 'POST' || method === 'PUT') {
            options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': this.#clientId,
                    'x-client-secret': this.#clientSecret,
                },
            };
            if (body) {
                Object.assign(options, { body: JSON.stringify(body) });
            }
        } else {
            options = {
                method,
                headers: {
                    'x-client-id': this.#clientId,
                    'x-client-secret': this.#clientSecret,
                },
            };
        }

        const response = await fetch(this.#baseUrlv2 + encodeURI(url), options);

        if (response.ok) {
            if (method === 'DELETE') {
                return await response.text();
            } else {
                return await response.json();
            }
        }

        throw new Error(`Problem with request. ${response.status} - ${response.statusText}`);
    };

    /**
     * Retrieves a list of current active webhook subscriptions.
     * @returns an array of Subscription typed objects.
     */
    listSubscriptions(): Promise<types.Subscription[]> {
        return this.#request('GET', 'subscription') as Promise<types.Subscription[]>;
    }

    /**
     * Retrieves a specific webhook subscription by id.
     * @param id - Subscription id in string format.
     * @returns A Subscription typed object.
     */
    getSubscription(id: string): Promise<types.Subscription> {
        return this.#request('GET', 'subscription/' + id) as Promise<types.Subscription>;
    }

    /**
     * Creates a new webhook subscription. See setup documentation on the Oura Developer website
     * for detailed description of the creation workflow.
     * @param callbackUrl - Your callback url used buy Oura to post subscriptions events to.
     * @param verificationToken - Your verification token, use to verify Ouras calls to your api.
     * @param eventType - One of the EventTypes.
     * @param dataType - One of the DataTypes.
     * @returns A Subscription typed object of the created sub.
     */
    createSubscription(
        callbackUrl: string,
        verificationToken: string,
        eventType: types.EventType,
        dataType: types.DataType,
    ): Promise<types.Subscription> {
        const data = {
            callback_url: callbackUrl,
            verification_token: verificationToken,
            event_type: eventType,
            data_type: dataType,
        };
        return this.#request('POST', 'subscription', data) as Promise<types.Subscription>;
    }

    /**
     * Updates a webhook subscription.
     * @param id - Subscription id in string format.
     * @param verificationToken - Your verification token, use to verify Ouras calls to your api.
     * @param callbackUrl - Callback url used buy Oura to post subscriptions to.
     * @param eventType - One of the EventTypes.
     * @param dataType - One of the DataTypes.
     * @returns A Subscription typed object of the updated sub.
     */
    updateSubscription(
        id: string,
        verificationToken: string,
        callbackUrl?: string,
        eventType?: types.EventType,
        dataType?: types.DataType,
    ): Promise<types.Subscription> {
        const data = {
            callback_url: callbackUrl,
            verification_token: verificationToken,
            event_type: eventType,
            data_type: dataType,
        };

        if (!callbackUrl) {
            delete data.callback_url;
        }
        if (!eventType) {
            delete data.event_type;
        }
        if (!dataType) {
            delete data.data_type;
        }

        return this.#request('PUT', 'subscription/' + id, data) as Promise<types.Subscription>;
    }

    /**
     * Deletes a webhook subscription.
     * @param id - Subscription id in string format.
     * @returns A DeletedSubscription typed object.
     */
    deleteSubscription(id: string): Promise<types.DeletedSubscription> {
        return this.#request('DELETE', 'subscription/' + id) as Promise<types.DeletedSubscription>;
    }

    /**
     * Renew the expiration time of a webhook subscription.
     * @param id -Subscription id in string format.
     * @returns A Subscription typed object of the renewed sub.
     */
    renewSubscription(id: string): Promise<types.Subscription> {
        return this.#request('PUT', 'subscription/renew/' + id) as Promise<types.Subscription>;
    }
}

export default Webhook;
