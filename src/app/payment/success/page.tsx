import { Suspense } from "react";
import PaymentSuccessContent from "./PaymentSuccessContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}