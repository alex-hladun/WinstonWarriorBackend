var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const getAllUsers = async () => {
  return new Promise(async (resolve, reject) => {
    const userParams = {
      TableName: "winston",
      IndexName: "ContentType-username-index",
      KeyConditionExpression: "ContentType = :pk",
      ExpressionAttributeValues: {
        ":pk": `profile`
      }
    };

    try {
      const allUsers = await dynamo.query(userParams).promise();
      const sortedUsers = allUsers.Items.sort((a, b) => {
        var textA = a.username.toUpperCase();
        var textB = b.username.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      resolve(sortedUsers);
      // console.log("🚀  allUsers", sortedUsers);
    } catch (err) {
      console.log("ERR GETTING ALL USERS", err);
    }
  });
};

const getFollowing = (user) => {
  return new Promise(async (resolve, reject) => {
    const userParams = {
      TableName: "winston",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${user}`,
        ":sk": "#FRIEND"
      }
    };

    try {
      const userFollowing = await dynamo.query(userParams).promise();
      console.log(
        "🚀 ~ file: main.js ~ line 233 ~ getFollowing ~ userFollowing",
        userFollowing
      );

      const usernames = userFollowing.Items.map((user) => {
        return user.followedUser;
      });
      resolve(usernames);
    } catch (err) {
      console.log("ERR GETTING ALL USERS", err);
    }
  });
};

exports.lambdaHandler = async (event, context) => {
  console.log(
    "🚀 ~ file: app.js ~ line 58 ~ exports.lambdaHandler= ~ event",
    event
  );
  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };
  const user = event.queryStringParameters.user;

  try {
    const userObj = await getAllUsers();
    console.log(
      "🚀 ~ file: app.js ~ line 65 ~ exports.lambdaHandler= ~ userObj",
      userObj
    );
    const usernames = await getFollowing(user);
    console.log(
      "🚀 ~ file: app.js ~ line 66 ~ exports.lambdaHandler= ~ userNames",
      usernames
    );
    userObj.forEach((item, index) => {
      if (usernames.includes(item.username)) {
        userObj[index].following = true;
      } else {
        userObj[index].following = false;
      }
    });
    console.log("userOBJJJJ", userObj);

    if (Object.keys(userObj).length > 0) {
      response.statusCode = 200;
      response.body = JSON.stringify(userObj);
    } else {
      response.statusCode = 200;
      response.body = JSON.stringify({});
    }
  } catch (err) {
    console.log("errrr", err);
    response.statusCode = 500;
    response.body = {
      error: "something happened"
    };
  }

  return response;
};
