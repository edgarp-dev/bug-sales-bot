#! /bin/bash

source .env

docker buildx create --name bug-sales-builder

docker buildx use bug-sales-builder

docker buildx inspect --bootstrap

docker buildx build --platform linux/amd64 \
    --build-arg ARG_AWS_REGION=$AWS_REGION \
    --build-arg ARG_AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    --build-arg ARG_AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    -t edgarpdev/bug-sales-bot-web-scraper --push .
