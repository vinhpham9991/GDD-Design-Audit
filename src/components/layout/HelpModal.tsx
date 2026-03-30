import { Modal } from "@/components/shared/Modal";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function HelpModal() {
  const { language } = useI18n();
  const helpOpen = useAppStore((state) => state.helpOpen);
  const closeHelp = useAppStore((state) => state.closeHelp);
  const guide = getHelpContent(language).guide;

  return (
    <Modal open={helpOpen} title={guide.title} description={guide.intro} onClose={closeHelp}>
      <div className="space-y-3 text-sm text-slate-700">
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-2 font-medium">{guide.coreLogic}</p>
        <ol className="space-y-2">
          {guide.steps.map((step) => (
            <li key={step.title} className="rounded-lg border border-slate-200 p-2">
              <p className="font-medium text-slate-900">{step.title}</p>
              <p className="mt-1">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
