import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { GoogleIcon, GitHubIcon } from "@/components/auth/oauth-icons";

export function OAuthButtons() {
  const mockOAuth = (provider: string) => () => toast.info("OAuth not connected in demo", { description: `${provider} sign-in isn't wired up in this preview.` });

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" className="w-full" onClick={mockOAuth("Google")}>
        <GoogleIcon />
        Continue with Google
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={mockOAuth("GitHub")}>
        <GitHubIcon />
        Continue with GitHub
      </Button>
    </div>
  );
}
