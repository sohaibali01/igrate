
export class GmailClient {

  constructor() {
    // If modifying these scopes, delete token.json.
    this.accessToken="";
    this.isAuthenticate=false;
  }

  async authorize(accessToken) {
    this.accessToken = accessToken
    let textOk, textResponse;
    [textOk, textResponse] = await this.callHTTPAPI("https://gmail.googleapis.com/gmail/v1/users/me/profile", "GET", {});
    this.isAuthenticate = textOk;  
    return textOk  
  }

  async callGmailAPI(response_message, functionList){
    try{
      if (!this.isAuthenticate) 
        return [false, "You must ask user to provide valid json credentials and then authenticate gmail client before running gmail related queries"]
      let body = JSON.parse(response_message.arguments);
      let URL = "";
      let method = "";
      for (let func of functionList) {
        if (func.name === response_message.name) {
            let missing=""
            for (const key in func.parameters.required)
                if (!(func.parameters.required[key] in body))
                    missing = missing + func.parameters.required[key] + "; "
            if (missing !=="")
                return [false, "You must provide the required arguments of the function. The following ones are missing: "+ missing];
            if ( func.parameters.properties.URL.hasOwnProperty("enum") && func.parameters.properties.URL.enum.length==1)
              URL = func.parameters.properties.URL.enum[0];
            else
              URL = body["URL"];
            if (func.parameters.properties.method.hasOwnProperty("enum") && func.parameters.properties.method.enum.length==1)
              method = func.parameters.properties.method.enum[0];
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