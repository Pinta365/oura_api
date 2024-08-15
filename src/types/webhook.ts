/**
 * oura_api
 *
 * @file Contains type definitions and interfaces for the Oura Webhook Subscription API.
 * Defines event types, data types, and subscription related interfaces.
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */

/**
 * Represents the possible event types that can trigger an Oura webhook notification.
 */
export type EventType =
    | "create"
    | "update"
    | "delete";

/**
 * Represents the various types of data objects that can be monitored by Oura webhook subscriptions.
 */
export type DataType =
    | "tag"
    | "enhanced_tag"
    | "workout"
    | "session"
    | "sleep"
    | "daily_sleep"
    | "daily_readiness"
    | "daily_activity"
    | "daily_spo2"
    | "sleep_time"
    | "rest_mode_period"
    | "ring_configuration"
    | "daily_stress"
    | "daily_cycle_phases";

/**
 * Represents a single Oura webhook subscription.
 */
export interface Subscription {
    /** Unique identifier for the subscription */
    id: string;
    /** URL where Oura will send webhook notifications */
    callback_url: string;
    /** The EventType that triggers the webhook (e.g., "create", "update", "delete") */
    event_type: EventType;
    /** The DataType the subscription monitors */
    data_type: DataType;
    /** The subscription's expiration time */
    expiration_time: string;
}

/**
 * Provides details about a deleted webhook subscription.
 */
export interface DeletedSubscriptionDetail {
    /** Array of locations relevant to the deletion */
    loc: string[];
    /** message */
    msg: string;
    /** message type */
    type: string;
}

/**
 * Provides details about a deleted webhook subscription.
 */
export interface DeletedSubscription {
    /** Array of deletion details */
    detail: DeletedSubscriptionDetail[];
}
