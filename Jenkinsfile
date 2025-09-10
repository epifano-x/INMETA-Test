pipeline {
  agent any

  environment {
    IMAGE_NAME = 'inmeta-docs-api'
    IMAGE_TAG  = "dev-${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Docker Build') {
      steps {
        sh """
          docker build \
            --pull \
            -t ${IMAGE_NAME}:${IMAGE_TAG} \
            .
        """
      }
    }

    stage('Deploy (docker-compose)') {
      steps {
        sh """
          export IMAGE_NAME=${IMAGE_NAME}
          export IMAGE_TAG=${IMAGE_TAG}
          docker compose -f docker-compose.dev.yml up -d --remove-orphans
        """
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'
    }
  }
}
