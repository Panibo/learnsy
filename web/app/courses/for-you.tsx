"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "../components/site-header";
import { externalCourseUrl, getForYouRecommendation } from "../../lib/courses/recommendation";
import type { CourseRecommendation } from "../../lib/courses/types";
import EnergyLandscape from "./energy-landscape";
import styles from "./page.module.css";

export default function ForYou() {
  const [recommendation, setRecommendation] = useState<CourseRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState<{ attempt: number; exclude?: string }>({ attempt: 0 });

  useEffect(() => {
    let active = true;
    getForYouRecommendation(request.exclude).then((result) => {
      if (!active) return;
      setRecommendation(result);
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Your course could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request]);

  function selectAnother() {
    setLoading(true);
    setError("");
    setRequest((current) => ({ attempt: current.attempt + 1, exclude: recommendation?.course.id }));
  }

  const course = recommendation?.course;
  const courseUrl = externalCourseUrl(course?.source.courseUrl);
  const learner = recommendation?.learner;
  const action = recommendation?.workplaceAction;

  return (
    <div className={styles.page}>
      <SiteHeader current="courses" />
      <main className={styles.main}>
        <div className={styles.heading}>
          <div><span className="eyebrow">SMALL STEPS. LASTING IMPACT.</span><h1>For you</h1><p>A new direction for your next chapter.</p></div>
        </div>
        {error && <div className={styles.feedback} role="alert"><p>{error}</p><button type="button" disabled={loading} onClick={selectAnother}>Try again</button></div>}
        <p className={loading ? styles.loading : styles.srOnly} role="status">{loading ? (course ? "Finding another course…" : "Finding a sustainability course…") : course ? `Selected: ${course.title}` : ""}</p>
        {!course && !loading && !error && <div className={styles.empty}><h2>No courses available right now.</h2><p>We couldn’t find any published sustainability courses. Check again soon.</p><button type="button" onClick={selectAnother}>Check again</button></div>}
        {course && recommendation && action && <>
          <div className={styles.layout} aria-busy={loading}>
            <article className={styles.course} aria-labelledby="course-title">
              <div className={styles.courseOverview}>
                <div className={styles.courseHeader}>
                  <div>
                    <p className={styles.provider}><a href={courseUrl ?? "https://ocw.mit.edu/"} target="_blank" rel="noopener noreferrer">{course.source.providerName}</a>{course.courseNumber && <span>{course.courseNumber}</span>}</p>
                    <h2 id="course-title">{course.title}</h2>
                  </div>
                  <div className={styles.artwork}><EnergyLandscape /></div>
                </div>
                <div className={styles.topics}>{course.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                <p className={styles.description}>{course.summary}</p>
                <dl className={styles.facts}>
                  <div><dt>Course level</dt><dd>{course.level ?? "See course details"}</dd></div>
                  <div><dt>Study your way</dt><dd>{course.format}</dd></div>
                  <div><dt>Originally taught</dt><dd>{course.term ?? "Not specified"}</dd></div>
                  {course.durationWeeks !== null && <div><dt>Duration</dt><dd>{course.durationWeeks} weeks</dd></div>}
                  {course.hoursPerWeek !== null && <div><dt>Weekly commitment</dt><dd>{course.hoursPerWeek} hours / week</dd></div>}
                  {course.language && <div><dt>Language</dt><dd>{course.language}</dd></div>}
                </dl>
              </div>
              <div className={styles.courseResources}>
                <div className={styles.resourcesHeader}><h3>Inside the course</h3>{courseUrl && <a href={courseUrl} target="_blank" rel="noopener noreferrer">View syllabus <span aria-hidden="true">↗</span></a>}</div>
                {course.materials.length ? <ul className={styles.materialList} aria-label="Available course materials">{course.materials.map((material) => <li key={material}>{material}</li>)}</ul> : <p className={styles.resourceNote}>Explore the syllabus for available study materials.</p>}
                {course.instructors.length > 0 && <p className={styles.instructors}><strong>Taught by</strong> {course.instructors.join(" · ")}</p>}
                <div className={styles.courseFooter}>
                  <div className={styles.courseActions}>
                    {courseUrl && <a className="button" href={courseUrl} target="_blank" rel="noopener noreferrer">Explore course <span aria-hidden="true">↗</span></a>}
                    <button className={styles.another} type="button" onClick={selectAnother} disabled={loading || recommendation.catalog.courseCount < 2}>{loading ? "Finding a course…" : "Show another course"}</button>
                  </div>
                  <p className={styles.enrollmentNote}>Free course materials for independent study. No enrollment, academic credit, or certificate.{course.licenseUrl && <> <a href={course.licenseUrl} target="_blank" rel="noopener noreferrer">Usage & licensing</a></>}</p>
                </div>
              </div>
            </article>
            <aside className={styles.match} aria-labelledby="match-title">
              <div className={styles.advisorIdentity}><div className={styles.matchIcon} aria-hidden="true">✳</div><span className={styles.advisorName}>Your AI learning advisor</span></div>
              <h2 id="match-title">Why this is<br />for you</h2>
              <p className={styles.matchHeadline}>{recommendation.rationale.headline}</p>
              <p className={styles.matchExplanation}>{recommendation.rationale.explanation}</p>
              <ol className={styles.connections}>{recommendation.rationale.reasons.map((reason, index) => <li key={reason.title}><span aria-hidden="true">0{index + 1}</span><div><h3>{reason.title}</h3><p>{reason.description}</p></div></li>)}</ol>
              <div className={styles.advisorFooter}><Link href="/profile">{learner ? "Refine your recommendations" : "Personalize your recommendations"} <span aria-hidden="true">↗</span></Link></div>
            </aside>
            <section className={styles.gains} aria-labelledby="gains-title">
              <h2 id="gains-title">What you’ll gain</h2>
              <ul>{recommendation.gains.items.map((gain) => <li key={gain.title}><span className={styles.gainCheck} aria-hidden="true">✓</span><div><h3>{gain.title}</h3><p>{gain.description}</p></div></li>)}</ul>
            </section>
          </div>
          <section className={styles.workAction} aria-labelledby="action-title">
            <div className={styles.actionIntro}><span className={styles.actionEyebrow}>TRY THIS AT WORK <span>· {action.duration}</span></span><h2 id="action-title">{action.title}</h2><p>{action.instruction}</p></div>
            <div className={styles.actionQuestion}><span className={styles.contextEyebrow}>A QUESTION TO TAKE WITH YOU</span><blockquote>“{action.question}”</blockquote><p><span aria-hidden="true">✓</span> {action.outcome}</p></div>
          </section>
          {recommendation.catalog.stale && <p className={styles.catalogNote}>Showing previously retrieved course information.</p>}
          <div className={styles.closing}><span aria-hidden="true">✳</span><p>Your future has a part to play in the planet’s.</p></div>
        </>}
      </main>
    </div>
  );
}
