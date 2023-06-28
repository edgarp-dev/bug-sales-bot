#! /bin/bash
docker build --build-arg LOCALHOST=false --build-arg AWS_REGION=$REGION --build-arg AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY  -t edgarpdev/bug-sales-bot-web-scraper .

docker push edgarpdev/bug-sales-bot-web-scraper
