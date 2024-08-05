/**
 * oura_api
 *
 * @file Contains type definitions and interfaces for the Oura API responses and data structures.
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */

/**
 * Represents a date format string as expected by the Oura API.
 *
 * @example
 * "2024-02-29"
 */
export type DateFormat = string;

/** Represents sample of data */
export interface SampleData {
    /** Interval in seconds between the sampled items */
    interval: number;
    /** Recorded sample items */
    items: number[];
    /** Timestamp when the sample recording started */
    timestamp: string;
}

/**
 * Represents the personal information of an Oura user.
 */
export interface PersonalInfo {
    /** Unique identifier */
    id: string;
    /** Age  */
    age: number;
    /** Weight  */
    weight: number;
    /** Height  */
    height: number;
    /** Biological sex  */
    biological_sex: string;
    /** Email  */
    email: string;
}

/**
 * Holds details about daily activity metrics tracked by the Oura ring.
 */
export interface DailyActivity {
    /** Unique identifier */
    id: string;
    /** 5-minute activity classification for the activity period:
     * 0    non wear
     * 1    rest
     * 2    inactive
     * 3    low activity
     * 4    medium activity
     * 5    high activity
     */
    class_5_min: string;
    /** Activity score in range [1, 100] */
    score: number;
    /** Active calories expended (in kilocalories) */
    active_calories: number;
    /** Average metabolic equivalent (MET) in minutes */
    average_met_minutes: number;
    /** Object defining activity score contributors */
    contributors: {
        /** Contribution of meeting previous 7-day daily activity targets in range [1, 100] */
        meet_daily_targets: number;
        /** Contribution of previous 24-hour inactivity alerts in range [1, 100] */
        move_every_hour: number;
        /** Contribution of previous 7-day recovery time in range [1, 100] */
        recovery_time: number;
        /** Contribution of previous 24-hour activity in range [1, 100] */
        stay_active: number;
        /**  Contribution of previous 7-day exercise frequency in range [1, 100] */
        training_frequency: number;
        /** Contribution of previous 7-day exercise volume in range [1, 100] */
        training_volume: number;
    };
    /** Equivalent walking distance (in meters) of energy expenditure */
    equivalent_walking_distance: number;
    /** High activity metabolic equivalent (MET) in minutes */
    high_activity_met_minutes: number;
    /** High activity metabolic equivalent (MET) in seconds */
    high_activity_time: number;
    /** Number of inactivity alerts received */
    inactivity_alerts: number;
    /** "Low activity metabolic equivalent (MET) in minutes */
    low_activity_met_minutes: number;
    /** "Low activity metabolic equivalent (MET) in seconds */
    low_activity_time: number;
    /** Medium activity metabolic equivalent (MET) in minutes */
    medium_activity_met_minutes: number;
    /** Medium activity metabolic equivalent (MET) in seconds */
    medium_activity_time: number;
    /** MET samples. */
    met: SampleData;
    /** Remaining meters to target */
    meters_to_target: number;
    /** The time (in seconds) in which the ring was not worn */
    non_wear_time: number;
    /** Resting time (in seconds) */
    resting_time: number;
    /** Sedentary metabolic equivalent (MET) in minutes */
    sedentary_met_minutes: number;
    /** Sedentary metabolic equivalent (MET) in seconds */
    sedentary_time: number;
    /** Total number of steps taken */
    steps: number;
    /** Daily activity target (in kilocalories) */
    target_calories: number;
    /** Daily activity target (in meters) */
    target_meters: number;
    /** Total calories expended (in kilocalories) */
    total_calories: number;
    /** The YYYY-MM-DD formatted local date indicating when the daily activity occurred */
    day: string;
    /** ISO 8601 formatted local timestamp indicating the start datetime of when the daily activity occurred */
    timestamp: string;
}

/**
 * Represents a response object containing multiple DailyActivity records.
 */
export interface DailyActivityDocuments {
    /** Array of DailyActivity documents */
    data: DailyActivity[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents daily readiness metrics provided by the Oura ring.
 */
export interface DailyReadiness {
    /** Unique identifier */
    id: string;
    /** Object defining readiness score contributors */
    contributors: {
        /** Contribution of cumulative activity balance in range [1, 100] */
        activity_balance: number;
        /** Contribution of body temperature in range [1, 100] */
        body_temperature: number;
        /** Contribution of heart rate variability balance in range [1, 100] */
        hrv_balance: number;
        /** Contribution of previous day's activity in range [1, 100] */
        previous_day_activity: number;
        /** Contribution of previous night's sleep in range [1, 100] */
        previous_night: number;
        /** Contribution of recovery index in range [1, 100] */
        recovery_index: number;
        /** Contribution of resting heart rate in range [1, 100] */
        resting_heart_rate: number;
        /** Contribution of sleep balance in range [1, 100] */
        sleep_balance: number;
    };
    /** Day that the daily readiness belongs to */
    day: string;
    /** Daily readiness score */
    score: number;
    /** Temperature deviation in degrees Celsius */
    temperature_deviation: number;
    /** Temperature trend deviation in degrees Celsius */
    temperature_trend_deviation: number;
    /** Timestamp of the daily readiness */
    timestamp: string;
}

/**
 * Represents a response object containing multiple DailyReadiness records.
 */
export interface DailyReadinessDocuments {
    /** Array of DailyReadiness documents */
    data: DailyReadiness[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents daily resilience metrics provided by the Oura ring.
 */
export interface DailyResilience {
    /** Unique identifier */
    id: string;
    /** Day that the daily resilience belongs to */
    day: string;
    /** Object defining resilience score contributors */
    contributors: {
        sleep_recovery: number;
        daytime_recovery: number;
        stress: number;
    };
    /** level of resilience */
    level: string;
}

/**
 * Represents a response object containing multiple DailyResilience records.
 */
export interface DailyResilienceDocuments {
    /** Array of DailyResilience documents */
    data: DailyResilience[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Holds detailed sleep metrics tracked by the Oura ring.
 */
export interface DailySleep {
    /** Unique identifier */
    id: string;
    /** Object defining sleep score contributors */
    contributors: {
        /** Contribution of deep sleep in range [1, 100] */
        deep_sleep: number;
        /** Contribution of sleep efficiency in range [1, 100] */
        efficiency: number;
        /** Contribution of sleep latency in range [1, 100] */
        latency: number;
        /** Contribution of REM sleep in range [1, 100] */
        rem_sleep: number;
        /** Contribution of sleep restfulness in range [1, 100] */
        restfulness: number;
        /** Contribution of sleep timing in range [1, 100] */
        timing: number;
        /** Contribution of total sleep in range [1, 100] */
        total_sleep: number;
    };
    /** Day that the daily sleep belongs to. */
    day: string;
    /** Daily sleep score */
    score: number;
    /** Timestamp of the daily sleep */
    timestamp: number;
}

/**
 * Represents a response object containing multiple DailySleep records.
 */
export interface DailySleepDocuments {
    /** Array of DailySleep documents */
    data: DailySleep[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents daily blood oxygen saturation (SpO2) data.
 */
export interface DailySpo2 {
    /** Unique identifier */
    id: string;
    /** Day that the data belongs to. */
    day: string;
    /** The SpO2 percentage value aggregated over a single day */
    spo2_percentage: {
        /** Average oxygen saturation (SpO2) throughout the night */
        average: number;
    };
}

/**
 * Represents a response object containing multiple DailySpo2 records.
 */
export interface DailySpo2Documents {
    /** Array of DailySpo2 documents */
    data: DailySpo2[];
    /** Next Token */
    next_token: string | null;
}

/** Union of Heart Rate sources */
export type HeartRateSource =
    | "awake"
    | "rest"
    | "sleep"
    | "session"
    | "live"
    | "workout";

/**
 * Represents a single heart rate measurement.
 */
export interface HeartrateData {
    /** Beats per minute */
    bpm: number;
    /** Enumeration HeartRateSource */
    source: HeartRateSource;
    /** Date and time of the measurement */
    timestamp: string;
}

/**
 * Contains multiple heart rate measurements.
 */
export interface Heartrate {
    /** Array of HeartrateData documents */
    data: HeartrateData[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents a period of time identified by the Oura ring as being in "rest mode".
 */
export interface RestModePeriod {
    /** Unique identifier */
    id: string;
    /** End date of rest mode */
    end_day: string;
    /** Timestamp when rest mode ended */
    end_time: string;
    /** Collection of episodes during rest mode, consisting of tags */
    episodes: [{
        /** Tags selected for the episode */
        tags: string[];
        /** Timestamp indicating when the episode occurred */
        timestamp: string;
    }];
    /** Start date of rest mode */
    start_day: string;
    /** Timestamp when rest mode started */
    start_time: string;
}

/**
 * Represents a response object containing multiple RestModePeriod records.
 */
export interface RestModePeriodDocuments {
    /** Array of RestModePeriod documents */
    data: RestModePeriod[];
    /** Next Token */
    next_token: string | null;
}

/** Union of possible ring colour */
export type RingColor =
    | "brushed_silver"
    | "glossy_black"
    | "glossy_gold"
    | "glossy_white"
    | "gucci"
    | "matt_gold"
    | "rose"
    | "silver"
    | "stealth_black"
    | "titanium"
    | "titanium_and_gold";

/** Union of possible of ring designs */
export type RingDesign = "heritage" | "horizon" | "balance" | "balance_diamond";

/** Union of possible of ring hardware generations */
export type RingHardwareType = "gen1" | "gen2" | "gen2m" | "gen3";

/**
 * Stores information about an Oura ring's configuration.
 */
export interface RingConfiguration {
    /** Unique identifier */
    id: string;
    /** Color of the ring */
    color: RingColor;
    /** Design of the ring */
    design: RingDesign;
    /** Firmware version of the ring */
    firmware_version: string;
    /** "Hardware type of the ring */
    hardware_type: RingHardwareType;
    /** UTC timestamp indicating when the ring was set up */
    set_up_at: string;
    /** US size of the ring */
    size: number;
}

/**
 * Represents a response object containing multiple RingConfiguration records.
 */
export interface RingConfigurationDocuments {
    /** Array of RingConfiguration documents */
    data: RingConfiguration[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents a recorded activity session tracked by the Oura ring.
 */
export interface DailySession {
    /** Unique identifier */
    id: string;
    /** The date when the session occurred */
    day: string;
    /** Timestamp indicating when the Moment started */
    start_datetime: string;
    /** Timestamp indicating when the Moment ended */
    end_datetime: string;
    /** Moment type */
    type: string;
    /** HR samples */
    heart_rate: SampleData;
    /** HRV samples */
    heart_rate_variability: SampleData;
    /** Moment mood */
    mood: string;
    /** Motion samples */
    motion_count: SampleData;
}

/**
 * Represents a response object containing multiple DailySession records.
 */
export interface DailySessionDocuments {
    /** Array of DailySession documents */
    data: DailySession[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Holds a comprehensive set of sleep metrics provided by the Oura ring within
 * a given timeframe. A user can have multiple sleep periods per day.
 */
export interface Sleep {
    /** Unique identifier */
    id: string;
    /** Average breathing rate during sleep as breaths/second */
    average_breath: number;
    /** Average heart rate during sleep as beats/minut */
    average_heart_rate: number;
    /** Average heart rate variability during sleep */
    average_hrv: number;
    /** Duration spent awake in seconds */
    awake_time: number;
    /** Bedtime end of the sleep */
    bedtime_end: string;
    /** Bedtime start of the sleep */
    bedtime_start: string;
    /** Day that the sleep belongs to */
    day: string;
    /** Duration spent in deep sleep in seconds */
    deep_sleep_duration: number;
    /** Sleep efficiency rating in range [1, 100] */
    efficiency: number;
    /** HR samples */
    heart_rate: SampleData;
    /** HVR samples */
    hrv: SampleData;
    /** Sleep latency in seconds. This is the time it took for the user to fall asleep after going to bed. */
    latency: number;
    /** Duration spent in light sleep in seconds */
    light_sleep_duration: number;
    /** Flag indicating if a low battery alert occurred */
    low_battery_alert: boolean;
    /** Lowest heart rate during sleep */
    lowest_heart_rate: number;
    /** 30-second movement classification for the period where every character corresponds to:
     * 1    no motion
     * 2    restless
     * 3    tossing and turning
     * 4    active
     */
    movement_30_sec: string;
    /** Sleep period identifier */
    period: number;
    /** Readiness */
    readiness: {
        /** Object defining readiness score contributors */
        contributors: {
            /** Contribution of cumulative activity balance in range [1, 100] */
            activity_balance: number;
            /** Contribution of body temperature in range [1, 100] */
            body_temperature: number;
            /** Contribution of heart rate variability balance in range [1, 100] */
            hrv_balance: number;
            /** Contribution of previous day's activity in range [1, 100] */
            previous_day_activity: number;
            /** Contribution of previous night's sleep in range [1, 100] */
            previous_night: number;
            /** Contribution of recovery index in range [1, 100] */
            recovery_index: number;
            /** Contribution of resting heart rate in range [1, 100] */
            resting_heart_rate: number;
            /** Contribution of sleep balance in range [1, 100] */
            sleep_balance: number;
        };
        /** Score */
        score: number;
        /** Temperature Deviation */
        temperature_deviation: number;
        /** Temperature Trend Deviation */
        temperature_trend_deviation: number;
    };
    /** Effect on readiness score caused by this sleep period */
    readiness_score_delta: number;
    /** Duration spent in REM sleep in seconds */
    rem_sleep_duration: number;
    /** Number of restless periods during sleep */
    restless_periods: number;
    /** 5-minute sleep phase classification for the period where every character corresponds to:
     * 1    deep sleep
     * 2    light sleep
     * 3    REM sleep
     * 4    awake
     */
    sleep_phase_5_min: string;
    /** Effect on sleep score caused by this sleep period */
    sleep_score_delta: number;
    /** Version of the sleep algorithm used to calculate the sleep data */
    sleep_algorithm_version: string;
    /** Duration spent in bed in seconds */
    time_in_bed: number;
    /** Total sleep duration in seconds */
    total_sleep_duration: number;
    /** Sleep period type */
    type: string;
}

/**
 * Represents a response object containing multiple Sleep records.
 */
export interface SleepDocuments {
    /** Array of Sleep documents */
    data: Sleep[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents a simple note or annotation ("tag") associated with a day.
 * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
 */
export interface Tag {
    /** Unique identifier */
    id: string;
    /** Day that the note belongs to */
    day: string;
    /** Textual contents of the note. */
    text: string;
    /** Timestamp that the note belongs to. */
    timestamp: string;
    /** Selected tags for the tag */
    tags: string[];
}

/**
 * Represents a response object containing multiple Tag records.
 * Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.
 */
export interface TagDocuments {
    /** Array of Tag documents */
    data: Tag[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents Oura's recommendation about optimal bedtime for a given day.
 */
export interface SleepTime {
    /** Unique identifier */
    id: string;
    /** Corresponding day for the sleep time */
    day: string;
    /** Optimal bedtime */
    optimal_bedtime: {
        /** Timezone offset in second from GMT of the day */
        day_tz: number;
        /** End offset from midnight in second */
        end_offset: number;
        /** Start offset from midnight in second */
        start_offset: number;
    };
    /** Recommended action for bedtime */
    recommendation: string;
    /** Sleep time status; used to inform sleep time recommendation */
    status: string;
}

/**
 * Represents a response object containing multiple SleepTime records.
 */
export interface SleepTimeDocuments {
    /** Array of SleepTime documents */
    data: SleepTime[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents a workout tracked by the Oura ring.
 */
export interface Workout {
    /** Unique identifier */
    id: string;
    /** Type of the workout activity */
    activity: string;
    /** Energy burned in kilocalories during the workout */
    calories: number;
    /** Day when the workout occurred */
    day: string;
    /** Distance traveled in meters during the workout */
    distance: number;
    /** Timestamp indicating when the workout ended */
    end_datetime: string;
    /** workout intensity */
    intensity: string;
    /** User-defined label for the workout */
    label: string;
    /** Workout source */
    source: string;
    /** Timestamp indicating when the workout started */
    start_datetime: string;
}

/**
 * Represents a response object containing multiple Workout records.
 */
export interface WorkoutDocuments {
    /** Array of Workout documents */
    data: Workout[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents an extended, multi-day tag with optional comments.
 */
export interface EnhancedTag {
    /** Unique identifier */
    id: string;
    /** The unique code of the selected tag type, "NULL" for text-only tags, or "custom" for custom tag types */
    tag_type_code: string;
    /** Timestamp of the tag (if no duration) or the start time of the tag (with duration) */
    start_time: string;
    /** Timestamp of the tag's end for events with duration or "NULL" if there is no duration */
    end_time: string;
    /** Day of the tag (if no duration) or the start day of the tag (with duration) */
    start_day: string;
    /** Day of the tag's end for events with duration or "NULL" if there is no duration */
    end_day: string;
    /** Additional freeform text on the tag */
    comment: string;
}

/**
 * Represents a response object containing multiple EnhancedTag records.
 */
export interface EnhancedTagDocuments {
    /** Array of EnhancedTag documents */
    data: EnhancedTag[];
    /** Next Token */
    next_token: string | null;
}

/**
 * Represents daily strees summary
 */
export interface DailyStress {
    /** Unique identifier */
    id: string;
    /** Day that the daily stress belongs to */
    day: string;
    /** Time spent in a high stress zone (top quartile of data) */
    stress_high: number;
    /** Time spend in a high recovery zone (bottom quartile data) */
    recovery_high: number;
    /** Stress summary of full day */
    day_summary: string;
}

/**
 * Represents a response object containing multiple daily strees summaries.
 */
export interface DailyStressDocuments {
    /** Array of Workout documents */
    data: Workout[];
    /** Next Token */
    next_token: string | null;
}
