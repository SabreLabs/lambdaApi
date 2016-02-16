var package = require("./package.json");
var lambdaApi = require("./lib/lambda_api.js");

console.log("loaded " + package.name + ", version " + package.version);

exports.handler = function (event, context) {
  lambdaApi.handleRequest(event, context.done);
}
