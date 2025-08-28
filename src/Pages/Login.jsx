import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SellerContext } from "../Context/SellerContext";
import { useGoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();
  const { backend, setStoken } = useContext(SellerContext);

  // State variables
  const [state, setState] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

const validatePassword = (password) => {
  // At least one lowercase, one uppercase, one digit, one special (including .)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
  return passwordRegex.test(password);
};

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  };

  // Real-time validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const newErrors = {};

      if (state === "Sign Up" && name) {
        if (!validateName(name)) {
          newErrors.name = "Name must be 2-50 characters long and contain only letters";
        }
      }

      if ((state === "Login" || state === "Sign Up") && email) {
        if (!validateEmail(email)) {
          newErrors.email = "Please enter a valid email address";
        }
      }

      if ((state === "Login" || state === "Sign Up") && password) {
        if (!validatePassword(password)) {
          newErrors.password = "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character";
        }
      }

      if (state === "Reset Password") {
        if (newPassword && !validatePassword(newPassword)) {
          newErrors.newPassword = "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character";
        }
        if (confirmPassword && newPassword !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }

      setErrors(newErrors);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timer);
  }, [name, email, password, newPassword, confirmPassword, state]);

  // Form submission validation
  const validateForm = () => {
    const newErrors = {};

    if (state === "Sign Up") {
      if (!name) {
        newErrors.name = "Name is required";
      } else if (!validateName(name)) {
        newErrors.name = "Name must be 2-50 characters long and contain only letters";
      }
    }

    if (state === "Login" || state === "Sign Up") {
      if (!email) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!password) {
        newErrors.password = "Password is required";
      } else if (!validatePassword(password)) {
        newErrors.password = "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character";
      }
    }

    if (state === "Reset Password") {
      if (!newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (!validatePassword(newPassword)) {
        newErrors.newPassword = "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleGoogleVerifyForReset = useGoogleLogin({
    onSuccess: async (response) => {
      setResetCode(response.code);
      toast.success("Verified with Google. Now set your new password.");
      setState("Reset Password");
    },
    onError: () => toast.error("Google verification failed"),
    flow: "auth-code",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
          setState("Login");
          setName("");
          setEmail("");
          setPassword("");
        } else if (state === "Login") {
          setStoken(data.token);
          localStorage.setItem("seller-token", data.token);
          navigate("/dashboard");
        } else if (state === "Reset Password") {
          setState("Login");
          setNewPassword("");
          setConfirmPassword("");
          setResetCode("");
        }
        setErrors({});
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
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col gap-3 m-auto items-start p-8 w-[340px] sm:w-[384px] max-w-[384px] border rounded-xl text-zinc-600 text-sm shadow-lg shadow-zinc-500 bg-gradient-to-b from-orange-100 to-orange-200"
      >
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

        {state === "Sign Up" && (
          <div className="w-full">
            <p className="mt-2">Full Name</p>
            <input
              type="text"
              onChange={(e) => setName(e.target.value.trim())}
              value={name}
              className={`border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 break-words">{errors.name}</p>}
          </div>
        )}

        {(state === "Login" || state === "Sign Up") && (
          <div className="w-full">
            <p className="mt-4">Email</p>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value.trim())}
              value={email}
              className={`border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 break-words">{errors.email}</p>}
          </div>
        )}

        {(state === "Login" || state === "Sign Up") && (
          <div className="w-full">
            <p className="mt-4">Password</p>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className={`border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 break-words">{errors.password}</p>}
          </div>
        )}

        {state === "Forgot Password" && (
          <div className="w-full mt-2">
            <p className="text-sm text-gray-700 break-words">
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
              <p className="mt-2 text-green-700 text-sm break-words">
                Verified. Continue below to set a new password.
              </p>
            )}
          </div>
        )}

        {state === "Reset Password" && (
          <>
            <div className="w-full">
              <p className="mt-4">New Password</p>
              <input
                type="password"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
                className={`border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent ${errors.newPassword ? 'border-red-500' : ''}`}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1 break-words">{errors.newPassword}</p>}
            </div>
            <div className="w-full">
              <p className="mt-4">Confirm Password</p>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                className={`border border-zinc-500 rounded w-full p-2 mt-1 bg-transparent ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 break-words">{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        {state !== "Forgot Password" && (
          <button
            type="submit"
            disabled={loading}
            className={`w-full border bg-orange-400 py-3 text-zinc-700 font-medium rounded mt-4 text-[16px] ${!loading ? 'hover:bg-orange-500 hover:text-black hover:scale-105' : 'opacity-50 cursor-not-allowed'} transition-all duration-300`}
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

        {(state === "Login" || state === "Sign Up") && (
          <p className="mt-4 break-words">
            {state === "Sign Up"
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <span
              onClick={() =>
                setState(state === "Sign Up" ? "Login" : "Sign Up")
              }
              className="text-orange-600 underline cursor-pointer hover:text-orange-800"
            >
              {state === "Sign Up" ? "Login Here" : "Sign Up Here"}
            </span>
          </p>
        )}
        {state === "Login" && (
          <p className="mt-2 break-words">
            Forgot Password?
            <span
              onClick={() => setState("Forgot Password")}
              className="text-orange-600 underline cursor-pointer hover:text-orange-800"
            >
              Reset Here
            </span>
          </p>
        )}
        {(state === "Forgot Password" || state === "Reset Password") && (
          <button
            type="button"
            onClick={() => {
              setState("Login");
              setNewPassword("");
              setConfirmPassword("");
              setResetCode("");
              setErrors({});
            }}
            className="mt-2 text-sm text-orange-600 underline cursor-pointer hover:text-orange-800"
          >
            Back to Login
          </button>
        )}
      </form>
    </div>
  );
};

export default Login;