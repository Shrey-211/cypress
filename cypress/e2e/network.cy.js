// cypress/e2e/network.cy.js

describe('Advanced Network Interception and Stubbing', () => {

    const POSTS_API_URL = 'https://jsonplaceholder.typicode.com/posts';
    const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users';

    // Test Case 1: Mocking both posts and users successfully
    it('should display mocked posts on page load and mocked users on button click', () => {
        // 1. Intercept Posts API call (on page load)
        cy.intercept('GET', POSTS_API_URL, {
            fixture: 'mock_posts.json',
            statusCode: 200,
            delay: 100 // Simulate slight delay
        }).as('getMockedPosts');

        // 2. Intercept Users API call (on button click)
        cy.intercept('GET', USERS_API_URL, {
            fixture: 'mock_users.json',
            statusCode: 200,
            delay: 500 // Simulate longer delay for users
        }).as('getMockedUsers');

        // Visit the page - this triggers the posts API call immediately
        cy.visit('public/index.html');

        // --- Assertions for Posts Section (Initial Load) ---
        cy.get('#posts-status').should('contain', 'Loading posts...');
        cy.wait('@getMockedPosts').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body).to.have.length(5);
        });
        cy.get('#posts-status').should('not.contain', 'Loading posts...').and('not.have.class', 'error');
        cy.get('#posts-list li').should('have.length', 5);
        cy.get('#posts-list li').eq(0).should('contain', 'Mocked Post Title One');
        cy.get('#posts-list li').eq(4).should('contain', 'Mocked Post Title Five');

        // --- Assertions for Users Section (Button Click) ---
        cy.get('#users-list').should('be.empty'); // Should be empty initially
        cy.get('#users-status').should('not.have.class', 'error').and('not.contain', 'Loading');

        cy.get('#load-users-btn').click(); // Trigger the users API call

        cy.get('#users-status').should('contain', 'Loading users...').and('have.class', 'loading');
        cy.get('#load-users-btn').should('be.disabled'); // Button should be disabled during load

        cy.wait('@getMockedUsers').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body).to.have.length(3);
        });

        cy.get('#users-status').should('not.contain', 'Loading users...').and('not.have.class', 'error');
        cy.get('#load-users-btn').should('not.be.disabled'); // Button should be re-enabled
        cy.get('#users-list li').should('have.length', 3);
        cy.get('#users-list li').eq(0).should('contain', 'Mocked Leanne Graham');
        cy.get('#users-list li').eq(2).should('contain', 'Mocked Clementine Bauch');
    });

    // Test Case 2: Mocking a failed posts API call
    it('should display an error message when posts API call fails on page load', () => {
        cy.intercept('GET', POSTS_API_URL, {
            statusCode: 500,
            body: { message: 'Internal Server Error (Mocked Posts)' },
            delay: 100
        }).as('getPostsError');

        // Visit the page - this triggers the posts API call
        cy.visit('public/index.html');

        cy.get('#posts-status').should('contain', 'Loading posts...');
        cy.wait('@getPostsError').then((interception) => {
            expect(interception.response.statusCode).to.equal(500);
            expect(interception.response.body.message).to.equal('Internal Server Error (Mocked Posts)');
        });

        // Assert that the UI handles the error appropriately
        cy.get('#posts-status').should('contain', 'Failed to load posts: HTTP error! Status: 500');
        cy.get('#posts-status').should('have.class', 'error');
        cy.get('#posts-list').should('be.empty'); // No posts should be displayed
    });

    // Test Case 3: Mocking a failed users API call after button click
    it('should display an error message when users API call fails after button click', () => {
        // Allow posts to load normally (or mock them successfully if needed for other assertions)
        cy.intercept('GET', POSTS_API_URL, { fixture: 'mock_posts.json' }).as('getRealPosts');
        // Intercept users API call to fail
        cy.intercept('GET', USERS_API_URL, {
            statusCode: 404,
            body: { message: 'Users Not Found (Mocked)' },
            delay: 100
        }).as('getUsersError');

        cy.visit('public/index.html');

        // Wait for posts to load normally first
        cy.wait('@getRealPosts');
        cy.get('#posts-list li').should('have.length', 5); // Ensure posts loaded as expected

        // Trigger users load and assert error
        cy.get('#load-users-btn').click();
        cy.get('#users-status').should('contain', 'Loading users...');
        cy.get('#load-users-btn').should('be.disabled');

        cy.wait('@getUsersError').then((interception) => {
            expect(interception.response.statusCode).to.equal(404);
            expect(interception.response.body.message).to.equal('Users Not Found (Mocked)');
        });

        cy.get('#users-status').should('contain', 'Failed to load users: HTTP error! Status: 404');
        cy.get('#users-status').should('have.class', 'error');
        cy.get('#users-list').should('be.empty'); // No users should be displayed
        cy.get('#load-users-btn').should('not.be.disabled'); // Button should be re-enabled on error
    });

    // Test Case 4: Spying on both API calls without mocking
    it('should load real posts and users from the actual APIs (spying)', () => {
        // Intercept both requests as spies (no modification)
        cy.intercept('GET', POSTS_API_URL).as('realPosts');
        cy.intercept('GET', USERS_API_URL).as('realUsers');

        cy.visit('public/index.html');

        // Wait for real posts to load
        cy.wait('@realPosts').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body).to.have.length.greaterThan(0); // Real API has more
        });
        cy.get('#posts-list li').should('have.length', 5); // Our script limits to 5
        cy.get('#posts-list li').eq(0).should('not.contain', 'Mocked Post Title'); // Should be real data

        // Trigger real users load
        cy.get('#load-users-btn').click();
        cy.wait('@realUsers').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body).to.have.length.greaterThan(0); // Real API has more
        });
        cy.get('#users-list li').should('have.length', 3); // Our script limits to 3
        cy.get('#users-list li').eq(0).should('not.contain', 'Mocked Leanne Graham'); // Should be real data
    });

    // Test Case 5: Delaying requests to test loading states
    it('should show loading indicators during delayed API calls', () => {
        cy.intercept('GET', POSTS_API_URL, {
            fixture: 'mock_posts.json',
            delay: 2000 // Very long delay for posts
        }).as('delayedPosts');

        cy.intercept('GET', USERS_API_URL, {
            fixture: 'mock_users.json',
            delay: 3000 // Even longer delay for users
        }).as('delayedUsers');

        cy.visit('public/index.html');

        // Check posts loading indicator immediately
        cy.get('#posts-status').should('contain', 'Loading posts...');
        cy.get('#posts-status').should('have.class', 'loading');

        // Wait for posts to finish loading
        cy.wait('@delayedPosts');
        cy.get('#posts-status').should('not.contain', 'Loading posts...');
        cy.get('#posts-status').should('not.have.class', 'loading');
        cy.get('#posts-list li').should('have.length', 5);

        // Click button for users and check loading indicator
        cy.get('#load-users-btn').click();
        cy.get('#users-status').should('contain', 'Loading users...');
        cy.get('#users-status').should('have.class', 'loading');
        cy.get('#load-users-btn').should('be.disabled');

        // Wait for users to finish loading
        cy.wait('@delayedUsers');
        cy.get('#users-status').should('not.contain', 'Loading users...');
        cy.get('#users-status').should('not.have.class', 'loading');
        cy.get('#load-users-btn').should('not.be.disabled');
        cy.get('#users-list li').should('have.length', 3);
    });
});