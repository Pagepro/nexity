import { Check } from "lucide-react";

import sectionProps from "@/lib/sectionProps";
import RichText from "@/ui/RichText";

import { ContactFormClient } from "./client-lazy";
import { ContactFormProps } from "./types";

const ContactForm = ({
  pretitle,
  content,
  bullets,
  nameField,
  emailField,
  companyField,
  teamSizeField,
  messageField,
  submitLabel,
  successMessage,
  ...props
}: ContactFormProps) => (
  <section className="bg-section-surface py-12 md:py-24" {...sectionProps(props)}>
    <div className="section grid gap-10 md:grid-cols-2 md:gap-16">
      <div className="flex flex-col gap-6">
        {(pretitle || content) && (
          <div className="richtext text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && <RichText value={content} />}
          </div>
        )}
        {bullets?.length ? (
          <ul className="flex flex-col gap-3 text-14 md:text-16">
            {bullets.map((bullet, index) => (
              <li
                key={`${index}-${bullet}`}
                className="flex items-center gap-3 text-foreground"
              >
                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="card-frame overflow-hidden rounded-lg border-4 border-background bg-background p-6 shadow-card md:p-8">
        <ContactFormClient
          nameField={nameField}
          emailField={emailField}
          companyField={companyField}
          teamSizeField={teamSizeField}
          messageField={messageField}
          submitLabel={submitLabel}
          successMessage={successMessage}
        />
      </div>
    </div>
  </section>
);

export default ContactForm;
