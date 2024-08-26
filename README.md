### Woovi Leaky Bucket Challenge

This project is a full-stack application that utilizes Docker and Docker Compose for easy setup and deployment. The frontend is built with React and Relay, and the backend is powered by Node.js with a GraphQL API.

#### Dependencies

Ensure you have the following installed on your machine:

- **Docker**: 27.1.1
- **Docker Compose**: 2.29.1
- **Node.js**: 18.18.0
- **npm**: 9.8.1

## Setup and Running the Project

To build and run the project, follow these steps:

1. **Access the Application**:

    - **Production**: Available at [felipejazz.com:3001](http://felipejazz.com:3001).

2. **Running Locally**:

    - **Full Project**: To run the full project locally, execute:
      ```bash
      docker-compose -f docker-compose.dev.yml up --build
      ```

    - **Development with Mongo and Redis Only**: To run only Mongo and Redis for local development, execute:
      ```bash
      docker-compose -f docker-compose.db.yml up --build
      ```
      After running the above command, you can set up the frontend and backend projects individually and run them separately.

3. **Postman Collection**: 
   
    The backend Postman Collection is located in `woovi-challenge.postman_collection.json`.

5. **Challenge Description**:
    
    To see the requirements of the bucket leak system, you can read the challenge description at the link below:
    
    [Woovi Leaky Bucket Challenge Description](https://github.com/woovibr/jobs/blob/main/challenges/woovi-leaky-bucket-challenge.md)

