

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Repeat } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLoading } from "@/hooks/use-loading";

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

export default function AnimatedCharactersLoginPage({ pageType: initialPageType }) {
  const [pageType, setPageType] = useState(initialPageType);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { showLoader, hideLoader } = useLoading();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = (setter) => {
      const blinkTimeout = setTimeout(() => {
        setter(true);
        setTimeout(() => {
          setter(false);
          scheduleBlink(setter);
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };

    const purpleBlinkTimeout = scheduleBlink(setIsPurpleBlinking);
    const blackBlinkTimeout = scheduleBlink(setIsBlackBlinking);
    return () => {
        clearTimeout(purpleBlinkTimeout);
        clearTimeout(blackBlinkTimeout);
    }
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setPasswordStrength(score);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };
  
    const getStrengthBarColorClass = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-yellow-500';
            case 3:
            case 4:
                return 'bg-green-500';
            default:
                return 'bg-muted';
        }
    };

    const handleAuthSuccess = () => {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
        hideLoader();
    };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsAuthLoading(true);
    showLoader();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Reload user to get latest emailVerified state
      await userCredential.user.reload();
      const freshUser = auth.currentUser;

      if (freshUser && !freshUser.emailVerified) {
        await signOut(auth);
        setError("Please verify your email before logging in.");
        hideLoader();
        setIsAuthLoading(false);
        return;
      }

      toast({ title: "Success", description: "Logged in successfully." });
      handleAuthSuccess();
    } catch (error) {
      setError(error.message);
      hideLoader();
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!agreed) {
        setError("You must agree to the terms and conditions to sign up.");
        return;
    }
    setError("");
    setSuccess("");
    setIsAuthLoading(true);
    showLoader();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        username: name.toLowerCase().replace(/\s+/g, ''),
        email: user.email,
        bio: "",
        location: "",
        profilePictureUrl: user.photoURL || "",
        swapHistory: [],
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
      };
      setDocumentNonBlocking(userDocRef, userData, { merge: true });
      
      setSuccess("Verification email sent. Please check your inbox to complete signup.");

      await signOut(auth);
      
    } catch (error) {
      setError(error.message);
    } finally {
        setIsAuthLoading(false);
        hideLoader();
    }
  };

   const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError("");
    setSuccess("");
    setIsAuthLoading(true);
    showLoader();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        username: user.displayName?.toLowerCase().replace(/\s+/g, '') || user.email?.split('@')[0],
        email: user.email,
        bio: "",
        location: "",
        profilePictureUrl: user.photoURL || "",
        swapHistory: [],
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
      };
      setDocumentNonBlocking(userDocRef, userData, { merge: true });
      toast({ title: "Success", description: "Signed in with Google successfully." });
      handleAuthSuccess();
    } catch (error) {
      setError(error.message);
      hideLoader();
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleProceedToLogin = () => {
    setPageType('login');
    setSuccess('');
    setError('');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground">
        <div className="relative z-20">
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#A78BFA', /* Light Purple */
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4}
                />
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4}
                />
              </div>
            </div>

            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#3B82F6', /* Blue */
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4}
                />
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4}
                />
              </div>
            </div>

            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#FDBA74', /* Light Orange */
                borderRadius: '120px 120px 0 0',
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5} forceLookY={(password.length > 0 && showPassword) ? -4} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5} forceLookY={(password.length > 0 && showPassword) ? -4} />
              </div>
            </div>
            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#6EE7B7', /* Light Green */
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5} forceLookY={(password.length > 0 && showPassword) ? -4} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5} forceLookY={(password.length > 0 && showPassword) ? -4} />
              </div>
              <div 
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div 
        className="flex items-center justify-center p-8"
        style={{
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-20px 0 40px rgba(0, 0, 0, 0.6), inset 1px 0 0 rgba(255, 255, 255, 0.04)'
        }}
      >
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
            <Link href="/" className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Repeat className="size-4 text-primary" />
                </div>
                <span>SwapCircle</span>
            </Link>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {pageType === 'login' ? 'Welcome back!' : 'Join SwapCircle'}
            </h1>
            <p className="text-muted-foreground text-sm">
                {pageType === 'login' 
                    ? "Sign in to continue your swapping adventure." 
                    : "Create your account to start swapping."}
            </p>
          </div>

          <form onSubmit={pageType === 'login' ? handleLogin : handleSignUp} className="space-y-5">
            {pageType === 'signup' && (
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        autoComplete="off"
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setIsTyping(true)}
                        onBlur={() => setIsTyping(false)}
                        required
                        className="h-12 bg-background border-border/60"
                    />
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anna@gmail.com"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 bg-background border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="h-12 pr-10 bg-background border-border/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
                {pageType === 'signup' && password.length > 0 && (
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${getStrengthBarColorClass()}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {pageType === 'login' ? (
                <div className="flex items-center justify-end">
                    
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">Forgot password?</Link>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked)} />
                    <label htmlFor="terms" className="text-sm font-normal leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I agree to the <Link href="/terms" className="underline text-primary">Terms</Link> & <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>.
                    </label>
                </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-400 bg-green-950/20 border border-green-900/30 rounded-lg space-y-3">
                <p>{success}</p>
                <Button variant="secondary" className="w-full" onClick={handleProceedToLogin}>I've Verified, Go to Login</Button>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium rounded-full" size="lg" disabled={isAuthLoading || (pageType === 'signup' && !agreed)}>
              {isAuthLoading ? (pageType === 'login' ? "Signing in..." : "Creating account...") : (pageType === 'login' ? "Log in" : "Create Account")}
            </Button>
          </form>

          <div className="divider">OR</div>

          <div className="mt-6">
            <Button onClick={handleGoogleSignIn} variant="outline" className="w-full h-12 bg-background border-border/60 hover:bg-accent rounded-full" type="button">
              <svg className="mr-2 size-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.3 512 0 398.5 0 256S111.3 0 244 0c69.8 0 130.8 28.5 173.4 72.6l-65.7 64.2C335.5 113.5 293.1 88 244 88c-88.8 0-160.1 72.3-160.1 161.4s71.3 161.4 160.1 161.4c100.2 0 138-70.4 142.8-107.4H244V261.8h244z"></path></svg>
              {pageType === 'login' ? "Log in with Google" : "Sign up with Google"}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8">
            {pageType === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link href={pageType === 'login' ? "/signup" : "/login"} className="text-foreground font-medium hover:underline" onClick={(e) => { e.preventDefault(); setPageType(pageType === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}>
              {pageType === 'login' ? "Sign Up" : "Log in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

