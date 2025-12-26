// Firebase Configuration with Google Authentication for Chrome Extension
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  remove,
  onValue,
} from "firebase/database";
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6NsEyu-qcaumqG1ELziGN2A_Jblr13HU",
  authDomain: "clipsync-app-1478f.firebaseapp.com",
  databaseURL:
    "https://clipsync-app-1478f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clipsync-app-1478f",
  storageBucket: "clipsync-app-1478f.firebasestorage.app",
  messagingSenderId: "462884445494",
  appId: "1:462884445494:web:6ec5cb599b5b2b1dcca797",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

/**
 * Sign in with Google using Chrome Extension's identity API
 * Uses launchWebAuthFlow for robust OAuth2 authentication
 */
const signInWithGoogle = async () => {
  return new Promise((resolve, reject) => {
    // Check if we're in a Chrome Extension context
    if (typeof chrome === "undefined" || !chrome.identity) {
      reject(new Error("Chrome identity API not available"));
      return;
    }

    // Get the OAuth2 client ID from manifest
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;

    if (!clientId) {
      reject(new Error("OAuth2 client_id not found in manifest"));
      return;
    }

    // Get redirect URL using chrome.identity.getRedirectURL()
    const redirectUrl = chrome.identity.getRedirectURL();
    console.log("Redirect URL:", redirectUrl);

    // Build the OAuth2 authorization URL
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ];

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUrl);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("prompt", "select_account");

    console.log("Auth URL:", authUrl.toString());

    // Launch the auth flow
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Auth error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error("No response URL received"));
          return;
        }

        console.log("Response URL:", responseUrl);

        try {
          // Parse the response URL to get the access token
          const url = new URL(responseUrl);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const accessToken = hashParams.get("access_token");

          if (!accessToken) {
            reject(new Error("No access token received"));
            return;
          }

          console.log("Access token received");

          // Create Firebase credential using access token
          // Use GoogleAuthProvider.credential(idToken, accessToken)
          // When using access_token only, pass null for idToken
          const credential = GoogleAuthProvider.credential(null, accessToken);

          // Sign in to Firebase with the credential
          const userCredential = await signInWithCredential(auth, credential);
          console.log(
            "Firebase sign-in successful:",
            userCredential.user.email
          );

          resolve(userCredential.user);
        } catch (error) {
          console.error("Firebase sign-in error:", error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Sign out the current user
 */
const signOutUser = async () => {
  try {
    await signOut(auth);
    // Clear any cached auth tokens
    if (typeof chrome !== "undefined" && chrome.identity) {
      chrome.identity.clearAllCachedAuthTokens(() => {
        console.log("Cleared cached auth tokens");
      });
    }
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Export database and auth utilities
export {
  database,
  ref,
  push,
  set,
  remove,
  onValue,
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
};
