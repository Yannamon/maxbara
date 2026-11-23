import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "../admin/auth";
import { adminPath } from "../admin/model";
import { adminCopy } from "../admin/copy";
import { readQuiz, type Locale, type Query } from "../site/answers";
import { copy, money, otherLocale, paths } from "../site/copy";
import { SiteFrame } from "../site/frame";
import { Receipt } from "../site/receipt";
import { addFile, resetPhone, saveCase, savePayment, sendCase, sendOtp, signOut, toggleManualPayment, verifyOtp } from "./actions";
import { intakeCopy } from "./copy";
import { checklist, checklistSource, intakeFlags } from "./documents";
import { casePath, intakePaths } from "./paths";
import { ivorianPhone } from "./phone";
import { intakeDatabaseConfigured, listCases, paymentMethods, readCase, readDocuments } from "./store";
import { authConfig, currentUser, pendingPhoneCookie } from "./supabase";
import { UploadPicker } from "./upload-picker";

type RecordDetails = NonNullable<Awaited<ReturnType<typeof readCase>>>;

function Feedback({ locale, code }: { locale: Locale; code: Query[string] }) {
  const messages = intakeCopy[locale].messages;
  if (typeof code !== "string" || !Object.hasOwn(messages, code)) return null;
  const positive = ["otp_sent", "uploaded", "submitted", "payment_saved", "payment_updated"].includes(code);
  return <p id="feedback" tabIndex={-1} className={`intake-feedback${positive ? " feedback-success" : ""}`} role={positive ? "status" : "alert"}>
    {messages[code as keyof typeof messages]}
  </p>;
}

export async function IntakeStart({ locale, query }: { locale: Locale; query: Promise<Query> }) {
  const params = await query;
  const quiz = readQuiz(params);
  const t = intakeCopy[locale];
  const ready = Boolean(authConfig()) && intakeDatabaseConfigured();
  const user = ready && quiz.state !== "review" ? await currentUser() : null;
  if (user && quiz.state !== "quoted") redirect(intakePaths[locale].list);
  const phone = ready && !user ? ivorianPhone((await cookies()).get(pendingPhoneCookie)?.value) : null;
  const back = quiz.suffix ? `${paths[locale].quote}${quiz.suffix}#resultat` : `${paths[locale].home}#devis`;

  return (
    <SiteFrame locale={locale} section="start" suffix={quiz.suffix}>
      <main className="shell handoff intake-start">
        <section className="intake-card">
          {quiz.state === "quoted" && <p className="eyebrow">{quiz.reference}</p>}
          <h1>{t.start}</h1>
          <Feedback locale={locale} code={params.message} />
          {quiz.state === "review" ? (
            <p>{t.review}</p>
          ) : !ready ? (
            <p>{t.unavailable}</p>
          ) : user && quiz.state === "quoted" ? (
            <>
              <div className="intake-project">
                <div>
                  <h2>{t.project}</h2>
                  <p>{quiz.answers.form} · {copy[locale].quiz.sectors[quiz.answers.sector]} · {copy[locale].packages[quiz.answers.package]}</p>
                </div>
                <strong>{quiz.quote.kind === "starting_at" && `${copy[locale].receipt.from} `}{money(quiz.quote.totalFcfa, locale)} FCFA</strong>
              </div>
              <form className="intake-form" action={saveCase.bind(null, locale, quiz.suffix, randomUUID())}>
                <p>{t.projectHint}</p>
                <label className="form-field"><span>{t.name}</span>
                  <input name="name" autoComplete="name" required maxLength={120} />
                </label>
                <label className="form-field"><span>{t.company}</span>
                  <input name="company" autoComplete="organization" required maxLength={120} />
                </label>
                <fieldset className="intake-flags">
                  <legend>{t.conditions}</legend>
                  {intakeFlags.map((flag) => (
                    <label key={flag}><input type="checkbox" name={flag} /><span>{t.flags[flag]}</span></label>
                  ))}
                </fieldset>
                <button className="button" type="submit">{t.create}</button>
              </form>
            </>
          ) : phone ? (
            <>
              <p>{t.sentTo} •••• {phone.slice(-4)}.</p>
              <form className="intake-form" action={verifyOtp.bind(null, locale, quiz.suffix)}>
                <label className="form-field"><span>{t.otp}</span>
                  <input name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
                </label>
                <button className="button" type="submit">{t.verify}</button>
              </form>
              <div className="intake-link-row">
                <form action={sendOtp.bind(null, locale, quiz.suffix)}><button className="text-action">{t.resend}</button></form>
                <form action={resetPhone.bind(null, locale, quiz.suffix)}><button className="text-action">{t.change}</button></form>
              </div>
            </>
          ) : (
            <>
              <p>{t.loginHint}</p>
              <form className="intake-form" action={sendOtp.bind(null, locale, quiz.suffix)}>
                <label className="form-field"><span>{t.phone}</span>
                  <input name="phone" type="tel" autoComplete="tel" placeholder="+225" maxLength={25} required />
                </label>
                <button className="button" type="submit">{t.send}</button>
              </form>
            </>
          )}
          <a className="text-action" href={back}>{quiz.suffix ? t.backToQuote : t.newQuote}</a>
        </section>
      </main>
    </SiteFrame>
  );
}

export async function Applications({ locale }: { locale: Locale }) {
  const user = await currentUser();
  if (!user || !intakeDatabaseConfigured()) redirect(intakePaths[locale].start);
  const t = intakeCopy[locale];
  const [records, canAdminister] = await Promise.all([listCases(user), isAdmin(user.id)]);
  const home = `${paths[locale].home}#devis`;

  return (
    <SiteFrame locale={locale} alternateHref={intakePaths[otherLocale(locale)].list}>
      <main className="shell intake-main">
        <header className="portal-heading"><h1>{t.account}</h1><SignOut locale={locale} /></header>
        <div className="cases-list">
          {records.length ? records.map((record) => (
            <a className="intake-card case-link" key={record.reference} href={casePath(locale, record.reference)}>
              <div><p className="eyebrow">{record.reference}</p><h2>{record.company_name}</h2></div>
              <span className="case-status">{t.status[record.status]}</span>
            </a>
          )) : <p>{t.empty}</p>}
        </div>
        <div className="header-actions">
          <a className="button" href={home}>{t.newQuote}</a>
          {canAdminister && <a className="button button-outline" href={adminPath(locale)}>{adminCopy[locale].title}</a>}
        </div>
      </main>
    </SiteFrame>
  );
}

function SignOut({ locale }: { locale: Locale }) {
  return <form action={signOut.bind(null, locale)}>
    <button type="submit" className="text-action">{intakeCopy[locale].signOut}</button>
  </form>;
}

function Payment({ locale, record }: { locale: Locale; record: RecordDetails }) {
  const t = intakeCopy[locale];
  const isPaid = record.payment_status === "paid";
  return (
    <section className="intake-card" id="paiement">
      <h2>{record.is_owner ? t.payments : t.staff}</h2>
      {record.payment_method && (
        <p className="payment-state">{t.methods[record.payment_method]} · {isPaid ? t.paymentPaid : t.paymentPending}</p>
      )}
      {record.kind === "starting_at" && <p>{t.startingNote}</p>}
      {record.is_owner && record.kind === "estimate" && !isPaid && record.status !== "delivered" && (
        <>
          <form className="intake-form" action={savePayment.bind(null, locale, record.reference)}>
            <label className="form-field select-field"><span>{t.methodLabel}</span>
              <select name="method" defaultValue={record.payment_method ?? "manual"}>
                {paymentMethods.map((method) => <option value={method} key={method}>{t.methods[method]}</option>)}
              </select>
            </label>
            <p>{t.manualNote}</p><p>{t.stubNote}</p>
            <button type="submit" className="button button-outline">{t.saveMethod}</button>
          </form>
        </>
      )}
      {record.is_admin && record.payment_method === "manual" && (
        <form className="intake-form" action={toggleManualPayment.bind(null, locale, record.reference, !isPaid)}>
          <button type="submit" className="button">{isPaid ? t.reopen : t.markPaid}</button>
        </form>
      )}
      {!record.is_owner && record.payment_method !== "manual" && <p>{t.messages.unavailable}</p>}
    </section>
  );
}

export async function Application({
  locale, reference, query,
}: { locale: Locale; reference: string; query: Promise<Query> }) {
  if (!/^MB-[A-Z0-9-]{1,30}$/.test(reference)) notFound();
  const user = await currentUser();
  if (!user || !intakeDatabaseConfigured()) redirect(intakePaths[locale].start);
  const [record, params] = await Promise.all([readCase(user, reference), query]);
  if (!record) notFound();
  const t = intakeCopy[locale];
  const site = copy[locale];
  const uploads = record.is_owner && record.intake ? await readDocuments(record.id) : [];
  const date = record.expected_date
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-GB", { dateStyle: "long", timeZone: "UTC" })
      .format(new Date(`${record.expected_date}T00:00:00Z`))
    : t.unknownDate;

  return (
    <SiteFrame locale={locale} alternateHref={casePath(otherLocale(locale), reference)}>
      <main className="shell intake-main">
        <header className="portal-heading">
          <div><a className="text-action" href={intakePaths[locale].list}>{t.account}</a><h1>{record.company_name}</h1></div>
          <SignOut locale={locale} />
        </header>
        <Feedback locale={locale} code={params.message} />
        <section className="intake-card case-summary" id="suivi">
          <div className="case-heading"><p className="eyebrow">{reference}</p><span className="case-status">{t.status[record.status]}</span></div>
          <dl>
            <div><dt>{t.next}</dt><dd>{record.next_step || { draft: t.nextDraft, submitted: t.nextSubmitted, delivered: t.nextDelivered }[record.status]}</dd></div>
            <div><dt>{t.date}</dt><dd>{date}</dd></div>
          </dl>
        </section>
        <div className={`intake-case-grid${record.is_owner && record.intake ? "" : " intake-case-single"}`}>
          <div className="intake-case-files">
            {record.is_owner && record.intake && (
              <section className="intake-card" id="pieces">
                <h2>{t.docs}</h2>
                <p>{t.docsHint}</p>
                <a className="text-action" href={checklistSource} rel="noreferrer">{t.docsSource}</a>
                <ul className="documents-list">
                  {checklist(record.intake).map((item) => {
                    const notarized = record.intake?.answers.statutes === "notarized";
                    const label = notarized && (item.id === "statutes" || item.id === "subscription")
                      ? `${item.id}Notary` : item.id;
                    const files = uploads.filter((file) => file.document_type === item.id);
                    return (
                      <li id={`doc-${item.id}`} key={item.id}>
                        <div className="document-title">
                          <h3>{t.document[label as keyof typeof t.document]}</h3>
                          <span>{files.length ? t.received : item.required ? t.required : t.optional}</span>
                        </div>
                        {!!files.length && <ul className="document-names">{files.map((file, index) =>
                          <li key={`${index}-${file.original_filename}`}>{file.original_filename}</li>)}</ul>}
                        {record.status === "draft" && (
                          <UploadPicker key={files.length} action={addFile.bind(null, locale, reference, item.id)}
                            labels={{ file: t.file, camera: t.camera, upload: t.upload, uploading: t.uploading, size: t.messages.file_size }} />
                        )}
                      </li>
                    );
                  })}
                </ul>
                {record.status === "draft" && <form action={sendCase.bind(null, locale, reference)}>
                  <button type="submit" className="button">{t.sendCase}</button>
                </form>}
              </section>
            )}
          </div>
          <aside className="intake-case-aside">
            {record.lines && record.total_fcfa && record.package && (
              <section className="case-receipt">
                <h2>{t.quote}</h2>
                <Receipt locale={locale} reference={reference} name={`${record.legal_form} · ${site.packages[record.package]}`}
                  capital={Number(record.capital_fcfa)} total={Number(record.total_fcfa)} startingAt={record.kind === "starting_at"}
                  rows={record.lines.map((line) => ({ label: site.lines[line.code] ?? line.label, amountFcfa: line.amountFcfa }))} />
                {record.is_owner && <p>{site.receipt.notice}</p>}
              </section>
            )}
            {record.quote_id && <Payment locale={locale} record={record} />}
          </aside>
        </div>
      </main>
    </SiteFrame>
  );
}
