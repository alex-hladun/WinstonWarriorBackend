var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const getFollowingUsers = async (user) => {
  // 1: Get all users that a user follows
  return new Promise(async (resolve, reject) => {
    const queryParams = {
      TableName: "winston",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk) ",
      ExpressionAttributeValues: {
        ":pk": `USER#${user}`,
        ":sk": "#FRIEND"
      },
      ScanIndexForward: true
    };

    let followingUsers;
    try {
      followingUsers = await dynamo.query(queryParams).promise();
      console.log("🚀 ~ followingUsers length", followingUsers.Items.length);
      resolve(followingUsers);
    } catch (err) {
      console.log("❌❌❌ error", err);
    }
  });
};

const getRoundsForUsers = async (users) => {
  // 2: Get all of the 'rounds' for each user
  return new Promise(async (resolve, reject) => {
    let keys = [];
    let index = 0;
    let length = users.Items.length;
    for (const user of users.Items) {
      let userItem;
      try {
        userItem = await dynamo
          .query({
            TableName: "winston",
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `USER#${user["followedUser"]}`,
              ":sk": "ROUND#"
            },
            ScanIndexForward: true
          })
          .promise();
      } catch (err) {
        console.log("❌❌❌ERROR", err.message);
      }

      userItem.Items.forEach(async (x) => {
        keys.push(x);
      });
      index++;
      if (index === length - 1) {
        resolve(keys);
      }
    }
  });
};

const enrichRounds = async (rounds) => {
  // Enrich rounds/photos with reactions
  return new Promise(async (resolve, reject) => {
    const enrichedKeys = [];

    let index = 0;
    let length = rounds.length;
    for (const round of rounds) {
      const roundSk = round["SK"];
      const enrichQueryParams = {
        TableName: "winston",
        IndexName: "InvertedIndex",
        KeyConditionExpression: "SK = :sk AND begins_with(PK, :reactions)",
        ExpressionAttributeValues: {
          ":reactions": "REACTION",
          ":sk": roundSk
        },
        ScanIndexForward: true
      };
      try {
        const enrichedRoundItem = await dynamo
          .query(enrichQueryParams)
          .promise();

        enrichedKeys.push({ ...round, reactions: enrichedRoundItem });
        index++;
        if (index === length - 1) {
          resolve(enrichedKeys);
        }
      } catch (err) {
        console.log("❌❌❌ERROR ENRICHING", err);
      }
    }
  });
};
exports.lambdaHandler = async (event, context) => {
  const user = event.queryStringParameters.user;

  const users = await getFollowingUsers(user);
  console.log(
    "🚀 ~ file: app.js ~ line 102 ~ exports.lambdaHandler= ~ users",
    users
  );
  const rounds = await getRoundsForUsers(users);
  console.log(
    "1️⃣ 1️⃣ 1️⃣ 1️⃣ 1️     ~ file: app.js ~ line 106 ~ exports.lambdaHandler= ~ rounds",
    rounds
  );
  const finalkeys = await enrichRounds(rounds);
  const sortedKeys = finalkeys.sort((a, b) => b.timestamp - a.timestamp);

  console.log(
    " ✅ ~ file: app.js ~ line 116 ~ exports.lambdaHandler= ~ sortedKeys",
    sortedKeys
  );
  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };

  if (Object.keys(sortedKeys).length > 0) {
    response.statusCode = 200;
    response.body = JSON.stringify(sortedKeys);
  } else {
    console.log("❌ERROR with sorted keys length ");
    response.statusCode = 500;
    response.body = JSON.stringify([]);
  }

  return response;
};
