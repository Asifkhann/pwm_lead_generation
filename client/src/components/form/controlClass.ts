/** Shared input styling, kept out of the component file so fast refresh works. */
export const controlClass = (hasError?: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
    hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
  }`
