/**
 * @generated SignedSource<<22c34b85b5b7eb2718dcc49941d94e84>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationsLoginMutation$variables = {
  password: string;
  userName: string;
};
export type mutationsLoginMutation$data = {
  readonly login: {
    readonly token: string | null | undefined;
  } | null | undefined;
};
export type mutationsLoginMutation = {
  response: mutationsLoginMutation$data;
  variables: mutationsLoginMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "password"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "userName"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "password",
        "variableName": "password"
      },
      {
        "kind": "Variable",
        "name": "userName",
        "variableName": "userName"
      }
    ],
    "concreteType": "LoginPayload",
    "kind": "LinkedField",
    "name": "login",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "token",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "mutationsLoginMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "mutationsLoginMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "292328be3430277e65da2a694c21a3d3",
    "id": null,
    "metadata": {},
    "name": "mutationsLoginMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsLoginMutation(\n  $userName: String!\n  $password: String!\n) {\n  login(userName: $userName, password: $password) {\n    token\n  }\n}\n"
  }
};
})();

(node as any).hash = "a690353e9cec672ff576d8eb51fe689d";

export default node;
