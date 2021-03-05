var AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "dynamo" });

AWS.config.update({
  region: "us-west-2",
  credentials
});

var dynamo = new AWS.DynamoDB.DocumentClient();
dynamo.update({
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

const getRoundsForUser = async (user) => {
  console.log("CREATING A LIST OF ALL FRIENDS POSTS IN CHRONOLOGICAL ORDErR");

  const queryParams = {
    TableName: "winston",
    FilterExpression: null,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk) ",
    ExpressionAttributeValues: {
      ":pk": `USER#${user}`,
      ":sk": "#FRIEND"
    },
    ScanIndexForward: true
  };

  try {
    const followingUsers = await dynamo.query(queryParams).promise();
    console.log(
      "🚀 ~ file: getRounds.js ~ line 30 ~ getRoundsForUser ~ followingUsers",
      followingUsers
    );

    const filterExpressionStr = followingUsers.Items.map(
      (item, index) => `USER#${item.followedUser}`
    ).join(",");

    const queryParams2 = {
      TableName: "winston",
      KeyConditions: {
        PK: {
          ComparisonOperator: "IN",
          AttributeValueList: ["USER#ahladun"]
        },
        SK: {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: ["ROUND#"]
        }
      },
      ScanIndexForward: true
    };
    const rounds = await dynamo.query(queryParams2).promise();

    console.log(
      "🚀 ~ file: app.js ~ line 42 ~ getRoundsForUser ~ rounds",
      rounds
    );

    // const followingUserRounds = await new Promise((resolve, reject) => {
    //   followingUsers.Items.forEach(async (item, index, array) => {
    //     const userItem = await dynamo
    //       .query({
    //         TableName: "winston",
    //         KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    //         ExpressionAttributeValues: {
    //           ":pk": `USER#${item["followedUser"]}`,
    //           ":sk": "ROUND#"
    //         },
    //         ScanIndexForward: true
    //       })
    //       .promise();

    //     console.log(
    //       "🚀 ~ file: main.js ~ line 97 ~ res4.Items.forEach ~ userItem.Items",
    //       userItem.Items
    //     );
    //     userItem.Items.forEach((x) => keys.push(x));
    //     if (index === array.length - 1) resolve(keys);
    //   });
    // }).then((res) => {
    //   console.log(
    //     "🚀 ~ file: app.js ~ line 70 ~ followingUserRounds ~ res",
    //     res
    //   );
    //   console.log("FINAL FOLLOWING LIST", keys);
    //   return keys;
    // });
    // console.log("returning followingUserRounds");
    // console.log(
    //   "🚀 ~ file: app.js ~ line 82 ~ getRoundsForUser ~ followingUserRounds",
    //   followingUserRounds
    // );
    // return followingUserRounds;
  } catch (err) {
    console.log("ERROR", err.message);
  }
};

const user = "ahladun";

const rounds = getRoundsForUser(user);
console.log(
  "🚀 ~ file: app.js ~ line 79 ~ exports.lambdaHandler= ~ rounds",
  rounds
);

// exports.lambdaHandler = async (event, context) => {

//   response = {
//     isBase64Encoded: false,
//     headers: {
//       "Content-Type": "application/json",
//       "Access-Control-Allow-Origin": "*"
//     }
//   };

//   if (Object.keys(rounds).length > 0) {
//     response.statusCode = 200;
//     response.body = JSON.stringify(
//       rounds.sort((a, b) => a.timestamp - b.timestamp)
//     );
//   } else {
//     response.statusCode = 500;
//     response.body = {
//       error: "something happened"
//     };
//   }

//   return response;
// };
