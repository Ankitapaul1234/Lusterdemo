# Lustre Nail Studio — Multi-page Frontend

Pages:
- index.html — Home
- services.html — Services
- gallery.html — Gallery
- booking.html — Booking
- about.html — About
- contact.html — Contact

Shared:
- css/style.css
- js/script.js
- assets/images/ 

Run by opening `index.html` or using VS Code Live Server.
Dark mode works across all pages and is saved with localStorage.







## Docker Compose

Lustre Nail Studio can also be deployed locally using Docker and [Docker Compose](https://docs.docker.com/compose/).

To run the application, use:

```bash
docker compose up -d
```

Docker Compose will build and start both the frontend and backend containers.

Then access your website at:

**Frontend:** http://localhost:8080

**Backend API:** http://localhost:5000

The frontend runs using Nginx, while the backend is powered by Node.js and Express. Docker Compose connects both services through an internal network.

### Docker Services

| Service  | Technology        | Port |
| -------- | ----------------- | ---- |
| Frontend | Nginx             | 8080 |
| Backend  | Node.js + Express | 5000 |

The frontend communicates with the backend through the `/api` routes.

### Useful Docker Commands

**Build the Docker images:**

```bash
docker compose build
```

**Start the containers:**

```bash
docker compose up -d
```

**View running containers:**

```bash
docker compose ps
```

**View application logs:**

```bash
docker compose logs
```

**Stop the containers:**

```bash
docker compose down
```

**Rebuild and restart the application:**

```bash
docker compose up -d --build
```

### Environment Variables

The backend uses environment variables stored in `backend/.env` for configuration, including external service credentials.

Make sure the required environment variables are configured before starting the backend.

**Note:** The `.env` file contains sensitive information and should never be committed to GitHub.

### Reset Docker Environment

To stop and rebuild the application from scratch, run:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d --force-recreate
```

**Note:** This removes the existing containers and recreates them. It does not delete your source code or external Supabase data.

Your existing frontend and backend deployments remain unaffected by this local Docker setup.







## 🐳 Docker Hub Images

The pre-built Docker images of Lustre Nail Studio are available on Docker Hub. You can pull and run them without building the images locally.

### Docker Hub Repositories

* **Backend:** [ankitapaul1234/lustre-backend](https://hub.docker.com/r/ankitapaul1234/lustre-backend)
* **Frontend:** [ankitapaul1234/lustre-frontend](https://hub.docker.com/r/ankitapaul1234/lustre-frontend)

### Step 1: Pull Docker Images

```bash
docker pull ankitapaul1234/lustre-backend:latest
docker pull ankitapaul1234/lustre-frontend:latest
```

### Step 2: Run the Application

```bash
docker compose up -d
```

### Step 3: Access the Application

* Frontend: http://localhost:8080
* Backend: http://localhost:5000

### Push Docker Images (For Developers)

To publish updated images to Docker Hub:

```bash
docker push ankitapaul1234/lustre-backend:tagname
docker push ankitapaul1234/lustre-frontend:tagname
```

Replace `tagname` with the desired image tag, such as `latest` or `v1.0`.

### Stop the Application

```bash
docker compose down
```
