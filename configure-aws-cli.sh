#!/bin/bash

# Activate the virtual environment
source /opt/aws-cli-env/bin/activate

# Configure AWS CLI with the provided environment variables
aws configure set aws_access_key_id "$AWS_ACCESS_KEY"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"

# Verify AWS CLI configuration
aws configure list
