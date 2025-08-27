import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SellerContext } from "../Context/SellerContext";
import { useGoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();
  const { backend, setStoken } = useContext(SellerContext);

  // State variables
  const [state, setState] = useState("Login"); // "Sign Up", "Login", "Forgot Password", "Reset Password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");


  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const { data } = await axios.post(`${backend}/api/seller/google-login`, {
          code: response.code,
        });

        if (data.success) {
          toast.success(data.message);
          setStoken(data.token);
          localStorage.setItem("seller-token", data.token);
          navigate("/dashboard");
        }
      } catch {
        toast.error("Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
    flow: "auth-code",
  });

  // Google verify for password reset
  const handleGoogleVerifyForReset = useGoogleLogin({
    onSuccess: async (response) => {
      // Store the code locally; backend will use it for verification on reset
      setResetCode(response.code);
      toast.success("Verified with Google. Now set your new password.");
      setState("Reset Password");
    },
    onError: () => toast.error("Google verification failed"),
    flow: "auth-code",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let url = import.meta.env.VITE_REACT_APP_API_BASE_URL;
    let payload = {};

    if (state === "Sign Up") {
      url += "/api/seller/register";
      payload = { name, email, password };
    } else if (state === "Login") {
      url += "/api/seller/login";
      payload = { email, password };
    } else if (state === "Reset Password") {
      url += "/api/seller/forget-password";
      payload = {
        code: resetCode,
        newPassword,
        cPassword: confirmPassword,
      };
    }

    try {
      const { data } = await axios.post(url, payload);
      if (data.success) {
        toast.success(data.message);
        if (state === "Sign Up") {
          setState("Login"); // Back to login after signup
        } else if (state === "Login") {
          setStoken(data.token);
          localStorage.setItem("seller-token", data.token);
          navigate("/dashboard"); // Login complete
          // setState("Verify OTP"); // Show OTP for login
        } else if (state === "Reset Password") {
          setState("Login"); // Back to login after reset
          setNewPassword("");
          setConfirmPassword(""); // Clear confirm password
          setResetCode("");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      toast.error(errMsg);
    }
    setLoading(false);
  };




  return (
    <form onSubmit={handleSubmit} className="flex items-center py-10">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg shadow-zinc-500 bg-gradient-to-b from-orange-100 to-orange-200">
        <p className="text-2xl font-semibold">
          {state === "Sign Up"
            ? "Create Account"
            : state === "Forgot Password" || state === "Reset Password"
              ? "Reset Password"
              : "Login Account"}
        </p>
        <p className="mt-1">
          Please{" "}
          {state === "Sign Up"
            ? "sign up"
            : state === "Forgot Password" || state === "Reset Password"
              ? "reset your password"
              : "login"}{" "}
          to access your dashboard
        </p>

        {/* Name field for Sign Up */}
        {state === "Sign Up" && (
          <div className="w-full">
            <p className="mt-2">Full Name</p>
            <input
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
              className="border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent"
            />
          </div>
        )}

        {/* Email field for Login and Sign Up */}
        {(state === "Login" ||
          state === "Sign Up") && (
            <div className="w-full">
              <p className="mt-4">Email</p>
              <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
                className="border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent"
              />
            </div>
          )}

        {/* Password field for Login and Sign Up */}
        {(state === "Login" || state === "Sign Up") && (
          <div className="w-full">
            <p className="mt-4">Password</p>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              className="border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent"
            />
          </div>
        )}

        {/* Google verify step for Forgot Password */}
        {state === "Forgot Password" && (
          <div className="w-full mt-2">
            <p className="text-sm text-gray-700">
              Verify your identity with Google, then set a new password.
            </p>
            <button
              type="button"
              onClick={() => handleGoogleVerifyForReset()}
              className="w-full flex items-center justify-center gap-3 border bg-white text-gray-700 py-3 rounded mt-3 shadow hover:bg-gray-100 transition-all duration-300"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google Logo"
                className="w-5 h-5"
              />
              <span className="font-medium">Verify with Google</span>
            </button>
            {resetCode && (
              <p className="mt-2 text-green-700 text-sm">
                Verified. Continue below to set a new password.
              </p>
            )}
          </div>
        )}

        {/* New Password and Confirm Password fields for Reset Password */}
        {state === "Reset Password" && (
          <>
            <div className="w-full">
              <p className="mt-4">New Password</p>
              <input
                type="password"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
                required
                className="border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent"
              />
            </div>
            <div className="w-full">
              <p className="mt-4">Confirm Password</p>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
                className="border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent"
              />
            </div>
          </>
        )}

        {/* Submit button */}
        {state !== "Forgot Password" && (
          <button
            type="submit"
            disabled={loading}
            className="w-full border bg-orange-400 py-3 text-zinc-700 font-medium rounded mt-4 text-[16px] 
      ${!loading && 'hover:bg-orange-500 hover:text-black hover:scale-105'} transition-all duration-300"
          >
            {loading
              ? "Working on..."
              : state === "Sign Up"
                ? "Create Account"
                : state === "Reset Password"
                  ? "Reset Password"
                  : "Login Account"}
          </button>
        )}


        {state === "Login" && (
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-center gap-3 border bg-white text-gray-700 py-3 rounded mt-4 shadow hover:bg-gray-100 transition-all duration-300"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google Logo"
              className="w-5 h-5"
            />
            <span className="font-medium">Continue with Google</span>
          </button>
        )}


        {/* Navigation links */}
        {(state === "Login" || state === "Sign Up") && (
          <p className="mt-4">
            {state === "Sign Up"
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <span
              onClick={() =>
                setState(state === "Sign Up" ? "Login" : "Sign Up")
              }
              className="text-primary underline cursor-pointer"
            >
              {state === "Sign Up" ? "Login Here" : "Sign Up Here"}
            </span>
          </p>
        )}
        {state === "Login" && (
          <p className="mt-2">
            Forgot Password?
            <span
              onClick={() => setState("Forgot Password")}
              className="text-primary underline cursor-pointer"
            >
              Reset Here
            </span>
          </p>
        )}
        {(state === "Forgot Password" ||
          state === "Reset Password") && (
            <button
              type="button"
              onClick={() => {
                setState("Login");
                setNewPassword("");
                setConfirmPassword(""); // Clear confirm password
                setResetCode("");
              }}
              className="mt-2 text-sm text-primary underline cursor-pointer"
            >
              Back to Login
            </button>
          )}
      </div>
    </form>
  );
};

export default Login;
