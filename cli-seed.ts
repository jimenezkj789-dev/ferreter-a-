import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { INVENTORY_SEED } from './src/lib/seed';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runSeed() {
  console.log('--- FERROSTOCK CLI SEEDER ---');
  console.log('Cargando 40 productos en Firestore...');
  
  let count = 0;
  for (const item of INVENTORY_SEED) {
    try {
      await addDoc(collection(db, 'products'), {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      count++;
      console.log(`[${count}/40] Cargado: ${item.name}`);
    } catch (e) {
      console.error(`Error cargando ${item.name}:`, e);
    }
  }
  
  console.log('-----------------------------');
  console.log(`¡Éxito! ${count} productos insertados.`);
  process.exit(0);
}

runSeed();
