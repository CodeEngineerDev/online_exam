pipeline {
    agent any

    environment {
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
        K8S_NAMESPACE = 'online-exam'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'GitHub repository downloaded successfully'
            }
        }

        stage('Verify Project') {
            steps {
                sh '''
                    set -e
                    test -d frontend
                    test -d backend
                    test -f backend/Dockerfile
                    test -f frontend/Dockerfile
                    test -d kubernetes
                    echo "Project structure verified!"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e
                    docker build -t online-exam-backend:${BUILD_NUMBER} ./backend

                    docker build \
                      --build-arg API_INTERNAL_URL=http://backend:3001/api \
                      -t online-exam-frontend:${BUILD_NUMBER} ./frontend

                    echo "Docker images built successfully!"
                '''
            }
        }

        stage('Load Images into Minikube') {
            steps {
                sh '''
                    set -e
                    docker save online-exam-backend:${BUILD_NUMBER} |
                      docker exec -i minikube ctr -n k8s.io images import -

                    docker save online-exam-frontend:${BUILD_NUMBER} |
                      docker exec -i minikube ctr -n k8s.io images import -

                    echo "Images loaded into Minikube!"
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    set -e

                    kubectl -n ${K8S_NAMESPACE} set image \
                      deployment/backend \
                      backend=online-exam-backend:${BUILD_NUMBER}

                    kubectl -n ${K8S_NAMESPACE} set image \
                      deployment/frontend \
                      frontend=online-exam-frontend:${BUILD_NUMBER}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e

                    kubectl -n ${K8S_NAMESPACE} rollout status \
                      deployment/backend --timeout=180s

                    kubectl -n ${K8S_NAMESPACE} rollout status \
                      deployment/frontend --timeout=180s

                    kubectl -n ${K8S_NAMESPACE} get deployments,pods,services

                    echo "Deployment completed successfully!"
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Application deployed to Kubernetes!'
        }
        failure {
            echo 'FAILED: Check the Jenkins Console Output.'
        }
    }
}
