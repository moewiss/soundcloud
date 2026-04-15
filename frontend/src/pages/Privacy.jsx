import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div style={{
      padding: '32px 24px 80px',
      maxWidth: '860px',
      margin: '0 auto',
      color: 'var(--sp-text)',
      lineHeight: 1.8,
      fontSize: '14px',
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', color: 'var(--sp-text-sub)',
          cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '4px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--sp-text-sub)', marginBottom: '32px', fontSize: '13px' }}>
        Effective Date: April 14, 2026 · Last Updated: April 14, 2026
      </p>

      <div style={{ color: 'var(--sp-text-sub)' }}>
        <p>
          Rkieh Productions Inc. ("Rkieh Productions", "Nashidify", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, store, and protect personal information when you use the Nashidify website, mobile applications, and related services (the "Service"). This Policy should be read alongside our <a onClick={() => navigate('/terms')} style={{ color: 'var(--sp-green)', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</a>.
        </p>

        <Section title="1. Data Controller">
          <p>The controller of your personal information is Rkieh Productions Inc., a federally incorporated Canadian corporation with its registered office at Toronto, ON, Canada. For privacy inquiries, please contact us at <a href="mailto:support@nashidify.com" style={{ color: 'var(--sp-green)' }}>support@nashidify.com</a>.</p>
        </Section>

        <Section title="2. Information We Collect">
          <SubSection title="2.1 Information You Provide Directly">
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong style={{ color: 'var(--sp-white)' }}>Account information:</strong> name, email address, username, password (hashed), profile photo, preferred language, and, for creator accounts, biographical information and social media links.</li>
              <li><strong style={{ color: 'var(--sp-white)' }}>Payment information:</strong> billing name, billing address, and the last four digits of your payment card. Full card details are handled directly by our payment processor (Stripe) or by Apple or Google for in-app purchases, and are never stored on our servers.</li>
              <li><strong style={{ color: 'var(--sp-white)' }}>User Content:</strong> audio files, cover art, titles, descriptions, tags, and other metadata you upload to the Service.</li>
              <li><strong style={{ color: 'var(--sp-white)' }}>Communications:</strong> messages you send to our support team and responses to surveys or feedback forms.</li>
            </ul>
          </SubSection>
          <SubSection title="2.2 Information We Collect Automatically">
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong style={{ color: 'var(--sp-white)' }}>Usage data:</strong> tracks played, duration listened, skips, likes, playlists created, searches performed, and other interactions with the Service.</li>
              <li><strong style={{ color: 'var(--sp-white)' }}>Device and technical data:</strong> device type, operating system, app version, browser type, IP address, approximate location (derived from IP), crash logs, and performance telemetry.</li>
              <li><strong style={{ color: 'var(--sp-white)' }}>Cookies and similar technologies:</strong> session cookies, authentication tokens, and analytics identifiers. See Section 9 below.</li>
            </ul>
          </SubSection>
          <SubSection title="2.3 Information from Third Parties">
            <p>We may receive information from third-party services you connect to Nashidify, such as social login providers (if enabled), payment processors, and app stores.</p>
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use personal information for the following purposes:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>to provide, operate, maintain, and improve the Service;</li>
            <li>to create and manage your account and authenticate you;</li>
            <li>to process subscriptions, payments, and refunds;</li>
            <li>to personalize content, recommendations, and search results, including through AI-powered recommendation systems;</li>
            <li>to communicate with you about your account, the Service, and updates;</li>
            <li>to provide customer support and respond to inquiries;</li>
            <li>to moderate User Content and enforce our Terms of Service;</li>
            <li>to detect, prevent, and address fraud, abuse, security incidents, and illegal activity;</li>
            <li>to comply with legal obligations and respond to lawful requests from authorities;</li>
            <li>to conduct analytics and research to improve the Service;</li>
            <li>for marketing and promotional communications, where permitted by law and subject to your consent where required.</li>
          </ul>
        </Section>

        <Section title="4. Legal Bases for Processing (GDPR / UK GDPR)">
          <p>If you are located in the European Economic Area, the United Kingdom, or Switzerland, we process your personal information under the following legal bases:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong style={{ color: 'var(--sp-white)' }}>Contract:</strong> to provide the Service you have requested and fulfill our obligations under the Terms of Service.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Consent:</strong> where you have given us specific consent (e.g., for marketing communications or certain cookies). You may withdraw consent at any time.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Legitimate interests:</strong> to improve and secure the Service, prevent fraud, and communicate with users, provided these interests are not overridden by your rights and freedoms.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Legal obligation:</strong> to comply with applicable laws and respond to lawful requests.</li>
          </ul>
        </Section>

        <Section title="5. Sharing and Disclosure">
          <p>We do not sell your personal information. We may share personal information in the following circumstances:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong style={{ color: 'var(--sp-white)' }}>Service providers:</strong> with vendors and processors who perform services on our behalf, including cloud hosting providers, payment processors (Stripe, Apple, Google), analytics providers, email delivery services, customer support tools, content delivery networks, and the DeepSeek AI service used to power recommendations and search. These providers are bound by confidentiality and data protection obligations.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Legal compliance:</strong> when required by law, court order, subpoena, or other valid legal process, or to protect the rights, property, or safety of Rkieh Productions Inc., our users, or the public.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Business transfers:</strong> in connection with a merger, acquisition, reorganization, sale of assets, or bankruptcy.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>With your consent:</strong> in any other circumstances where you have given us your consent.</li>
            <li><strong style={{ color: 'var(--sp-white)' }}>Public User Content:</strong> content you choose to publish publicly on the Service (such as uploaded tracks, public profile information, and public playlists) is visible to other users and may be indexed by search engines.</li>
          </ul>
        </Section>

        <Section title="6. International Data Transfers">
          <p>Rkieh Productions Inc. is based in Canada, and our servers are primarily hosted in the European Union. Your personal information may be transferred to, stored in, and processed in Canada, the European Union, the United States, and other countries where our service providers operate. When transferring personal data outside the European Economic Area or the United Kingdom, we rely on appropriate safeguards, including the European Commission's Standard Contractual Clauses and the adequacy decision for Canada (in respect of organizations subject to PIPEDA).</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain personal information for as long as your account is active and as necessary to provide the Service. Upon account deletion, we will delete or anonymize your personal information within a reasonable period, except where retention is required by law, for dispute resolution, to enforce our agreements, for legitimate backup purposes, or for a period of up to thirty (30) days to permit account recovery. Play event data used for analytics is retained for up to ninety (90) days in identifiable form, after which it may be aggregated or anonymized.</p>
        </Section>

        <Section title="8. Your Rights">
          <SubSection title="8.1 GDPR / UK GDPR Rights">
            <p>If you are located in the EEA or UK, you have the right to: (a) access your personal information; (b) correct inaccurate information; (c) request deletion; (d) restrict or object to processing; (e) data portability; (f) withdraw consent; and (g) lodge a complaint with your local data protection authority.</p>
          </SubSection>
          <SubSection title="8.2 PIPEDA (Canada)">
            <p>If you are located in Canada, you have the right to access and correct your personal information held by us, and to file a complaint with the Office of the Privacy Commissioner of Canada.</p>
          </SubSection>
          <SubSection title="8.3 CCPA / CPRA (California)">
            <p>If you are a California resident, you have the right to know what personal information we collect, to request deletion, to correct inaccurate information, to opt out of the "sale" or "sharing" of personal information (we do not sell personal information), and to non-discrimination for exercising your rights.</p>
          </SubSection>
          <SubSection title="8.4 How to Exercise Your Rights">
            <p>To exercise any of these rights, contact us at <a href="mailto:support@nashidify.com" style={{ color: 'var(--sp-green)' }}>support@nashidify.com</a>. We will respond within the timeframe required by applicable law. We may need to verify your identity before fulfilling your request.</p>
          </SubSection>
        </Section>

        <Section title="9. Cookies and Tracking">
          <p>We use cookies and similar technologies to keep you logged in, remember your preferences, analyze how the Service is used, and improve performance. You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of the Service.</p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>The Service is not directed to children under the age of thirteen (13), and we do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13 without parental consent, we will delete it. If you believe we have collected information from a child, please contact us.</p>
        </Section>

        <Section title="11. Security">
          <p>We implement industry-standard technical and organizational measures designed to protect your personal information, including encryption in transit, access controls, and secure password storage. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. Material changes will be notified through the Service or by email at least thirty (30) days before they take effect. Your continued use of the Service constitutes acceptance of the updated Policy.</p>
        </Section>

        <Section title="13. Contact Us">
          <p>For privacy questions, requests, or complaints, contact:</p>
          <p style={{ marginTop: '12px' }}>
            <strong style={{ color: 'var(--sp-white)' }}>Rkieh Productions Inc.</strong><br />
            Toronto, ON, Canada<br />
            Email: <a href="mailto:support@nashidify.com" style={{ color: 'var(--sp-green)' }}>support@nashidify.com</a>
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '12px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--sp-white)', marginBottom: '8px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
