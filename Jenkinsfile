pipeline {
    agent any

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
                    echo "Checking project structure..."
                    ls -la
                    echo "Checking frontend and backend..."
                    test -d frontend
                    test -d backend
                '''
            }
        }
    }

    post {
        success {
            echo 'GitHub integration successful!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
