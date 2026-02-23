import ProfilePage from './client-page';

export function generateStaticParams() {
  return [{ username: '_' }];
}

export default function Page() {
  return <ProfilePage />;
}
