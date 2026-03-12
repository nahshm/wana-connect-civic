import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, Eye, EyeOff, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/lib/validations/auth';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { cn } from '@/lib/utils';

export const AuthModal = () => {
  const { isOpen, mode, close } = useAuthModal();
  const { signIn, signUp, signInWithGoogle, signInWithApple, signInWithGithub, sendMagicLink } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [view, setView] = useState<'main' | 'magic-link' | 'verification'>('main');
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const [signUpEmail, setSignUpEmail] = useState('');
  
  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const signUpPassword = signUpForm.watch('password', '');

  // Reset state when modal closes
  const handleModalChange = (open: boolean) => {
    if (!open) {
      close();
      setTimeout(() => {
        signInForm.reset();
        signUpForm.reset();
        setView('main');
      }, 300);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      close();
    } else {
      signInForm.setError('root', {
        message: getAuthErrorMessage(error),
      });
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    const { error } = await signUp(data.email, data.password, data.username);
    if (!error) {
      setSignUpEmail(data.email);
      setView('verification');
    } else {
      signUpForm.setError('root', {
        message: getAuthErrorMessage(error),
      });
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'github') => {
    const signInMethod = provider === 'google' ? signInWithGoogle : provider === 'apple' ? signInWithApple : signInWithGithub;
    await signInMethod();
    // Supabase redirects, so we don't necessarily close here
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    if (!email) return;

    const { error } = await sendMagicLink(email);
    if (!error) {
      close();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md bg-background border border-border p-0 gap-0 overflow-hidden shadow-2xl">
          {/* Header Branding */}
          <div className="h-2 bg-gradient-to-r from-civic-green to-civic-blue w-full" />
          
          <button
            onClick={() => close()}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="p-8 space-y-6">
            {view === 'verification' ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification link to <strong>{signUpEmail}</strong>.
                    Please verify your account to continue.
                  </p>
                </div>
                <Button onClick={() => setView('main')} variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </div>
            ) : view === 'magic-link' ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">Magic Link</DialogTitle>
                  <DialogDescription className="text-center">
                    Enter your email to receive a password-less login link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email Address</Label>
                    <Input id="magic-email" name="email" type="email" placeholder="name@example.com" required className="h-11" />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-civic-green">Send Magic Link</Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setView('main')}>
                    Back to options
                  </Button>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">Welcome to WanaIQ</DialogTitle>
                  <DialogDescription className="text-center">
                    Empowering civic engagement in Kenya
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue={isSignup ? "signup" : "signin"} className="w-full" onValueChange={(v) => setIsSignup(v === 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* Sign In Flow */}
                  <TabsContent value="signin" className="space-y-4 mt-0">
                    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input 
                          id="signin-email" 
                          type="email" 
                          placeholder="name@example.com" 
                          {...signInForm.register('email')}
                          className="h-11"
                        />
                        {signInForm.formState.errors.email && (
                          <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <Button 
                            type="button" 
                            variant="link" 
                            className="text-xs h-auto p-0 text-civic-green font-medium"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input 
                            id="signin-password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            {...signInForm.register('password')}
                            className="h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signInForm.formState.errors.password && (
                          <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      {signInForm.formState.errors.root && (
                        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive text-xs">
                          <AlertDescription>{signInForm.formState.errors.root.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full h-11 bg-civic-green hover:bg-civic-green/90 font-bold" disabled={signInForm.formState.isSubmitting}>
                        {signInForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Flow */}
                  <TabsContent value="signup" className="space-y-4 mt-0">
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-username">Username</Label>
                        <Input id="signup-username" placeholder="johndoe" {...signUpForm.register('username')} className="h-10" />
                        {signUpForm.formState.errors.username && (
                          <p className="text-xs text-destructive">{signUpForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="name@example.com" {...signUpForm.register('email')} className="h-10" />
                        {signUpForm.formState.errors.email && (
                          <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="signup-password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Min. 8 characters"
                            {...signUpForm.register('password')}
                            className="h-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrengthIndicator password={signUpPassword} />
                        {signUpForm.formState.errors.password && (
                          <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <Input id="signup-confirm" type={showPassword ? "text" : "password"} placeholder="Re-enter password" {...signUpForm.register('confirmPassword')} className="h-10" />
                        {signUpForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      {signUpForm.formState.errors.root && (
                        <Alert variant="destructive" className="bg-destructive/5 text-xs py-2">
                          <AlertDescription>{signUpForm.formState.errors.root.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full h-11 bg-civic-blue hover:bg-civic-blue/90 font-bold" disabled={signUpForm.formState.isSubmitting}>
                        {signUpForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Social Login Section */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-11 border-border/60 hover:bg-muted/50" 
                    onClick={() => handleOAuthSignIn('google')}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-11 border-border/60 hover:bg-muted/50"
                    onClick={() => setView('magic-link')}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Magic Link
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground/60 leading-tight">
                  By joining, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-primary">Terms of Service</a> and{' '}
                  <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </>
  );
};

export default AuthModal;
