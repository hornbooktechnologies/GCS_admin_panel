import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../../ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../../ui/field";
import Image from "../../ui/image";
import { Input } from "../../ui/input";
import { Spinner } from "../../ui/spinner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import useMedia from "../../../hooks/useMedia";
import useToast from "../../../hooks/useToast";
import { cn } from "../../../lib/utils/utils";
import { requestHandler } from "../../../lib/utils/network-client";
import { useAuthStore } from "../../../context/AuthContext";

const Login = () => {
  const { showSuccessToast, showErrorToast } = useToast();
  const { login, tokens } = useAuthStore();
  const navigate = useNavigate();
  const { getIconUrl } = useMedia();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  });

  const {
    register,
    formState: { errors, isSubmitting, touchedFields },
    handleSubmit,
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    const requestBody = {
      email: data.email,
      password: data.password,
    };

    const response = await requestHandler("/auth/login", {
      method: "POST",
      body: requestBody,
    });

    if (response?.success && "data" in response) {
      login(response.data.user, response.data.tokens);
      navigate("/");
      showSuccessToast(response.message);
    } else {
      showErrorToast(`${response?.message}`);
    }
  };

  const restrictLogin = useCallback(() => {
    if (tokens) {
      navigate("/");
    }
  }, [navigate, tokens]);

  useEffect(() => {
    restrictLogin();
  }, [restrictLogin]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#e7f8f3] via-white to-[#d6f3eb] p-4">
      <div className="flex flex-col items-center w-full max-w-[420px] anima-fade-in gap-6 max-h-full overflow-y-auto custom-scrollbar">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 py-2 shrink-0">
          <div className="relative group cursor-pointer">
            <Image
              src={getIconUrl("Logo-dark.png")}
              className="w-48 sm:w-56 relative transform transition-transform duration-500 hover:scale-105"
              alt="GCS Hospital CRM Logo"
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="w-full border border-white/60 bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-2 text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent tracking-tight">
              Sign In
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Welcome back to GCS Hospital
            </p>
          </CardHeader>

          <CardContent className="p-8 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FieldGroup>
                <div className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">
                      Email Address
                    </FieldLabel>
                    <div className="relative group transition-all duration-300">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        className="block h-12 w-full pl-11 pr-4 bg-slate-50/50 border-slate-200 focus:bg-white text-base text-slate-800 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <FieldError className="text-xs font-medium text-red-500 ml-1 flex items-center gap-1 animate-in slide-in-from-left-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                        {errors.email.message}
                      </FieldError>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">
                      Password
                    </FieldLabel>
                    <div className="relative group transition-all duration-300">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        className="block h-12 w-full pl-11 pr-12 bg-slate-50/50 border-slate-200 focus:bg-white text-base text-slate-800 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent p-1 rounded-full hover:bg-slate-100"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <FieldError className="text-xs font-medium text-red-500 ml-1 flex items-center gap-1 animate-in slide-in-from-left-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                        {errors.password.message}
                      </FieldError>
                    )}
                  </div>

                  {/* Sign In Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className={cn(
                        "w-full h-12 rounded-xl text-white font-bold tracking-wide shadow-lg shadow-blue-500/25 transition-all duration-300 active:scale-[0.98]",
                        "bg-primary hover:bg-primary-hover hover:shadow-blue-500/40",
                        {
                          "opacity-80 cursor-not-allowed": isSubmitting,
                        },
                      )}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Spinner className="text-white w-5 h-5 border-2" />
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </div>
              </FieldGroup>
            </form>
          </CardContent>

          {/* Footer Decoration */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-hover to-primary"></div>
        </Card>

        {/* Footer Text */}
        <p className="text-slate-400 text-xs font-medium">
          © {new Date().getFullYear()} GCS Hospital CRM. All rights
          reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
