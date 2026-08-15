import { auth, googleProvider, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { addDoc, collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

export const addApplication = async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const ref = collection(db, "users", user.uid, "applications");
    await addDoc(ref, data);
};

export const listenToApplications = (callback) => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const ref = collection(db, "users", user.uid, "applications");
        unsubscribeSnapshot = onSnapshot(ref, (snapshot) => {
        const apps = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        callback(apps);
        });
    });

    return () => {
        unsubscribeAuth();
        unsubscribeSnapshot && unsubscribeSnapshot();
    };
};

export const deleteApplication = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid, "applications", id);
    await deleteDoc(ref);
};

export const dismissApplication = async (app) => {
    const user = auth.currentUser;
    if (!user || !app) return;

    const batch = writeBatch(db);

    // 1. Record in dismissed_jobs so future job hunts skip same company & role
    const dismissedRef = doc(collection(db, "users", user.uid, "dismissed_jobs"));
    batch.set(dismissedRef, {
        company: app.company || "",
        role: app.role || "",
        jobUrl: app.jobUrl || "",
        dismissedAt: new Date().toISOString(),
    });

    // 2. Delete from applications
    const appRef = doc(db, "users", user.uid, "applications", app.id);
    batch.delete(appRef);

    await batch.commit();
};

export const clearAllQueuedApplications = async (queuedList = []) => {
    const user = auth.currentUser;
    if (!user || queuedList.length === 0) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const app of queuedList) {
        // Record in dismissed_jobs
        const dismissedRef = doc(collection(db, "users", user.uid, "dismissed_jobs"));
        batch.set(dismissedRef, {
            company: app.company || "",
            role: app.role || "",
            jobUrl: app.jobUrl || "",
            dismissedAt: now,
        });

        // Delete from applications
        const appRef = doc(db, "users", user.uid, "applications", app.id);
        batch.delete(appRef);
    }

    await batch.commit();
};

export const updateApplication = async (id, fieldName, fieldValue) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid, "applications", id);
    await updateDoc(ref, {
        [fieldName]: fieldValue,
    });
};

export default async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, googleProvider);
    }
    catch (err) {
        console.error(err);
    }
}
