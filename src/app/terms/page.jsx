
export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms & Services</h1>
        <div className="space-y-4 text-muted-foreground prose">
          <p>
            This app only provides a platform for users to connect and exchange goods or services through a barter system. We do not participate in, control, or verify any trade between users.
          </p>
          <p>
            We are not responsible for the quality, safety, legality, or outcome of any items, services, or interactions. All users trade at their own risk and are responsible for verifying the other person before completing any exchange.
          </p>
          <p>
            Any dispute, loss, or issue is strictly between the users involved. By using this app, you agree to these terms and accept full responsibility for your actions.
          </p>
        </div>
      </div>
    </div>
  );
}
