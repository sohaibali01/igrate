
import { google } from 'googleapis';

import http from 'http';
import url from 'url';
import opn from 'open';
import destroyer from 'server-destroy';


export class GmailClient {

  constructor() {
    // If modifying these scopes, delete token.json.
    this.SCOPES = ["https://mail.google.com/"];
    this.accessToken="";
  }

  async authenticateUser(oauth2Client) {
    return new Promise((resolve, reject) => {
      // grab the url that will be used for authorization
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.SCOPES,
        include_granted_scopes: true
      });
      const server = http
        .createServer(async (req, res) => {
          try {
           // if (req.url.indexOf('/oauth2callback') > -1) {
              const qs = new url.URL(req.url, oauth2Client.redirectUri).searchParams;
              res.end('Authentication successful! Please return to the console.');
              server.destroy();
              const {tokens} = await oauth2Client.getToken(qs.get('code'));
              oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
              resolve(oauth2Client);
            //}
          } catch (e) {
            reject(e);
          }
        })
        .listen(new url.URL(oauth2Client.redirectUri).port, 
          // open the browser to the authorize url to start the workflow
          opn(authorizeUrl, {wait: false}).then(cp => cp.unref())
        );
      destroyer(server);
    });
  }

  async authorize(credentialsJSON) {
    let keys = JSON.parse(credentialsJSON);
    keys=keys.web;
    const oauth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );

    //google.options({auth: oauth2Client});
    let client = await this.authenticateUser(oauth2Client);
    this.accessToken = client.credentials.access_token
    let textOk, textResponse;
    [textOk, textResponse] = await this.callHTTPAPI("https://gmail.googleapis.com/gmail/v1/users/me/profile", "GET", {});

    return textOk  
  }

  async callGmailAPI(response_message, functionList){
    try{
     
      let body = JSON.parse(response_message.function.arguments);
      let URL = "";
      let method = "";
      for (let func of functionList) {
        if (func.function.name === response_message.function.name) {
            let missing=""
            for (const key in func.function.parameters.required)
                if (!(func.function.parameters.required[key] in body))
                    missing = missing + func.function.parameters.required[key] + "; "
            if (missing !=="")
                return [false, "You must provide the required arguments of the function. The following ones are missing: "+ missing];
            if ( func.function.parameters.properties.URL.hasOwnProperty("enum") && func.function.parameters.properties.URL.enum.length==1)
              URL = func.function.parameters.properties.URL.enum[0];
            else
              URL = body["URL"];
            if (func.function.parameters.properties.method.hasOwnProperty("enum") && func.function.parameters.properties.method.enum.length==1)
              method = func.function.parameters.properties.method.enum[0];
            else
              method = body["method"];          
            break; 
        }
      }

      delete body["method"]
      delete body["URL"]
      
      if (body.hasOwnProperty("message")){
        const messageParts = [
          `From: ${body.message["from"]}`,
          `To: ${body.message["to"]}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `threadId: ${body.message["threadId"]}`,
          `labelIds: ${body.message["labelIds"]}`,
          `Subject: ${body.message["subject"]}`,
          '',
          `${body.message["content"]}`,
        ];

        const message = messageParts.join('\n');

        // The body needs to be base64url encoded.
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        body["message"] = {"raw": encodedMessage}
      }
      if (method=="GET")
      {
        body['format']='metadata';
        URL = URL + "?" + new URLSearchParams(body)
        body={};
      }

      let textOk, textResponse;
      [textOk, textResponse] = await this.callHTTPAPI(URL, method, body);
      if (textOk===false){
        return [textOk,  "Operation Failed: JSON response from API \n" + textResponse];
      }
      if (method=="GET"){
        let jsonResponse = JSON.parse(textResponse);
        if (jsonResponse.hasOwnProperty("nextPageToken"))
          textResponse = textResponse +  "\n In case you want to see more records, call this function again with pageToken="+ jsonResponse.nextPageToken;
      }
      return [textOk, "JSON response from  API \n" + textResponse]
    } 
    catch (err) {
      return [false, err.message];
    }
  }

  async callHTTPAPI(URL, method, body){
    const controller = new AbortController();
    // 5 second timeout:
    setTimeout(() => controller.abort(), 5000);
    const apiResponse = await fetch(URL, {
      method: method,
      headers: {
        'Authorization': 'Bearer '+ this.accessToken,
        'Content-Type': 'application/json'
    },
      body:   Object.keys(body).length > 0 ? JSON.stringify(body) : null,
      signal: controller.signal
    })
    let textResponse = await apiResponse.text();
    let textOk =  apiResponse.ok;
    return [textOk, textResponse]
  }
}
/*
async function main() {
  let gmailClient = new GmailClient();
  const CREDENTIALS_STRING = '{"web":{"client_id":"344920505144-tnh67ak9pt3vlk80j2tukskbc9kagsba.apps.googleusercontent.com","project_id":"apicomm","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["http://localhost:8080"]}}'
  let x = await gmailClient.authorize(CREDENTIALS_STRING)
  console.log(x)
}

// Usage
await main();
*/