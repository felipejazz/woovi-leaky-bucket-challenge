/**
 * @generated SignedSource<<462c6117d50080bff4b6e2aebb650ccf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationsRegisterMutation$variables = {
  password: string;
  username: string;
};
export type mutationsRegisterMutation$data = {
  readonly register: {
    readonly token: string | null | undefined;
  } | null | undefined;
};
export type mutationsRegisterMutation = {
  response: mutationsRegisterMutation$data;
  variables: mutationsRegisterMutation$variables;
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
    "name": "register",
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
    "name": "mutationsRegisterMutation",
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
    "name": "mutationsRegisterMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "b58c3e04503609c39877c39de4a21ea8",
    "id": null,
    "metadata": {},
    "name": "mutationsRegisterMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsRegisterMutation(\n  $username: String!\n  $password: String!\n) {\n  register(username: $username, password: $password) {\n    token\n  }\n}\n"
  }
};
})();

(node as any).hash = "f4867a548f630bbef19f5919d42fe3ce";

export default node;
