import type {
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
} from 'react-native-passkey';

/** Maps native registration result to WebAuthn JSON expected by the API */
export function mapCreateResultToApi(r: PasskeyCreateResult): Record<string, unknown> {
  return {
    id: r.id,
    rawId: r.rawId,
    type: 'public-key',
    response: {
      clientDataJSON: r.response.clientDataJSON,
      attestationObject: r.response.attestationObject,
    },
    clientExtensionResults: r.clientExtensionResults ?? {},
  };
}

/** Maps native assertion result to WebAuthn JSON expected by the API */
export function mapGetResultToApi(r: PasskeyGetResult): Record<string, unknown> {
  return {
    id: r.id,
    rawId: r.rawId ?? r.id,
    type: 'public-key',
    response: {
      authenticatorData: r.response.authenticatorData,
      clientDataJSON: r.response.clientDataJSON,
      signature: r.response.signature,
      ...(r.response.userHandle
        ? { userHandle: r.response.userHandle }
        : {}),
    },
    clientExtensionResults: r.clientExtensionResults ?? {},
  };
}

/** Server JSON → react-native-passkey assertion request shape */
export function toPasskeyGetRequest(
  json: Record<string, unknown>,
): PasskeyGetRequest {
  return json as unknown as PasskeyGetRequest;
}

/** Server JSON → react-native-passkey creation request shape */
export function toPasskeyCreateRequest(
  json: Record<string, unknown>,
): import('react-native-passkey').PasskeyCreateRequest {
  return json as unknown as import('react-native-passkey').PasskeyCreateRequest;
}
