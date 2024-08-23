/**
 * @generated SignedSource<<f2689fb6a320eb2285d37b899ce9cd5b>>
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
    readonly newUserToken: string | null | undefined;
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
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "newUserToken",
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
    "cacheID": "54a6f19e338c1806085317197cdcb8e9",
    "id": null,
    "metadata": {},
    "name": "mutationsPixSimulatorMutation",
    "operationKind": "mutation",
    "text": "mutation mutationsPixSimulatorMutation(\n  $key: String!\n  $value: Float!\n) {\n  simulatePixQuery(key: $key, value: $value) {\n    successMessage\n    errorMessage\n    tokensLeft\n    newUserToken\n  }\n}\n"
  }
};
})();

(node as any).hash = "12fd58320bdbeae35f74030b00a6f625";

export default node;
