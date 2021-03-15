var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

// FOLLOW OR UNFOLLOW USERS
const followUser = async (followingUser, followedUser, type) => {
  console.log("FOLLOWUSER", followingUser, followedUser, type);
  return new Promise(async (resolve, reject) => {
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
        resolve("success");
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
        resolve("success");
      }
    } catch (err) {
      console.log("ERROR", err);
      reject(err);
    }
  });
};

exports.lambdaHandler = async (event, context) => {
  console.log(
    "🚀 ~ file: app.js ~ line 44 ~ exports.lambdaHandler= ~ event",
    event
  );
  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };

  const body = JSON.parse(event.body);
  console.log(
    "🚀 ~ file: app.js ~ line 62 ~ exports.lambdaHandler= ~ body",
    body
  );
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
      "🚀 ~ file: app.js ~ line 29 ~ exports.lambdaHandler= ~ dynamoResponse success",
      dynamoResponse
    );

    response.statusCode = 200;
    response.body = "success";
  } catch (err) {
    console.log("errror", err);
    response.statusCode = 500;
    response.body = "something happened";
  }

  return response;
};
