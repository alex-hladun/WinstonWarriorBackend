var AWS = require("aws-sdk");

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const enrichRounds = async (rounds) => {
  const enrichedKeys = [];
  const enrichedRounds = await new Promise((resolve, reject) => {
    rounds.forEach(async (round, index, array) => {
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

        if (index === array.length - 1) {
          resolve(enrichedKeys);
        }
      } catch (err) {
        console.log("ERROR ENRICHING", err);
      }
    });
  });
  return enrichedRounds;
};

const getRoundsForUser = async (user) => {
  let keys = [];
  console.log("CREATING A LIST OF ALL FRIENDS POSTS WITH COMMENTS IN CHRONOLOGICAL ORDErR");

  const queryParams5 = {
    TableName: "winston",
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk) ",
    ExpressionAttributeValues: {
      ":pk": `USER#${user}`,
      ":sk": "#FRIEND"
    },
    ScanIndexForward: true
  };

  try {
    const followingUsers = await dynamo.query(queryParams5).promise();

    const followingUserRounds = await new Promise((resolve, reject) => {
      followingUsers.Items.forEach(async (item, index, array) => {
        const userItem = await dynamo
          .query({
            TableName: "winston",
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `USER#${item["followedUser"]}`,
              ":sk": "ROUND#"
            },
            ScanIndexForward: true
          })
          .promise();

        userItem.Items.forEach(async (x) => {
          keys.push(x);
        });
        if (index === array.length - 1) {
          const finalkeys = await enrichRounds(keys);
          resolve(finalkeys);
        }
      });
    }).then((res) => {
      console.log("FINAL FOLLOWING LIST", res);
      return keys;
    });

    return followingUserRounds;
  } catch (err) {
    console.log("ERROR", err.message);
  }
};

exports.lambdaHandler = async (event, context) => {
  const user = event.queryStringParameters.user;

  const rounds = await getRoundsForUser(user);
  console.log(
    "🚀 ~ file: app.js ~ line 79 ~ exports.lambdaHandler= ~ rounds",
    rounds
  );

  response = {
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };

  if (Object.keys(rounds).length > 0) {
    response.statusCode = 200;
    response.body = JSON.stringify(
      rounds.sort((a, b) => b.timestamp - a.timestamp)
    );
  } else {
    response.statusCode = 500;
    response.body = JSON.stringify({});
  }

  return response;
};
