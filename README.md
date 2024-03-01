# OURA_API

Library to interact with v2 of the [Oura API](https://cloud.ouraring.com/v2/docs).

Available for **Deno** and **Bun** through [JSR Package](https://jsr.io/@pinta365/oura-api) and for Node.js via a [NPM package](https://www.npmjs.com/package/oura_api).
Deno users can also use the [deno.land/x package](https://deno.land/x/oura_api).

---

## Example usage

### Deno and Bun

**Deno install notes**

Through JSR and imports map
```
deno add @pinta365/oura-api

import { Oura } from "@pinta365/oura-api";
```
Or directly from deno.land/x
```
import { Oura } from "https://deno.land/x/oura_api/mod.ts";
```

> [!NOTE]
>If you're importing the package from deno.land/x the example code will use the latest version but you should always change import URL
>to include a specific version number. Example: https://deno.land/x/oura_api@0.4.0/mod.ts

---

**Bun Install notes**
```
bunx jsr add @pinta365/oura-api

import { Oura } from "@pinta365/oura-api";
```

```javascript
//from deno.land/x (Deno)
import { Oura, DateFormat } from "https://deno.land/x/oura_api/mod.ts";
//or from JSR (Deno and Bun)
//import { Oura, DateFormat } from "@pinta365/oura-api";


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

Install package.
```
npm install oura_api --save

const Api = require('oura_api');
```
Code example.
```javascript

const Api = require('oura_api');
// Replace 'YOUR_ACCESS_TOKEN' with your actual access token
const accessToken = "YOUR_ACCESS_TOKEN";
const ouraClient = new Api.Oura(accessToken);

const startDate = "2023-01-01";
const endDate = "2023-01-10";


const example = async () => {
    try {
        const dailyActivityData = await ouraClient.getDailyActivityDocuments(startDate, endDate);
      
        console.log(`Daily Activity Data: ${JSON.stringify(dailyActivityData, null, 4)}`);
      } catch (error) {
        console.error(`Error fetching daily activity data: ${error}`);
      }
  };
  
  example();
```

## Documentaion

Library and method documentation can be found at the [Deno Land documentation](https://deno.land/x/oura_api?doc) page.

### Included data scopes for v2 of the API.

| Endpoint/Scope                                                            | Status      |
| :------------------------------------------------------------------------ | :---------- |
| **[Oura Base](https://deno.land/x/oura_api/mod.ts?s=Oura)**               |             |
| Daily Activity                                                            | Implemented |
| Daily Readiness                                                           | Implemented |
| Daily Sleep                                                               | Implemented |
| Daily Spo2                                                                | Implemented |
| Daily Stress                                                              | Implemented |
| Enhanced Tag                                                              | Implemented |
| Heart Rate                                                                | Implemented |
| Personal Info                                                             | Implemented |
| Rest Mode Period                                                          | Implemented |
| Ring Configuration                                                        | Implemented |
| Session                                                                   | Implemented |
| Sleep                                                                     | Implemented |
| Sleep Time                                                                | Implemented |
| Tag                                                                       | DEPRICATED  |
| Workout                                                                   | Implemented |
| **[Webhook Subscription](https://deno.land/x/oura_api/mod.ts?s=Webhook)** |             |
| List subscription                                                         | Implemented |
| Create subscription                                                       | Implemented |
| Update subscription                                                       | Implemented |
| Delete subscription                                                       | Implemented |
| Renew subscription                                                        | Implemented |

### Additional info concerning the webhook API

According to the API docs the webhooks enable you to receive near real-time Oura data updates and are the preferred way
to receive the latest data from the Oura API.

I have not been able to fully verify this yet but the subscription workflow has been implemented.

Read the [Webhook docs](https://cloud.ouraring.com/v2/docs#tag/Webhook-Subscription-Routes) before atempting to use it.

## Issues

Issues or questions concerning the library can be raised at the
[github repository](https://github.com/Pinta365/oura_api/issues) page.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
