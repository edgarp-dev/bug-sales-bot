#! /bin/bash

docker buildx create --name bug-sales-builder

docker buildx use bug-sales-builder

docker buildx inspect --bootstrap

docker buildx build --platform linux/arm64/v8 -t edgarpdev/bug-sales-bot-web-scraper --push .
