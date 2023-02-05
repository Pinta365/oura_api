export interface PersonalInfo {
    id: string;
    age: number;
    weight: number;
    height: number;
    biological_sex: string;
    email: string;
}

export interface DailyActivity {
    id: string;
    class_5_min: string;
    score: number;
    active_calories: number;
    average_met_minutes: number;
    contributors: {
        meet_daily_targets: number;
        move_every_hour: number;
        recovery_time: number;
        stay_active: number;
        training_frequency: number;
        training_volume: number;
    };
    equivalent_walking_distance: number;
    high_activity_met_minutes: number;
    high_activity_time: number;
    inactivity_alerts: number;
    low_activity_met_minutes: number;
    low_activity_time: number;
    medium_activity_met_minutes: number;
    medium_activity_time: number;
    met: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    meters_to_target: number;
    non_wear_time: number;
    resting_time: number;
    sedentary_met_minutes: number;
    sedentary_time: number;
    steps: number;
    target_calories: number;
    target_meters: number;
    total_calories: number;
    day: string;
    timestamp: string;
}

export interface DailyActivityDocuments {
    data: DailyActivity[];
    next_token: string | null;
}

export interface DailyReadiness {
    id: string;
    contributors: {
        activity_balance: number;
        body_temperature: number;
        hrv_balance: number;
        previous_day_activity: number;
        previous_night: number;
        recovery_index: number;
        resting_heart_rate: number;
        sleep_balance: number;
    };
    day: string;
    score: number;
    temperature_deviation: number;
    temperature_trend_deviation: number;
    timestamp: string;
}

export interface DailyReadinessDocuments {
    data: DailyReadiness[];
    next_token: string | null;
}

export interface DailySleep {
    id: string;
    contributors: {
        deep_sleep: number;
        efficiency: number;
        latency: number;
        rem_sleep: number;
        restfulness: number;
        timing: number;
        total_sleep: number;
    };
    day: string;
    score: number;
    timestamp: number;
}

export interface DailySleepDocuments {
    data: DailySleep[];
    next_token: string | null;
}

interface HeartrateData {
    bpm: number;
    source: string;
    timestamp: string;
}

export interface Heartrate {
    data: HeartrateData[];
    next_token: string | null;
}

export interface DailySession {
    id: string;
    day: string;
    start_datetime: string;
    end_datetime: string;
    type: string;
    heart_rate: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    heart_rate_variability: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    mood: string;
    motion_count: {
        interval: number;
        items: number[];
        timestamp: string;
    };
}

export interface DailySessionDocuments {
    data: DailySession[];
    next_token: string | null;
}

export interface Sleep {
    id: string;
    average_breath: number;
    average_heart_rate: number;
    average_hrv: number;
    awake_time: number;
    bedtime_end: string;
    bedtime_start: string;
    day: string;
    deep_sleep_duration: number;
    efficiency: number;
    heart_rate: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    hrv: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    latency: number;
    light_sleep_duration: number;
    low_battery_alert: boolean;
    lowest_heart_rate: number;
    movement_30_sec: string;
    period: number;
    readiness: {
        contributors: {
            activity_balance: number;
            body_temperature: number;
            hrv_balance: number;
            previous_day_activity: number;
            previous_night: number;
            recovery_index: number;
            resting_heart_rate: number;
            sleep_balance: number;
        };
        score: number;
        temperature_deviation: number;
        temperature_trend_deviation: number;
    };
    readiness_score_delta: number;
    rem_sleep_duration: number;
    restless_periods: number;
    sleep_phase_5_min: string;
    sleep_score_delta: number;
    time_in_bed: number;
    total_sleep_duration: number;
    type: string;
}

export interface SleepDocuments {
    data: Sleep[];
    next_token: string | null;
}

export interface Tag {
    id: string;
    day: string;
    text: string;
    timestamp: string;
    tags: string[];
}

export interface TagDocuments {
    data: Tag[];
    next_token: string | null;
}

export interface Workout {
    id: string;
    activity: string;
    calories: number;
    day: string;
    distance: number;
    end_datetime: string;
    intensity: string;
    label: string;
    source: string;
    start_datetime: string;
}

export interface WorkoutDocuments {
    data: Workout[];
    next_token: string | null;
}
