var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const getAllUsers = async () => {
  const userParams = {
    TableName: "winston",
    IndexName: "ContentType-username-index",
    KeyConditionExpression: "ContentType = :pk",
    ExpressionAttributeValues: {
      ":pk": `profile`
    }
  };

  const allUsers = await dynamo.query(userParams).promise();
  const sortedUsers = allUsers.Items.sort((a, b) => {
    var textA = a.username.toUpperCase();
    var textB = b.username.toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  });
  console.log("ERR GETTING ALL USERS", err);
};

exports.lambdaHandler = async (event, context) => {
  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };
  try {
    const users = await getRoundsForUser(user);
    console.log(
      "🚀 ~ file: app.js ~ line 29 ~ exports.lambdaHandler= ~ users",
      users
    );
    if (Object.keys(users).length > 0) {
      response.statusCode = 200;
      response.body = JSON.stringify(users);
    } else {
      response.statusCode = 200;
      response.body = JSON.stringify({});
    }
  } catch (err) {
    response.statusCode = 500;
    response.body = {
      error: "something happened"
    };
  }

  return response;
};
