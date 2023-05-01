#!/bin/bash
set -euo pipefail

show_help() {
cat << EOF
Usage: $0 --env|-e ENV

This script receives a parameter ENV which can be provided using the --env or -e flag.

Available options:
    -e, --env           Environment value to use (mandatory, accepted values: dev, prod)
    -h, --help          Show this help message

Examples:
    $0 --env prod
    $0 -e dev
EOF
}

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --env|-e)
    case "$2" in
        dev|prod)
        ENV="$2"
        shift
        shift
        ;;
        *)
        echo "Invalid value for --env, accepted values: dev, prod"
        show_help
        exit 1
        ;;
    esac
    ;;
    -h|--help)
    show_help
    exit 0
    ;;
    *)    # If it's not a known option
    echo "Unknown option: $key"
    show_help
    exit 1
    ;;
esac
done

if [ -z "$ENV" ]; then
  echo "You must provide a value for --env"
  show_help
  exit 1
fi

cfn-lint ./cloudformation/*

echo "Selected env: $ENV"

AWS_REGION="us-east-1"
ARTIFACTS_S3_BUCKET="$ENV-bug-sales-processor-artifacts"

if aws s3api head-bucket --bucket $ARTIFACTS_S3_BUCKET 2>/dev/null;
then
    echo "$ARTIFACTS_S3_BUCKET exists"
else
    echo "$ARTIFACTS_S3_BUCKET DOES NOT exists, creating it..."
    aws s3api create-bucket --bucket $ARTIFACTS_S3_BUCKET --region $AWS_REGION
    echo "$ARTIFACTS_S3_BUCKET bucket created in region $AWS_REGION."
fi

echo "Building $ENV-bug-sales-processor lambda"
sam build --template-file ./cloudformation/template.yml --base-dir ./

echo "Uploading $ENV-bug-sales-processor lambda artifacts"
sam package --s3-bucket $ARTIFACTS_S3_BUCKET --output-template-file output.yml --region $AWS_REGION

echo "Deploying $ENV-bug-sales-processor lambda"
sam deploy --template-file output.yml --stack-name $ENV-bug-sales-processor-lambda --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameter-overrides "Env=$ENV"
