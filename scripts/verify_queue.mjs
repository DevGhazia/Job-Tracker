import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  type: "service_account",
  project_id: "job-tracker-79362",
  private_key_id: "da1b24a7a30679bc1731fcc2cc1477b6d3df9c2e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCSxymRpe6fJTkn\necB7cg8mSDBWeHmOObQ+JJ6WwrMYwNL96lM40zRP6x9QnDo8FmThYM2JB+Q2bK/Q\nusLpH2JftNi2AzhrqBaViKnwfaonK41FLT5Dv8hR57PGE9zvRL0G1b132tVxcV8g\n7SFFgrilCOA6Pkp29HTWoevhZYVILmLQ46Z5RHUCieUuVLFEvAhndBkW4tbXPL83\nlzcT0+zDybz9+qzi9w0SnDJQb8dISyOtA3HfZGjVwfRZfoomTlN+q8eun9wYusBd\nN8ueXbOcdMU8aQnATvAjeCHJM3yiHMqOaAZurSh06Q8Ks0aBM5ufJ8LCz0y/oDDK\nL7L3FmWTAgMBAAECggEABA46ZlAE62Mjv0+nE2If7AleQzgPTRroEY2BJPOamj+o\nX3lhikuVAZ5NXl9VYUKnJUO/pMknM5/GLd4d3kN5PDbALtX2Rvc9Ly2NsIZFtNEI\nasBox4YdkAchxFfZKMf9RxqRzSV/9KNSzb3vnOmTQNrMGJ/kU9bGVwXgrCOEzsKP\n+bO87kvDW+DhJoXOXyhNEek9PzGpa6BICqkxOBplVpjZmGhGtQAQAtFjocAqnb/5\nqgkPAUiX4WeLjrXFlgZm26XRMqFcbvPB8Yd8lEwf1GwPtdoBFIxDq3njRYNBSKan\nKfBWF17tuLTZy3EnNm0fnl8eEJuFuqSzgOpJju/4SQKBgQDDHRDo2ngr0IU6fvz5\nfBJYUdLTLzGx8N9mt7+vD/0TsD0nzD2LksljXAipqfaIA+xHMQt2lxnu+mfU4IXX\ngsyzvkholcfUu3KvkEQKYtMminetLg7V+b6V6c/f1C1SZQ18/xYskHkZFkomLjCY\nls9ZByb7WIXB8NKBS7Nyv8Cl+QKBgQDAlL0LgtmHhSh0AvhOodsEki57EfOMiBCg\nxZlkWP/Oi5IFnmymbCG9MTTeg305b3/cLSt1ZwZ6C7AhFfcHudI45ZdY6F5krB29\nWdawChRew7s+SSf0UOrw0orRQEbrFRWMq0+t2UCnEMkb2uReYgnez1EKLm1/SUO1\nuLZ53Sja6wKBgQCn8nEHvmYKcOb9PynKJn4z/9qVZd5E6K2j4S7iJcUWGXHKvAeO\nCL/JAwOB54cJ9TaA4TqYzd/I0Upm9wy+QRyq63Owcp0cBG3nqSqoNgDDABWbwDWN\nAfiHWkdQx3ZroghGO9x+Z62VZpZU3xV9gvLgE0P+vmgEVKMeIGdKsrvFIQKBgBH1\nDJepMN15JieDK2Ixp3mKo/jn2JzvBxXmtwHrZpb83rXVau4twQuiLfrdqeyUIAkI\n0TeWTr1Mn7TGFo3K3vZdOjqZGEws3G0Oln09w15+w9PwAGDAtteT2kvewX4kLik6\nxChCzMuHPilxxL+kRqVXEYhwgddPnpewTJuaarfXAoGBAKfEwtNTS2nR0AtzjmrN\n5+YGUm5VkBAzvnFAVUa/zYbNcqtiXKQIluj1rYPgB6v+jRBEB+42UAvFlQ+iIBbs\nW9X7G+Ft2F5DHhpxPFkU1Cin7ghjHsvts37OONey7v4uzAM1kf2S3hMMAZ2837TH\nniQlaKYWdEC5wOGxGRmDbdDQ\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@job-tracker-79362.iam.gserviceaccount.com",
  client_id: "117470804024697548023",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40job-tracker-79362.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const DEFAULT_USER_ID = "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

async function verifyQueue() {
  const snapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("applications").where("status", "==", "Queued").get();
  console.log("Total queued:", snapshot.size);
  snapshot.docs.forEach((doc, idx) => {
    const d = doc.data();
    console.log(`\n[${idx + 1}] Company: ${d.company}`);
    console.log(`    Role: ${d.role}`);
    console.log(`    Exp: ${d.experience} yr(s)`);
    console.log(`    Location: ${d.location}`);
    console.log(`    URL: ${d.jobUrl}`);
    console.log(`    Logo: ${d.logo ? d.logo.slice(0, 60) + "..." : "Default Building Icon"}`);
  });
}

verifyQueue();
