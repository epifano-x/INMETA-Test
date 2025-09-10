pipeline {
  agent any
  options {
    timestamps()
    disableResume()
  }
  environment {
    IMAGE_NAME   = 'inmeta-docs-api'
    IMAGE_TAG    = 'dev'
    COMPOSE_FILE = 'docker-compose.dev.yml'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Write .env.dev from credentials') {
      steps {
        // Troque o ID se o seu secret tiver outro nome. Pelo log, é "ENV_DEV".
        withCredentials([string(credentialsId: 'ENV_DEV', variable: 'ENV_DEV')]) {
          sh '''
            echo "[jenkins] writing .env.dev"
            printf "%s" "$ENV_DEV" > .env.dev
            test -s .env.dev
          '''
        }
      }
    }

    stage('Docker build') {
      steps {
        sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
      }
    }

    stage('Deploy (docker compose up)') {
      steps {
        sh '''
          IMAGE_NAME=${IMAGE_NAME} IMAGE_TAG=${IMAGE_TAG} \
          docker compose -f ${COMPOSE_FILE} up -d --remove-orphans
        '''
      }
    }

    stage('Smoke test') {
      steps {
        sh '''
          sleep 3
          curl -fsS https://dev.inmeta.dynax.com.br/api/health \
            || (docker logs --tail=200 api-dev; exit 1)
        '''
      }
    }
  }

  post {
    always {
      sh 'docker ps --filter name=api-dev || true'
      sh 'docker logs --tail=200 api-dev || true'
    }
  }
}
