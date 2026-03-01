import { useState } from "react";
import { saveLog } from "../utils/logStorage";

const today = new Date().toISOString().slice(0, 10);

export function LogLessonPage() {
  const [form, setForm] = useState({
    date: today,
    lesson: "",
    aircraft: "",
    duration: "",
    weakArea: "",
    notes: "",
  });
  const [saved, setSaved] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  function onSubmit(e) {
    e.preventDefault();

    if (!form.lesson.trim()) return;

    saveLog({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...form,
    });

    setSaved(true);
    setForm({
      date: today,
      lesson: "",
      aircraft: "",
      duration: "",
      weakArea: "",
      notes: "",
    });
  }

  return (
    <>
      <h1 className="page-title">Log Lesson</h1>

      <section className="section-block">
        <h2 className="section-title">New Entry</h2>

        <form className="lesson-form" onSubmit={onSubmit}>
          <label>
            Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
            />
          </label>

          <label>
            Lesson
            <input
              name="lesson"
              type="text"
              placeholder="Pattern Work"
              value={form.lesson}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Aircraft
            <input
              name="aircraft"
              type="text"
              placeholder="C172"
              value={form.aircraft}
              onChange={onChange}
            />
          </label>

          <label>
            Duration (hours)
            <input
              name="duration"
              type="text"
              placeholder="1.2"
              value={form.duration}
              onChange={onChange}
            />
          </label>

          <label>
            Weak Area
            <input
              name="weakArea"
              type="text"
              placeholder="Crosswind landings"
              value={form.weakArea}
              onChange={onChange}
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              rows="4"
              placeholder="What went well? What needs work?"
              value={form.notes}
              onChange={onChange}
            />
          </label>

          <button type="submit" className="primary-btn">
            Save Lesson
          </button>
          {saved && <p className="save-msg">✅ Saved</p>}
        </form>
      </section>
    </>
  );
}
