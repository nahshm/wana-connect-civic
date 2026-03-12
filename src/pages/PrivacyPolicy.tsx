import React from 'react';
import { Shield, Lock, Eye, FileText, Database, Share2, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const PrivacyPolicy = () => {
  const effectiveDate = "March 13, 2026";
  const contactEmail = "privacy@wanaiq.com";

  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Privacy Policy</h1>
        <p className="text-xl text-muted-foreground">
          Effective Date: {effectiveDate}
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">1</span>
            Introduction
          </h2>
          <p>
            Welcome to WanaIQ ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have control over your data. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our civic engagement platform, and your rights under data protection laws (including GDPR and the Kenya Data Protection Act).
          </p>
        </section>

        <Separator />

        {/* Information We Collect */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">2</span>
            Information We Collect
          </h2>
          <p>We practice "Data Minimization", collecting only what is necessary:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Lock className="h-4 w-4" />
                  Account Data
                </div>
                <p className="text-sm text-muted-foreground">Username, email address, and authentication credentials.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <UserCheck className="h-4 w-4" />
                  Profile Data
                </div>
                <p className="text-sm text-muted-foreground">Display name, bio, county, constituency, ward, and civic role.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  Civic Engagement
                </div>
                <p className="text-sm text-muted-foreground">Posts, comments, upvotes, project reports, and multimedia attachments.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Database className="h-4 w-4" />
                  System Usage
                </div>
                <p className="text-sm text-muted-foreground">IP address, browser type, interaction logs, and device info.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* How We Process Your Data */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">3</span>
            How We Process Your Data (Including AI)
          </h2>
          <p>
            Your data is processed to provide our core services. WanaIQ utilizes Artificial Intelligence (AI) to enhance civic engagement. <strong>We do not use your personal data to train our foundational AI models.</strong>
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold">Content Moderation ("Civic Steward")</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  User-generated content is processed by AI to filter hate speech, protect personally identifiable information (PII), and ensure platform safety.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold">Issue Routing ("Civic Router")</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Civic reports are analyzed by AI to automatically route them to the correct geographic and departmental jurisdiction.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold">Civic Assistant ("Civic Brain")</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your queries and relevant profile context (e.g., your county) are processed by AI to provide localized, accurate civic answers based on verified documents.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Third-Party Data Processors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">4</span>
            Third-Party Data Processors
          </h2>
          <p>We share necessary data with trusted third-party providers who comply with strict security standards:</p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase:</strong> Our primary database and authentication provider. Your data is stored securely on Supabase cloud infrastructure.</li>
            <li><strong>Groq:</strong> Powers our Llama 3 AI agents. Data is used strictly for inference and is not retained for model training.</li>
            <li><strong>OpenAI:</strong> Processes text queries solely to generate vector embeddings for our Document Search (RAG) feature.</li>
            <li><strong>Hosting Providers:</strong> (e.g., Vercel/Netlify) Deliver the website interface to your browser.</li>
          </ul>
        </section>

        <Separator />

        {/* Data Storage, Retention, and Security */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">5</span>
            Storage, Retention, and Security
          </h2>
          <p>
            We employ Row Level Security (RLS) and encryption to ensure your private data is only accessible to you and authorized backend services.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Retention Policy:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Standard Data:</strong> Purged within 30 days of account deletion.</li>
                <li><strong>Audit Logs & Anonymous Reports:</strong> Retained for 7-10 years for legal integrity, using secure encryption.</li>
              </ul>
            </div>
          </div>
        </section>

        <Separator />

        {/* Your Data Rights */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">6</span>
            Your Data Rights
          </h2>
          <p>You have complete control over your data through your Account Settings:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Right to Access:</strong> Request a digital copy of all personal data we hold about you.</li>
            <li><strong>Right to Erasure:</strong> Complete or partial deletion of your account and associated data.</li>
            <li><strong>Right to Rectification:</strong> Update your profile information at any time.</li>
            <li><strong>Right to Restrict:</strong> Toggle settings to hide activity and contact info from other users.</li>
          </ul>
        </section>

        <Separator />

        {/* Contact Us */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-muted">7</span>
            Contact Us
          </h2>
          <p>
            For data deletion requests, GDPR/DPA inquiries, or privacy concerns, please contact our Data Protection Officer at:
          </p>
          <p className="font-mono bg-muted p-2 rounded w-fit">{contactEmail}</p>
        </section>
      </div>

      <div className="mt-20 text-center text-sm text-muted-foreground border-t pt-8">
        &copy; {new RegExp(/\d{4}/).exec(new Date().toISOString())?.[0]} WanaIQ. All rights reserved.
      </div>
    </div>
  );
};

export default PrivacyPolicy;
