# Installation

You can run the application locally either directly or using Docker (recommended for a consistent environment).

## Using Docker (recommended)

Build the Docker image using the Dockerfile at the root of the repository:

```bash
docker build --no-cache -t json-schema-studio -f ./Dockerfile .
```

Run the Docker container:

```bash
docker run -p 8080:80 json-schema-studio
```

To run the container in detached mode:

```bash
docker run -d -p 8080:80 json-schema-studio
```

Access the application in your browser at `http://localhost:8080`.

## Running directly (without Docker)

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open your browser at the URL shown in the terminal (`http://localhost:5173`).

::: warning
Running directly is fine for development, but using Docker ensures a consistent environment across machines.
:::