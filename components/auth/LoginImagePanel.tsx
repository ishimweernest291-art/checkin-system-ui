import Image from "next/image";

/** Reference visual for staff sign-in; hidden on small screens so the form gets full width. */
export function LoginImagePanel() {
  return (
    <div className="relative hidden overflow-hidden rounded-3xl lg:block">
      <Image src="/welcome.png" alt="" fill priority className="object-cover" />
    </div>
  );
}
