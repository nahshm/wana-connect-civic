import React from 'react';
import { Gavel, Scale, AlertTriangle, ShieldCheck, HelpCircle, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const TermsOfService = () => {
  const effectiveDate = "March 13, 2026";
  const contactEmail = "support@wanaiq.com";

  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
          <Gavel className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Terms of Service</h1>
        <p className="text-xl text-muted-foreground">
          Effective Date: {effectiveDate}
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
        {/* Acceptance of Terms */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">1</span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using WanaIQ ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.
          </p>
        </section>

        <Separator />

        {/* Description of Service */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">2</span>
            Description of Service
          </h2>
          <p>
            WanaIQ is an AI-powered civic engagement platform designed to facilitate democratic participation, issue reporting, and civic education. <strong>WanaIQ is an independent technology platform and is not an official government entity.</strong>
          </p>
        </section>

        <Separator />

        {/* User Accounts and Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">3</span>
            User Accounts and Security
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You may not use the Platform if you are under the age of 13 (or the applicable age of digital consent in your jurisdiction).</li>
          </ul>
        </section>

        <Separator />

        {/* User-Generated Content & AI Moderation */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">4</span>
            User-Generated Content & AI Moderation
          </h2>
          <p>WanaIQ employs automated AI moderation ("The Civic Steward") to enforce our community guidelines.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <FileCheck className="h-4 w-4" />
                  Content Ownership
                </div>
                <p className="text-sm text-muted-foreground">
                  You retain ownership of your content. By posting, you grant WanaIQ a license to display, distribute, and analyze this content.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Automated Moderation
                </div>
                <p className="text-sm text-muted-foreground">
                  Our AI may automatically flag or block content that violates guidelines. We reserve the right to remove any content.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Prohibited Conduct */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">5</span>
            Prohibited Conduct
          </h2>
          <p>To maintain a high-trust civic environment, you agree strictly NOT to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Post hate speech, tribal incitement, or calls to violence.</li>
            <li>Share private phone numbers, home addresses, or ID numbers of yourself or others.</li>
            <li>Post demonstrably false misinformation regarding electoral processes.</li>
            <li>Spam the platform with automated or malicious requests.</li>
          </ul>
        </section>

        <Separator />

        {/* Generative AI Disclaimer */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <span className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-600">6</span>
            Generative AI Disclaimer
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <HelpCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="font-bold">No Legal Advice</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  The AI ("Civic Brain") provides educational information. It does not constitute professional legal, financial, or medical advice.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="font-bold">Hallucinations</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  AI models may occasionally produce inaccurate information. Users should independently verify critical information.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Limitation of Liability */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">7</span>
            Limitation of Liability
          </h2>
          <p>
            WanaIQ and its providers shall not be liable for any indirect or consequential damages arising from your use of the Platform or reliance on AI-generated content.
          </p>
        </section>

        <Separator />

        {/* Governing Law */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">8</span>
            Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of Kenya</strong>.
          </p>
        </section>

        <Separator />

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">9</span>
            Contact
          </h2>
          <p>If you have questions regarding these terms, please contact us at:</p>
          <p className="font-mono bg-muted p-2 rounded w-fit">{contactEmail}</p>
        </section>
      </div>

      <div className="mt-20 text-center text-sm text-muted-foreground border-t pt-8">
        &copy; {new RegExp(/\d{4}/).exec(new Date().toISOString())?.[0]} WanaIQ. All rights reserved.
      </div>
    </div>
  );
};

export default TermsOfService;
