'use client';
import { getAuth } from 'firebase/auth';

function buildAuthObject(currentUser) {
  if (!currentUser) return null;
  return {
    uid: currentUser.uid,
    token: {
      name: currentUser.displayName,
      email: currentUser.email,
      email_verified: currentUser.emailVerified,
      phone_number: currentUser.phoneNumber,
      sub: currentUser.uid,
      firebase: {
        identities: currentUser.providerData.reduce((acc, p) => {
          if (p.providerId) acc[p.providerId] = [p.uid];
          return acc;
        }, {}),
        sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
        tenant: currentUser.tenantId,
      },
    },
  };
}

function buildRequestObject(context) {
  let authObject = null;
  try {
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) authObject = buildAuthObject(currentUser);
  } catch { /* Firebase not initialized yet */ }

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

function buildErrorMessage(requestObject) {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(requestObject, null, 2)}`;
}

export class FirestorePermissionError extends Error {
  constructor(context) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
