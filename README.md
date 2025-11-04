## iGrate
iGrate is LLM based integrator that manages all your apps in a single platform.  

## Support
Currently it supports the following apps
* Gmail
* Slack
* Hubspot

In addition, the support of following is also integrated via openai
* file search
* web search
* image generation

## Sample Prompts
* fetch all of my contacts from hubspot and email the contact list to john@xyz.com
* give me a summary of the last email that i received
* summarize the attached file and send the summary to slack channel named general
* describe what you see in the attached image
* get details of my references from the attached CV and add these as contacts in hubspot

## Installation
* Clone this repo `https://github.com/sohaibali01/igrate`
* Navigate into the repo `cd igrate`

* Navigate into the `backend` folder `cd backend`
* Install the dependencies ``npm install``
* Run the `index.js` file `node ./index.js`

*That will start the backend server on port `7000`: http://localhost:7000/*

* Navigate into the `frontend` folder `cd frontend`
* Install the dependencies ``npm install``
* Start the local server ``npm run dev``

*That will open the project on your default browser: http://localhost:5173/. You can now chat with the AI from your browser*
* Press q to exit the frontend

## Running
* Frontend will guide you how to authorize your apps via tokens or outh2
