import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateCredentialBody,
  CredentialDto,
  PushSyncEventBody,
  RegisteredDeviceDto,
  RegisterDeviceBody,
  SyncPullApiResponse,
  UserProfile,
} from '@passtore/core';
import { getApiBaseUrl } from '@/config/env';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { USE_LOCAL_VAULT } from '@/config/featureFlags';
import { getVaultRepository } from '@/services/vault/vaultRepository';
import {
  enqueueVaultDelete,
  enqueueVaultUpsert,
} from '@/services/sync/outboxEnqueue';
import { autofillService } from '@/services/autofill/autofillService';
export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

/** Subset of backend temporary_auth_sessions for primary-device UI. */
export interface TemporaryAuthSessionDto {
  id: string;
  userId: string | null;
  approvedByDeviceId: string | null;
  requestingDeviceName: string;
  contextType: string;
  allowedOrigin: string;
  permissions: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  status: string;
  deliveryCount: number;
}

export const passtoreApi = createApi({
  reducerPath: 'passtoreApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: async (headers) => {
      const token = await SecureStorage.getJwt();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Credential', 'Profile', 'TemporaryAuthSession'],
  endpoints: (builder) => ({
    login: builder.mutation<
      AuthResponse,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<
      AuthResponse,
      { email: string; username: string; password: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<{ ok: boolean; message: string }, { email: string }>(
      {
        query: (body) => ({
          url: '/auth/forgot-password',
          method: 'POST',
          body,
        }),
      },
    ),
    profile: builder.query<UserProfile, void>({
      query: () => '/users/me',
      providesTags: ['Profile'],
    }),
    credentials: builder.query<CredentialDto[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        if (USE_LOCAL_VAULT) {
          try {
            const data = await getVaultRepository().listAll();
            return { data };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return { error: { status: 'CUSTOM_ERROR', error: message } };
          }
        }
        const result = await fetchWithBQ({ url: '/credentials', method: 'GET' });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CredentialDto[] };
      },
      providesTags: (res) =>
        res
          ? [
              ...res.map((c) => ({ type: 'Credential' as const, id: c.id })),
              { type: 'Credential', id: 'LIST' },
            ]
          : [{ type: 'Credential', id: 'LIST' }],
    }),
    credential: builder.query<CredentialDto, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        if (!id) {
          return { error: { status: 400, data: 'Missing credential id' } };
        }
        if (USE_LOCAL_VAULT) {
          try {
            const row = await getVaultRepository().getById(id);
            if (!row) {
              return { error: { status: 404, data: 'Not found' } };
            }
            return { data: row };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return { error: { status: 'CUSTOM_ERROR', error: message } };
          }
        }
        const result = await fetchWithBQ({
          url: `/credentials/${id}`,
          method: 'GET',
        });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CredentialDto };
      },
      providesTags: (_r, _e, id) => [{ type: 'Credential', id }],
    }),
    createCredential: builder.mutation<CredentialDto, CreateCredentialBody>({
      async queryFn(body, _api, _extraOptions, fetchWithBQ) {
        if (USE_LOCAL_VAULT) {
          try {
            const data = await getVaultRepository().create(body);
            await enqueueVaultUpsert(data, { baseRowVersion: 0 });
            void autofillService.registerCredential(data);
            return { data };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return { error: { status: 'CUSTOM_ERROR', error: message } };
          }
        }
        const result = await fetchWithBQ({
          url: '/credentials',
          method: 'POST',
          body,
        });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CredentialDto };
      },
      invalidatesTags: [{ type: 'Credential', id: 'LIST' }],
    }),
    updateCredential: builder.mutation<
      CredentialDto,
      { id: string; patch: Partial<CreateCredentialBody> }
    >({
      async queryFn({ id, patch }, _api, _extraOptions, fetchWithBQ) {
        if (USE_LOCAL_VAULT) {
          try {
            const before = await getVaultRepository().getById(id);
            const baseRv = before?.version ?? 1;
            const data = await getVaultRepository().update(id, patch);
            await enqueueVaultUpsert(data, { baseRowVersion: baseRv });
            void autofillService.registerCredential(data);
            return { data };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return { error: { status: 'CUSTOM_ERROR', error: message } };
          }
        }
        const result = await fetchWithBQ({
          url: `/credentials/${id}`,
          method: 'PATCH',
          body: patch,
        });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CredentialDto };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Credential', id },
        { type: 'Credential', id: 'LIST' },
      ],
    }),
    deleteCredential: builder.mutation<{ ok: boolean }, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        if (USE_LOCAL_VAULT) {
          try {
            const before = await getVaultRepository().getById(id);
            const baseRv = before?.version ?? 1;
            const result = await getVaultRepository().delete(id);
            await enqueueVaultDelete(id, { baseRowVersion: baseRv });
            void autofillService.unregisterCredential(id);
            return { data: result };
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return { error: { status: 'CUSTOM_ERROR', error: message } };
          }
        }
        const result = await fetchWithBQ({
          url: `/credentials/${id}`,
          method: 'DELETE',
        });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as { ok: boolean } };
      },
      invalidatesTags: (_r, _e, id) => [
        { type: 'Credential', id },
        { type: 'Credential', id: 'LIST' },
      ],
    }),

    passkeyLoginOptions: builder.mutation<
      Record<string, unknown>,
      { username: string }
    >({
      query: (body) => ({
        url: '/auth/passkey/login/options',
        method: 'POST',
        body,
      }),
    }),
    passkeyLoginVerify: builder.mutation<
      AuthResponse,
      { username: string; response: Record<string, unknown> }
    >({
      query: (body) => ({
        url: '/auth/passkey/login/verify',
        method: 'POST',
        body,
      }),
    }),
    passkeyRegisterOptions: builder.mutation<Record<string, unknown>, void>({
      query: () => ({
        url: '/auth/passkey/register/options',
        method: 'POST',
      }),
    }),
    passkeyRegisterVerify: builder.mutation<
      { ok: boolean },
      { response: Record<string, unknown> }
    >({
      query: (body) => ({
        url: '/auth/passkey/register/verify',
        method: 'POST',
        body,
      }),
    }),

    registerDevice: builder.mutation<RegisteredDeviceDto, RegisterDeviceBody>({
      query: (body) => ({
        url: '/devices/register',
        method: 'POST',
        body,
      }),
    }),
    registeredDevices: builder.query<RegisteredDeviceDto[], void>({
      query: () => '/devices',
    }),
    syncEventsPull: builder.query<
      SyncPullApiResponse,
      { cursor?: string; limit?: number } | void
    >({
      query: (arg) => ({
        url: '/sync/events',
        params: {
          ...(arg && arg.cursor ? { cursor: arg.cursor } : {}),
          ...(arg && arg.limit != null ? { limit: arg.limit } : {}),
        },
      }),
    }),
    syncEventsPush: builder.mutation<
      { id: string; createdAt: string },
      PushSyncEventBody
    >({
      query: (body) => ({
        url: '/sync/events',
        method: 'POST',
        body,
      }),
    }),

    /** Primary device: approve browser/extension pairing after biometric. */
    approveTemporaryPairing: builder.mutation<
      { sessionId: string; temporaryAccessToken: string; expiresAt: string },
      {
        sessionId: string;
        pairingCode: string;
        devicePublicId: string;
        biometricAssertion?: string;
      }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/temporary-auth/pairing/${sessionId}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TemporaryAuthSession', id: 'LIST' }],
    }),
    /** Primary device: approve a gated credential delivery (copy/reveal). */
    approveTemporaryDelivery: builder.mutation<{ ok: boolean }, { requestId: string }>({
      query: ({ requestId }) => ({
        url: `/temporary-auth/deliveries/${requestId}/approve`,
        method: 'POST',
      }),
    }),
    temporaryAuthSessions: builder.query<TemporaryAuthSessionDto[], void>({
      query: () => '/temporary-auth/sessions',
      providesTags: [{ type: 'TemporaryAuthSession', id: 'LIST' }],
    }),
    revokeTemporarySession: builder.mutation<{ ok: boolean }, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: `/temporary-auth/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TemporaryAuthSession', id: 'LIST' }],
    }),
    revokeAllTemporarySessions: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: '/temporary-auth/sessions/revoke-all',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'TemporaryAuthSession', id: 'LIST' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useProfileQuery,
  useLazyProfileQuery,
  useCredentialsQuery,
  useCredentialQuery,
  useCreateCredentialMutation,
  useUpdateCredentialMutation,
  useDeleteCredentialMutation,
  usePasskeyLoginOptionsMutation,
  usePasskeyLoginVerifyMutation,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
  useRegisterDeviceMutation,
  useRegisteredDevicesQuery,
  useSyncEventsPullQuery,
  useLazySyncEventsPullQuery,
  useSyncEventsPushMutation,
  useApproveTemporaryPairingMutation,
  useApproveTemporaryDeliveryMutation,
  useTemporaryAuthSessionsQuery,
  useLazyTemporaryAuthSessionsQuery,
  useRevokeTemporarySessionMutation,
  useRevokeAllTemporarySessionsMutation,
} = passtoreApi;
