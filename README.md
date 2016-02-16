# Sample AWS Lambda API

Sample Node app to demonstrate orchestration between AWS Lambda and API Gateway.

This is based on: [http://readwrite.com/2015/11/16/how-to-build-an-api-amazon-lambda](http://readwrite.com/2015/11/16/how-to-build-an-api-amazon-lambda)

## One-Time Setup

There are a couple of system-level things that you should install and setup.

### AWS Setup

[Install](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) and [configure](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) the AWS CLI

### Node Setup

[Install](https://www.npmjs.com/package/node-lambda) the `node-lambda` package. This is a command-line tool for locally running and remotely deploying your node.js applications to Amazon Lambda.

## Setup A Node App

To setup a new node project you need to create some directories and files:

	mkdir lambdaApi
	cd lambdaApi
	mkdir lib test
	touch lib/lambda_api.js test/lambda_api_test.js index.js package.json

And then fill in the `package.json` with the app's details:

	{
	  "name": "lambdaApi",
	  "version": "0.0.1",
	  "description": "Lambda Test API",
	  "author": "Barrett A. Clark <barrett.clark@sabre.com>",
	  "main": "index.js",
	  "dependencies": {},
	  "devDependencies": {
	    "chai": "*",
	    "mocha": "*"
	  },
	  "scripts": {
	    "zip": "zip -r ../lambdaApi.zip *"
	  }
	}

The `zip` task/script is how you can create a zipfile to manually upload your code to AWS Lambda.

Side note: Anything that you can spawn from JS (or Pytho/Java) can run on Lambda. You could include a Go binary, for example.

### Install Dependencies

Now that you have the package defined you can run `npm install` to install the dependencies. Node is pretty nice for package management, as it turns out.

We do have a couple of test dependencies, because TATFT.

### `index.js`

`index.js` is the "controller" and what Lambda will talk to via the "handler."

	var package = require("./package.json");
	var lambdaApi = require("./lib/lambda_api.js");
	
	console.log("loaded " + package.name + ", version " + package.version);
	
	exports.handler = function (event, context) {
	  lambdaApi.handleRequest(event, context.done);
	}

### `lib/lambda_api.js`

The real meat of your project is in lib/lambda_api.js. This is where you've have all your logic. For this simple API we just echo back what we got.

	exports.handleRequest = function (requestData, callback) {
	  var responseData = {
	    received_as_input: requestData
	  };
	  callback(null, responseData);
	}

You could have a more robust API that takes in an action name with parameters to make another API call, or whatever.

### TESTS!!!

Next up, let's put a test in `test/lambda_api_test.js`:

	var assert = require("chai").assert;
	var myNewApi = require("../lib/lambda_api.js");
	
	describe("lambdaApi", function () {
	  it("exports handleRequest", function () {
	    assert.typeOf(myNewApi.handleRequest, "function");
	  });
	});

Run the test by typing in `mocha` and hitting enter. It passes, yes?

### Manual Upload

If you wanted to manually upload your code you could create the required zipfile by typing `npm run zip`. This will create a zip file with the entire project and put it one directory up. Use this if you want to manually upload your source.

## AWS Lambda

Sweet. Now we are ready to create the Lambda function. You can do this in the [AWS console](https://console.aws.amazon.com/lambda/home), or from the command line. To do it from the command line you need to run `node-lambda setup`, which will create an `.env` file in the project directory that you will need to fill in. Consider adding that file to your `.gitignore` so that you don't commit secrets to the repo.

To push create the Lambda function and push the code, run `node-lambda deploy`. Boom - you get some nice output that tells you that you've got a fancy new Lambda function IN THE CLOUD.

### Test the Lambda function

Configure the test event with some data. It doesn't really matter what you send, but you can send this:

	{
	  "key3": "value3",
	  "key2": "value2",
	  "other_key": "Hello, World!"
	}

Save and run the test, and you should see that it was a success with the following output:

	{
	  "received_as_input": {
	    "key3": "value3",
	    "key2": "value2",
	    "other_key": "Hello, World!"
	  }
	}

Amazing.

## IAM Policy

This is where it gets weird. You have to create a security role with permissions across a couple of AWS services. Go to the [IAM](https://console.aws.amazon.com/iam/home) service, and select `Policies` from the side navigation. You want to create your own policy. I called mine **APIGatewayCloudWatchLambdaInvokePolicy**. The description is "Enables API Gateway to call Lambda functions and log to Cloud Watch". Then copy this JSON in for the Policy Document:

	{
	    "Version": "2012-10-17",
	    "Statement": [
	        {
	            "Effect": "Allow",
	            "Resource": [
	                "*"
	            ],
	            "Action": [
	                "lambda:InvokeFunction"
	            ]
	        },
	        {
	            "Action": [
	                "logs:*"
	            ],
	            "Effect": "Allow",
	            "Resource": "arn:aws:logs:*:*:*"
	        },
	        {
	            "Effect": "Allow",
	            "Action": [
	                "apigateway:*"
	            ],
	            "Resource": [
	                "*"
	            ]
	        }
	    ]
	}

That will allow an AWS API Gateway to call an AWS Lambda function and log stuff to CloudWatch.

Validate the policy and save it.

## IAM Role

Now you need to create a new role. I called mine **api-gateway**.

Select AWS Lambda, and type **APIGatewayCloudWatchInvokeLambdaPolicy** in the filter box. Select it. Next step. Save.

Select your new role, click on the Trust Relationships tab, and Edit Trust Relationships.

Put this in for the Trust Relationships:

	{
	  "Version": "2012-10-17",
	  "Statement": [
	    {
	      "Effect": "Allow",
	      "Principal": {
	        "Service": "lambda.amazonaws.com"
	      },
	      "Action": "sts:AssumeRole"
	    },
	    {
	      "Sid": "",
	      "Effect": "Allow",
	      "Principal": {
	        "Service": "apigateway.amazonaws.com"
	      },
	      "Action": "sts:AssumeRole"
	    }
	  ]
	}

Save it and grab the ARN.

## API Gateway

Now that you've done all of that, you're ready to create the API Gateway. This is a way to expose the API that you've created in AWS Lambda to the web. In Rails terms, API Gateway is where you set your routes. But more than that it also handles security and logging.

You can create your endpoint two different ways:

1. Click the API Endpoints tab in your AWS Lambda function
2. Go to the [API Gateway](https://console.aws.amazon.com/apigateway/home)

Let's go with the first option. Add an API endpoint. There is only 1 type (API Gateway). Most of the stuff is filled in how you want it. Make sure the Method is what you want (`GET`, `POST`, etc.). For this demo choose `POST`.

The Deployment stage can be whatever you want. You could have `development`, `staging`, `production` stages if you want.

Security. You can use a couple of different methodologies to lock down access to the endpoint. You can also choose to have it `Open` with no access restrictions.

Submit that, and click the link for the development stage. This will take you to the API Gateway.

### Test

Choose the `lambdaApi` API, and then click the `POST` action. You'll see a lightening bolt with the word `TEST` above it. Do that. You can use the same payload as above when you tested the Lambda function.

### Deploy API

Click the `Deploy API` button. Choose the deployment stage that you want, and click Deploy.

You see that you now have an Invoke URL. That's the base URL for all the routes that you've defined. This demo has just one route (`/lambdaApi-development`).

### CloudWatch

You can click the boxes to log stuff in CloudWatch. If you do that you'll need to fill in the ARN for the IAM role. Click the `APIs` second menu tab, and then click `Settings`.

## To Test:

Now that you've done all that, you can test your shiny new API (using curl, of course).

    curl -v -H "Content-Type: application/json" \
    -X POST -d '{"hello":"world", "foo":"bar"}' \
    https://vcav689lnd.execute-api.us-east-1.amazonaws.com/development/lambdaApi-development
