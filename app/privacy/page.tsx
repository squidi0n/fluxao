import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FluxAO',
  description:
    'Privacy Policy for FluxAO - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to FluxAO ("we," "our," or "us"). We respect your privacy and are committed to
              protecting your personal data. This privacy policy explains how we collect, use,
              disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Profile information (username, bio, avatar)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Content you create (blog posts, comments)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address and browser information</li>
              <li>Device and operating system information</li>
              <li>Pages visited and time spent on our site</li>
              <li>Referring website addresses</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.3 Cookies and Tracking</h3>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and
              hold certain information. You can instruct your browser to refuse all cookies or to
              indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To notify you about changes to our services</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our services</li>
              <li>To monitor the usage of our services</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To send you newsletters (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers (e.g., Stripe for payments, email service providers)</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>With your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect
              your personal data against accidental or unlawful destruction, loss, alteration,
              unauthorized disclosure, or access. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
            <p>
              Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Access:</strong> Request access to your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Request correction of inaccurate personal data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your personal data
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of processing your personal data
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your personal data
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your personal data
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent at any time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary for the purposes set out in
              this privacy policy. We will retain and use your data to the extent necessary to
              comply with our legal obligations, resolve disputes, and enforce our policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 13. We do not knowingly
              collect personal information from children under 13. If you become aware that a child
              has provided us with personal data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside of
              your state, province, country, or other governmental jurisdiction where data
              protection laws may differ from those in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the
              privacy practices of these external sites.
            </p>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Stripe:</strong> Payment processing (
                <a href="https://stripe.com/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                )
              </li>
              <li>
                <strong>Google OAuth:</strong> Authentication (
                <a
                  href="https://policies.google.com/privacy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                )
              </li>
              <li>
                <strong>GitHub OAuth:</strong> Authentication (
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                )
              </li>
              <li>
                <strong>Vercel:</strong> Hosting (
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                )
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>By email: privacy@fluxao.com</li>
              <li>
                By visiting our contact page:{' '}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Us
                </a>
              </li>
              <li>By mail: FluxAO, [Your Address]</li>
            </ul>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Cookie Policy</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for the website to function properly
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors interact with
                our website
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and preferences
              </li>
              <li>
                <strong>Marketing Cookies:</strong> Track your activity to deliver relevant
                advertisements (if applicable)
              </li>
            </ul>
            <p className="mt-4">
              You can manage your cookie preferences through your browser settings or by using our
              cookie consent banner.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
