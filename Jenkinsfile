environment {
  IMAGE_NAME   = 'inmeta-docs-api'
  IMAGE_TAG    = 'dev'
  COMPOSE_FILE = 'docker-compose.dev.yml'
}

stage('Docker build') {
  steps {
    sh '''
      docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    '''
  }
}
