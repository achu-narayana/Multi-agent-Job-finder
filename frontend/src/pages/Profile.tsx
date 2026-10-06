import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ResumeUpload } from "../components/ResumeUpload";
import { REGIONS } from "../data/startups";
import { seniorityFor } from "../lib/resume";
import { useStore } from "../state/store";
import "./pages.css";

export function Profile() {
  const { profile, updateProfile, setProfile } = useStore();
  const [newSkill, setNewSkill] = useState("");

  if (!profile) {
    return (
      <>
        <PageHeader title="Your profile" description="Everything Jobly knows about you comes from your résumé. Upload it to get started." />
        <div className="welcome card">
          <div>
            <h2 className="t-heading-sm">No résumé yet</h2>
            <p className="t-body-sm t-muted" style={{ marginBottom: 24 }}>
              PDF, DOCX or TXT. It's read in your browser and stored only on this device.
            </p>
            <ResumeUpload variant="primary">Upload résumé</ResumeUpload>
          </div>
        </div>
      </>
    );
  }

  function addSkill() {
    const skill = newSkill.trim();
    if (!skill || !profile) return;
    if (!profile.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) updateProfile({ skills: [...profile.skills, skill] });
    setNewSkill("");
  }

  return (
    <>
      <PageHeader
        eyebrow={`From ${profile.fileName}`}
        title="Your profile"
        description="Fix anything the parser got wrong — matches, pay estimates and emails update immediately."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setProfile(null)}>
              Remove résumé
            </button>
            <ResumeUpload />
          </>
        }
      />

      <section className="card">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Headline</span>
            <input className="input" value={profile.headline} onChange={(e) => updateProfile({ headline: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Location</span>
            <input className="input" value={profile.location} onChange={(e) => updateProfile({ location: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">
              Years of experience <span className="t-faint">{profile.seniority}</span>
            </span>
            <input
              className="input"
              type="number"
              min={0}
              max={40}
              value={profile.years}
              onChange={(e) => {
                const years = Math.max(0, Number(e.target.value) || 0);
                updateProfile({ years, seniority: seniorityFor(years) });
              }}
            />
          </label>
          <div className="field">
            <span className="field-label">Target regions</span>
            <div className="chip-edit">
              {REGIONS.map((r) => {
                const on = profile.targetRegions.includes(r);
                return (
                  <button
                    key={r}
                    className="btn btn-pill"
                    aria-pressed={on}
                    style={on ? { color: "var(--text-strong)", background: "rgba(255, 237, 215,0.1)" } : undefined}
                    onClick={() =>
                      updateProfile({ targetRegions: on ? profile.targetRegions.filter((x) => x !== r) : [...profile.targetRegions, r] })
                    }
                  >
                    {on ? "✓ " : ""}
                    {r}
                  </button>
                );
              })}
            </div>
            <label className="toggle" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={profile.remoteOnly} onChange={(e) => updateProfile({ remoteOnly: e.target.checked })} />
              Remote roles only
            </label>
          </div>
        </div>
      </section>

      <div className="grid-3">
        <section className="card key-card">
          <span className="key-label">Skills ({profile.skills.length})</span>
          <div className="chip-edit">
            {profile.skills.map((s) => (
              <span key={s} className="badge">
                {s}
                <button className="chip-remove" aria-label={`Remove ${s}`} onClick={() => updateProfile({ skills: profile.skills.filter((x) => x !== s) })}>
                  ✕
                </button>
              </span>
            ))}
          </div>
          <form
            className="filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              addSkill();
            }}
          >
            <input className="input-sm" placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
            <button className="btn btn-ghost" type="submit">
              Add
            </button>
          </form>
        </section>

        <ListEditor label="Schools" hint="Used to find alumni who can refer you" values={profile.schools} onChange={(schools) => updateProfile({ schools })} />
        <ListEditor label="Past employers" hint="Used to find ex-colleagues at startups" values={profile.employers} onChange={(employers) => updateProfile({ employers })} />
      </div>

      <p className="note">Stored only in this browser (localStorage). The backend will keep it on your machine too — this is a single-user tool.</p>
    </>
  );
}

function ListEditor({ label, hint, values, onChange }: { label: string; hint: string; values: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <section className="card key-card">
      <span className="key-label">{label}</span>
      <span className="note">{hint}</span>
      <div className="chip-edit">
        {values.map((v) => (
          <span key={v} className="badge">
            {v}
            <button className="chip-remove" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
              ✕
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="t-caption t-faint">None detected</span>}
      </div>
      <form
        className="filter-row"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (v && !values.includes(v)) onChange([...values, v]);
          setDraft("");
        }}
      >
        <input className="input-sm" placeholder={`Add ${label.toLowerCase().replace(/s$/, "")}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="btn btn-ghost" type="submit">
          Add
        </button>
      </form>
    </section>
  );
}
