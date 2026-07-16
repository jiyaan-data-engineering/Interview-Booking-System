// Direct Firebase cleanup - run with environment variables
const admin = require('firebase-admin');

// Initialize with service account from env
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!serviceAccountKey.projectId) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY env var not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const db = admin.firestore();

const MAPPINGS = {
  'avula venkata kiran': 'Avula Venkata Kiran',
  'avula venkata Kiran': 'Avula Venkata Kiran',
  'Avula venkata Kiran': 'Avula Venkata Kiran',
  'manoj kumar varma chintalapati': 'Manoj Kumar Varma Chintalapati',
  'Manoj kumar Varma Chintalapati': 'Manoj Kumar Varma Chintalapati',
  'Manoj Kumar Varma chintalapati': 'Manoj Kumar Varma Chintalapati',
  'phani kumar chetla': 'Phani Kumar Chetla',
  'Phani kumar chetla': 'Phani Kumar Chetla',
  'padmini g': 'Padmini G',
  'Padmini g': 'Padmini G',
  'PADMINI G': 'Padmini G',
  'Padmini G': 'Padmini G',
  'chandra srikiran kongara': 'Chandra Srikiran Kongara',
  'Chandra Srikiran Kongara': 'Chandra Srikiran Kongara',
  'chandra srikiran': 'Chandra Srikiran Kongara',
  'Chandra srikiran': 'Chandra Srikiran Kongara',
  'satya': 'Satyanarayanaraju',
  'Satya': 'Satyanarayanaraju',
  'satyanarayanaraju': 'Satyanarayanaraju',
  'Satyanarayanaraju': 'Satyanarayanaraju',
  'chitala swathi thanuja': 'Chitala Swathi Thanuja',
  'Chitala Swathi Thanuja': 'Chitala Swathi Thanuja',
  'sivannarayana ch': 'Sivannarayana CH',
  'Sivannarayana CH': 'Sivannarayana CH',
  'thamosh kalla': 'Thamosh Kalla',
  'Thamosh kalla': 'Thamosh Kalla',
};

async function cleanup() {
  console.log('🔄 Starting cleanup...\n');

  const snapshot = await db.collection('interview_slots').get();
  let updated = 0;

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const current = data.candidateName;

    if (current && MAPPINGS[current]) {
      const standard = MAPPINGS[current];
      if (current !== standard) {
        batch.update(doc.ref, { candidateName: standard });
        console.log(`✅ ${current} → ${standard}`);
        updated++;
      }
    }
  });

  await batch.commit();
  console.log(`\n✨ Done! Updated ${updated} records.`);
  process.exit(0);
}

cleanup().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
