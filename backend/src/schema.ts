  import { gql } from 'apollo-server';

  export const typeDefs = gql`
    type User {
      id: String!
      username: String!
      token: String!
    }

    type LoginPayload {
      message: String
      token: String
    }

    type RegisterPayload {
      successMessage: String
      errorMessage: String
    }

    type PixResponse {
      successMessage: String
      tokensLeft: Int
      errorMessage: String 
    }

    type Query {
      user(id: String!): User
    }
    type Mutation {
      register(username: String!, password: String!): RegisterPayload
      login(username: String!, password: String!): LoginPayload
      logout: String
      simulatePixQuery(key: String!, value: Float!): PixResponse
    }
  `;
