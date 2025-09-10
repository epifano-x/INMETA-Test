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
    disableResume()   // performance > durabilidade
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

          # garante rede do traefik
          docker network create web || true

          # remove container anterior se existir
          docker rm -f ${CONTAINER} || true

          # sobe container novo
          docker run -d --name ${CONTAINER} \
            --restart unless-stopped \
            --env-file .env.dev \
            -e NODE_ENV=development \
            -e PORT=${PORT} \
            --network web \
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

          # mostra status
          docker ps --filter "name=${CONTAINER}"
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
