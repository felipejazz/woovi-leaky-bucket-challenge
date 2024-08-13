import { gql } from 'apollo-server';

export const typeDefs = gql`
  type User {
    id: String!
    username: String!
    token: String!
  }

  type AuthPayload {
    token: String
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
    register(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    logout: String
    simulatePixQuery(key: String!, value: Float!): PixResponse
  }
`;
