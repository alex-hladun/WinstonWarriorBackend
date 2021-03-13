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
  const body = JSON.parse(event.body);

  try {
    const date = Date.now();
    console.log(
      "🚀 ~ event",
      JSON.stringify(event)
    );

    let user = event.requestContext.authorizer.claims["cognito:username"];
    console.log(
      "🚀 ~  user",
      user
    );

    const roundId = body.roundId;

    const uri = body.uri;

    const contentType = body.contentType;
    console.log(
      "🚀 ~  contentType",
      contentType
    );
    const text = body.text;
    console.log(
      "🚀 ~ ~ text",
      text
    );

    const dynamoPutObj = {
      TableName: "winston",
      Item: {
        PK: `USER#${user}`,
        SK: `ROUND#${user}#${contentType === "liveround" ? roundId : date}`,
        timestamp: date,
        ImageURI: uri,
        ContentType: contentType,
        text: text,
        username: user,
        stats: body.stats
      }
    };
    console.log("🚀 ~ POSTING TO DYNAMO~ dynamoPutObj", dynamoPutObj)
    await dynamo.put(dynamoPutObj).promise();
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
