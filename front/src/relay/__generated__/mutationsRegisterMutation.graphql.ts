/**
 * @generated SignedSource<<d49fd62b22a0081517a5c497d46f2bce>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationsRegisterMutation$variables = {
  password: string;
  userName: string;
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
    "cacheID": "b49b601ea78560d4e41c9e1d3c360db4",
    "id": null,
    "metadata": {},
    "name": "mutationsRegisterMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsRegisterMutation(\n  $userName: String!\n  $password: String!\n) {\n  register(userName: $userName, password: $password) {\n    successMessage\n    errorMessage\n  }\n}\n"
  }
};
})();

(node as any).hash = "ac72c7abc32bfc3d5d0ec5cc5c975122";

export default node;
