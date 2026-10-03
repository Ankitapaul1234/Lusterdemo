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

