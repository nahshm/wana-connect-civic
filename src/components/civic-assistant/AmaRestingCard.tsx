import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AmaRestingCard() {
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Moon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Ama is resting</h1>
        <p className="text-sm text-muted-foreground">
          The civic assistant is switched off for now. You can still report a problem, ask your leaders a question, or browse your community.
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild size="sm"><Link to="/report">Report a problem</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/">Back to feed</Link></Button>
        </div>
      </div>
    </div>
  );
}
