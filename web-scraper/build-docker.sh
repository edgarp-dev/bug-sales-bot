#! /bin/bash

docker buildx create --name bug-sales-builder

docker buildx use bug-sales-builder

docker buildx inspect --bootstrap

docker buildx build --platform linux/arm64/v8,linux/amd64 -t edgarpdev/bug-sales-bot-web-scraper --push .
