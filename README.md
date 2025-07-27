# Animodo

<img width="1476" height="855" alt="image" src="https://github.com/user-attachments/assets/8dc355b5-bd2a-47f0-9303-d533611a556d" />

Animodo is a student dashboard that provides a centralized view of your Canvas courses, assignments, and announcements. It is designed to be a fast and user-friendly alternative to the default Canvas dashboard.

## Features

- **Course Overview:** View all your favorite courses from Canvas.
- **Assignment Tracking:** See all your assignments, filter them by status (unsubmitted, submitted, graded), and view due dates.
- **Announcements:** Stay up-to-date with the latest announcements from all your courses.
- **Responsive Design:** The application is designed to work on both desktop and mobile devices.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for server-rendered applications.
- [React](https://reactjs.org/) - JavaScript library for building user interfaces.
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript.
- [CSS Modules](https://github.com/css-modules/css-modules) - For locally scoped CSS.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/animodo.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd animodo
    ```

3.  Install the dependencies:

    ```bash
    npm install
    ```

## Configuration

To use the application, you need to have a Canvas API token. You can generate one by following these steps:

1.  Log in to your Canvas account.
2.  Go to **Account** > **Settings**.
3.  Scroll down to the **Approved Integrations** section and click on **+ New Access Token**.
4.  Give the token a purpose (e.g., "Animodo") and click **Generate Token**.
5.  Copy the generated token.

The application will prompt you for your Canvas URL and API token when you first run it.

## Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

To create a production build, use the following command:

```bash
npm run build
```

To start the production server, use the following command:

```bash
npm run start
```

## Project Structure

The project is organized as follows:

-   `app/`: Contains the main application code, including pages and API routes.
-   `components/`: Contains reusable React components.
-   `public/`: Contains static assets such as images and fonts.
-   `styles/`: Contains global CSS styles.

## How It Works

Animodo is built on a client-server architecture where the Next.js backend acts as a secure proxy to the Canvas LMS API. This design ensures that your Canvas API token is never exposed to the client-side, enhancing security.

1.  **Client-Side:** The frontend is a single-page application (SPA) built with React and TypeScript. When you interact with the dashboard, the client makes requests to the backend API routes.
2.  **Backend (Proxy):** The API routes in `app/api/` receive these requests. They extract the necessary information, attach your securely stored Canvas API token to the headers, and forward the request to the official Canvas API.
3.  **Canvas API:** The Canvas API processes the request and returns the data (e.g., assignments, announcements).
4.  **Response:** The backend receives the response from Canvas and relays it back to the client, which then updates the UI.

## How to Use the Backend

The backend API provides several endpoints to fetch data from Canvas. All endpoints require the following headers:

-   `Authorization`: `Bearer <YOUR_CANVAS_API_TOKEN>`
-   `Canvas-URL`: The base URL of your Canvas instance (e.g., `https://canvas.instructure.com`)

### Endpoints

-   **`GET /api/user`**
    -   Fetches the current user's profile information.
-   **`GET /api/courses`**
    -   Fetches the list of the user's favorite courses.
-   **`GET /api/assignments`**
    -   Fetches assignments for a specific course.
    -   **Query Parameter:** `courseId` (required) - The ID of the course.
    -   **Example:** `GET /api/assignments?courseId=12345`
-   **`GET /api/announcements`**
    -   Fetches announcements for one or more courses.
    -   **Query Parameter:** `courseIds` (required) - Can be provided multiple times for multiple courses.
    -   **Example:** `GET /api/announcements?courseIds=12345&courseIds=67890`

## Contributing

Contributions are welcome! Please follow these standard guidelines when contributing to the project.

### Pull Requests

1.  Fork the repository and create your branch from `main`.
2.  Make your changes and ensure that the code lints and builds successfully.
3.  Create a pull request with a clear title and description of your changes.
4.  Make sure to include the following in your pull request:
    -   A clear description of the problem and solution.
    -   Screenshots or GIFs of the changes, if applicable.
    -   Any related issue numbers.

### Raising Issues

If you find a bug or have a feature request, please raise an issue on the GitHub repository. When creating an issue, please provide the following:

-   A clear and descriptive title.
-   A detailed description of the issue or feature request.
-   Steps to reproduce the issue, if applicable.
-   Screenshots or GIFs to help illustrate the issue.
