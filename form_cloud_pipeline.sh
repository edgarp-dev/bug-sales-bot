#!/bin/bash

show_help() {
cat << EOF
Usage: $0 --env|-e ENV

This script receives a parameter ENV which can be provided using the --env or -e flag.

Available options:
    -e, --env           Environment value to use (mandatory)
    -h, --help          Show this help message

Examples:
    $0 --env production
    $0 -e staging
EOF
}

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --env|-e)
    ENV="$2"
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

echo "The value of --env is: $ENV"

AWS_REGION='us-east-1'

# TODO Agregar creacion de bucket de s3