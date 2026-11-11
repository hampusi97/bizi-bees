export async function verifyBearerToken(
  authHeader: string | null
): Promise<any | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;
  try {
    const { adminAuth } = await import('../lib/firebase-admin.ts');
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
