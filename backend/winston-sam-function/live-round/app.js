var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();

exports.lambdaHandler = async (event, context) => {
  let response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };
  try {
    const date = Date.now();
    console.log(
      "🚀 ~ file: app.js ~ line 9 ~ exports.lambdaHandler= ~ event",
      JSON.stringify(event)
    );

    let user = event.requestContext.authorizer.claims["cognito:username"];
    console.log(
      "🚀 ~ file: app.js ~ line 15 ~ exports.lambdaHandler= ~ user",
      user
    );

    const body = JSON.parse(event.body);
    const uri = body.uri;
    console.log(
      "🚀 ~ file: app.js ~ line 18 ~ exports.lambdaHandler= ~ uri",
      uri
    );
    const contentType = body.contentType;
    console.log(
      "🚀 ~ file: app.js ~ line 20 ~ exports.lambdaHandler= ~ contentType",
      contentType
    );
    const text = body.text;
    console.log(
      "🚀 ~ file: app.js ~ line 22 ~ exports.lambdaHandler= ~ text",
      text
    );

    await dynamo
      .put({
        TableName: "winston",
        Item: {
          PK: `USER#${user}`,
          SK: `ROUND#${user}#${date}`,
          timestamp: date,
          ImageURI: uri,
          ContentType: contentType,
          text: text,
          username: user
        }
      })
      .promise();
    console.log("SUCCESS WITH DYNAMO");
    response.statusCode = 200;
    return response;
  } catch (err) {
    console.log("errrrr", err);
    response.statusCode = 500;

    response.body = {
      error: `something happened, ${err}`
    };
    return response;
  }
};
