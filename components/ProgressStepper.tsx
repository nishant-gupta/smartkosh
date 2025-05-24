import { getIcon } from "@/utils/icons";

export default function ProgressStepper({ step, steps, className }: { step: number, steps: number[], className?: string }) {
  return (
    <div className={`flex items-center justify-center mb-6 ${className}`}>
          {steps.map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={
                  "flex items-center justify-center w-8 h-8 rounded " +
                  (step > s
                    ? "bg-gray-900 text-white"
                    : step === s
                    ? "border-2 border-gray-900 text-gray-900 font-bold"
                    : "bg-gray-400 text-white")
                }
              >
                {step > s ? (
                  getIcon('check', { className: 'h-5 w-5 invert' })
                ) : (
                  s
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-10 h-0.5 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
  )
}