import { AlertCircle } from "lucide-react";

export const ContrastSection = () => (
  <section className="py-24 bg-gradient-to-b from-background to-muted">
    <div className="container max-w-6xl mx-auto px-4">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold mb-4">
MAKE THIS SECTION: AI Alone will not work
        </h2>
        <p className="text-muted-foreground/80 text-2xl font-normal">
          (Here&apos;s what&apos;s wrong)
        </p>
      </div>

      <div className="relative">
        <div className="absolute -inset-x-4 -inset-y-2 bg-destructive/5 rounded-3xl blur-2xl"></div>
        <div className="relative p-8 rounded-2xl bg-gradient-to-b from-red-100/10 to-red-200/0 border border-red-400/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <h3 className="text-2xl font-semibold text-destructive">
              Other solutions
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground/90">
                  Content creation
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Mass-produced content that sounds robotic and impersonal
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      One-size-fits-all templates that ignore your unique voice
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground/90">
                  User experience
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Complex interfaces that slow down your writing process
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Limited control over the final output
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-destructive/10">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground/90">Brand impact</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Dilutes your brand identity with generic content
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Readers immediately recognize AI-generated text
                    </p>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground/90">Results</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Lower engagement and reduced reader trust
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <p className="text-muted-foreground">
                      Missed opportunities to build authentic connections
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
