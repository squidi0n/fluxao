import NewsletterDraftEditor from '@/components/admin/NewsletterDraftEditor';

interface EditDraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = await params;
  return <NewsletterDraftEditor draftId={id} />;
}
