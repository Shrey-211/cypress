# Cypress Network Interception & Stubbing Project

This project demonstrates advanced Cypress concepts, specifically focusing on **Network Request Interception and Stubbing/Mocking**. It uses a local HTML file that makes API calls to [JSONPlaceholder](https://jsonplaceholder.typicode.com/) (a free fake online REST API) to showcase how Cypress can control and manipulate network responses for robust testing.

## Table of Contents

  * [Features](https://www.google.com/search?q=%23features)
  * [Project Structure](https://www.google.com/search?q=%23project-structure)
  * [Prerequisites](https://www.google.com/search?q=%23prerequisites)
  * [Setup Instructions](https://www.google.com/search?q=%23setup-instructions)
  * [Running Tests](https://www.google.com/search?q=%23running-tests)
  * [Understanding the Concepts](https://www.google.com/search?q=%23understanding-the-concepts)
      * [Cypress Interception (`cy.intercept()`)](https://www.google.com/search?q=%23cypress-interception-cyintercept)
      * [Stubbing/Mocking](https://www.google.com/search?q=%23stubbingmocking)
      * [Spying](https://www.google.com/search?q=%23spying)
      * [Why Intercept?](https://www.google.com/search?q=%23why-intercept)
  * [Contributing](https://www.google.com/search?q=%23contributing)
  * [License](https://www.google.com/search?q=%23license)

## Features

  * **Network Request Interception:** Learn how to intercept outgoing HTTP requests made by your application.
  * **Response Stubbing/Mocking:** Replace actual API responses with predefined data (fixtures) to control test scenarios.
  * **Error Simulation:** Simulate API failures (e.g., 500 Internal Server Error, 404 Not Found) to test error handling in the UI.
  * **Loading State Testing:** Verify UI behavior during network latency by adding artificial delays to responses.
  * **User Interaction Triggered Requests:** Test API calls initiated by user actions (e.g., button clicks).
  * **Spying on Requests:** Observe real API traffic without altering its response.
  * **Complex UI Interaction:** The demo website features multiple sections, conditional rendering, and user-triggered fetches.

## Project Structure

```
cypress-network-project/
├── public/
│   └── index.html               # The demo web page that makes API calls
├── cypress/
│   ├── e2e/
│   │   └── network.cy.js        # Our Cypress test file with interception logic
│   ├── fixtures/
│   │   ├── mock_posts.json      # Mocked data for /posts API
│   │   └── mock_users.json      # Mocked data for /users API
│   └── support/
│       ├── commands.js
│       └── e2e.js
├── cypress.config.js            # Cypress configuration
├── package.json                 # Node.js project dependencies
└── package-lock.json
```

## Prerequisites

Before you begin, ensure you have the following installed:

  * **Node.js & npm:** Download and install from [nodejs.org](https://nodejs.org/).

  * **Cypress:** Will be installed as part of the setup steps.

  * **`http-server` (global):** A simple command-line HTTP server to serve our `index.html`.

    ```bash
    npm install -g http-server
    ```

## Setup Instructions

1.  **Clone or Download the Project:**
    (If you are starting from scratch, you would create a new directory and initialize npm as described in the previous conversation. If you downloaded the files, navigate into the project directory.)

    ```bash
    git clone <repository-url> # If using a repo
    cd cypress-network-project
    ```

2.  **Install Dependencies:**
    This will install Cypress and other necessary Node.js packages.

    ```bash
    npm install
    ```

3.  **Start the Local Web Server:**
    Navigate to the project's root directory in your terminal and serve the `public` folder. This will host `index.html` at `http://localhost:3000`.

    ```bash
    http-server public -p 3000
    ```

    Keep this terminal window open and running while you run your Cypress tests.

## Running Tests

There are two primary ways to run Cypress tests:

1.  **Interactive Mode (for development):**
    This opens the Cypress Test Runner UI, allowing you to see the browser and debug tests in real-time. It **watches for file changes** by default.

    ```bash
    npx cypress open
    ```

      * Select "E2E Testing".
      * Click on `network.cy.js` to run the tests.

2.  **Run Mode (for CI/headless execution):**
    This runs all tests once and then exits. It **does NOT watch for file changes** after starting, making it ideal for CI pipelines.

      * **Headless (default):** Runs tests in the background without a visible browser.

        ```bash
        npx cypress run
        ```

      * **Headed (with visible browser):** Runs tests in a visible browser but still runs once and exits.

        ```bash
        npx cypress run --headed
        ```

## Understanding the Concepts

### Cypress Interception (`cy.intercept()`)

`cy.intercept()` is Cypress's powerful command for controlling network requests. It allows you to:

  * **Monitor:** See all requests made by your application.
  * **Modify:** Change request headers, body, or response.
  * **Stub/Mock:** Provide a fake response instead of letting the request go to the actual server.

**Basic Syntax:**
`cy.intercept(method, url, [response])`

  * `method`: HTTP method (e.g., `'GET'`, `'POST'`).
  * `url`: The URL or URL pattern to match (can be string, glob, or regex).
  * `response` (optional): The data to send back. This can be:
      * An object `{ statusCode: 200, body: { data: '...' } }`
      * A fixture `{ fixture: 'my_data.json' }`
      * A function for dynamic responses.

**Aliasing:** `cy.intercept(...).as('myAlias')`
Giving an alias allows you to `cy.wait('@myAlias')` for the intercepted request to complete, which is crucial for test synchronization and making assertions on the request/response details.

### Stubbing/Mocking

In this project, we primarily use `cy.intercept()` for **stubbing**.

  * **Stubbing:** Replacing a real API response with predefined data (from `cypress/fixtures/`). This ensures your tests are fast, consistent, and independent of external API availability or specific data.
  * **Mocking:** A broader term often implying both stubbing and verifying that the API call was made with expected parameters. `cy.wait('@alias')` helps with this by providing the `interception` object for assertions.

**Example from `network.cy.js`:**

```javascript
cy.intercept('GET', 'https://jsonplaceholder.typicode.com/posts', {
    fixture: 'mock_posts.json',
    statusCode: 200,
    delay: 100
}).as('getMockedPosts');
```

This tells Cypress: "When the application tries to `GET` posts, don't go to the real API. Instead, return the data from `mock_posts.json` with a 200 status code and a 100ms delay."

### Spying

When `cy.intercept()` is used *without* providing a `response` object, it acts as a **spy**. The request still goes to the real backend, but Cypress records its details, allowing you to `cy.wait()` for it and inspect the actual request and response.

**Example from `network.cy.js`:**

```javascript
cy.intercept('GET', 'https://jsonplaceholder.typicode.com/posts').as('realPosts');
// The request will go to the real API, but Cypress will record it.
```

### Why Intercept?

  * **Test Speed:** Avoid slow network requests.
  * **Reliability:** Eliminate flakiness due to network issues or backend changes.
  * **Isolation:** Test your frontend in isolation from the backend.
  * **Edge Case Testing:** Easily simulate success, error, empty, or delayed responses.
  * **Development Workflow:** Develop and test UI features even when backend APIs are not yet ready.

## Contributing

Feel free to open issues or pull requests to improve this demonstration project\!

## License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
