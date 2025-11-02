
export class HubspotClient {

  constructor() {
    this.isAuthenticate = false;
  }
  async authorize(accessToken) {
    this.accessToken = accessToken;
    let textOk, textResponse;
    [textOk, textResponse] = await this.callHTTPAPI('https://api.hubapi.com/crm/v3/objects/contacts', 'GET', {});
    this.isAuthenticate = textOk;
    return textOk;
  }
  
  async callHubspotAPI(response_message, task, functionList){
    try{
      if (!this.isAuthenticate) 
      return [false, "You must ask user to provide valid api key and then authenticate hubspot client before running hubspot related queries"]

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

      if (body.hasOwnProperty("hs_object_type")){
        URL = URL + "/" + body["hs_object_type"];
        delete body["hs_object_type"]
      }

      delete body["method"]
      delete body["URL"]

      if (method==="GET")
      {
        if (body.hasOwnProperty("id")){
          URL = URL + "/" + body["id"];
        }
        else {
          URL = URL + "?" + new URLSearchParams(Object.entries(body).filter(([_, v]) => v !== "" && v != null))
        }
        body={};
      }
      else
      { 
          //body = {properties: body}
          if (method==="PATCH" || method==="DELETE"){
            if (body.hasOwnProperty("id")){
              URL = URL + "/" + body["id"];
              let [textOk, textResponse] = await this.validateData(body["id"], URL, task);
              if (textOk===false)
                return [false, textResponse];
              else 
              {
                if (method==="PATCH")
                  delete body["id"];
              }
            }
            else
              return [false, "Missing hubspot object Id. Get object id first from the list"];
        }
      }
      
      let textOk, textResponse;
      [textOk, textResponse] = await this.callHTTPAPI(URL, method, body);
      if (textOk===false){
        return [textOk,  "Operation Failed: JSON response from hubspot API \n" + textResponse];
      }
      else if (textOk===true && textResponse==''){
        return [textOk, "The api response was empty so I'm not sure if I was able to complete the operation. You must recheck the list of objects to validate the operation status"];
      }
      let appendPaging = (method=="GET" && textResponse.includes("paging")) ? "\n You can see next page for more records" : "" ; 
      return [textOk, "JSON response from hubspot API \n" + textResponse + appendPaging]
    } 
    catch (err) {
      return [false, err.message];
    }
  }

  async validateData(id, URL, task){
    let [textOk, textResponse]  = await callHTTPAPI(URL, "GET", {});
    if (textOk===false)
      return [textOk, textResponse]
    task = JSON.parse(task);
    if ( task.task.includes(id) || task.extra_info.includes(id) )
      return [true, "continue deletion"]
    let vals = JSON.parse(textResponse);
    for (const key in vals.properties) {
      if (task.task.toLowerCase().includes(String(vals.properties[key]).toLowerCase()) || task.extra_info.toLowerCase().includes(String(vals.properties[key]).toLowerCase()))
        return [true, textResponse]
    }
    return [false,  "Failed: Mismatch between user provided data in task and retrieved object data from hubspot CRM. Please ask user for confirmation."]
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