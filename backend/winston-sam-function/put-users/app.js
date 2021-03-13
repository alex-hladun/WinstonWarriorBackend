var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

// FOLLOW OR UNFOLLOW USERS
const followUser = async (followingUser, followedUser, type) => {
  try {
    if (type === "unfollow") {
      const deleteParams = {
        TableName: "winston",
        Key: {
          PK: `USER#${followingUser}`,
          SK: `#FRIEND#${followedUser}`
        }
      };
      await dynamo.delete(deleteParams).promise();
    } else if (type === "follow") {
      const queryParams = {
        TableName: "winston",
        Item: {
          PK: `USER#${followingUser}`,
          SK: `#FRIEND#${followedUser}`
        }
      };
      queryParams.Item.timestamp = Date.now();
      queryParams.Item.followingUser = followingUser;
      queryParams.Item.followedUser = followedUser;
      console.log(
        "🚀 ~ file: main.js ~ line 97 ~ followUser ~ queryParams",
        queryParams
      );
      await dynamo.put(queryParams).promise();
    }
  } catch (err) {
    console.log("ERROR", err);
  }
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

  const body = JSON.stringify(event.body);
  let followingUser =
    event.requestContext.authorizer.claims["cognito:username"];
  console.log("🚀 ~  user", followingUser);

  try {
    const dynamoResponse = await followUser(
      followingUser,
      body.followedUser,
      body.followType
    );
    console.log(
      "🚀 ~ file: app.js ~ line 29 ~ exports.lambdaHandler= ~ users",
      dynamoResponse
    );

    response.statusCode = 200;
    response.body = JSON.stringify(users);
  } catch (err) {
    response.statusCode = 500;
    response.body = {
      error: "something happened"
    };
  }

  return response;
};
