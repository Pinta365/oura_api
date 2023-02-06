import * as types from './types/webhook.ts';

class Webhook {
    clientId: string;
    clientSecret: string;
    baseUrlv2: string;

    constructor(clientId: string, clientSecret: string) {
        if (!clientId) {
            throw 'Missing client id.';
        }
        if (!clientSecret) {
            throw 'Missing client secret.';
        }

        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrlv2 = 'https://api.ouraring.com/v2/webhook/';
    }

    #request = async (method: string, url: string, body?: Record<string, string | number | symbol | undefined>) => {
        let options = {};
        if (method === 'POST' || method === 'PUT') {
            options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': this.clientId,
                    'x-client-secret': this.clientSecret,
                },
            };
            if (body) {
                Object.assign(options, { body: JSON.stringify(body) });
            }
        } else {
            options = {
                method,
                headers: {
                    'x-client-id': this.clientId,
                    'x-client-secret': this.clientSecret,
                },
            };
        }

        const response = await fetch(this.baseUrlv2 + encodeURI(url), options);

        if (response.ok) {
            if (method === 'DELETE') {
                return await response.text();
            } else {
                return await response.json();
            }
            
        }

        throw new Error(`Problem with request. ${response.status} - ${response.statusText}`);
    };

    listSubscriptions(): Promise<types.Subscription[]> {
        return this.#request('GET', 'subscription');
    }

    getSubscription(id: string): Promise<types.Subscription> {
        return this.#request('GET', 'subscription/' + id);
    }

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
        return this.#request('POST', 'subscription', data);
    }

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

        return this.#request('PUT', 'subscription/' + id, data);
    }

    deleteSubscription(id: string): Promise<types.DeletedSubscription> {
        return this.#request('DELETE', 'subscription/' + id);
    }
    renewSubscription(id: string): Promise<types.Subscription> {
        return this.#request('PUT', 'subscription/renew/' + id);
    }
}

export default Webhook;
