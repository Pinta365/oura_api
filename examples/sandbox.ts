/**
 * The Oura API sandbox is a simulated environment that provides you with sample Oura Ring data.
 * This lets you experiment with the API, build prototypes, and thoroughly test your application's
 * logic before going live. All this without needing an Oura user account or access token.
 *
 * Not all Oura API endpoints are supported in the sandbox.
 * Please refer to the Oura API documentation for a list of available sandbox endpoints.
 */
import { Oura } from "jsr:@pinta365/oura-api";

// Instantiate the class with useSandbox
const ouraSandbox = new Oura({ useSandbox: true });

// Get some activity documents
const activity = await ouraSandbox.getDailyActivityDocuments("2024-06-01", "2024-06-03");

// Print it in the console.
console.log(activity);
