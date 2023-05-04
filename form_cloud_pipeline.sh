#!/bin/bash
set -euo pipefail

show_help() {
cat << EOF
Usage: $0 --env|-e ENV [--current-branch|-c]

This script receives a parameter ENV which can be provided using the --env or -e flag.
Additionally, it can receive an optional flag --current-branch or -c to use the current Git branch.

Available options:
    -e, --env           Environment value to use (mandatory, accepted values: dev, prod)
    -c, --current-branch Use the current Git branch (optional, only used with 'dev' environment)
    -h, --help          Show this help message

Examples:
    $0 --env prod
    $0 -e dev
    $0 --env dev --current-branch
EOF
}

ENV=""
CURRENT_BRANCH="main"
USE_CURRENT_BRANCH=false

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
    --current-branch|-c)
    USE_CURRENT_BRANCH=true
    shift
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

if [ "$ENV" = "prod" ] && [ "$USE_CURRENT_BRANCH" = "true" ]; then
  echo "Error: The --current-branch flag can only be used with the 'dev' environment"
  show_help
  exit 1
fi

if [ "$USE_CURRENT_BRANCH" = "true" ]; then
  CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
fi

cfn-lint ./cloudformation/*

echo "Selected env: $ENV"
echo "Current branch: $CURRENT_BRANCH"

AWS_REGION='us-east-1'
ARTIFACTS_S3_BUCKET=bug-sales-artifacts-bucket-$ENV

if aws s3api head-bucket --bucket $ARTIFACTS_S3_BUCKET 2>/dev/null;
then
    echo "$ARTIFACTS_S3_BUCKET exists"
else
    echo "$ARTIFACTS_S3_BUCKET DOES NOT exists, creating it..."
    aws s3api create-bucket --bucket $ARTIFACTS_S3_BUCKET --region $AWS_REGION
    echo "$ARTIFACTS_S3_BUCKET bucket created in region $AWS_REGION."
fi

echo "Uploading infrastructure files"
aws s3 sync ./cloudformation s3://$ARTIFACTS_S3_BUCKET/cloudformation

echo "Deploying changes"
aws cloudformation deploy --stack-name bug-sales-bot-$ENV \
    --template-file ./cloudformation/main.yml \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides Env=$ENV ArtifactsBucket=$ARTIFACTS_S3_BUCKET Branch=$CURRENT_BRANCH
