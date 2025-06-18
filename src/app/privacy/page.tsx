import React from "react";

const COMPANY_NAME = process.env.NEXT_PUBLIC_APP_NAME;
const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL;
const POLICY_EFFECTIVE_DATE = "01 Mar 2025";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

      {/* General Privacy Statement */}
      <section className="mb-6">
        <p className="text-gray-700">
          Your privacy is important to us. It is {COMPANY_NAME}&apos;s policy to
          respect your privacy regarding any information we may collect from you
          across our website,{" "}
          <a href={WEBSITE_URL} className="text-blue-500 underline">
            {WEBSITE_URL}
          </a>
          , and other sites we own and operate.
        </p>
      </section>

      {/* Data Collection Principles */}
      <section className="mb-6">
        <p className="text-gray-700">
          We only ask for personal information when we truly need it to provide
          a service to you. We collect it by fair and lawful means, with your
          knowledge and consent. We also let you know why we&apos;re collecting
          it and how it will be used.
        </p>
      </section>

      {/* Data Retention and Protection */}
      <section className="mb-6">
        <p className="text-gray-700">
          We only retain collected information for as long as necessary to
          provide you with your requested service. What data we store,
          we&apos;ll protect within commercially acceptable means to prevent
          loss and theft, as well as unauthorized access, disclosure, copying,
          use, or modification.
        </p>
      </section>

      {/* Non-Disclosure */}
      <section className="mb-6">
        <p className="text-gray-700">
          We don&apos;t share any personally identifying information publicly or
          with third parties, except when required to by law.
        </p>
      </section>

      {/* Data Controller & Processor Statement */}
      <section className="mb-6">
        <p className="text-gray-700">
          We act in the capacity of a data controller and a data processor with
          regard to the personal data processed through {COMPANY_NAME} and the
          services in terms of the applicable data protection laws, including
          the EU General Data Protection Regulation (GDPR).
        </p>
      </section>

      {/* Extension-Specific Collection Notice */}
      <section className="mb-6">
        <p className="text-gray-700">
          In connection with any official browser extension provided by{" "}
          {COMPANY_NAME} (the &quot;Extension&quot;), we automatically collect,
          store, and process all notes, articles, and usage statistics generated
          or accessed through the Extension (collectively, &quot;Extension
          Data&quot;), irrespective of user-selected privacy settings. Extension
          Data may be utilised for internal operational purposes, including
          analytics, service optimisation, and product development.
          Notwithstanding the foregoing, the Extension will not access,
          transmit, or otherwise process any content that is paywalled,
          subscriber‑only, or similarly designated as paid (&quot;Paid
          Content&quot;). Paid Content remains resident on your device and is
          never transmitted to or stored by {COMPANY_NAME}.
        </p>
      </section>

      {/* External Links Disclaimer */}
      <section className="mb-6">
        <p className="text-gray-700">
          Our website may link to external sites that are not operated by us.
          Please be aware that we have no control over the content and practices
          of these sites and cannot accept responsibility or liability for their
          respective privacy policies.
        </p>
      </section>

      {/* User Choice */}
      <section className="mb-6">
        <p className="text-gray-700">
          You are free to refuse our request for your personal information, with
          the understanding that we may be unable to provide you with some of
          your desired services.
        </p>
      </section>

      {/* Acceptance */}
      <section className="mb-6">
        <p className="text-gray-700">
          Your continued use of our website will be regarded as acceptance of
          our practices around privacy and personal information. If you have any
          questions about how we handle user data and personal information, feel
          free to contact us.
        </p>
      </section>

      <footer className="text-sm text-gray-500 mt-4">
        This policy is effective as of {POLICY_EFFECTIVE_DATE}.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
