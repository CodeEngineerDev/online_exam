'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { BookOpenCheck, CalendarDays, Check, ChevronRight, ClipboardList, GraduationCap, LayoutDashboard, Plus, UsersRound } from 'lucide-react';

type View = 'dashboard' | 'exams' | 'questions' | 'students' | 'take' | 'results';
type Student = { id: number; fullName: string; email: string; studentNumber: string; createdAt: string };
type Exam = { id: number; title: string; description: string | null; durationMinutes: number; startAt: string; endAt: string; question_count: number };
type Question = { id: number; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; marks: number };
type Result = { id: number; score: number; total_marks: number; submitted_at: string; full_name: string; student_number: string; exam_title: string };
type Stats = { students: number; exams: number; questions: number; submissions: number };

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'exams', label: 'Examinations', icon: BookOpenCheck },
  { id: 'questions', label: 'Question bank', icon: ClipboardList },
  { id: 'students', label: 'Students', icon: UsersRound },
  { id: 'take', label: 'Take an exam', icon: GraduationCap },
  { id: 'results', label: 'Results', icon: Check },
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Request failed');
  return data as T;
}

function localDateTime(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<Stats>({ students: 0, exams: 0, questions: 0, submissions: 0 });
  const [questionExam, setQuestionExam] = useState('');
  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [paper, setPaper] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  async function refresh() {
    try {
      const [studentData, examData, resultData, statsData] = await Promise.all([
        api<Student[]>('students'), api<Exam[]>('exams'), api<Result[]>('results'), api<Stats>('stats'),
      ]);
      setStudents(studentData); setExams(examData); setResults(resultData); setStats(statsData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load the workspace. Is the API running?');
    }
  }

  useEffect(() => {
    const now = new Date();
    setStartAt(localDateTime(now));
    setEndAt(localDateTime(new Date(now.getTime() + 86400000)));
    void refresh();
  }, []);

  function notify(text: string) {
    setError(''); setMessage(text);
    window.setTimeout(() => setMessage(''), 4000);
  }

  async function saveForm(event: FormEvent<HTMLFormElement>, kind: 'student' | 'exam' | 'question') {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    let path: string;
    let payload: object;
    if (kind === 'student') {
      path = 'students';
      payload = { full_name: values.get('full_name'), email: values.get('email'), student_number: values.get('student_number') };
    } else if (kind === 'exam') {
      path = 'exams';
      payload = {
        title: values.get('title'), description: values.get('description'),
        duration_minutes: Number(values.get('duration_minutes')),
        start_at: new Date(String(values.get('start_at'))).toISOString(),
        end_at: new Date(String(values.get('end_at'))).toISOString(),
      };
    } else {
      path = 'questions';
      payload = {
        exam_id: Number(values.get('exam_id')), question_text: values.get('question_text'),
        option_a: values.get('option_a'), option_b: values.get('option_b'),
        option_c: values.get('option_c'), option_d: values.get('option_d'),
        correct_option: values.get('correct_option'), marks: Number(values.get('marks')),
      };
    }
    setBusy(true); setError('');
    try {
      await api(path, { method: 'POST', body: JSON.stringify(payload) });
      form.reset();
      notify(kind === 'student' ? 'Student registered.' : kind === 'exam' ? 'Examination created.' : 'Question added.');
      await refresh();
      if (kind === 'question' && questionExam) await loadQuestions(questionExam);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be completed.');
    } finally { setBusy(false); }
  }

  async function loadQuestions(examId: string) {
    setQuestionExam(examId);
    try { setQuestionList(examId ? await api<Question[]>(`questions?exam_id=${examId}`) : []); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load questions.'); }
  }

  async function beginExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const loaded = await api<Question[]>(`exam-questions?exam_id=${selectedExam}`);
      if (!loaded.length) throw new Error('This examination has no questions yet.');
      setPaper(loaded); setAnswers({});
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load the examination.'); }
    finally { setBusy(false); }
  }

  async function submitExam() {
    if (!selectedStudent || !selectedExam) { setError('Choose a student and examination first.'); return; }
    if (!window.confirm('Submit this examination? You cannot submit it again.')) return;
    setBusy(true); setError('');
    try {
      const result = await api<{ score: number; total_marks: number }>('submit', {
        method: 'POST', body: JSON.stringify({ student_id: Number(selectedStudent), exam_id: Number(selectedExam), answers }),
      });
      setPaper([]); await refresh(); setView('results'); notify(`Submitted. Score: ${result.score} / ${result.total_marks}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Submission failed.'); }
    finally { setBusy(false); }
  }

  const title = navigation.find((item) => item.id === view)?.label ?? 'Overview';
  const openExams = exams.filter((exam) => Date.now() >= new Date(exam.startAt).getTime() && Date.now() <= new Date(exam.endAt).getTime());

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setView('dashboard')}><span className="brand-symbol"><BookOpenCheck size={20} /></span><span>ExamPoint<small>ASSESSMENT OFFICE</small></span></button>
      <p className="nav-caption">WORKSPACE</p>
      <nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span>{view === id && <ChevronRight className="nav-arrow" size={15} />}</button>)}</nav>
      <div className="sidebar-foot"><span className="online-dot" />Workspace ready<small>Online examination management</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">LEARNING &amp; ASSESSMENT</p><h1>{title}</h1></div><span className="date-label"><CalendarDays size={16} />{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></header>
      {(message || error) && <div className={`notice ${error ? 'notice-error' : ''}`} role="status">{error || message}<button onClick={() => { setError(''); setMessage(''); }} aria-label="Dismiss">×</button></div>}

      {view === 'dashboard' && <section className="page-content">
        <div className="welcome-row"><div><span className="eyebrow">YOUR ASSESSMENT WORKSPACE</span><h2>A better view of every exam.</h2><p>Manage learners, build examinations and follow results in one place.</p></div><button className="button button-dark" onClick={() => setView('exams')}><Plus size={16} />Create examination</button></div>
        <div className="stat-grid">{[
          ['Students', stats.students, 'Registered learners', 'green'], ['Examinations', stats.exams, `${openExams.length} open now`, 'blue'],
          ['Questions', stats.questions, 'In the question bank', 'coral'], ['Submissions', stats.submissions, 'Completed attempts', 'gold'],
        ].map(([label, value, note, color]) => <article className={`stat-card ${color}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
        <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent results</h2></div><button className="text-button" onClick={() => setView('results')}>All results <ChevronRight size={14} /></button></div><ResultTable rows={results.slice(0, 5)} compact /></section>
          <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ON THE SCHEDULE</span><h2>Examinations</h2></div><CalendarDays size={18} /></div>{exams.slice(0, 5).map((exam) => <div className="schedule-item" key={exam.id}><span className="schedule-mark" /><div><strong>{exam.title}</strong><small>{formatDate(exam.startAt)}</small></div><span className={`pill ${Date.now() <= new Date(exam.endAt).getTime() ? 'pill-green' : 'pill-muted'}`}>{Date.now() <= new Date(exam.endAt).getTime() ? 'Scheduled' : 'Closed'}</span></div>)}{!exams.length && <Empty text="No examinations created yet." />}<button className="button button-outline full-width" onClick={() => setView('exams')}><Plus size={15} />Add an examination</button></section></div>
      </section>}

      {view === 'students' && <section className="page-content two-column"><section className="panel form-panel"><PanelTitle eyebrow="LEARNER DIRECTORY" title="Register student" subtitle="Create a learner profile for examination access." /><form className="form-stack" onSubmit={(event) => void saveForm(event, 'student')}><Field label="Full name"><input name="full_name" placeholder="e.g. Aline Mukamana" required minLength={2} /></Field><Field label="Email address"><input name="email" type="email" placeholder="student@school.edu" required /></Field><Field label="Student number"><input name="student_number" placeholder="e.g. STU-1042" required /></Field><button className="button button-dark" disabled={busy}><Plus size={16} />Register student</button></form></section>
        <section className="panel"><PanelTitle eyebrow="DIRECTORY" title={`Students · ${students.length}`} subtitle="Registered learners and contact details." /><div className="table-scroll"><table><thead><tr><th>Student</th><th>Student no.</th><th>Registered</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.fullName}</strong><small>{student.email}</small></td><td>{student.studentNumber}</td><td>{formatDate(student.createdAt)}</td></tr>)}{!students.length && <EmptyRow cols={3} />}</tbody></table></div></section></section>}

      {view === 'exams' && <section className="page-content"><div className="panel form-panel wide-form"><PanelTitle eyebrow="ASSESSMENT SETUP" title="Create examination" subtitle="Set the duration and availability window for learners." /><form className="form-grid" onSubmit={(event) => void saveForm(event, 'exam')}><Field label="Examination title"><input name="title" placeholder="e.g. Introduction to ICT" required /></Field><Field label="Duration (minutes)"><input name="duration_minutes" type="number" min="1" defaultValue="30" required /></Field><Field label="Description"><textarea name="description" rows={2} placeholder="Optional exam details" /></Field><Field label="Starts at"><input name="start_at" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required /></Field><Field label="Ends at"><input name="end_at" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required /></Field><div className="form-submit"><button className="button button-dark" disabled={busy}><Plus size={16} />Create examination</button></div></form></div>
        <section className="panel"><PanelTitle eyebrow="ASSESSMENT SCHEDULE" title={`All examinations · ${exams.length}`} subtitle="Availability, duration and question counts." /><div className="table-scroll"><table><thead><tr><th>Examination</th><th>Questions</th><th>Duration</th><th>Availability</th><th>Status</th></tr></thead><tbody>{exams.map((exam) => <tr key={exam.id}><td><strong>{exam.title}</strong><small>{exam.description || 'No description'}</small></td><td>{exam.question_count}</td><td>{exam.durationMinutes} min</td><td>{formatDate(exam.startAt)}<small>to {formatDate(exam.endAt)}</small></td><td><span className={`pill ${openExams.some((item) => item.id === exam.id) ? 'pill-green' : 'pill-muted'}`}>{openExams.some((item) => item.id === exam.id) ? 'Open now' : Date.now() < new Date(exam.startAt).getTime() ? 'Scheduled' : 'Closed'}</span></td></tr>)}{!exams.length && <EmptyRow cols={5} />}</tbody></table></div></section></section>}

      {view === 'questions' && <section className="page-content two-column"><section className="panel form-panel"><PanelTitle eyebrow="QUESTION AUTHORING" title="Add a question" subtitle="Create a multiple-choice item for an examination." /><form className="form-stack" onSubmit={(event) => void saveForm(event, 'question')}><Field label="Examination"><select name="exam_id" required defaultValue=""><option value="" disabled>Select examination</option>{exams.map((exam) => <option value={exam.id} key={exam.id}>{exam.title}</option>)}</select></Field><Field label="Question text"><textarea name="question_text" rows={3} required /></Field><div className="field-grid">{(['a', 'b', 'c', 'd'] as const).map((letter) => <Field label={`Option ${letter.toUpperCase()}`} key={letter}><input name={`option_${letter}`} required maxLength={500} /></Field>)}</div><div className="field-grid"><Field label="Correct answer"><select name="correct_option"><option>A</option><option>B</option><option>C</option><option>D</option></select></Field><Field label="Marks"><input name="marks" type="number" min="1" defaultValue="1" /></Field></div><button className="button button-dark" disabled={busy || exams.length === 0}><Plus size={16} />Save question</button></form></section>
        <section className="panel"><PanelTitle eyebrow="QUESTION LIBRARY" title="Question bank" subtitle="Choose an exam to review its questions." /><Field label="Filter examination"><select value={questionExam} onChange={(event) => void loadQuestions(event.target.value)}><option value="">Select examination</option>{exams.map((exam) => <option value={exam.id} key={exam.id}>{exam.title}</option>)}</select></Field><div className="question-list">{questionList.map((question, index) => <article className="question-item" key={question.id}><div className="question-heading"><span>{String(index + 1).padStart(2, '0')}</span><strong>{question.questionText}</strong><small>{question.marks} marks</small></div><div className="choice-list">{(['A', 'B', 'C', 'D'] as const).map((letter) => <span key={letter}><b>{letter}</b>{question[`option${letter}`]}</span>)}</div></article>)}{!questionList.length && <Empty text={questionExam ? 'No questions added to this exam yet.' : 'Choose an exam to see its questions.'} />}</div></section></section>}

      {view === 'take' && <section className="page-content take-layout"><section className="panel form-panel"><PanelTitle eyebrow="STUDENT WORKSPACE" title="Take an examination" subtitle="Choose a student profile and an examination currently open." /><form className="form-stack" onSubmit={(event) => void beginExam(event)}><Field label="Student"><select required value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.studentNumber}</option>)}</select></Field><Field label="Open examination"><select required value={selectedExam} onChange={(event) => { setSelectedExam(event.target.value); setPaper([]); }}><option value="">Select examination</option>{openExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title} · {exam.durationMinutes} min</option>)}</select></Field><button className="button button-dark" disabled={busy || !selectedStudent || !selectedExam}><BookOpenCheck size={16} />Load examination</button>{!openExams.length && <p className="help-text">There are no examinations open right now.</p>}</form></section>
        {paper.length > 0 && <section className="panel paper-panel"><PanelTitle eyebrow="EXAMINATION IN PROGRESS" title={exams.find((exam) => String(exam.id) === selectedExam)?.title || 'Examination'} subtitle={`${paper.length} questions · ${exams.find((exam) => String(exam.id) === selectedExam)?.durationMinutes} minutes`} />{paper.map((question, index) => <fieldset className="paper-question" key={question.id}><legend><span>{String(index + 1).padStart(2, '0')}</span>{question.questionText}<small>{question.marks} marks</small></legend>{(['A', 'B', 'C', 'D'] as const).map((letter) => <label className={`answer-option ${answers[question.id] === letter ? 'chosen' : ''}`} key={letter}><input type="radio" name={`q-${question.id}`} checked={answers[question.id] === letter} onChange={() => setAnswers({ ...answers, [question.id]: letter })} /><b>{letter}</b>{question[`option${letter}`]}</label>)}</fieldset>)}<button className="button button-dark" onClick={() => void submitExam()} disabled={busy}><Check size={16} />Submit examination</button></section>}</section>}

      {view === 'results' && <section className="page-content"><div className="panel"><PanelTitle eyebrow="PERFORMANCE RECORD" title="Examination results" subtitle={`${results.length} submissions · Scores calculated by the server.`} /><ResultTable rows={results} /></div></section>}
      <footer className="footer">ExamPoint <span>·</span> Examination management workspace</footer>
    </main>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function PanelTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <div className="panel-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><ClipboardList size={18} /><p>{text}</p></div>; }
function EmptyRow({ cols }: { cols: number }) { return <tr><td className="empty-cell" colSpan={cols}>No records found.</td></tr>; }
function ResultTable({ rows, compact = false }: { rows: Result[]; compact?: boolean }) { return <div className="table-scroll"><table><thead><tr><th>Student</th>{!compact && <th>Student no.</th>}<th>Examination</th><th>Score</th><th>Submitted</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.full_name}</strong>{compact && <small>{row.student_number}</small>}</td>{!compact && <td>{row.student_number}</td>}<td>{row.exam_title}</td><td><span className="score"><Check size={13} />{row.score} <small>/ {row.total_marks}</small></span></td><td>{formatDate(row.submitted_at)}</td></tr>)}{!rows.length && <EmptyRow cols={compact ? 4 : 5} />}</tbody></table></div>; }
