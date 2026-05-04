# Oura MCP Server

This package includes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes your Oura
ring data as tools for AI assistants like Claude.

Once connected, you can ask things like:

- "How has my readiness trended over the last two weeks?"
- "What did my sleep look like this week compared to last week?"
- "Show me my heart rate during yesterday's workout."

The server runs as a local stdio subprocess managed by your MCP client (Claude Desktop, Cursor, Windsurf, etc.). Each
user runs their own server on their own machine — no central service to host. Tokens stay on your local disk.

> **Runtime:** the MCP server currently uses Deno-specific APIs (`Deno.serve`, `Deno.Command`, `Deno.env`). Node / Bun
> support is on the roadmap; for now you need [Deno](https://deno.com) installed.

---

## Prerequisites

- [Deno](https://deno.com) installed
- An Oura account with an Oura ring
- An Oura OAuth application — create one at [developer.ouraring.com](https://developer.ouraring.com/)

---

## Setup

### 1. Register the redirect URI in the Oura developer portal

In your Oura application settings, add this redirect URI:

```
http://localhost:3456/callback
```

> If port 3456 is taken on your machine, pick another port and set `OURA_CALLBACK_PORT` accordingly (see
> [Environment variables](#environment-variables)).

### 2. Configure your MCP client

#### Claude Desktop example

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
    "mcpServers": {
        "oura": {
            "command": "deno",
            "args": [
                "run",
                "--allow-net",
                "--allow-env",
                "--allow-read",
                "--allow-write",
                "--allow-run",
                "jsr:@pinta365/oura-api/mcp/stdio"
            ],
            "env": {
                "OURA_CLIENT_ID": "your_client_id",
                "OURA_CLIENT_SECRET": "your_client_secret"
            }
        }
    }
}
```

#### Other clients

Most MCP-capable clients (Cursor, Windsurf, Cline, Zed, and others) support stdio subprocess servers using the same
`command` and `args` as above. Refer to your client's documentation for the exact config file location and format.

### 3. Authorize

Restart your client after editing the config. Server startup is non-blocking — it loads any saved tokens from disk and
connects immediately. The first time you ask the assistant for Oura data it will call the `oura_authorize` tool, which
starts a local callback listener and returns an authorization URL. Open it, approve access in your browser, and tokens
are saved silently. After that it is fully automatic.

---

## Available tools

### Authorization

| Tool               | Description                                                                          |
| :----------------- | :----------------------------------------------------------------------------------- |
| `oura_authorize`   | Starts the OAuth flow; returns a URL for the user to approve. Tokens save silently.  |
| `oura_auth_status` | Reports whether tokens are present and whether an authorization flow is in progress. |

### Data tools

| Tool                           | Description                                                                                 |
| :----------------------------- | :------------------------------------------------------------------------------------------ |
| `get_personal_info`            | Age, weight, height, biological sex, ring type                                              |
| `get_daily_readiness`          | Readiness score and 0–100 contributor sub-scores for a date range                           |
| `get_daily_sleep`              | Sleep score and 0–100 contributor sub-scores for a date range                               |
| `get_daily_activity`           | Activity score, steps, and calories for a date range                                        |
| `get_daily_stress`             | Stress and recovery minutes for a date range                                                |
| `get_daily_resilience`         | Resilience score and contributors for a date range                                          |
| `get_daily_spo2`               | Blood oxygen saturation for a date range (Gen 3+ ring)                                      |
| `get_daily_cardiovascular_age` | Cardiovascular age estimate for a date range                                                |
| `get_heart_rate`               | Heart rate measurements (bpm) for a datetime range                                          |
| `get_sleep_details`            | Detailed per-night data: average HRV (ms), heart rate, breath rate, stage hypnogram, phases |
| `get_workouts`                 | Workout sessions with sport type and heart rate for a date range                            |
| `get_sessions`                 | Guided sessions logged in the Oura app (meditation, breathing, naps) for a date range       |
| `get_sleep_recommendations`    | Recommended bedtime windows for a date range                                                |
| `get_enhanced_tags`            | User-entered lifestyle/habit/mood tags for a date range                                     |
| `get_vo2_max`                  | VO2 max (cardiorespiratory fitness) measurements for a date range                           |
| `get_rest_mode_periods`        | Periods the user flagged as rest/recovery (illness, injury, travel) for a date range        |
| `get_ring_configuration`       | Ring hardware metadata (generation, color, size, firmware) for a date range                 |

All date-range tools accept `start_date` / `end_date` in `YYYY-MM-DD` format. `get_heart_rate` uses `start_datetime` /
`end_datetime` in ISO 8601 format (e.g. `2026-05-04T00:00:00` or `2026-05-04T00:00:00+02:00`).

> **Daily scores vs. raw measurements.** The `get_daily_*` tools return 0–100 contributor sub-scores describing how each
> factor affected the daily score — they are not raw measurements. For raw HRV in milliseconds, average heart rate,
> breath rate, and minute-level series, use `get_sleep_details`.

---

## Token file location

| Platform | Path                                                                        |
| :------- | :-------------------------------------------------------------------------- |
| Windows  | `%APPDATA%\oura-mcp\tokens.json`                                            |
| macOS    | `~/Library/Application Support/oura-mcp/tokens.json`                        |
| Linux    | `$XDG_CONFIG_HOME/oura-mcp/tokens.json` or `~/.config/oura-mcp/tokens.json` |

To force re-authorization, delete the token file and restart.

---

## Environment variables

| Variable             | Required       | Default | Description                                                       |
| :------------------- | :------------- | :------ | :---------------------------------------------------------------- |
| `OURA_CLIENT_ID`     | First run only | —       | OAuth client ID from the Oura developer portal                    |
| `OURA_CLIENT_SECRET` | First run only | —       | OAuth client secret from the Oura developer portal                |
| `OURA_CALLBACK_PORT` | No             | `3456`  | Port for the temporary callback listener used by `oura_authorize` |

---

## Running manually

You can run the stdio server directly to type-check it or watch its logs (it will sit waiting for an MCP client to
connect over stdin/stdout):

```bash
OURA_CLIENT_ID=your_client_id OURA_CLIENT_SECRET=your_client_secret deno task mcp:stdio
```

Authorization itself is driven by the `oura_authorize` tool from your MCP client.
