
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <div className="prose text-muted-foreground mx-auto">
            <p>
                Have questions or feedback? We'd love to hear from you. Reach out to our team.
            </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-4">
            <Mail className="h-5 w-5 text-primary" />
            <a href="mailto:swapcircle9@gmail.com" className="text-lg font-medium text-primary hover:underline">
                swapcircle9@gmail.com
            </a>
        </div>
      </div>
    </div>
  );
}
