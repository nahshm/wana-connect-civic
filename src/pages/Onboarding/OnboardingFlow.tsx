import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Step1Location from './Step1Location';
import Step2Interests from './Step2Interests';
import Step3Persona from './Step3Persona';
import Step4Communities from './Step4Communities';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    countyId: '',
    constituencyId: '',
    wardId: '',
    interests: [] as string[],
    persona: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      navigate('/');
    }
  };

  const handleNext = (data: Partial<typeof onboardingData>) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to WanaIQ!</h1>
          <p className="text-muted-foreground">Let's connect you to your community</p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {currentStep} of 4
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          {currentStep === 1 && (
            <Step1Location
              onNext={handleNext}
              initialData={{
                countyId: onboardingData.countyId,
                constituencyId: onboardingData.constituencyId,
                wardId: onboardingData.wardId,
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2Interests
              onNext={handleNext}
              onBack={handleBack}
              initialData={{ interests: onboardingData.interests }}
            />
          )}
          {currentStep === 3 && (
            <Step3Persona
              onNext={handleNext}
              onBack={handleBack}
              initialData={{ persona: onboardingData.persona }}
            />
          )}
          {currentStep === 4 && (
            <Step4Communities
              onBack={handleBack}
              onboardingData={onboardingData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
