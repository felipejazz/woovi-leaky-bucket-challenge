/**
 * @generated SignedSource<<35d953220704113f1fdcc76c5d0a9960>>
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
    readonly errorMessage: string | null | undefined;
    readonly successMessage: string | null | undefined;
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
    "concreteType": "RegisterPayload",
    "kind": "LinkedField",
    "name": "register",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "successMessage",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "errorMessage",
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
    "cacheID": "bfdbed866073b3cbb11643229e119687",
    "id": null,
    "metadata": {},
    "name": "mutationsRegisterMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsRegisterMutation(\n  $username: String!\n  $password: String!\n) {\n  register(username: $username, password: $password) {\n    successMessage\n    errorMessage\n  }\n}\n"
  }
};
})();

(node as any).hash = "a3ff0528da87dd41a4ea4cf62e5b3439";

export default node;
