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

export async function POST(_request: NextRequest) {
  try {
    const db = (admin as any).firestore();
    const slotsRef = db.collection('interview_slots');

    // Map ALL candidates to ONLY these 9 standardized names
    const candidateMappings: Array<{ patterns: string[], standardized: string }> = [
      { patterns: ['avula venkata kiran'], standardized: 'Avula Venkata Kiran' },
      { patterns: ['manoj kumar varma chintalapati'], standardized: 'Manoj Kumar Varma Chintalapati' },
      { patterns: ['phani kumar chetla'], standardized: 'Phani Kumar Chetla' },
      { patterns: ['padmini g'], standardized: 'Padmini G' },
      { patterns: ['chandra srikiran kongara', 'chandra srikiran'], standardized: 'Chandra Srikiran Kongara' },
      { patterns: ['satya', 'satyanarayanaraju'], standardized: 'Satyanarayanaraju' },
      { patterns: ['chitala swathi thanuja'], standardized: 'Chitala Swathi Thanuja' },
      { patterns: ['sivannarayana ch'], standardized: 'Sivannarayana CH' },
      { patterns: ['thamosh kalla'], standardized: 'Thamosh Kalla' },
    ];

    let updatedCount = 0;
    const snapshot = await slotsRef.get();

    const batch = db.batch();

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const currentName = data.candidateName;

      if (currentName) {
        const lowerCurrentName = currentName.toLowerCase().trim();

        // Find matching mapping
        for (const mapping of candidateMappings) {
          if (mapping.patterns.some(pattern => lowerCurrentName === pattern.toLowerCase())) {
            if (currentName !== mapping.standardized) {
              batch.update(doc.ref, { candidateName: mapping.standardized });
              updatedCount++;
            }
            break;
          }
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
