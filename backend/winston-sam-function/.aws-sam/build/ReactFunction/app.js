var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const react = async (
  reactingUser,
  roundId,
  reactionType,
  reactionComment = ""
) => {
  const queryParams = {
    TableName: "winston",
    Item: {
      PK: `REACTION#${reactingUser}#${reactionType}`,
      SK: `${roundId}`,
      reactingUser,
      reactionType: reactionType === "like" ? "like" : reactionComment,
      timestamp: Date.now(),
      round: roundId
    }
  };
  console.log(
    "🚀 ~ file: main.js ~ line 97 ~ followUser ~ queryParams",
    queryParams
  );
  await dynamo.put(queryParams).promise();
  return;
};

exports.lambdaHandler = async (event, context) => {
  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };

  const body = JSON.parse(event.body);
  let reactingUser = event.requestContext.authorizer.claims["cognito:username"];
  console.log("🚀 ~  user", reactingUser);

  try {
    const dynamoResponse = await react(
      reactingUser,
      body.roundId,
      body.reactionType,
      body.reactionComment
    );
    console.log(
      "🚀 ~ file: app.js ~ line 29 ~ exports.lambdaHandler= ~ users",
      dynamoResponse
    );

    response.statusCode = 200;
    response.body = JSON.stringify(dynamoResponse);
  } catch (err) {
    response.statusCode = 500;
    response.body = {
      error: "something happened"
    };
  }

  return response;
};
