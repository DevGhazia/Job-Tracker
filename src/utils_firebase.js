import { auth, googleProvider, db } from "./firebase";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut
} from "firebase/auth";
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

export const listenToDmLeads = (callback) => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const ref = collection(db, "users", user.uid, "dm_leads");
        unsubscribeSnapshot = onSnapshot(ref, (snapshot) => {
            const leads = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(leads);
        });
    });

    return () => {
        unsubscribeAuth();
        unsubscribeSnapshot && unsubscribeSnapshot();
    };
};

export const updateDmLeadStatus = async (id, status) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid, "dm_leads", id);
    await updateDoc(ref, {
        status: status,
        updatedAt: new Date().toISOString(),
        ...(status === "Contacted" ? { contactedAt: new Date().toISOString() } : {})
    });
};

export const deleteDmLead = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid, "dm_leads", id);
    await deleteDoc(ref);
};

export const addDmLead = async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const ref = collection(db, "users", user.uid, "dm_leads");
    await addDoc(ref, {
        ...data,
        createdAt: new Date().toISOString()
    });
};

// Authentication helpers
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (err) {
        console.error("Google sign-in error:", err);
        throw err;
    }
};

export const signInWithEmail = async (email, password) => {
    try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        return cred.user;
    } catch (err) {
        console.error("Email sign-in error:", err);
        throw err;
    }
};

export const signUpWithEmail = async (email, password, displayName = "") => {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName && displayName.trim()) {
            await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        return cred.user;
    } catch (err) {
        console.error("Email signup error:", err);
        throw err;
    }
};

export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
        console.error("Password reset error:", err);
        throw err;
    }
};

export const formatAuthError = (err) => {
    if (!err) return "An unexpected error occurred. Please try again.";
    const code = err.code || "";
    switch (code) {
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed before completing.";
        case "auth/popup-blocked":
            return "The Google sign-in popup was blocked by your browser. Please allow popups for this site.";
        case "auth/cancelled-popup-request":
            return "Multiple sign-in attempts detected. Please try again.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/user-not-found":
            return "No account exists with this email address. Please sign up.";
        case "auth/wrong-password":
            return "Incorrect password. Please try again.";
        case "auth/invalid-credential":
            return "Invalid email or password. Please verify your credentials.";
        case "auth/email-already-in-use":
            return "An account is already registered with this email. Try logging in instead.";
        case "auth/weak-password":
            return "Password should be at least 6 characters long.";
        case "auth/too-many-requests":
            return "Access temporarily blocked due to many failed attempts. Try again later or reset your password.";
        case "auth/network-request-failed":
            return "Network connection error. Please check your internet connection.";
        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email using a different sign-in method.";
        default:
            return err.message || "An authentication error occurred. Please try again.";
    }
};

export const handleGoogleLogin = signInWithGoogle;
export default signInWithGoogle;

