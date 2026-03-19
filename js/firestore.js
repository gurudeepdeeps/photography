/* firestore.js - Firestore Data Layer Skeleton */

// import { getFirestore, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// import app from './firebase.js';

// const db = getFirestore(app);

/**
 * Fetch films for the gallery
 */
export async function getFilms() {
    // const q = query(collection(db, "films"), orderBy("order", "asc"));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return [];
}

/**
 * Submit an inquiry
 */
export async function submitInquiry(data) {
    // await addDoc(collection(db, "inquiries"), {
    //     ...data,
    //     timestamp: new Date()
    // });
}
