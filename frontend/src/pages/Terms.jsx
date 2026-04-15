import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
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
        Terms of Service
      </h1>
      <p style={{ color: 'var(--sp-text-sub)', marginBottom: '32px', fontSize: '13px' }}>
        Effective Date: April 14, 2026 · Last Updated: April 14, 2026
      </p>

      <div style={{ color: 'var(--sp-text-sub)' }}>
        <p>
          These Terms of Service ("Terms") form a legally binding agreement between you ("you" or "User") and Rkieh Productions Inc., a corporation federally incorporated under the laws of Canada, with its registered office at Toronto, Ontario, Canada ("Rkieh Productions", "Nashidify", "we", "us", or "our"). These Terms govern your access to and use of the Nashidify website, mobile applications (iOS and Android), and all related services (collectively, the "Service").
        </p>
        <p style={{ marginTop: '16px', fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>
          BY CREATING AN ACCOUNT, ACCESSING, DOWNLOADING, OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY. IF YOU DO NOT AGREE, DO NOT USE THE SERVICE.
        </p>

        <Section title="1. About Nashidify">
          <p>Nashidify is an audio streaming platform designed for the global Muslim community, offering nasheeds, Qur'an recitations, Islamic lectures, podcasts, and related audio content. The Service is operated by Rkieh Productions Inc. from Toronto, Ontario, Canada. Our iOS and Android applications are distributed through the Apple App Store and Google Play under the Rkieh Productions Inc. developer account.</p>
        </Section>

        <Section title="2. Eligibility and Accounts">
          <SubSection title="2.1 Minimum Age">
            <p>You must be at least thirteen (13) years of age to create an account and use the Service. If you are under the age of majority in your jurisdiction of residence, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf. We reserve the right to request proof of age or parental consent at any time.</p>
          </SubSection>
          <SubSection title="2.2 Account Registration">
            <p>To access certain features, you must register for an account and provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or security breach.</p>
          </SubSection>
          <SubSection title="2.3 Account Suspension and Termination">
            <p>We reserve the right, at our sole discretion and without prior notice, to suspend, restrict, or terminate your account for any reason, including but not limited to violation of these Terms, suspected fraud, abuse, infringement of third-party rights, or conduct we deem harmful to the Service or other users.</p>
          </SubSection>
        </Section>

        <Section title="3. Subscriptions, Billing, and Payments">
          <SubSection title="3.1 Subscription Tiers">
            <p>Nashidify offers both a free tier and paid subscription tiers. The features, limitations, and pricing of each tier are described on our pricing page, which is incorporated into these Terms by reference. We reserve the right to modify pricing, features, and tier structures at any time, with reasonable notice provided to active subscribers.</p>
          </SubSection>
          <SubSection title="3.2 Billing and Auto-Renewal">
            <p>Paid subscriptions are billed in advance on a monthly or annual basis through Stripe or the relevant app store (Apple App Store or Google Play). Unless you cancel before the end of the current billing period, your subscription will automatically renew at the then-current rate. You authorize us (and our payment processors) to charge your payment method on each renewal date.</p>
          </SubSection>
          <SubSection title="3.3 Cancellation">
            <p>You may cancel your subscription at any time through your account settings or through the app store where you subscribed. Cancellation takes effect at the end of the current billing period. You will continue to have access to paid features until the end of that period.</p>
          </SubSection>
          <SubSection title="3.4 Refunds">
            <p>Except where required by applicable law (including the statutory withdrawal or cooling-off rights available to consumers in the European Union, the United Kingdom, and certain other jurisdictions), all subscription fees are non-refundable. Subscriptions purchased through the Apple App Store or Google Play are subject to the refund policies of those platforms, and we have no control over refund decisions made by Apple or Google.</p>
          </SubSection>
          <SubSection title="3.5 Free Trials">
            <p>From time to time we may offer free trials. You must cancel before the end of the trial period to avoid being charged. Only one free trial per user is permitted; we reserve the right to withhold trials from users who abuse this policy.</p>
          </SubSection>
          <SubSection title="3.6 Taxes">
            <p>All fees are stated exclusive of applicable taxes. You are responsible for any sales tax, VAT, GST, HST, or other taxes imposed on your subscription.</p>
          </SubSection>
        </Section>

        <Section title="4. User-Generated Content">
          <SubSection title="4.1 Uploads by Users">
            <p>Certain features of the Service allow registered users — including users on Artist and Artist Pro tiers — to upload, submit, publish, or otherwise make available audio recordings, metadata, artwork, descriptions, and other materials (collectively, "User Content"). You retain ownership of the intellectual property rights in your User Content, subject to the license you grant us below.</p>
          </SubSection>
          <SubSection title="4.2 Your Representations and Warranties">
            <p>By uploading User Content, you represent, warrant, and covenant that: (a) you are the sole owner of the User Content, or you have obtained all necessary rights, licenses, consents, permissions, releases, and authorizations from the owners of any copyrights, neighbouring rights, trademarks, publicity rights, moral rights, or other intellectual property or proprietary rights contained in the User Content; (b) the User Content does not and will not infringe, misappropriate, or violate the rights of any third party; (c) the User Content complies with all applicable laws and with these Terms; (d) you have paid or will pay in full any royalties, fees, residuals, or other compensation owed to any person or entity in connection with the User Content; and (e) you are not subject to any contractual or legal restriction that would prevent you from granting the license below.</p>
          </SubSection>
          <SubSection title="4.3 License Grant to Nashidify">
            <p>By uploading User Content, you grant Rkieh Productions Inc. a worldwide, non-exclusive, royalty-free, fully paid-up, sublicensable, and transferable license to host, store, cache, reproduce, transcode, adapt, modify (for technical purposes such as format conversion and quality optimization), publish, publicly perform, publicly display, stream, distribute, and otherwise use the User Content in connection with the operation, provision, marketing, promotion, and improvement of the Service, including in advertisements, promotional materials, playlists, social media posts, trailers, and featured content across any medium now known or hereafter developed. This license continues for as long as the User Content is stored on our systems and for a reasonable period thereafter as necessary to operate the Service.</p>
            <p style={{ marginTop: '12px' }}>This license does not grant us ownership of your User Content, and you remain free to distribute your User Content through other channels. You may remove your User Content from the Service at any time through your account settings; however, the license granted above will survive to the extent necessary to allow copies incorporated into cached, backup, or archived versions of the Service to continue to exist, and to the extent that your User Content has already been incorporated into promotional materials or shared playlists prior to removal.</p>
          </SubSection>
          <SubSection title="4.4 Feedback">
            <p>Any suggestions, ideas, or feedback you provide about the Service may be used by us without any obligation or compensation to you.</p>
          </SubSection>
        </Section>

        <Section title="5. Content Moderation and Safe Harbor">
          <SubSection title="5.1 Nashidify as a Hosting Provider">
            <p>Rkieh Productions Inc. operates Nashidify as a neutral hosting provider and online intermediary. We do not pre-screen all User Content before it becomes available on the Service, and we do not endorse, guarantee, or assume responsibility for the accuracy, legality, or quality of User Content. Nashidify claims the full protections available to hosting providers and intermediaries under: (a) section 31.1 of the Copyright Act (Canada) and Canada's notice-and-notice regime; (b) section 512(c) of the United States Digital Millennium Copyright Act; (c) the European Union Digital Services Act (Regulation (EU) 2022/2065) and any applicable national implementing legislation; and (d) analogous safe harbor provisions in other jurisdictions where the Service is made available.</p>
          </SubSection>
          <SubSection title="5.2 Our Moderation Process">
            <p>We employ a multi-layered content review process that includes: (a) automated scanning of uploaded audio and metadata for known infringing material, prohibited content, and technical compliance; (b) manual human review of flagged or borderline uploads by our moderation team; and (c) post-publication community reporting, allowing users to flag content for review after it has become available on the Service. While we make reasonable efforts to detect and remove prohibited content, we cannot guarantee that every upload will be reviewed before publication or that all infringing or prohibited content will be detected. Some content may slip through initial review layers and remain on the Service until identified through subsequent review or community reports.</p>
          </SubSection>
          <SubSection title="5.3 No Liability for User Content">
            <p style={{ fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>TO THE FULLEST EXTENT PERMITTED BY LAW, RKIEH PRODUCTIONS INC. IS NOT LIABLE FOR USER CONTENT UPLOADED, POSTED, OR MADE AVAILABLE BY USERS OR THIRD PARTIES.</p>
            <p style={{ marginTop: '8px' }}>The User who uploads content bears sole and exclusive responsibility for that content, including any claims of copyright infringement, defamation, invasion of privacy, violation of publicity rights, obscenity, hate speech, or any other legal violation arising out of or related to that content. You expressly release Rkieh Productions Inc., its officers, directors, employees, contractors, and affiliates from any and all claims, demands, and damages arising out of User Content uploaded by you or by any other User.</p>
          </SubSection>
          <SubSection title="5.4 Right to Remove Content">
            <p>We reserve the right — but have no obligation — to review, monitor, remove, refuse, edit, restrict access to, or disable any User Content at any time, in our sole discretion, with or without notice, including where we believe content violates these Terms, applicable law, or is otherwise objectionable. Removal of content does not create any liability on our part, nor does failure to remove content constitute approval or endorsement of that content.</p>
          </SubSection>
          <SubSection title="5.5 Takedown Timeline">
            <p>Upon receiving a valid notice of infringement or a valid report of prohibited content, we will act promptly to review and, where appropriate, remove or disable access to the content in question, typically within seventy-two (72) hours of receipt, though timelines may vary based on the complexity of the claim and the volume of notices received.</p>
          </SubSection>
        </Section>

        <Section title="6. Copyright Infringement Notices">
          <SubSection title="6.1 Notice and Takedown (DMCA / Notice-and-Notice)">
            <p>If you are a copyright owner or an agent thereof and believe that any User Content on the Service infringes your copyrights, you may submit a notification by contacting us at copyright@nashidify.com. Your notice must include: (a) a physical or electronic signature of the copyright owner or authorized agent; (b) identification of the copyrighted work claimed to be infringed; (c) identification of the material claimed to be infringing, with sufficient detail to enable us to locate it; (d) your contact information; (e) a statement that you have a good-faith belief that the use is not authorized; and (f) a statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.</p>
          </SubSection>
          <SubSection title="6.2 Counter-Notice">
            <p>If you believe your User Content was removed in error, you may submit a counter-notice containing the information required under section 512(g) of the DMCA. Upon receipt of a valid counter-notice, we may restore the content unless the original complainant files a court action within the timeframe required by law.</p>
          </SubSection>
          <SubSection title="6.3 Repeat Infringer Policy">
            <p>We will terminate the accounts of users who are determined, in our sole discretion, to be repeat infringers. A user who receives three (3) substantiated infringement notices within any twelve (12) month period will be considered a repeat infringer and subject to account termination and forfeiture of any unused paid subscription amounts.</p>
          </SubSection>
        </Section>

        <Section title="7. Prohibited Content and Conduct">
          <p>You agree not to upload, post, or otherwise make available through the Service any content that:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>infringes any copyright, trademark, neighbouring rights, publicity rights, privacy rights, or other intellectual property or proprietary right of any third party;</li>
            <li>misrepresents authentic Islamic teachings, or is deliberately sectarian, inflammatory, or designed to incite discord within the Muslim community;</li>
            <li>constitutes hate speech, harassment, threats, or incitement to violence against any person or group, including on the basis of religion, ethnicity, nationality, gender, sexual orientation, or disability;</li>
            <li>contains explicit, pornographic, obscene, or otherwise haram material, or material inappropriate for a family-friendly Islamic platform;</li>
            <li>is false, misleading, deceptive, defamatory, or constitutes misinformation or disinformation;</li>
            <li>contains malware, viruses, worms, trojans, or any other malicious code;</li>
            <li>impersonates any person or entity, or falsely states or misrepresents your affiliation with any person or entity;</li>
            <li>consists of Qur'an recitations, lectures, or other recordings uploaded without the express permission of the reciter, speaker, or original rights holder;</li>
            <li>violates any applicable local, national, or international law or regulation;</li>
            <li>is intended to scrape, harvest, or collect data from the Service or its users;</li>
            <li>attempts to interfere with, compromise, reverse-engineer, or circumvent the security, functionality, or access controls of the Service.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>You further agree not to use the Service to engage in any activity that would subject Rkieh Productions Inc. to liability or regulatory action.</p>
        </Section>

        <Section title="8. Intellectual Property of Nashidify">
          <p>Except for User Content, the Service and all of its content, features, and functionality — including the Nashidify name, logo, brand, trademarks, software, source code, designs, text, graphics, images, audio, video, interfaces, databases, and the selection, arrangement, and presentation thereof — are owned by Rkieh Productions Inc. or its licensors and are protected by copyright, trademark, trade secret, and other intellectual property laws. No rights are granted to you by implication, estoppel, or otherwise except as expressly set out in these Terms.</p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>The Service may integrate with or link to third-party services, including Stripe (for payment processing), Apple App Store and Google Play (for app distribution and in-app purchases), DeepSeek (for AI-powered recommendations and search), cloud hosting providers, and analytics providers. Your use of such third-party services is governed by the respective terms and privacy policies of those third parties, and Rkieh Productions Inc. is not responsible for their acts, omissions, or practices.</p>
        </Section>

        <Section title="10. Termination">
          <SubSection title="10.1 Termination by You">
            <p>You may terminate your account at any time by following the deletion process in your account settings or by contacting support.</p>
          </SubSection>
          <SubSection title="10.2 Termination by Us">
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms.</p>
          </SubSection>
          <SubSection title="10.3 Effect of Termination">
            <p>Upon termination, your right to use the Service will cease immediately. Your User Content may be retained for up to thirty (30) days following termination, after which it may be permanently deleted, except where retention is required by law, by an ongoing legal dispute, or for legitimate backup purposes. Terminated users forfeit any unused subscription time and any pending artist payouts, tips, or revenues where termination results from a breach of these Terms, fraud, or copyright infringement. Sections of these Terms that by their nature should survive termination (including Sections 4.3, 5.3, 8, 11, 12, 13, and 14) shall survive.</p>
          </SubSection>
        </Section>

        <Section title="11. Disclaimers">
          <p style={{ fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, RKIEH PRODUCTIONS INC. DISCLAIMS ALL WARRANTIES, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT ANY DEFECTS WILL BE CORRECTED.</p>
          <p style={{ marginTop: '12px', fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>WE MAKE NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY, RELIABILITY, COMPLETENESS, OR LEGALITY OF USER CONTENT OR ANY CONTENT AVAILABLE THROUGH THE SERVICE.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p style={{ fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RKIEH PRODUCTIONS INC., ITS DIRECTORS, OFFICERS, EMPLOYEES, CONTRACTORS, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          <p style={{ marginTop: '12px', fontWeight: 600, color: 'var(--sp-white)', fontSize: '13px' }}>IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY OF RKIEH PRODUCTIONS INC. ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED CANADIAN DOLLARS (CAD $100).</p>
          <p style={{ marginTop: '12px' }}>Some jurisdictions do not allow the exclusion or limitation of certain damages, so the above limitations may not apply to you in full. Nothing in these Terms limits liability for fraud, willful misconduct, or any liability that cannot be excluded under applicable law.</p>
        </Section>

        <Section title="13. Indemnification">
          <p>You agree to defend, indemnify, and hold harmless Rkieh Productions Inc. and its directors, officers, employees, contractors, agents, licensors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to: (a) your User Content; (b) your use of or inability to use the Service; (c) your violation of these Terms; (d) your violation of any third-party right, including any intellectual property, publicity, or privacy right; or (e) any claim that your User Content caused damage to a third party.</p>
        </Section>

        <Section title="14. Governing Law and Dispute Resolution">
          <p>These Terms and any dispute arising out of or related to them or the Service shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of laws principles. You irrevocably agree that the courts of Toronto, Ontario shall have exclusive jurisdiction to settle any dispute arising out of or in connection with these Terms or the Service, and you waive any objection to such jurisdiction on the grounds of venue or forum non conveniens.</p>
          <p style={{ marginTop: '12px' }}>The United Nations Convention on Contracts for the International Sale of Goods does not apply to these Terms.</p>
        </Section>

        <Section title="15. Apple App Store and Google Play Additional Terms">
          <SubSection title="15.1 Apple App Store">
            <p>If you download the Nashidify iOS application from the Apple App Store, you acknowledge and agree that: (a) these Terms are concluded between you and Rkieh Productions Inc. only, and not with Apple Inc. ("Apple"); (b) Rkieh Productions Inc., and not Apple, is solely responsible for the Service and its content; (c) Apple has no obligation to provide maintenance or support services for the Service; (d) in the event of any failure of the Service to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price (if any) for the application; to the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the Service; (e) Apple is not responsible for addressing any claims by you or any third party relating to the Service; (f) Apple is not responsible for the investigation, defense, settlement, or discharge of any third-party intellectual property infringement claim relating to the Service; (g) you represent that you are not located in a country subject to a U.S. government embargo or designated as a "terrorist supporting" country, and you are not listed on any U.S. government list of prohibited or restricted parties; and (h) Apple and its subsidiaries are third-party beneficiaries of these Terms, and upon your acceptance, Apple will have the right (and will be deemed to have accepted the right) to enforce these Terms against you.</p>
          </SubSection>
          <SubSection title="15.2 Google Play">
            <p>If you download the Nashidify Android application from Google Play, your use of the application is also subject to the Google Play Terms of Service. Rkieh Productions Inc. is solely responsible for the application; Google Inc. has no responsibility for the application or these Terms.</p>
          </SubSection>
        </Section>

        <Section title="16. Changes to These Terms">
          <p>We may modify these Terms at any time. If we make material changes, we will provide notice through the Service, by email, or by other reasonable means at least thirty (30) days before the changes take effect. Your continued use of the Service after changes take effect constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Service.</p>
        </Section>

        <Section title="17. Miscellaneous">
          <SubSection title="17.1 Entire Agreement">
            <p>These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and Rkieh Productions Inc. regarding the Service and supersede all prior agreements and understandings.</p>
          </SubSection>
          <SubSection title="17.2 Severability">
            <p>If any provision of these Terms is held to be invalid or unenforceable, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
          </SubSection>
          <SubSection title="17.3 No Waiver">
            <p>No failure or delay by us in exercising any right under these Terms shall constitute a waiver of that right.</p>
          </SubSection>
          <SubSection title="17.4 Assignment">
            <p>You may not assign or transfer these Terms or any rights hereunder without our prior written consent. We may assign these Terms freely.</p>
          </SubSection>
          <SubSection title="17.5 Language">
            <p>These Terms are made available in English and Arabic. In the event of any conflict or inconsistency between the English and Arabic versions, the English version shall prevail.</p>
          </SubSection>
          <SubSection title="17.6 Force Majeure">
            <p>We shall not be liable for any delay or failure in performance caused by circumstances beyond our reasonable control.</p>
          </SubSection>
        </Section>

        <Section title="18. Contact">
          <p>For questions, notices, or complaints regarding these Terms or the Service, please contact:</p>
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
