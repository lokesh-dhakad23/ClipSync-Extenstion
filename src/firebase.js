// Firebase Configuration with Google Authentication for Chrome Extension
// Using REST API for Realtime Database to avoid CSP issues in Manifest V3
import { initializeApp } from "firebase/app";
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

// Initialize Firebase (Auth only - we'll use REST for database)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Database URL for REST API
const DATABASE_URL = firebaseConfig.databaseURL;

/**
 * REST API wrapper for Firebase Realtime Database
 * This avoids CSP issues caused by Firebase SDK's long-polling transport
 */

// Helper to get auth token for authenticated requests
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Build URL with optional auth token
const buildUrl = (path, token) => {
  let url = `${DATABASE_URL}/${path}.json`;
  if (token) {
    url += `?auth=${token}`;
  }
  return url;
};

// Database reference helper (mimics Firebase SDK ref)
const ref = (db, path) => {
  return { path: path || "" };
};

// Push new data (mimics Firebase SDK push)
const push = async (refObj, data) => {
  const token = await getAuthToken();
  const url = buildUrl(refObj.path, token);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase push failed: ${response.statusText}`);
  }

  const result = await response.json();
  return { key: result.name };
};

// Set data at path (mimics Firebase SDK set)
const set = async (refObj, data) => {
  const token = await getAuthToken();
  const url = buildUrl(refObj.path, token);

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase set failed: ${response.statusText}`);
  }

  return await response.json();
};

// Remove data at path (mimics Firebase SDK remove)
const remove = async (refObj) => {
  const token = await getAuthToken();
  const url = buildUrl(refObj.path, token);

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Firebase remove failed: ${response.statusText}`);
  }
};

// Subscribe to data changes using polling (mimics Firebase SDK onValue)
// Note: REST API doesn't support real-time, so we poll every 2 seconds
const onValue = (refObj, callback, errorCallback) => {
  let isActive = true;
  let lastData = null;

  const fetchData = async () => {
    if (!isActive) return;

    try {
      const token = await getAuthToken();
      const url = buildUrl(refObj.path, token);

      const response = await fetch(url);

      if (!response.ok) {
        if (errorCallback) {
          errorCallback(
            new Error(`Firebase read failed: ${response.statusText}`)
          );
        }
        return;
      }

      const data = await response.json();

      // Only trigger callback if data has changed
      const dataStr = JSON.stringify(data);
      if (dataStr !== lastData) {
        lastData = dataStr;
        // Create a snapshot-like object
        callback({
          val: () => data,
          exists: () => data !== null,
        });
      }
    } catch (error) {
      console.error("Firebase polling error:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  };

  // Initial fetch
  fetchData();

  // Poll every 2 seconds
  const intervalId = setInterval(fetchData, 2000);

  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
};

// Dummy database object for API compatibility
const database = { app };

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
