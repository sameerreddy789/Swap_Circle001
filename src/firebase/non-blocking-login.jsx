'use client';
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance) {
  signInAnonymously(authInstance).catch((error) => {
    console.error('Anonymous sign-in failed:', error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance, email, password) {
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error('Email sign-up failed:', error);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance, email, password) {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error('Email sign-in failed:', error);
  });
}
