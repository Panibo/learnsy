export default function StyleShowcase() {
  return (
    <main>
      <section className="section-teal">
        <div className="container">
          <span className="section-label">Design system</span>

          <h1>Learnsy Style Showcase</h1>

          <p style={{ maxWidth: "720px" }}>
            A visual reference page for typography, colors, buttons, forms,
            cards, tables, feedback states, and common semantic HTML elements.
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "2rem",
            }}
          >
            <a href="#buttons" className="button">
              Explore components
            </a>

            <a href="#forms" className="button button-secondary">
              View forms
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <span className="section-label">Typography</span>
          <h2>Headings & text</h2>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div>
              <h1>Heading level one</h1>
              <h2>Heading level two</h2>
              <h3>Heading level three</h3>
              <h4>Heading level four</h4>
              <h5>Heading level five</h5>
              <h6>Heading level six</h6>
            </div>

            <div style={{ maxWidth: "720px" }}>
              <p>
                This is a normal paragraph using the default foreground text
                color. It should feel comfortable to read in both short and
                long-form content.
              </p>

              <p>
                You can also use <strong>strong text</strong>,{" "}
                <em>emphasized text</em>, and{" "}
                <a href="#example">inline links</a>.
              </p>

              <small>
                Supporting copy and secondary information can use the small
                element.
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="section-muted">
        <div className="container">
          <span className="section-label">Brand palette</span>
          <h2>Colors</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              ["Primary", "var(--primary)"],
              ["Navy", "var(--navy)"],
              ["Teal", "var(--teal)"],
              ["Hero teal", "var(--hero-teal)"],
              ["Peach", "var(--peach)"],
              ["Orange", "var(--orange)"],
              ["Background", "var(--background-page)"],
              ["Card", "var(--card)"],
            ].map(([name, color]) => (
              <div className="card" key={name}>
                <div
                  style={{
                    height: "90px",
                    borderRadius: "var(--radius-md)",
                    background: color,
                    border: "1px solid var(--border)",
                    marginBottom: "1rem",
                  }}
                />

                <strong>{name}</strong>

                <div
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {color}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="buttons">
        <div className="container">
          <span className="section-label">Actions</span>
          <h2>Buttons</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <button>Primary button</button>

            <button className="button-secondary">Secondary</button>

            <button className="button-accent">Accent button</button>

            <button className="button-soft">Soft button</button>

            <button disabled>Disabled</button>
          </div>

          <hr />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <a href="#example" className="button">
              Link as button
            </a>

            <a href="#example">Regular text link</a>
          </div>
        </div>
      </section>

      <section className="section-peach">
        <div className="container">
          <span className="section-label">Content</span>
          <h2>Cards</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div className="card">
              <span className="tag">Learning</span>
              <h3 style={{ marginTop: "1rem" }}>Simple content card</h3>

              <p>
                Cards can contain descriptions, metadata, actions, and
                supporting content.
              </p>

              <a href="#example">Read more</a>
            </div>

            <a href="#example" className="card">
              <span className="tag">Clickable</span>
              <h3 style={{ marginTop: "1rem" }}>Linked card</h3>

              <p>
                This entire card is an anchor and uses the global card hover
                effect.
              </p>
            </a>

            <div className="card">
              <span className="tag">Feature</span>
              <h3 style={{ marginTop: "1rem" }}>Feature block</h3>

              <p>
                A reusable visual pattern for presenting features or benefits.
              </p>

              <button className="button-secondary">Learn more</button>
            </div>
          </div>
        </div>
      </section>

      <section id="forms">
        <div className="container">
          <span className="section-label">Inputs</span>
          <h2>Form elements</h2>

          <form
            style={{
              maxWidth: "720px",
              display: "grid",
              gap: "1.25rem",
            }}
          >
            <div>
              <label htmlFor="showcase-name">Name</label>
              <input
                id="showcase-name"
                type="text"
                placeholder="Jane Example"
              />
            </div>

            <div>
              <label htmlFor="showcase-email">Email address</label>
              <input
                id="showcase-email"
                type="email"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label htmlFor="showcase-role">Role</label>

              <select id="showcase-role" defaultValue="">
                <option value="" disabled>
                  Choose a role
                </option>
                <option>Student</option>
                <option>Teacher</option>
                <option>Administrator</option>
              </select>
            </div>

            <div>
              <label htmlFor="showcase-message">Message</label>

              <textarea
                id="showcase-message"
                placeholder="Write something..."
              />
            </div>

            <label
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <input type="checkbox" style={{ width: "auto" }} />
              Subscribe to updates
            </label>

            <fieldset>
              <legend>Preferred contact method</legend>

              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="radio"
                    name="contact"
                    defaultChecked
                    style={{ width: "auto" }}
                  />
                  Email
                </label>

                <label
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="radio"
                    name="contact"
                    style={{ width: "auto" }}
                  />
                  Phone
                </label>
              </div>
            </fieldset>

            <button type="submit">Submit form</button>
          </form>
        </div>
      </section>

      <section className="section-muted">
        <div className="container">
          <span className="section-label">System feedback</span>
          <h2>Alerts & statuses</h2>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              maxWidth: "720px",
            }}
          >
            <div className="success">
              <strong>Success.</strong> Your changes were saved successfully.
            </div>

            <div className="warning">
              <strong>Warning.</strong> Some information may still be missing.
            </div>

            <div className="error" role="alert">
              <strong>Error.</strong> Something went wrong. Please try again.
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <span className="section-label">Structured content</span>
          <h2>Tables</h2>

          <div style={{ overflowX: "auto" }}>
            <table>
              <caption>Example course progress</caption>

              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Introduction to Learnsy</td>
                  <td>
                    <span className="tag">Active</span>
                  </td>
                  <td>72%</td>
                  <td>Today</td>
                </tr>

                <tr>
                  <td>Advanced workflows</td>
                  <td>
                    <span className="tag">Started</span>
                  </td>
                  <td>34%</td>
                  <td>Yesterday</td>
                </tr>

                <tr>
                  <td>Learning analytics</td>
                  <td>
                    <span className="tag">Complete</span>
                  </td>
                  <td>100%</td>
                  <td>3 days ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-teal">
        <div className="container">
          <span className="section-label">Editorial</span>
          <h2>Quotes, lists & miscellaneous HTML</h2>

          <blockquote>
            Learning works best when the interface stays out of the way and
            gives the content room to breathe.
          </blockquote>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "2rem",
            }}
          >
            <div>
              <h3>Unordered list</h3>

              <ul>
                <li>Accessible controls</li>
                <li>Consistent spacing</li>
                <li>Clear visual hierarchy</li>
              </ul>
            </div>

            <div>
              <h3>Ordered list</h3>

              <ol>
                <li>Choose a course</li>
                <li>Complete the modules</li>
                <li>Track your progress</li>
              </ol>
            </div>
          </div>

          <p>
            You can use <mark>highlighted text</mark> for important inline
            information.
          </p>

          <p>
            Inline code looks like <code>npm run dev</code>.
          </p>

          <pre>
            <code>{`const course = {
  title: "Learn React",
  progress: 72
};`}</code>
          </pre>
        </div>
      </section>

      <section>
        <div className="container">
          <span className="section-label">Expandable content</span>
          <h2>Details & accordions</h2>

          <div style={{ maxWidth: "720px" }}>
            <details>
              <summary>What is Learnsy?</summary>
              <p>
                This is example expandable content using native HTML details and
                summary elements.
              </p>
            </details>

            <details>
              <summary>How are the styles applied?</summary>
              <p>
                Most visual styles come directly from semantic HTML selectors
                and reusable utility classes.
              </p>
            </details>

            <details>
              <summary>Can these components be reused?</summary>
              <p>
                Yes. The goal of this page is to act as a visual regression and
                component reference page.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <span className="section-label" style={{ color: "var(--peach)" }}>
            Call to action
          </span>

          <h2>Ready to start learning?</h2>

          <p
            style={{
              maxWidth: "620px",
              color: "rgba(255,255,255,.8)",
            }}
          >
            This section demonstrates how the same typography and controls work
            against the darker brand surface.
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "1.5rem",
            }}
          >
            <button className="button-accent">Get started</button>

            <button
              className="button-secondary"
              style={{
                color: "#fff",
                borderColor: "#fff",
              }}
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "3rem",
            }}
          >
            <div>
              <h3>Learnsy</h3>
              <p>Example footer showing the global dark footer styling.</p>
            </div>

            <div>
              <h4>Product</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#courses">Courses</a>
                </li>
              </ul>
            </div>

            <div>
              <h4>Company</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>
                  <a href="#about">About</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
                <li>
                  <a href="#blog">Blog</a>
                </li>
              </ul>
            </div>
          </div>

          <hr
            style={{
              background: "rgba(255,255,255,.2)",
              marginTop: "3rem",
            }}
          />

          <small style={{ color: "rgba(255,255,255,.65)" }}>
            © 2026 Learnsy. Style showcase.
          </small>
        </div>
      </footer>
    </main>
  );
}
