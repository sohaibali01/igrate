
export class SlackClient {

  constructor() {
    this.isAuthenticate = false;
  }
  async authorize(accessToken) {
    this.accessToken = accessToken;
    let textOk, textResponse;
    [textOk, textResponse] = await this.callHTTPAPI('https://slack.com/api/users.list', 'GET', {});
    this.isAuthenticate = textOk;
    return textOk;
  }

  async callSlackAPI(response_message, functionList){
    try{
      if (!this.isAuthenticate) 
      return [false, "You must ask user to provide valid api key and then authenticate slack client before running slack related queries"]

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

      if (method==="GET")
      {
          URL = URL + "?" + new URLSearchParams(body)
          body={};
      }

      let textOk, textResponse;
      [textOk, textResponse] = await this.callHTTPAPI(URL, method, body);

      if (textOk===false){
        return [textOk,  "Operation Failed: JSON response from API \n" + textResponse];
      }

      let jsonResponse = JSON.parse(textResponse);
      if (jsonResponse.hasOwnProperty("response_metadata") && jsonResponse.response_metadata.hasOwnProperty("next_cursor") && jsonResponse.response_metadata.next_cursor!=='')
        textResponse = textResponse +  "\n In case you want to see more records, call this function again with next_cursor="+ jsonResponse.response_metadata.next_cursor;

    return [textOk, "JSON response from  API \n" + textResponse]
    } 
    catch (err) {
      return [false, err.message];
    }
  }

  async callHTTPAPI(URL, method, body){
    const controller = new AbortController()
    // 5 second timeout:
    setTimeout(() => controller.abort(), 5000)
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
