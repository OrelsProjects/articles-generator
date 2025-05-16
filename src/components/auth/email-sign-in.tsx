"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Formik, Form, Field, FormikHelpers } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventTracker } from "@/eventTracker";
import { useSearchParams } from "next/navigation";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export function EmailSignIn() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const redirect = searchParams.get("redirect");

  async function handleSubmit(
    values: EmailFormValues,
    { setSubmitting }: FormikHelpers<EmailFormValues>,
  ) {
    try {
      setError(null);
      
      EventTracker.track("magic_link_sign_in_attempt", { email: values.email });
      
      const result = await signIn("email", {
        email: values.email,
        redirect: true,
        callbackUrl: redirect || "/home",
      });
      
      if (result?.error) {
        setError("Failed to send the magic link. Please try again.");
        EventTracker.track("magic_link_sign_in_error", { error: result.error });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      EventTracker.track("magic_link_sign_in_error", { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={toFormikValidationSchema(emailSchema)}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-4">
            <div>
              <Field
                as={Input}
                id="email"
                name="email"
                type="email"
                placeholder="youare@awesome.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isSubmitting}
                className={
                  errors.email && touched.email ? "border-red-500" : ""
                }
              />
              {errors.email && touched.email ? (
                <div className="text-sm font-medium text-destructive">
                  {errors.email}
                </div>
              ) : null}
            </div>

            {error && (
              <div className="text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <Button disabled={isSubmitting} type="submit" className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Continue with Email"
              )}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
