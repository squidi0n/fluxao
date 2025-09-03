import { Metadata } from 'next';

import NewsletterTemplateEditor from '@/components/admin/NewsletterTemplateEditor';

export const metadata: Metadata = {
  title: 'Neues Newsletter Template - Admin - FluxAO',
};

export default function NewNewsletterTemplatePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Neues Newsletter Template</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Erstelle eine neue Vorlage für deine Newsletter
        </p>
      </div>

      <NewsletterTemplateEditor />
    </div>
  );
}
