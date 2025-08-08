import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { AUTH_PATH, SIGNUP_PATH, LOGIN_PATH } from "../utils/paths";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

export default function UserAuth({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user it already logged in when renders
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    fetch(`${API_BASE_URL}${AUTH_PATH}/me`, {
      // Includes session cookies in the request
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        // User is already logged in
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data.authenticated) {
          // Not a new user
          onAuth(false);
        }
        // If user not authenticated, stay on login form
      })
      .catch((err) => {
        console.log("Not logged in:", err);
      });
  };

  const handleSubmit = (e) => {
    // Stops browser from refreshing
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill out all fields: username and password");
      return;
    }
    if (isSignUp && password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    const endpoint = isSignUp
      ? `${AUTH_PATH}${SIGNUP_PATH}`
      : `${AUTH_PATH}${LOGIN_PATH}`;

    // Call signup or login endpoint with username and password
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: username, password: password }),
    })
      .then((response) => {
        if (response.ok) {
          if (isSignUp) {
            // Signup successful, switch to login
            setIsSignUp(false);
            setPassword("");
            toast.success("Signup successful");
          } else {
            // Login successful, need to create profile
            // Check if user has profile
            fetch(`${API_BASE_URL}/auth/me`, {
              method: "GET",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.authenticated && data.user_id) {
                  fetch(`${API_BASE_URL}/profile/${data.user_id}`, {
                    credentials: "include",
                  })
                    .then((res) => {
                      if (res.status === 404) {
                        // User needs to create profile
                        onAuth(true);
                      } else {
                        // Profile exists
                        onAuth(false);
                      }
                    })
                    .catch(() => {
                      onAuth(true);
                    });
                }
              });
          }
        } else {
          if (response.status === 401) {
            if (isSignUp) {
              toast.error("Error creating account. Please try again");
            } else {
              toast.error("Invalid username or password");
            }
          }
        }
      })
      .catch((err) => {
        toast.error(`${isSignUp ? "Sign up" : "Login"} error`);
      });
  };

  // Toggle whether user is signing up or logging in
  const toggleMode = () => {
    toast.dismiss();
    setIsSignUp(!isSignUp);
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={2}
        toastStyle={{
          "--toastify-color-progress-light": "#808080",
        }}
      />
      <form onSubmit={handleSubmit}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Smart Food Tracker
            </h1>
            <p className="text-gray-600">
              Track your food, manage your kitchen{" "}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 mb-2">
            <p>{isSignUp ? "Sign up" : "Log in"}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="text"
                value={username}
                placeholder={"Enter your username"}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="password"
                value={password}
                placeholder={"Enter your password"}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
            <button
              className="w-full !bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              type="submit"
              onClick={handleSubmit}
            >
              {isSignUp ? "Create account" : "Sign in"}
            </button>
          </div>
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp ? "Sign in" : "Sign up"}{" "}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
