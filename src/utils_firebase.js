import { auth, googleProvider, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { addDoc, collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

    const ref = doc(db, "users", user.uid, "applications", id);
    await deleteDoc(ref);
};

export const updateApplication = async (id, fieldName, fieldValue) => {
    const user = auth.currentUser;

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

