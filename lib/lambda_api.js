exports.handleRequest = function (requestData, callback) {
  var responseData = {
    received_as_input: requestData
  };
  callback(null, responseData);
}
