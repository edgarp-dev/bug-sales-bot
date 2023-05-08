#!/bin/bash
set -eo pipefail

show_help() {
cat << EOF
Usage: $0 --env|-e ENV --artifacts-bucket|-b BUCKET

This script receives a parameter ENV which can be provided using the --env or -e flag, and a artifacts bucket using --artifacts-bucket or -b flag.

Available options:
    -e, --env           Environment value to use (mandatory, accepted values: dev, prod)
    -b, --artifacts-bucket  Pipeline artifacts bucket where artifacts will be stored (mandatory)
    -h, --help          Show this help message

Examples:
    $0 --env prod --artifacts-bucket my-bucket
    $0 -e dev -b my-bucket
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
    --artifacts-bucket|-b)
    ARTIFACTS_BUCKET="$2"
    shift
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

if [ -z "$ARTIFACTS_BUCKET" ]; then
  echo "You must provide a value for --artifacts-bucket"
  show_help
  exit 1
fi

AWS_REGION="us-east-1"
S3_PREFIX="bug-sales-processor-artifacts-$ENV"

echo "Selected env: $ENV"
echo "Artifacts bucket: $ARTIFACTS_BUCKET/bug-sales-processor-artifacts-$ENV"

echo "Building bug-sales-processor-$ENV lambda"
sam build --template-file ./cloudformation/template.yml --base-dir ./

echo "Uploading bug-sales-processor$ENV lambda artifacts"
sam package --s3-bucket $ARTIFACTS_BUCKET \
    --s3-prefix $S3_PREFIX \
    --output-template-file output.yml \
    --region $AWS_REGION

echo "Deploying bug-sales-processor lambda$ENV"
sam deploy --template-file output.yml \
    --stack-name bug-sales-processor-lambda-$ENV \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides "Env=$ENV"
