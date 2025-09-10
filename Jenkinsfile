pipeline {
  agent any
  options {
    timestamps()
  }
  environment {
    IMAGE_NAME = 'inmeta-docs-api'
    IMAGE_TAG  = 'dev'
    COMPOSE_FILE = 'docker-compose.dev.yml'
    COMPOSE_PROJECT_NAME = 'inmeta-docs-api-dev'
  }
  stages {
    stage('Checkout') {
      steps {
        // Usa a credencial de Git que você já cadastrou via "Pipeline script from SCM"
        checkout scm
      }
    }

    stage('Write .env.dev from credentials') {
      steps {
        withCredentials([string(credentialsId: 'inmeta-dev-env', variable: 'ENV_DEV')]) {
          sh '''
            echo "[jenkins] writing .env.dev"
            printf "%s\n" "$ENV_DEV" > .env.dev
            test -s .env.dev || (echo ".env.dev is empty" && exit 1)
          '''
        }
      }
    }

    stage('Docker build') {
      steps {
        sh '''
          docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
          docker images | grep ${IMAGE_NAME}
        '''
      }
    }

    stage('Deploy (docker compose up)') {
      steps {
        sh '''
          docker network inspect web >/dev/null 2>&1 || docker network create web
          export IMAGE_NAME=${IMAGE_NAME} IMAGE_TAG=${IMAGE_TAG}
          docker compose -f ${COMPOSE_FILE} up -d --remove-orphans
          docker ps --filter "name=api-dev"
        '''
      }
    }

    stage('Smoke test') {
      steps {
        // Se o host do Jenkins != host do Traefik, troque o endpoint por algo acessível do agente
        sh '''
          set -e
          # tenta via container local
          curl -fsS http://localhost:3000/health || {
            echo "Trying logs..."
            docker logs --tail=200 api-dev || true
            exit 1
          }
        '''
      }
    }
  }
  post {
    always {
      sh 'docker ps --filter name=api-dev || true'
    }
    failure {
      sh 'docker logs --tail=200 api-dev || true'
    }
  }
}
