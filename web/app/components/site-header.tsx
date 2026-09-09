import Link from "next/link";
import styles from "./site-header.module.css";

export default function SiteHeader({ current }: { current: "courses" | "profile" }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Learnsy home">learnsy<span aria-hidden="true">✳</span></Link>
      <nav aria-label="Main navigation">
        <Link href="/courses" aria-current={current === "courses" ? "page" : undefined}>For you</Link>
        <Link href="/profile" aria-current={current === "profile" ? "page" : undefined}>My profile</Link>
      </nav>
    </header>
  );
}
