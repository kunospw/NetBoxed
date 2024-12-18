import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    addDoc, 
    collection, 
    getFirestore } from "firebase/firestore";
import { 
    createUserWithEmailAndPassword, 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyD3wTdWtQuZjnlLrqyxpKHrwYQDq1Wzpjo",
  authDomain: "netboxed-34f4b.firebaseapp.com",
  projectId: "netboxed-34f4b",
  storageBucket: "netboxed-34f4b.firebasestorage.app",
  messagingSenderId: "86830380274",
  appId: "1:86830380274:web:b948ad807b114aef3b8c6b",
  measurementId: "G-V1NYHS2JPV"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 
const analytics = getAnalytics(app);

const signup = async (name, email, password)=>{
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password)
        const user = res.user;
        await addDoc(collection(db, users), {
            uid: user.uid, 
            name,
            authProvider: "local",
            email,
        })
    } catch (error){
        console.log(error);
        alert(error);
    }
}
const login = async() =>{
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }catch (error) {
        console.log(error);
        alert(error);
    }
}

const logout = ()=>{
    signOut(auth);
}

export {auth, db, login, signup, logout};