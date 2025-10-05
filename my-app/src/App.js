import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

const API = import.meta?.env?.VITE_API_BASE ?? "http://127.0.0.1:8000";

const FIELDS_OF_STUDY = [
  "science", "technology", "engineering", "math", "liberal Arts",
  "pre-Med", "pre-Law", "art", "other", "undecided",
];

const NJ_COLLEGES = [
  "Atlantic Cape Community College",
  "Bergen Community College",
  "Bloomfield College of Montclair State University",
  "Brookdale Community College",
  "Caldwell University",
  "Camden County College",
  "Centenary University",
  "County College of Morris",
  "Drew University",
  "Essex County College",
  "Fairleigh Dickinson University",
  "Felician University",
  "Georgian Court University",
  "Hudson County Community College",
  "Kean University",
  "Mercer County Community College",
  "Middlesex College",
  "Monmouth University",
  "Montclair State University",
  "New Jersey City University",
  "New Jersey Institute of Technology",
  "Ocean County College",
  "Passaic County Community College",
  "Pillar College",
  "Princeton University",
  "Ramapo College of New Jersey",
  "Raritan Valley Community College",
  "Rider University",
  "Rowan College at Burlington County",
  "Rowan College of South Jersey",
  "Rowan University",
  "Rutgers University Camden",
  "Rutgers University New Brunswick",
  "Rutgers University Newark",
  "Saint Elizabeth University",
  "Saint Peter’s University",
  "Salem Community College",
  "Seton Hall University",
  "Stevens Institute of Technology",
  "Stockton University",
  "Sussex County Community College",
  "The College of New Jersey",
  "Thomas Edison State University",
  "Union College of Union County, NJ",
  "Warren County Community College",
  "William Paterson University of New Jersey"
];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Section({ title, children, right }) {
  return (
    <section className="w-full max-w-5xl mx-auto my-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {right}
      </div>
      <div className="rounded-2xl border p-4 shadow-sm bg-white">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: "0.75rem" }}>
      <span
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-xl border px-3 py-2 outline-none",
        "focus:ring-2 focus:ring-black/10",
        props.className
      )}
    />
  );
}

function Button({ variant = "solid", children, className, ...rest }) {
  const base =
    variant === "solid"
      ? "bg-black text-white hover:bg-black/90"
      : "bg-white text-black border hover:bg-black/5";
  return (
    <button
      {...rest}
      className={classNames(
        "rounded-xl px-4 py-2 text-sm font-medium transition",
        base,
        className
      )}
    >
      {children}
    </button>
  );
}

function MentorCard({ mentor }) {
  return (
    <div>
      <h4 className="text-lg font-semibold">
        {mentor.name} ({mentor.email})
      </h4>
      <p className="text-sm text-black/70">
        {mentor.university} — {mentor.area_of_study}
      </p>
      {mentor.bio && <p className="text-sm mt-2 line-clamp-3">{mentor.bio}</p>}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("auth");
  const [authMode, setAuthMode] = useState("login");
  const [userId, setUserId] = useState(null);

  // Auth + profile state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [name, setName] = useState("");


  // Student view
  const [targetUni, setTargetUni] = useState("");
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [toast, setToast] = useState(null);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleAuth = async () => {
    setEmailError("");
    if (!email || !password) {
      showToast("error", "Please fill in all fields.");
      return;
    }
    if (authMode === "signup" && !isValidEmail(email)) {
      setEmailError("Invalid email address");
      showToast("error", "Please enter a valid email (e.g., name@example.com)");
      return;
    }

    try {
      const url = authMode === "login" ? `${API}/login` : `${API}/signup`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          school,
          previous_school: previousSchool,
          area_of_study: fieldOfStudy,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || `${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      setUserId(data.id);
      setRole(data.role || role);

      showToast("success", authMode === "login" ? "Logged in!" : "Signed up!");

      // Route correctly after auth
      setTimeout(() => {
        const effectiveRole = (data.role || role || "").toLowerCase();
        if (effectiveRole === "mentor") {
          setPage("mentorDashboard");
        } else {
          setPage("main");
        }
      }, 600);
    } catch (err) {
      showToast("error", `Auth failed: ${err.message}`);
    }
  };

  // Pre-fill profile fields when visiting Profile page
  useEffect(() => {
    const loadProfile = async () => {
      if (page !== "profile" || !userId) return;
      try {
        const resp = await fetch(`${API}/profile/${userId}`);
        if (!resp.ok) throw new Error("Failed to load profile");
        const p = await resp.json();
        setEmail(p.email || "");
        setName(p.name || "")
        setRole(p.role || "Student");
        setSchool(p.school || "");
        setFieldOfStudy(p.field_of_study || "");
        setBio(p.bio || "");
        setPreviousSchool(p.previous_school || "");
      } catch (e) {
        showToast("error", e.message);
      }
    };
    loadProfile();
  }, [page, userId]);

  async function findMentors() {
    setLoading(true);
    setSearched(true);
    setMentors([]);
    try {
      if (!userId) throw new Error("No user logged in");
      if (!targetUni) throw new Error("Please select a university.");

      const updateResp = await fetch(`${API}/update_desired_school/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desired_school: targetUni }),
      });
      if (!updateResp.ok) throw new Error("Failed to update desired school");

      await new Promise((resolve) => setTimeout(resolve, 250));

      const resp = await fetch(`${API}/matches/${userId}`);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("error", `Failed to load mentors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- AUTH PAGE ----------
  if (page === "auth") {
    return (
      <div className="auth-container">
        <header>
          <h1>Transfer Peer Connect</h1>
        </header>
        <main>
          <section
            className="section-container"
            style={{ maxWidth: "500px", margin: "2rem auto" }}
          >
           

            {authMode === "signup" && (
              <>

               <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              {authMode === "login" ? "Login" : "Sign Up"}
                </h2>
                <Field label="Full Name">
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="I am a...">
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option>Student</option>
                    <option>Mentor</option>
                  </select>
                </Field>
                {role === "Mentor" && (
              <>
                <Field label="Previous School">
                  <select
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                  >
                    <option value="">Select your previous school…</option>
                    {NJ_COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
              )}
                <Field label="Current School">
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                  >
                    <option value="">Select your school…</option>
                    {NJ_COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Field of Study">
                  <select
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                  >
                    <option value="">Select a field…</option>
                    {FIELDS_OF_STUDY.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {authMode === "signup" && emailError && (
              <p
                style={{
                  color: "red",
                  fontSize: "0.9rem",
                  marginTop: "-0.25rem",
                  marginBottom: "0.75rem",
                }}
              >
                {emailError}
              </p>
            )}

            <Field label="Password">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <Button onClick={handleAuth}>
                {authMode === "login" ? "Login" : "Sign Up"}
              </Button>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {authMode === "login" ? (
                <>
                  Don’t have an account?{" "}
                  <span
                    style={{
                      color: "#5a5a5a",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span
                    style={{
                      color: "#5a5a5a",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => setAuthMode("login")}
                  >
                    Login
                  </span>
                </>
              )}
            </p>
          </section>
        </main>

        {toast && (
          <div
            role="status"
            className={classNames(
              "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "error" && "bg-red-600 text-white"
            )}
          >
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ---------- PROFILE ----------
  if (page === "profile") {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="w-full border-b bg-white">
          <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setPage(role === "Mentor" ? "mentorDashboard" : "main")
                }
              >
                Back
              </Button>
              <Button variant="outline" onClick={() => setPage("auth")}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4">
          <Section title="Edit Profile">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label = "Name">
              <Input
                type="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Student</option>
                <option>Mentor</option>
              </select>
            </Field>

            <Field label={role === "Mentor" ? "Current University" : "Current School"}>
              <select value={school} onChange={(e) => setSchool(e.target.value)}>
                <option value="">Select your school…</option>
                {NJ_COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Field of Study">
              <select
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
              >
                <option value="">Select a field…</option>
                {FIELDS_OF_STUDY.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            {role === "Mentor" && (
              <>
                <Field label="Previous School (pre-transfer)">
                  <select
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                  >
                    <option value="">Select your previous school…</option>
                    {NJ_COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Bio">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Tell students about your transfer journey, tips, and interests..."
                  />
                </Field>
              </>
            )}

            <Button
              onClick={async () => {
                try {
                  const resp = await fetch(`${API}/update_profile/${userId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email,
                      name,
                      role,
                      school,
                      field_of_study: fieldOfStudy,
                      bio,
                      previous_school: previousSchool,
                    }),
                  });
                  if (!resp.ok) throw new Error("Failed to update profile");
                  showToast("success", "Profile updated!");
                } catch (err) {
                  showToast("error", err.message);
                }
              }}
            >
              Save Changes
            </Button>
          </Section>

        </main>

        {toast && (
          <div
            role="status"
            className={classNames(
              "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "error" && "bg-red-600 text-white"
            )}
          >
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ---------- MENTOR DASHBOARD ----------
  if (page === "mentorDashboard") {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="w-full border-b bg-white">
          <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPage("profile")}>
                Profile
              </Button>
              <Button variant="outline" onClick={() => setPage("auth")}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4">
          <Section title="Welcome, Mentor!">
            <p>
              We don't currently have a dashboard :/ 
              In the future you will be able to see students who want to connect.
              For now check your email.
            </p>
          </Section>
        </main>

        {toast && (
          <div
            role="status"
            className={classNames(
              "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "error" && "bg-red-600 text-white"
            )}
          >
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ---------- STUDENT MAIN ----------
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="w-full border-b bg-white">
        <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transfer Peer Connect</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPage("profile")}
              className="profile-nudge"
            >
              Profile
            </Button>

            <Button variant="outline" onClick={() => setPage("auth")}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4">
        <Section
          title="Find Mentors"
          right={
            <div className="flex items-center gap-2">
              <Field label="Target University">
                <select
                  value={targetUni}
                  onChange={(e) => setTargetUni(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Select your target university…</option>
                  {NJ_COLLEGES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Button onClick={findMentors}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          }
        >
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => (
              <MentorCard key={m.id ?? m.email ?? Math.random()} mentor={m} />
            ))}
          </div>

          {!loading && mentors.length === 0 && searched && (
            <p className="text-sm text-black/60 mt-2">No mentors yet.</p>
          )}
        </Section>
      </main>

      {toast && (
        <div
          role="status"
          className={classNames(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
            toast.type === "success" && "bg-green-600 text-white",
            toast.type === "error" && "bg-red-600 text-white"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
