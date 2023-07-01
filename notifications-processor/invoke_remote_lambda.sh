#!/bin/bash

ENV=""
TAIL_LOGS=false

show_help() {
  echo "Usage: script.sh [OPTIONS]"
  echo "Options:"
  echo "  -e, --env ENVIRONMENT  Set the environment to ENVIRONMENT (dev or prod)"
  echo "  -h, --help             Show this help message"
}

set_environment() {
  local environment="$1"
  if [[ "$environment" == "dev" ]]; then
    echo "Setting environment to: dev"
    ENV=dev
  elif [[ "$environment" == "prod" ]]; then
    echo "Setting environment to: prod"
    ENV=prod
  else
    echo "Invalid environment specified. Allowed values are 'dev' and 'prod'."
    exit 1
  fi
}

tail_logs() {
  TAIL_LOGS=true
}

# Parse command line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      shift
      if [[ -z "$1" ]]; then
        echo "Missing argument for --env option."
        exit 1
      fi
      set_environment "$1"
      shift
      ;;
    -t|--tail)
      tail_logs
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unrecognized option: $1"
      exit 1
      ;;
  esac
done

echo $ENV

STACK_NAME=bug-sales-notifications-processor-$ENV

sam remote invoke --stack-name $STACK_NAME --event-file './invoke_remote_event.json' --output json NotificationsProcessorLambda

if [[ "$TAIL_LOGS" == "true" ]]; then
  echo "Tailing logs."
  sam logs --stack-name $STACK_NAME --name NotificationsProcessorLambda --tail
fi
