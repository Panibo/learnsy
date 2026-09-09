"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { emptyProfile, loadProfile, profileStore, type Profile } from "./storage";
import styles from "./page.module.css";

const suggestions = ["Artificial intelligence", "Data & analytics", "Leadership", "Business", "Design", "Technology", "Sustainability"];

function linkedinUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^(www\.)?linkedin\.com$/.test(url.hostname) && /^\/in\/[^/]+\/?$/.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [interest, setInterest] = useState("");
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cvError, setCvError] = useState("");
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let active = true;
    loadProfile().then(({ profile: saved, needsMigration }) => {
      if (!active) return;
      if (saved) setProfile(saved);
      setDirty(needsMigration);
      setMessage(needsMigration ? "Your previous local profile is ready. Save it to store it in the database." : "");
      setLoadFailed(false);
      setError("");
      setReady(true);
    }).catch((error: unknown) => {
      if (!active) return;
      setLoadFailed(true);
      setError(error instanceof Error ? error.message : "Your profile could not be loaded. Please try again.");
    });
    return () => { active = false; };
  }, [loadAttempt]);


  useEffect(() => {
    if (!profile.cv) return;
    const url = URL.createObjectURL(profile.cv);
    if (downloadRef.current) downloadRef.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [profile.cv]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
    setError("");
  }

  function addInterest(value: string) {
    const cleaned = value.trim();
    if (!cleaned || profile.interests.some((item) => item.toLowerCase() === cleaned.toLowerCase())) return;
    update("interests", [...profile.interests, cleaned]);
    setInterest("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile.linkedin && !linkedinUrl(profile.linkedin)) {
      setError("Enter a LinkedIn profile URL such as https://www.linkedin.com/in/your-name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const next = { ...profile, name: profile.name.trim(), email: profile.email.trim() };
      if (!next.name) { setError("Please enter your full name."); return; }
      if (interest.trim() && !next.interests.some((item) => item.toLowerCase() === interest.trim().toLowerCase())) {
        next.interests = [...next.interests, interest.trim()];
      }
      await profileStore(next);
      setProfile(next);
      setInterest("");
      setDirty(false);
      setMessage("Profile saved to the database.");
    } catch (error: unknown) { setError(error instanceof Error ? error.message : "Your profile could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  const completed = [profile.name.trim() && profile.email.trim(), profile.role.trim(), profile.interests.length, profile.goals.trim(), profile.linkedin && linkedinUrl(profile.linkedin), profile.cv].filter(Boolean).length;
  const progress = Math.round(completed / 6 * 100);
  const linkedin = linkedinUrl(profile.linkedin);

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <Link href="/" className={styles.brand}>learnsy<span>✳</span></Link>
        <nav aria-label="Main navigation"><Link href="/courses">Courses</Link><Link href="/profile" aria-current="page">My profile</Link></nav>
      </header>
      <main className={styles.main}>
        <div className={styles.heading}><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>My professional profile</h1><p>A little about you. A clearer path to what’s next.</p></div>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.summary}>
              <div className={styles.avatar} aria-hidden="true">{profile.name.trim() ? profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "↗"}</div>
              <h2>{profile.name || "Your profile"}</h2><p>{profile.role || "Your next step starts here"}</p>
              {profile.organization && <small>{profile.organization}</small>}
              <div className={styles.progressLabel}><span>Profile completeness</span><strong>{progress}%</strong></div>
              <progress value={progress} max={100} aria-label="Profile completeness" />
              <p className={styles.hint}>Add your background and interests to prepare for more relevant course recommendations.</p>
            </div>
            <div className={styles.note}><span className="eyebrow">BUILT AROUND YOU</span><h3>Make room for growth.</h3><p>Your experience tells us where you are. Your interests and goals tell us where you want to go.</p></div>
          </aside>
          <form onSubmit={save}>
            <fieldset disabled={!ready || saving} className={styles.formFields}>
              <section className={styles.card} aria-labelledby="basic-heading">
                <div className={styles.sectionHeading}><span className={styles.number}>01</span><div><h2 id="basic-heading">The essentials</h2><p>Introduce yourself and your professional background.</p></div></div>
                <div className={styles.grid}>
                  <div><label htmlFor="name">Full name <span>*</span></label><input id="name" autoComplete="name" required maxLength={120} value={profile.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" /></div>
                  <div><label htmlFor="email">Email address <span>*</span></label><input id="email" type="email" autoComplete="email" required maxLength={254} value={profile.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></div>
                  <div><label htmlFor="role">Current role or field of study</label><input id="role" autoComplete="organization-title" maxLength={160} value={profile.role} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Product designer" /></div>
                  <div><label htmlFor="organization">Organization or school</label><input id="organization" autoComplete="organization" maxLength={160} value={profile.organization} onChange={(e) => update("organization", e.target.value)} placeholder="Where you work or study" /></div>
                  <div className={styles.full}><label htmlFor="location">Location</label><input id="location" autoComplete="address-level2" maxLength={160} value={profile.location} onChange={(e) => update("location", e.target.value)} placeholder="City, country" /></div>
                  <div className={styles.full}><label htmlFor="bio">About you</label><textarea id="bio" maxLength={2000} value={profile.bio} onChange={(e) => update("bio", e.target.value)} placeholder="A short introduction to your experience, skills, and background…" /></div>
                </div>
              </section>
              <section className={styles.card} aria-labelledby="interest-heading">
                <div className={styles.sectionHeading}><span className={styles.number}>02</span><div><h2 id="interest-heading">Interests & ambitions</h2><p>What would you like to learn or explore?</p></div></div>
                <label htmlFor="interest">Areas of interest</label>
                <div className={styles.interestInput}><input id="interest" maxLength={80} value={interest} placeholder="Add an interest" onChange={(e) => { setInterest(e.target.value); setDirty(true); setMessage(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(interest); } }} /><button type="button" disabled={!interest.trim()} onClick={() => addInterest(interest)}>Add</button></div>
                {profile.interests.length > 0 && <ul className={styles.tags} aria-label="Selected interests">{profile.interests.map((item) => <li key={item}><button type="button" aria-label={`Remove ${item}`} onClick={() => update("interests", profile.interests.filter((value) => value !== item))}>{item}<span aria-hidden="true">×</span></button></li>)}</ul>}
                <p className={styles.hint}>Need inspiration? Choose a topic:</p>
                <div className={styles.suggestions}>{suggestions.filter((item) => !profile.interests.some((selected) => selected.toLowerCase() === item.toLowerCase())).map((item) => <button type="button" key={item} onClick={() => addInterest(item)}>+ {item}</button>)}</div>
                <label htmlFor="goals">Learning goals</label><textarea id="goals" maxLength={2000} value={profile.goals} onChange={(e) => update("goals", e.target.value)} placeholder="What’s next for you? A new skill, a career change, or a deeper understanding of your field…" />
              </section>
              <section className={styles.card} aria-labelledby="experience-heading">
                <div className={styles.sectionHeading}><span className={styles.number}>03</span><div><h2 id="experience-heading">Your experience</h2><p>Add more context to your professional story.</p></div></div>
                <label htmlFor="linkedin">LinkedIn profile</label><input id="linkedin" type="url" maxLength={500} value={profile.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://www.linkedin.com/in/your-name" />
                {linkedin && <a className={styles.external} href={linkedin} target="_blank" rel="noopener noreferrer">View LinkedIn profile ↗</a>}
                <div className={styles.upload}>
                  <span className={styles.uploadIcon} aria-hidden="true">↑</span><label htmlFor="cv">{profile.cv ? "Replace your CV" : "Upload your CV"}</label><p id="cv-help">PDF, DOC, or DOCX · Up to 5 MB</p>
                  <input id="cv" type="file" accept=".pdf,.doc,.docx" aria-describedby="cv-help cv-error" onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    if (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size === 0 || file.size > 5 * 1024 * 1024) { setCvError("Choose a non-empty PDF, DOC, or DOCX file no larger than 5 MB."); return; }
                    setCvError(""); update("cv", file);
                  }} />
                </div>
                <div id="cv-error" role="alert" className={styles.error}>{cvError}</div>
                {profile.cv && <div className={styles.file}><div><strong>{profile.cv.name}</strong><small>{Math.max(1, Math.ceil(profile.cv.size / 1024))} KB · {dirty ? "Save profile to keep changes" : "Saved in your profile"}</small></div><a ref={downloadRef} download={profile.cv.name}>Download</a><button className={styles.remove} type="button" onClick={() => { update("cv", null); setCvError(""); }}>Remove</button></div>}
              </section>
              <div className={styles.actions}><p>Your profile and CV are saved to the database.<br /><small>This browser holds your access key. Your CV is not analyzed yet.</small></p><button type="submit">{saving ? "Saving…" : !ready ? (loadFailed ? "Unavailable" : "Loading…") : "Save profile"}<span aria-hidden="true">↗</span></button></div>
            </fieldset>
            <p role="status" className={styles.status}>{message || (dirty ? "You have unsaved changes." : "")}</p>
            <p role="alert" className={styles.error}>{error}</p>
            {loadFailed && <button type="button" onClick={() => { setLoadFailed(false); setError(""); setLoadAttempt((attempt) => attempt + 1); }}>Retry loading profile</button>}
          </form>
        </div>
      </main>
    </div>
  );
}
