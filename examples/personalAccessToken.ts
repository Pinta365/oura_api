import { Oura } from "jsr:@pinta365/oura-api";

// Replace this with your personal access token.
const accessToken = "REPLACE_WITH_YOUR_TOKEN";

// Instantiate the class with a accessToken
const oura = new Oura({ accessToken: accessToken });

// Get your personal Oura information
const personalInfo = await oura.getPersonalInfo();

// Print it in the console.
console.log(personalInfo);
