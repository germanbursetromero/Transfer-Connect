import React, { useMemo, useState } from "react";

/**
 * React single-file replacement for the provided Streamlit MVP.
 *
 * Drop this into `src/App.jsx` of a Vite/Create React App project.
 * Make sure your backend (FastAPI/Django/etc.) runs on http://127.0.0.1:8000
 * and has CORS enabled for your frontend origin.
 *
 * Endpoints used (mirroring the Streamlit example):
 *  - POST   /mentors/   { user_email, university, major, bio, available_slots }
 *  - POST   /students/  { user_email, community_college, intended_major, target_university }
 *  - GET    /mentors/?student_email=...   (fallback to GET /mentors/ if unsupported)
 *  - POST   /sessions/  { mentor_id, student_email, time_iso }
 */

const API = import.meta?.env?.VITE_API_BASE ?? "http://127.0.0.1:8000";

const FIELDS_OF_STUDY = [
  "Science",
  "Technology",
  "Engineering",
  "Math",
  "Liberal Arts",
  "Pre-Med",
  "Pre-Law",
  "Art",
  "Other",
  "Undecided",
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
  "William Paterson University of New Jersey",
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
    <label className="block mb-3">
      <span className="block text-sm font-medium mb-1">{label}</span>
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

function TextArea(props) {
  return (
    <textarea
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
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
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

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center size-9 rounded-full hover:bg-black/5"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-4 border-t flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}

function MentorCard({ mentor, onBook }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white flex flex-col">
      <img
        src={mentor.photo_url || "https://via.placeholder.com/300x160"}
        alt={mentor.name}
        className="w-full aspect-[3/2] object-cover rounded-xl mb-3"
      />
      <h4 className="text-lg font-semibold">
        {mentor.name || `Mentor #${mentor.id}`}
      </h4>
      <p className="text-sm text-black/70">
        {mentor.university} — {mentor.major}
      </p>
      {mentor.bio && <p className="text-sm mt-2 line-clamp-3">{mentor.bio}</p>}
      <div className="mt-4" />
      <Button onClick={() => onBook(mentor)}>Book</Button>
    </div>
  );
}

export default function App() {
  // Global fields
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");

  // Mentor form
  const [uni, setUni] = useState("");
  const [major, setMajor] = useState("");
  const [bio, setBio] = useState("");
  const [slotsRaw, setSlotsRaw] = useState('["2025-10-01T15:00:00"]');

  // Student form
  const [cc, setCc] = useState("");
  const [intendedMajor, setIntendedMajor] = useState("");
  const [targetUni, setTargetUni] = useState("");

  // Mentors search
  const [searchEmail, setSearchEmail] = useState("");
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type:"success"|"error", msg}

  // Booking modal
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [bookingTime, setBookingTime] = useState("");

  const canSubmitMentor = useMemo(
    () => email && uni && major && slotsRaw,
    [email, uni, major, slotsRaw]
  );

  const canSubmitStudent = useMemo(
    () => email && cc && intendedMajor && targetUni,
    [email, cc, intendedMajor, targetUni]
  );

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function createMentorProfile() {
    // Parse availability JSON safely
    let available_slots = [];
    try {
      const parsed = JSON.parse(slotsRaw || "[]");
      if (!Array.isArray(parsed))
        throw new Error("Availability must be an array of ISO strings");
      available_slots = parsed;
    } catch (e) {
      showToast("error", `Invalid availability JSON: ${e.message}`);
      return;
    }

    try {
      const resp = await fetch(`${API}/mentors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: email,
          university: uni,
          major,
          bio,
          available_slots,
        }),
      });
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      showToast("success", "Mentor profile created!");
    } catch (err) {
      showToast("error", `Failed to create mentor: ${err.message}`);
    }
  }

  async function createStudentProfile() {
    try {
      const resp = await fetch(`${API}/students/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: email,
          community_college: cc,
          intended_major: intendedMajor,
          target_university: targetUni,
        }),
      });
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      showToast("success", "Student profile created!");
    } catch (err) {
      showToast("error", `Failed to create student: ${err.message}`);
    }
  }

  async function findMentors() {
    setLoading(true);
    setMentors([]);
    try {
      // Try query by student_email first
      let url = `${API}/mentors/`;
      if (searchEmail) {
        const tryUrl = `${API}/mentors/?student_email=${encodeURIComponent(
          searchEmail
        )}`;
        const tryResp = await fetch(tryUrl);
        if (tryResp.ok) {
          const data = await tryResp.json();
          setMentors(Array.isArray(data) ? data : data.results || []);
          setLoading(false);
          return;
        }
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      setMentors(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      showToast("error", `Failed to load mentors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function openBooking(mentor) {
    setBookingMentor(mentor);
    setBookingTime("");
    setBookingOpen(true);
  }

  async function confirmBooking() {
    if (!bookingMentor || !bookingTime || !email) {
      showToast("error", "Please provide your email and a time in ISO format.");
      return;
    }
    try {
      const resp = await fetch(`${API}/sessions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id:
            bookingMentor.id ?? bookingMentor.mentor_id ?? bookingMentor.pk,
          student_email: email,
          time_iso: bookingTime,
        }),
      });
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      showToast("success", "Session requested!");
      setBookingOpen(false);
    } catch (err) {
      showToast("error", `Failed to request session: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="w-full border-b bg-white">
        <div className="max-w-5xl mx-auto p-4">
          <h1 className="text-2xl font-bold">Transfer Peer Connect</h1>
        </div>
      </header>

      <main className="p-4">
        <Section title="Your Info">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="I am a...">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option>Student</option>
                <option>Mentor</option>
              </select>
            </Field>

            <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {role === "Mentor" ? (
          <Section title="Create Mentor Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current College">
                <select
                  value={uni}
                  onChange={(e) => setUni(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Select a college…</option>
                  {NJ_COLLEGES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Field of Study">
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Select a field…</option>
                  {FIELDS_OF_STUDY.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bio">
                <TextArea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Button
                onClick={createMentorProfile}
                disabled={!canSubmitMentor}
              >
                Submit Mentor
              </Button>
            </div>
          </Section>
        ) : (
          <Section title="Create Student Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current College">
                <select
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Select a college…</option>
                  {NJ_COLLEGES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Intended Field of Study">
                <select
                  value={intendedMajor}
                  onChange={(e) => setIntendedMajor(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Select a field…</option>
                  {FIELDS_OF_STUDY.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>

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
            </div>

            <div className="mt-4">
              <Button
                onClick={createStudentProfile}
                disabled={!canSubmitStudent}
              >
                Submit Student
              </Button>
            </div>
          </Section>
        )}

        <Section
          title="Find Mentors"
          right={
            <div className="flex items-center gap-2">
              <Button onClick={findMentors}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field label="Student email to search for (optional)">
              <Input
                placeholder="student@example.edu"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => (
              <MentorCard
                key={m.id ?? m.user_email ?? Math.random()}
                mentor={m}
                onBook={openBooking}
              />
            ))}
            {!loading && mentors.length === 0 && (
              <p className="text-sm text-black/60">
                No mentors yet. Try searching or create some mentor profiles
                first.
              </p>
            )}
          </div>
        </Section>
      </main>

      {/* Booking Modal */}
      <Modal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title={
          bookingMentor
            ? `Book ${bookingMentor.name || `Mentor #${bookingMentor.id}`}`
            : "Book session"
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBooking}>Confirm</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Your email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Choose time (ISO)">
            <Input
              placeholder="2025-10-01T15:00:00"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
            />
          </Field>

          {Array.isArray(bookingMentor?.available_slots) &&
            bookingMentor.available_slots.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Suggested times:</p>
                <div className="flex flex-wrap gap-2">
                  {bookingMentor.available_slots.map((t, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={() => setBookingTime(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            )}

          <p className="text-xs text-black/60">
            Use ISO 8601 format (e.g., 2025-10-01T15:00:00). The backend should
            validate or normalize the time zone.
          </p>
        </div>
      </Modal>

      {/* Toast */}
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

      <footer className="p-6 text-center text-xs text-black/60">
        API base: <code>{API}</code>
      </footer>
    </div>
  );
}
