import graphql from 'babel-plugin-relay/macro';

export const mutationsLoginMutation = graphql`
  mutation mutationsLoginMutation($userName: String!, $password: String!) {
    login(userName: $userName, password: $password) {
      token
    }
  }
`;

export const mutationsRegisterMutation = graphql`
  mutation mutationsRegisterMutation($userName: String!, $password: String!) {
    register(userName: $userName, password: $password) {
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
     newUserToken
    }
  }
`;
