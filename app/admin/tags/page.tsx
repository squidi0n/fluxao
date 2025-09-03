import { Metadata } from 'next';

import TagsManagement from '@/components/admin/TagsManagement';

export const metadata: Metadata = {
  title: 'Tags verwalten - Admin',
};

export default function TagsPage() {
  return (
    <div className="p-6">
      <TagsManagement />
    </div>
  );
}
