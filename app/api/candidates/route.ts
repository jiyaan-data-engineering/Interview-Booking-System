import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if ((admin as any).apps?.length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  (admin as any).initializeApp({
    credential: (admin as any).credential.cert(serviceAccount),
  });
}

export async function GET() {
  try {
    const db = (admin as any).firestore();
    const slotsRef = db.collection('interview_slots');
    const snapshot = await slotsRef.get();

    const candidates = new Set<string>();
    let candidateInterviews: Record<string, number> = {};

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.candidateName) {
        candidates.add(data.candidateName);
        candidateInterviews[data.candidateName] = (candidateInterviews[data.candidateName] || 0) + 1;
      }
    });

    const candidateList = Array.from(candidates)
      .sort()
      .map(name => ({
        name,
        interviews: candidateInterviews[name],
      }));

    return NextResponse.json({
      total: candidates.size,
      candidates: candidateList,
    });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
