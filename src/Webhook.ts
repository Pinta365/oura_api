/**
 * Class containing all the methods to access the Oura Webhook Subscription API with a client id and client secret.
 *
 * @class Webhook
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */
import type { ExtApiV2DataType, WebhookOperation, WebhookSubscriptionModel } from "./types/generated.ts";
import { APIError, MissingClientIdError, MissingClientSecretError } from "./utils.ts";

/**
 * Base class for the Oura Webhook Subscription API
 * Class containing all the methods to access the Oura Webhook Subscription API with a client id and client secret.
 */
class Webhook {
    #clientId: string;
    #clientSecret: string;
    #baseUrlv2: string;

    /**
     * Creates a new Webhook API client.
     *
     * @constructor
     * @param {string} clientId - A client id generated at the Oura Cloud website.
     * @param {string} clientSecret - A client secret generated at the Oura Cloud website.
     * @throws {Error} Throws an error if the client id or client secret is missing.
     */
    constructor(clientId: string, clientSecret: string) {
        if (!clientId) {
            throw new MissingClientIdError();
        }
        if (!clientSecret) {
            throw new MissingClientSecretError();
        }

        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#baseUrlv2 = "https://api.ouraring.com/v2/webhook/";
    }

    /**
     * Private class method for making fetch requests to the API endpoints. Throws an error
     * if the response is not OK.
     *
     * @private
     * @param {string} method - Fetch method (e.g., GET, POST, PUT, DELETE).
     * @param {string} url - API endpoint URL.
     * @param {Object} [body] - Optional parameter for supplying a POST/PUT body.
     * @returns {Promise<Object>} A JSON or Text parsed fetch response.
     * @throws {Error} Throws an error if the request encounters a problem (e.g., non-OK response status).
     */
    #request = async (
        method: string,
        url: string,
        body?: Record<string, string | number | symbol | undefined>,
    ) => {
        let options = {};
        if (method === "POST" || method === "PUT") {
            options = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": this.#clientId,
                    "x-client-secret": this.#clientSecret,
                },
            };
            if (body) {
                Object.assign(options, { body: JSON.stringify(body) });
            }
        } else {
            options = {
                method,
                headers: {
                    "x-client-id": this.#clientId,
                    "x-client-secret": this.#clientSecret,
                },
            };
        }

        const response = await fetch(this.#baseUrlv2 + encodeURI(url), options);

        if (response.ok) {
            if (method === "DELETE") {
                return await response.text();
            } else {
                return await response.json();
            }
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
                "Problem with request.",
                response.status,
                response.statusText,
                detail,
                this.#baseUrlv2 + encodeURI(url),
                method,
            );
        }
    };

    /**
     * Retrieves a list of current active webhook subscriptions.
     *
     * @returns {Promise<WebhookSubscriptionModel[]>} An array of WebhookSubscriptionModel typed objects.
     */
    listSubscriptions(): Promise<WebhookSubscriptionModel[]> {
        return this.#request("GET", "subscription") as Promise<WebhookSubscriptionModel[]>;
    }

    /**
     * Retrieves a specific webhook subscription by id.
     *
     * @param {string} id - subscription id in string format.
     * @returns {Promise<WebhookSubscriptionModel>} A WebhookSubscriptionModel typed object.
     */
    getSubscription(id: string): Promise<WebhookSubscriptionModel> {
        return this.#request("GET", "subscription/" + id) as Promise<WebhookSubscriptionModel>;
    }

    /**
     * Creates a new webhook subscription. See setup documentation on the Oura Developer website
     * for a detailed description of the creation workflow.
     *
     * @param {string} callbackUrl - Your callback URL used by Oura to post subscription events to.
     * @param {string} verificationToken - Your verification token used to verify Oura's calls to your API.
     * @param {WebhookOperation} eventType - One of the WebhookOperations.
     * @param {ExtApiV2DataType} dataType - One of the ExtApiV2DataTypes.
     * @returns {Promise<WebhookSubscriptionModel>} A WebhookSubscriptionModel typed object of the created subscription.
     */
    createSubscription(
        callbackUrl: string,
        verificationToken: string,
        eventType: WebhookOperation,
        dataType: ExtApiV2DataType,
    ): Promise<WebhookSubscriptionModel> {
        const data = {
            callback_url: callbackUrl,
            verification_token: verificationToken,
            event_type: eventType,
            data_type: dataType,
        };
        return this.#request("POST", "subscription", data) as Promise<WebhookSubscriptionModel>;
    }

    /**
     * Updates a webhook subscription.
     *
     * @param {string} id - subscription id in string format.
     * @param {string} verificationToken - Your verification token used to verify Oura's calls to your API.
     * @param {string} [callbackUrl] - Callback URL used by Oura to post subscriptions to.
     * @param {WebhookOperation} [eventType] - One of the WebhookOperations.
     * @param {ExtApiV2DataType} [dataType] - One of the ExtApiV2DataTypes.
     * @returns {Promise<WebhookSubscriptionModel>} A WebhookSubscriptionModel typed object of the updated subscription.
     */
    updateSubscription(
        id: string,
        verificationToken: string,
        callbackUrl?: string,
        eventType?: WebhookOperation,
        dataType?: ExtApiV2DataType,
    ): Promise<WebhookSubscriptionModel> {
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

        return this.#request("PUT", "subscription/" + id, data) as Promise<
            WebhookSubscriptionModel
        >;
    }

    /**
     * Deletes a webhook subscription.
     *
     * @param {string} id - subscription id in string format.
     * @returns {Promise<string>} The response body (empty string on success).
     */
    deleteSubscription(id: string): Promise<string> {
        return this.#request("DELETE", "subscription/" + id) as Promise<string>;
    }

    /**
     * Renews the expiration time of a webhook subscription.
     *
     * @param {string} id - subscription id in string format.
     * @returns {Promise<WebhookSubscriptionModel>} A WebhookSubscriptionModel typed object of the renewed subscription.
     */
    renewSubscription(id: string): Promise<WebhookSubscriptionModel> {
        return this.#request("PUT", "subscription/renew/" + id) as Promise<
            WebhookSubscriptionModel
        >;
    }
}

export default Webhook;
