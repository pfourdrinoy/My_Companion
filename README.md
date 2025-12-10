# My_Companion

## Points d'améliorations

Checker pour l'asynchron des fonctions

## Commandes:
### Docker

docker build -t my-companion-api-image .
docker run -d -p 8000:8000 --name my-companion-api my-companion-api-image

docker build -t app-react-image .
docker run -d -p 3000:80 app-react-image

### Supression:
docker rm $(docker ps -aq)

### Compose
docker compose up --build



    // "@testing-library/dom": "^10.4.1",
    // "@testing-library/jest-dom": "^6.9.1",
    // "@testing-library/react": "^16.3.0",
    // "@testing-library/user-event": "^13.5.0",