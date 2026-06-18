# Deploying to Google Cloud Run

This monorepo deploys as **two Cloud Run services**:

| Service | Container | URL path |
|---|---|---|
| `ferry-flight-api` | ASP.NET Core API | `/api/*` |
| `ferry-flight-web` | nginx + React PWA | `/` (proxies `/api` to API service) |

Users only need the **web** URL. nginx forwards `/api` requests to the API service.

## Architecture

```
Browser → ferry-flight-web (Cloud Run)
              ├─ /           → static PWA
              └─ /api/*      → proxy → ferry-flight-api (Cloud Run)
```

## Prerequisites

- [Google Cloud project](https://console.cloud.google.com/)
- [GitHub repository](https://github.com/new)
- Billing enabled on GCP

## 1. Enable GCP APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com
```

## 2. Create Artifact Registry

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=asia-southeast1

gcloud artifacts repositories create ferry-flight \
  --repository-format=docker \
  --location=$GCP_REGION \
  --project=$GCP_PROJECT_ID
```

## 3. Create a deployment service account

```bash
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Actions deploy"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=github-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com
```

## 4. Configure GitHub secrets

In **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | Contents of `gcp-sa-key.json` |
| `OPENROUTESERVICE_API_KEY` | _(optional)_ OpenRouteService API key |

Optional repository variable:

| Variable | Default | Description |
|---|---|---|
| `GCP_REGION` | `asia-southeast1` | Cloud Run region (edit workflow env to change) |

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial monorepo with Docker and Cloud Run CI/CD"
git branch -M main
git remote add origin https://github.com/YOUR_USER/grab-them-all.git
git push -u origin main
```

On push to `main`, GitHub Actions will:

1. Build and test frontend + backend
2. Push Docker images to Artifact Registry
3. Deploy `ferry-flight-api` to Cloud Run
4. Deploy `ferry-flight-web` with `BACKEND_URL` pointing to the API
5. Update API CORS to allow the web service URL

## Local Docker

```bash
cp .env.example .env
# optionally set OPENROUTESERVICE_API_KEY in .env

docker compose up --build
```

- Web app: http://localhost:8081  
- API (direct): http://localhost:8080  

## Manual deploy (without GitHub Actions)

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=asia-southeast1
export IMAGE_PREFIX=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/ferry-flight

# API
docker build -t $IMAGE_PREFIX/api:local -f backend/FerryFlight.Api/Dockerfile backend/FerryFlight.Api
docker push $IMAGE_PREFIX/api:local

gcloud run deploy ferry-flight-api \
  --image $IMAGE_PREFIX/api:local \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --port 8080

# Web
export API_URL=$(gcloud run services describe ferry-flight-api --region $GCP_REGION --format 'value(status.url)')

docker build -t $IMAGE_PREFIX/web:local -f frontend/Dockerfile frontend
docker push $IMAGE_PREFIX/web:local

gcloud run deploy ferry-flight-web \
  --image $IMAGE_PREFIX/web:local \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "BACKEND_URL=$API_URL"
```

## Troubleshooting

**502 on `/api` from web service** — Check `BACKEND_URL` on the web service matches the API Cloud Run URL (including `https://`).

**CORS errors** — The web nginx proxy serves API on the same origin. If calling the API URL directly, ensure `Cors__Origins__0` on the API service includes your web URL.

**OpenRouteService** — Without `OPENROUTESERVICE_API_KEY`, the API falls back to haversine distance estimates.

**Cold starts** — First request after idle may take a few seconds. Set `--min-instances 1` on production if needed.
