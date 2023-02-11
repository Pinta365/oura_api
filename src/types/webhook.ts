export type EventType =
    | "create"
    | "update"
    | "delete";

export type DataType =
    | "tag"
    | "workout"
    | "session"
    | "sleep"
    | "daily_sleep"
    | "daily_readiness"
    | "daily_activity";

export interface Subscription {
    id: string;
    callback_url: string;
    event_type: string;
    data_type: string;
    expiration_time: string;
}

interface DeletedSubscriptionDetail {
    loc: string[];
    msg: string;
    type: string;
}
export interface DeletedSubscription {
    detail: DeletedSubscriptionDetail[];
}
