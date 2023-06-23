#! /bin/bash

docker buildx create --name bug-sales-builder --driver-opt network=host --buildkitd-flags '--allow-insecure-entitlement network.host'

docker buildx use bug-sales-builder

docker buildx inspect --bootstrap

docker buildx build --platform linux/amd64 -t edgarpdev/bug-sales-bot-web-scraper --push .
