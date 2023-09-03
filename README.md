# OURA_API

[Deno](https://deno.land/x/oura_api) library to interact with v2 of the [Oura API](https://cloud.ouraring.com/v2/docs).

The library is also available for Node.js via a [NPM package](https://www.npmjs.com/package/oura_api).

---
## Example usage

### Deno
```javascript
import { Oura, DateFormat } from "https://deno.land/x/oura_api@0.3.0/mod.ts";

// Replace 'YOUR_ACCESS_TOKEN' with your actual access token
const accessToken = "YOUR_ACCESS_TOKEN";
const ouraClient = new Oura(accessToken);

const startDate: DateFormat = "2023-01-01";
const endDate: DateFormat = "2023-01-10";

try {
  const dailyActivityData = await ouraClient.getDailyActivityDocuments(startDate, endDate);

  console.log(`Daily Activity Data: ${JSON.stringify(dailyActivityData, null, 4)}`);
} catch (error) {
  console.error(`Error fetching daily activity data: ${error}`);
}
```
### Node.js
Install package. Example in progress.
```
npm install oura_api --save
```

## Documentaion

Library and method documentation can be found at the [Deno Land documentation](https://deno.land/x/oura_api?doc) page.

### Included data scopes for v2 of the API.

| Endpoint/Scope                                                            | Status                             |
| :------------------------------------------------------------------------ | :--------------------------------- |
| **[Oura Base](https://deno.land/x/oura_api/mod.ts?s=Oura)**               |                                    |
| Daily Activity                                                            | Implemented                        |
| Daily Readiness                                                           | Implemented                        |
| Daily Sleep                                                               | Implemented                        |
| Daily Spo2                                                                | Implemented                        |
| Heart Rate                                                                | Implemented                        |
| Personal Info                                                             | Implemented                        |
| Rest Mode Period                                                          | Implemented                        |
| Ring Configuration                                                        | Implemented                        |
| Session                                                                   | Implemented                        |
| Sleep                                                                     | Implemented                        |
| Sleep Time                                                                | Implemented                        |
| Tag                                                                       | Implemented                        |
| Workout                                                                   | Implemented                        |
| **[Webhook Subscription](https://deno.land/x/oura_api/mod.ts?s=Webhook)** |                                    |
| List subscription                                                         | Implemented                        |
| Create subscription                                                       | Implemented                        |
| Update subscription                                                       | Implemented                        |
| Delete subscription                                                       | Implemented                        |
| Renew subscription                                                        | Implemented                        |

### Additional info concerning the webhook API

According to the API docs the webhooks enable you to receive near real-time Oura data updates and are the preferred way
to receive the latest data from the Oura API.

I have not been able to fully verify this yet but the subscription workflow has been implemented.

Read the [Webhook docs](https://cloud.ouraring.com/v2/docs#tag/Webhook-Subscription-Routes) before atempting to use it.

## Issues

Issues or questions concerning the library can be raised at the
[github repository](https://github.com/Pinta365/oura_api/issues) page.

### License

MIT
