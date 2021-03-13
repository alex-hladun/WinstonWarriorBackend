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
    let date = Date.now();
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
    let stats;
    if (body.roundId && body.contentType === "liveround") {
      stats = body;
    }
    console.log(
      "🚀 ~ file: app.js ~ line 27 ~ exports.lambdaHandler= ~ body",
      JSON.stringify(body)
    );

    const contentType = body.contentType;
    const roundId = body.roundId;
    console.log(
      "🚀 ~ file: app.js ~ line 38 ~ exports.lambdaHandler= ~ roundId",
      roundId
    );
    console.log(
      "🚀 ~ file: app.js ~ line 20 ~ exports.lambdaHandler= ~ contentType",
      contentType
    );
    const text = body.text;
    console.log(
      "🚀 ~ file: app.js ~ line 22 ~ exports.lambdaHandler= ~ text",
      text
    );

    if (contentType === "doneliveround") {
      await dynamo
        .delete({
          TableName: "winston",
          Item: {
            PK: `USER#${user}`,
            SK: `ROUND#${user}#${roundId}`
          }
        })
        .promise();
      response.statusCode = 200;
      return response;
    }

    await dynamo
      .put({
        TableName: "winston",
        Item: {
          PK: `USER#${user}`,
          SK: `ROUND#${user}#${contentType === "liveround" ? roundId : date}`,
          timestamp: date,
          ContentType: contentType,
          text: text,
          username: user,
          roundId,
          stats
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
