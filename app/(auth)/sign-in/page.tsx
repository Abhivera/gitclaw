import Image from "next/image";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { GithubSignInForm } from "@/features/auth/components/github-sign-in-form";
import { isCoreEnvConfigured } from "@/lib/env";
import { SetupRequired } from "@/features/setup/components/setup-required";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to GitClaw with your GitHub account.",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const { callbackUrl } = await searchParams;
  const configured = isCoreEnvConfigured();

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mb-6 flex justify-center pt-2">
          <Image
            src="/logo2.svg"
            alt="GitClaw"
            width={172}
            height={172}
            priority
            className="text-foreground"
          />
        </div>
        <CardTitle className="text-base">
          {configured ? "Welcome back" : "Almost ready"}
        </CardTitle>
        <CardDescription>
          {configured
            ? "Sign in with GitHub to review and manage your code."
            : "Finish local setup, then sign in with GitHub."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {configured ? (
          <FieldSet>
            <FieldGroup>
              <Field>
                <GithubSignInForm callbackUrl={callbackUrl} />
                <FieldDescription className="text-center">
                  We only request the permissions needed to identify your account. You can revoke
                  access anytime from GitHub settings.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        ) : (
          <SetupRequired />
        )}
      </CardContent>
    </Card>
  );
};

export default SignInPage;
