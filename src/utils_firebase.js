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

    try {
        const ref = doc(db, "users", user.uid, "applications", app.id);
        await updateDoc(ref, {
            status: "Dismissed",
            dismissedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error setting status to Dismissed, deleting doc directly:", err);
        try {
            const ref = doc(db, "users", user.uid, "applications", app.id);
            await deleteDoc(ref);
        } catch (delErr) {
            console.error("Direct delete failed:", delErr);
        }
    }
};

export const clearAllQueuedApplications = async (queuedList = []) => {
    const user = auth.currentUser;
    if (!user || queuedList.length === 0) return;

    try {
        const batch = writeBatch(db);
        const now = new Date().toISOString();

        for (const app of queuedList) {
            const ref = doc(db, "users", user.uid, "applications", app.id);
            batch.update(ref, {
                status: "Dismissed",
                dismissedAt: now
            });
        }

        await batch.commit();
    } catch (err) {
        console.error("Batch clear failed, falling back to individual deletes:", err);
        for (const app of queuedList) {
            try {
                const ref = doc(db, "users", user.uid, "applications", app.id);
                await deleteDoc(ref);
            } catch (delErr) {
                console.error("Delete failed for app:", app.id, delErr);
            }
        }
    }
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
