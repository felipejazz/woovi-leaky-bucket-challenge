import {
  Environment,
  Network,
  RecordSource,
  Store,
  FetchFunction,
} from "relay-runtime";

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://felipejazz.com:3000/graphql";
const LOGIN_ENDPOINT = process.env.REACT_APP_LOGIN_ENDPOINT || "http://felipejazz.com:3000/auth/login";
const REGISTER_ENDPOINT = process.env.REACT_APP_REGISTER_ENDPOINT || "http://felipejazz.com:3000/auth/register";


function getAuthToken() {
  
  return localStorage.getItem("authToken");
}

const fetchFn: FetchFunction = async (request, variables) => {
  let url = GRAPHQL_ENDPOINT;

  if (request.name === "mutationsLoginMutation") {
    url = LOGIN_ENDPOINT;
  } else if (request.name === "mutationsRegisterMutation") {
    url = REGISTER_ENDPOINT;
  }

  const token = getAuthToken();

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Accept:
        "application/graphql-response+json; charset=utf-8, application/json; charset=utf-8",
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query: request.text, 
      variables,
    }),
  });

  return await resp.json();
};

function createRelayEnvironment() {
  return new Environment({
    network: Network.create(fetchFn),
    store: new Store(new RecordSource()),
  });
}

export const RelayEnvironment = createRelayEnvironment();
