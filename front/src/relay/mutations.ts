import graphql from 'babel-plugin-relay/macro';

export const mutationsLoginMutation = graphql`
  mutation mutationsLoginMutation($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
    }
  }
`;

export const mutationsRegisterMutation = graphql`
  mutation mutationsRegisterMutation($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      successMessage
      errorMessage
    }
  }
`;

export const mutationsPixSimulatorMutation = graphql`
  mutation mutationsPixSimulatorMutation($key: String!, $value: Float!) {
    simulatePixQuery(key: $key, value: $value) {
     successMessage 
     errorMessage 
     tokensLeft
    }
  }
`;
