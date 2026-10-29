import sectionProps from "@/lib/sectionProps";
import { ButtonLink } from "@/ui/components/button/button-link";
import RichText from "@/ui/RichText";

import { ImpactCalculatorClient } from "./client-lazy";
import { ImpactCalculatorProps } from "./types";

const ImpactCalculator = ({
  pretitle,
  content,
  inputsTitle,
  teamSizeLabel,
  dealSizeLabel,
  cycleLengthLabel,
  resultsTitle,
  cycleReductionLabel,
  pipelineLabel,
  paybackLabel,
  cta,
  note,
  ...props
}: ImpactCalculatorProps) => (
  <section className="py-12 md:py-24" {...sectionProps(props)}>
    <div className="section flex flex-col items-center gap-8 md:gap-12">
      {(pretitle || content) && (
        <div className="richtext flex max-w-xl flex-col items-center gap-4 text-center text-balance">
          {pretitle && <p className="pretitle">{pretitle}</p>}
          {content && <RichText value={content} />}
        </div>
      )}

      <ImpactCalculatorClient
        inputsTitle={inputsTitle}
        teamSizeLabel={teamSizeLabel}
        dealSizeLabel={dealSizeLabel}
        cycleLengthLabel={cycleLengthLabel}
        resultsTitle={resultsTitle}
        cycleReductionLabel={cycleReductionLabel}
        pipelineLabel={pipelineLabel}
        paybackLabel={paybackLabel}
        ctaSlot={
          cta?.link ? (
            <ButtonLink
              className="block w-full"
              buttonClassName="w-full"
              {...cta}
              variant={cta.variant || undefined}
              link={cta.link}
            >
              {typeof cta.link === "string" ? cta.link : cta.link.label}
            </ButtonLink>
          ) : null
        }
        note={note}
      />
    </div>
  </section>
);

export default ImpactCalculator;
