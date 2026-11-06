/**
 * WebAuthn Platform Biometrics & Fingerprint Scanner Helper
 * Integrates native Android Fingerprint / Touch ID / Face ID via navigator.credentials
 */

export interface BiometricCheckResult {
  isAvailable: boolean;
  platformAuthenticator: boolean;
  message: string;
}

/**
 * Checks if the user device has a platform biometric authenticator (Fingerprint/TouchID/FaceID)
 */
export async function checkBiometricsSupport(): Promise<BiometricCheckResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      isAvailable: false,
      platformAuthenticator: false,
      message: 'Web Authentication API is not supported in this browser.',
    };
  }

  try {
    const hasPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      isAvailable: true,
      platformAuthenticator: hasPlatform,
      message: hasPlatform
        ? 'Native mobile fingerprint / platform biometric sensor detected.'
        : 'Browser supports security keys, but native platform biometric was not detected.',
    };
  } catch (err) {
    return {
      isAvailable: false,
      platformAuthenticator: false,
      message: `Biometric check failed: ${(err as Error).message}`,
    };
  }
}

/**
 * Prompt phone native fingerprint scanner to verify user
 */
export async function authenticateWithNativeBiometrics(challengeString = 'arduino-case-unlock-nonce'): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn not supported.' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Request verification with platform authenticator (fingerprint)
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname || undefined,
      },
    });

    if (credential) {
      return { success: true };
    }
    return { success: false, error: 'No credential returned' };
  } catch (err: unknown) {
    const error = err as Error;
    // Don't treat cancellation as catastrophic, but report it cleanly
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Fingerprint scan was cancelled or not recognized.' };
    }
    return { success: false, error: error.message || 'Authentication error' };
  }
}

/**
 * Register phone biometric credential for this case
 */
export async function registerNativeBiometricCredential(userName: string): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn not supported' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Arduino Smart Case',
          id: window.location.hostname || undefined,
        },
        user: {
          id: userId,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Forces phone fingerprint / FaceID
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    if (credential && credential.id) {
      return { success: true, credentialId: credential.id };
    }
    return { success: false, error: 'Failed to create credential' };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || 'Registration failed' };
  }
}
