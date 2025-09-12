pipeline {
  agent any

  environment {
    IMAGE_NAME = 'inmeta-docs-api'
    IMAGE_TAG  = 'dev'
    APP_HOST   = 'https://dev.inmeta.dynax.com.br'
    CONTAINER  = 'api-dev'
    PORT       = '3000'
  }

  options {
    disableResume()
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Write .env.dev from credentials') {
      steps {
        withCredentials([file(credentialsId: 'inmeta-dev-env-file', variable: 'ENV_FILE')]) {
          sh '''
            set -e
            echo "[jenkins] copying .env.dev"
            cp "$ENV_FILE" .env.dev
            test -s .env.dev
            stat -c%s .env.dev | xargs echo "[jenkins] .env.dev size:"
          '''
        }
      }
    }

    stage('Docker build') {
      steps {
        sh '''
          set -eux
          docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
          docker images | grep ${IMAGE_NAME}
        '''
      }
    }

    stage('Deploy (docker run)') {
      steps {
        sh '''
          set -eux

          # redes precisam existir
          docker network inspect web >/dev/null
          docker network inspect elk-dev >/dev/null

          # container antigo fora
          docker rm -f ${CONTAINER} || true

          # SOBE PRIMEIRO NA REDE "web" (Traefik)
          docker run -d --name ${CONTAINER} \
            --restart unless-stopped \
            --env-file .env.dev \
            -e NODE_ENV=development \
            -e PORT=${PORT} \
            --network web \
            --label traefik.enable=true \
            --label traefik.docker.network=web \
            --label traefik.http.services.api-dev.loadbalancer.server.scheme=http \
            --label traefik.http.services.api-dev.loadbalancer.server.port=${PORT} \
            --label traefik.http.routers.api-dev-http.rule='Host(`dev.inmeta.dynax.com.br`)' \
            --label traefik.http.routers.api-dev-http.entrypoints=web \
            --label traefik.http.routers.api-dev-http.middlewares=redirect-to-https@file \
            --label traefik.http.routers.api-dev-https.rule='Host(`dev.inmeta.dynax.com.br`)' \
            --label traefik.http.routers.api-dev-https.entrypoints=websecure \
            --label traefik.http.routers.api-dev-https.tls=true \
            --label traefik.http.routers.api-dev-https.tls.certresolver=myresolver \
            --label traefik.http.routers.api-dev-https.service=api-dev \
            ${IMAGE_NAME}:${IMAGE_TAG}

          # AGORA conecta na rede do Elasticsearch
          docker network connect elk-dev ${CONTAINER} || true

          # Status
          docker ps --filter "name=${CONTAINER}"
          echo "[jenkins] redes do container:"
          docker inspect -f '{{json .NetworkSettings.Networks}}' ${CONTAINER} | sed 's/","/\\n/g'

          echo "[jenkins] ===== Diagnóstico ELASTIC dentro do container ====="
          docker exec -i ${CONTAINER} sh -lc 'node -e '"'"'const u=new URL(process.env.ELASTICSEARCH_NODE||"http://elasticsearch-dev:9200"); require("dns").promises.lookup(u.hostname).then(r=>console.log("DNS OK:",u.hostname,r)).catch(e=>console.error("DNS FAIL:",u.hostname,e.message))'"'"''
          docker exec -i ${CONTAINER} sh -lc 'node -e '"'"'const u=new URL(process.env.ELASTICSEARCH_NODE||"http://elasticsearch-dev:9200"); const net=require("net"); const s=net.connect(u.port||9200,u.hostname,()=>{console.log("TCP OK:",u.hostname,u.port||9200); s.end()}).on("error",e=>{console.error("TCP ERR:",u.hostname,u.port||9200,e.message)})'"'"''
          echo "[jenkins] ================================================"
        '''
      }
    }

    stage('Smoke test (interno)') {
      steps {
        sh '''
          set -e
          echo "[jenkins] Aguardando app (localhost:${PORT}) responder dentro do container..."
          for i in $(seq 1 60); do
            # tenta via node fetch (sempre existe)
            if docker exec -i ${CONTAINER} sh -lc 'node -e '"'"'(async()=>{try{const r=await fetch("http://localhost:'"${PORT}"'/api/health"); process.exit(r.ok?0:1)}catch(e){process.exit(1)}})()'"'"''; then
              echo "[jenkins] OK interno"
              exit 0
            fi
            sleep 1
          done
          echo "[jenkins] App NAO respondeu internamente"
          docker logs --tail=200 ${CONTAINER} || true
          exit 1
        '''
      }
    }

    stage('Smoke test (externo via Traefik)') {
      steps {
        sh '''
          set -e
          echo "[jenkins] Esperando Traefik atualizar as rotas..."
          sleep 5
          for i in $(seq 1 60); do
            if curl -fsS ${APP_HOST}/api/health >/dev/null ; then
              echo "[jenkins] OK externo"
              exit 0
            fi
            sleep 1
          done
          echo "[jenkins] Falha externo (504/404)"
          exit 1
        '''
      }
    }
  }

  post {
    failure {
      echo 'Build falhou — dump de logs do container:'
      sh '''
        docker ps --filter "name=${CONTAINER}" || true
        docker logs --tail=300 ${CONTAINER} || true
        echo "[jenkins] Logs do Traefik relevantes:"
        docker logs traefik --tail=300 | grep -i -E 'api-dev|server|error|timeout' || true
      '''
    }
  }
}
