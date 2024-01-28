
export class SlackClient {

  constructor() {
    this.accessToken="xoxp-6288430948499-6290981906052-6288597673954-b9bbf68869cbcc99958dd577c9a701b2";
  }
  async authorize(accessToken) {
    this.accessToken = accessToken;
    let textOk, textResponse;
    [textOk, textResponse] = await this.callHTTPAPI('https://slack.com/api/users.list', 'GET', {});
    return textOk;
  }

  async callSlackAPI(response_message, functionList){
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
