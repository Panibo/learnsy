import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Welcome to the Home Page</h1>
      <Link href="/profile">Create your professional profile →</Link>
    </main>
  );
}
