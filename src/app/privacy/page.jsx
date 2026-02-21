
export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <div className="space-y-4 text-muted-foreground prose">
          <p>
            This app collects only basic information required to create and manage your account, such name, contact details, and usage activity. We do not collect unnecessary personal data.
          </p>
          <p>
            Your information is used only to operate and improve the app, connect users for barter, and ensure basic safety. We do not sell or share your personal data with third parties, except when required by law.
          </p>
          <p>
            We take reasonable steps to protect your data, but we cannot guarantee complete security. By using this app, you agree to this Privacy Policy and understand that you use the app at your own risk.
          </p>
        </div>
      </div>
    </div>
  );
}
