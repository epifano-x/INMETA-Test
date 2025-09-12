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
      steps {
        checkout scm
      }
    }

    stage('Write .env.dev from credentials') {
      steps {
        withCredentials([file(credentialsId: 'inmeta-dev-env-file', variable: 'ENV_FILE')]) {
          sh '''
            set -e
            echo "[jenkins] copying .env.dev"
            cp "$ENV_FILE" .env.dev
            test -s .env.dev
            echo "[jenkins] .env.dev size: $(stat -c%s .env.dev 2>/dev/null || stat -f%z .env.dev)"
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

          # garante redes necessárias
          docker network inspect elk-dev >/dev/null 2>&1 || docker network create elk-dev
          docker network inspect web     >/dev/null 2>&1 || docker network create web

          # remove container anterior se existir
          docker rm -f ${CONTAINER} || true

          # sobe na elk-dev (para resolver elasticsearch-dev) e depois conecta na web (Traefik)
          docker run -d --name ${CONTAINER} \
            --restart unless-stopped \
            --env-file .env.dev \
            -e NODE_ENV=development \
            -e PORT=${PORT} \
            --network elk-dev \
            --label traefik.enable=true \
            --label traefik.docker.network=web \
            --label traefik.http.routers.api-dev-http.rule='Host(`dev.inmeta.dynax.com.br`)' \
            --label traefik.http.routers.api-dev-http.entrypoints=web \
            --label traefik.http.routers.api-dev-http.middlewares=redirect-to-https@file \
            --label traefik.http.routers.api-dev-https.rule='Host(`dev.inmeta.dynax.com.br`)' \
            --label traefik.http.routers.api-dev-https.entrypoints=websecure \
            --label traefik.http.routers.api-dev-https.tls=true \
            --label traefik.http.routers.api-dev-https.tls.certresolver=myresolver \
            --label traefik.http.services.api-dev.loadbalancer.server.port=${PORT} \
            ${IMAGE_NAME}:${IMAGE_TAG}

          # conecta também na rede do Traefik
          docker network connect web ${CONTAINER} || true

          # status
          docker ps --filter "name=${CONTAINER}"

          echo "[jenkins] ===== Diagnóstico de rede dentro do container ====="
          # DNS do ES
          docker exec -i ${CONTAINER} sh -lc 'node -e "const u=new URL(process.env.ELASTICSEARCH_NODE||\"http://elasticsearch-dev:9200\"); require(\"dns\").promises.lookup(u.hostname).then(r=>console.log(\"DNS OK:\",u.hostname,r)).catch(e=>console.error(\"DNS FAIL:\",u.hostname,e.message))"' || true

          # TCP para o ES
          docker exec -i ${CONTAINER} sh -lc 'node -e "const u=new URL(process.env.ELASTICSEARCH_NODE||\"http://elasticsearch-dev:9200\"); const net=require(\"net\"); const s=net.connect(u.port||9200,u.hostname,()=>{console.log(\"TCP OK:\",u.hostname, u.port||9200); s.end()}).on(\"error\",e=>{console.error(\"TCP ERR:\",u.hostname, u.port||9200, e.message)})"' || true

          echo "[jenkins] ================================================"
        '''
      }
    }

    stage('Smoke test') {
      steps {
        sh '''
          set -e
          echo "Aguardando ${APP_HOST} subir..."
          for i in $(seq 1 60); do
            if curl -fsS ${APP_HOST}/api/health >/dev/null ; then
              echo "OK"
              exit 0
            fi
            sleep 1
          done
          echo "Healthcheck falhou"
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
      '''
    }
  }
}
