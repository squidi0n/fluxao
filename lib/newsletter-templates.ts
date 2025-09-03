import { prisma } from './prisma';

export interface NewsletterTemplateData {
  title: string;
  content: string;
  posts?: any[];
  customContent?: string;
  preheader?: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'weekly' | 'announcement' | 'promotional';
  htmlContent: string;
  jsonContent?: any;
}

// DSGVO compliant email header and footer
const DSGVO_HEADER = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        table, td, div, h1, h2, h3, h4, h5, h6, p {
            margin: 0;
            padding: 0;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        table {
            border-collapse: collapse !important;
        }
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: #f4f4f7;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-body { background-color: #1a1a1a !important; }
            .email-container { background-color: #2d2d2d !important; color: #ffffff !important; }
            .email-header { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%) !important; }
            .content-section { background-color: #2d2d2d !important; color: #ffffff !important; }
        }
        
        /* Mobile responsiveness */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 10px !important;
            }
            .mobile-center {
                text-align: center !important;
            }
            .mobile-hide {
                display: none !important;
            }
            .mobile-full-width {
                width: 100% !important;
                display: block !important;
            }
            h1 { font-size: 28px !important; line-height: 36px !important; }
            h2 { font-size: 24px !important; line-height: 32px !important; }
            h3 { font-size: 20px !important; line-height: 28px !important; }
        }
    </style>
</head>
<body class="email-body" style="background-color: #f4f4f7; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <!-- Preheader (hidden but used by email clients) -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        {{PREHEADER}}
    </div>

    <!-- Email wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <!-- Main email container -->
                <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td class="email-header" style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 12px 12px 0 0; padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -1px;">
                                FluxAO Newsletter
                            </h1>
                            <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0; line-height: 1.5;">
                                Dein wöchentlicher Einblick in Tech, KI und digitale Trends
                            </p>
                        </td>
                    </tr>
`;

const DSGVO_FOOTER = `
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
                            <!-- Social Links -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; font-weight: 600;">
                                            Folge uns für mehr Updates
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="{{WEBSITE_URL}}" style="text-decoration: none;">
                                                        <img src="{{BASE_URL}}/images/newsletter/website-icon.png" alt="Website" width="32" height="32" style="display: block; border-radius: 6px;">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 10px;">
                                                    <a href="{{TWITTER_URL}}" style="text-decoration: none;">
                                                        <img src="{{BASE_URL}}/images/newsletter/twitter-icon.png" alt="Twitter" width="32" height="32" style="display: block; border-radius: 6px;">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 10px;">
                                                    <a href="{{LINKEDIN_URL}}" style="text-decoration: none;">
                                                        <img src="{{BASE_URL}}/images/newsletter/linkedin-icon.png" alt="LinkedIn" width="32" height="32" style="display: block; border-radius: 6px;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- DSGVO Compliance Section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 25px 0; padding: 20px; background-color: #e5e7eb; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 14px; font-weight: 600;">
                                            📋 Datenschutz & DSGVO Information
                                        </h4>
                                        <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 12px; line-height: 1.6;">
                                            <li style="margin: 0 0 8px 0;">Du erhältst diese E-Mail, weil du unserem Newsletter zugestimmt hast</li>
                                            <li style="margin: 0 0 8px 0;">Wir verwenden deine Daten nur für Newsletter-Versand und Analyse</li>
                                            <li style="margin: 0 0 8px 0;">Du kannst deine Zustimmung jederzeit widerrufen</li>
                                            <li style="margin: 0;">Weitere Infos in unserer <a href="{{PRIVACY_URL}}" style="color: #3b82f6;">Datenschutzerklärung</a></li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- Unsubscribe & Legal -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                                            FluxAO - Intelligente Inhalte für die digitale Zukunft<br>
                                            {{COMPANY_ADDRESS}}<br>
                                            Registriert: {{COMPANY_REGISTRATION}}
                                        </p>
                                        
                                        <!-- Action Buttons -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 15px auto 0 auto;">
                                            <tr>
                                                <td style="padding: 0 5px;">
                                                    <a href="{{UNSUBSCRIBE_URL}}" style="display: inline-block; padding: 8px 16px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">
                                                        Abmelden
                                                    </a>
                                                </td>
                                                <td style="padding: 0 5px;">
                                                    <a href="{{PREFERENCES_URL}}" style="display: inline-block; padding: 8px 16px; background-color: #6b7280; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">
                                                        Einstellungen
                                                    </a>
                                                </td>
                                                <td style="padding: 0 5px;">
                                                    <a href="{{PRIVACY_URL}}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">
                                                        Datenschutz
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Tracking Pixel -->
                                        <img src="{{TRACKING_PIXEL_URL}}" alt="" width="1" height="1" style="display: block; margin: 20px auto 0 auto;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Template for weekly newsletter
const WEEKLY_NEWSLETTER_TEMPLATE = `
                    <!-- Main Content -->
                    <tr>
                        <td class="content-section" style="padding: 40px 30px; background-color: #ffffff;">
                            <!-- Welcome Message -->
                            <div style="margin: 0 0 40px 0;">
                                <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 15px 0; line-height: 1.3;">
                                    {{TITLE}}
                                </h2>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
                                    {{INTRO_TEXT}}
                                </p>
                            </div>

                            {{CUSTOM_CONTENT}}

                            <!-- Featured Posts Section -->
                            {{#if posts}}
                            <div style="margin: 0 0 40px 0;">
                                <h3 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 25px 0; padding: 0 0 10px 0; border-bottom: 2px solid #e5e7eb;">
                                    📖 Neue Artikel diese Woche
                                </h3>
                                
                                {{#each posts}}
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                                    <tr>
                                        {{#if thumbnail}}
                                        <td width="120" style="padding: 0;">
                                            <img src="{{thumbnail}}" alt="{{title}}" width="120" height="80" style="display: block; width: 120px; height: 80px; object-fit: cover;">
                                        </td>
                                        {{/if}}
                                        <td style="padding: 20px; vertical-align: top;">
                                            <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.4;">
                                                <a href="{{url}}" style="color: #1f2937; text-decoration: none;">{{title}}</a>
                                            </h4>
                                            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                                                {{excerpt}}
                                            </p>
                                            <div style="display: flex; align-items: center; gap: 15px;">
                                                <span style="color: #9ca3af; font-size: 12px;">{{category}}</span>
                                                <span style="color: #9ca3af; font-size: 12px;">{{readTime}} Min. Lesezeit</span>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                {{/each}}

                                <!-- View All Posts CTA -->
                                <div style="text-align: center; margin: 30px 0 0 0;">
                                    <a href="{{WEBSITE_URL}}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                        Alle Artikel ansehen →
                                    </a>
                                </div>
                            </div>
                            {{/if}}

                            <!-- Quote/Tip Section -->
                            <div style="margin: 0 0 40px 0; padding: 25px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                                <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                                    💡 Tipp der Woche
                                </h3>
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">
                                    "{{WEEKLY_TIP}}"
                                </p>
                            </div>

                            <!-- Stats Section -->
                            <div style="margin: 0 0 40px 0; padding: 25px; background-color: #fef3c7; border-radius: 12px; border: 1px solid #fbbf24;">
                                <h3 style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                                    📊 FluxAO in Zahlen
                                </h3>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td width="50%" style="padding: 10px 0; text-align: center;">
                                            <div style="color: #92400e; font-size: 24px; font-weight: 700; margin: 0 0 5px 0;">{{TOTAL_ARTICLES}}</div>
                                            <div style="color: #a16207; font-size: 14px; font-weight: 500;">Artikel</div>
                                        </td>
                                        <td width="50%" style="padding: 10px 0; text-align: center;">
                                            <div style="color: #92400e; font-size: 24px; font-weight: 700; margin: 0 0 5px 0;">{{NEWSLETTER_SUBSCRIBERS}}</div>
                                            <div style="color: #a16207; font-size: 14px; font-weight: 500;">Abonnenten</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
`;

// Template for welcome newsletter
const WELCOME_NEWSLETTER_TEMPLATE = `
                    <!-- Main Content -->
                    <tr>
                        <td class="content-section" style="padding: 40px 30px; background-color: #ffffff;">
                            <!-- Welcome Message -->
                            <div style="margin: 0 0 40px 0; text-align: center;">
                                <h2 style="color: #1f2937; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.3;">
                                    Willkommen bei FluxAO! 🎉
                                </h2>
                                <p style="color: #6b7280; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
                                    Schön, dass du dabei bist! Hier ist dein Guide für den perfekten Start.
                                </p>
                            </div>

                            <!-- What to Expect -->
                            <div style="margin: 0 0 40px 0;">
                                <h3 style="color: #1f2937; font-size: 22px; font-weight: 600; margin: 0 0 25px 0; text-align: center;">
                                    Das erwartet dich:
                                </h3>
                                
                                <!-- Feature Grid -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td width="50%" style="padding: 20px; vertical-align: top;">
                                            <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; height: 100%;">
                                                <div style="font-size: 40px; margin: 0 0 15px 0;">🤖</div>
                                                <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">KI & Tech Insights</h4>
                                                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                                                    Die neuesten Entwicklungen in KI und Technologie, verständlich erklärt.
                                                </p>
                                            </div>
                                        </td>
                                        <td width="50%" style="padding: 20px; vertical-align: top;">
                                            <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; height: 100%;">
                                                <div style="font-size: 40px; margin: 0 0 15px 0;">📊</div>
                                                <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Datenanalyse</h4>
                                                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                                                    Spannende Einblicke in Trends und Datenanalyse für deine Projekte.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%" style="padding: 20px; vertical-align: top;">
                                            <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; height: 100%;">
                                                <div style="font-size: 40px; margin: 0 0 15px 0;">🎨</div>
                                                <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Design & UX</h4>
                                                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                                                    Moderne Design-Prinzipien und User Experience Best Practices.
                                                </p>
                                            </div>
                                        </td>
                                        <td width="50%" style="padding: 20px; vertical-align: top;">
                                            <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; height: 100%;">
                                                <div style="font-size: 40px; margin: 0 0 15px 0;">💡</div>
                                                <h4 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Praktische Tipps</h4>
                                                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                                                    Sofort umsetzbare Tipps für deine tägliche Arbeit.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- First Steps -->
                            <div style="margin: 0 0 40px 0; padding: 30px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px;">
                                <h3 style="color: #1e40af; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                                    🚀 Deine ersten Schritte
                                </h3>
                                <ol style="color: #1e3a8a; font-size: 16px; line-height: 1.8; margin: 0; padding: 0 0 0 25px;">
                                    <li style="margin: 0 0 10px 0;"><strong>Profil vervollständigen:</strong> <a href="{{PROFILE_URL}}" style="color: #1e40af;">Hier klicken</a> um dein Profil zu personalisieren</li>
                                    <li style="margin: 0 0 10px 0;"><strong>Newsletter-Einstellungen:</strong> <a href="{{PREFERENCES_URL}}" style="color: #1e40af;">Anpassen</a> wie oft du von uns hörst</li>
                                    <li style="margin: 0 0 10px 0;"><strong>Erste Artikel entdecken:</strong> Stöbere in unseren <a href="{{WEBSITE_URL}}" style="color: #1e40af;">neuesten Inhalten</a></li>
                                    <li style="margin: 0;"><strong>Community beitreten:</strong> Folge uns auf <a href="{{SOCIAL_URL}}" style="color: #1e40af;">Social Media</a></li>
                                </ol>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="{{WEBSITE_URL}}" style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);">
                                    FluxAO jetzt entdecken! 🚀
                                </a>
                            </div>
                        </td>
                    </tr>
`;

// Template for announcement newsletter
const ANNOUNCEMENT_NEWSLETTER_TEMPLATE = `
                    <!-- Main Content -->
                    <tr>
                        <td class="content-section" style="padding: 40px 30px; background-color: #ffffff;">
                            <!-- Announcement Header -->
                            <div style="margin: 0 0 40px 0; text-align: center; padding: 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; border: 2px solid #f59e0b;">
                                <div style="font-size: 60px; margin: 0 0 20px 0;">📢</div>
                                <h2 style="color: #92400e; font-size: 28px; font-weight: 700; margin: 0 0 15px 0; line-height: 1.3;">
                                    {{TITLE}}
                                </h2>
                                <p style="color: #a16207; font-size: 18px; line-height: 1.6; margin: 0;">
                                    {{SUBTITLE}}
                                </p>
                            </div>

                            <!-- Announcement Content -->
                            <div style="margin: 0 0 40px 0;">
                                {{ANNOUNCEMENT_CONTENT}}
                            </div>

                            <!-- Key Points -->
                            <div style="margin: 0 0 40px 0; padding: 25px; background-color: #f0f9ff; border-radius: 12px; border-left: 4px solid #0ea5e9;">
                                <h3 style="color: #0c4a6e; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                                    ✨ Die wichtigsten Punkte auf einen Blick:
                                </h3>
                                <ul style="color: #075985; font-size: 16px; line-height: 1.8; margin: 0; padding: 0 0 0 25px;">
                                    {{#each keyPoints}}
                                    <li style="margin: 0 0 10px 0;">{{this}}</li>
                                    {{/each}}
                                </ul>
                            </div>

                            <!-- Action Required (if any) -->
                            {{#if actionRequired}}
                            <div style="margin: 0 0 40px 0; padding: 25px; background-color: #fef2f2; border-radius: 12px; border: 2px solid #ef4444;">
                                <h3 style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                                    ⚠️ Handlungsbedarf
                                </h3>
                                <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6; margin: 0;">
                                    {{actionRequired}}
                                </p>
                            </div>
                            {{/if}}

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="{{CTA_URL}}" style="display: inline-block; padding: 18px 35px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);">
                                    {{CTA_TEXT}}
                                </a>
                            </div>
                        </td>
                    </tr>
`;

export const NEWSLETTER_TEMPLATES = {
  weekly: WEEKLY_NEWSLETTER_TEMPLATE,
  welcome: WELCOME_NEWSLETTER_TEMPLATE,
  announcement: ANNOUNCEMENT_NEWSLETTER_TEMPLATE,
  promotional: WEEKLY_NEWSLETTER_TEMPLATE, // Can reuse weekly for promotional
};

/**
 * Generate complete newsletter HTML with DSGVO compliance
 */
export function generateNewsletterHTML(
  templateType: 'weekly' | 'welcome' | 'announcement' | 'promotional',
  data: NewsletterTemplateData,
  variables: Record<string, any> = {}
): string {
  const template = NEWSLETTER_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Template type "${templateType}" not found`);
  }

  // Default variables
  const defaultVariables = {
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com',
    WEBSITE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com',
    PRIVACY_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com'}/privacy`,
    PREFERENCES_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com'}/newsletter/preferences`,
    PROFILE_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fluxao.com'}/profile`,
    COMPANY_ADDRESS: 'FluxAO GmbH, Musterstraße 123, 10115 Berlin, Deutschland',
    COMPANY_REGISTRATION: 'HRB 123456 B',
    TWITTER_URL: 'https://twitter.com/fluxao',
    LINKEDIN_URL: 'https://linkedin.com/company/fluxao',
    PREHEADER: data.preheader || 'Dein wöchentlicher FluxAO Newsletter',
    ...variables,
  };

  // Combine header, template, and footer
  let html = DSGVO_HEADER + template + DSGVO_FOOTER;

  // Replace template variables
  Object.entries(defaultVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, String(value));
  });

  // Replace data variables
  html = html.replace(/\{\{TITLE\}\}/g, data.title);
  html = html.replace(/\{\{INTRO_TEXT\}\}/g, data.content);
  html = html.replace(/\{\{CUSTOM_CONTENT\}\}/g, data.customContent || '');

  return html;
}

/**
 * Create default newsletter templates in database
 */
export async function createDefaultTemplates() {
  const templates = [
    {
      name: 'Weekly Newsletter',
      slug: 'weekly-newsletter',
      description: 'Wöchentlicher Newsletter mit neuesten Artikeln und Updates',
      category: 'weekly' as const,
      htmlContent: generateNewsletterHTML('weekly', {
        title: '{{TITLE}}',
        content: '{{INTRO_TEXT}}',
        customContent: '{{CUSTOM_CONTENT}}',
      }),
      isDefault: true,
    },
    {
      name: 'Welcome Email',
      slug: 'welcome-email',
      description: 'Begrüßungsmail für neue Abonnenten',
      category: 'welcome' as const,
      htmlContent: generateNewsletterHTML('welcome', {
        title: 'Willkommen!',
        content: 'Schön, dass du dabei bist!',
      }),
      isDefault: true,
    },
    {
      name: 'Announcement',
      slug: 'announcement',
      description: 'Template für wichtige Ankündigungen',
      category: 'announcement' as const,
      htmlContent: generateNewsletterHTML('announcement', {
        title: '{{TITLE}}',
        content: '{{ANNOUNCEMENT_CONTENT}}',
      }),
      isDefault: false,
    },
    {
      name: 'Promotional',
      slug: 'promotional',
      description: 'Template für Promotionen und Angebote',
      category: 'promotional' as const,
      htmlContent: generateNewsletterHTML('promotional', {
        title: '{{TITLE}}',
        content: '{{PROMO_CONTENT}}',
      }),
      isDefault: false,
    },
  ];

  const createdTemplates = [];
  for (const template of templates) {
    try {
      const existing = await prisma.newsletterTemplate.findUnique({
        where: { slug: template.slug }
      });

      if (!existing) {
        const created = await prisma.newsletterTemplate.create({
          data: template
        });
        createdTemplates.push(created);
      }
    } catch (error) {
      console.error(`Failed to create template ${template.slug}:`, error);
    }
  }

  return createdTemplates;
}

/**
 * Get template by slug with fallback
 */
export async function getTemplate(slug: string) {
  const template = await prisma.newsletterTemplate.findUnique({
    where: { slug }
  });

  if (!template) {
    // Return default weekly template
    return {
      id: 'default-weekly',
      name: 'Default Weekly Newsletter',
      htmlContent: generateNewsletterHTML('weekly', {
        title: '{{TITLE}}',
        content: '{{INTRO_TEXT}}',
      }),
      category: 'weekly'
    };
  }

  return template;
}