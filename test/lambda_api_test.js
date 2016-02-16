var assert = require("chai").assert;
var myNewApi = require("../lib/lambda_api.js");

describe("lambdaApi", function () {
  it("exports handleRequest", function () {
    assert.typeOf(myNewApi.handleRequest, "function");
  });
});
