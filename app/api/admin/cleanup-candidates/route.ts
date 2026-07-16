import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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
    const db = (admin as any).firestore();
    const slotsRef = db.collection('interview_slots');

    // Define candidate name mappings for cleanup
    const candidateMappings: Record<string, string> = {
      'satya': 'Satyanarayanaraju',
      'Satya': 'Satyanarayanaraju',
      'SATYA': 'Satyanarayanaraju',
      'chandra srikiran': 'Chandra Srikiran',
      'Chandra srikiran': 'Chandra Srikiran',
      'CHANDRA SRIKIRAN': 'Chandra Srikiran',
      'candra srikiran kongara': 'Chandra Srikiran Kongara',
      'PADMINI G': 'Padmini G',
      'padmini g': 'Padmini G',
      'Padmini g': 'Padmini G',
    };

    let updatedCount = 0;
    const snapshot = await slotsRef.get();

    const batch = db.batch();

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const currentName = data.candidateName;

      // Check if this candidate name needs to be standardized
      if (currentName && candidateMappings[currentName]) {
        const standardizedName = candidateMappings[currentName];
        if (currentName !== standardizedName) {
          batch.update(doc.ref, { candidateName: standardizedName });
          updatedCount++;
        }
      }
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully standardized ${updatedCount} candidate records`,
      updated: updatedCount,
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup candidates' },
      { status: 500 }
    );
  }
}
