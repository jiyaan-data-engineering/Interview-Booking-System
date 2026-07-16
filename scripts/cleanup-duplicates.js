// Manual cleanup script for duplicate candidates
// Run this with: node scripts/cleanup-duplicates.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupDuplicates() {
  console.log('Starting candidate cleanup...\n');

  const mappings = {
    // Group 1: Satya → Satyanarayanaraju
    'satya': 'Satyanarayanaraju',
    'Satya': 'Satyanarayanaraju',
    'SATYA': 'Satyanarayanaraju',
    'satyanarayanaraju': 'Satyanarayanaraju',
    'Satyanarayanaraju': 'Satyanarayanaraju',

    // Group 2: Avula Venkata Kiran (all cases)
    'avula venkata kiran': 'Avula Venkata Kiran',
    'Avula venkata kiran': 'Avula Venkata Kiran',
    'Avula venkata Kiran': 'Avula Venkata Kiran',
    'AVULA VENKATA KIRAN': 'Avula Venkata Kiran',

    // Group 3: Chandra Srikiran Kongara (all variations)
    'chandra srikiran': 'Chandra Srikiran Kongara',
    'Chandra srikiran': 'Chandra Srikiran Kongara',
    'chandra srikiran kongara': 'Chandra Srikiran Kongara',
    'Chandra Srikiran Kongara': 'Chandra Srikiran Kongara',
    'CHANDRA SRIKIRAN KONGARA': 'Chandra Srikiran Kongara',

    // Group 4: Padmini G (all cases)
    'padmini g': 'Padmini G',
    'Padmini g': 'Padmini G',
    'PADMINI G': 'Padmini G',
    'Padmini G': 'Padmini G',
  };

  try {
    const snapshot = await db.collection('interview_slots').get();
    let updatedCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const currentName = data.candidateName;

      if (currentName && mappings[currentName]) {
        const standardizedName = mappings[currentName];
        if (currentName !== standardizedName) {
          batch.update(doc.ref, { candidateName: standardizedName });
          updatedCount++;
          batchCount++;
          console.log(`✅ Updated: "${currentName}" → "${standardizedName}"`);
        }
      }

      // Commit batch every 500 updates
      if (batchCount >= 500) {
        batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    });

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\n✅ Successfully updated ${updatedCount} records!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
