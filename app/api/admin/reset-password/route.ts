import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if ((admin as any).apps?.length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  (admin as any).initializeApp({
    credential: (admin as any).credential.cert(serviceAccount),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { adminUID, targetEmail, newPassword } = await request.json();

    if (!adminUID || !targetEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin is actually an admin
    const adminUser = await (admin as any).auth().getUser(adminUID);

    // Check if user has admin custom claim
    if (!adminUser.customClaims?.admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can reset passwords' },
        { status: 403 }
      );
    }

    // Update the target user's password
    await (admin as any).auth().updateUser(targetEmail, {
      password: newPassword,
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
