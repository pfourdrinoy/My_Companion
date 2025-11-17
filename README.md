# My_Companion

Commandes:

docker build -t my-companion-api-image ./api
docker run -d -p 8000:8000 --name my-companion-api my-companion-api-image