# My_Companion

## How to expose
### Create own domain: 
    https://docs.is-a.dev/quickstart/
### Cloudflare
    Dowload Cloudflare: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/
    Launch your containers.
    Expose your local ip with: cloudflared tunnel --url http://localhost:80
    Consult metrics: http://127.0.0.1:20241/metrics
### Ngrok
    Download Ngrok: https://dashboard.ngrok.com/get-started/setup/windows
    Launch your containers.
    Expose your local ip with: ngrok http 80

    Permanent url: https://gratifyingly-nonscientific-gala.ngrok-free.dev/

## Docker
### Commandes:

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

## TODO

Il faut restructurer l'API pour avoir que des fichiers de routes et avoir des fichiers d'helpers et de fonction pour éviter d'avoir des doublons
app:VocabularyList: réaction et adaptabilité à la forme de la fenêtre


######################################################################################
2. Exposition sur internet via Cloudflare Tunnel

Installé cloudflared sur Windows
Créé un compte Cloudflare Zero Trust sur one.dash.cloudflare.com
Créé un tunnel nommé MyCompanion → ID : 00e9c849-a274-46c9-8e0d-ec6a40941ce8
Installé cloudflared comme service Windows (démarre automatiquement)

3. Domaine gratuit via is-a.dev

Forké github.com/is-a-dev/register
Créé domains/my-companion.json avec le CNAME pointant vers le tunnel
Ouvert une PR → en attente de validation


Quand la PR est mergée
1. Aller sur one.dash.cloudflare.com → votre tunnel MyCompanion → Configure → Public Hostname → Add a public hostname
2. Remplir :

Subdomain : my-companion
Domain : is-a.dev
Service : http://localhost:80

3. Votre app sera accessible sur https://my-companion.is-a.dev 🎉

Pour que ça fonctionne au quotidien

Le service Windows tourne en arrière-plan automatiquement
Il faut que Docker Desktop soit lancé avec docker compose up -d
Il faut que votre PC soit allumé