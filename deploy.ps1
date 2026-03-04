# Build and push backend
docker build -t gcr.io/maximal-height-440109-t4/perrinvest-backend -f app/Dockerfile.backend .
docker push gcr.io/maximal-height-440109-t4/perrinvest-backend

# Build and push frontend
docker build -t gcr.io/maximal-height-440109-t4/perrinvest-frontend -f frontend/Dockerfile.frontend .
docker push gcr.io/maximal-height-440109-t4/perrinvest-frontend

# Deploy backend
gcloud run deploy perrinvest-backend --image gcr.io/maximal-height-440109-t4/perrinvest-backend --platform managed --region us-east1 --allow-unauthenticated --port 5000

# Deploy frontend
gcloud run deploy perrinvest-frontend --image gcr.io/maximal-height-440109-t4/perrinvest-frontend --platform managed --region us-east1 --allow-unauthenticated --port 8080
