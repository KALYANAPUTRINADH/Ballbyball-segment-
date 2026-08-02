const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = JSON.parse(require('fs').readFileSync('./firebase-applet-config.json'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    await setDoc(doc(db, "profiles", "HF9luuU3bmSrzVGo7GWP9uIMFih1"), { phone: "123" }, { merge: true });
    console.log("Success");
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
