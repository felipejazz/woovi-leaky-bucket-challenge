/**
 * @generated SignedSource<<c2d40270c906d4ffa7d21e165a5f0b0a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationsLoginMutation$variables = {
  password: string;
  username: string;
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
  "name": "username"
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
        "name": "username",
        "variableName": "username"
      }
    ],
    "concreteType": "AuthPayload",
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
    "cacheID": "1fa9be33a66e6ba16ee6f17c5de0efeb",
    "id": null,
    "metadata": {},
    "name": "mutationsLoginMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsLoginMutation(\n  $username: String!\n  $password: String!\n) {\n  login(username: $username, password: $password) {\n    token\n  }\n}\n"
  }
};
})();

(node as any).hash = "72173e166968889765aa2f54ff3325a6";

export default node;
