import React from "react";

const COMPANY_NAME = process.env.NEXT_PUBLIC_APP_NAME;
const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL;
const POLICY_EFFECTIVE_DATE = "07 Nov 2024";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Our Commitment to Privacy
        </h2>
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

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information Collection</h2>
        <p className="text-gray-700">
          We only ask for personal information when we truly need it to provide
          a service to you. We collect it by fair and lawful means, with your
          knowledge and consent. We also let you know why we&apos;re collecting
          it and how it will be used.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Scheduled Actions</h2>
        <p className="text-gray-700">
          If you choose to schedule actions or posts through our service, we may
          retain associated session information (such as cookies or tokens) in
          encrypted storage to enable those actions at the scheduled time. You
          may revoke this access at any time.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Third-Party Authentication
        </h2>
        <p className="text-gray-700">
          With your explicit consent, we may access and temporarily store
          certain cookies from third-party websites (such as Substack) in order
          to perform specific actions on your behalf, such as scheduling or
          publishing content. These cookies may contain session tokens or other
          identifiers required to authenticate with those services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Limited Use of Credentials
        </h2>
        <p className="text-gray-700">
          This access is strictly limited to the purpose for which you have
          granted permission, and we do not share, resell, or use these cookies
          for any purpose other than executing the intended actions you
          authorize. Cookies are transmitted securely and are not stored beyond
          the duration required to complete the requested task.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Retention</h2>
        <p className="text-gray-700">
          We only retain collected information for as long as necessary to
          provide you with your requested service. What data we store,
          we&apos;ll protect within commercially acceptable means to prevent
          loss and theft, as well as unauthorized access, disclosure, copying,
          use, or modification.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Content Sharing Practices
        </h2>
        <p className="text-gray-700">
          {COMPANY_NAME} distinguishes between draft notes and published posts
          in the following ways:
        </p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>
            <strong>Notes:</strong> Draft notes created on our platform may be
            shared with other {COMPANY_NAME} users as a source of inspiration.
            By using our service, you acknowledge and consent that the content
            of your notes may be visible to and used by other users for creative
            inspiration. If you do not wish your notes to be shared, you should
            not store them on our platform.
          </li>
          <li>
            <strong>Published Posts:</strong> For published Substack content, we
            only share links to your posts, never the full content itself. Your
            published content remains exclusively on Substack, and we do not
            reproduce, republish, or redistribute it without your explicit
            permission.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information Sharing</h2>
        <p className="text-gray-700">
          We don&apos;t share any personally identifying information publicly or
          with third parties, except when required to by law.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Legal Compliance</h2>
        <p className="text-gray-700">
          We act in the capacity of a data controller and a data processor with
          regard to the personal data processed through {COMPANY_NAME} and the
          services in terms of the applicable data protection laws, including
          the EU General Data Protection Regulation (GDPR).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">External Links</h2>
        <p className="text-gray-700">
          Our website may link to external sites that are not operated by us.
          Please be aware that we have no control over the content and practices
          of these sites, and cannot accept responsibility or liability for
          their respective privacy policies.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
        <p className="text-gray-700">
          You are free to refuse our request for your personal information, with
          the understanding that we may be unable to provide you with some of
          your desired services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Acceptance of Terms</h2>
        <p className="text-gray-700">
          Your continued use of our website will be regarded as acceptance of
          our practices around privacy and personal information. If you have any
          questions about how we handle user data and personal information, feel
          free to contact us.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Dependencies</h2>
        <p className="text-gray-700">
          Please note that our service relies on third-party platforms such as
          Substack to function correctly. Substack may, at any time and without
          notice, change their authentication methods, API endpoints, session
          policies, or implement restrictions that may limit or block our
          ability to operate this service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Service Limitations</h2>
        <p className="text-gray-700">
          We are not affiliated with Substack, and we cannot guarantee the
          continued availability or functionality of features that depend on
          their systems. By using this service, you acknowledge that any
          disruption caused by changes on Substack&apos;s side is outside of our
          control, and we assume no responsibility for such interruptions.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Chrome Extension Access</h2>
        <p className="text-gray-700">
          By choosing to install and use our Chrome extension, you explicitly
          grant
          {` ${COMPANY_NAME} `} permission to access and store your content,
          including your Substack notes, posts and cookies, for the purpose of
          helping you manage, schedule, and interact with your content more
          effectively.
        </p>
        <p className="text-gray-700 mt-2">
          We only access the data required to perform the functions you enable,
          and all data transmission is handled securely. You can revoke this
          access at any time by uninstalling the extension or deleting your
          account.
        </p>
        <p className="text-gray-700 mt-2">
          <strong>Paid content:</strong> While we may store paid or subscriber-only content you have on Substack to provide you with features like scheduling or content management, this content is <u>never</u> used, displayed, or shared with anyone except you. It remains strictly private and accessible only to your account. We make no claim to this content and do not expose it to other users under any circumstance.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Authorized Actions on Your Behalf
        </h2>
        <p className="text-gray-700">
          {COMPANY_NAME} will perform actions on your behalf on Substack when
          you authorize us to do so. These actions may include creating and
          publishing notes, scheduling content, reading your existing notes and
          posts for management purposes, and other related activities to help
          you manage your Substack presence. When referencing your published
          Substack content (such as in analytics or social sharing), we will
          only share links to your posts, never the full content itself. Your
          published content remains yours, and we do not claim any ownership
          rights to it or redistribute it without your permission.
        </p>
      </section>

      <footer className="text-sm text-gray-500 mt-4">
        This policy is effective as of {POLICY_EFFECTIVE_DATE}.
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
