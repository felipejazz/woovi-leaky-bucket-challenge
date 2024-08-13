/**
 * @generated SignedSource<<9f195bd4abb2c2243412b5d4fcf8b170>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationsPixSimulatorMutation$variables = {
  key: string;
  value: number;
};
export type mutationsPixSimulatorMutation$data = {
  readonly simulatePixQuery: {
    readonly errorMessage: string | null | undefined;
    readonly successMessage: string | null | undefined;
    readonly tokensLeft: number | null | undefined;
  } | null | undefined;
};
export type mutationsPixSimulatorMutation = {
  response: mutationsPixSimulatorMutation$data;
  variables: mutationsPixSimulatorMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "key"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "value"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "key",
        "variableName": "key"
      },
      {
        "kind": "Variable",
        "name": "value",
        "variableName": "value"
      }
    ],
    "concreteType": "PixResponse",
    "kind": "LinkedField",
    "name": "simulatePixQuery",
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
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "tokensLeft",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "mutationsPixSimulatorMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "mutationsPixSimulatorMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "824640accb95bcd562620b452c372119",
    "id": null,
    "metadata": {},
    "name": "mutationsPixSimulatorMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsPixSimulatorMutation(\n  $key: String!\n  $value: Float!\n) {\n  simulatePixQuery(key: $key, value: $value) {\n    successMessage\n    errorMessage\n    tokensLeft\n  }\n}\n"
  }
};
})();

(node as any).hash = "dbcf28e91201b59c73b3fed8d0c1a1f7";

export default node;
