#! /bin/bash
docker build --build-arg ARG_AWS_REGION=$REGION --build-arg ARG_AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID --build-arg ARG_AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY  -t edgarpdev/bug-sales-bot-web-scraper .

docker push edgarpdev/bug-sales-bot-web-scraper
