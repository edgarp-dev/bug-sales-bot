#! /bin/bash

docker buildx create --name bug-sales-builder

docker buildx use bug-sales-builder

docker buildx inspect --bootstrap

docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t edgarpdev/bug-sales-bot-web-scraper --push .
