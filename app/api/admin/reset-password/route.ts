import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

let auth: any = null;

const initializeFirebase = () => {
  const adminAny = admin as any;

  try {
    // Check if already initialized
    if (adminAny.apps?.length > 0) {
      return adminAny.auth();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    adminAny.initializeApp({
      credential: adminAny.credential.cert(serviceAccount),
    });

    return adminAny.auth();
  } catch (error: any) {
    console.error('Firebase initialization error:', error.message);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase on first request
    if (!auth) {
      auth = initializeFirebase();
    }

    const { targetEmail, newPassword } = await request.json();

    if (!targetEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: email and password' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    try {
      // Get user by email
      const userRecord = await auth.getUserByEmail(targetEmail);

      // Update the user's password using UID
      await auth.updateUser(userRecord.uid, {
        password: newPassword,
      });

      return NextResponse.json(
        { message: '✅ Password reset successfully' },
        { status: 200 }
      );
    } catch (authError: any) {
      console.error('Auth error:', authError.code, authError.message);
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'Candidate not found with this email' },
          { status: 404 }
        );
      }
      throw authError;
    }
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
