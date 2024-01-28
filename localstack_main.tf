terraform {
    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "~> 3"
        }
    }
}

provider "aws" {
    region = "sa-east-1"
    access_key = "test"
    secret_key = "test"
    s3_force_path_style = false
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true

    endpoints {
        apigateway              = "http://localhost:4566"
        iam                     = "http://localhost:4566"
        s3                      = "http://s3.localhost.localstack.cloud:4566"
        lambda                  = "http://localhost:4566"
        dynamodb                = "http://localhost:4566"
        sqs                     = "http://localhost:4566"
    }
}

data "archive_file" "api_handler_lambda_function" {
    type                        = "zip"
    source_dir                  = "app"
    output_path                 = "api-handler.zip"
    excludes                    = ["app/test", "app/.gitignore", "app/LEIAME.md"]
}

resource "aws_iam_role" "lambda_api_role" {
    name = "lambda_api_role"

    assume_role_policy =<<EOF
    {
        "version": "2012-10-17",
        "Statement": [
            {
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole",
                "Effect": "Allow"
            }
        ]
    }
EOF
}

resource "aws_lambda_function" "lambda_api_function" {
    #filename                    = "api-handler.zip"
    filename                    = data.archive_file.api_handler_lambda_function.output_path
    function_name               = "lambda_api_function"
    role                        = aws_iam_role.lambda_api_role.arn
    handler                     = "index.handler"
    #source_code_hash            = filebase64sha256("api-handler.zip")
    source_code_hash            = data.archive_file.api_handler_lambda_function.output_base64sha256
    memory_size                 = 128
    publish                     = true
    runtime                     = "nodejs16.x"

    environment {
        variables = {
            DEBUG = "dev"
            FOO = "BAR"
        }
    }
}

resource "aws_api_gateway_rest_api" "rest_api" {
    name                        = "rest_api"
    description                 = "API Gateway V1"
}

resource "aws_api_gateway_resource" "resource_health" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    parent_id                   = aws_api_gateway_rest_api.rest_api.root_resource_id
    path_part                   = "health"
}

resource "aws_api_gateway_method" "resource_health_method_get" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    resource_id                 = aws_api_gateway_resource.resource_health.id
    http_method                 = "GET"
    authorization               = "NONE"
}

resource "aws_api_gateway_integration" "resource_health_method_get" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    resource_id                 = aws_api_gateway_resource.resource_health.id
    http_method                 = aws_api_gateway_method.resource_health_method_get.http_method
    integration_http_method     = "POST"
    type                        = "AWS_PROXY"
    uri                         = aws_lambda_function.lambda_api_function.invoke_arn
    credentials                 = aws_iam_role.lambda_api_role.arn
}

resource "aws_api_gateway_resource" "business" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    parent_id                   = aws_api_gateway_rest_api.rest_api.root_resource_id
    path_part                   = "business"
}

resource "aws_api_gateway_resource" "resource_request" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    parent_id                   = aws_api_gateway_resource.business.id
    path_part                   = "request"
}

resource "aws_api_gateway_method" "resource_request__method_post" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    resource_id                 = aws_api_gateway_resource.resource_request.id
    http_method                 = "POST"
    authorization               = "NONE"
}

resource "aws_api_gateway_integration" "resource_request__method_post" {
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    resource_id                 = aws_api_gateway_resource.resource_request.id
    http_method                 = aws_api_gateway_method.resource_request__method_post.http_method
    integration_http_method     = "POST"
    type                        = "AWS_PROXY"
    uri                         = aws_lambda_function.lambda_api_function.invoke_arn
    credentials                 = aws_iam_role.lambda_api_role.arn
}

resource "aws_api_gateway_deployment" "rest_api" {
    depends_on = [
        aws_api_gateway_integration.resource_health_method_get,
        aws_api_gateway_integration.resource_request__method_post
    ]
    rest_api_id                 = aws_api_gateway_rest_api.rest_api.id
    stage_name                  = "local"
}

resource "aws_lambda_permission" "rest_api" {
    statement_id                = "AllowAPIGatewayInvoke"
    action                      = "lambda:InvokeFunction"
    function_name               = aws_lambda_function.lambda_api_function.function_name
    principal                   = "apigateway.amazonaws.com"
    source_arn                  = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}
